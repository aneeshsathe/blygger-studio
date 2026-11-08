import { testItemRevision } from './helpers.ts';
/**
 * A complete static walk must not lose rows when timestamps tie across pages.
 * Signals own a generated oracle; this fixed witness checks the other collections.
 *
 * Contract: docs/api.md collection envelopes and established per-collection order.
 * Model: literal ordered fixture IDs, sliced by the independently tracked position and width. Search
 * uses distinct timestamps because this witness claims no search tie-break policy.
 * History grammar: eleven items and related subscriptions/hoppers/mentions, width
 * three, verified versus pending inbound neighbors and an own-reading projection.
 * Driver: SDK calls through SELF; D1 sets deliberate timestamp ties and fixture rows.
 * Refinement: exact ordered IDs and envelope on every page and the complete walk.
 * Limits: identity/order witness rather than complete row-value validation, all
 * collection filters, cost bounds or a snapshot across concurrent writes.
 */
import { SELF, env } from "cloudflare:test";
import { expect, it } from "vitest";
import { BlyggerApi as api, createBlyggerClient, unwrap } from "../sdk/dist/browser.js";
import { BASE, login } from "./helpers.ts";

// Static fixtures, exact ordered IDs. Concurrent changes expire continuations; the static walk below does not write between pages. Signals have the generated pagination oracle.
it("walks every other collection completely across tied timestamps and page boundaries", async () => {
  const client = createBlyggerClient({ baseUrl: BASE + '/blyg/api', headers: { cookie: await login() }, fetch: (input, init) => SELF.fetch(input instanceof Request ? input : new Request(input, init)) });
  const ids: string[] = [], keys = Array.from({ length: 11 }, (_, i) => `walk-${String(i).padStart(2, "0")}`);
  for (const key of keys) {
    const item = await unwrap(api.createItem({ client, body: { contentMd: `collection ${key}` } }));
    ids.push(item.id); await unwrap(api.publishItem({ client, path: { id: item.id } , body: { expectedRevision: await testItemRevision(item.id) } }));
  }
  await env.DB.prepare("UPDATE items SET updated = '2026-10-01T00:00:00Z'").run();
  await env.DB.batch(keys.flatMap(key => [
    env.DB.prepare("INSERT INTO subscriptions (id, kind, origin, feed_url, title, created) VALUES (?, 'rss', ?, ?, ?, 'same')").bind(key, `https://${key}.example/`, `https://${key}.example/feed`, key),
    env.DB.prepare("INSERT INTO hoppers (id, name, slug, created) VALUES (?, ?, ?, 'same')").bind(key, key, key),
    env.DB.prepare("INSERT INTO mentions_in (id, source, source_origin, source_id, source_kind, target, target_item_id, status, first_seen, last_seen, verified_at, hidden) VALUES (?, ?, 'https://source.example/', ?, 'fragment', 'target', 'target-id', 'verified', 'same', 'same', 'same', 0)").bind(key, `https://source.example/${key}`, key),
    env.DB.prepare("INSERT INTO mentions_out (id, item_id, version, target, status, attempts, created) VALUES (?, ?, 1, ?, 'pending', 0, 'same')").bind(key, ids[0], `https://target.example/${key}`),
  ]));
  // Unverified inbound data must not increase the visible total.
  await env.DB.prepare("INSERT INTO mentions_in (id, source, source_origin, source_id, source_kind, target, target_item_id, status, first_seen, last_seen, hidden) VALUES ('excluded', 'https://source.example/excluded', 'https://source.example/', 'excluded', 'fragment', 'target', 'target-id', 'pending', 'same', 'same', 0)").run();
  type Page = { items: { id?: string; key?: string }[]; page: { limit: number; nextCursor: string | null } };
  const width = 3;
  const cases: [string, string[], (cursor?: string) => Promise<Page>][] = [
    ["items", [...ids].sort().reverse(), cursor => unwrap(api.listItems({ client, query: { cursor, limit: width } }))],
    ["subscriptions", keys, cursor => unwrap(api.listSubscriptions({ client, query: { cursor, limit: width } }))],
    ["hoppers", keys, cursor => unwrap(api.listHoppers({ client, query: { cursor, limit: width } }))],
    ["inbound mentions", keys, cursor => unwrap(api.listMentions({ client, query: { direction: "inbound", cursor, limit: width } }))],
    ["outbound mentions", keys, cursor => unwrap(api.listMentions({ client, query: { direction: "outbound", cursor, limit: width } }))],
    ["reading", [...ids].sort().map(id => `own:${id}`), cursor => unwrap(api.listReading({ client, query: { sub: "own", cursor, limit: width } }))],
    // Search has no documented tie-break promise. Give it distinct dates to
    // test paging rather than inventing a new ordering contract here.
  ];
  for (const [name, expected, read] of cases) {
    const observed: string[] = [];
    let cursor: string | undefined, offset = 0;
    do {
      const page = await read(cursor), actual = page.items.map(row => row.key ?? row.id!);
      expect(page.page.limit, name).toBe(width);
      expect(actual, name).toEqual(expected.slice(offset, offset + width)); observed.push(...actual);
      offset += actual.length; cursor = page.page.nextCursor ?? undefined;
      expect(cursor !== undefined, name).toBe(offset < expected.length);
    } while (cursor);
    expect(observed, name).toEqual(expected);
  }
  await env.DB.batch(ids.map((id, i) => env.DB.prepare("UPDATE items SET updated = ? WHERE id = ?").bind(`2026-10-01T00:00:${String(i).padStart(2, "0")}Z`, id)));
  const search: string[] = [];
  let cursor: string | undefined, offset = 0;
  do {
    const page = await unwrap(api.search({ client, query: { q: 'collection', cursor, limit: width } }));
    expect(page.items.map(row => row.id)).toEqual([...ids].reverse().slice(offset, offset + width));
    search.push(...page.items.map(row => row.id));
    offset += page.items.length; cursor = page.page.nextCursor ?? undefined;
    expect(cursor !== undefined).toBe(offset < ids.length);
  } while (cursor);
  expect(search).toEqual([...ids].reverse());
});
