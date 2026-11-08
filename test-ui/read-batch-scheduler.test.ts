import { expect, test, vi } from 'vitest';

const clock = vi.hoisted(() => ({ timers: [] as (() => void)[] }));
vi.mock('dataloader', async () => {
  const { readFileSync } = await import('node:fs');
  const { createRequire } = await import('node:module');
  const { runInNewContext } = await import('node:vm');
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  // Run the installed library with browser globals: no process.nextTick or
  // setImmediate. Hold timers to model a paused clock or throttled background tab.
  runInNewContext(readFileSync(require.resolve('dataloader'), 'utf8'), {
    module, Promise, setTimeout: (callback: () => void) => clock.timers.push(callback),
  });
  return { default: module.exports };
});

import { createReadBatchFetch } from '../src/ui/read-batch.ts';

test('dispatches browser batches without timers and still groups synchronous peers', async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = await new Request(input, init).json() as { requests: { path: { id: string } }[] };
    return Response.json(body.requests.map(child => ({ status: 200, body: { id: child.path.id }, headers: {} })));
  });
  const fetch = createReadBatchFetch('https://test/api', fetcher);
  const pending = [fetch('https://test/api/items/one'), fetch('https://test/api/items/two')];
  try {
    for (let turn = 0; turn < 20; turn++) await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(clock.timers).toHaveLength(0);
  } finally {
    // Also settle the old implementation's promises when the RED assertion fails.
    for (const callback of clock.timers.splice(0)) callback();
    const results = await Promise.all(pending);
    expect(await Promise.all(results.map(response => response.json()))).toEqual([{ id: 'one' }, { id: 'two' }]);
  }
});
