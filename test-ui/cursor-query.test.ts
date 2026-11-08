import { afterEach, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { BlyggerApiError } from '../sdk/dist/browser.js';
import { readCursorWindow, type ApiPage } from '../src/ui/cursor-query.ts';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
afterEach(() => queryClient.clear());
const key = ['items', 'pages', [], 'updated-desc', { epoch: 'e', revision: 1 }];
const signal = () => new AbortController().signal;
const response = (items: number[], nextCursor: string | null): ApiPage<number> => ({ items, page: { limit: 2, nextCursor } });

it('reuses a sequence across windows and continues through short pages', async () => {
  const calls: (string | undefined)[] = [];
  const read = async (cursor: string | undefined) => {
    calls.push(cursor);
    return cursor === undefined ? response([1], 'one') : cursor === 'one' ? response([2, 3], 'two') : response([4], null);
  };
  const options = { queryClient, queryKey: key, signal: signal(), read };
  expect(await readCursorWindow({ ...options, window: { limit: 1 } })).toEqual([1]);
  expect(await readCursorWindow({ ...options, window: { offset: 1, limit: 2 } })).toEqual([2, 3]);
  expect(await readCursorWindow({ ...options, window: { limit: 4 } })).toEqual([1, 2, 3, 4]);
  expect(calls).toEqual([undefined, 'one', 'two']);
});

it('restarts an expired acquisition from page one, without returning its old prefix', async () => {
  const calls: (string | undefined)[] = []; let generation = 1;
  const read = async (cursor: string | undefined) => {
    calls.push(cursor);
    if (cursor && generation === 1) { generation++; throw new BlyggerApiError(409, { code: 'cursor-expired', message: 'restart' }); }
    return cursor ? response([generation * 10 + 2], null) : response([generation * 10 + 1], 'next');
  };
  expect(await readCursorWindow({ queryClient, queryKey: key, signal: signal(), read, window: { limit: 2 } })).toEqual([21, 22]);
  expect(calls).toEqual([undefined, 'next', undefined, 'next']);
});

it('fails repeated expiry instead of retrying without bound', async () => {
  let firstPages = 0;
  const read = async (cursor: string | undefined) => {
    if (cursor) throw new BlyggerApiError(409, { code: 'cursor-expired' });
    firstPages++; return response([1], 'next');
  };
  await expect(readCursorWindow({ queryClient, queryKey: key, signal: signal(), read, window: { limit: 2 } })).rejects.toMatchObject({ statusCode: 409 });
  expect(firstPages).toBe(2);
});

it('keeps page and row keys separate, and cancel-then-invalidate refreshes the page sequence', async () => {
  queryClient.setQueryData(['items', 'rows'], ['row-envelope']);
  let calls = 0;
  const read = async () => response([++calls], null);
  const options = { queryClient, queryKey: key, signal: signal(), read, window: { limit: 1 } };
  expect(await readCursorWindow(options)).toEqual([1]);
  expect(queryClient.getQueryData(['items', 'rows'])).toEqual(['row-envelope']);
  await queryClient.cancelQueries({ queryKey: ['items'] });
  await queryClient.invalidateQueries({ queryKey: ['items'], refetchType: 'none' });
  expect(await readCursorWindow(options)).toEqual([2]);
  expect(await readCursorWindow({ ...options, queryKey: [...key.slice(0, -1), { epoch: 'e', revision: 2 }] })).toEqual([3]);
});

it('aborting one reader discards its answer while a shared reader completes', async () => {
  let entered!: () => void, release!: () => void; let calls = 0;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const read = async () => { calls++; entered(); await gate; return response([1, 2], null); };
  const controller = new AbortController();
  const options = { queryClient, queryKey: key, read, window: { limit: 2 } };
  const canceled = readCursorWindow({ ...options, signal: controller.signal });
  const observed = expect(canceled).rejects.toMatchObject({ name: 'AbortError' });
  await started;
  const shared = readCursorWindow({ ...options, signal: signal() });
  controller.abort(); await observed; release();
  expect(await shared).toEqual([1, 2]); expect(calls).toBe(1);
});

it('canceling the resource prefix aborts the native page transport', async () => {
  let entered!: () => void; let transport!: AbortSignal;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const pending = readCursorWindow<number>({ queryClient, queryKey: key, signal: signal(), window: { limit: 1 }, read: async (_cursor, signal) => {
    transport = signal; entered();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  const observed = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await started; await queryClient.cancelQueries({ queryKey: ['items'] }); await observed;
  expect(transport.aborted).toBe(true);
});

it('does not cache a damaged page as success before the row schema runs', async () => {
  let invalid = true, reads = 0;
  const options = { queryClient, queryKey: key, signal: signal(), window: { limit: 1 },
    read: async () => { reads++; return response([invalid ? NaN : 1], null); },
    validate: (page: ApiPage<number>) => { if (page.items.some(value => !Number.isFinite(value))) throw new Error('invalid row'); },
  };
  await expect(readCursorWindow(options)).rejects.toThrow('invalid row');
  invalid = false;
  expect(await readCursorWindow(options)).toEqual([1]);
  expect(reads).toBe(2);
});

it('shared readers restart one expired acquisition without canceling each other', async () => {
  let generation = 1, reads = 0;
  const read = async (cursor: string | undefined) => {
    reads++;
    if (cursor && generation === 1) { generation++; throw new BlyggerApiError(409, { code: 'cursor-expired' }); }
    return cursor ? response([generation * 10 + 2], null) : response([generation * 10 + 1], 'next');
  };
  const options = { queryClient, queryKey: key, read, window: { limit: 2 } };
  expect(await Promise.all([readCursorWindow({ ...options, signal: signal() }), readCursorWindow({ ...options, signal: signal() })])).toEqual([[21, 22], [21, 22]]);
  expect(reads).toBe(4);
});
