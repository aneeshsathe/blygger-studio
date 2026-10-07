import { feedUrl as surfaceFeedUrl, surfaceFromManifest } from "../surface.ts";
import { platformFetchFor } from "./http.ts";
import type { SubscriptionRow, HopperRow } from "../types.ts";
import { subscriptionResource, hopperResource } from "../contract/resources.ts";
import { contractApp, readJson } from "../contract/app.ts";
import { routes } from "../contract/routes.ts";
// Subscribe-side owner API (cookie auth, JSON) — v0.2-plan.md §4.2. Mounted
// alongside ../api.ts under /api.



import { pollSubscription, reconcileIndex } from "./poll.ts";
import { pollAll } from "./schedule.ts";
import { listSubscriptions } from "./store.ts";
import { markRead, markReadBatch, READ_ID_MAX, type ReadMark } from "./read-state.ts";
import { resolve } from "./resolve.ts";
import {
  addHopperItem,
  createHopper,
  createSubscription,
  findSubscription,
  deleteHopper,
  deleteSignal,
  deleteSubscription,
  getHopper,
  getHopperBySlug,
  getSubscription,
  removeHopperItem,
  setSignal,
} from "./store.ts";

export const importerApi = contractApp();

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Two-phase add-by-URL (§2.1/§4.2): without `confirm`, resolves and returns
 * the identity for the owner to confirm (surfacing any site-vs-origin
 * mismatch); with `confirm: true`, actually creates the subscription and
 * starts an initial backfill so the first read isn't empty. The backfill runs
 * after the response: it fetches the whole archive item by item, which held
 * the confirm button for many seconds on a large blyg.
 */
importerApi.openapi(routes.createSubscription, async (c) => {
  const body = await readJson<{ url: string; confirm?: boolean; title?: string }>(c);
  if (!body.url.trim()) return c.json({ error: "url required" }, 400);

  const result = await resolve(body.url.trim(), platformFetchFor(c.env));
  if (result.kind === "failure") {
    return c.json({ error: "could not resolve this URL to a blyg or a feed", tried: result.tried }, 422);
  }

  // One subscription per source: a second one imports every item twice, and
  // then any reference to those ids is ambiguous between the two (stub refuses).
  // §16.6e: the manifest says where the surface lives; absent keys are the defaults.
  const surface = result.kind === "blyg" ? surfaceFromManifest(result.origin, result.manifestUrl, result.manifest) : null;
  const feedUrl = result.kind === "blyg" ? surfaceFeedUrl(result.origin, surface) : result.feedUrl;
  const identity = result.kind === "blyg" ? result.origin : result.feedUrl;
  const existing = await findSubscription(c.env.DB, identity, feedUrl);
  if (existing) return c.json({ error: `already subscribed to ${existing.title || existing.origin}` }, 409);

  if (!body.confirm) {
    if (result.kind === "blyg") {
      return c.json({
        needsConfirm: true,
        kind: "blyg",
        origin: result.origin,
        title: typeof result.manifest.title === "string" ? result.manifest.title : titleFromUrl(result.origin),
        siteMismatch: result.siteMismatch,
      });
    }
    return c.json({ needsConfirm: true, kind: "rss", feedUrl: result.feedUrl, title: titleFromUrl(result.feedUrl) });
  }

  const title = body.title?.trim() || undefined;
  // The confirm dialog offers the source's own name; sending it back unchanged
  // keeps the subscription following the source. Anything else is the owner's.
  const sourceTitle = result.kind === "blyg" ? (typeof result.manifest.title === "string" ? result.manifest.title : titleFromUrl(result.origin)) : titleFromUrl(result.feedUrl);
  const titleAuto = title === undefined || title === sourceTitle.trim();
  const sub =
    result.kind === "blyg"
      ? await createSubscription(c.env.DB, { kind: "blyg", origin: result.origin, feedUrl, title: title ?? sourceTitle, titleAuto, surface })
      : await createSubscription(c.env.DB, { kind: "rss", origin: result.feedUrl, feedUrl: result.feedUrl, title: title ?? sourceTitle, titleAuto });
  // Initial backfill (§3.2 step 4 / plan §7 open decision #2: import the full
  // archive on first subscribe) — a fresh subscription's null
  // last_index_sync_at makes the very first pollSubscription() call reconcile
  // unconditionally, which also bootstraps newest_guid/etag for future gap
  // detection (§3.2) in one pass, for both kinds uniformly. If waitUntil cuts
  // it short, the null last_poll_at and last_index_sync_at make the next
  // scheduled poll due and reconcile again, so the backfill completes there.
  c.executionCtx.waitUntil(pollSubscription(c.env.DB, sub, platformFetchFor(c.env)).catch(() => {}));
  c.header("Location", `/api/subscriptions/${sub.id}`);
  return c.json(subscriptionResource(sub), 201);
});

importerApi.openapi(routes.updateSubscription, async (c) => {
  const sub = await getSubscription(c.env.DB, c.req.param("id"));
  if (!sub) return c.json({ error: "not found" }, 404);
  const body = await readJson<{ in_blogroll?: boolean; title?: string | null; paused?: boolean }>(c);
  const assignments: string[] = [], values: (string | number)[] = [];
  // A name of the owner's own stops the refresh; null hands it back to the source.
  if (typeof body.title === "string") { assignments.push("title = ?", "title_auto = 0"); values.push(body.title); }
  if (body.title === null) assignments.push("title_auto = 1", "last_index_sync_at = NULL");
  if (body.in_blogroll !== undefined) { assignments.push("in_blogroll = ?"); values.push(body.in_blogroll ? 1 : 0); }
  if (body.paused !== undefined) { assignments.push("status = ?"); values.push(body.paused ? "paused" : "active"); }
  if (!assignments.length) return c.json(subscriptionResource(sub));
  const fresh = await c.env.DB.prepare(`UPDATE subscriptions SET ${assignments.join(", ")} WHERE id = ? RETURNING *`).bind(...values, sub.id).first<SubscriptionRow>();
  return fresh ? c.json(subscriptionResource(fresh)) : c.json({ error: "subscription no longer exists" }, 404);
});

/** Poll every subscription that is not paused, in the background; answers at once with how many. */
importerApi.openapi(routes.pollAllSubscriptions, async (c) => {
  const polling = (await listSubscriptions(c.env.DB)).filter((s) => s.status !== "paused").length;
  c.executionCtx.waitUntil(pollAll(c.env.DB, platformFetchFor(c.env)).catch(() => {}));
  return c.json({ polling });
});

/** Force an index reconciliation right now, regardless of the periodic schedule. */
importerApi.openapi(routes.resyncSubscription, async (c) => {
  const sub = await getSubscription(c.env.DB, c.req.param("id"));
  if (!sub) return c.json({ error: "not found" }, 404);
  if (sub.kind !== "blyg") return c.json({ error: "resync only applies to blyg subscriptions" }, 409);
  const result = await reconcileIndex(c.env.DB, sub, platformFetchFor(c.env));
  return c.json({ ok: result.ok, changed: result.changed });
});

importerApi.openapi(routes.deleteSubscription, async (c) => {
  const sub = await getSubscription(c.env.DB, c.req.param("id"));
  if (!sub) return c.json({ error: "not found" }, 404);
  await deleteSubscription(c.env.DB, sub.id);
  return c.json({ ok: true });
});

// --- Hoppers + signals (task 10, §3.4/§4.2) ---

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "hopper"
  );
}

/** Slugify, then disambiguate against every other hopper's slug (`exceptId` lets a rename keep its own). */
async function uniqueSlug(db: D1Database, name: string, exceptId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await getHopperBySlug(db, slug);
    if (!clash || clash.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

importerApi.openapi(routes.createHopper, async (c) => {
  const body = await readJson<{ name: string }>(c);
  if (!body.name.trim()) return c.json({ error: "name required" }, 400);
  const hopper = await createHopper(c.env.DB, body.name.trim(), await uniqueSlug(c.env.DB, body.name.trim()));
  c.header("Location", `/api/hoppers/${hopper.id}`);
  return c.json(hopperResource(hopper), 201);
});

importerApi.openapi(routes.updateHopper, async (c) => {
  const hopper = await getHopper(c.env.DB, c.req.param("id"));
  if (!hopper) return c.json({ error: "not found" }, 404);
  const body = await readJson<{ public?: boolean; name?: string; description?: string }>(c);
  // An empty description clears it; an absent one leaves it alone.
  const description = body.description === undefined ? undefined : body.description.trim() || null;

  // Compute the rename before freezing the public URL. Apply both in one SQL update.
  const slug = body.name === undefined || hopper.slug_frozen ? hopper.slug : await uniqueSlug(c.env.DB, body.name, hopper.id);
  const fresh = await c.env.DB.prepare("UPDATE hoppers SET name = COALESCE(?, name), slug = ?, public = COALESCE(?, public), slug_frozen = MAX(slug_frozen, ?), description = CASE WHEN ? THEN ? ELSE description END WHERE id = ? AND slug_frozen = ? AND slug IS ? RETURNING *")
    .bind(body.name ?? null, slug, body.public === undefined ? null : Number(body.public), Number(body.public === true), description === undefined ? 0 : 1, description ?? null, hopper.id, hopper.slug_frozen, hopper.slug).first<HopperRow>();
  return fresh ? c.json(hopperResource(fresh)) : c.json({ error: "hopper changed while applying the patch; reload and try again" }, 409);
});

importerApi.openapi(routes.deleteHopper, async (c) => {
  const hopper = await getHopper(c.env.DB, c.req.param("id"));
  if (!hopper) return c.json({ error: "not found" }, 404);
  await deleteHopper(c.env.DB, hopper.id);
  return c.json({ ok: true });
});

importerApi.openapi(routes.addHopperItem, async (c) => {
  const hopper = await getHopper(c.env.DB, c.req.param("id"));
  if (!hopper) return c.json({ error: "hopper not found" }, 404);
  const sub = await getSubscription(c.env.DB, c.req.param("sub"));
  if (!sub) return c.json({ error: "subscription not found" }, 404);
  await addHopperItem(c.env.DB, hopper.id, sub.id, c.req.param("remoteId"));
  return c.json({ ok: true });
});

importerApi.openapi(routes.removeHopperItem, async (c) => {
  const hopper = await getHopper(c.env.DB, c.req.param("id"));
  if (!hopper) return c.json({ error: "hopper not found" }, 404);
  await removeHopperItem(c.env.DB, hopper.id, c.req.param("sub"), c.req.param("remoteId"));
  return c.json({ ok: true });
});

importerApi.openapi(routes.setSignal, async (c) => {
  const sub = await getSubscription(c.env.DB, c.req.param("sub"));
  if (!sub) return c.json({ error: "subscription not found" }, 404);
  const body = await readJson<{ thumb: 1 | -1 }>(c);
  await setSignal(c.env.DB, sub.id, c.req.param("remoteId"), body.thumb);
  return c.json({ ok: true });
});

importerApi.openapi(routes.deleteSignal, async (c) => {
  await deleteSignal(c.env.DB, c.req.param("sub"), c.req.param("remoteId"));
  return c.json({ ok: true });
});

// Read state (read-state.ts). An unknown subscription or item is 200 with
// `stored: false`, never 404: clients take a 404 here to mean the server
// keeps no read state, and turn sync off.
importerApi.openapi(routes.markRead, async (c) => {
  const sub = c.req.param("sub"), remoteId = c.req.param("remoteId");
  if (sub.length > READ_ID_MAX || remoteId.length > READ_ID_MAX) return c.json({ error: "id too long" }, 400);
  const { version } = await readJson<{ version: number }>(c);
  const stored = await markRead(c.env.DB, sub, remoteId, version);
  return c.json({ ok: true, stored: stored !== null, read_version: stored }, 200);
});

// The whole list is validated before anything is written, and the writes are
// one batch: one request, one transaction, one unit of the write budget.
importerApi.openapi(routes.markReadBatch, async (c) => {
  const { items } = await readJson<{ items: ReadMark[] }>(c);
  await markReadBatch(c.env.DB, items);
  return c.json({ ok: true, received: items.length }, 200);
});
