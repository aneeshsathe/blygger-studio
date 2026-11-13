import { expect, test } from 'vitest';
import { createErrorLog, describeEntry, diagnostics, exportLog, ERROR_LOG_KEY, ERROR_LOG_MAX } from '../src/ui/error-log.ts';

function setup(route = '/blyg/studio/edit/54pwr12zqvvaj37zqx0f8vdbhk') {
  const store = new Map<string, string>();
  const clock = { now: Date.parse('2026-11-13T18:00:00Z'), route };
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  const log = createErrorLog(storage, { get route() { return clock.route; }, now: () => clock.now });
  return { log, store, clock, storage };
}
class ApiError extends Error {
  constructor(readonly statusCode: number, readonly body: unknown) {
    super((body as { message: string }).message);
    this.name = 'BlyggerApiError';
  }
}

test('an error is kept with where it happened, and survives a reload', () => {
  const { log, storage, clock } = setup();
  const id = log.record(new Error("Collection must be in 'ready' state for manual sync operations. Sync not initialized yet."), 'banner');
  const [entry] = log.entries();
  expect(entry).toMatchObject({
    id, count: 1, source: 'banner', name: 'Error', route: '/blyg/studio/edit/54pwr12zqvvaj37zqx0f8vdbhk',
    itemId: '54pwr12zqvvaj37zqx0f8vdbhk', at: '2026-11-13T18:00:00.000Z',
  });
  expect(entry!.message).toContain('Sync not initialized');
  expect(entry!.build).toMatch(/^blygger-studio\/\d/);
  expect(entry!.stack).toContain('error-log.test');
  const reloaded = createErrorLog(storage, { route: clock.route, now: () => clock.now });
  expect(reloaded.entries()).toEqual(log.entries());
});

test('a banner that renders the same error again logs it once', () => {
  const { log } = setup();
  const error = new Error('boom');
  expect(log.record(error, 'banner')).toBe(log.record(error, 'banner'));
  expect(log.entries()).toHaveLength(1);
  expect(log.entries()[0]!.count).toBe(1);
});

test('the same failure again within a minute is counted, not listed twice; later it is a new entry', () => {
  const { log, clock } = setup();
  log.record(new Error('Could not load responses.'), 'banner');
  clock.now += 15_000;
  log.record(new Error('Could not load responses.'), 'banner');
  expect(log.entries()).toHaveLength(1);
  expect(log.entries()[0]).toMatchObject({ count: 2, at: '2026-11-13T18:00:15.000Z', firstAt: '2026-11-13T18:00:00.000Z' });
  clock.now += 61_000;
  log.record(new Error('Could not load responses.'), 'banner');
  expect(log.entries().map((entry) => entry.count)).toEqual([1, 2]);
});

test('messages to the author and cancelled requests are not failures', () => {
  const { log, store } = setup();
  expect(log.record('[[abc]] does not resolve', 'banner')).toBeUndefined();
  expect(log.record(undefined, 'banner')).toBeUndefined();
  const cancelled = new Error('CancelledError');
  cancelled.name = 'CancelledError';
  expect(log.record(cancelled, 'rejection')).toBeUndefined();
  expect(log.record(new Error('refetch failed', { cause: cancelled }), 'read')).toBeUndefined();
  expect(log.record(new DOMException('The operation was aborted', 'AbortError'), 'rejection')).toBeUndefined();
  expect(log.entries()).toEqual([]);
  expect(store.has(ERROR_LOG_KEY)).toBe(false);
});

test('an API error names its status, code and the request behind it, without the query string', () => {
  const { log, clock } = setup();
  log.noteRequest('GET', 'https://example.org/blyg/api/search?q=secret+words', 500);
  log.noteRequest('PATCH', 'https://example.org/blyg/api/items/54pwr12zqvvaj37zqx0f8vdbhk', 409);
  clock.now += 20;
  log.record(new ApiError(409, { message: 'item changed', code: 'revision-conflict' }), 'banner');
  expect(log.entries()[0]).toMatchObject({
    status: 409, code: 'revision-conflict', name: 'BlyggerApiError',
    operation: 'PATCH /blyg/api/items/54pwr12zqvvaj37zqx0f8vdbhk',
  });
  expect(JSON.stringify(log.entries())).not.toContain('secret');
});

test('a dropped fetch takes the latest failed request; an old one or an unrelated error takes none', () => {
  const { log, clock } = setup();
  log.noteRequest('POST', 'https://example.org/api/items');
  log.record(new TypeError('Load failed'), 'banner');
  expect(log.entries()[0]!.operation).toBe('POST /api/items');
  log.record(new Error('something else'), 'uncaught');
  expect(log.entries()[0]!.operation).toBeUndefined();
  clock.now += 6_000;
  log.record(new TypeError('Load failed again'), 'banner');
  expect(log.entries()[0]!.operation).toBeUndefined();
});

test('an error can carry the extension it came from, given at the time or beforehand', () => {
  const { log, clock } = setup();
  log.record(new Error('threw in a slot'), 'extension', { extension: 'word-count', slot: 'draftCounter' });
  clock.now += 1;
  const shown = new Error('shown by the extension');
  log.attribute(shown, { extension: 'inspect', slot: 'page' });
  log.record(shown, 'banner');
  expect(log.entries().map((entry) => [entry.source, entry.extension, entry.slot])).toEqual([
    ['banner', 'inspect', 'page'],
    ['extension', 'word-count', 'draftCounter'],
  ]);
  expect(describeEntry(log.entries()[1]!)).toContain('from extension · extension word-count (draftCounter) · at ');
});

test('nothing is logged while the page is being left', () => {
  const { log } = setup();
  log.leaving(true);
  expect(log.record(new TypeError('Failed to fetch'), 'read')).toBeUndefined();
  log.leaving(false);
  expect(log.record(new TypeError('Failed to fetch'), 'read')).toBeTruthy();
  expect(log.entries()).toHaveLength(1);
});

test('a wrapped error keeps the cause in its name and stack', () => {
  const { log } = setup('/studio/reading');
  const cause = new RangeError('deep');
  log.record(new Error('', { cause }), 'read');
  expect(log.entries()[0]).toMatchObject({ message: 'deep', name: 'Error (RangeError)', itemId: undefined });
});

test('the log is a ring: the oldest entries fall off', () => {
  const { log, clock } = setup();
  for (let i = 0; i < ERROR_LOG_MAX + 5; i++) {
    clock.now += 1;
    log.record(new Error(`failure ${i}`), 'banner');
  }
  expect(log.entries()).toHaveLength(ERROR_LOG_MAX);
  expect(log.entries()[0]!.message).toBe(`failure ${ERROR_LOG_MAX + 4}`);
  expect(log.entries().at(-1)!.message).toBe('failure 5');
});

test('subscribers hear every change, and clear empties the store', () => {
  const { log, store } = setup();
  let heard = 0;
  const stop = log.subscribe(() => heard++);
  const before = log.entries();
  log.record(new Error('one'), 'banner');
  expect(log.entries()).not.toBe(before);
  log.clear();
  expect(heard).toBe(2);
  expect(log.entries()).toEqual([]);
  expect(store.has(ERROR_LOG_KEY)).toBe(false);
  stop();
  log.record(new Error('two'), 'banner');
  expect(heard).toBe(2);
});

test('a store that throws or holds junk loses the log, not the page', () => {
  const broken = { getItem: () => '{not json', setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {} };
  const log = createErrorLog(broken, { route: '/studio', now: () => 0 });
  expect(log.entries()).toEqual([]);
  expect(log.record(new Error('still here'), 'banner')).toBeTruthy();
  expect(log.entries()).toHaveLength(1);
  expect(createErrorLog(undefined, { route: '/studio', now: () => 0 }).record(new Error('no store'), 'banner')).toBeTruthy();
});

const device = { 'user agent': 'TestBrowser/1.0', platform: 'iPad', installed: true };
test('diagnostics lead with the build and device, then every entry', () => {
  const { log, clock } = setup();
  log.noteRequest('PATCH', 'https://example.org/api/items/x', 409);
  log.record(new ApiError(409, { message: 'item changed', code: 'revision-conflict' }), 'banner');
  clock.now += 1000;
  log.record(new ApiError(409, { message: 'item changed', code: 'revision-conflict' }), 'banner');
  const text = diagnostics(log.entries(), device);
  expect(text.split('\n\n')[0]).toMatch(/^blygger-studio \d+\.\d+\.\d+\nuser agent: TestBrowser\/1\.0\nplatform: iPad\ninstalled: true$/);
  expect(text).toContain('1 logged error, newest first');
  expect(describeEntry(log.entries()[0]!)).toContain('2026-11-13T18:00:01.000Z (×2, first 2026-11-13T18:00:00.000Z)\nBlyggerApiError: item changed\nstatus 409 · code revision-conflict · PATCH /api/items/x\nfrom banner · at /blyg/studio/edit/54pwr12zqvvaj37zqx0f8vdbhk · item 54pwr12zqvvaj37zqx0f8vdbhk · blygger-studio/');
  expect(describeEntry(log.entries()[0]!).match(/item changed/g)).toHaveLength(1);
  expect(describeEntry(log.entries()[0]!)).toContain('    at ');
  expect(diagnostics([], device)).toContain('no logged errors');
});

test('an export is a dated JSON file with the client, the device and every entry', () => {
  const { log } = setup();
  log.record(new Error('one'), 'banner');
  const { name, text } = exportLog(log.entries(), device, new Date('2026-11-13T18:30:05Z'));
  expect(name).toBe('blygger-studio-errors-2026-11-13-18-30-05.json');
  const parsed = JSON.parse(text);
  expect(parsed).toMatchObject({ client: { name: 'blygger-studio' }, exported: '2026-11-13T18:30:05.000Z', device });
  expect(parsed.client.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(parsed.entries).toEqual(log.entries());
});
