import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeApp } from "../src/index.ts";
import { feedPage } from "../src/pages.ts";
import { buildFeedXml } from "../src/protocol.ts";
import { listFeedItems } from "../src/public-feed.ts";
import { getSettings } from "../src/model.ts";

function measured(db: D1Database) {
  const reads: D1Result[] = [];
  let calls = 0;
  const statement = (stmt: D1PreparedStatement): D1PreparedStatement => new Proxy(stmt, {
    get(target, key) {
      if (key === "bind") return (...args: unknown[]) => statement(target.bind(...args));
      if (key === "all") return async () => { calls++; const result = await target.all(); reads.push(result); return result; };
      if (key === "first") return async (...args: [string?]) => { calls++; return args[0] === undefined ? target.first() : target.first(args[0]); };
      const value = Reflect.get(target, key); return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const proxy = new Proxy(db, { get(target, key) {
    if (key === "prepare") return (sql: string) => statement(target.prepare(sql));
    if (key === "batch") return async (stmts: D1PreparedStatement[]) => { calls += stmts.length; const result = await target.batch(stmts); reads.push(...result); return result; };
    const value = Reflect.get(target, key); return typeof value === "function" ? value.bind(target) : value;
  } });
  return { db: proxy, reads, get calls() { return calls; } };
}

async function fixture(count: number) {
  await env.DB.batch(Array.from({ length: count }, (_, i) => env.DB.prepare(
    "INSERT INTO items (id, kind, status, created, updated, version, content_md) VALUES (?, ?, 'public', '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 2, 'private working draft')"
  ).bind(`card${i}`, i % 2 ? "thread" : "fragment")));
  await env.DB.batch(Array.from({ length: count }, (_, i) => env.DB.prepare(
    "INSERT INTO versions (item_id,version,content_md,content_html,content_hash,published_at,note,pinned) VALUES (?,2,'published',?, 'hash','2026-01-02T00:00:00Z','public note',0)"
  ).bind(`card${i}`, `<h1>Title ${i}</h1><p>Published ${i}</p>`)));
}

describe("public homepage read budget", () => {
  beforeEach(async () => { await env.DB.batch(["versions", "media", "version_media", "items"].map(table => env.DB.prepare(`DELETE FROM ${table}`))); });
  it("preserves mixed-card order, published text, pins, images, metadata and the older link within five render queries", async () => {
    await fixture(100);
    await env.DB.prepare("INSERT INTO versions (item_id,version,content_md,content_html,content_hash,published_at,pinned) VALUES ('card0',1,'old','<p>old body</p>','h','2026-01-01',1)").run();
    await env.DB.prepare("INSERT INTO media (id,item_id,r2_key,mime,alt,created) VALUES ('img','card0','media/img.png','image/png','my image','2026-01-01')").run();
    await env.DB.prepare("INSERT INTO version_media (item_id,version,media_id) VALUES ('card0',2,'img')").run();
    const settings = await getSettings(env.DB), items = await listFeedItems(env.DB, 100), meter = measured(env.DB);
    const html = await feedPage(meter.db, settings, items, true, "/blyg", "https://example.com/blyg/");
    expect(html).toContain('href="/blyg/f/card0/v1/"');
    expect(html).toContain('src="/blyg/media/img.png" alt="my image"');
    expect(html).toContain('<h1><a class="item-title" href="/blyg/t/card99/">Title 99</a></h1>');
    expect(html.indexOf('/blyg/t/card99/')).toBeLessThan(html.indexOf('/blyg/f/card98/'));
    expect(html).toContain('older items →');
    expect(html).toContain('public note');
    expect(html).toContain('content="Title 99 Published 99"');
    expect(html).not.toContain('private working draft');
    expect(html).not.toContain('old body');
    expect(meter.calls).toBeLessThanOrEqual(6); // +1 since 0.24.0: the Collections list (one fixed query, not per card)
  });

  it("does not read unpinned history bodies or unrelated items and media", async () => {
    await fixture(1);
    for (let start = 0; start < 300; start += 50) await env.DB.batch(Array.from({ length: 50 }, (_, j) => env.DB.prepare(
      "INSERT INTO versions (item_id,version,content_md,content_html,content_hash,published_at) VALUES ('card0',?, ?, ?, 'h','2025-01-01')"
    ).bind(start + j + 3, 'history'.repeat(1000), 'history'.repeat(1000))));
    for (let start = 0; start < 2000; start += 50) await env.DB.batch(Array.from({ length: 50 }, (_, j) => env.DB.prepare(
      "INSERT INTO media (id,item_id,r2_key,mime,created) VALUES (?, 'unrelated','unrelated.png','image/png','2025-01-01')"
    ).bind(`unrelated${start + j}`)));
    const settings = await getSettings(env.DB), meter = measured(env.DB);
    await feedPage(meter.db, settings, await listFeedItems(env.DB, 100), false, "", "https://example.com/");
    expect(meter.reads.reduce((n,r) => n + r.meta.rows_read, 0)).toBeLessThan(50);
    expect(JSON.stringify(meter.reads.flatMap(r => r.results))).not.toContain('historyhistory');
    expect(meter.reads.flatMap(r => r.results).every(row => typeof row === "object" && row !== null && !("content_md" in row))).toBe(true);
  });

  it("preserves local, withdrawn, frozen and legacy citations, thread images, avatar metadata and the blogroll", async () => {
    await fixture(4);
    await env.DB.prepare("UPDATE items SET kind='withdrawn', status='withdrawn', version=3 WHERE id='card2'").run();
    await env.DB.prepare("UPDATE versions SET transclusions='[]' WHERE item_id='card2'").run();
    const sources = [
      { id: "card0", version: 2 },
      { id: "card2", version: 2 },
      { id: "gone", version: 1 },
      { id: "remote", version: 1, origin: "https://remote.example/" },
      { id: "missing", version: 1, origin: "https://missing.example/" },
      { id: "frozen", version: 1, origin: "https://remote.example/", cited: { source: "Frozen source", url: "https://remote.example/frozen" }, selector: { exact: "quote" } },
    ];
    const quotes = sources.map((_, i) => `<blockquote class="blyg-transclusion"><p>Quote ${i}</p></blockquote>`).join('');
    await env.DB.prepare("UPDATE versions SET content_html=?, transclusions=? WHERE item_id='card3'").bind('<h1>Thread</h1>'+quotes, JSON.stringify(sources)).run();
    await env.DB.prepare("INSERT INTO subscriptions (id,kind,origin,feed_url,title,created,in_blogroll) VALUES ('sub','blyg','https://remote.example/','https://remote.example/feed.xml','Live source','2026-01-01',1)").run();
    await env.DB.prepare("INSERT INTO imported_items (subscription_id,remote_id,kind,state,version,observed_at,page) VALUES ('sub','remote','thread','current',1,'2026-01-01','/custom')").run();
    await env.DB.prepare("INSERT INTO media (id,item_id,r2_key,mime,alt,created) VALUES ('threadimg','card3','media/thread.png','image/png','thread image','2026-01-01')").run();
    await env.DB.prepare("INSERT INTO version_media (item_id,version,media_id) VALUES ('card3',2,'threadimg')").run();
    await env.DB.prepare("INSERT INTO media (id,r2_key,mime,created) VALUES ('avatar','media/avatar.png','image/png','2026-01-01')").run();
    const settings = { ...await getSettings(env.DB), avatar_media_id: 'avatar' }, meter = measured(env.DB);
    const html = await feedPage(meter.db, settings, await listFeedItems(env.DB, 101), false, '/mounted', 'https://example.com/mounted/');
    expect(html).toContain('href="/mounted/f/card0/"');
    expect(html).toContain('href="/mounted/t/card2/"');
    expect(html).toContain('href="/mounted/f/gone/"');
    expect(html).toContain('href="https://remote.example/custom"');
    expect(html).toContain('from <em>Live source</em>');
    expect(html).toContain('from <em>Frozen source</em>');
    expect(html).toContain('excerpt of v1');
    expect(html).toContain('href="https://missing.example/f/missing/"');
    expect(html).toContain('src="/mounted/media/thread.png"');
    expect(html).toContain('src="/mounted/media/avatar.png"');
    expect(html).toContain('property="og:image" content="https://example.com/mounted/media/avatar.png"');
    expect(html).toContain('Also reading');
    expect(html).not.toContain('data-item="card2"');
    expect(meter.calls).toBeLessThanOrEqual(8); // +1 since 0.24.0: the Collections list (one fixed query, not per card)
  });

  it("renders an empty page at the domain root", async () => {
    const meter = measured(env.DB);
    const html = await feedPage(meter.db, await getSettings(env.DB), [], false, '', 'https://example.com/');
    expect(html).toContain('Nothing published yet.');
    expect(html).toContain('href="/feed.xml"');
    expect(html).not.toContain('older items →');
    expect(meter.calls).toBeLessThanOrEqual(6); // +1 since 0.24.0: the Collections list (one fixed query, not per card)
  });

  it("bounds public list reads with 5,000 unrelated drafts", async () => {
    await fixture(100);
    for (let start = 0; start < 5000; start += 50) await env.DB.batch(Array.from({length: 50}, (_, j) => env.DB.prepare(
      "INSERT INTO items (id,status,created,updated) VALUES (?,'draft','2026-01-01','2026-12-01')"
    ).bind(`draft${start+j}`)));
    const meter = measured(env.DB);
    const rows = await listFeedItems(meter.db, 101);
    expect(rows).toHaveLength(100);
    expect(rows[0].id).toBe('card99');
    expect(rows[0]).not.toHaveProperty('content_md');
    expect(rows[0]).not.toHaveProperty('tk_provenance_json');
    expect(rows[99].id).toBe('card0');
    expect(meter.reads.reduce((n,r) => n + r.meta.rows_read, 0)).toBeLessThan(250);
  });

  it.each(['', '/notes/b'])("bounds the complete GET %s/ and preserves the 100-card window", async mount => {
    await fixture(101);
    const meter = measured(env.DB);
    const response = await makeApp(mount).fetch(new Request(`https://example.com${mount}/`), { ...env, DB: meter.db });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    const html = await response.text();
    expect(html.match(/<article class=/g)).toHaveLength(100);
    expect(html).toContain('data-item="card100"');
    expect(html).not.toContain('data-item="card0"');
    expect(html).toContain(`href="${mount}/archive/"`);
    // +1 since 0.24.0: the Collections list (one fixed query, not per card).
    // +2 since session 46: the pace-layered default reads the history (one
    // batch) and then the shown cards by id.
    expect(meter.calls).toBeLessThanOrEqual(10);
  });

  it("uses an ordered index for the limited public-item query", async () => {
    const plan = await env.DB.prepare("EXPLAIN QUERY PLAN SELECT * FROM items WHERE status IN ('public','withdrawn') ORDER BY updated DESC, rowid DESC LIMIT 101").all<{ detail: string }>();
    expect(plan.results.map(r=>r.detail).join('\n')).toContain('items_public_order');
    expect(plan.results.map(r=>r.detail).join('\n')).not.toContain('TEMP B-TREE');
  });

  it("renders feed.xml in a fixed number of queries, however many items it carries", async () => {
    // #33 (studio): one query per feed event took live feeds to ~29s and
    // readers called them invalid. The count must not grow with the window.
    await fixture(50);
    await env.DB.prepare("UPDATE items SET kind='withdrawn', status='withdrawn', version=3 WHERE id='card4'").run();
    await env.DB.prepare("INSERT INTO versions (item_id,version,content_md,content_html,content_hash,published_at) VALUES ('card4',3,'','','h','2026-01-03')").run();
    await env.DB.prepare("UPDATE versions SET transclusions=? WHERE item_id='card1'").bind(JSON.stringify([{ id: "card0", version: 2 }])).run();
    const settings = await getSettings(env.DB), meter = measured(env.DB);
    const xml = await buildFeedXml(meter.db, settings, "https://example.com/blyg/");
    expect(xml).toContain("<blyg:id>card49</blyg:id>");
    expect(xml).toContain("<blyg:kind>withdrawn</blyg:kind>");
    expect(meter.calls).toBeLessThanOrEqual(10);
  });
});

