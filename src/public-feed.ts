import type { ItemRow, MediaRow, VersionRow, Transclusion } from "./types.ts";

export type FeedItem = Pick<ItemRow, "id" | "kind" | "created" | "updated" | "version" | "forked_from" | "fork_cite" | "highlight_override">;

/** Public presentation needs item metadata, never the working copy. */
export async function listFeedItems(db: D1Database, limit: number): Promise<FeedItem[]> {
  return (await db.prepare(`SELECT id, kind, created, updated, version, forked_from, fork_cite, highlight_override
    FROM items WHERE status IN ('public','withdrawn') ORDER BY updated DESC, rowid DESC LIMIT ?`)
    .bind(limit).all<FeedItem>()).results;
}

export interface FeedProvenance {
  localKinds: Map<string, "fragment" | "thread">;
  remoteSources: Map<string, { kind: string; page: string | null; title: string }>;
}

export const sourceKey = (origin: string, id: string) => JSON.stringify([origin, id]);

export type FeedVersion = Pick<VersionRow, "item_id" | "content_html" | "note" | "transclusions" | "stub_of" | "stub_cite" | "generated_json">;

export interface FeedCardData {
  latest: FeedVersion | null;
  pins: number[];
  media: MediaRow[];
}

/** A fixed number of queries for a page, never older version bodies.
 * JSON parameters keep a 100-card page below D1's 100-bound-parameter limit.
 */
export async function loadFeedData(db: D1Database, items: FeedItem[], avatarId: string) {
  const selected = JSON.stringify(items.map(({ id, version }) => ({ id, version })));
  const ids = JSON.stringify(items.filter(i => i.kind !== "withdrawn").map(i => i.id));
  const [versions, pins, media, avatar] = await db.batch([
    db.prepare(`SELECT v.item_id, v.content_html, v.note, v.transclusions, v.stub_of, v.stub_cite, v.generated_json FROM json_each(?) s JOIN versions v
      ON v.item_id = json_extract(s.value, '$.id') AND v.version = json_extract(s.value, '$.version')`).bind(selected),
    db.prepare(`SELECT v.item_id, v.version FROM json_each(?) s JOIN versions v
      ON v.item_id = json_extract(s.value, '$.id') WHERE v.pinned = 1 ORDER BY v.version`).bind(selected),
    db.prepare(`SELECT m.* FROM json_each(?) s JOIN media m ON m.item_id = s.value
      ORDER BY m.created ASC`).bind(ids),
    db.prepare("SELECT * FROM media WHERE id = ?").bind(avatarId),
  ]);
  const cards = new Map<string, FeedCardData>(items.map(i => [i.id, { latest: null, pins: [], media: [] }]));
  for (const v of versions.results as unknown as FeedVersion[]) cards.get(v.item_id)!.latest = v;
  for (const pin of pins.results as unknown as { item_id: string; version: number }[]) cards.get(pin.item_id)!.pins.push(pin.version);
  for (const m of media.results as unknown as MediaRow[]) cards.get(m.item_id!)!.media.push(m);
  const provenance = await loadProvenance(
    db,
    items.filter(i => i.kind === "thread").map(i => JSON.parse(cards.get(i.id)!.latest?.transclusions || "[]") as Transclusion[]),
  );
  return { cards, provenance, avatar: (avatar.results[0] as unknown as MediaRow | undefined) ?? null };
}

/**
 * Provenance for every direct transclusion of a set of threads, in two
 * queries. Shared by the public pages and feed.xml so the two surfaces can
 * never disagree about whose quote a blockquote is.
 */
export async function loadProvenance(db: D1Database, threads: Transclusion[][]): Promise<FeedProvenance> {
  const localIds = new Set<string>();
  const remote = new Map<string, { origin: string; id: string }>();
  for (const transclusions of threads) {
    for (const t of transclusions) {
      if (!t.origin) localIds.add(t.id);
      else if (!t.cited) remote.set(sourceKey(t.origin, t.id), { origin: t.origin, id: t.id });
    }
  }
  const provenance: FeedProvenance = { localKinds: new Map(), remoteSources: new Map() };
  if (!localIds.size && !remote.size) return provenance;
  const [local, sources] = await db.batch([
    db.prepare(`SELECT i.id, CASE WHEN i.kind = 'withdrawn' THEN
      CASE WHEN COALESCE(v.transclusions, '') != '' THEN 'thread' ELSE 'fragment' END ELSE i.kind END AS kind
      FROM json_each(?) s JOIN items i ON i.id = s.value
      LEFT JOIN versions v ON i.kind = 'withdrawn' AND v.item_id = i.id AND v.version = i.version - 1`)
      .bind(JSON.stringify([...localIds])),
    db.prepare(`SELECT s.origin, ii.remote_id AS id, ii.kind, ii.page, s.title
      FROM json_each(?) r JOIN subscriptions s ON s.origin = json_extract(r.value, '$.origin')
      JOIN imported_items ii ON ii.subscription_id = s.id AND ii.remote_id = json_extract(r.value, '$.id')`)
      .bind(JSON.stringify([...remote.values()])),
  ]);
  for (const row of local.results as unknown as { id: string; kind: "fragment" | "thread" }[]) provenance.localKinds.set(row.id, row.kind);
  for (const row of sources.results as unknown as { origin: string; id: string; kind: string; page: string | null; title: string }[]) {
    const key = sourceKey(row.origin, row.id);
    if (!provenance.remoteSources.has(key)) provenance.remoteSources.set(key, row);
  }
  return provenance;
}
