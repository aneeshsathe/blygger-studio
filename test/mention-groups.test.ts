import { SELF, env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { Hono } from 'hono';
import { apiJson, BASE, login } from './helpers.ts';
import { createOwnerApi } from '../src/owner-api.ts';
import { mentionGroups, mentionSummary } from '../src/mention-groups.ts';
import { cursorPage } from '../src/cursor-page.ts';
import type { MentionInRow, MentionOutRow } from '../src/types.ts';
import { MentionGroupSchema } from '../src/contract/resources.ts';

let cookie: string;
const receipts = [
  ['a-old', 'A', 'verified', '2', '9', 0], ['zz', 'A', 'verified', '3', '3', 0],
  ['zy', 'A', 'gone', '3', '2', 0], ['aa-old', 'A', 'verified', '1', '9', 1],
  ['b-new', 'B', 'verified', '3', '4', 0], ['b-hidden', 'B', 'verified', '3', '4', 1],
  ['cc', 'C', 'verified', '3', '3', 0],
  ['null', 'D', 'verified', null, '9', 0], ['empty', 'D', 'verified', '', '1', 0],
  ['pending', 'E', 'pending', '9', '9', 0], ['failed', 'F', 'failed', '9', '9', 0],
] as const;
beforeEach(async () => {
  cookie = await login();
  await env.DB.batch([env.DB.prepare('DELETE FROM mentions_in'), env.DB.prepare('DELETE FROM mentions_out')]);
  await env.DB.batch(receipts.map(([id, target, status, verified, seen, hidden]) => env.DB.prepare(`INSERT INTO mentions_in
    (id,source,target,target_item_id,status,first_seen,last_seen,verified_at,hidden)
    VALUES (?,?,'target',?,?,'first',?,?,?)`).bind(id, `https://groups/${id}`, target, status, seen, verified, hidden)));
  await env.DB.batch(['pending', 'sent', 'failed', 'no_endpoint'].map((status, i) => env.DB.prepare(`INSERT INTO mentions_out
    (id,item_id,version,target,status,created) VALUES (?,'item',1,?,?,?)`).bind(`out-${i}`, `https://out/${i}`, status, String(i))));
});
const get = (path: string) => apiJson(cookie, 'GET', '/blyg/api' + path);

it('pages exact group winners and counts, including hidden and gone receipts', async () => {
  const first = await get('/mention-groups?limit=2');
  expect(first.status).toBe(200);
  expect(first.json.items).toEqual([
    { targetItemId: 'B', total: 2, visible: 1, verifiedAt: '3', lastSeen: '4', firstId: 'b-hidden' },
    { targetItemId: 'C', total: 1, visible: 1, verifiedAt: '3', lastSeen: '3', firstId: 'cc' },
  ]);
  const next = await get('/mention-groups?' + new URLSearchParams({ limit: '2', cursor: first.json.page.nextCursor }));
  expect(next.json.items).toEqual([
    { targetItemId: 'A', total: 4, visible: 2, verifiedAt: '3', lastSeen: '3', firstId: 'zz' },
    { targetItemId: 'D', total: 2, visible: 2, verifiedAt: '', lastSeen: '9', firstId: 'null' },
  ]);
  expect(next.json.page.nextCursor).toBeNull();
  for (const row of [...first.json.items, ...next.json.items]) expect(MentionGroupSchema.safeParse(row).success).toBe(true);
  expect((await get('/mentions/summary')).json).toEqual({ inbound: 9, outbound: 4, groups: 4 });
});

it('filters group fields after calculating full target counts and binds cursor scopes', async () => {
  const exact = await get('/mention-groups?targetItemId=A&verifiedAt=3&lastSeen=3&firstId=zz');
  expect(exact.json.items).toEqual([{ targetItemId: 'A', total: 4, visible: 2, verifiedAt: '3', lastSeen: '3', firstId: 'zz' }]);
  expect((await get('/mention-groups?verifiedAt=')).json.items.map((row: { targetItemId: string }) => row.targetItemId)).toEqual(['D']);
  expect((await get('/mention-groups?targetItemId=missing')).json.items).toEqual([]);
  const first = await get('/mention-groups?limit=1');
  const crossed = await get('/mention-groups?' + new URLSearchParams({ targetItemId: 'A', cursor: first.json.page.nextCursor }));
  expect(crossed.status).toBe(400);
  await env.DB.prepare("UPDATE mentions_in SET hidden=1 WHERE id='zz'").run();
  const expired = await get('/mention-groups?' + new URLSearchParams({ cursor: first.json.page.nextCursor }));
  expect(expired.status).toBe(409); expect(expired.json.code).toBe('cursor-expired');
  expect((await get('/mentions/summary')).json).toEqual({ inbound: 9, outbound: 4, groups: 4 });
  expect((await get('/mention-groups?targetItemId=A')).json.items[0]).toMatchObject({ total: 4, visible: 1 });
});

it('pages target receipts and keeps NULL, empty-string and outbound boundaries distinct', async () => {
  const ids: string[] = []; let cursor: string | undefined;
  do {
    const page = await get('/mentions?' + new URLSearchParams({ targetItemId: 'A', limit: '1', ...(cursor ? { cursor } : {}) }));
    expect(page.status).toBe(200);
    ids.push(...page.json.items.map((row: { id: string }) => row.id)); cursor = page.json.page.nextCursor ?? undefined;
  } while (cursor);
  expect(ids).toEqual(['zz', 'zy', 'a-old', 'aa-old']);
  expect((await get('/mentions?targetItemId=D&verifiedAtNull=true&lastSeen=9&id=null')).json.items.map((row: { id: string }) => row.id)).toEqual(['null']);
  expect((await get('/mentions?targetItemId=D&verifiedAt=&lastSeen=1&id=empty')).json.items.map((row: { id: string }) => row.id)).toEqual(['empty']);
  expect((await get('/mentions?direction=outbound&created=2&id=out-2')).json.items.map((row: { id: string }) => row.id)).toEqual(['out-2']);
  const ordered = await get('/mentions?targetItemId=D');
  expect(ordered.json.items.map((row: { id: string }) => row.id)).toEqual(['empty', 'null']);
});

it.each(['direction=outbound&targetItemId=A', 'direction=outbound&verifiedAt=', 'direction=outbound&verifiedAtNull=true', 'direction=outbound&lastSeen=9', 'created=0', 'verifiedAt=&verifiedAtNull=true', 'verifiedAtNull=false', 'offset=0', 'limit=0', 'bogus=1'])('rejects invalid mention filters: %s', async query => {
  expect((await get('/mentions?' + query)).status).toBe(400);
});

it.each(['offset=0', 'limit=0', 'verifiedAtNull=true', 'bogus=1'])('rejects invalid group inputs: %s', async query => {
  expect((await get('/mention-groups?' + query)).status).toBe(400);
});

it('retains old unfiltered inbound and outbound cursor identities', async () => {
  for (const direction of ['inbound', 'outbound'] as const) {
    const first = direction === 'inbound'
      ? await cursorPage<MentionInRow>(env.DB, { limit: 1 }, { name: 'mentions', filters: [direction], domains: ['mentions'], sql: "SELECT * FROM mentions_in WHERE status IN ('verified','gone')", order: [{ column: 'verified_at', direction: 'desc' }, { column: 'last_seen', direction: 'desc' }, { column: 'id', direction: 'asc' }] })
      : await cursorPage<MentionOutRow>(env.DB, { limit: 1 }, { name: 'mentions', filters: [direction], domains: ['mentions'], sql: 'SELECT * FROM mentions_out', order: [{ column: 'created', direction: 'desc' }, { column: 'id', direction: 'asc' }] });
    expect((await get('/mentions?' + new URLSearchParams({ direction, limit: '1', cursor: first.page.nextCursor! }))).status).toBe(200);
  }
});

it('uses one bounded group query and one count query rather than per-group reads', async () => {
  const queries: string[] = [];
  const db = new Proxy(env.DB, { get(target, key) {
    if (key === 'prepare') return (sql: string) => { queries.push(sql); return target.prepare(sql); };
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const page = await mentionGroups(db, { limit: 1 });
  expect(page.items).toHaveLength(1);
  expect(queries).toHaveLength(3); // generation, one aggregate page, generation
  expect(queries.filter(sql => sql.includes('aggregate_mentions'))).toHaveLength(1);
  expect(queries.find(sql => sql.includes('aggregate_mentions'))).toContain('LIMIT ?');
  queries.length = 0;
  expect(await mentionSummary(db)).toEqual({ inbound: 9, outbound: 4, groups: 4 });
  expect(queries).toHaveLength(1);
});

it('protects both new reads with owner read access', async () => {
  for (const path of ['/mention-groups', '/mentions/summary']) {
    expect((await SELF.fetch(BASE + '/blyg/api' + path)).status).toBe(401);
    for (const [scope, status] of [[['owner:manage'], 403], [['owner:read'], 200]] as const) {
      const app = new Hono().route('/api', createOwnerApi({ scope: [...scope], clientId: 'mentions', userId: 'owner' }));
      const ctx = createExecutionContext();
      const response = await app.fetch(new Request(BASE + '/api' + path), env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(status);
    }
  }
});

it('aggregates once on continuation and uses the target index for point groups and receipt pages', async () => {
  const first = await mentionGroups(env.DB, { limit: 1 });
  let sql = '', binds: unknown[] = [];
  const db = new Proxy(env.DB, { get(target, key) {
    if (key === 'prepare') return (query: string) => {
      const statement = target.prepare(query);
      return new Proxy(statement, { get(target, key) {
        if (key === 'bind') return (...values: unknown[]) => {
          if (query.includes('cursor_source')) { sql = query; binds = values; }
          return target.bind(...values);
        };
        const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
      } });
    };
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  expect((await mentionGroups(db, { limit: 1, cursor: first.page.nextCursor! })).items[0].targetItemId).toBe('C');
  const plan = (await env.DB.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...binds).all<{ detail: string }>()).results.map(row => row.detail);
  expect(plan.filter(detail => /(?:SCAN|SEARCH) mentions_in\b/.test(detail))).toHaveLength(1);
  expect(plan.filter(detail => detail.includes('MATERIALIZE cursor_source'))).toHaveLength(1);
  await mentionGroups(db, { targetItemId: 'A', limit: 1 });
  const pointPlan = (await env.DB.prepare('EXPLAIN QUERY PLAN ' + sql).bind(...binds).all<{ detail: string }>()).results.map(row => row.detail);
  expect(pointPlan.some(detail => /SEARCH mentions_in USING (?:COVERING )?INDEX mentions_in_(?:target(?:_private_order)?|group_covering) \(target_item_id=\?/.test(detail))).toBe(true);
  const receiptPlan = (await env.DB.prepare("EXPLAIN QUERY PLAN SELECT * FROM mentions_in WHERE status IN ('verified','gone') AND target_item_id IS ? ORDER BY verified_at DESC,last_seen DESC,id ASC LIMIT 26").bind('A').all<{ detail: string }>()).results.map(row => row.detail);
  expect(receiptPlan.some(detail => detail.includes('SEARCH mentions_in USING INDEX mentions_in_target_private_order (target_item_id=?)'))).toBe(true);
  expect(receiptPlan.some(detail => detail.includes('TEMP B-TREE'))).toBe(false);
});

it('binds hostile filter values and returns empty counts when no receipts remain', async () => {
  const hostile = new URLSearchParams({ targetItemId: "A' OR 1=1 --" });
  expect((await get('/mention-groups?' + hostile)).json.items).toEqual([]);
  expect((await get('/mentions?' + hostile)).json.items).toEqual([]);
  await env.DB.batch([env.DB.prepare('DELETE FROM mentions_in'), env.DB.prepare('DELETE FROM mentions_out')]);
  expect((await get('/mention-groups')).json.items).toEqual([]);
  expect((await get('/mentions/summary')).json).toEqual({ inbound: 0, outbound: 0, groups: 0 });
});
