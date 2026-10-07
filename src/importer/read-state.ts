// The owner's read state for imported items (migration 0026): per
// reading row, the highest version read, so a client that marks a post read on
// one device sees it read on the others. Studio-private and numbers only. GET
// /reading carries it as `imported.readVersion`.
//
// Reads are idempotent and monotonic: the stored value is max(existing,
// requested), and `updated` moves only when that value rises, so a replay, a
// reordered queue or a stale client can never lower it. A row is stored only
// for an imported item held here; anything else is acknowledged and ignored.
// Clients read a 404 from these routes as "this server has no read state", so
// an unknown subscription or item must not answer 404.
//
// Clearing ("mark unread", 0026) sets read_version to NULL and records
// unread_at, the server time of the clear: a tombstone. A read that says when
// it happened (`read_at`) and happened before the latest clear is ignored, so
// an offline queue cannot undo a later "mark unread" from another device. A
// read with no read_at applies as it always did. Because a clear resets
// read_version to NULL, the next accepted read stores its own version: max()
// runs against what is held since the clear, never against the pre-clear value.
// unread_at is kept after a read applies, as the row's last-cleared watermark.
//
// Both instants are stored as Date#toISOString (millisecond, UTC, `Z`), so
// comparing them as strings compares them as instants. read_at is normalized
// to that form on the way in; a client's clock skew is the client's to own.

/** One request marks at most this many rows. Enough for a whole feed at once. */
export const READ_BATCH_MAX = 500;
/** Read versions are the origin's item versions; 32 bits is ample. */
export const READ_VERSION_MAX = 0xffffffff;
/** Longer ids cannot name an imported item; they are refused rather than looked up. */
export const READ_ID_MAX = 1024;

/** The one instant format stored in read_state.unread_at and compared against. */
export function normalizeInstant(iso: string): string {
  return new Date(iso).toISOString();
}

// ?1 sub, ?2 remote id, ?3 version, ?4 now, ?5 normalized read_at or NULL.
// The DO UPDATE's WHERE is the tombstone: a stale read updates nothing, so it
// fires no change trigger either.
const UPSERT = `
  INSERT INTO read_state (subscription_id, remote_id, read_version, updated)
  SELECT ?1, ?2, ?3, ?4
   WHERE EXISTS (SELECT 1 FROM imported_items WHERE subscription_id = ?1 AND remote_id = ?2)
  ON CONFLICT (subscription_id, remote_id) DO UPDATE SET
    updated = CASE WHEN read_state.read_version IS NULL OR excluded.read_version > read_state.read_version THEN excluded.updated ELSE read_state.updated END,
    read_version = MAX(COALESCE(read_state.read_version, -1), excluded.read_version)
  WHERE ?5 IS NULL OR read_state.unread_at IS NULL OR ?5 >= read_state.unread_at`;

// ?1 sub, ?2 remote id, ?3 normalized now. A held item with no row yet gets a
// tombstone row, so a stale read from before this clear is still ignored.
const CLEAR = `
  INSERT INTO read_state (subscription_id, remote_id, read_version, updated, unread_at)
  SELECT ?1, ?2, NULL, ?3, ?3
   WHERE EXISTS (SELECT 1 FROM imported_items WHERE subscription_id = ?1 AND remote_id = ?2)
  ON CONFLICT (subscription_id, remote_id) DO UPDATE SET
    read_version = NULL, updated = excluded.updated, unread_at = excluded.unread_at`;

export interface ReadMark {
  sub: string;
  remote_id: string;
  version: number;
  read_at?: string;
}

export interface UnreadMark {
  sub: string;
  remote_id: string;
}

export interface MarkResult {
  /** False when nothing is held for the row, or the read predates the latest clear. */
  stored: boolean;
  /** The value held after the write; null when nothing is held or the row is cleared. */
  read_version: number | null;
}

function bindRead(stmt: D1PreparedStatement, m: ReadMark, now: string): D1PreparedStatement {
  return stmt.bind(m.sub, m.remote_id, m.version, now, m.read_at === undefined ? null : normalizeInstant(m.read_at));
}

/** Mark one row read up to `version`. */
export async function markRead(db: D1Database, sub: string, remoteId: string, version: number, readAt?: string): Promise<MarkResult> {
  const mark: ReadMark = { sub, remote_id: remoteId, version, read_at: readAt };
  const [, held] = await db.batch([
    bindRead(db.prepare(UPSERT), mark, new Date().toISOString()),
    db.prepare("SELECT read_version, unread_at FROM read_state WHERE subscription_id = ? AND remote_id = ?").bind(sub, remoteId),
  ]);
  const row = (held.results as { read_version: number | null; unread_at: string | null }[])[0];
  if (!row) return { stored: false, read_version: null };
  // Reads never move unread_at, so the row after the write says whether the
  // tombstone refused this one.
  const ignored = readAt !== undefined && row.unread_at !== null && normalizeInstant(readAt) < row.unread_at;
  return { stored: !ignored, read_version: row.read_version };
}

/** Mark many rows in one transaction. Rows naming no held item, or predating their clear, are skipped. */
export async function markReadBatch(db: D1Database, marks: ReadMark[]): Promise<void> {
  if (!marks.length) return;
  const now = new Date().toISOString();
  const stmt = db.prepare(UPSERT);
  await db.batch(marks.map((m) => bindRead(stmt, m, now)));
}

/** Clear one row's read state, leaving a tombstone. Nothing is stored for a row not held. */
export async function markUnread(db: D1Database, sub: string, remoteId: string): Promise<void> {
  await markUnreadBatch(db, [{ sub, remote_id: remoteId }]);
}

/** Clear many rows in one transaction. */
export async function markUnreadBatch(db: D1Database, marks: UnreadMark[]): Promise<void> {
  if (!marks.length) return;
  const now = new Date().toISOString();
  const stmt = db.prepare(CLEAR);
  await db.batch(marks.map((m) => stmt.bind(m.sub, m.remote_id, now)));
}
