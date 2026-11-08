import { env } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { sequenceOrder, sequenceParts } from '../src/ui/sequence-order.ts';

it('matches SQLite binary tuple order across prefixes, Unicode, NUL, and numeric ties', async () => {
  await env.DB.exec('CREATE TABLE order_witness(id INTEGER PRIMARY KEY, at TEXT NOT NULL, sub TEXT NOT NULL)');
  const texts = ['', 'a', 'a\0', 'a!', 'a~', 'aa', '\ufeff', '中', '😀', '\uffff'];
  const rows = texts.flatMap((at, i) => texts.map((sub, j) => ({ id: i * texts.length + j + 1, at, sub })));
  await env.DB.batch(rows.map(row => env.DB.prepare('INSERT INTO order_witness VALUES (?, ?, ?)').bind(row.id, row.at, row.sub)));
  const expected = (await env.DB.prepare('SELECT id FROM order_witness ORDER BY at DESC, sub ASC, id DESC').all<{ id: number }>()).results.map(row => row.id);
  const keys = rows.map(row => ({ id: row.id, key: sequenceOrder([[row.at, 'desc'], [row.sub, 'asc'], [row.id, 'desc']]) }));
  expect([...keys].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0).map(row => row.id)).toEqual(expected);
  for (const row of rows) {
    const [at, sub, id] = sequenceParts(keys.find(key => key.id === row.id)!.key, ['desc', 'asc', 'desc']);
    expect([at, sub, Number.parseInt(id, 16)]).toEqual([row.at, row.sub, row.id]);
  }
  expect(new Set(keys.map(row => row.key)).size).toBe(rows.length);
});
