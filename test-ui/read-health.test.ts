import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { BasicIndex, compileSingleRowExpression, createCollection, createLiveQueryCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/query-core';
import { parseLoadSubsetOptions, queryCollectionOptions } from '@tanstack/query-db-collection';

vi.mock('../src/ui/data.ts', () => ({ settings: undefined, items: undefined, updates: undefined, queryClient: undefined }));
vi.mock('../src/ui/sheets.tsx', () => ({ Sheet: () => null }));
vi.mock('../src/ui/setup.tsx', () => ({ SetupBanner: () => null }));
vi.mock('../src/ui/theme.ts', () => ({ applyTheme: () => {} }));
let health: typeof import('../src/ui/components.tsx');
beforeAll(async () => {
  vi.stubGlobal('document', { getElementById: () => ({ dataset: {} }) });
  health = await import('../src/ui/components.tsx');
});
afterAll(() => vi.unstubAllGlobals());

test('an active read failure clears after recovery and stops reporting after unsubscribe', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let failing = false;
  const failure = new Error('temporarily unavailable');
  const source = createCollection(queryCollectionOptions({
    queryClient: client, queryKey: ['read-health'], getKey: (row: { id: string }) => row.id,
    queryFn: async () => { if (failing) throw failure; return [{ id: 'a' }]; },
  }));
  const subscription = source.subscribeChanges(() => {});
  const observed: unknown[] = [];
  const stop = health.subscribeReadHealth([source], () => observed.push(health.currentReadProblem([source])?.cause));
  try {
    await source.preload();
    expect(health.currentReadProblem([source])).toBeUndefined();
    failing = true;
    await expect(source.utils.refetch({ throwOnError: true })).rejects.toBe(failure);
    expect(health.currentReadProblem([source])?.cause).toBe(failure);
    failing = false;
    await source.utils.refetch({ throwOnError: true });
    expect(health.currentReadProblem([source])).toBeUndefined();
    expect(observed).toContain(failure);
    expect(observed.at(-1)).toBeUndefined();
    failing = true;
    await expect(source.utils.refetch({ throwOnError: true })).rejects.toBe(failure);
    subscription.unsubscribe();
    expect(health.currentReadProblem([source])).toBeUndefined();
    expect(observed.at(-1)).toBeUndefined();
  } finally {
    stop(); subscription.unsubscribe(); await source.cleanup(); client.clear();
  }
});

test('first-load failures are visible to an active reader', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const failure = new Error('first read unavailable');
  let failing = true;
  const source = createCollection(queryCollectionOptions({
    queryClient: client, queryKey: ['first-read-health'], getKey: (row: { id: string }) => row.id,
    queryFn: async (): Promise<{ id: string }[]> => { if (failing) throw failure; return [{ id: 'a' }]; },
  }));
  const subscription = source.subscribeChanges(() => {});
  try {
    await expect(source.preload()).rejects.toBe(failure);
    expect(source.status).toBe('error');
    expect(health.currentReadProblem([source])?.cause).toBe(failure);
    failing = false;
    await health.retryReadProblems([source], client);
    expect(health.currentReadProblem([source])).toBeUndefined();
  } finally {
    subscription.unsubscribe(); await source.cleanup(); client.clear();
  }
});

test('retry restarts a ready query whose continuation failed, keeping its requested window bounded', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const failure = new Error('next page unavailable');
  let failing = false;
  const rows = Array.from({ length: 10 }, (_, rank) => ({ id: String(rank), rank }));
  const unbounded: unknown[] = [];
  const source = createCollection(queryCollectionOptions({
    queryClient: client, queryKey: ['window-read-health'], syncMode: 'on-demand',
    autoIndex: 'eager', defaultIndexType: BasicIndex,
    getKey: (row: typeof rows[number]) => row.id,
    queryFn: async context => {
      const options = context.meta?.loadSubsetOptions;
      const { limit } = parseLoadSubsetOptions(options);
      if (limit === undefined && options?.where === undefined) unbounded.push(options);
      if (failing) throw failure;
      const matches = options?.where ? compileSingleRowExpression(options.where) : () => true;
      const offset = options?.offset ?? 0;
      return rows.filter(row => matches(row)).slice(offset, limit === undefined ? undefined : offset + limit);
    },
  }));
  const view = createLiveQueryCollection(q => q.from({ row: source }).orderBy(({ row }) => row.rank, 'asc').limit(2));
  const subscription = view.subscribeChanges(() => {});
  try {
    await view.preload();
    expect(view.toArray.map(row => row.rank)).toEqual([0, 1]);
    failing = true;
    await expect(view.utils.setWindow({ offset: 0, limit: 4 })).rejects.toBe(failure);
    expect(view.status).toBe('ready');
    expect(view.health.error?.cause).toBe(failure);
    expect(view.toArray.map(row => row.rank)).toEqual([0, 1]);
    failing = false;
    await health.retryReadProblems([source, view], client);
    expect(health.currentReadProblem([source, view])).toBeUndefined();
    expect(view.toArray.map(row => row.rank)).toEqual([0, 1]);
    await view.utils.setWindow({ offset: 0, limit: 4 });
    expect(view.toArray.map(row => row.rank)).toEqual([0, 1, 2, 3]);
    expect(unbounded).toEqual([]);
  } finally {
    subscription.unsubscribe(); await view.cleanup(); await source.cleanup(); client.clear();
  }
});
