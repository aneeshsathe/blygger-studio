import type { Context } from 'hono';
import { matchedRoutes } from 'hono/route';

const errorTypes = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'EvalError', 'AggregateError']);
/** Error messages, stacks, query strings and path values can contain credentials.
 * Retain only a bounded error kind and the registered route template. */
export function requestError(error: unknown, c: Context) {
  const name = error instanceof Error ? error.name : '';
  const route = matchedRoutes(c).slice().reverse().find(route => route.method !== 'ALL' && !route.path.includes('*'))?.path ?? matchedRoutes(c).slice().reverse().find(route => route.path !== '*')?.path ?? '(unmatched)';
  return { errorType: errorTypes.has(name) ? name : 'UnknownError', method: c.req.method, route };
}
