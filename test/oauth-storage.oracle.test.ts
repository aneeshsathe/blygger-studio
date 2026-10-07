/**
 * Expiry and prefix pagination must agree after every storage change.
 * A single get cannot expose lost pages, wildcard prefix matching or stale expiry.
 *
 * Contract: OAuthStorage's KV-shaped string adapter, documented in docs/auth-oracles.md.
 * This adapter law is local; OAuth RFCs do not specify its SQL or cursor format.
 * Model: a plain Map records strings and absolute expiry. Reads recompute literal
 * startsWith matching and retain only records whose expiry is strictly after now.
 * History grammar: put/overwrite/delete/time, six keys, punctuation and nullable TTL.
 * Fixed reconstruction forces overwrite, exact expiry and multiple pages. Generated
 * fixed/random campaigns sample bounded histories; they do not exhaust this grammar.
 * Driver: actual OAuthStorage and D1 with controlled Date and two-key pages.
 * Refinement: complete ordered key sequences and JSON values after every action.
 * Duplicates and loss remain visible; observations are not converted to a Set.
 * Limits: no concurrent writer/list snapshot guarantee, malformed cursor grammar or
 * all Unicode sorting. The model imports no SQL, cursor codec or prefix helper.
 */
import { env } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { OAuthStorage } from '../src/oauth-storage.ts';
import { atCheckpoint, campaign } from './oracle-campaign.ts';

const input = fc.array(fc.record({ op: fc.constantFrom('put', 'delete', 'advance'), key: fc.constantFrom('grant:a', 'grant:b', 'grant:%', 'grant:_', 'client:a', 'consent:a'), value: fc.integer({ min: -10, max: 10 }), ttl: fc.constantFrom(null, 1, 60, 600), seconds: fc.constantFrom(0, 1, 59, 60, 600) }), { minLength: 1, maxLength: 18 });
type StorageAction = { op: string; key: string; value: number; ttl: number | null; seconds: number };
async function run(actions: StorageAction[]) {
  await env.DB.prepare('DELETE FROM oauth_records').run();
  const map = new Map<string, { value: string; expires: number | null }>();
  const storage = new OAuthStorage(env.DB);
  let now = 1800000000;
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now * 1000);
  try {
    for (const action of actions) {
      if (action.op === 'put') { const value = JSON.stringify({ value: action.value }); map.set(action.key, { value, expires: action.ttl === null ? null : now + action.ttl }); await storage.put(action.key, value, action.ttl === null ? undefined : { expirationTtl: action.ttl }); }
      if (action.op === 'delete') { map.delete(action.key); await storage.delete(action.key); }
      if (action.op === 'advance') now += action.seconds;
      for (const prefix of ['', 'grant:', 'grant:%', 'grant:_', 'client:']) {
        // The map is the reference: literal prefix matching, exclusive expiry and sorted
        // keys. It deliberately does not reproduce SQL LIKE or cursor encoding. Reading
        // all pages here makes duplicate, missing and non-progressing output observable.
        const expected = [...map.entries()].filter(([key, record]) => key.startsWith(prefix) && (record.expires === null || record.expires > now)).map(([key]) => key).sort();
        const observed: string[] = [];
        let cursor = '';
        let pages = 0;
        do {
          const page = await storage.list({ prefix, cursor, limit: 2 });
          observed.push(...page.keys.map(key => key.name)); cursor = page.list_complete ? '' : page.cursor;
          if (++pages > map.size + 1) throw new Error('storage cursor did not progress');
        } while (cursor);
        atCheckpoint('OAuth storage prefix pages', () => expect(observed).toEqual(expected));
      }
      for (const [key, record] of map) {
        const expected = record.expires !== null && record.expires <= now ? null : JSON.parse(record.value);
        const value = await storage.get(key, 'json');
        atCheckpoint('OAuth storage expiry', () => expect(value).toEqual(expected));
      }
    }
  } finally { clock.mockRestore(); }
}
describe('OAuth storage oracle', () => {
  it('reconstructs overwrite, delete, exact expiry, literal percent/underscore, and a multi-page prefix', async () => {
    await run(['grant:a', 'grant:b', 'grant:%', 'grant:_', 'client:a'].map<StorageAction>(key => ({ op: 'put', key, ttl: 60, seconds: 0, value: 1 })).concat([{ op: 'put', key: 'grant:a', ttl: null, seconds: 0, value: 2 }, { op: 'delete', key: 'grant:b', ttl: null, seconds: 0, value: 0 }, { op: 'advance', key: '', ttl: null, seconds: 59, value: 0 }, { op: 'advance', key: '', ttl: null, seconds: 1, value: 0 }]));
  });
  it('calibrates loss, duplicates, wrong prefix and off-by-one expiry', () => {
    for (const wrong of [['a'], ['a', 'a', 'b'], ['a', 'b', 'client:a']]) expect(() => expect(wrong).toEqual(['a', 'b'])).toThrow();
    expect(() => expect({ value: 1 }).toBeNull()).toThrow();
  });
  campaign('oauth-storage', input, run);
});
