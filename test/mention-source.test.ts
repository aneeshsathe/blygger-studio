import { env } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { createSubscription, upsertL0Item } from '../src/importer/store.ts';
import { apiJson, login } from './helpers.ts';

it('source cards find the earliest whole-source subscription and ignore hopper-only imports', async () => {
  const origin = 'https://source.example/';
  const hopper = await createSubscription(env.DB, { kind: 'rss', origin, feedUrl: `${origin}hopper.xml`, title: 'Hopper only', hopperFeed: `${origin}hopper.xml` });
  const first = await createSubscription(env.DB, { kind: 'rss', origin, feedUrl: `${origin}feed.xml`, title: 'Whole source' });
  const second = await createSubscription(env.DB, { kind: 'rss', origin, feedUrl: `${origin}other.xml`, title: 'Other whole source' });
  await env.DB.batch([
    env.DB.prepare('UPDATE subscriptions SET created = ? WHERE id = ?').bind('2026-01-01', hopper.id),
    env.DB.prepare('UPDATE subscriptions SET created = ? WHERE id = ?').bind('2026-02-01', first.id),
    env.DB.prepare('UPDATE subscriptions SET created = ? WHERE id = ?').bind('2026-03-01', second.id),
    env.DB.prepare("INSERT INTO mentions_in (id, source, target, target_item_id, status, source_origin, source_id, first_seen, last_seen) VALUES ('source-card', ?, 'target', 'item', 'verified', ?, 'remote', 'now', 'now')").bind(`${origin}f/remote/`, origin),
  ]);
  const imported = { version: 1, contentMd: 'remote', contentHtml: '<p>remote</p>', contentHash: 'hash', observedAt: '2026-11-03T00:00:00Z', created: '2026-11-03T00:00:00Z', updated: '2026-11-03T00:00:00Z' };
  await upsertL0Item(env.DB, hopper.id, 'remote', imported);
  const cookie = await login();
  const read = () => apiJson(cookie, 'GET', '/blyg/api/mentions/source-card/source');
  const notHeld = await read();
  expect(notHeld.status).toBe(200);
  expect(notHeld.json).toMatchObject({ holder: null, subscription: { id: first.id, title: 'Whole source' } });
  await upsertL0Item(env.DB, second.id, 'remote', imported);
  const held = await read();
  expect(held.json).toMatchObject({ holder: second.id, subscription: { id: first.id } });
  await env.DB.prepare('UPDATE mentions_in SET source_origin = ? WHERE id = ?').bind('https://unfollowed.example/', 'source-card').run();
  expect((await read()).json).toEqual({ holder: null, subscription: null });
  expect((await apiJson(cookie, 'GET', '/blyg/api/mentions/missing/source')).status).toBe(404);
});
