// Lineage for the reading view's glyph and hex view: one hop of "what this
// draws on" and "what draws on it", as this node knows it. What these pin:
//   1. Ancestors are the item's own references, deduped per target with
//      fork > stub > transclusion — a stub thread's transclusion of its
//      target is the same act as its stub_of, not a second edge.
//   2. A bare transclusion means the holding document's own origin, so an
//      imported item quoting its sibling is not mistaken for quoting ours.
//   3. Descendants come from stored documents, and for our own items also
//      from verified mentions — deduped, the stored document winning.
//   4. The reading page carries the counts, so the glyph costs no requests.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { apiJson, createAndPublish, login } from "./helpers.ts";

const THEM = "https://them.example/blyg/";
const STRANGER = "https://stranger.example/";
const A = "0000000000000000000000000a";
const B = "0000000000000000000000000b";
const C = "0000000000000000000000000c";

async function publishThread(cookie: string, md: string): Promise<string> {
  const id = (await apiJson(cookie, "POST", "/api/items", { content_md: md, kind: "thread" })).json.id as string;
  expect((await apiJson(cookie, "POST", `/api/items/${id}/publish`, {})).status).toBe(200);
  return id;
}
async function seedSubscription() {
  await env.DB.prepare("INSERT OR IGNORE INTO subscriptions (id, kind, origin, feed_url, title, created) VALUES ('them', 'blyg', ?, ?, 'Their blyg', '2026-10-01T00:00:00Z')").bind(THEM, `${THEM}feed.xml`).run();
}
async function seedImported(id: string, html: string, refs: { stub_of?: unknown; forked_from?: unknown; transclusions?: unknown[] }) {
  await env.DB.prepare(`INSERT INTO imported_items (subscription_id, remote_id, kind, state, version, observed_at, content_md, content_html, l0, stub_of_json, forked_from_json, transclusions_json)
    VALUES ('them', ?, ?, 'current', 2, '2026-10-02T00:00:00Z', '', ?, 0, ?, ?, ?)`)
    .bind(id, refs.transclusions ? "thread" : "fragment", html, refs.stub_of ? JSON.stringify(refs.stub_of) : null, refs.forked_from ? JSON.stringify(refs.forked_from) : null, refs.transclusions ? JSON.stringify(refs.transclusions) : null).run();
}
const lineage = (cookie: string, q: string) => apiJson(cookie, "GET", `/api/lineage?${q}`);

describe("lineage of our own items", () => {
  it("a thread quoting a fragment is the fragment's descendant, and the fragment its ancestor", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "# Thin layer\n\nProtocols win by being thin.");
    const thread = await publishThread(cookie, `![[${frag}]]\n\nI half agree.`);

    const up = await lineage(cookie, `id=${thread}`);
    expect(up.status).toBe(200);
    expect(up.json.node).toMatchObject({ id: thread, held: "own", kind: "thread", source: "you" });
    expect(up.json.ancestors).toEqual([expect.objectContaining({ id: frag, relation: "transclusion", partial: false, held: "own", title: "Thin layer", version: 1 })]);
    // The thread's own excerpt is its own words, not the quote it opens with.
    expect(up.json.node.excerpt).toBe("I half agree.");

    const down = await lineage(cookie, `id=${frag}`);
    expect(down.json.ancestors).toEqual([]);
    expect(down.json.descendants).toEqual([expect.objectContaining({ id: thread, relation: "transclusion", via: "reference", held: "own" })]);
  });

  it("a partial quote marks the edge partial", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "One sentence here. Another one there.");
    const thread = await publishThread(cookie, `![[${frag}]]\n> Another one there.\n\nOn that line.`);
    const got = await lineage(cookie, `id=${thread}`);
    expect(got.json.ancestors).toEqual([expect.objectContaining({ id: frag, relation: "transclusion", partial: true })]);
  });

  it("the reading page carries glyph counts for both ends", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "Counted fragment.");
    const thread = await publishThread(cookie, `![[${frag}]]\n\nCounting.`);
    const page = await apiJson(cookie, "GET", "/api/reading?sub=own&limit=50");
    const of = (id: string) => page.json.items.find((e: { own?: { id: string } }) => e.own?.id === id).lineage;
    expect(of(thread)).toEqual({ up: { stub: 0, transclusion: 1, fork: 0 }, down: { stub: 0, transclusion: 0, fork: 0 } });
    expect(of(frag)).toEqual({ up: { stub: 0, transclusion: 0, fork: 0 }, down: { stub: 0, transclusion: 1, fork: 0 } });
  });
});

describe("lineage across blygs", () => {
  it("an imported stub of ours is one descendant, partial, however many ways it references us", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "Answer me this.");
    const ours = (await lineage(cookie, `id=${frag}`)).json.node.origin as string;
    await seedSubscription();
    await seedImported(A, "<h1>A reply</h1><p>Here is my answer.</p>", {
      stub_of: { origin: ours, id: frag, version: 1 },
      transclusions: [{ origin: ours, id: frag, version: 1, selector: { exact: "Answer me this." } }],
    });
    const got = await lineage(cookie, `id=${frag}`);
    expect(got.json.descendants).toEqual([expect.objectContaining({ id: A, origin: THEM, relation: "stub", partial: true, held: "imported", sub: "them", title: "A reply", source: "Their blyg", via: "reference" })]);
    // And from their side, re-centred by subscription: we are its one ancestor.
    const theirs = await lineage(cookie, `sub=them&id=${A}`);
    expect(theirs.json.ancestors).toEqual([expect.objectContaining({ id: frag, origin: ours, relation: "stub", partial: true, held: "own" })]);
  });

  it("a bare transclusion means the holder's origin, not ours", async () => {
    const cookie = await login();
    await seedSubscription();
    await seedImported(B, "<p>Quoted sibling.</p>", {});
    await seedImported(C, "<p>Quoting my own earlier post.</p>", { transclusions: [{ id: B, version: 2 }] });
    const got = await lineage(cookie, `sub=them&id=${B}`);
    expect(got.json.descendants).toEqual([expect.objectContaining({ id: C, origin: THEM, relation: "transclusion" })]);
    expect((await lineage(cookie, `id=${B}`)).json.descendants).toEqual([]);
  });

  it("a fork outranks the transclusion that comes with it, and a {url} stub is an ancestor without an item", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "Fork me.");
    const ours = (await lineage(cookie, `id=${frag}`)).json.node.origin as string;
    await seedSubscription();
    const D = "0000000000000000000000000d";
    await seedImported(D, "<p>Forked and rewritten.</p>", { forked_from: { origin: ours, id: frag, version: 1 }, stub_of: { url: "https://news.example/story", cited: { source: "News site", url: "https://news.example/story", retrieved: "2026-10-01T00:00:00Z" } } });
    const got = await lineage(cookie, `sub=them&id=${D}`);
    expect(got.json.ancestors).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: frag, relation: "fork", held: "own" }),
      expect.objectContaining({ id: null, relation: "stub", url: "https://news.example/story", source: "News site", held: null }),
    ]));
    expect((await lineage(cookie, `id=${frag}`)).json.descendants).toEqual([expect.objectContaining({ id: D, relation: "fork" })]);
  });

  it("verified mentions add descendants we hold no document for, without doubling ones we do", async () => {
    const cookie = await login();
    const frag = await createAndPublish(cookie, "Mentioned.");
    const ours = (await lineage(cookie, `id=${frag}`)).json.node.origin as string;
    await seedSubscription();
    const E = "0000000000000000000000000e";
    await seedImported(E, "<p>Held reply.</p>", { stub_of: { origin: ours, id: frag, version: 1 } });
    const mention = (id: string, origin: string, sourceId: string, status = "verified") =>
      env.DB.prepare(`INSERT INTO mentions_in (id, source, target, target_item_id, status, relation, source_origin, source_id, source_kind, source_version, source_author_json, source_page, first_seen, last_seen, verified_at)
        VALUES (?, ?, ?, ?, ?, 'stub', ?, ?, 'fragment', 3, ?, ?, '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z')`)
        .bind(id, origin + sourceId, `${ours}f/${frag}/`, frag, status, origin, sourceId, JSON.stringify({ name: "A Stranger" }), `${origin}f/${sourceId}/`).run();
    await mention(`m-held-${frag}`, THEM, E);
    await mention(`m-stranger-${frag}`, STRANGER, "0000000000000000000000000s");
    await mention(`m-failed-${frag}`, STRANGER, "0000000000000000000000000x", "failed");
    const got = await lineage(cookie, `id=${frag}`);
    expect(got.json.descendants).toHaveLength(2);
    expect(got.json.descendants).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: E, via: "reference", held: "imported" }),
      expect.objectContaining({ id: "0000000000000000000000000s", origin: STRANGER, via: "mention", held: null, source: "A Stranger", url: `${STRANGER}f/0000000000000000000000000s/`, version: 3 }),
    ]));
  });

  it("only followable URLs reach a node: javascript: and data: from remote documents and mentions become null", async () => {
    // A node's url is an href in the studio, and these come from documents and
    // mentions someone else wrote.
    const cookie = await login();
    const frag = await createAndPublish(cookie, "Hostile references.");
    const ours = (await lineage(cookie, `id=${frag}`)).json.node.origin as string;
    await seedSubscription();
    const F = "0000000000000000000000000f";
    await seedImported(F, "<p>Hostile stub.</p>", { stub_of: { url: "data:text/html,<script>alert(1)</script>", cited: { source: "Evil", url: "javascript:alert(1)", retrieved: "2026-10-01T00:00:00Z" } } });
    const got = await lineage(cookie, `sub=them&id=${F}`);
    expect(got.json.ancestors).toEqual([expect.objectContaining({ id: null, relation: "stub", source: "Evil", url: null })]);

    const G = "0000000000000000000000000g";
    await env.DB.prepare(`INSERT INTO mentions_in (id, source, target, target_item_id, status, relation, source_origin, source_id, source_kind, source_version, source_author_json, source_page, first_seen, last_seen, verified_at)
      VALUES (?, ?, ?, ?, 'verified', 'stub', ?, ?, 'fragment', 1, NULL, 'javascript:alert(1)', '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z')`)
      .bind(`m-hostile-${frag}`, STRANGER + G, `${ours}f/${frag}/`, frag, STRANGER, G).run();
    const down = await lineage(cookie, `id=${frag}`);
    expect(down.json.descendants).toEqual([expect.objectContaining({ id: G, via: "mention", url: null })]);
  });

  it("an unknown subscription is a 404", async () => {
    const cookie = await login();
    expect((await lineage(cookie, "sub=nope&id=x")).status).toBe(404);
  });
});
