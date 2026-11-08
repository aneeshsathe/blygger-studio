import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { createDraft } from '../src/model.ts';
import { readingData } from '../src/reading-data.ts';
import { clampDisplayAt } from '../src/importer/reading.ts';

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM imported_items WHERE subscription_id IN ('extended-dates','clamped-dates')").run();
});

it('pages the entire canonical JS date range in the same order as projected Reading times', async () => {
  const observed = '+275760-09-13T00:00:00Z';
  const dates = [
    '-000001-12-31T23:59:59Z', '2026-08-01T00:00:00Z', '+010000-01-01T00:00:00Z',
    '-271821-04-20T00:00:00Z', '0000-01-01T00:00:00Z', '-000002-12-31T23:59:59Z',
    '+275760-09-13T00:00:00Z', '9999-12-31T23:59:59Z', '-000001-01-01T00:00:00Z',
  ];
  await env.DB.prepare("INSERT INTO subscriptions(id,kind,origin,feed_url,title,created) VALUES ('extended-dates','blyg','https://dates.example/','https://dates.example/feed.xml','Dates','2026-08-01')").run();
  await env.DB.batch(dates.map((date, index) => env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at,content_html) VALUES ('extended-dates',?,'fragment','current',1,?,?,'<p>Body</p>')").bind(`date-${index}`, date, observed)));
  const expected = dates.map((date, index) => ({ id: `date-${index}`, displayAt: clampDisplayAt(date, observed) }))
    .sort((a, b) => Date.parse(b.displayAt) - Date.parse(a.displayAt));
  const rows: { id: string | undefined; displayAt: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await readingData(env.DB, { limit: 2, cursor }, 'extended-dates');
    rows.push(...page.items.map(row => ({ id: row.imported?.remoteId, displayAt: row.displayAt })));
    cursor = page.page.nextCursor ?? undefined;
  } while (cursor);
  expect(rows).toEqual(expected);
  expect(new Set(rows.map(row => row.id)).size).toBe(dates.length);
});

it('clamps positive extended dates and invalid claims to observation time and preserves source ties', async () => {
  const observed = '2026-08-01T00:00:00Z';
  await env.DB.prepare("INSERT INTO subscriptions(id,kind,origin,feed_url,title,created) VALUES ('clamped-dates','blyg','https://dates.example/','https://dates.example/feed.xml','Dates','2026-08-01')").run();
  await env.DB.batch(['+010000-01-01T00:00:00Z', null, '2026-08-01T00:00:00Z'].map((updated, i) =>
    env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at,content_html) VALUES ('clamped-dates',?,'fragment','current',1,?,?,'<p>Body</p>')").bind(`tie-${i}`, updated, observed)));
  const own = await createDraft(env.DB, 'Own fixture', 'fragment');
  // Existing fixtures also use date-only local timestamps. The key must match
  // the canonical imported instant without changing the projected local value.
  await env.DB.prepare("UPDATE items SET status='public',updated='2026-08-01' WHERE id=?").bind(own.id).run();
  const first = await readingData(env.DB, { limit: 3 }, 'all');
  const second = await readingData(env.DB, { limit: 3, cursor: first.page.nextCursor! }, 'all');
  expect([...first.items, ...second.items].map(row => row.key)).toEqual([
    ...[0, 1, 2].map(i => `imported:["clamped-dates","tie-${i}"]`), `own:${own.id}`,
  ]);
  expect(first.items.map(row => row.displayAt)).toEqual([observed, observed, observed]);
  expect(Date.parse(second.items[0].displayAt)).toBe(Date.parse(observed));
});
