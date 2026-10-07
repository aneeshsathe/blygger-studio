/**
 * An operation failure remains primary even when its cleanup also fails.
 * ORC-010 in docs/oracle-tests.md requires distinct cleanup diagnostics and releases.
 * The failed flag preserves thrown undefined as a failure rather than success.
 * Release every peer in supplied order and retain every rejection. Return the
 * operation value only when both operation and cleanup succeeded. This helper
 * cannot release a resource whose owner never registered a release callback.
 */
export async function withOracleCleanup<T>(operation: () => Promise<T>, releases: readonly (() => Promise<unknown>)[]): Promise<T> {
  let value: T | undefined;
  let primary: unknown;
  let failed = false;
  try { value = await operation(); }
  catch (error) { primary = error; failed = true; }
  const secondary: unknown[] = [];
  for (const release of releases) {
    try { await release(); } catch (error) { secondary.push(error); }
  }
  if (secondary.length) {
    throw new AggregateError(failed ? [primary, ...secondary] : secondary,
      failed ? 'Oracle operation failed; cleanup also failed' : 'Oracle cleanup failed',
      failed ? { cause: primary } : undefined);
  }
  if (failed) throw primary;
  return value as T;
}
