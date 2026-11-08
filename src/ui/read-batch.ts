import DataLoader from 'dataloader';
import { BlyggerApi, createBlyggerClient, unwrap } from '../../sdk/dist/browser.js';
import { zBatchReadResponse } from '../../sdk/dist/schemas.js';
import { READ_BATCH_MAX, READ_BATCH_PATHS, type ReadBatchOperation, type ReadBatchInput } from '../read-batch-policy.ts';

const aborted = () => new DOMException('The operation was aborted', 'AbortError');

/** Batch transport only. Collection predicates, schemas, and cursors stay with
 * their existing query functions and server operations. Never cache results. */
export function createReadBatchFetch(apiBase: string, fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init)): typeof fetch {
  const base = new URL(apiBase.endsWith('/') ? apiBase : apiBase + '/');
  const client = createBlyggerClient({ baseUrl: apiBase, fetch: fetcher });
  const patterns = Object.entries(READ_BATCH_PATHS).map(([operation, path]) => ({
    operation: operation as ReadBatchOperation,
    fields: [...path.matchAll(/\{(\w+)\}/g)].map(match => match[1]),
    pattern: new RegExp('^' + path.replace(/\{\w+\}/g, '([^/]+)') + '$'),
  }));
  const inputs = new WeakMap<Request, ReadBatchInput>();
  const loaders = new Map<ReadBatchOperation, DataLoader<Request, Response>>();

  async function dispatch(operation: ReadBatchOperation, requests: readonly Request[]) {
    const controller = new AbortController(), selected = requests.filter(request => !request.signal.aborted);
    if (!selected.length) return requests.map(aborted);
    const active = new Set(selected), listeners = new Map<Request, () => void>();
    for (const request of selected) {
      const listener = () => { active.delete(request); if (!active.size) controller.abort(); };
      listeners.set(request, listener);
      request.signal.addEventListener('abort', listener, { once: true });
    }
    try {
      const first = selected[0];
      const results = zBatchReadResponse.parse(await unwrap(BlyggerApi.batchRead({ client,
        headers: Object.fromEntries(first.headers), credentials: first.credentials, mode: first.mode, redirect: first.redirect,
        cache: first.cache, referrer: first.referrer, referrerPolicy: first.referrerPolicy,
        body: { operation, requests: selected.map(request => inputs.get(request)!) }, signal: controller.signal,
      })));
      if (results.length !== selected.length) throw new Error('Read batch response length mismatch');
      const byRequest = new Map(selected.map((request, index) => [request, results[index]]));
      return requests.map(request => {
        if (request.signal.aborted) return aborted();
        const result = byRequest.get(request)!;
        return new Response([204, 205, 304].includes(result.status) ? null : JSON.stringify(result.body), {
          status: result.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...result.headers },
        });
      });
    } finally {
      for (const [request, listener] of listeners) request.signal.removeEventListener('abort', listener);
    }
  }

  function loader(operation: ReadBatchOperation) {
    let found = loaders.get(operation);
    if (!found) {
      found = new DataLoader<Request, Response>(async requests => {
        // Credentials and fetch settings belong to one request, not a global client.
        // Keep unlike contexts in separate physical batches, without retaining keys.
        const groups = new Map<string, Request[]>();
        for (const request of requests) {
          const key = JSON.stringify([[...request.headers].sort(), request.credentials, request.mode, request.redirect,
            request.cache, request.referrer, request.referrerPolicy]);
          const group = groups.get(key) ?? [];
          group.push(request); groups.set(key, group);
        }
        const values = new Map<Request, Response | Error>();
        await Promise.all([...groups.values()].map(async group => {
          try { (await dispatch(operation, group)).forEach((value, index) => values.set(group[index], value)); }
          catch (error) { for (const request of group) values.set(request, error instanceof Error ? error : new Error(String(error))); }
        }));
        return requests.map(request => values.get(request)!);
      }, {
        cache: false, maxBatchSize: READ_BATCH_MAX,
        // Browser timers can be throttled in hidden tabs. Dispatch ready peers
        // in a microtask instead of DataLoader's browser setTimeout fallback.
        batchScheduleFn: dispatch => queueMicrotask(dispatch),
      });
      loaders.set(operation, found);
    }
    return found;
  }

  return (input, init) => {
    const request = new Request(input, init), url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname) ||
        request.integrity || request.keepalive || [...request.headers.keys()].some(key => key.startsWith('if-') || key === 'range') ||
        new Set(url.searchParams.keys()).size !== [...url.searchParams].length) return fetcher(request);
    const path = '/' + url.pathname.slice(base.pathname.length);
    // This literal route precedes /items/{id}; it is not a point item read.
    if (path === '/items/summary') return fetcher(request);
    const match = patterns.map(entry => ({ ...entry, match: entry.pattern.exec(path) })).find(entry => entry.match);
    if (!match) return fetcher(request);
    const params: Record<string, string> = {};
    try { match.fields.forEach((field, index) => { params[field] = decodeURIComponent(match.match![index + 1]); }); }
    catch { return fetcher(request); }
    inputs.set(request, { path: params, query: Object.fromEntries(url.searchParams) });
    return new Promise<Response>((resolve, reject) => {
      if (request.signal.aborted) { reject(request.signal.reason); return; }
      const abort = () => reject(request.signal.reason);
      request.signal.addEventListener('abort', abort, { once: true });
      loader(match.operation).load(request).then(resolve, reject).finally(() => request.signal.removeEventListener('abort', abort));
    });
  };
}
