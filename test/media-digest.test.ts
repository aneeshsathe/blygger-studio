import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { makeApp } from '../src/index.ts';

let browser = 0;
async function fixture(mount: string) {
  const app = makeApp(mount), base = 'https://digest.example';
  const receive = async (path: string, init: RequestInit = {}) => {
    const ctx = createExecutionContext(), response = await app.fetch(new Request(new URL(path, base), init), env, ctx);
    await waitOnExecutionContext(ctx); return response;
  };
  const login = await receive(mount + '/studio/login', { method: 'POST', headers: { 'CF-Connecting-IP': `2001:db8:88:${++browser}::1` }, body: new URLSearchParams({ password: env.OWNER_PASSWORD }) });
  const cookie = login.headers.get('set-cookie')!.split(';')[0];
  const json = async (method: string, path: string, body?: unknown) => {
    const response = await receive(mount + '/api' + path, { method, headers: { cookie, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    expect(response.status).toBe(method === 'POST' && path === '/items' ? 201 : 200);
    return response.json<any>();
  };
  const upload = async (item?: { id: string; revision: number }, inline = false) => {
    const form = new FormData(); form.set('file', new File(['fixed digest bytes'], 'file.png', { type: 'image/png' }));
    if (item) { form.set('itemId', item.id); form.set('expectedRevision', String(item.revision)); }
    if (inline) form.set('inline', 'true');
    const response = await receive(mount + '/api/media', { method: 'POST', headers: { cookie }, body: form });
    return { status: response.status, ...await response.json<any>() };
  };
  return { receive, json, upload, cookie, base, mount };
}
const bytes = async (response: Response) => { expect(await response.text()).toBe('fixed digest bytes'); };
const immutable = 'public, max-age=31536000, immutable';

it.each(['', '/notes/b'])('keeps fresh/duplicate and working/published digest URLs consistent at %s', async mount => {
  const f = await fixture(mount), item = await f.json('POST', '/items', { contentMd: 'Digest attachment' });
  const fresh = await f.upload(item);
  expect(fresh.status).toBe(201);
  expect(fresh.url).toMatch(new RegExp(`^${f.base}${mount}/media/${fresh.id}/[a-f0-9]{64}\\.png$`));
  const stored = await env.DB.prepare('SELECT sha256,r2_key FROM media WHERE id=?').bind(fresh.id).first<{ sha256: string; r2_key: string }>();
  const expectedHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fixed digest bytes')))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  expect(stored).toEqual({ sha256: expectedHash, r2_key: `media/${fresh.id}/${expectedHash}.png` });
  const duplicate = await f.upload({ id: item.id, revision: fresh.revision });
  expect(duplicate).toMatchObject({ status: 200, id: fresh.id, url: fresh.url, revision: fresh.revision, duplicate: true });
  expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM media WHERE item_id=?').bind(item.id).first<{ n: number }>())!.n).toBe(1);
  const working = await f.json('GET', `/items/${item.id}`);
  expect(working.media.map((row: { url: string }) => row.url)).toEqual([fresh.url]);
  expect(working.publishedMedia).toEqual([]);
  const privateRead = await f.receive(fresh.url, { headers: { cookie: f.cookie } });
  expect(privateRead.status).toBe(200); expect(privateRead.headers.get('cache-control')).toBe('no-store');
  const tag = privateRead.headers.get('etag')!; await bytes(privateRead);
  const hidden = await f.receive(fresh.url, { headers: { 'If-None-Match': tag } });
  expect(hidden.status).toBe(404); expect(hidden.headers.get('cache-control')).toBe('no-store');
  const published = await f.json('POST', `/items/${item.id}/publish`, { expectedRevision: fresh.revision });
  const detail = await f.json('GET', `/items/${item.id}`);
  expect(detail.publishedMedia.map((row: { url: string }) => row.url)).toEqual([fresh.url]);
  const publicRead = await f.receive(fresh.url);
  expect(publicRead.status).toBe(200); expect(publicRead.headers.get('cache-control')).toBe(immutable);
  expect(publicRead.headers.get('x-content-type-options')).toBe('nosniff');
  expect(publicRead.headers.get('content-security-policy')).toContain('sandbox'); await bytes(publicRead);
  for (const method of ['GET', 'HEAD']) {
    const valid = await f.receive(fresh.url, { method, headers: { 'If-None-Match': `"other", ${tag}`, Origin: 'https://reader.example' } });
    expect(valid.status).toBe(304); expect(await valid.text()).toBe('');
    expect(valid.headers.get('cache-control')).toBe(immutable); expect(valid.headers.get('etag')).toBe(tag);
    expect(valid.headers.get('access-control-allow-origin')).toBe('*');
  }
  const detached = await f.json('DELETE', `/media/${fresh.id}`, { expectedRevision: published.revision });
  expect(detached.outcome).toBe('detached');
  await f.json('POST', `/items/${item.id}/withdraw`, { expectedRevision: detached.revision });
  await bytes(await f.receive(fresh.url));
  const wrong = await f.receive(fresh.url.replace(expectedHash, '0'.repeat(64)), { headers: { 'If-None-Match': '*' } });
  expect(wrong.status).toBe(404); expect(wrong.headers.get('cache-control')).toBe('no-store');
});

it.each(['', '/notes/b'])('keeps legacy random URLs revalidatable at %s', async mount => {
  const f = await fixture(mount), item = await f.json('POST', '/items', { contentMd: 'Legacy attachment' });
  const id = `legacy${++browser}`, key = `media/${id}.png`;
  await env.MEDIA.put(key, 'fixed digest bytes', { httpMetadata: { contentType: 'image/png' } });
  await env.DB.prepare('INSERT INTO media(id,item_id,r2_key,mime,created,inline) VALUES (?,?,?,\'image/png\',\'2026-10-31\',0)').bind(id,item.id,key).run();
  await f.json('POST', `/items/${item.id}/publish`, { expectedRevision: item.revision });
  const response = await f.receive(`${mount}/${key}`);
  expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('public, no-cache');
  const tag = response.headers.get('etag')!; await bytes(response);
  const validated = await f.receive(`${mount}/${key}`, { headers: { 'If-None-Match': tag } });
  expect(validated.status).toBe(304); expect(validated.headers.get('cache-control')).toBe('public, no-cache');
});

it.each(['', '/notes/b'])('revalidates a deletable avatar even at a digest URL at %s', async mount => {
  const f = await fixture(mount), media = await f.upload();
  expect(media.url).toMatch(/\/media\/[^/]+\/[a-f0-9]{64}\.png$/);
  await f.json('PATCH', '/settings', { avatarMediaId: media.id });
  const avatar = await f.receive(media.url); expect(avatar.status).toBe(200);
  expect(avatar.headers.get('cache-control')).toBe('public, no-cache'); await bytes(avatar);
  await f.json('PATCH', '/settings', { avatarMediaId: '' });
  expect((await f.receive(media.url)).status).toBe(404);
  expect((await f.json('DELETE', `/media/${media.id}`, {})).outcome).toBe('deleted');
});

it('retains a draft-owned file when a published post already references its URL', async () => {
  const f = await fixture(''), draft = await f.json('POST', '/items', { contentMd: 'Never published owner' });
  const media = await f.upload(draft, true);
  const using = await f.json('POST', '/items', { kind: 'thread', contentMd: `![shared](${media.url})` });
  await f.json('POST', `/items/${using.id}/publish`, { expectedRevision: using.revision });
  await bytes(await f.receive(media.url));
  await f.json('DELETE', `/items/${draft.id}`, { expectedRevision: media.revision });
  const retained = await f.receive(media.url); expect(retained.status).toBe(200);
  expect(retained.headers.get('cache-control')).toBe(immutable); await bytes(retained);
});

it('keeps a draft-owned avatar available after discarding its draft', async () => {
  const f = await fixture(''), draft = await f.json('POST', '/items', { contentMd: 'Avatar owner' });
  const media = await f.upload(draft);
  await f.json('PATCH', '/settings', { avatarMediaId: media.id });
  await f.json('DELETE', `/items/${draft.id}`, { expectedRevision: media.revision });
  const avatar = await f.receive(media.url);
  expect(avatar.status).toBe(200); expect(avatar.headers.get('cache-control')).toBe('public, no-cache'); await bytes(avatar);
  expect(await env.DB.prepare('SELECT item_id FROM media WHERE id=?').bind(media.id).first()).toEqual({ item_id: null });
});

it('revalidates a later attachment until a published version retains it', async () => {
  const f = await fixture(''), draft = await f.json('POST', '/items', { contentMd: 'Published owner' });
  const published = await f.json('POST', `/items/${draft.id}/publish`, { expectedRevision: draft.revision });
  const media = await f.upload({ id: draft.id, revision: published.revision });
  const exposed = await f.receive(media.url);
  expect(exposed.status).toBe(200); expect(exposed.headers.get('cache-control')).toBe('public, no-cache'); await bytes(exposed);
  expect((await f.json('DELETE', `/media/${media.id}`, { expectedRevision: media.revision })).outcome).toBe('deleted');
  expect((await f.receive(media.url)).status).toBe(404);
});

it('returns a known-hash legacy duplicate at its existing URL without a revision change', async () => {
  const f = await fixture(''), draft = await f.json('POST', '/items', { contentMd: 'Legacy duplicate' });
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fixed digest bytes')))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const key = 'media/legacy-duplicate.png';
  await env.MEDIA.put(key, 'fixed digest bytes', { httpMetadata: { contentType: 'image/png' } });
  await env.DB.prepare("INSERT INTO media(id,item_id,r2_key,mime,created,inline,sha256) VALUES ('legacy-duplicate',?,?,'image/png','2026-10-31',0,?)").bind(draft.id, key, sha256).run();
  const duplicate = await f.upload(draft);
  expect(duplicate).toMatchObject({ status: 200, id: 'legacy-duplicate', duplicate: true, revision: draft.revision, url: `${f.base}/${key}` });
  await bytes(await f.receive(duplicate.url, { headers: { cookie: f.cookie } }));
});

it.each(['', '/notes/b'])('gives private API preflight an explicit no-store policy at %s', async mount => {
  const f = await fixture(mount);
  const response = await f.receive(mount + '/api/items', { method: 'OPTIONS', headers: { Origin: 'https://reader.example', 'Access-Control-Request-Method': 'POST' } });
  expect(response.status).toBe(204); expect(await response.text()).toBe('');
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('access-control-allow-origin')).toBe('*');
});
