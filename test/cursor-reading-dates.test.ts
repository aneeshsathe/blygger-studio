import { env } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { normalizeStoredImportDates } from '../src/importer/date-repair.ts';
import { readingData } from '../src/reading-data.ts';

it('chooses Reading cursor pages by the normalized retained date before loading bodies', async () => {
  await env.DB.prepare("INSERT INTO subscriptions(id,kind,origin,feed_url,title,created) VALUES ('date-cursor','rss','https://dates.example/','https://dates.example/feed.xml','Dates','2026-01-01')").run();
  await env.DB.batch([
    ['older-legacy', 'Wed, 01 Jul 2026 00:00:00 GMT'],
    ['newer-iso', '2026-08-01T00:00:00Z'],
  ].map(([id, updated]) => env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at,content_html) VALUES ('date-cursor',?,'fragment','current',1,?,'2026-08-05T00:00:00Z','<p>Held body</p>')").bind(id, updated)));
  await normalizeStoredImportDates(sql => env.DB.prepare(sql).all<any>());
  const first = await readingData(env.DB, { limit: 1 }, 'date-cursor');
  expect(first.items.map(item => item.imported?.remoteId)).toEqual(['newer-iso']);
  expect(first.items[0].displayAt).toBe('2026-08-01T00:00:00Z');
  const second = await readingData(env.DB, { limit: 1, cursor: first.page.nextCursor! }, 'date-cursor');
  expect(second.items.map(item => item.imported?.remoteId)).toEqual(['older-legacy']);
  expect(second.items[0].displayAt).toBe('2026-07-01T00:00:00Z');
  expect(second.page.nextCursor).toBeNull();
});
