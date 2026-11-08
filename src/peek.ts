// Reading an item the owner does not subscribe to, and telling which links in
// an entry lead to blyg items at all (0.49.0). Both exist so the reader can
// follow a stub stack down into other people's blygs and back out without
// leaving the studio.
//
// Nothing here is stored as content. A peeked item is fetched, sanitized and
// returned; only the *answer* to "is this link a blyg item" is cached, and
// that cache and the browsing path stay studio-private (migration 0033).

import type { FetchLike } from "./importer/http.ts";
import { sanitizeHtml } from "./importer/sanitize.ts";
import { mapLimit } from "./importer/util.ts";
import { normalizeOrigin } from "./stub.ts";
import { fetchOnSurface, itemUrl } from "./surface.ts";

export interface PeekItem {
  origin: string;
  id: string;
  kind: "fragment" | "thread" | "withdrawn";
  version: number;
  content_html: string;
  page: string | null;
  /** Where the item reads on its own site: its declared `page`, else the document. */
  url: string;
  stub_of: unknown;
  forked_from: unknown;
  /** The subscription holding this origin, when there is one: the reader opens the held copy. */
  subscription_id: string | null;
}

export type PeekOutcome = { ok: true; value: PeekItem } | { ok: false; status: 400 | 404 | 502; error: string };

const ID_RE = /^[^\s\u0000-\u001f/]{1,256}$/;
const str = (v: unknown) => (typeof v === "string" ? v : null);

/** `page` may be absolute (§5.8); a relative one is relative to the origin. */
function pageUrl(origin: string, page: string | null): string | null {
  if (!page) return null;
  return /^https?:\/\//i.test(page) ? page : `${origin}${page.replace(/^\//, "")}`;
}

export async function peekItem(db: D1Database, fetchFn: FetchLike, rawOrigin: string, id: string): Promise<PeekOutcome> {
  const origin = normalizeOrigin(rawOrigin);
  if (!origin || !ID_RE.test(id)) return { ok: false, status: 400, error: "an origin and an item id are required" };
  let got;
  try {
    got = await fetchOnSurface(db, origin, fetchFn, (surface) => itemUrl(origin, surface, id), { headers: { Accept: "application/json" } });
  } catch (e) {
    return { ok: false, status: 502, error: `could not reach the origin: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (got.res.status === 404) return { ok: false, status: 404, error: "that blyg does not serve this item" };
  if (!got.res.ok) return { ok: false, status: 502, error: `the origin answered ${got.res.status}` };
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(await got.res.text());
  } catch {
    return { ok: false, status: 502, error: "the origin returned invalid JSON" };
  }
  const version = typeof doc.version === "number" && Number.isInteger(doc.version) && doc.version > 0 ? doc.version : null;
  if (!doc || doc.id !== id || version === null || !("blyg" in doc)) {
    return { ok: false, status: 502, error: "the origin's document does not describe this item" };
  }
  const kind = doc.kind === "thread" || doc.kind === "withdrawn" ? doc.kind : "fragment";
  const page = str(doc.page);
  const held = await db.prepare("SELECT id FROM subscriptions WHERE kind = 'blyg' AND origin = ? LIMIT 1").bind(origin).first<{ id: string }>();
  return {
    ok: true,
    value: {
      origin,
      id,
      kind,
      version,
      content_html: await sanitizeHtml(str(doc.content_html) ?? ""),
      page,
      url: pageUrl(origin, page) ?? got.url,
      stub_of: doc.stub_of ?? null,
      forked_from: doc.forked_from ?? null,
      subscription_id: held?.id ?? null,
    },
  };
}

/* ---------------- which links lead to blyg items ---------------- */

export interface LinkTarget {
  url: string;
  /** The item the link names, or null when it is not a blyg item. */
  target: { origin: string; id: string } | null;
}

export const CLASSIFY_MAX = 40;
const PROBE_TTL_MS = 7 * 24 * 3600 * 1000;
const PAGE_BYTES = 256 * 1024;
const ALTERNATE = /<link\b[^>]*>/gi;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[2] ?? m[3]) : null;
}

/** §5.8: a permalink page SHOULD carry `<link rel="alternate" type="application/json" href=item-document>`. */
export function alternateJsonHref(html: string, base: string): string | null {
  for (const tag of html.slice(0, PAGE_BYTES).match(ALTERNATE) ?? []) {
    if (attr(tag, "rel")?.toLowerCase().split(/\s+/).includes("alternate") && attr(tag, "type")?.toLowerCase().startsWith("application/json")) {
      const href = attr(tag, "href");
      if (!href) continue;
      try {
        return new URL(href.replace(/&amp;/g, "&"), base).toString();
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function probe(fetchFn: FetchLike, url: string): Promise<{ origin: string; id: string } | null> {
  try {
    const page = await fetchFn(url, { headers: { Accept: "text/html" } });
    if (!page.ok) return null;
    const href = alternateJsonHref(await page.text(), page.url || url);
    if (!href) return null;
    const res = await fetchFn(href, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const doc = JSON.parse(await res.text()) as Record<string, unknown>;
    const origin = normalizeOrigin(doc.origin);
    // The document must be served from the origin it claims (0.2 §12.2).
    if (!origin || typeof doc.id !== "string" || !("blyg" in doc) || !(res.url || href).startsWith(origin.replace(/[^/]*\/$/, ""))) return null;
    return { origin, id: doc.id };
  } catch {
    return null;
  }
}

async function known(db: D1Database, url: string, ownOrigin: string, now: string): Promise<{ origin: string; id: string } | null | undefined> {
  const own = new RegExp(`^${ownOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[ft]/([^/]+)/?$`).exec(url);
  if (own) return { origin: ownOrigin, id: own[1] };
  const held = await db
    .prepare(
      `SELECT s.origin AS origin, ii.remote_id AS id FROM imported_items ii JOIN subscriptions s ON s.id = ii.subscription_id
       WHERE s.kind = 'blyg' AND ii.l0 = 0 AND ii.page IS NOT NULL
         AND (ii.page = ?1 OR (ii.page NOT LIKE 'http%' AND s.origin || ltrim(ii.page, '/') = ?1)) LIMIT 1`,
    )
    .bind(url)
    .first<{ origin: string; id: string }>();
  if (held) return held;
  const cached = await db.prepare("SELECT origin, remote_id, checked_at FROM link_probe WHERE url = ?").bind(url).first<{ origin: string | null; remote_id: string | null; checked_at: string }>();
  if (cached && Date.parse(now) - Date.parse(cached.checked_at) < PROBE_TTL_MS) {
    return cached.origin && cached.remote_id ? { origin: cached.origin, id: cached.remote_id } : null;
  }
  return undefined;
}

export async function classifyLinks(db: D1Database, fetchFn: FetchLike, rawUrls: string[], ownOrigin: string, now: string): Promise<LinkTarget[]> {
  const urls = [...new Set(rawUrls)].slice(0, CLASSIFY_MAX).filter((u) => {
    try {
      return /^https?:$/.test(new URL(u).protocol);
    } catch {
      return false;
    }
  });
  return mapLimit(urls, 4, async (raw): Promise<LinkTarget> => {
    const u = new URL(raw);
    u.hash = "";
    const url = u.toString();
    let target = await known(db, url, ownOrigin, now);
    if (target === undefined) {
      target = await probe(fetchFn, url);
      await db
        .prepare("INSERT INTO link_probe (url, origin, remote_id, checked_at) VALUES (?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET origin = excluded.origin, remote_id = excluded.remote_id, checked_at = excluded.checked_at")
        .bind(url, target?.origin ?? null, target?.id ?? null, now)
        .run();
    }
    return { url: raw, target };
  });
}
