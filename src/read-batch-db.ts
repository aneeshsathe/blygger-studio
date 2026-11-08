import DataLoader from 'dataloader';
import { READ_BATCH_MAX } from './read-batch-policy.ts';

/** One read-batch envelope only. Pack ready queries, including the existing
 * admission INSERT ... RETURNING statements, without caching or a timer window.
 * Each physical batch is a transaction; failed batches are never retried here.
 * Explicit batches and other D1 methods retain their native execution behavior. */
export function packReadDatabase(db: D1Database): D1Database {
  const originals = new WeakMap<D1PreparedStatement, D1PreparedStatement>();
  const reads = new DataLoader<D1PreparedStatement, D1Result<Record<string, unknown>>>(
    statements => db.batch<Record<string, unknown>>([...statements]),
    { cache: false, maxBatchSize: READ_BATCH_MAX, batchScheduleFn: dispatch => queueMicrotask(dispatch) },
  );
  function wrap(statement: D1PreparedStatement): D1PreparedStatement {
    const wrapped = new Proxy(statement, { get(target, key) {
      if (key === 'bind') return (...values: unknown[]) => wrap(target.bind(...values));
      if (key === 'all') return () => reads.load(target);
      if (key === 'first') return async (column?: string) => {
        // Preserve native scalar-column validation and error behavior.
        if (column !== undefined) return target.first(column);
        return (await reads.load(target)).results[0] ?? null;
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    originals.set(wrapped, statement);
    return wrapped;
  }
  return new Proxy(db, { get(target, key) {
    if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql));
    if (key === 'batch') return (statements: D1PreparedStatement[]) =>
      target.batch(statements.map(statement => originals.get(statement) ?? statement));
    const value = Reflect.get(target, key);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
