import type { QueryFunction, QueryFunctionContext } from '@tanstack/query-core';
import type { ChangeDomain, ChangeState } from '../change-state.ts';

export type Generation = { epoch: string; revision: number };

export type CachedResponse<T> = {
  data: T;
  generation: Generation;
};

/** A response that joins several domains is labelled with their sum. Counters
 * only increase within an epoch, so the sum moves exactly when one of them does
 * (a mention's source card reads the mention and the Reading tables). */
export function domainRevision(changes: ChangeState, domain: ChangeDomain | readonly ChangeDomain[]): number {
  if (typeof domain === 'string') return changes.domains[domain];
  return domain.reduce((sum, d) => sum + changes.domains[d], 0);
}

/** Cache the response and its pre-fetch revision together in TanStack Query.
 * Query Collection owns materialization, cancellation and optimistic overlays.
 * Each invocation checks revisions afresh, including mutation refetches.
 */
export async function readIfChanged<T>(
  context: QueryFunctionContext,
  domain: ChangeDomain | readonly ChangeDomain[],
  readChanges: QueryFunction<ChangeState>,
  load: (context: QueryFunctionContext, generation: Generation) => T | Promise<T>,
): Promise<CachedResponse<T>> {
  const { signal } = context;
  signal.throwIfAborted();
  const changes = await readChanges(context);
  signal.throwIfAborted();
  const generation = { epoch: changes.epoch, revision: domainRevision(changes, domain) };
  const cached = context.client.getQueryData<CachedResponse<T>>(context.queryKey);
  if (cached?.generation.epoch === generation.epoch &&
      cached.generation.revision === generation.revision) {
    return cached;
  }
  const data = await load(context, generation);
  signal.throwIfAborted();
  // Primary reads start after this check. A concurrent write can make data
  // newer within the epoch; a restore invalidates this old epoch next time.
  // Never label the response with a post-fetch revision.
  return { data, generation };
}
