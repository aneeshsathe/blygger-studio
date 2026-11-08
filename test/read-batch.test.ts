import { SELF, env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { Hono } from 'hono';
import { beforeEach, expect, it } from 'vitest';
import { BlyggerApi, createBlyggerClient, unwrap } from '../sdk/dist/browser.js';
import { createOwnerApi } from '../src/owner-api.ts';
import { BASE, apiJson, login } from './helpers.ts';

let cookie: string;
beforeEach(async () => { cookie = await login(); });
const batch = (operation: string, requests: unknown[]) => apiJson(cookie, 'POST', '/blyg/api/read-batch', { operation, requests });

it('returns the same item resources and ordered errors as individual reads through the SDK', async () => {
  const client = createBlyggerClient({ baseUrl: BASE + '/blyg/api', headers: { cookie }, fetch: (input, init) => SELF.fetch(new Request(input, init)) });
  const first = await unwrap(BlyggerApi.createItem({ client, body: { contentMd: 'First' } }));
  const second = await unwrap(BlyggerApi.createItem({ client, body: { contentMd: 'Second' } }));
  const result = await unwrap(BlyggerApi.batchRead({ client, body: { operation: 'getItem', requests: [
    { path: { id: second.id } }, { path: { id: 'missing' } }, { path: { id: first.id } },
  ] } }));
  expect(result.map(row => row.status)).toEqual([200, 404, 200]);
  expect(result[0].body).toEqual(await unwrap(BlyggerApi.getItem({ client, path: { id: second.id } })));
  expect(result[1].body).toEqual({ code: 'not-found', message: 'not found' });
  expect(result[2].body).toEqual(await unwrap(BlyggerApi.getItem({ client, path: { id: first.id } })));
});

it('isolates malformed Unicode paths without losing siblings or bypassing read charges', async () => {
  const item = await apiJson(cookie, 'POST', '/blyg/api/items', { contentMd: 'Valid sibling' });
  await env.DB.prepare('DELETE FROM security_budgets').run();
  const result = await batch('getItem', [
    { path: { id: item.json.id } }, { path: { id: '\ud800' } },
    { path: { id: '\udc00' } }, { path: { id: 'missing-😀' } }, { path: { id: item.json.id } },
  ]);
  expect(result.status).toBe(200);
  expect(result.json.map((row: { status: number }) => row.status)).toEqual([200, 400, 400, 404, 200]);
  expect(result.json[0].body).toMatchObject({ id: item.json.id, contentMd: 'Valid sibling' });
  expect(result.json[4].body).toEqual(result.json[0].body);
  for (const index of [1, 2]) expect(result.json[index].body).toMatchObject({ code: 'invalid-input' });
  const counters = (await env.DB.prepare('SELECT used FROM security_budgets').all<{ used: number }>()).results;
  expect(counters.map(row => row.used)).toEqual([6]); // Envelope plus all five children.
});

it('keeps validation, independent cursors, expiry, and fresh post-write counts', async () => {
  await env.DB.batch(Array.from({ length: 4 }, (_, n) => env.DB.prepare(`INSERT INTO mentions_in
    (id,source,target,target_item_id,status,first_seen,last_seen,verified_at,hidden)
    VALUES(?,?,'target','batch-target','verified','first',?,?,0)`).bind(`batch-${n}`, `https://source.test/${n}`, String(n), String(n))));
  const first = await batch('listMentions', [{ query: { targetItemId: 'batch-target', limit: '2' } }, { query: { limit: '0' } }]);
  expect(first.json.map((row: { status: number }) => row.status)).toEqual([200, 400]);
  const cursor = first.json[0].body.page.nextCursor;
  expect(cursor).toBeTypeOf('string');
  const next = await batch('listMentions', [{ query: { targetItemId: 'batch-target', limit: '2', cursor } }]);
  expect(next.json[0].body.items.map((row: { id: string }) => row.id)).toEqual(['batch-1', 'batch-0']);
  await apiJson(cookie, 'PATCH', '/blyg/api/mentions/batch-3', { hidden: true });
  expect((await batch('listMentionGroups', [{ query: { targetItemId: 'batch-target' } }])).json[0].body.items[0]).toMatchObject({ total: 4, visible: 3 });
  expect((await batch('listMentions', [{ query: { targetItemId: 'batch-target', cursor } }])).json[0]).toMatchObject({ status: 409, body: { code: 'cursor-expired' } });
});

it.each([
  { operation: 'createItem', requests: [{}] },
  { operation: 'batchRead', requests: [{}] },
  { operation: 'getItem', requests: [] },
  { operation: 'getItem', requests: Array.from({ length: 51 }, () => ({})) },
  { operation: 'getItem', requests: [{ body: { contentMd: 'not a read' } }] },
  { operation: 'getItem', requests: [{ method: 'DELETE' }] },
  { operation: 'getItem', requests: [{ path: { id: 123 } }] },
])('rejects malformed or non-read envelopes: %j', async body => {
  expect((await apiJson(cookie, 'POST', '/blyg/api/read-batch', body)).status).toBe(400);
});

it('requires a session or read scope and preserves the owner origin check', async () => {
  const body = JSON.stringify({ operation: 'getMentionSummary', requests: [{}] });
  expect((await SELF.fetch(BASE + '/blyg/api/read-batch', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status).toBe(401);
  expect((await SELF.fetch(BASE + '/blyg/api/read-batch', { method: 'POST', headers: { cookie, 'content-type': 'application/json', origin: 'https://other.test' }, body })).status).toBe(403);
  for (const [scope, expected] of [[['owner:manage'], 403], [['owner:read'], 200]] as const) {
    const app = new Hono().route('/api', createOwnerApi({ scope: [...scope], clientId: 'batch-permission', userId: 'owner' }));
    const ctx = createExecutionContext();
    const response = await app.fetch(new Request(BASE + '/api/read-batch', { method: 'POST', headers: { 'content-type': 'application/json' }, body }), { ...env, MOUNT: '' }, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(expected);
  }
});

it('charges every child to the same read budget and returns its retry hint', async () => {
  const app = new Hono().route('/api', createOwnerApi({ scope: ['owner:read'], clientId: 'batch-budget', userId: 'owner' }));
  const ctx = createExecutionContext();
  const response = await app.fetch(new Request(BASE + '/api/read-batch', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation: 'getMentionSummary', requests: [{}, {}, {}] }),
  }), { ...env, MOUNT: '', API_READ_LIMIT: '3' }, ctx);
  await waitOnExecutionContext(ctx);
  expect(response.status).toBe(200);
  const rows = await response.json() as { status: number; headers: Record<string, string> }[];
  expect(rows.map(row => row.status).sort()).toEqual([200, 200, 429]);
  expect(rows.find(row => row.status === 429)?.headers['Retry-After']).toBe('60');
});
