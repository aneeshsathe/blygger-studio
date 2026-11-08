import { env } from 'cloudflare:test';
import { beforeEach, expect, it } from 'vitest';
import { packReadDatabase } from '../src/read-batch-db.ts';
import { operationDefinitions } from '../src/operations.ts';
import { runOperation } from '../src/operation-runner.ts';
import type { OperationContext } from '../src/operation-types.ts';

/** Count binding calls, not SQL statements. A native D1 batch spends one call. */
function counted(db: D1Database, limit = Infinity) {
  const calls: string[][] = [], originals = new WeakMap<D1PreparedStatement, { statement: D1PreparedStatement; sql: string }>();
  function admit(sql: string[]) {
    calls.push(sql);
    if (calls.length > limit) throw new Error('Test D1 invocation limit exceeded');
  }
  function statement(sql: string, target: D1PreparedStatement): D1PreparedStatement {
    const wrapped = new Proxy(target, { get(value, key) {
      if (key === 'bind') return (...args: unknown[]) => statement(sql, value.bind(...args));
      const method = Reflect.get(value, key);
      if (['all', 'first', 'raw', 'run'].includes(String(key))) return (...args: unknown[]) => {
        admit([sql]); return Reflect.apply(method, value, args);
      };
      return typeof method === 'function' ? method.bind(value) : method;
    } });
    originals.set(wrapped, { statement: target, sql });
    return wrapped;
  }
  const binding = new Proxy(db, { get(target, key) {
    if (key === 'prepare') return (sql: string) => statement(sql, target.prepare(sql));
    if (key === 'batch') return (statements: D1PreparedStatement[]) => {
      admit(statements.map(value => originals.get(value)?.sql ?? '(native statement)'));
      return target.batch(statements.map(value => originals.get(value)?.statement ?? value));
    };
    const method = Reflect.get(target, key);
    return typeof method === 'function' ? method.bind(target) : method;
  } });
  return { db: binding, calls };
}

beforeEach(async () => {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS packing_fixture(id INTEGER PRIMARY KEY,value TEXT)').run();
  await env.DB.batch([env.DB.prepare('DELETE FROM packing_fixture'), env.DB.prepare("INSERT INTO packing_fixture VALUES(1,'before')")]);
});

it('packs ready all/first reads in order and bounds each physical batch at 50', async () => {
  const meter = counted(env.DB), db = packReadDatabase(meter.db);
  const rows = await Promise.all(Array.from({ length: 51 }, (_, id) => db.prepare('SELECT ? AS id').bind(id).first<{ id: number }>()));
  expect(rows.map(row => row?.id)).toEqual(Array.from({ length: 51 }, (_, id) => id));
  expect(meter.calls.map(call => call.length)).toEqual([50, 1]);
  const [all, first, empty] = await Promise.all([
    db.prepare('SELECT value FROM packing_fixture').all(),
    db.prepare('SELECT value FROM packing_fixture').first(),
    db.prepare('SELECT value FROM packing_fixture WHERE id=2').first(),
  ]);
  expect(all.results).toEqual([{ value: 'before' }]);
  expect(first).toEqual({ value: 'before' }); expect(empty).toBeNull();
  expect(meter.calls.at(-1)).toHaveLength(3);
});

it('never caches repeated statements and observes writes across dependent rounds', async () => {
  const meter = counted(env.DB), db = packReadDatabase(meter.db), select = db.prepare('SELECT value FROM packing_fixture');
  await Promise.all([select.all(), select.all()]);
  expect(meter.calls.map(call => call.length)).toEqual([2]);
  expect(await db.prepare("UPDATE packing_fixture SET value='after' WHERE id=1 RETURNING value").first()).toEqual({ value: 'after' });
  expect((await select.all()).results).toEqual([{ value: 'after' }]);
  expect(meter.calls.map(call => call.length)).toEqual([2, 1, 1]);
});

it('keeps scalar first, raw, run, and explicit batch semantics native', async () => {
  const meter = counted(env.DB), db = packReadDatabase(meter.db);
  expect(await db.prepare('SELECT value FROM packing_fixture').first<string>('value')).toBe('before');
  await expect(db.prepare('SELECT value FROM packing_fixture').first('missing')).rejects.toThrow();
  expect(await db.prepare('SELECT value FROM packing_fixture').raw({ columnNames: true })).toEqual([['value'], ['before']]);
  expect((await db.prepare("UPDATE packing_fixture SET value='native' WHERE id=1").run()).success).toBe(true);
  const results = await db.batch([db.prepare('SELECT value FROM packing_fixture'), env.DB.prepare('SELECT 2 AS id')]);
  expect(results.map(result => result.results)).toEqual([[{ value: 'native' }], [{ id: 2 }]]);
  expect(meter.calls.map(call => call.length)).toEqual([1, 1, 1, 1, 2]);
});

it('does not merge independent request wrappers', async () => {
  const meter = counted(env.DB), a = packReadDatabase(meter.db), b = packReadDatabase(meter.db);
  await Promise.all([a.prepare('SELECT 1').all(), b.prepare('SELECT 2').all()]);
  expect(meter.calls.map(call => call.length)).toEqual([1, 1]);
});

it('rolls back failed batches, rejects every participant, and never retries admission writes', async () => {
  const meter = counted(env.DB), db = packReadDatabase(meter.db);
  const results = await Promise.allSettled([
    db.prepare("UPDATE packing_fixture SET value='must roll back' WHERE id=1 RETURNING value").first(),
    db.prepare('SELECT * FROM no_such_packing_table').all(),
  ]);
  expect(results.map(result => result.status)).toEqual(['rejected', 'rejected']);
  expect(meter.calls).toHaveLength(1);
  expect(await env.DB.prepare('SELECT value FROM packing_fixture').first('value')).toBe('before');
  expect(await db.prepare('SELECT value FROM packing_fixture').first()).toEqual({ value: 'before' });
  expect(meter.calls).toHaveLength(2);
});

it('keeps all four maximum-size owner/delegated read batches below the Free binding-call cap', async () => {
  await env.DB.batch([
    env.DB.prepare(`WITH RECURSIVE n(x) AS (SELECT 0 UNION ALL SELECT x+1 FROM n WHERE x<49)
      INSERT INTO items(id,kind,status,created,updated,version,content_md,dirty)
      SELECT printf('packed-item-%02d',x),'fragment','public','created','updated',1,'Published item',0 FROM n`),
    env.DB.prepare(`INSERT INTO versions(item_id,version,kind,content_md,content_html,content_hash,published_at,pinned)
      SELECT id,1,'fragment',content_md,'<p>Published item</p>','hash-'||id,'published',1 FROM items WHERE id LIKE 'packed-item-%'`),
    env.DB.prepare(`INSERT INTO change_class(item_id,version,category,model,probability,classified_at,overridden,content_hash)
      SELECT id,1,'minor','fixture',0.8,'classified',0,'hash-'||id FROM items WHERE id LIKE 'packed-item-%'`),
    env.DB.prepare(`INSERT INTO mentions_in(id,source,target,target_item_id,status,first_seen,last_seen,verified_at,hidden)
      SELECT 'receipt-'||id,'https://source.test/'||id,'target',id,'verified','first','last','verified',0 FROM items WHERE id LIKE 'packed-item-%'`),
  ]);
  const definitions = operationDefinitions([]), definition = definitions.get('batchRead')!;
  for (const operation of ['getItem', 'listMentions', 'listMentionGroups', 'getMentionSummary']) for (const delegated of [false, true]) {
    await env.DB.prepare('DELETE FROM security_budgets').run();
    const meter = counted(env.DB, 50), context: OperationContext = {
      env: { ...env, DB: meter.db, API_READ_LIMIT: '100000', API_DELEGATED_READ_LIMIT: '100000' },
      access: delegated ? { scope: ['owner:read'], clientId: 'packed-fixture', userId: 'owner' } : null,
      url: 'https://example.com/blyg/api/read-batch', extensions: [], defer() {},
    };
    const requests = Array.from({ length: 50 }, (_, n) => {
      const id = `packed-item-${String(n).padStart(2, '0')}`;
      return operation === 'getItem' ? { path: { id } } : operation === 'getMentionSummary' ? {} : { query: { targetItemId: id, limit: '10' } };
    });
    const result = await runOperation(definition, { path: {}, query: {}, body: { operation, requests } }, context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Read batch failed');
    expect((result.value as { status: number }[]).map(row => row.status)).toEqual(Array(50).fill(200));
    expect(meter.calls.length).toBeLessThanOrEqual(delegated ? 7 : 5);
    const budget = (await env.DB.prepare('SELECT used FROM security_budgets').all<{ used: number }>()).results;
    expect(budget.map(row => row.used)).toEqual(Array(delegated ? 2 : 1).fill(51));
    expect(meter.calls.flat().filter(sql => sql.startsWith('INSERT INTO security_budgets'))).toHaveLength(delegated ? 102 : 51);
  }
});

it.each([
  { delegated: false, limit: 4, global: 100, success: 3, counters: [4] },
  { delegated: true, limit: 4, global: 100, success: 3, counters: [4, 4] },
  { delegated: true, limit: 100, global: 4, success: 3, counters: [4, 11] },
  { delegated: true, limit: 4, global: 3, success: 2, counters: [3, 4] },
])('preserves exact quota counters and partial admissions: %j', async fixture => {
  await env.DB.prepare('DELETE FROM security_budgets').run();
  const context: OperationContext = {
    env: { ...env, API_READ_LIMIT: String(fixture.limit), API_DELEGATED_READ_LIMIT: String(fixture.global) },
    access: fixture.delegated ? { scope: ['owner:read'], clientId: 'quota-packing', userId: 'owner' } : null,
    url: 'https://example.com/blyg/api/read-batch', extensions: [], defer() {},
  };
  const result = await runOperation(operationDefinitions([]).get('batchRead')!, { path: {}, query: {}, body: {
    operation: 'getMentionSummary', requests: Array.from({ length: 10 }, () => ({})),
  } }, context);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Read batch failed');
  const rows = result.value as { status: number; headers: Record<string, string> }[];
  expect(rows.filter(row => row.status === 200)).toHaveLength(fixture.success);
  expect(rows.filter(row => row.status === 429)).toHaveLength(10 - fixture.success);
  expect(rows.filter(row => row.status === 429).every(row => row.headers['Retry-After'] === '60')).toBe(true);
  const budget = (await env.DB.prepare('SELECT used FROM security_budgets').all<{ used: number }>()).results;
  expect(budget.map(row => row.used).sort((a, b) => a - b)).toEqual(fixture.counters);
});
