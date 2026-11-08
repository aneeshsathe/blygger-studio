import { env, SELF } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { BASE, login } from './helpers.ts';
import { createDraft } from '../src/model.ts';
import { readingData } from '../src/reading-data.ts';

it('serves exact tied item pages, rejects offsets, and expires a continuation after a write', async () => {
  const cookie = await login();
  const ids: string[] = [];
  for (let i = 0; i < 5; i++) ids.push((await createDraft(env.DB, `cursor ${i}`, 'fragment')).id);
  await env.DB.prepare("UPDATE items SET updated='2026-10-31T00:00:00Z'").run();
  const get = (query: string) => SELF.fetch(`${BASE}/blyg/api/items?${query}`, { headers: { cookie } });
  const seen: string[] = []; let cursor: string | undefined, firstCursor = '';
  do {
    const response = await get(new URLSearchParams({ limit: '2', ...(cursor ? { cursor } : {}) }).toString());
    expect(response.status).toBe(200);
    const result = await response.json<any>();
    expect(result).toEqual({ items: expect.any(Array), page: { limit: 2, nextCursor: expect.toBeOneOf([null, expect.any(String)]) } });
    seen.push(...result.items.map((row: { id: string }) => row.id));
    cursor = result.page.nextCursor ?? undefined; firstCursor ||= cursor ?? '';
  } while (cursor);
  expect(seen).toEqual([...ids].sort().reverse());
  const rejected = await get('offset=0&limit=2'); expect(rejected.status).toBe(400);
  await createDraft(env.DB, 'new generation', 'fragment');
  const expired = await get(new URLSearchParams({ cursor: firstCursor }).toString());
  expect(expired.status).toBe(409);
  expect(await expired.json()).toMatchObject({ code: 'cursor-expired', message: expect.any(String) });
});

it('keeps item filters before the window and binds their continuations', async () => {
  const cookie = await login();
  const ids: string[] = [];
  for (let i = 0; i < 4; i++) ids.push((await createDraft(env.DB, `filtered ${i}`, 'fragment')).id);
  await env.DB.prepare("UPDATE items SET status='public', version=1, dirty=1 WHERE id IN (?,?)").bind(ids[0], ids[1]).run();
  const response = await SELF.fetch(`${BASE}/blyg/api/items?status=public&dirty=true&limit=1`, { headers: { cookie } });
  expect(response.status).toBe(200); const page = await response.json<any>();
  expect(page.items).toHaveLength(1); expect(page.items[0]).toMatchObject({ status: 'public', dirty: true });
  const crossed = await SELF.fetch(`${BASE}/blyg/api/items?status=draft&cursor=${page.page.nextCursor}`, { headers: { cookie } });
  expect(crossed.status).toBe(400);
});

it('selects a bounded Reading identity page before loading bodies', async () => {
  await env.DB.prepare("INSERT INTO subscriptions(id,kind,origin,feed_url,title,created) VALUES ('cursor-sub','blyg','https://cursor.example/','https://cursor.example/feed.xml','Cursor','2026-10-31')").run();
  await env.DB.batch(Array.from({ length: 80 }, (_, i) => env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at,content_md,content_html) VALUES ('cursor-sub',?,'fragment','current',1,?,'2026-10-31T00:00:00Z','markdown',?)").bind(String(i).padStart(3, '0'), i % 2 ? '2027-10-31T00:00:00Z' : '2026-10-30T00:00:00Z', `<p>body ${i}</p>`)));
  let projectedBodies = 0;
  const wrap = (statement: D1PreparedStatement, sql: string): D1PreparedStatement => new Proxy(statement, { get(target, key) {
    if (key === 'bind') return (...values: unknown[]) => wrap(target.bind(...values), sql);
    if (key === 'all') return async () => { const result = await target.all(); if (sql.includes('rs.read_version')) projectedBodies += result.results.length; return result; };
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const db = new Proxy(env.DB, { get(target, key) {
    if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql), sql);
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const first = await readingData(db, { limit: 3 }, 'cursor-sub');
  const second = await readingData(db, { limit: 3, cursor: first.page.nextCursor! }, 'cursor-sub');
  expect([...first.items, ...second.items].map(row => row.imported?.remoteId)).toEqual(['001', '003', '005', '007', '009', '011']);
  expect(projectedBodies).toBe(6);
  expect(first.items[0].displayAt).toBe('2026-10-31T00:00:00Z');
});

it('separates history from current detail and pages memberships with absent bodies', async () => {
  const cookie = await login(); const item = await createDraft(env.DB, 'history', 'fragment');
  await env.DB.batch(Array.from({ length: 7 }, (_, i) => env.DB.prepare("INSERT INTO versions(item_id,version,kind,content_md,content_html,content_hash,published_at) VALUES (?,?,'fragment',?,'<p>history</p>','hash','2026-10-31')").bind(item.id, i + 1, `history ${i + 1}`)));
  await env.DB.prepare("UPDATE items SET version=7, status='public' WHERE id=?").bind(item.id).run();
  const detail = await SELF.fetch(`${BASE}/blyg/api/items/${item.id}`, { headers: { cookie } });
  expect(detail.status).toBe(200); const current = await detail.json<any>();
  expect(current).not.toHaveProperty('versions'); expect(current.published.version).toBe(7);
  const history = await SELF.fetch(`${BASE}/blyg/api/items/${item.id}/versions?limit=2`, { headers: { cookie } });
  expect(history.status).toBe(200); const versions = await history.json<any>();
  expect(versions.items.map((row: { version: number }) => row.version)).toEqual([7, 6]);
  expect(versions.page.nextCursor).toEqual(expect.any(String));
  await env.DB.prepare("INSERT INTO hoppers(id,name,public,created) VALUES ('cursor-hopper','Cursor',0,'2026-10-31')").run();
  await env.DB.prepare("INSERT INTO hopper_items(hopper_id,subscription_id,remote_id,added_at) VALUES ('cursor-hopper','~own',?,'2026-10-31')").bind(item.id).run();
  const hopper = await SELF.fetch(`${BASE}/blyg/api/hoppers/cursor-hopper`, { headers: { cookie } });
  expect(hopper.status).toBe(200); expect(await hopper.json()).toMatchObject({ total: 1, sourceCount: 0 });
  const members = await SELF.fetch(`${BASE}/blyg/api/hoppers/cursor-hopper/memberships?limit=1`, { headers: { cookie } });
  expect(members.status).toBe(200); expect(await members.json()).toMatchObject({ items: [{ subscriptionId: '~own', remoteId: item.id, item: null }], page: { limit: 1, nextCursor: null } });
});
