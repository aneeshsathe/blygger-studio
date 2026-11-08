import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { cursorPage, type CursorOrder, type CursorSource } from '../src/cursor-page.ts';
import { readChanges } from '../src/changes.ts';

type Row = { id: string; verified_at: string | null; last_seen: number | null; bucket: string };
const order: CursorOrder[] = [
  { column: 'verified_at', direction: 'desc' },
  { column: 'last_seen', direction: 'desc' },
  { column: 'id', direction: 'asc' },
];
const source: CursorSource<Row> = {
  name: 'cursor-range', filters: ['keep'], domains: ['mentions'],
  sql: 'SELECT * FROM cursor_range WHERE bucket = ?', binds: ['keep'], order,
};
beforeEach(async () => {
  await env.DB.exec('CREATE TABLE IF NOT EXISTS cursor_range(id TEXT PRIMARY KEY, verified_at TEXT, last_seen INTEGER, bucket TEXT NOT NULL)');
  await env.DB.exec('CREATE INDEX IF NOT EXISTS cursor_range_order ON cursor_range(bucket, verified_at DESC, last_seen DESC, id ASC)');
  await env.DB.prepare('DELETE FROM cursor_range').run();
  const values = [];
  for (const at of [null, 'a', 'z']) for (const seen of [null, 0, 1]) for (const id of ['a', 'z', 'é', '😀'])
    values.push([`${id}:${at}:${seen}`, at, seen, 'keep']);
  values.push(['excluded', 'zz', 100, 'drop']);
  await env.DB.batch(values.map(row => env.DB.prepare('INSERT INTO cursor_range VALUES (?,?,?,?)').bind(...row)));
});

const permutations = Array.from({ length: 8 }, (_, bits) => order.map((entry, index) => ({
  ...entry, direction: bits & (1 << index) ? 'asc' as const : 'desc' as const,
})));
it.each(permutations.map((order, index) => ({ order, index })))('walks nullable mixed order $index without skips or duplicates', async ({ order }) => {
  const expected = (await env.DB.prepare(`SELECT id FROM cursor_range WHERE bucket = ? ORDER BY ${order.map(entry => `${entry.column} ${entry.direction}`).join(',')}`)
    .bind('keep').all<{ id: string }>()).results.map(row => row.id);
  for (const limit of [2, 5]) {
    const actual: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await cursorPage(env.DB, { limit, cursor }, { ...source, order });
      actual.push(...result.items.map(row => row.id));
      cursor = result.page.nextCursor ?? undefined;
      expect(actual.length).toBeLessThanOrEqual(expected.length);
    } while (cursor);
    expect(actual).toEqual(expected);
    expect(new Set(actual).size).toBe(expected.length);
  }
});

/** Build the existing v1 wire form, independently of the query implementation. */
async function legacyCursor(after: (string | number | null)[], descriptor: Pick<CursorSource<unknown>, 'name' | 'filters' | 'order' | 'domains'> = source) {
  const identity = new TextEncoder().encode(JSON.stringify([descriptor.name, descriptor.filters ?? null, descriptor.order, descriptor.domains]));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', identity))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const changes = await readChanges(env.DB);
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, source: hash, generation: { epoch: changes.epoch, revisions: descriptor.domains.map(domain => changes.domains[domain]) }, after }));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
it('accepts existing cursors at nonnull and null boundaries and seeks each index range', async () => {
  const expected = (await env.DB.prepare('SELECT * FROM cursor_range WHERE bucket=? ORDER BY verified_at DESC,last_seen DESC,id ASC').bind('keep').all<Row>()).results;
  for (const boundary of [expected[5], expected[29], expected[35]]) {
    const reads: { sql: string; binds: unknown[] }[] = [];
    const db = new Proxy(env.DB, { get(target, key) {
      if (key === 'prepare') return (sql: string) => {
        const statement = target.prepare(sql);
        return new Proxy(statement, { get(target, key) {
          if (key === 'bind') return (...binds: unknown[]) => { reads.push({ sql, binds }); return target.bind(...binds); };
          const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
        } });
      };
      const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
    } });
    const result = await cursorPage(db, { limit: 5, cursor: await legacyCursor([boundary.verified_at, boundary.last_seen, boundary.id]) }, source);
    expect(result.items.map(row => row.id)).toEqual(expected.slice(expected.indexOf(boundary) + 1, expected.indexOf(boundary) + 6).map(row => row.id));
    const continuation = reads.find(read => read.sql.includes('cursor_source'))!;
    const plan = (await env.DB.prepare(`EXPLAIN QUERY PLAN ${continuation.sql}`).bind(...continuation.binds).all<{ detail: string }>()).results.map(row => row.detail);
    expect(plan.some(detail => detail.includes('SEARCH cursor_range'))).toBe(true);
    expect(plan.some(detail => detail.includes('SCAN cursor_range') || detail.includes('MATERIALIZE'))).toBe(false);
  }
});

it('seeks a deep mention page through the existing partial index', async () => {
  await env.DB.prepare(`WITH RECURSIVE sequence(i) AS (VALUES(0) UNION ALL SELECT i+1 FROM sequence WHERE i<4999)
    INSERT INTO mentions_in(id,source,target,target_item_id,status,first_seen,last_seen,verified_at)
    SELECT printf('range-%05d',i),printf('https://range/%d',i),'target','item','verified','0',printf('%08d',i),printf('%08d',i) FROM sequence`).run();
  const descriptor: CursorSource<{ id: string; verified_at: string | null; last_seen: string }> = {
    name: 'mentions', filters: ['inbound'], domains: ['mentions'],
    sql: "SELECT * FROM mentions_in WHERE status IN ('verified','gone')", order,
  };
  let sql = '', binds: unknown[] = [];
  const db = new Proxy(env.DB, { get(target, key) {
    if (key === 'prepare') return (query: string) => {
      const statement = target.prepare(query);
      return new Proxy(statement, { get(target, key) {
        if (key === 'bind') return (...values: unknown[]) => {
          if (query.includes('cursor_source')) { sql = query; binds = values; }
          return target.bind(...values);
        };
        const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
      } });
    };
    const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const page = await cursorPage(db, { limit: 25, cursor: await legacyCursor(['00000100', '00000100', 'range-00100'], descriptor) }, descriptor);
  expect(page.items.map(row => row.id)).toEqual(Array.from({ length: 25 }, (_, i) => `range-${String(99-i).padStart(5, '0')}`));
  const plan = (await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).bind(...binds).all<{ detail: string }>()).results.map(row => row.detail);
  expect(plan.some(detail => detail.includes('SEARCH mentions_in USING INDEX mentions_in_private_order'))).toBe(true);
  expect(plan.some(detail => detail.includes('SCAN mentions_in') || detail.includes('MATERIALIZE'))).toBe(false);
  const result = await env.DB.prepare(sql).bind(...binds).all();
  expect(result.meta.rows_read).toBeGreaterThan(0);
  expect(result.meta.rows_read).toBeLessThan(250);
  // The previous OR shape had to walk the preceding 4,900 ordered rows.
  const previous = await env.DB.prepare(`SELECT * FROM (${descriptor.sql}) cursor_source WHERE
    (verified_at < ? OR verified_at IS NULL) OR
    (verified_at IS ? AND (last_seen < ? OR last_seen IS NULL)) OR
    (verified_at IS ? AND last_seen IS ? AND id > ?)
    ORDER BY verified_at DESC,last_seen DESC,id ASC LIMIT ?`)
    .bind(...Array(5).fill('00000100'), 'range-00100', 26).all<{ id: string }>();
  expect(previous.results.map(row => row.id)).toEqual(result.results.map(row => row.id));
  expect(previous.meta.rows_read).toBeGreaterThan(4_000);
});

it('keeps cursor identity when a source switches to one materialized aggregate read', async () => {
  const first = await cursorPage(env.DB, { limit: 2 }, source);
  const expected = await cursorPage(env.DB, { limit: 5, cursor: first.page.nextCursor! }, source);
  const materialized = await cursorPage(env.DB, { limit: 5, cursor: first.page.nextCursor! }, { ...source, materialize: true });
  expect(materialized).toEqual(expected);
});
