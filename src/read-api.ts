import { itemResource, versionResource, mediaResource, subscriptionResource, hopperResource, importedResource, mentionResource } from "./contract/resources.ts";
import type { Context } from "hono";
import { contractApp, readJson } from "./contract/app.ts";
import { routes } from "./contract/routes.ts";
import { annotateTkPreview, scopeSummaries } from "./authoring.ts";
import { getItem, getSettings, getSettingsMap, getVersion, listAll, listVersions, publishedVersion } from "./model.ts";
import { getHopper, getImportedItem, listSubscriptions, getSubscription } from "./importer/store.ts";
import { sanitizeHtml } from "./importer/sanitize.ts";
import { renderMarkdown, plainTextFromHtml } from "./markdown.ts";
import { clampText } from "./preview.ts";
import { applyInternalLinks, previewInternalLinks, previewTransclusions, resolveBlockLinks } from "./transclusion.ts";
import { siteOrigin } from "./protocol.ts";
import { MODELS, configuredProviders } from "./ai/models.ts";
import { INTERACTION_KINDS, listInteractions, listThumbs, type InteractionKind } from "./interactions.ts";
import { normalizeMount } from "./util.ts";
import type { Env, SignalRow, ImportedItemRow, ItemRow, SubscriptionRow, HopperRow, MentionInRow, MentionOutRow } from "./types.ts";
import { itemDetail } from "./item-data.ts";
import { readingData } from "./reading-data.ts";
import { getInbound } from "./mentions/store.ts";
import { maybeCheckForUpdate } from "./update-check.ts";
import { normalizeOrigin } from "./stub.ts";
import { mentionFetch } from "./mentions/http.ts";
import { platformFetch } from "./importer/http.ts";
import { fetchImportedHistory, fetchPublicVersion } from "./imported-history.ts";
import { lineageOf, lineageSummaries } from "./lineage.ts";

export const readApi = contractApp();
async function collection<T>(db: D1Database, query: Record<string, string>, sql: string, countSql: string) {
  const offset = Number(query.offset ?? 0), limit = Number(query.limit ?? 100);
  const [rows, count] = await Promise.all([
    db.prepare(`${sql} LIMIT ? OFFSET ?`).bind(limit, offset).all<T>(),
    db.prepare(countSql).first<{ total: number }>(),
  ]);
  return { items: rows.results, total: count?.total ?? 0, offset, limit };
}
const excerptOf = (s: string, n: number) => clampText(plainTextFromHtml(renderMarkdown(s)), n);

readApi.openapi(routes.listItems, async (c) => {
  const offset = Number(c.req.query("offset") ?? 0), limit = Number(c.req.query("limit") ?? 100);
  const [rows, count] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM items ORDER BY updated DESC, rowid DESC LIMIT ? OFFSET ?").bind(limit, offset).all<ItemRow>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM items").first<{ total: number }>(),
  ]);
  // Return frozen version links without loading history bodies into the index.
  const pins = rows.results.length ? (await c.env.DB.prepare(`SELECT item_id, version, CASE WHEN transclusions IS NULL THEN 'fragment' ELSE 'thread' END AS kind FROM versions WHERE pinned = 1 AND item_id IN (${rows.results.map(() => '?').join(',')}) ORDER BY version`).bind(...rows.results.map(row => row.id)).all<{ item_id: string; version: number; kind: 'fragment' | 'thread' }>()).results : [];
  return c.json({ items: rows.results.map(row => ({ ...itemResource(row), pins: pins.filter(pin => pin.item_id === row.id).map(({ version, kind }) => ({ version, kind })) })), total: count?.total ?? 0, offset, limit });
});
readApi.openapi(routes.getItem, async (c) => {
  const detail = await itemDetail(c.env.DB, c.req.param("id"));
  return detail ? c.json({ ...itemResource(detail.item), authored_kind: detail.kind, media: detail.media.map(mediaResource), versions: detail.versions.map(versionResource), published: detail.published ? versionResource(detail.published) : null }) : c.json({ error: "not found" }, 404);
});
readApi.openapi(routes.getSettings, async (c) => c.json(await getSettings(c.env.DB)));
readApi.openapi(routes.listSubscriptions, async (c) => {
  const page = await collection<SubscriptionRow>(c.env.DB, c.req.query(), "SELECT * FROM subscriptions ORDER BY created ASC, id ASC", "SELECT COUNT(*) AS total FROM subscriptions");
  return c.json({ ...page, items: page.items.map(subscriptionResource) });
});
readApi.openapi(routes.getSubscription, async (c) => {
  const sub = await getSubscription(c.env.DB, c.req.param("id"));
  return sub ? c.json(subscriptionResource(sub)) : c.json({ error: "not found" }, 404);
});
readApi.openapi(routes.listHoppers, async (c) => {
  const page = await collection<HopperRow>(c.env.DB, c.req.query(), "SELECT * FROM hoppers ORDER BY created ASC, id ASC", "SELECT COUNT(*) AS total FROM hoppers");
  return c.json({ ...page, items: page.items.map(hopperResource) });
});
readApi.openapi(routes.getHopper, async (c) => {
  const hopper = await getHopper(c.env.DB, c.req.param("id"));
  if (!hopper) return c.json({ error: "not found" }, 404);
  const preview = c.req.query("preview") === "true";
  const limit = preview ? " LIMIT 3" : "";
  const memberships = (await c.env.DB.prepare(`SELECT * FROM hopper_items WHERE hopper_id = ? ORDER BY added_at DESC, subscription_id, remote_id${limit}`).bind(hopper.id).all<import("./types.ts").HopperItemRow>()).results;
  const counts = await c.env.DB.prepare("SELECT COUNT(*) AS total, COUNT(DISTINCT subscription_id) AS source_count FROM hopper_items WHERE hopper_id = ?").bind(hopper.id).first<{ total: number; source_count: number }>();
  const rows = await c.env.DB.prepare(`SELECT ii.* FROM hopper_items hi JOIN imported_items ii
    ON ii.subscription_id = hi.subscription_id AND ii.remote_id = hi.remote_id
    WHERE hi.hopper_id = ? ORDER BY hi.added_at DESC, hi.subscription_id, hi.remote_id${limit}`).bind(hopper.id).all<ImportedItemRow>();
  const items = await Promise.all(rows.results.map(async (r) => importedResource({ ...r, content_html: await sanitizeHtml(r.content_html) })));
  return c.json({ hopper: hopperResource(hopper), memberships, items, total: counts?.total ?? 0, source_count: counts?.source_count ?? 0 });
});
readApi.openapi(routes.listSignals, async (c) => c.json(await collection<SignalRow>(c.env.DB, c.req.query(), "SELECT * FROM signals ORDER BY at DESC, subscription_id, remote_id", "SELECT COUNT(*) AS total FROM signals")));
readApi.openapi(routes.listMentions, async (c) => {
  const direction = c.req.query("direction") ?? "inbound";
  const where = "WHERE status IN ('verified','gone')";
  if (direction === "outbound") return c.json({ ...await collection<MentionOutRow>(c.env.DB, c.req.query(), "SELECT * FROM mentions_out ORDER BY created DESC, id ASC", "SELECT COUNT(*) AS total FROM mentions_out"), direction });
  const page = await collection<MentionInRow>(c.env.DB, c.req.query(), `SELECT * FROM mentions_in ${where} ORDER BY verified_at DESC, last_seen DESC, id ASC`, `SELECT COUNT(*) AS total FROM mentions_in ${where}`);
  return c.json({ ...page, items: page.items.map(mentionResource), direction });
});
readApi.openapi(routes.listInteractions, async (c) => {
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? 50) || 50));
  const raw = c.req.query("kind");
  const kind = INTERACTION_KINDS.includes(raw as InteractionKind) ? (raw as InteractionKind) : undefined;
  return c.json({ ...(await listInteractions(c.env.DB, offset, limit, kind)), offset, limit });
});
readApi.openapi(routes.getAiModels, async (c) => {
  const configured = configuredProviders(c.env);
  return c.json({
    providers: Object.entries(MODELS.providers).map(([id, p]) => ({ id, label: p.label, key_secret: p.key_secret, configured: configured[id] ?? false })),
    models: MODELS.models,
    local: MODELS.local,
  });
});
readApi.openapi(routes.listThumbs, async (c) => c.json({ items: await listThumbs(c.env.DB) }));
readApi.openapi(routes.listReading, async (c) => {
  const page = await readingData(c.env.DB, Number(c.req.query("offset") ?? 0), Number(c.req.query("limit") ?? 25), c.req.query("sub"), readingKind(c.req.query("kind")));
  // Glyph counts ride along with the page so the timeline needs no request per entry.
  const ourOrigin = siteOrigin(await getSettings(c.env.DB), c.req.url, normalizeMount(c.env.MOUNT));
  const linkable = page.items.filter((e) => !e.l0);
  const summaries = await lineageSummaries(c.env.DB, ourOrigin, linkable.map((e) => e.own ? { sub: null, id: e.own.id } : { sub: e.imported!.subscriptionId, id: e.imported!.remoteId }));
  const byKey = new Map(linkable.map((e, i) => [e.key, summaries[i]]));
  return c.json({ ...page, items: page.items.map((e) => byKey.has(e.key) ? { ...e, lineage: byKey.get(e.key) } : e) });
});
// One hop of lineage around an item, for the hex view. `sub` names an imported
// item's subscription ("own" or absent for ours); `origin` re-centres on any
// node a lineage named, held here or not.
readApi.openapi(routes.getLineage, async (c) => {
  const ourOrigin = siteOrigin(await getSettings(c.env.DB), c.req.url, normalizeMount(c.env.MOUNT));
  const sub = c.req.query("sub");
  let origin = normalizeOrigin(c.req.query("origin")) ?? ourOrigin;
  if (sub && sub !== "own") {
    const row = await getSubscription(c.env.DB, sub);
    if (!row) return c.json({ error: "no such subscription" }, 404);
    origin = normalizeOrigin(row.origin) ?? row.origin;
  }
  return c.json(await lineageOf(c.env.DB, ourOrigin, origin, c.req.query("id") ?? ""));
});
function readingKind(raw: string | undefined): "thread" | "fragment" | undefined {
  return raw === "thread" || raw === "fragment" ? raw : undefined;
}
readApi.openapi(routes.getImportedItem, async (c) => {
  const row = await getImportedItem(c.env.DB, c.req.param("sub"), c.req.param("id"));
  return row ? c.json(importedResource({ ...row, content_html: await sanitizeHtml(row.content_html) })) : c.json({ error: "not found" }, 404);
});
// History of an imported item (#40), read from its origin on demand. Blyg
// subscriptions only: an L0 feed has no item documents and no versions.
async function blygSubscription(db: D1Database, id: string) {
  const sub = await getSubscription(db, id);
  return sub && sub.kind === "blyg" ? sub : null;
}
readApi.openapi(routes.getImportedHistory, async (c) => {
  const sub = await blygSubscription(c.env.DB, c.req.param("sub"));
  if (!sub) return c.json({ error: "not a blyg subscription" }, 404);
  const got = await fetchImportedHistory(platformFetch, sub, c.req.param("id"));
  return got.ok ? c.json(got.value) : c.json({ error: got.error }, got.status);
});
readApi.openapi(routes.getImportedVersion, async (c) => {
  const sub = await blygSubscription(c.env.DB, c.req.param("sub"));
  if (!sub) return c.json({ error: "not a blyg subscription" }, 404);
  const got = await fetchPublicVersion(platformFetch, sub, c.req.param("id"), Number(c.req.param("v")));
  return got.ok ? c.json(got.value) : c.json({ error: got.error }, got.status);
});
readApi.openapi(routes.getUpdateState, async (c) => {
  const [settings, map] = await Promise.all([getSettings(c.env.DB), getSettingsMap(c.env.DB)]);
  c.executionCtx.waitUntil(maybeCheckForUpdate(c.env.DB, settings, map, Date.now()).catch(() => {}));
  return c.json(Object.fromEntries(Object.entries(map).filter(([key]) => key.startsWith("update_"))));
});
readApi.openapi(routes.getMentionSource, async (c) => {
  const row = await getInbound(c.env.DB, c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  const holder = await c.env.DB.prepare("SELECT s.id AS id FROM imported_items ii JOIN subscriptions s ON s.id = ii.subscription_id WHERE ii.remote_id = ? AND s.origin = ? LIMIT 1").bind(row.source_id, row.source_origin).first<{ id: string }>();
  const subscription = (await listSubscriptions(c.env.DB)).find((s) => s.origin === row.source_origin) ?? null;
  return c.json({ holder: holder?.id ?? null, subscription: subscription ? subscriptionResource(subscription) : null });
});
readApi.openapi(routes.getForkOptions, async (c) => {
  const settings = await getSettings(c.env.DB), mount = normalizeMount(c.env.MOUNT);
  const ourOrigin = siteOrigin(settings, c.req.url, mount);
  const sub = c.req.query("sub");
  const fromSub = sub ? (await listSubscriptions(c.env.DB)).find((s) => s.id === sub)?.origin : undefined;
  const origin = normalizeOrigin(fromSub ?? c.req.query("origin")) ?? ourOrigin;
  const result = await forkablePins(c.env.DB, origin, c.req.query("id") ?? "", ourOrigin);
  return c.json({ ...result, origin, ourOrigin });
});
readApi.openapi(routes.preview, async (c) => {
  const mount = normalizeMount(c.env.MOUNT);
  const body = await readJson<{ content_md?: string }>(c);
  if ((body as { kind?: string }).kind === "thread") return threadPreview(c);
  const tk = annotateTkPreview(body.content_md ?? "");
  // `[[id]]` resolves in the preview too, so an unresolvable link is visible
  // before publish rejects it — same contract as an unresolvable directive.
  const origin = siteOrigin(await getSettings(c.env.DB), c.req.url, mount);
  const links = await previewInternalLinks(c.env.DB, tk.text, origin);
  // Links inside generated blocks resolve here too, as at publish (studio#14).
  const blocks = await resolveBlockLinks(tk.blocks, (html) => previewInternalLinks(c.env.DB, html, origin, true));
  const html = [links, ...blocks.docs].reduce((acc, doc) => applyInternalLinks(acc, doc), tk.finish(renderMarkdown(links.text)));
  return c.json({ html, scopes: scopeSummaries(tk.scopes), link_errors: [...links.errors, ...blocks.errors] });
});

/**
 * Read one past version for the editor's history viewer. Studio-only: the
 * stored `content_html` of any version, pinned or not — unlike the public
 * `items/{id}/vN.json` surface, which serves pinned versions only (§2.8).
 * Reading history locally is not the same act as promising it publicly.
 */
readApi.openapi(routes.getVersion, async (c) => {
  const item = await getItem(c.env.DB, c.req.param("id"));
  if (!item) return c.json({ error: "not found" }, 404);
  const version = Number(c.req.param("v"));
  const row = await getVersion(c.env.DB, item.id, version);
  if (!row) return c.json({ error: "version not found" }, 404);
  return c.json(versionResource(row));
});

/**
 * The bracket palette's candidate list (§3.2). Searches everything v0.3 lets a
 * thread transclude: own published items of **either** kind (nesting is legal
 * from this version) and imported blyg items (`current`, non-L0) — which is
 * what makes quoting follow reading. The route keeps its 0.1 name; only its
 * subject widened.
 *
 * One list serves both bracket forms, and that is not a convenience: `[[id]]`
 * resolves through `resolveTarget` too — "by the same order", §16.2 — so the
 * set of ids a link can name *is* the set a directive can name. A second
 * endpoint would be a second copy of that rule, free to drift from it.
 */
const SEARCH_PAGE = 20;

readApi.openapi(routes.search, async (c) => {
  const q = (c.req.query("q") ?? "").toLowerCase();
  const items = await listAll(c.env.DB);
  const results: { id: string; excerpt: string; version: number; updated: string; badge: string }[] = [];
  const matches = (excerpt: string, id: string) => !q || excerpt.toLowerCase().includes(q) || id.includes(q);
  for (const item of items) {
    if (item.status !== "public" || (item.kind !== "fragment" && item.kind !== "thread")) continue;
    const latest = await publishedVersion(c.env.DB, item);
    if (!latest) continue;
    // From rendered HTML, not markdown source — the picker showed literal
    // "#"/"*" markers otherwise, same bug class as the index rows.
    const excerpt = clampText(plainTextFromHtml(latest.content_html ?? ""), 70) || excerptOf(latest.content_md, 70);
    if (!matches(excerpt, item.id)) continue;
    results.push({ id: item.id, excerpt, version: item.version, updated: item.updated, badge: item.kind });
  }
  const imported = await c.env.DB.prepare(
    `SELECT ii.remote_id AS id, ii.content_html AS html, ii.version AS version, ii.observed_at AS updated,
            ii.state AS state, ii.pinned_version_retained AS retained, s.title AS title, s.origin AS origin
     FROM imported_items ii JOIN subscriptions s ON s.id = ii.subscription_id
     WHERE ii.l0 = 0`,
  ).all<{ id: string; html: string; version: number; updated: string; state: string; retained: number | null; title: string; origin: string }>();
  for (const row of imported.results) {
    // Exactly what resolveTarget will accept at publish, so the picker never
    // offers something the author then can't publish.
    if (row.state !== "current" && row.retained === null) continue;
    const excerpt = clampText(plainTextFromHtml(row.html ?? ""), 70);
    if (!matches(excerpt, row.id)) continue;
    results.push({
      id: row.id,
      excerpt,
      version: row.state === "current" ? row.version : (row.retained as number),
      updated: row.updated,
      badge: row.title || new URL(row.origin).host,
    });
  }
  results.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  // Paged, and the page reports the total. The 20-cap used to be applied
  // silently, so a blyg with more than 20 quotable items had a picker that
  // simply stopped — indistinguishable from having nothing more to offer, and
  // the reason the ceiling was reported as a bug rather than noticed as a
  // limit. `total` is what lets the palette say "20 of 63" instead of lying by
  // omission.
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);
  const limit = Number(c.req.query("limit") ?? SEARCH_PAGE);
  return c.json({ items: results.slice(offset, offset + limit), total: results.length, offset, limit });
});


async function threadPreview(c: Context<{ Bindings: Env }>) {
  const body = await readJson<{ content_md?: string; item_id?: string }>(c);
  const tk = annotateTkPreview(body.content_md ?? "");
  // item_id is the thread being edited — the DAG check needs it, so the
  // preview rejects a circular quote at exactly the point publish would.
  const mount = normalizeMount(c.env.MOUNT);
  const origin = siteOrigin(await getSettings(c.env.DB), c.req.url, mount);
  const links = await previewInternalLinks(c.env.DB, tk.text, origin);
  const blocks = await resolveBlockLinks(tk.blocks, (html) => previewInternalLinks(c.env.DB, html, origin, true));
  const resolved = await previewTransclusions(c.env.DB, links.text, body.item_id);
  return c.json({
    html: [links, ...blocks.docs].reduce((acc, doc) => applyInternalLinks(acc, doc), tk.finish(resolved.html)),
    errors: [...resolved.errors, ...links.errors, ...blocks.errors],
    transclusions: resolved.transclusions,
    scopes: scopeSummaries(tk.scopes),
  });
}
async function forkablePins(
  db: D1Database,
  origin: string,
  id: string,
  ourOrigin: string,
): Promise<{ versions: { version: number; at: string; note: string | null }[]; error?: string }> {
  if (!id) return { versions: [], error: "no item named" };
  if (origin === ourOrigin) {
    const rows = await listVersions(db, id);
    return {
      versions: rows
        .filter((v) => v.pinned === 1 && v.content_md)
        .map((v) => ({ version: v.version, at: v.published_at, note: v.note })),
    };
  }
  let res;
  try {
    res = await mentionFetch(`${origin}items/${id}.json`);
  } catch (e) {
    return { versions: [], error: `could not reach ${origin}: ${(e as Error).message}` };
  }
  if (!res.ok) return { versions: [], error: `${origin}items/${id}.json returned ${res.status}` };
  try {
    const doc = JSON.parse(await res.text()) as { changelog?: { version: number; at: string; note: string | null; pinned?: boolean }[] };
    const log = Array.isArray(doc.changelog) ? doc.changelog : [];
    return { versions: log.filter((v) => v.pinned === true).map((v) => ({ version: v.version, at: v.at, note: v.note ?? null })) };
  } catch {
    return { versions: [], error: "that origin's item document could not be parsed" };
  }
}
