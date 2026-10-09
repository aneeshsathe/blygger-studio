import type { QueryFunction, QueryFunctionContext } from '@tanstack/query-core';
import type { ChangeDomain, ChangeState } from '../change-state.ts';

export type Generation = { epoch: string; revision: number };

export type CachedResponse<T> = {
  data: T;
  generation: Generation;
};

/** Cache the response and its pre-fetch revision together in TanStack Query.
 * Query Collection owns materialization, cancellation and optimistic overlays.
 * Each invocation checks revisions afresh, including mutation refetches.
 */
export async function readIfChanged<T>(
  context: QueryFunctionContext,
  domain: ChangeDomain,
  readChanges: QueryFunction<ChangeState>,
  load: (context: QueryFunctionContext, generation: Generation) => T | Promise<T>,
): Promise<CachedResponse<T>> {
  const { signal } = context;
  signal.throwIfAborted();
  const changes = await readChanges(context);
  signal.throwIfAborted();
  const generation = { epoch: changes.epoch, revision: changes.domains[domain] };
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
