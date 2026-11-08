import { expect, test, vi } from 'vitest';
import { createReadBatchFetch } from '../src/ui/read-batch.ts';
import type { ReadBatchInput } from '../src/read-batch-policy.ts';

test('uses the current global fetch when no fetcher is supplied', async () => {
  const original = vi.fn();
  vi.stubGlobal('fetch', original);
  try {
    const fetch = createReadBatchFetch('https://test/api');
    const current = vi.fn(async () => Response.json([{ status: 200, body: { id: 'one' }, headers: {} }]));
    vi.stubGlobal('fetch', current);
    expect(await (await fetch('https://test/api/items/one')).json()).toEqual({ id: 'one' });
    expect(original).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
  }
});

test('groups reads by operation and retains child order, queries, status and retry hints', async () => {
  const sent: { operation: string; requests: ReadBatchInput[] }[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    expect(request.url).toBe('https://test/notes/b/api/read-batch');
    const body = await request.json() as typeof sent[number];
    sent.push(body);
    return Response.json(body.requests.map(value => ({ status: value.path?.id === 'missing' ? 404 : 200,
      body: value, headers: { 'Retry-After': '60' } })));
  });
  const fetch = createReadBatchFetch('https://test/notes/b/api', fetcher);
  const results = await Promise.all([
    fetch('https://test/notes/b/api/items/one'), fetch('https://test/notes/b/api/items/missing'),
    fetch('https://test/notes/b/api/mentions?targetItemId=one&limit=11'),
    fetch('https://test/notes/b/api/mentions?targetItemId=two&limit=11'),
  ]);
  expect(sent).toEqual([
    { operation: 'getItem', requests: [{ path: { id: 'one' }, query: {} }, { path: { id: 'missing' }, query: {} }] },
    { operation: 'listMentions', requests: [{ path: {}, query: { targetItemId: 'one', limit: '11' } }, { path: {}, query: { targetItemId: 'two', limit: '11' } }] },
  ]);
  expect(results.map(response => response.status)).toEqual([200, 404, 200, 200]);
  expect(results[1].headers.get('retry-after')).toBe('60');
  expect(await results[1].json()).toEqual({ path: { id: 'missing' }, query: {} });
});

test('does not cache across reads or batch writes, conditional requests, reserved routes, or foreign URLs', async () => {
  let version = 1;
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    return request.url.endsWith('/read-batch') ? Response.json([{ status: 200, body: { version }, headers: {} }])
      : Response.json({ method: request.method, url: request.url });
  });
  const fetch = createReadBatchFetch('https://test/api', fetcher);
  expect(await (await fetch('https://test/api/items/one')).json()).toEqual({ version: 1 });
  version = 2;
  expect(await (await fetch('https://test/api/items/one')).json()).toEqual({ version: 2 });
  for (const url of ['https://test/api/items/summary', 'https://test/api/settings', 'https://other.test/api/items/one', 'https://test/api/mentions?id=one&id=two'])
    expect(await (await fetch(url)).json()).toEqual({ method: 'GET', url });
  expect(await (await fetch('https://test/api/items/one', { method: 'PATCH' })).json()).toMatchObject({ method: 'PATCH' });
  expect(await (await fetch('https://test/api/items/one', { headers: { 'If-None-Match': 'fixture' } })).json()).toMatchObject({ method: 'GET' });
});

test('never combines different credential contexts and bounds each batch at 50 reads', async () => {
  const requests: Request[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init); requests.push(request);
    const body = await request.clone().json() as { requests: ReadBatchInput[] };
    return Response.json(body.requests.map(() => ({ status: 200, body: {}, headers: {} })));
  });
  const fetch = createReadBatchFetch('https://test/api', fetcher);
  await Promise.all([
    fetch('https://test/api/items/one', { headers: { Authorization: 'Bearer fixture-one' } }),
    fetch('https://test/api/items/two', { headers: { Authorization: 'Bearer fixture-two' } }),
  ]);
  expect(requests.map(request => request.headers.get('authorization')).sort()).toEqual(['Bearer fixture-one', 'Bearer fixture-two']);
  requests.length = 0;
  await Promise.all(Array.from({ length: 51 }, (_, index) => fetch(`https://test/api/items/item-${index}`)));
  const sizes = await Promise.all(requests.map(async request => ((await request.json()) as { requests: unknown[] }).requests.length));
  expect(sizes.sort((a, b) => a - b)).toEqual([1, 50]);
});

test('cancels one consumer promptly without aborting its peer, and aborts the fetch when all cancel', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const shared: AbortSignal[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init); shared.push(request.signal);
    await Promise.race([gate, new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }))]);
    const body = await request.json() as { requests: unknown[] };
    return Response.json(body.requests.map((_, index) => ({ status: 200, body: index, headers: {} })));
  });
  const fetch = createReadBatchFetch('https://test/api', fetcher);
  const one = new AbortController(), two = new AbortController();
  const first = fetch('https://test/api/items/one', { signal: one.signal });
  const second = fetch('https://test/api/items/two', { signal: two.signal });
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  one.abort();
  await expect(first).rejects.toMatchObject({ name: 'AbortError' });
  expect(shared[0].aborted).toBe(false);
  release();
  expect(await (await second).json()).toBe(1);

  const never = vi.fn((input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_, reject) => {
    const request = new Request(input, init); shared.push(request.signal);
    request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true });
  }));
  const cancelledFetch = createReadBatchFetch('https://test/api', never);
  const three = new AbortController(), four = new AbortController();
  const pending = [cancelledFetch('https://test/api/items/three', { signal: three.signal }), cancelledFetch('https://test/api/items/four', { signal: four.signal })];
  await vi.waitFor(() => expect(never).toHaveBeenCalledTimes(1));
  three.abort(); four.abort();
  expect((await Promise.allSettled(pending)).every(result => result.status === 'rejected')).toBe(true);
  expect(shared[1].aborted).toBe(true);
});

test('rejects a malformed or incomplete batch response', async () => {
  const fetch = createReadBatchFetch('https://test/api', async () => Response.json([]));
  await expect(fetch('https://test/api/items/one')).rejects.toThrow('length mismatch');
});
