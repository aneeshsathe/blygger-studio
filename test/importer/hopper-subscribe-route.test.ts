// Subscribing to a hopper through the real REST route (spec 0.4 §16.12 rules 4
// and 5), with a mocked network like subscribe-backfill.test.ts: the route's
// own fetch is the platform's. Covers the review amendment that a hopper
// subscription's identity is (origin, the feed's RESOLVED ABSOLUTE URL), never
// the manifest's spelling, and the gate's last clause: a whole-blyg
// subscription to the same origin is unaffected.
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { createOwnerApi } from "../../src/owner-api.ts";
import { getSubscription, listImportedItems } from "../../src/importer/store.ts";
import { manifestBody } from "./fixtures.ts";

let n = 0;

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>Picks</title><link>https://example.invalid/</link>
  <item><guid isPermaLink="false">hopper:picks:https://other.example/:one</guid><title>one</title><link>https://other.example/posts/one/</link><description>first</description><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

/** A blyg at `{host}/blyg/` whose manifest spells its one hopper's feed as `spelling(origin)`. */
function network(origin: string, spelling: { current: string }) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://cloudflare-dns.com/")) return Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34" }] });
    if (url === `${origin}blyg.json`) {
      return new Response(manifestBody({ site: origin, title: "Fixture Blyg", hoppers: [{ title: "Picks", page: "h/picks/", feed: spelling.current }] }), { headers: { "content-type": "application/json" } });
    }
    if (url === `${origin}h/picks/feed.xml`) return new Response(RSS, { headers: { "content-type": "application/rss+xml" } });
    if (url === `${origin}feed.xml`) return new Response(`<?xml version="1.0"?><rss version="2.0"><channel><title>Fixture Blyg</title></channel></rss>`, { headers: { "content-type": "application/rss+xml" } });
    return new Response("not found", { status: 404 });
  });
}

async function subscribe(body: Record<string, unknown>) {
  const app = new Hono().route("/api", createOwnerApi({ scope: ["owner:manage"], clientId: "hopper-subscribe", userId: "owner" }));
  const ctx = createExecutionContext();
  const res = await app.fetch(new Request("https://studio.example/api/subscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), env, ctx);
  await waitOnExecutionContext(ctx);
  return { status: res.status, json: (await res.json()) as any };
}

const setHopperFeeds = (on: boolean) =>
  env.DB.prepare("INSERT INTO settings (key, value) VALUES ('hopper_feeds', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(on ? "on" : "off").run();

beforeEach(() => setHopperFeeds(true));
afterEach(async () => {
  vi.restoreAllMocks();
  await setHopperFeeds(false);
});

describe("subscribing to a hopper by URL (§16.12 rules 4, 5)", () => {
  it("confirms as kind hopper, with the feed resolved to an absolute URL and the whole blyg offered", async () => {
    const origin = `https://hs${n++}.example/blyg/`;
    network(origin, { current: "h/picks/feed.xml" });
    const { status, json } = await subscribe({ url: `${origin}h/picks/` });
    expect(status).toBe(200);
    expect(json).toMatchObject({
      needsConfirm: true,
      kind: "hopper",
      origin,
      feedUrl: `${origin}h/picks/feed.xml`,
      hopper: { title: "Picks", page: `${origin}h/picks/`, feedUrl: `${origin}h/picks/feed.xml` },
      blygTitle: "Fixture Blyg",
    });
  });

  it("keys identity on (origin, resolved absolute feed URL), not the manifest's spelling", async () => {
    const origin = `https://hs${n++}.example/blyg/`;
    const spelling = { current: "h/picks/feed.xml" };
    network(origin, spelling);
    const first = await subscribe({ url: `${origin}h/picks/`, confirm: true });
    expect(first.status).toBe(201);
    expect(first.json).toMatchObject({ kind: "rss", origin, feedUrl: `${origin}h/picks/feed.xml`, hopperFeedUrl: `${origin}h/picks/feed.xml` });
    const row = (await getSubscription(env.DB, first.json.id))!;
    expect(row).toMatchObject({ origin, hopper_feed: `${origin}h/picks/feed.xml` });
    // The backfill imported the entry as an L0 row scoped to this subscription.
    expect((await listImportedItems(env.DB, row.id)).map((r) => r.l0)).toEqual([1]);

    // The publisher re-spells the same feed: absolute, then root-relative, then
    // with a dot segment. Every spelling is the same identity, so each is a 409.
    for (const respelled of [`${origin}h/picks/feed.xml`, `/blyg/h/picks/feed.xml`, `./h/x/../picks/feed.xml`]) {
      spelling.current = respelled;
      for (const url of [`${origin}h/picks/feed.xml`, `${origin}h/picks`]) {
        const again = await subscribe({ url, confirm: true });
        expect(again.status, `${respelled} via ${url}`).toBe(409);
      }
    }
  });

  it("leaves a whole-blyg subscription to the same origin unaffected, either order (gate)", async () => {
    const origin = `https://hs${n++}.example/blyg/`;
    network(origin, { current: "h/picks/feed.xml" });
    // Hopper first, then the whole blyg by its root URL.
    const hopper = await subscribe({ url: `${origin}h/picks/feed.xml`, confirm: true });
    expect(hopper.status).toBe(201);
    const blyg = await subscribe({ url: origin, confirm: true });
    expect(blyg.status).toBe(201);
    expect(blyg.json).toMatchObject({ kind: "blyg", origin, hopperFeedUrl: null });

    // Whole blyg first, then the hopper; and the hopper page's "whole blyg
    // instead" is refused once the blyg is already followed.
    const other = `https://hs${n++}.example/blyg/`;
    vi.restoreAllMocks();
    network(other, { current: "h/picks/feed.xml" });
    expect((await subscribe({ url: other, confirm: true })).status).toBe(201);
    expect((await subscribe({ url: `${other}h/picks/`, confirm: true, wholeBlyg: true })).status).toBe(409);
    const list = await subscribe({ url: `${other}h/picks/`, confirm: true });
    expect(list.status).toBe(201);
    expect(list.json).toMatchObject({ origin: other, hopperFeedUrl: `${other}h/picks/feed.xml` });
  });

  it("subscribes to another blyg's hopper while this node's own hopper feeds are off (ROADMAP row 100)", async () => {
    await setHopperFeeds(false);
    const origin = `https://hs${n++}.example/blyg/`;
    network(origin, { current: "h/picks/feed.xml" });
    const proposal = await subscribe({ url: `${origin}h/picks/` });
    expect(proposal.status).toBe(200);
    expect(proposal.json).toMatchObject({ needsConfirm: true, kind: "hopper", origin, hopper: { feedUrl: `${origin}h/picks/feed.xml` } });
    const made = await subscribe({ url: `${origin}h/picks/`, confirm: true });
    expect(made.status).toBe(201);
    expect(made.json).toMatchObject({ origin, hopperFeedUrl: `${origin}h/picks/feed.xml` });
  });
});
