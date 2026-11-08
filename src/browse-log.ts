// The browsing path (migration 0033, 0.49.0): a private record of the reader's
// descents, one row per entry opened by following a link. Like the interaction
// log it is studio-only; nothing here is emitted or rendered publicly.
//
// A step names the step it was reached from, so a trail is a tree: backing out
// and following a different link branches rather than overwriting.

export const BROWSE_VIA = ["start", "stub", "quote", "link", "back"] as const;
export type BrowseVia = (typeof BROWSE_VIA)[number];

export interface BrowseRow {
  id: number;
  at: string;
  trail: string;
  parent_id: number | null;
  origin: string;
  remote_id: string;
  version: number | null;
  via: BrowseVia;
  title: string | null;
}

export interface BrowseStep {
  trail: string;
  parentId?: number | null;
  origin: string;
  remoteId: string;
  version?: number | null;
  via: BrowseVia;
  title?: string | null;
  at: string;
}

const TITLE_MAX = 160;

export async function recordBrowse(db: D1Database, s: BrowseStep): Promise<number> {
  // A parent from another trail is a stale client, not a tree edge.
  const parent = s.parentId
    ? await db.prepare("SELECT id FROM browse_log WHERE id = ? AND trail = ?").bind(s.parentId, s.trail).first<{ id: number }>()
    : null;
  const res = await db
    .prepare("INSERT INTO browse_log (at, trail, parent_id, origin, remote_id, version, via, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(s.at, s.trail, parent?.id ?? null, s.origin, s.remoteId, s.version ?? null, s.via, s.title ? s.title.slice(0, TITLE_MAX) : null)
    .run();
  return Number(res.meta.last_row_id);
}

/** Newest steps first, across trails; the client groups them by `trail`. */
export async function listBrowse(db: D1Database, offset: number, limit: number, trail?: string) {
  const where = trail ? "WHERE trail = ?" : "";
  const bind = trail ? [trail] : [];
  const items = await db
    .prepare(`SELECT * FROM browse_log ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .bind(...bind, limit, offset)
    .all<BrowseRow>();
  const total = await db.prepare(`SELECT COUNT(*) AS n FROM browse_log ${where}`).bind(...bind).first<{ n: number }>();
  return { items: items.results, total: total?.n ?? 0 };
}

export async function clearBrowse(db: D1Database, trail?: string): Promise<void> {
  if (trail) await db.prepare("DELETE FROM browse_log WHERE trail = ?").bind(trail).run();
  else await db.prepare("DELETE FROM browse_log").run();
}
