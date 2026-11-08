import { toIsoUtc } from '../util.ts';

type DateRow = { subscription_id: string; remote_id: string; created: string | null; updated: string | null };
type SqlResult = { results: DateRow[]; meta?: { changes?: number } };
export type DateRepairExecutor = (sql: string) => Promise<SqlResult>;
// Hex literals keep arbitrary stored IDs/dates out of SQL syntax, including NUL.
const literal = (value: string | null) => value === null ? 'NULL' : `CAST(X'${Array.from(new TextEncoder().encode(value), byte => byte.toString(16).padStart(2, '0')).join('')}' AS TEXT)`;

/** One metadata-only keyset pass. Safe to rerun after interruption; no bodies,
 * versions, observation times, or read state change. Drain writers before use. */
export async function normalizeStoredImportDates(execute: DateRepairExecutor, batchSize = 100) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new Error('Date repair batch size must be 1–100');
  let after: [string, string] | undefined;
  let scanned = 0, changed = 0;
  for (;;) {
    const rows = (await execute(`SELECT subscription_id, remote_id, created, updated FROM imported_items${after ? ` WHERE (subscription_id,remote_id) > (${literal(after[0])},${literal(after[1])})` : ''} ORDER BY subscription_id,remote_id LIMIT ${batchSize}`)).results;
    if (!rows.length) return { scanned, changed };
    const patches = rows.flatMap(row => {
      const created = toIsoUtc(row.created) ?? null, updated = toIsoUtc(row.updated) ?? null;
      return created === row.created && updated === row.updated ? [] : [[row.subscription_id, row.remote_id, created, updated, row.created, row.updated]];
    });
    if (patches.length) {
      const result = await execute(`UPDATE imported_items SET created=json_extract(p.value,'$[2]'),updated=json_extract(p.value,'$[3]') FROM json_each(${literal(JSON.stringify(patches))}) p WHERE subscription_id=json_extract(p.value,'$[0]') AND remote_id=json_extract(p.value,'$[1]') AND created IS json_extract(p.value,'$[4]') AND updated IS json_extract(p.value,'$[5]') RETURNING subscription_id`);
      if (result.results.length !== patches.length) throw new Error('Imported dates changed during repair; finish pending writes and rerun normalization');
      changed += patches.length;
    }
    scanned += rows.length;
    const last = rows.at(-1)!; after = [last.subscription_id, last.remote_id];
  }
}
