// D1 access for Webmention — v0.3-plan §2.3/§4.1, decision #28. Two queues
// that never mix: `mentions_out` is what we told other people, `mentions_in`
// is what other people told us. An inbound row is a *pointer* — source
// identity, relation, and where to find it — never any of their content.

import type { MentionInRow, MentionOutRow, MentionRelation } from "../types.ts";
import { newId, nowIso } from "../util.ts";

// §2.3.4. After the last step a row is `failed`; 4xx (except 429) skips
// straight there, and a missing endpoint never retries at all.
export const RETRY_SCHEDULE_MS = [15 * 60_000, 60 * 60_000, 4 * 60 * 60_000, 12 * 60 * 60_000, 24 * 60 * 60_000];

/** Rate limit (§2.3.5): at most this many mentions from one source host per hour, whatever their status. */
export const INBOUND_HOURLY_LIMIT = 60;

/**
 * The same window counted against the registrable domain instead of the host
 * (`self-host-plan.md` §9.1 gap 1). Wildcard DNS makes `a.spam.example` and
 * `b.spam.example` different hosts, so a per-host cap alone costs a flooder
 * one DNS label per 60 mentions and bounds nothing.
 *
 * Deliberately *higher* than the per-host cap rather than equal to it:
 * `registrableDomain` groups by heuristic and can over-collect (see there), and
 * a shared-hosting suffix we have not listed would otherwise cap every blyg
 * behind it collectively at the single-host number. Two busy hosts under one
 * real domain also stay inside it.
 */
export const INBOUND_DOMAIN_HOURLY_LIMIT = 120;

/**
 * And a cap on the endpoint as a whole (§9.1 gap 2). Per-source limiting bounds
 * no total: fifty domains sending 119 each sits inside both caps above while
 * spending up to 11,900 outbound fetches at URLs strangers chose — and the bill
 * for those is the deployer's, not the sender's. This is the only limit that
 * bounds what an accepted claim can cost in aggregate.
 *
 * 300/hour is ~5× the single-host cap and far above any real traffic: a blyg
 * with a busy week of responses sees a handful a day.
 */
export const INBOUND_GLOBAL_HOURLY_LIMIT = 300;

/**
 * The caps above all count rows, and a repeat claim for a pair already stored
 * adds none: the same POST can be sent forever, each time spending two outbound
 * fetches and flipping a verified mention back to pending. A pair claimed again
 * inside this window is refused, naming the wait (roadmap row 11).
 */
export const INBOUND_PAIR_COOLDOWN_MS = 60_000;

/**
 * A cap on claims awaiting verification. Verification runs after the response
 * and can die with it, leaving a row pending, so only rows touched within the
 * window count: a wedged row ages out instead of closing the endpoint forever.
 */
export const INBOUND_PENDING_LIMIT = 30;
export const INBOUND_PENDING_WINDOW_MS = 10 * 60_000;

/**
 * How long a `failed` inbound row is kept (§9.1 gap 3). `failed` is the status
 * of a claim that never verified — there is no relationship to remember, unlike
 * `gone`, which is kept forever on purpose — and no view reads these rows: the
 * studio lists `verified` and `gone` only. Without a prune they are an
 * unbounded write surface for anyone who can POST, which is everyone.
 *
 * 30 days rather than immediately, so that a spam wave is still legible in the
 * table while anyone is still looking at it.
 */
export const FAILED_INBOUND_RETENTION_MS = 30 * 24 * 60 * 60_000;

export function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Suffixes under which each subdomain is a *different* operator, so grouping by
 * "last two labels" would collapse unrelated blygs into one rate-limit bucket.
 * Two kinds: registry suffixes (`co.uk`), and hosting platforms where a
 * subdomain is the unit anyone gets (`pages.dev`, and `exe.xyz`, which is where
 * one of the live third-party nodes runs).
 *
 * This is a curated list, not the Public Suffix List — the PSL is ~230KB of
 * data that would have to ship in the Worker and be kept current, to serve one
 * rate limit. The failure direction is stated at `registrableDomain`.
 */
const MULTI_LABEL_SUFFIXES = new Set([
  // Hosting platforms: a subdomain per operator.
  "pages.dev", "workers.dev", "exe.xyz", "github.io", "gitlab.io", "netlify.app", "vercel.app",
  "fly.dev", "deno.dev", "web.app", "firebaseapp.com", "surge.sh", "neocities.org", "bearblog.dev",
  "micro.blog", "substack.com", "wordpress.com", "blogspot.com", "tumblr.com", "ghost.io",
  // Registry suffixes.
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "com.au", "net.au", "org.au", "co.nz", "co.jp",
  "or.jp", "ne.jp", "co.in", "com.br", "com.mx", "co.za", "com.cn", "com.tr", "com.ar", "co.kr",
  "com.sg", "com.hk", "co.il", "com.ua", "com.pl", "com.tw",
]);

/**
 * The registrable domain of a URL — eTLD+1 — by heuristic: the last two labels
 * of the hostname, or three when the last two are a known multi-label suffix.
 * An IP literal is its own domain; a hostname with fewer than two labels is
 * returned as-is.
 *
 * **Failure direction, stated because it is the point of the heuristic:** a
 * multi-label suffix we have *not* listed groups its subdomains together, so
 * independent sites under it share one bucket — which is why that bucket
 * (`INBOUND_DOMAIN_HOURLY_LIMIT`) sits above the per-host one, and why the
 * per-host cap is kept rather than replaced. The reverse error cannot happen:
 * a listed suffix never merges two real domains.
 */
export function registrableDomain(url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!hostname) return null;
  // IPv6 arrives bracketed; IPv4 is four numeric labels. Neither has a suffix.
  if (hostname.startsWith("[") || /^\d+(\.\d+){3}$/.test(hostname)) return hostname;
  const labels = hostname.replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_LABEL_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

/**
 * Queue one outbound mention. Keyed on (item_id, target), so a republish
 * updates the existing row rather than duplicating it.
 *
 * **What re-sends, and what does not** (§15.2, roadmap 1.7): delivery state is
 * reset only when the row is new, when the *target's* version changed, or when
 * the caller forces it. An unchanged reference keeps whatever status it already
 * reached — so editing a typo in a thread no longer re-notifies every origin it
 * quotes. Until migration 0011 this reset every row to `pending` unconditionally
 * and the spec's own sentence about the reference client was false.
 *
 * `IS NOT` rather than `<>` because the comparison has to be null-safe: a
 * `{url}` stub has no target version, and two NULLs must read as unchanged.
 *
 * `force` exists for exactly one caller — withdrawal (§15.7), which re-sends a
 * reference that has deliberately not changed, so the receiver re-verifies,
 * finds a withdrawn document and marks the mention gone. Without it the
 * "unchanged" rule would swallow the one notification a withdrawal owes.
 */
export async function enqueueOutbound(
  db: D1Database,
  itemId: string,
  version: number,
  target: string,
  targetVersion: number | null = null,
  opts: { force?: boolean; endpoint?: string } = {},
): Promise<void> {
  const force = opts.force ? 1 : 0;
  // A known endpoint fills an empty one only: a row that already found its
  // endpoint keeps it, as discovery at delivery would.
  const endpoint = opts.endpoint ?? null;
  await db
    .prepare(
      `INSERT INTO mentions_out (id, item_id, version, target, target_version, endpoint, status, attempts, next_attempt_at, last_error, created)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, NULL, ?)
       ON CONFLICT (item_id, target) DO UPDATE SET
         endpoint = COALESCE(mentions_out.endpoint, excluded.endpoint),
         version = excluded.version,
         target_version = excluded.target_version,
         status = CASE WHEN ? = 1 OR mentions_out.target_version IS NOT excluded.target_version THEN 'pending' ELSE mentions_out.status END,
         attempts = CASE WHEN ? = 1 OR mentions_out.target_version IS NOT excluded.target_version THEN 0 ELSE mentions_out.attempts END,
         next_attempt_at = CASE WHEN ? = 1 OR mentions_out.target_version IS NOT excluded.target_version THEN NULL ELSE mentions_out.next_attempt_at END,
         last_error = CASE WHEN ? = 1 OR mentions_out.target_version IS NOT excluded.target_version THEN NULL ELSE mentions_out.last_error END`,
    )
    .bind(newId(), itemId, version, target, targetVersion, endpoint, nowIso(), force, force, force, force)
    .run();
}

/** Pending rows whose next attempt is due (or which have never been attempted). */
export async function dueOutbound(db: D1Database, now: string = nowIso(), limit = 50): Promise<MentionOutRow[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM mentions_out
       WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
       ORDER BY created LIMIT ?`,
    )
    .bind(now, limit)
    .all<MentionOutRow>();
  return rows.results;
}

export async function markOutbound(
  db: D1Database,
  id: string,
  patch: { status: MentionOutRow["status"]; endpoint?: string | null; attempts?: number; nextAttemptAt?: string | null; error?: string | null },
): Promise<void> {
  await db
    .prepare(
      `UPDATE mentions_out SET status = ?, endpoint = COALESCE(?, endpoint), attempts = COALESCE(?, attempts),
       next_attempt_at = ?, last_error = ? WHERE id = ?`,
    )
    .bind(patch.status, patch.endpoint ?? null, patch.attempts ?? null, patch.nextAttemptAt ?? null, patch.error ?? null, id)
    .run();
}

export async function listOutbound(db: D1Database, limit = 100): Promise<MentionOutRow[]> {
  const rows = await db.prepare("SELECT * FROM mentions_out ORDER BY created DESC LIMIT ?").bind(limit).all<MentionOutRow>();
  return rows.results;
}

/**
 * Record an inbound claim as `pending` (§2.3.5 step 3). A re-sent mention
 * re-verifies rather than duplicating: the row is keyed (source, target), and
 * `first_seen` is preserved so "they have been pointing here since…" survives.
 */
export async function upsertInbound(
  db: D1Database,
  source: string,
  target: string,
  targetItemId: string,
  now: string = nowIso(),
): Promise<MentionInRow> {
  await db
    .prepare(
      `INSERT INTO mentions_in (id, source, target, target_item_id, status, first_seen, last_seen, attempts)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, 0)
       ON CONFLICT (source, target) DO UPDATE SET
         status = 'pending', last_seen = excluded.last_seen, target_item_id = excluded.target_item_id,
         attempts = mentions_in.attempts + 1, error = NULL`,
    )
    .bind(newId(), source, target, targetItemId, now, now)
    .run();
  return (await db.prepare("SELECT * FROM mentions_in WHERE source = ? AND target = ?").bind(source, target).first<MentionInRow>())!;
}

export async function markInboundVerified(
  db: D1Database,
  id: string,
  found: {
    relation: MentionRelation;
    sourceOrigin: string;
    sourceId: string;
    sourceKind: string;
    sourceVersion: number;
    authorJson: string | null;
    sourcePage: string;
  },
  now: string = nowIso(),
): Promise<void> {
  await db
    .prepare(
      `UPDATE mentions_in SET status = 'verified', relation = ?, source_origin = ?, source_id = ?, source_kind = ?,
       source_version = ?, source_author_json = ?, source_page = ?, verified_at = ?, error = NULL WHERE id = ?`,
    )
    .bind(found.relation, found.sourceOrigin, found.sourceId, found.sourceKind, found.sourceVersion, found.authorJson, found.sourcePage, now, id)
    .run();
}

/**
 * A claim that does not verify. `gone` is deliberately not a delete (W3C
 * suggests one): keeping the row means a stubber who withdraws and later
 * republishes is recognized as the same relationship rather than as new.
 */
export async function markInboundUnverified(
  db: D1Database,
  id: string,
  status: "failed" | "gone",
  error: string,
): Promise<void> {
  await db.prepare("UPDATE mentions_in SET status = ?, error = ? WHERE id = ?").bind(status, error, id).run();
}

/** Verified inbound mentions, newest first — the detect-stubs feed (§3.3). */
export async function listVerifiedInbound(db: D1Database, limit = 200): Promise<MentionInRow[]> {
  const rows = await db
    .prepare("SELECT * FROM mentions_in WHERE status IN ('verified','gone') ORDER BY verified_at DESC, last_seen DESC LIMIT ?")
    .bind(limit)
    .all<MentionInRow>();
  return rows.results;
}

export async function getInbound(db: D1Database, id: string): Promise<MentionInRow | null> {
  return db.prepare("SELECT * FROM mentions_in WHERE id = ?").bind(id).first<MentionInRow>();
}

/**
 * Every inbound claim seen in the last hour — the rate-limit input, read once
 * and counted three ways by the caller (§2.3.5 step 2, §9.1 gaps 1–2). One
 * query rather than three: the global cap is what keeps this row set small, so
 * the three counts can share a single read of it.
 */
export async function recentInboundSources(db: D1Database, now: number = Date.now()): Promise<string[]> {
  const cutoff = new Date(now - 60 * 60_000).toISOString();
  const rows = await db.prepare("SELECT source FROM mentions_in WHERE last_seen >= ?").bind(cutoff).all<{ source: string }>();
  return rows.results.map((r) => r.source);
}

/** When this exact source/target pair was last claimed, or null if never. */
export async function pairLastSeen(db: D1Database, source: string, target: string): Promise<number | null> {
  const row = await db.prepare("SELECT last_seen FROM mentions_in WHERE source = ? AND target = ?").bind(source, target).first<{ last_seen: string }>();
  return row ? Date.parse(row.last_seen) : null;
}

/** Claims still awaiting verification that were touched inside the window. */
export async function pendingInboundCount(db: D1Database, now: number = Date.now()): Promise<number> {
  const cutoff = new Date(now - INBOUND_PENDING_WINDOW_MS).toISOString();
  const row = await db.prepare("SELECT COUNT(*) AS n FROM mentions_in WHERE status = 'pending' AND last_seen >= ?").bind(cutoff).first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Drop `failed` inbound rows past their retention (§9.1 gap 3). Runs on the
 * cron, not on the request path: a POST should never pay for housekeeping, and
 * a flood is exactly when it would.
 */
export async function pruneFailedInbound(db: D1Database, now: number = Date.now()): Promise<number> {
  const cutoff = new Date(now - FAILED_INBOUND_RETENTION_MS).toISOString();
  // Counted from the rows deleted, not meta.changes: D1 adds the change-state
  // trigger's write to that count (0032), which keeps only its zero/nonzero meaning.
  const res = await db.prepare("DELETE FROM mentions_in WHERE status = 'failed' AND last_seen < ? RETURNING id").bind(cutoff).all();
  return res.results.length;
}

/**
 * The verified responses to one item that the author is willing to show:
 * `hidden` rows and everything unverified are excluded here rather than at
 * render time, so the public path cannot accidentally leak a row the studio
 * is still deciding about. `gone` is excluded too — a response that no longer
 * verifies is not a response.
 */
export async function listPublicResponses(db: D1Database, itemId: string): Promise<MentionInRow[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM mentions_in WHERE target_item_id = ? AND status = 'verified' AND hidden = 0
       ORDER BY verified_at, first_seen`,
    )
    .bind(itemId)
    .all<MentionInRow>();
  return rows.results;
}

export async function setMentionHidden(db: D1Database, id: string, hidden: boolean): Promise<void> {
  await db.prepare("UPDATE mentions_in SET hidden = ? WHERE id = ?").bind(hidden ? 1 : 0, id).run();
}
