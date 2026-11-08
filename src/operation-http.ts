import { FAILURE_STATUS, type OperationResult } from './operation-types.ts';
import { bearerChallenge } from './oauth.ts';
import type { Env } from './types.ts';

/** REST and read batches encode the same operation result and retry/scope hints. */
export function operationHttp(result: OperationResult, url: string, env: Env) {
  const headers: Record<string, string> = {};
  if (result.ok) {
    if (result.location) headers.Location = result.location;
    return { status: result.created ? 201 as const : 200 as const, body: result.value, headers };
  }
  if (result.requiredScopes) headers['WWW-Authenticate'] = bearerChallenge(url, env, 'api', result.requiredScopes.join(' '), true);
  if (result.kind === 'rate-limit') headers['Retry-After'] = '60';
  return { status: FAILURE_STATUS[result.kind], body: result.value, headers };
}
