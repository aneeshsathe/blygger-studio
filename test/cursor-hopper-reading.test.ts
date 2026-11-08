import { env, SELF } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { BASE, login } from './helpers.ts';

it('pages hopper Reading after lens filters in membership order and expires changed membership', async () => {
  const cookie = await login();
  await env.DB.prepare("INSERT INTO subscriptions(id,kind,origin,feed_url,title,created) VALUES ('hopper-cursor-sub','blyg','https://hopper-cursor.example/','https://hopper-cursor.example/feed.xml','Hopper source','2026-10-31')").run();
  await env.DB.prepare("INSERT INTO hoppers(id,name,public,created) VALUES ('hopper-cursor','Cursor',0,'2026-10-31')").run();
  await env.DB.batch(Array.from({ length: 30 }, (_, i) => [
    env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,observed_at,content_md,content_html) VALUES ('hopper-cursor-sub',?,?,?,1,'2026-10-31','text',?)").bind(String(i), i % 2 ? 'thread' : 'fragment', i >= 28 ? 'tombstone' : 'current', `<p>member ${i}</p>`),
    env.DB.prepare("INSERT INTO hopper_items(hopper_id,subscription_id,remote_id,added_at) VALUES ('hopper-cursor','hopper-cursor-sub',?,?)").bind(String(i), `2026-10-31T00:00:${String(i).padStart(2, '0')}Z`),
  ]).flat());
  const get = async (path: string) => {
    const response = await SELF.fetch(BASE + '/blyg/api' + path, { headers: { cookie } });
    return { status: response.status, body: await response.json<any>() };
  };
  const first = await get('/reading?hopper=hopper-cursor&kind=thread&limit=3');
  expect(first.status).toBe(200);
  expect(first.body.items.map((row: any) => row.imported.remoteId)).toEqual(['27', '25', '23']);
  const second = await get('/reading?' + new URLSearchParams({ hopper: 'hopper-cursor', kind: 'thread', limit: '3', cursor: first.body.page.nextCursor }));
  expect(second.status).toBe(200);
  expect(second.body.items.map((row: any) => row.imported.remoteId)).toEqual(['21', '19', '17']);
  const summary = await get('/reading/summary?hopper=hopper-cursor&kind=thread');
  expect(summary.status).toBe(200); expect(summary.body.counts).toMatchObject({ all: 14, own: 0 });
  const background = await get('/reading?hopper=hopper-cursor&background=true');
  expect(background.body.items.map((row: any) => row.imported.remoteId)).toEqual(['29', '28']);
  // A membership without a held import stays in management, and does not consume Reading's window.
  await env.DB.prepare("INSERT INTO hopper_items(hopper_id,subscription_id,remote_id,added_at) VALUES ('hopper-cursor','hopper-cursor-sub','not-held','2030-01-01')").run();
  const expired = await get('/reading?' + new URLSearchParams({ hopper: 'hopper-cursor', kind: 'thread', cursor: first.body.page.nextCursor }));
  expect(expired.status).toBe(409); expect(expired.body.code).toBe('cursor-expired');
  const restarted = await get('/reading?hopper=hopper-cursor&kind=thread&limit=3');
  expect(restarted.body.items.map((row: any) => row.imported.remoteId)).toEqual(['27', '25', '23']);
});
