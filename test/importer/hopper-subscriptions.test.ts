// Hopper subscriptions (PROPOSED, pending Fable): §12.1 step 7 (hopper match),
// §12.2 (identity = origin + hopper feed), §13.5a rules 5-6 (L0 rows, dropped
// when gone). Module level with fixture fetches, like subscribe-flow.test.ts:
// the HTTP route defaults to real network.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { HOPPER_UNLISTED_FLAG, pollSubscription } from "../../src/importer/poll.ts";
import { matchHopper, resolve } from "../../src/importer/resolve.ts";
import { createSubscription, findHopperSubscription, findSubscription, getSubscription, listImportedItems } from "../../src/importer/store.ts";
import { resolveTarget } from "../../src/transclusion.ts";
import { makeFixtureFetch, manifestBody } from "./fixtures.ts";

let n = 0;

function blygFixture() {
  const host = `https://h${n++}.example`;
  const origin = `${host}/blyg/`;
  const hoppers = [
    { title: "Picks", page: "h/picks/", feed: "h/picks/feed.xml" },
    { title: "Page Only", page: "h/page-only/" },
  ];
  return { host, origin, hoppers, manifestUrl: `${origin}blyg.json`, feed: `${origin}h/picks/feed.xml`, page: `${origin}h/picks/` };
}

function hopperFeedXml(entries: { guid: string; link: string; title: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Picks — Fixture Blyg</title>
    <link>https://example.invalid/</link>
    <description>A collection</description>
${entries
  .map(
    (e) => `    <item>
      <guid isPermaLink="false">${e.guid}</guid>
      <link>${e.link}</link>
      <title>${e.title}</title>
      <description><![CDATA[<p>excerpt of ${e.title}</p>]]></description>
      <pubDate>Sat, 05 Sep 2026 00:00:00 GMT</pubDate>
      <source url="https://other.example/feed.xml">Other</source>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>`;
}

describe("§12.1 step 7: hopper match", () => {
  it("matches the hopper feed URL, resolving { origin, manifest, hopper_feed }", async () => {
    const f = blygFixture();
    const { fetch } = makeFixtureFetch({
      [f.manifestUrl]: { body: manifestBody({ site: f.origin, title: "Fixture Blyg", hoppers: f.hoppers }) },
      [f.feed]: { body: hopperFeedXml([]) },
    });
    const result = await resolve(f.feed, fetch, { hoppers: true });
    expect(result).toMatchObject({ kind: "blyg", origin: f.origin, manifestUrl: f.manifestUrl, hopper: { title: "Picks", page: f.page, feed: f.feed } });
  });

  it("matches the page, with or without its trailing slash, ignoring a query and fragment", async () => {
    const f = blygFixture();
    const { fetch } = makeFixtureFetch({ [f.manifestUrl]: { body: manifestBody({ site: f.origin, hoppers: f.hoppers }) } });
    for (const input of [f.page, f.page.slice(0, -1), `${f.page}?utm=x#top`, `${f.page.slice(0, -1)}?a=1`]) {
      const result = await resolve(input, fetch, { hoppers: true });
      expect(result, input).toMatchObject({ kind: "blyg", origin: f.origin, hopper: { feed: f.feed } });
    }
  });

  it("finds the manifest from the hopper page's rel=blyg on an unconventional mount", async () => {
    const host = `https://r${n++}.example`;
    const origin = `${host}/site/`;
    const { fetch } = makeFixtureFetch({
      [`${origin}h/picks/`]: { body: `<!doctype html><html><head><link rel="blyg" href="${origin}blyg.json"></head><body></body></html>` },
      [`${origin}blyg.json`]: { body: manifestBody({ site: origin, hoppers: [{ title: "Picks", page: "h/picks/", feed: "h/picks/feed.xml" }] }) },
    });
    const result = await resolve(`${origin}h/picks/`, fetch, { hoppers: true });
    expect(result).toMatchObject({ kind: "blyg", origin, hopper: { feed: `${origin}h/picks/feed.xml` } });
  });

  it("falls through to the whole blyg on no match, and on a page-only entry", async () => {
    const f = blygFixture();
    const { fetch } = makeFixtureFetch({ [f.manifestUrl]: { body: manifestBody({ site: f.origin, hoppers: f.hoppers }) } });
    for (const input of [f.origin, `${f.origin}h/other/`, `${f.origin}h/page-only/`, `${f.origin}h/page-only`]) {
      const result = await resolve(input, fetch, { hoppers: true });
      expect(result, input).toMatchObject({ kind: "blyg", origin: f.origin });
      expect(result.kind === "blyg" && result.hopper, input).toBeFalsy();
    }
  });

  it("is skipped when hopper feeds are off: the hopper URL resolves to the blyg, as before", async () => {
    const f = blygFixture();
    const { fetch } = makeFixtureFetch({
      [f.manifestUrl]: { body: manifestBody({ site: f.origin, hoppers: f.hoppers }) },
      [f.feed]: { body: hopperFeedXml([]) },
    });
    for (const input of [f.feed, f.page]) {
      const result = await resolve(input, fetch);
      expect(result).toMatchObject({ kind: "blyg", origin: f.origin });
      expect(result.kind === "blyg" && result.hopper).toBeFalsy();
    }
  });

  it("ignores malformed hoppers entries", () => {
    const origin = "https://m.example/";
    const manifest = { blyg: "0.4", hoppers: [null, 7, { page: "h/x/", feed: "h/x/feed.xml" }, { title: "T", feed: "h/y/feed.xml" }] };
    expect(matchHopper(`${origin}h/x/feed.xml`, origin, manifest)).toBeNull();
    expect(matchHopper(`${origin}h/y/feed.xml`, origin, manifest)).toBeNull();
    expect(matchHopper(`${origin}h/x/`, origin, { blyg: "0.4", hoppers: "nope" })).toBeNull();
  });
});

async function hopperSub(f: ReturnType<typeof blygFixture>) {
  return createSubscription(env.DB, {
    kind: "rss",
    origin: f.feed,
    feedUrl: f.feed,
    title: "Picks — Fixture Blyg",
    hopper: { feed: f.feed, manifest: f.manifestUrl },
  });
}

describe("§12.2: a hopper subscription's identity", () => {
  it("is (origin, hopper feed): it coexists with a whole-blyg subscription to the same origin", async () => {
    const f = blygFixture();
    const blyg = await createSubscription(env.DB, { kind: "blyg", origin: f.origin, feedUrl: `${f.origin}feed.xml`, title: "Fixture Blyg" });
    // A whole-blyg subscription does not block the hopper, and the hopper does not block the blyg.
    expect(await findHopperSubscription(env.DB, f.feed)).toBeNull();
    const hopper = await hopperSub(f);
    expect((await findSubscription(env.DB, f.origin, `${f.origin}feed.xml`))?.id).toBe(blyg.id);
    expect((await findHopperSubscription(env.DB, f.feed))?.id).toBe(hopper.id);
    expect(hopper).toMatchObject({ kind: "rss", hopper_feed: f.feed, hopper_manifest: f.manifestUrl });
    // One subscription per hopper feed.
    await expect(hopperSub(f)).rejects.toThrow();
  });
});

describe("§13.5a: polling a hopper subscription", () => {
  const listed = (f: ReturnType<typeof blygFixture>) => ({ [f.manifestUrl]: { body: manifestBody({ site: f.origin, hoppers: f.hoppers }) } });
  const entries = [
    { guid: "hopper:picks:https://other.example/:one", link: "https://other.example/posts/one/", title: "One" },
    { guid: "hopper:picks:https://other.example/:two", link: "https://other.example/items/two.json", title: "Two" },
  ];

  it("imports entries as L0 rows and drops one that leaves the feed", async () => {
    const f = blygFixture();
    const sub = await hopperSub(f);
    const first = makeFixtureFetch({ ...listed(f), [f.feed]: { body: hopperFeedXml(entries) } });
    expect((await pollSubscription(env.DB, sub, first.fetch)).outcome).toBe("polled");
    let rows = await listImportedItems(env.DB, sub.id);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.l0).toBe(1);
      expect(row.author_json).toBeNull();
    }
    expect(rows.map((r) => r.content_md).join("\n")).toContain("https://other.example/posts/one/");

    const second = makeFixtureFetch({ ...listed(f), [f.feed]: { body: hopperFeedXml(entries.slice(1)) } });
    await pollSubscription(env.DB, (await getSubscription(env.DB, sub.id))!, second.fetch);
    rows = await listImportedItems(env.DB, sub.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].content_md).toContain("Two");

    // An emptied hopper empties the subscription.
    const third = makeFixtureFetch({ ...listed(f), [f.feed]: { body: hopperFeedXml([]) } });
    await pollSubscription(env.DB, (await getSubscription(env.DB, sub.id))!, third.fetch);
    expect(await listImportedItems(env.DB, sub.id)).toHaveLength(0);
  });

  it("keeps a plain L0 subscription's windowed entries (the drop is hopper-only)", async () => {
    const f = blygFixture();
    const plain = await createSubscription(env.DB, { kind: "rss", origin: `${f.host}/plain.xml`, feedUrl: `${f.host}/plain.xml`, title: "Plain" });
    await pollSubscription(env.DB, plain, makeFixtureFetch({ [`${f.host}/plain.xml`]: { body: hopperFeedXml(entries) } }).fetch);
    await pollSubscription(env.DB, (await getSubscription(env.DB, plain.id))!, makeFixtureFetch({ [`${f.host}/plain.xml`]: { body: hopperFeedXml([]) } }).fetch);
    expect(await listImportedItems(env.DB, plain.id)).toHaveLength(2);
  });

  it("stops polling when the manifest no longer lists the hopper, and never becomes a whole-blyg subscription", async () => {
    const f = blygFixture();
    const sub = await hopperSub(f);
    await pollSubscription(env.DB, sub, makeFixtureFetch({ ...listed(f), [f.feed]: { body: hopperFeedXml(entries) } }).fetch);
    expect(await listImportedItems(env.DB, sub.id)).toHaveLength(2);
    // The daily manifest sync comes round; the hopper has gone private.
    await env.DB.prepare("UPDATE subscriptions SET last_index_sync_at = NULL WHERE id = ?").bind(sub.id).run();
    const unlisted = makeFixtureFetch({
      [f.manifestUrl]: { body: manifestBody({ site: f.origin, hoppers: f.hoppers.slice(1) }) },
      [f.feed]: { body: hopperFeedXml(entries) },
    });
    expect((await pollSubscription(env.DB, (await getSubscription(env.DB, sub.id))!, unlisted.fetch)).outcome).toBe("skipped");
    expect(unlisted.calls).not.toContain(f.feed);
    const after = (await getSubscription(env.DB, sub.id))!;
    expect(after).toMatchObject({ kind: "rss", status: "paused", origin: f.feed, feed_url: f.feed, hopper_feed: f.feed });
    expect(JSON.parse(after.flags).map((x: { type: string }) => x.type)).toContain(HOPPER_UNLISTED_FLAG);
    expect(await listImportedItems(env.DB, sub.id)).toHaveLength(0);
    // Nothing subscribed to the whole blyg on the reader's behalf.
    expect(await findSubscription(env.DB, f.origin, `${f.origin}feed.xml`)).toBeNull();
  });

  it("leaves the subscription alone when the manifest cannot be read", async () => {
    const f = blygFixture();
    const sub = await hopperSub(f);
    const r = await pollSubscription(env.DB, sub, makeFixtureFetch({ [f.manifestUrl]: { status: 503 }, [f.feed]: { body: hopperFeedXml(entries) } }).fetch);
    expect(r.outcome).toBe("polled");
    expect((await getSubscription(env.DB, sub.id))!.status).toBe("active");
  });

  it("never resolves a hopper row as a [[id]], ![[id]] or TK source", async () => {
    const f = blygFixture();
    const sub = await hopperSub(f);
    await pollSubscription(env.DB, sub, makeFixtureFetch({ ...listed(f), [f.feed]: { body: hopperFeedXml(entries) } }).fetch);
    const rows = await listImportedItems(env.DB, sub.id);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const r = await resolveTarget(env.DB, row.remote_id);
      expect(r.ok).toBe(false);
    }
  });
});
