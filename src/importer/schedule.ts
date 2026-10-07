// Cron poller wiring — v0.2-plan.md §4.2: "every 15 min, poll subscriptions
// due (default interval 30 min per sub, jittered; backoff per §3.2)."
// Due-selection is a pure function (fake-clock testable); the actual cron
// trigger just calls runScheduledPoll with the real clock and fetch.

import type { SubscriptionRow } from "../types.ts";
import type { FetchLike } from "./http.ts";
import { platformFetch } from "./http.ts";
import { pollSubscription } from "./poll.ts";
import { backoffMs, mapLimit } from "./util.ts";
import { absolutizeHtml } from "../util.ts";
import { listSubscriptions } from "./store.ts";

export const POLL_INTERVAL_MS = 30 * 60 * 1000;
const JITTER_MS = 5 * 60 * 1000;
const DEGRADE_BACKOFF_CAP_MS = POLL_INTERVAL_MS * 8;
const POLL_CONCURRENCY = 4;

/** Deterministic per-subscription jitter in [-JITTER_MS, JITTER_MS] — spreads otherwise-synchronized subs across the interval, stable across runs (same id -> same offset). */
function jitterFor(subId: string): number {
  let h = 0;
  for (let i = 0; i < subId.length; i++) h = (h * 31 + subId.charCodeAt(i)) >>> 0;
  return (h % (2 * JITTER_MS + 1)) - JITTER_MS;
}

export function isDue(sub: SubscriptionRow, now: number): boolean {
  if (sub.status === "paused") return false;
  if (!sub.last_poll_at) return true;
  const last = Date.parse(sub.last_poll_at);
  if (sub.status === "degraded") {
    return now - last >= backoffMs(sub.fail_count, POLL_INTERVAL_MS, DEGRADE_BACKOFF_CAP_MS);
  }
  return now - last >= POLL_INTERVAL_MS + jitterFor(sub.id);
}

export function dueSubscriptions(subs: SubscriptionRow[], now: number): SubscriptionRow[] {
  return subs.filter((s) => isDue(s, now));
}

export interface ScheduledPollResult {
  due: number;
  polled: number;
}

/**
 * Heal blyg-native imports stored before 0.10.1 resolved their relative URLs
 * (session 30). Same pattern as session 18's L0 date repair: the poll skips
 * unchanged items, so rows already stored would never be rewritten by import
 * alone. Idempotent — a repaired row no longer matches the filter, which is
 * GLOB rather than LIKE so that protocol-relative `//host` URLs (correctly left
 * alone) cannot match forever and starve the per-run limit — and
 * bounded per run, so a large reading list heals over daily maintenance runs
 * instead of one long one. L0 rows are left alone: an RSS item's relative URLs
 * resolve against its own link, not the feed's origin, and §7 already
 * requires RSS HTML to be absolute.
 */
export async function repairImportedUrls(db: D1Database, limit = 200): Promise<number> {
  const rows = await db
    .prepare(
      `SELECT ii.subscription_id AS sub, ii.remote_id AS remote, ii.content_html AS html, s.origin AS origin
       FROM imported_items ii JOIN subscriptions s ON s.id = ii.subscription_id
       WHERE ii.l0 = 0 AND (ii.content_html GLOB '*src="/[^/]*' OR ii.content_html GLOB '*href="/[^/]*'
         OR ii.content_html GLOB '*src="media/*' OR ii.content_html GLOB '*href="media/*')
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ sub: string; remote: string; html: string; origin: string }>();
  let repaired = 0;
  for (const r of rows.results) {
    const fixed = absolutizeHtml(r.html, r.origin);
    if (fixed === r.html) continue;
    await db.prepare("UPDATE imported_items SET content_html = ? WHERE subscription_id = ? AND remote_id = ?").bind(fixed, r.sub, r.remote).run();
    repaired++;
  }
  return repaired;
}

/**
 * "Resync all feeds" (0.29): poll every subscription that is not paused, now,
 * whatever its schedule or backoff says. Degraded ones included: after an
 * outage this is the way back without waiting out hours of backoff.
 */
export async function pollAll(db: D1Database, fetchFn: FetchLike = platformFetch): Promise<number> {
  const subs = (await listSubscriptions(db)).filter((s) => s.status !== "paused");
  await mapLimit(subs, POLL_CONCURRENCY, (sub) => pollSubscription(db, sub, fetchFn));
  return subs.length;
}

/** Quarter-hour tick: select and poll due subscriptions, bounded concurrency. */
export async function runScheduledPoll(db: D1Database, fetchFn: FetchLike = platformFetch, now: number = Date.now()): Promise<ScheduledPollResult> {
  const subs = await listSubscriptions(db);
  const due = dueSubscriptions(subs, now);
  await mapLimit(due, POLL_CONCURRENCY, (sub) => pollSubscription(db, sub, fetchFn));
  return { due: due.length, polled: due.length };
}
