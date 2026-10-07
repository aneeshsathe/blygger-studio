// Index reconciler + poll cycle — v0.2-plan.md §3.1/§3.2, locked decision
// #18. The archive index is the reconciliation surface; the feed is a cheap
// trigger. See §3.1's three invariants: item documents are ground truth,
// the watermark never silently regresses, and retention past withdrawal
// follows the origin's own serving surface (task 10 layers that last one on
// top of rollup-null via `applyEffect`'s `retainPinnedVersion`).

import { absolutizeHtml, contentHash, nowIso } from "../util.ts";
import { parseFeed } from "./feed.ts";
import type { FetchLike, FetchResult } from "./http.ts";
import { platformFetch } from "./http.ts";
import { pollL0Subscription } from "./l0.ts";
import { appendFlag, applyEffect, getImportedItem, listHoppersForItem, recordIndexSync, recordPollFailure, recordPollSuccess, refreshSourceTitle, toLocalState } from "./store.ts";
import { transition } from "./transition.ts";
import { mapLimit } from "./util.ts";
import type { SubscriptionRow } from "../types.ts";

const INDEX_SYNC_PERIOD_MS = 24 * 3600 * 1000;
const RECONCILE_CONCURRENCY = 4;

/**
 * Fetch one item document and run it through the transition function,
 * persisting the effect and any discrepancy flags. Shared by the feed
 * trigger-set loop and index reconciliation — both just differ in how they
 * discover candidate (remoteId, itemUrl) pairs.
 */
async function processItemCandidate(
  db: D1Database,
  sub: SubscriptionRow,
  fetchFn: FetchLike,
  remoteId: string,
  itemUrl: string,
  observedAt: string,
): Promise<{ processed: boolean }> {
  let res: FetchResult;
  try {
    res = await fetchFn(itemUrl);
  } catch {
    return { processed: false };
  }
  if (!res.ok) return { processed: false };
  let raw: unknown;
  try {
    raw = JSON.parse(await res.text());
  } catch {
    await appendFlag(db, sub.id, "unparseable", remoteId);
    return { processed: false };
  }
  // Relative URLs in a fetched item's HTML are the origin's, not ours: resolve
  // them before storing, or every image a publisher wrote as `/media/x.png`
  // renders against our host in the reading view (session 30). §5.4 makes media
  // URLs relative to the origin. Change detection is on content_md's hash, so
  // this never makes an unchanged item look changed.
  if (raw && typeof raw === "object" && typeof (raw as { content_html?: unknown }).content_html === "string") {
    const doc = raw as { content_html: string };
    doc.content_html = absolutizeHtml(doc.content_html, sub.origin);
  }
  const localRow = await getImportedItem(db, sub.id, remoteId);
  const local = toLocalState(localRow);
  const result = transition({ local, doc: raw, storedContentHash: localRow?.content_hash ?? undefined });
  for (const flag of result.flags) await appendFlag(db, sub.id, flag, remoteId);
  // §3.3 notes: content_hash SHOULD be verified against content_md on import —
  // an integrity check on the origin's own claim, not a security boundary;
  // content is adopted either way (transition() already decided that).
  if ("doc" in result.effect) {
    const expected = await contentHash(result.effect.doc.content_md);
    if (result.effect.doc.content_hash && result.effect.doc.content_hash !== expected) {
      await appendFlag(db, sub.id, "hash-mismatch", remoteId);
    }
  }
  if (result.effect.type === "rollup-null" && localRow) {
    const retainPinnedVersion = await pinnedVersionToRetain(db, sub, fetchFn, remoteId, localRow.version);
    await applyEffect(db, sub.id, remoteId, result.effect, observedAt, { retainPinnedVersion });
  } else {
    await applyEffect(db, sub.id, remoteId, result.effect, observedAt);
  }
  return { processed: true };
}

/**
 * §3.4: on withdrawal roll-up, hopper entries downgrade to a placeholder —
 * *unless* the snapshot version is confirmed pinned on the origin, in which
 * case retention is conformant (invariant 3). Only checked for hopper-
 * tracked items (the only place this distinction is user-visible); one
 * extra fetch, at withdrawal-processing time only.
 */
async function pinnedVersionToRetain(
  db: D1Database,
  sub: SubscriptionRow,
  fetchFn: FetchLike,
  remoteId: string,
  lastKnownVersion: number,
): Promise<number | undefined> {
  const hoppers = await listHoppersForItem(db, sub.id, remoteId);
  if (!hoppers.length) return undefined;
  try {
    const res = await fetchFn(`${sub.origin}items/${remoteId}/v${lastKnownVersion}.json`);
    return res.ok ? lastKnownVersion : undefined;
  } catch {
    return undefined;
  }
}

/** Full index diff (§3.1): total reconciliation, recovers losslessly from any gap regardless of cause. */
export async function reconcileIndex(db: D1Database, sub: SubscriptionRow, fetchFn: FetchLike = platformFetch): Promise<{ ok: boolean; changed: number }> {
  let res: FetchResult;
  try {
    res = await fetchFn(`${sub.origin}items/index.json`);
  } catch {
    return { ok: false, changed: 0 };
  }
  if (!res.ok) {
    // A 404 on items/index.json from an otherwise-live blyg is a nonconforming
    // publisher — fall back to feed-window-only operation (the caller's feed
    // pass already ran independently of this), flag it once.
    if (res.status === 404) await appendFlag(db, sub.id, "lossy-mode", "items/index.json 404");
    return { ok: false, changed: 0 };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await res.text());
  } catch {
    return { ok: false, changed: 0 };
  }
  const items = Array.isArray((parsed as Record<string, unknown>)?.items) ? ((parsed as Record<string, unknown>).items as unknown[]) : [];
  const candidates: { id: string }[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const it = raw as Record<string, unknown>;
    if (typeof it.id !== "string" || typeof it.version !== "number") continue;
    const local = await getImportedItem(db, sub.id, it.id);
    const watermark = local ? local.version : 0;
    if (it.version > watermark) candidates.push({ id: it.id });
  }
  const observedAt = nowIso();
  const outcomes = await mapLimit(candidates, RECONCILE_CONCURRENCY, async (c) => {
    const r = await processItemCandidate(db, sub, fetchFn, c.id, `${sub.origin}items/${c.id}.json`, observedAt);
    return r.processed;
  });
  await recordIndexSync(db, sub.id);
  return { ok: true, changed: outcomes.filter(Boolean).length };
}

export interface PollResult {
  outcome: "not-modified" | "polled" | "failed" | "skipped";
  itemsFetched: number;
  reconciled: boolean;
}

/** One §3.2 poll cycle for a single subscription. `sub.kind === "rss"` defers entirely to the L0 wrapper (§3.5). */
async function refreshManifestTitle(db: D1Database, sub: SubscriptionRow, fetchFn: FetchLike): Promise<void> {
  if (sub.title_auto === 0) return;
  try {
    const res = await fetchFn(sub.origin + "blyg.json", { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const manifest = JSON.parse(await res.text()) as { title?: unknown };
    if (typeof manifest.title === "string") await refreshSourceTitle(db, sub.id, manifest.title);
  } catch {
    // A missing or malformed manifest leaves the name as it was; the poll goes on.
  }
}

export async function pollSubscription(db: D1Database, sub: SubscriptionRow, fetchFn: FetchLike = platformFetch): Promise<PollResult> {
  if (sub.kind !== "blyg") {
    const r = await pollL0Subscription(db, sub, fetchFn);
    return { outcome: r.outcome, itemsFetched: r.itemsChanged, reconciled: false };
  }

  const headers: Record<string, string> = {};
  if (sub.etag) headers["If-None-Match"] = sub.etag;
  if (sub.last_modified) headers["If-Modified-Since"] = sub.last_modified;

  let res: FetchResult;
  try {
    res = await fetchFn(sub.feed_url, { headers });
  } catch {
    // Failure path: never touch imported_items, only the subscription's own bookkeeping.
    await recordPollFailure(db, sub.id);
    return { outcome: "failed", itemsFetched: 0, reconciled: false };
  }

  if (!res.ok && res.status !== 304) {
    await recordPollFailure(db, sub.id);
    return { outcome: "failed", itemsFetched: 0, reconciled: false };
  }

  const wasDegraded = sub.status === "degraded";
  const periodicOrFirstSync = !sub.last_index_sync_at || Date.now() - Date.parse(sub.last_index_sync_at) >= INDEX_SYNC_PERIOD_MS;
  // A blyg's name lives in its manifest. Re-read it with the daily sync: one
  // small request a day, and a rename shows up within a day.
  if (periodicOrFirstSync) await refreshManifestTitle(db, sub, fetchFn);

  if (res.status === 304) {
    // An unchanged feed says nothing about the index, so the daily sync still
    // runs. Returning before it starved every origin that honours ETags: a
    // subscription whose first sync failed never synced, and never re-read its
    // name (Sachin Benny's blyg, session 37). No entries, so no gap check.
    let reconciled = false, itemsFetched = 0;
    if (periodicOrFirstSync || wasDegraded) {
      const r = await reconcileIndex(db, sub, fetchFn);
      reconciled = r.ok;
      itemsFetched = r.changed;
    }
    await recordPollSuccess(db, sub.id, { etag: sub.etag, lastModified: sub.last_modified });
    return { outcome: "not-modified", itemsFetched, reconciled };
  }

  const etag = res.headers.get("ETag");
  const lastModified = res.headers.get("Last-Modified");
  const body = await res.text();
  const parsed = parseFeed(body);
  const observedAt = nowIso();

  let itemsFetched = 0;
  let newestGuid: string | null = null;

  if (parsed.ok) {
    newestGuid = parsed.entries[0]?.guid ?? null;
    for (const entry of parsed.entries) {
      // Entries without blyg:* on a blyg subscription are ignored (§3.2 step 2).
      if (!entry.blyg) continue;
      const local = await getImportedItem(db, sub.id, entry.blyg.id);
      const watermark = local ? local.version : 0;
      const stale = entry.blyg.version === undefined || entry.blyg.version > watermark;
      if (!stale) continue;
      const itemUrl = entry.blyg.itemUrl || `${sub.origin}items/${entry.blyg.id}.json`;
      const r = await processItemCandidate(db, sub, fetchFn, entry.blyg.id, itemUrl, observedAt);
      if (r.processed) itemsFetched++;
    }
  }

  // Gap check + the other unconditional reconciliation triggers (§3.2 step 4).
  // A gap alone triggers the index diff (§13.2: "any suspected gap … falls
  // back to an index diff"). The v0.2 plan also required a non-empty trigger
  // set, which left a reader stale until the periodic sync whenever the feed
  // dropped every new entry (studio#27). The cost is one index fetch on a rare
  // poll; the next poll records the new newest GUID, so it does not repeat.
  const gap = !!sub.newest_guid && parsed.ok && !parsed.entries.some((e) => e.guid === sub.newest_guid);
  const shouldReconcile = !parsed.ok || gap || periodicOrFirstSync || wasDegraded;

  let reconciled = false;
  if (shouldReconcile) {
    const r = await reconcileIndex(db, sub, fetchFn);
    reconciled = r.ok;
    itemsFetched += r.changed;
  }

  await recordPollSuccess(db, sub.id, { etag, lastModified, newestGuid });
  return { outcome: "polled", itemsFetched, reconciled };
}
