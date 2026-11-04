// Per-hopper feeds: every URL shape, name and limit in one place.
//
// Spec 0.4 §13.5 (decision #86; promoted from §16.12 after the session-57 gate).
// Publishing sits behind the `hopper_feeds` setting, off by default, and each
// shape below is the one thing to change if promotion moves it. Nothing here
// touches the blyg's own feed.xml: decision #12 keeps hopper items off it.

// Ruled text: blygger-spec protocol-v0.4.md §2, §4, §6.1, §12.1 step 7, §12.2,
// §13.5 and §13.6 (eighth revision; §16.12 is now a pointer with the gate
// record). Rule numbers in this codebase are §16.12's. There is no entry
// window: a hopper feed is the whole list (§16.12 rule 3c).

/** The feed file inside a hopper's directory: `{mount}/h/{slug}/feed.xml`. */
export const HOPPER_FEED_FILE = "feed.xml";

/** Characters of excerpt in an entry. An excerpt, never the held snapshot. */
export const HOPPER_EXCERPT_CHARS = 280;

/** Origin-relative path of a hopper's public page. */
export function hopperPagePath(slug: string): string {
  return `h/${slug}/`;
}

/** Origin-relative path of a hopper's feed. */
export function hopperFeedPath(slug: string): string {
  return `${hopperPagePath(slug)}${HOPPER_FEED_FILE}`;
}

/** Channel title, and the autodiscovery link's title: the hopper's name, then the blyg's. */
export function hopperFeedTitle(hopperName: string, siteTitle: string): string {
  return `${hopperName} — ${siteTitle}`;
}

/**
 * Entry guid (isPermaLink="false"): hopper slug, the member's origin, its id.
 * A slug freezes once the hopper is first made public (migration 0006), so the
 * guid is stable for as long as the feed can be served.
 */
export function hopperGuid(slug: string, origin: string, id: string): string {
  return `hopper:${slug}:${origin}:${id}`;
}

/**
 * One entry of the manifest's `hoppers` key (§16.12 rule 1): origin-relative
 * paths, like the manifest's other paths. `feed` is present because this
 * client lists hoppers only while it serves their feeds.
 */
export function manifestHopperEntry(hopper: { name: string; slug: string }): { title: string; page: string; feed: string } {
  return { title: hopper.name, page: hopperPagePath(hopper.slug), feed: hopperFeedPath(hopper.slug) };
}
