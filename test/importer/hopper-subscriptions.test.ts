// Hopper subscriptions (PROPOSED, pending Fable): §12.1 step 7 (hopper match),
// §12.2 (identity = origin + hopper feed). Module level with fixture fetches,
// like subscribe-flow.test.ts: the HTTP route defaults to real network.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { matchHopper, resolve } from "../../src/importer/resolve.ts";
import { createSubscription, findHopperSubscription, findSubscription } from "../../src/importer/store.ts";
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
