import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { normalizeStoredImportDates } from '../../src/importer/date-repair.ts';

beforeEach(async () => { await env.DB.prepare('DELETE FROM imported_items').run(); });

it('repairs legacy timestamp metadata in bounded batches and is idempotent', async () => {
  const ids = ["quote'", 'nul\0id', '雪'];
  await env.DB.batch(ids.map((id, i) => env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,created,updated,observed_at,content_md,content_html) VALUES ('repair',?,'fragment','current',7,?,?,'2026-08-05T00:00:00Z','keep markdown','<p>keep body</p>')").bind(id, i === 0 ? null : 'Wed, 01 Jul 2026 00:00:00 GMT', i === 2 ? 'not a date' : '2026-07-01T12:30:00+02:00')));
  const before = (await env.DB.prepare('SELECT reading FROM change_state WHERE id=1').first<{ reading: number }>())!.reading;
  const sizes: number[] = [];
  const execute = async (sql: string) => {
    const result = await env.DB.prepare(sql).all<any>();
    if (sql.startsWith('SELECT subscription_id')) { sizes.push(result.results.length); expect(sql).not.toContain('content_'); }
    return result;
  };
  expect(await normalizeStoredImportDates(execute, 2)).toEqual({ scanned: 3, changed: 3 });
  expect(Math.max(...sizes)).toBe(2);
  const rows = (await env.DB.prepare("SELECT remote_id,version,created,updated,observed_at,content_md,content_html FROM imported_items WHERE subscription_id='repair' ORDER BY remote_id").all()).results;
  expect(rows).toEqual([...ids].sort().map(id => ({ remote_id: id, version: 7, created: id === ids[0] ? null : '2026-07-01T00:00:00Z', updated: id === ids[2] ? null : '2026-07-01T10:30:00Z', observed_at: '2026-08-05T00:00:00Z', content_md: 'keep markdown', content_html: '<p>keep body</p>' })));
  const after = (await env.DB.prepare('SELECT reading FROM change_state WHERE id=1').first<{ reading: number }>())!.reading;
  expect(after).toBeGreaterThan(before);
  expect(await normalizeStoredImportDates(execute, 2)).toEqual({ scanned: 3, changed: 0 });
  expect((await env.DB.prepare('SELECT reading FROM change_state WHERE id=1').first<{ reading: number }>())!.reading).toBe(after);
});

it('stops on a concurrent timestamp change and preserves it on rerun', async () => {
  await env.DB.prepare("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at) VALUES ('repair','race','fragment','current',1,'Wed, 01 Jul 2026 00:00:00 GMT','2026-08-05T00:00:00Z')").run();
  let racing = true;
  const execute = async (sql: string) => {
    if (racing && sql.startsWith('UPDATE imported_items SET created=')) {
      racing = false;
      await env.DB.prepare("UPDATE imported_items SET updated='2026-08-02T00:00:00Z' WHERE subscription_id='repair' AND remote_id='race'").run();
    }
    return env.DB.prepare(sql).all<any>();
  };
  await expect(normalizeStoredImportDates(execute, 1)).rejects.toThrow('changed during repair');
  expect(await normalizeStoredImportDates(execute, 1)).toEqual({ scanned: 1, changed: 0 });
  expect(await env.DB.prepare("SELECT updated FROM imported_items WHERE remote_id='race'").first('updated')).toBe('2026-08-02T00:00:00Z');
});
