import type { FeedAlgorithm, FeedHistory, FeedVersion } from "./types.ts";

/**
 * The diachronic view (docs/pace-layered-feed.md, session 46). Items sink at a
 * speed set by how much they have been pinned and climb as they are revised,
 * so what keeps mattering stays near the top and what was only new moves on.
 */

/** Brand's pace layers, fastest first. An item's layer is its pin weight, floored. */
export const LAYERS = ["fashion", "commerce", "infrastructure", "governance", "culture", "nature"] as const;

/** Depth gained per tick: each layer down sinks at half the speed of the one above. */
export const sinkSpeed = (layer: number) => 2 ** -layer;

export const layerFor = (weight: number) => Math.min(LAYERS.length - 1, Math.floor(weight));

/**
 * How many items a new version climbs past. One for now. This is the stub for
 * changelog-driven climbing: a major revision, judged from the note or from
 * the size of the change, would climb further.
 *
 * Not decided yet, and to be decided with Venkat: a reader-side classification
 * could plug in here. The change classifier (src/change-class.ts) labels only
 * our own versions, and only in studio-private storage and note text; the wire
 * carries no category (#19 / TN-1). Classifying an imported version locally,
 * from the two versions this node holds, would keep that stance (#77: the
 * reader derives, the wire does not mark) and could feed this number.
 */
export function climbFor(_version: FeedVersion): number {
  return 1;
}

/** Hops a pin's weight travels up the quoting tree before it is ignored (it halves each hop). */
export const WEIGHT_HOPS = 6;

/**
 * Pin weight: an item's own pins, plus half the weight of each item that quotes
 * it in a pinned version, plus a quarter of what quotes those, out to
 * WEIGHT_HOPS. A pinned thread freezes what it quotes, so its pin is evidence
 * that the quoted item matters; the other direction would reward quoting
 * popular things and does not count. Counted over walks, so a cycle adds a
 * little and then fades.
 */
export function pinWeights(pins: Map<string, number>, quoters: Map<string, Set<string>>): Map<string, number> {
  let weights = new Map(pins);
  for (let hop = 0; hop < WEIGHT_HOPS; hop++) {
    const next = new Map(pins);
    for (const [quoted, by] of quoters) {
      let inherited = 0;
      for (const quoter of by) inherited += weights.get(quoter) ?? 0;
      next.set(quoted, (next.get(quoted) ?? 0) + inherited / 2);
    }
    weights = next;
  }
  return weights;
}

type Event = { id: string; version: FeedVersion };

export function paceLayeredOrder(history: FeedHistory): string[] {
  const visible = new Set(history.items.filter((item) => !item.withdrawn).map((item) => item.id));
  // Replay every publication in time order. Times are to the second, so two
  // items can share one; then the listing order decides (oldest first, as the
  // archive lists them), and an item's own versions stay in sequence.
  const events: Event[] = history.items
    .flatMap((item) => item.versions.map((version) => ({ id: item.id, version })))
    .sort((a, b) => a.version.at.localeCompare(b.version.at));

  const depth = new Map<string, number>();
  const entered = new Map<string, number>();
  let clock = 0;
  const pins = new Map<string, number>();
  const quoters = new Map<string, Set<string>>();
  let layers = new Map<string, number>();
  // Shallowest first; at equal depth, the later entrant is on top.
  const ranked = () => [...depth.keys()].sort((a, b) => depth.get(a)! - depth.get(b)! || entered.get(b)! - entered.get(a)!);

  for (const { id, version } of events) {
    // The wire says which versions are pinned but not when, so a pin counts
    // from its version's publication. A withdrawn item's pins still count:
    // pinned versions are served forever.
    if (version.pinned) {
      pins.set(id, (pins.get(id) ?? 0) + 1);
      for (const quoted of version.quotes) {
        if (quoted === id) continue;
        if (!quoters.has(quoted)) quoters.set(quoted, new Set());
        quoters.get(quoted)!.add(id);
      }
      layers = new Map([...pinWeights(pins, quoters)].map(([key, weight]) => [key, layerFor(weight)]));
    }
    if (!visible.has(id)) continue;
    if (!depth.has(id)) {
      // A tick: everything already in the feed sinks, and the newcomer enters on top.
      for (const [other, d] of depth) depth.set(other, d + sinkSpeed(layers.get(other) ?? 0));
      depth.set(id, 0);
      entered.set(id, clock++);
    } else {
      for (let step = climbFor(version); step > 0; step--) {
        const order = ranked();
        const at = order.indexOf(id);
        if (at <= 0) break;
        const above = order[at - 1];
        const own = depth.get(id)!;
        depth.set(id, depth.get(above)!);
        depth.set(above, own);
        // At equal depths the swap changes nothing; the tie-break decides, so
        // make the climber the later entrant.
        if (depth.get(id) === own) entered.set(id, clock++);
      }
    }
  }

  return ranked();
}

export const paceLayered: FeedAlgorithm = {
  id: "pace-layered",
  title: "Pace-layered",
  description:
    "Items sink as new ones arrive, more slowly the more they have been pinned, and climb one place with each new version. What keeps mattering stays near the top.",
  order: paceLayeredOrder,
};
