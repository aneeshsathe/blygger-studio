import { readFeedRevision } from './changes.ts';
import { getSettings } from './model.ts';
import { buildFeedXml, siteOrigin } from './protocol.ts';
import { CLIENT } from './client.ts';
import type { Env } from './types.ts';

// Bump the format if rendering changes without a software version change.
const renderer = `xml-1:${CLIENT.version}`;
type Generation = { epoch: string; revision: number };
type Artifact = { body: string | ReadableStream; httpEtag: string; generation: Generation | null };
const pending = new WeakMap<R2Bucket, Map<string, Promise<Artifact>>>();
const hex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
async function cacheKey(request: Request, mount: string) {
  const identity = JSON.stringify([renderer, new URL(request.url).origin, mount]);
  return `__cache/feed/${hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))))}.xml`;
}
function generationOf(object: R2Object): Generation | null {
  const metadata = object.customMetadata;
  if (!metadata?.epoch || metadata.renderer !== renderer || !/^\d+$/.test(metadata.revision ?? '')) return null;
  const revision = Number(metadata.revision);
  return Number.isSafeInteger(revision) ? { epoch: metadata.epoch, revision } : null;
}
async function readArtifact(bucket: R2Bucket, key: string): Promise<Artifact | null> {
  const object = await bucket.get(key);
  return object ? { body: object.body, httpEtag: object.httpEtag, generation: generationOf(object) } : null;
}
const satisfies = (artifact: Artifact | null, target: Generation) => artifact?.generation?.epoch === target.epoch && artifact.generation.revision >= target.revision;
const same = (a: Generation, b: Generation) => a.epoch === b.epoch && a.revision === b.revision;
function stamp(xml: string, generation: Generation) {
  // Hex-encoded UTF-8 cannot contain '--', even for an unusual restored epoch.
  const token = hex(new TextEncoder().encode(JSON.stringify([renderer, generation.epoch, generation.revision])));
  const declaration = xml.indexOf('?>');
  if (declaration < 0) throw new Error('feed XML declaration missing');
  return `${xml.slice(0, declaration + 2)}\n<!-- cache-generation:${token} -->${xml.slice(declaration + 2)}`;
}
async function rebuild(request: Request, env: Env, mount: string, key: string, initial: Artifact | null): Promise<Artifact> {
  let current = initial;
  for (let attempt = 0; attempt < 3; attempt++) {
    const target = await readFeedRevision(env.DB);
    if (satisfies(current, target)) return current!;
    const settings = await getSettings(env.DB);
    const xml = await buildFeedXml(env.DB, settings, siteOrigin(settings, request.url, mount));
    if (!same(target, await readFeedRevision(env.DB))) continue;
    const body = stamp(xml, target);
    const saved = await env.MEDIA.put(key, body, {
      onlyIf: new Headers(current ? { 'If-Match': current.httpEtag } : { 'If-None-Match': '*' }),
      customMetadata: { epoch: target.epoch, revision: String(target.revision), renderer },
      httpMetadata: { contentType: 'application/rss+xml; charset=utf-8' },
    });
    if (saved) return { body, httpEtag: saved.httpEtag, generation: target };
    // A winner may already satisfy the target. Observe it before any retry;
    // the next iteration checks current source rather than rerendering blindly.
    current = await readArtifact(env.MEDIA, key);
    if (satisfies(current, target)) return current!;
  }
  // Churn can exhaust our render attempts while another builder has saved
  // legal bytes. Reuse that same-key artifact under the existing SWR policy.
  const winner = await readArtifact(env.MEDIA, key);
  if (winner?.generation) return winner;
  throw new Error('feed source remained unstable');
}
function revalidate(request: Request, env: Env, mount: string, key: string, artifact: Artifact | null) {
  let jobs = pending.get(env.MEDIA);
  if (!jobs) { jobs = new Map(); pending.set(env.MEDIA, jobs); }
  const existing = jobs.get(key);
  if (existing) return existing;
  const job = rebuild(request, env, mount, key, artifact).finally(() => { jobs!.delete(key); });
  jobs.set(key, job);
  return job;
}
function matches(header: string | null, tag: string) {
  return header?.split(',').some(value => value.trim() === '*' || value.trim().replace(/^W\//, '') === tag) ?? false;
}
/** Scheduled events reuse the feed handler with a bodyless HEAD request. */
export async function refreshConfiguredFeed(env: Env, mount: string, waitUntil: (work: Promise<unknown>) => void): Promise<void> {
  const site = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site_url'").first<{ value: string }>();
  if (!site || typeof site.value !== 'string' || !URL.canParse(site.value)) return;
  const url = new URL(site.value);
  if (!['http:', 'https:'].includes(url.protocol)) return;
  const request = new Request(new URL('feed.xml', site.value.endsWith('/') ? site.value : site.value + '/'), { method: 'HEAD' });
  await cachedFeed(request, env, mount, waitUntil);
}
/** Request-driven SWR. A 304 validates saved bytes, not current D1 state. */
export async function cachedFeed(request: Request, env: Env, mount: string, waitUntil: (work: Promise<unknown>) => void): Promise<Response> {
  const key = await cacheKey(request, mount);
  let artifact = await readArtifact(env.MEDIA, key);
  if (artifact?.generation) {
    waitUntil(revalidate(request, env, mount, key, artifact).then(() => undefined).catch(() => { console.warn('Feed revalidation failed'); }));
  } else {
    const built = await revalidate(request, env, mount, key, artifact);
    // Shared cold callers need independent R2 streams, including when the
    // shared build lost to another isolate and returned that winner's stream.
    artifact = await readArtifact(env.MEDIA, key) ?? built;
  }
  const headers = new Headers({ 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-cache', 'ETag': artifact.httpEtag, 'Access-Control-Allow-Origin': '*' });
  if (matches(request.headers.get('If-None-Match'), artifact.httpEtag)) return new Response(null, { status: 304, headers });
  return new Response(request.method === 'HEAD' ? null : artifact.body, { headers });
}
