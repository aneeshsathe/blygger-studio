/**
 * The studio's error log (ROADMAP row 59): the last errors this browser saw, kept
 * on this device only. A banner can vanish before it is read, and "it said
 * something about a collection" is not a bug report; the log keeps what it said.
 * Nothing here is sent anywhere: the owner reads it in Settings or copies it out.
 *
 * It records failures, not text: no draft content, and no query strings (a search
 * puts the words searched for in one).
 */
import { CLIENT } from '../client.ts';

/** Where the studio met the error. */
export type ErrorSource = 'banner' | 'read' | 'route' | 'uncaught' | 'rejection' | 'extension';
/** The extension an error came from, and the slot it was filling. */
export type ErrorOrigin = { extension: string; slot?: string };
export type ErrorEntry = {
  id: string;
  /** ISO time of the latest occurrence. */
  at: string;
  /** ISO time of the first, which differs once the entry is counted more than once. */
  firstAt: string;
  /** How many times in a row, for a banner that re-renders or a poll that keeps failing. */
  count: number;
  source: ErrorSource;
  message: string;
  name?: string;
  /** The API's stable error code, when the server answered with one. */
  code?: string;
  status?: number;
  /** The request that failed, as `METHOD /path` under the API base. */
  operation?: string;
  stack?: string;
  /** The studio path the owner was on. */
  route: string;
  itemId?: string;
  /** Set when an extension threw it or showed it. */
  extension?: string;
  slot?: string;
  build: string;
};
export type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type Context = { route: string; now: () => number };

export const ERROR_LOG_KEY = 'blyg-error-log';
export const ERROR_LOG_MAX = 100;
const STACK_MAX = 4000;
/** The same failure again this soon is one entry, counted. */
const REPEAT_MS = 60_000;
/** A failed request is the one behind an error thrown this soon after it. */
const REQUEST_MS = 5_000;

const CANCELLED = new Set(['CancelledError', 'AbortError']);

type FailedRequest = { operation: string; status?: number; at: number };

const itemIn = (route: string) => /\/(?:edit|reading\/[^/]+)\/([0-9a-z]{26})(?:\/|$)/.exec(route)?.[1];
const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

export function createErrorLog(storage: Storage | undefined, context: Context) {
  const listeners = new Set<() => void>();
  // An Error object already logged: a banner renders the same one many times.
  const seen = new WeakMap<object, string>();
  const origins = new WeakMap<object, ErrorOrigin>();
  const requests: FailedRequest[] = [];
  let cache: ErrorEntry[] | undefined;
  let leaving = false;
  const read = (): ErrorEntry[] => {
    if (cache) return cache;
    try {
      const stored: unknown = JSON.parse(storage?.getItem(ERROR_LOG_KEY) ?? '[]');
      cache = Array.isArray(stored) ? stored : [];
    } catch {
      cache = [];
    }
    return cache;
  };
  const write = (entries: ErrorEntry[]) => {
    cache = entries;
    // A full or forbidden store (private browsing) loses the log, never the page.
    try {
      if (entries.length) storage?.setItem(ERROR_LOG_KEY, JSON.stringify(entries));
      else storage?.removeItem(ERROR_LOG_KEY);
    } catch {}
    for (const notify of listeners) notify();
  };
  const requestFor = (status: number | undefined, at: number) => {
    for (let i = requests.length - 1; i >= 0; i--) {
      const request = requests[i]!;
      if (at - request.at > REQUEST_MS) break;
      if (status === undefined || request.status === status) return request;
    }
    return undefined;
  };
  return {
    /** Newest first. The array is replaced on every change, never mutated. */
    entries: read,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => { listeners.delete(notify); };
    },
    clear: () => write([]),
    /** A page being left has its requests dropped by the browser: "Failed to fetch" then is not a failure. */
    leaving(value: boolean) { leaving = value; },
    /** A request that failed, noted by the API transport so an error can name it. */
    noteRequest(method: string, url: string, status?: number) {
      let path = url;
      try { path = new URL(url).pathname; } catch {}
      requests.push({ operation: `${method} ${path}`, status, at: context.now() });
      if (requests.length > 20) requests.shift();
    },
    /** Name the extension behind an error before a banner shows it, so its entry says whose it was. */
    attribute(error: Error, origin: ErrorOrigin) { origins.set(error, origin); },
    /** Log an error and return its entry id. Strings are messages to the author, not failures. */
    record(error: unknown, source: ErrorSource, from?: ErrorOrigin): string | undefined {
      if (leaving || !(error instanceof Error)) return undefined;
      // A request the studio or the browser gave up on purpose is not a failure.
      if (CANCELLED.has(error.name) || (error.cause instanceof Error && CANCELLED.has(error.cause.name))) return undefined;
      const known = seen.get(error);
      if (known) return known;
      const now = context.now();
      const route = context.route;
      const entries = read();
      const body = 'body' in error && typeof error.body === 'object' && error.body ? error.body as Record<string, unknown> : undefined;
      const status = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : undefined;
      // A browser-dropped fetch is a TypeError with no status: take the latest failure.
      const request = status !== undefined || error instanceof TypeError ? requestFor(status, now) : undefined;
      const cause = error.cause instanceof Error ? error.cause : undefined;
      const message = error.message || cause?.message || error.name;
      const origin = from ?? origins.get(error);
      const latest = entries[0];
      if (latest && latest.message === message && latest.route === route && latest.source === source && now - Date.parse(latest.at) < REPEAT_MS) {
        seen.set(error, latest.id);
        write([{ ...latest, at: new Date(now).toISOString(), count: latest.count + 1 }, ...entries.slice(1)]);
        return latest.id;
      }
      const entry: ErrorEntry = {
        id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        at: new Date(now).toISOString(),
        firstAt: new Date(now).toISOString(),
        count: 1,
        source,
        message,
        name: cause && cause.name !== 'Error' ? `${error.name} (${cause.name})` : error.name,
        code: text(body?.code),
        status,
        operation: request?.operation,
        stack: (error.stack ?? cause?.stack)?.slice(0, STACK_MAX),
        route,
        itemId: itemIn(route),
        extension: origin?.extension,
        slot: origin?.slot,
        build: `${CLIENT.name}/${CLIENT.version}`,
      };
      seen.set(error, entry.id);
      write([entry, ...entries].slice(0, ERROR_LOG_MAX));
      return entry.id;
    },
  };
}

/** One entry as text, for an issue. */
export function describeEntry(entry: ErrorEntry) {
  const head = [
    `${entry.at}${entry.count > 1 ? ` (×${entry.count}, first ${entry.firstAt})` : ''}`,
    `${entry.name ?? 'Error'}: ${entry.message}`,
    [entry.status && `status ${entry.status}`, entry.code && `code ${entry.code}`, entry.operation].filter(Boolean).join(' · '),
    [`from ${entry.source}`, entry.extension && `extension ${entry.extension}${entry.slot ? ` (${entry.slot})` : ''}`, `at ${entry.route}`, entry.itemId && `item ${entry.itemId}`, entry.build].filter(Boolean).join(' · '),
  ].filter(Boolean);
  // V8 opens a stack with the name and message again; Safari and Firefox do not.
  const frames = entry.stack?.split('\n').filter((line, i) => i > 0 || !line.includes(entry.message.split('\n')[0]!)).join('\n');
  return [...head, ...(frames ? [frames] : [])].join('\n');
}
/** What a maintainer asks first: which browser, on what, how the studio was opened. */
export type Device = Record<string, string | number | boolean>;
/** The whole log as text, for pasting into an issue. */
export function diagnostics(entries: readonly ErrorEntry[], device: Device) {
  return [
    [`${CLIENT.name} ${CLIENT.version}`, ...Object.entries(device).map(([name, value]) => `${name}: ${value}`)].join('\n'),
    entries.length ? `${entries.length} logged error${entries.length === 1 ? '' : 's'}, newest first` : 'no logged errors',
    ...entries.map(describeEntry),
  ].join('\n\n');
}
/** The whole log as a file, for sending to whoever is looking into it. */
export function exportLog(entries: readonly ErrorEntry[], device: Device, now: Date) {
  return {
    name: `blygger-studio-errors-${now.toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
    text: JSON.stringify({ client: { ...CLIENT }, exported: now.toISOString(), device, entries }, null, 2),
  };
}

const browser = typeof window !== 'undefined';
const local = () => {
  try { return browser ? localStorage : undefined; } catch { return undefined; }
};
/** This browser's log. */
export const errorLog = createErrorLog(local(), {
  get route() { return browser ? location.pathname : ''; },
  now: () => Date.now(),
});

/** Errors no banner shows: thrown outside React, or a promise nobody awaited. */
export function watchUncaughtErrors() {
  window.addEventListener('pagehide', () => errorLog.leaving(true));
  // Back from the back-forward cache, the page is live again.
  window.addEventListener('pageshow', () => errorLog.leaving(false));
  window.addEventListener('error', (event) => { errorLog.record(event.error, 'uncaught'); });
  window.addEventListener('unhandledrejection', (event) => { errorLog.record(event.reason, 'rejection'); });
}

/** This browser and screen, read when the log is copied or exported. */
export function thisDevice(): Device {
  return {
    'user agent': navigator.userAgent,
    platform: navigator.platform,
    'touch points': navigator.maxTouchPoints,
    screen: `${screen.width}×${screen.height} at ${devicePixelRatio}x`,
    window: `${innerWidth}×${innerHeight}`,
    // Opened from the home screen, where Safari behaves differently from a tab.
    installed: matchMedia('(display-mode: standalone)').matches,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,
    address: location.origin,
  };
}
