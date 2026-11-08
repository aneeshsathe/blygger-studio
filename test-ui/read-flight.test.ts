import { expect, test, vi } from 'vitest';
import { createReadFlight } from '../src/ui/read-flight.ts';

test('a post-write check cannot reuse a pre-write flight, and an old completion cannot clear a new flight', async () => {
  const releases: ((value: number) => void)[] = [];
  const flight = createReadFlight(() => new Promise<number>(resolve => releases.push(resolve)));
  const signal = () => new AbortController().signal;
  const before = [flight.read(signal()), flight.read(signal())];
  expect(releases).toHaveLength(1);
  flight.invalidate();
  const after = flight.read(signal());
  expect(releases).toHaveLength(2);
  releases[0](1);
  expect(await Promise.all(before)).toEqual([1, 1]);
  await new Promise(resolve => setTimeout(resolve, 0));
  const peer = flight.read(signal());
  expect(releases).toHaveLength(2);
  releases[1](2);
  expect(await Promise.all([after, peer])).toEqual([2, 2]);
  await new Promise(resolve => setTimeout(resolve, 0));
  const next = flight.read(signal());
  expect(releases).toHaveLength(3);
  releases[2](3);
  expect(await next).toBe(3);
});

test('only aborts a revision fetch once its last consumer cancels', async () => {
  let signal: AbortSignal | undefined;
  const load = vi.fn((value: AbortSignal) => { signal = value; return new Promise<number>((_, reject) => value.addEventListener('abort', () => reject(value.reason), { once: true })); });
  const flight = createReadFlight(load), one = new AbortController(), two = new AbortController();
  const first = flight.read(one.signal), second = flight.read(two.signal);
  one.abort();
  await expect(first).rejects.toMatchObject({ name: 'AbortError' });
  expect(signal!.aborted).toBe(false);
  two.abort();
  await expect(second).rejects.toMatchObject({ name: 'AbortError' });
  expect(signal!.aborted).toBe(true);
  const three = new AbortController(), next = flight.read(three.signal);
  expect(load).toHaveBeenCalledTimes(2);
  three.abort();
  await expect(next).rejects.toMatchObject({ name: 'AbortError' });
});
