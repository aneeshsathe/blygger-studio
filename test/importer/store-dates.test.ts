import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { applyEffect, createSubscription, getImportedItem, repairL0ItemDates, upsertL0Item } from '../../src/importer/store.ts';
import type { NormalizedItemDoc } from '../../src/importer/transition.ts';

const observed = '2026-08-05T01:02:03Z';
const initialDate = '2026-06-01T00:00:00Z';
const body = { content_md: 'Exact **body**\n', content_html: '<p>Exact <strong>body</strong></p>\n', content_hash: 'unchanged-hash' };
const dates = [
  ['RFC-822', 'Wed, 01 Jul 2026 00:00:00 GMT', '2026-07-01T00:00:00Z'],
  ['offset and fractional seconds', '2026-07-01T03:30:00.987+03:30', '2026-07-01T00:00:00Z'],
  ['invalid', 'not a date', null],
  ['missing', '', null],
] as const;
const doc = (date: string, version = 2): NormalizedItemDoc => ({ id: 'remote', kind: 'fragment', version, created: date, updated: date, ...body, author: null, media: [] });
async function subscription(kind: 'blyg' | 'rss' = 'blyg') {
  return createSubscription(env.DB, { kind, origin: 'https://dates.example/', feedUrl: 'https://dates.example/feed.xml', title: 'Dates' });
}
async function seed(sub: string) {
  await applyEffect(env.DB, sub, 'remote', { type: 'import', doc: doc(initialDate, 1) }, '2026-06-02T00:00:00Z');
}

describe('foreign timestamps at the importer storage boundary', () => {
  for (const effect of ['import', 'update', 'reimport'] as const) {
    it.each(dates)(`${effect} normalizes %s dates without changing bodies or version`, async (_name, input, normalized) => {
      const sub = await subscription();
      if (effect !== 'import') await seed(sub.id);
      await applyEffect(env.DB, sub.id, 'remote', { type: effect, doc: doc(input) }, observed);
      expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({
        created: effect === 'import' ? normalized : initialDate, updated: normalized,
        observed_at: observed, version: 2, state: 'current', ...body,
      });
    });
  }
  it.each(dates)('record-tombstone normalizes %s timestamps on insert and conflict', async (_name, input, normalized) => {
    const sub = await subscription();
    const effect = { type: 'record-tombstone' as const, version: 2, updated: input };
    await applyEffect(env.DB, sub.id, 'absent', effect, observed);
    expect(await getImportedItem(env.DB, sub.id, 'absent')).toMatchObject({ created: null, updated: normalized, observed_at: observed, version: 2, state: 'tombstone', content_md: '', content_html: '' });
    await seed(sub.id);
    await applyEffect(env.DB, sub.id, 'remote', effect, observed);
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: initialDate, updated: normalized, observed_at: observed, version: 2, state: 'tombstone', content_md: '', content_html: '' });
  });
  for (const retainPinnedVersion of [undefined, 1]) {
    it.each(dates)(`rollup-null (retained=${retainPinnedVersion ?? 'none'}) normalizes %s timestamps`, async (_name, input, normalized) => {
      const sub = await subscription();
      await seed(sub.id);
      await applyEffect(env.DB, sub.id, 'remote', { type: 'rollup-null', version: 2, updated: input }, observed, { retainPinnedVersion });
      expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({
        created: initialDate, updated: normalized, observed_at: observed, version: 2, state: 'tombstone',
        pinned_version_retained: retainPinnedVersion ?? null,
        content_md: retainPinnedVersion ? body.content_md : '', content_html: retainPinnedVersion ? body.content_html : '',
      });
    });
  }
  it('adopt-stealth changes body and observation time while retaining timestamps and version', async () => {
    const sub = await subscription();
    await seed(sub.id);
    await applyEffect(env.DB, sub.id, 'remote', { type: 'adopt-stealth', doc: { ...doc('not a date', 9), content_md: 'Adopted body', content_html: '<p>Adopted body</p>' } }, observed);
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: initialDate, updated: initialDate, observed_at: observed, version: 1, content_md: 'Adopted body', content_html: '<p>Adopted body</p>' });
  });
  it.each(dates)('L0 upsert and repair normalize %s dates without restamping or versioning a repair', async (_name, input, normalized) => {
    const sub = await subscription('rss');
    const l0 = { version: 1, created: input, updated: input, observedAt: observed, contentMd: body.content_md, contentHtml: body.content_html, contentHash: body.content_hash };
    await upsertL0Item(env.DB, sub.id, 'remote', l0);
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: normalized, updated: normalized, observed_at: observed, version: 1, ...body });
    await upsertL0Item(env.DB, sub.id, 'remote', { ...l0, version: 2, created: 'ignore this replacement creation date', updated: initialDate });
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: normalized, updated: initialDate, observed_at: observed, version: 2, ...body });
    await repairL0ItemDates(env.DB, sub.id, 'remote', { created: input, updated: input });
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: normalized, updated: normalized, observed_at: observed, version: 2, ...body });
    await repairL0ItemDates(env.DB, sub.id, 'remote', { created: null, updated: null });
    expect(await getImportedItem(env.DB, sub.id, 'remote')).toMatchObject({ created: null, updated: null, observed_at: observed, version: 2, ...body });
  });
});
