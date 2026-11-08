import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { cursorPage, CURSOR_MAX, CursorPageError, type CursorSource } from '../src/cursor-page.ts';

type Row = { id: string; at: string | null; group_id: number };
const source: CursorSource<Row> = {
  name: 'cursor-witness', domains: ['items'], sql: 'SELECT * FROM cursor_witness',
  order: [{ column: 'at', direction: 'desc' }, { column: 'group_id', direction: 'asc' }, { column: 'id', direction: 'desc' }],
};
beforeEach(async () => {
  await env.DB.exec('CREATE TABLE IF NOT EXISTS cursor_witness(id TEXT PRIMARY KEY, at TEXT, group_id INTEGER NOT NULL)');
  await env.DB.prepare('DELETE FROM cursor_witness').run();
  await env.DB.batch([
    ['é😀', '2026-10-31', 1], ['z', '2026-10-31', 1], ['a', '2026-10-31', 2], ['null-z', null, 1], ['null-a', null, 1],
  ].map(values => env.DB.prepare('INSERT INTO cursor_witness VALUES (?, ?, ?)').bind(...values)));
});

it.each(['asc', 'desc'] as const)('walks mixed ties and NULLs exactly once with %s time order', async direction => {
  const queries: string[] = [];
  const db = new Proxy(env.DB, { get(target, key) {
    if (key === 'prepare') return (sql: string) => { queries.push(sql); return target.prepare(sql); };
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const ordered = { ...source, order: [{ column: 'at', direction }, ...source.order.slice(1)] };
  const expected = (await env.DB.prepare(`SELECT id FROM cursor_witness ORDER BY at ${direction}, group_id ASC, id DESC`).all<{ id: string }>()).results.map(row => row.id);
  const ids: string[] = []; let cursor: string | undefined;
  do {
    const page = await cursorPage(db, { limit: 2, cursor }, ordered);
    ids.push(...page.items.map(row => row.id)); cursor = page.page.nextCursor ?? undefined;
    expect(page.page.limit).toBe(2); expect(page.items.length).toBeLessThanOrEqual(2);
  } while (cursor);
  expect(ids).toEqual(expected); expect(new Set(ids).size).toBe(5);
  const reads = queries.filter(sql => sql.includes('cursor_source'));
  expect(reads).toHaveLength(3);
  for (const sql of reads) { expect(sql).toContain('LIMIT ?'); expect(sql).not.toContain('OFFSET'); }
});

it('binds continuations to collection, filters, order, and domains', async () => {
  const { page } = await cursorPage(env.DB, { limit: 1 }, source);
  for (const changed of [{ name: 'other' }, { filters: ['different'] }, { order: [...source.order].reverse() }, { domains: ['reading'] as const }]) {
    await expect(cursorPage(env.DB, { cursor: page.nextCursor! }, { ...source, ...changed })).rejects.toMatchObject({ kind: 'invalid-input' });
  }
  // Page size may change without changing the sequence.
  const next = await cursorPage(env.DB, { cursor: page.nextCursor!, limit: 3 }, source);
  expect(next.items).toHaveLength(3);
});

it.each(['', 'bad!', 'a', 'e30', 'a'.repeat(CURSOR_MAX + 1)])('rejects malformed continuation %s', async cursor => {
  await expect(cursorPage(env.DB, { cursor }, source)).rejects.toBeInstanceOf(CursorPageError);
});

it('expires a continuation on a relevant generation change but permits unrelated changes', async () => {
  const { page } = await cursorPage(env.DB, { limit: 1 }, source);
  await env.DB.prepare('UPDATE change_state SET settings = settings + 1 WHERE id = 1').run();
  await expect(cursorPage(env.DB, { cursor: page.nextCursor! }, source)).resolves.toHaveProperty('page');
  await env.DB.prepare('UPDATE change_state SET items = items + 1 WHERE id = 1').run();
  await expect(cursorPage(env.DB, { cursor: page.nextCursor! }, source)).rejects.toMatchObject({ kind: 'conflict', code: 'cursor-expired' });
});

it('guards projection too, retries the first page once, and never returns a mixed generation', async () => {
  let calls = 0;
  const projected = { ...source, project: async (rows: Row[]) => {
    if (++calls === 1) await env.DB.prepare('UPDATE change_state SET items = items + 1 WHERE id = 1').run();
    return rows.map(row => row.id);
  } };
  const first = await cursorPage(env.DB, { limit: 1 }, projected);
  expect(calls).toBe(2); expect(first.items).toHaveLength(1);
  await expect(cursorPage(env.DB, { cursor: first.page.nextCursor! }, { ...source, project: async rows => {
    await env.DB.prepare('UPDATE change_state SET items = items + 1 WHERE id = 1').run(); return rows;
  } })).rejects.toMatchObject({ code: 'cursor-expired' });
  let retries = 0;
  await expect(cursorPage(env.DB, {}, { ...source, project: async rows => {
    retries++; await env.DB.prepare('UPDATE change_state SET items = items + 1 WHERE id = 1').run(); return rows;
  } })).rejects.toMatchObject({ code: 'cursor-expired' });
  expect(retries).toBe(2);
});

it.each([0, -1, 101, 1.5, NaN])('rejects invalid page size %s', async limit => {
  await expect(cursorPage(env.DB, { limit }, source)).rejects.toMatchObject({ kind: 'invalid-input' });
});
