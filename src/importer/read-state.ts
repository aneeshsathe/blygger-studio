// The owner's read state for imported items (migration 0026): per reading row,
// the highest version read, so a client that marks a post read on one device
// sees it read on the others. Studio-private and numbers only. GET /reading
// carries it as `imported.readVersion`.
//
// Writes are idempotent and monotonic: the stored value is max(existing,
// requested), and `updated` moves only when that value rises, so a replay, a
// reordered queue or a stale client can never lower it. A row is stored only
// for an imported item held here; anything else is acknowledged and ignored.
// Clients read a 404 from these routes as "this server has no read state", so
// an unknown subscription or item must not answer 404.

import { nowIso } from "../util.ts";

/** One request marks at most this many rows. Enough for a whole feed at once. */
export const READ_BATCH_MAX = 500;
/** Read versions are the origin's item versions; 32 bits is ample. */
export const READ_VERSION_MAX = 0xffffffff;
/** Longer ids cannot name an imported item; they are refused rather than looked up. */
export const READ_ID_MAX = 1024;

const UPSERT = `
  INSERT INTO read_state (subscription_id, remote_id, read_version, updated)
  SELECT ?1, ?2, ?3, ?4
   WHERE EXISTS (SELECT 1 FROM imported_items WHERE subscription_id = ?1 AND remote_id = ?2)
  ON CONFLICT (subscription_id, remote_id) DO UPDATE SET
    updated = CASE WHEN excluded.read_version > read_state.read_version THEN excluded.updated ELSE read_state.updated END,
    read_version = MAX(read_state.read_version, excluded.read_version)`;

export interface ReadMark {
  sub: string;
  remote_id: string;
  version: number;
}

/** Mark one row read up to `version`; returns the stored value, null when nothing is held. */
export async function markRead(db: D1Database, sub: string, remoteId: string, version: number): Promise<number | null> {
  const [, stored] = await db.batch([
    db.prepare(UPSERT).bind(sub, remoteId, version, nowIso()),
    db.prepare("SELECT read_version FROM read_state WHERE subscription_id = ? AND remote_id = ?").bind(sub, remoteId),
  ]);
  const row = (stored.results as { read_version: number }[])[0];
  return row ? row.read_version : null;
}

/** Mark many rows in one transaction. Rows naming no held item are skipped. */
export async function markReadBatch(db: D1Database, marks: ReadMark[]): Promise<void> {
  if (!marks.length) return;
  const at = nowIso();
  const stmt = db.prepare(UPSERT);
  await db.batch(marks.map((m) => stmt.bind(m.sub, m.remote_id, m.version, at)));
}
