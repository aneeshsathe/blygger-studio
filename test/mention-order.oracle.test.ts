/**
 * Contract: private mention groups preserve newest verification, last-seen and
 * receipt-ID order; each target's receipts retain verified_at DESC, last_seen
 * DESC, id ASC. Counts include hidden/gone receipts; visible counts include only
 * verified, unhidden receipts before item response policy (docs/api.md).
 * Model: repeatedly choose the highest independent numeric rank, then group.
 * Grammar: crossed r00/r99 IDs and recency, five mandatory targets, six receipts
 * in one target, 0–12 extra unique IDs, ties, NULL verification, hidden/gone rows,
 * reversed insertion and empty input. Duplicate receipt IDs are invalid.
 * Driver: real D1 rows and generated SDK calls through SELF to the production
 * /mention-groups and target-filtered /mentions cursor APIs, with page size two.
 * Checkpoints: every group's complete receipt sequence, complete group sequence,
 * total/visible counts, summary counts, page exhaustion and unchanged stored rows.
 * Boundaries: static ASCII fixtures, no concurrent writes or database-cost claim.
 * Item response modes, site defaults, missing target joins and UI demand windows
 * are covered separately by UI/browser tests; this campaign does not model them.
 * Shared campaign: eight inputs per fixed/random lane and direct seed/path replay.
 * Calibration: production group ordering and hidden-count SQL are mutated by
 * verify-oracle-mutations.ts; ordering replay must reach the same checkpoint.
 * ORC-001–005/009: authority, independent ranks, grammar, driver and complete
 * observations are above. ORC-006/007: production controls and direct replay.
 * ORC-008: stateless recomputation, no reference lifecycle state. ORC-010:
 * fixture cleanup preserves a primary failure and reports cleanup failures.
 * ORC-011: no named shared semantic fault needs a second formulation.
 * ORC-012–014: crossed IDs, equal ranks and NULLs distinguish weaker ordering;
 * real HTTP/D1 cursor walks run beyond two pages in both groups and receipts.
 */
import { SELF, env } from 'cloudflare:test';
import fc from 'fast-check';
import { expect } from 'vitest';
import { BlyggerApi, createBlyggerClient, unwrap, type Mention, type MentionGroup, type ListMentionsResponses } from '../sdk/dist/browser.js';
import { BASE, login } from './helpers.ts';
import { atCheckpoint, campaign } from './oracle-campaign.ts';
import { withOracleCleanup } from './oracle-cleanup.ts';

type Fact = { key: number; target: number; verified: number | null; seen: number; hidden: boolean; status: 'verified' | 'gone' };
const receipt = fc.record({
  key: fc.integer({ min: 1, max: 89 }), target: fc.integer({ min: 0, max: 4 }),
  verified: fc.option(fc.integer({ min: 0, max: 9 }), { nil: null }),
  seen: fc.integer({ min: 0, max: 9 }), hidden: fc.boolean(),
  status: fc.constantFrom('verified' as const, 'gone' as const),
});
const input = fc.record({ rows: fc.uniqueArray(receipt, { selector: row => row.key, maxLength: 12 }), reverse: fc.boolean() });
const id = (key: number) => `r${String(key).padStart(2, '0')}`;
const date = (rank: number) => new Date(Date.UTC(2026, 9, 1 + rank)).toISOString();
const mandatory: Fact[] = [
  { key: 0, target: 0, verified: 0, seen: 0, hidden: false, status: 'verified' },
  { key: 90, target: 0, verified: null, seen: 1, hidden: true, status: 'gone' },
  { key: 91, target: 0, verified: 0, seen: 2, hidden: true, status: 'verified' },
  { key: 92, target: 0, verified: 0, seen: 2, hidden: false, status: 'gone' },
  { key: 93, target: 0, verified: 1, seen: 0, hidden: false, status: 'verified' },
  { key: 94, target: 0, verified: 1, seen: 0, hidden: false, status: 'verified' },
  { key: 95, target: 2, verified: 2, seen: 0, hidden: false, status: 'verified' },
  { key: 96, target: 3, verified: null, seen: 0, hidden: false, status: 'verified' },
  { key: 97, target: 4, verified: 1, seen: 1, hidden: true, status: 'verified' },
  { key: 99, target: 1, verified: 10, seen: 10, hidden: false, status: 'verified' },
];

// Numeric fixture ranks precede wire timestamps. Choose each next maximum;
// do not import or repeat a production SQL/timestamp comparator.
function reference(facts: Fact[]) {
  const pending = [...facts], groups = new Map<string, string[]>();
  while (pending.length) {
    const highest = Math.max(...pending.map(row => row.verified ?? -1));
    const sameVerification = pending.filter(row => (row.verified ?? -1) === highest);
    const latest = Math.max(...sameVerification.map(row => row.seen));
    const key = Math.min(...sameVerification.filter(row => row.seen === latest).map(row => row.key));
    const [next] = pending.splice(pending.findIndex(row => row.key === key), 1), target = String(next.target);
    groups.set(target, [...(groups.get(target) ?? []), id(next.key)]);
  }
  return [...groups];
}

campaign('mention-order', input, async ({ rows, reverse }) => {
  const facts = [...mandatory, ...rows];
  const client = createBlyggerClient({ baseUrl: BASE + '/blyg/api', headers: { cookie: await login() },
    fetch: (input, init) => SELF.fetch(input instanceof Request ? input : new Request(input, init)) });
  const clear = () => env.DB.batch([env.DB.prepare('DELETE FROM mentions_in'), env.DB.prepare('DELETE FROM mentions_out')]);
  await withOracleCleanup(async () => {
    for (const snapshot of [[], reverse ? [...facts].reverse() : facts]) {
      await clear();
      if (snapshot.length) await env.DB.batch(snapshot.map(row => env.DB.prepare(`INSERT INTO mentions_in
        (id,source,target,target_item_id,status,first_seen,last_seen,verified_at,hidden)
        VALUES (?,?,'target',?,?,'first',?,?,?)`).bind(id(row.key), `https://source.test/${id(row.key)}`,
        String(row.target), row.status, date(row.seen), row.verified === null ? null : date(row.verified), Number(row.hidden))));
      const stored = () => env.DB.prepare('SELECT * FROM mentions_in ORDER BY id').all();
      const before = (await stored()).results, groups: MentionGroup[] = [];
      let cursor: string | undefined, groupPages = 0;
      do {
        const page = await unwrap(BlyggerApi.listMentionGroups({ client, query: { cursor, limit: 2 } }));
        groups.push(...page.items); groupPages++;
        atCheckpoint('mention display order', () => {
          expect(page.page.limit).toBe(2);
          expect(groups.map(row => row.targetItemId)).toEqual(reference(snapshot).slice(0, groups.length).map(([target]) => target));
          expect(page.page.nextCursor !== null).toBe(groups.length < reference(snapshot).length);
        });
        cursor = page.page.nextCursor ?? undefined;
      } while (cursor);
      const actual: [string, string[]][] = [];
      for (const group of groups) {
        const receipts: Mention[] = []; let pages = 0;
        cursor = undefined;
        do {
          const page: ListMentionsResponses[200] = await unwrap(BlyggerApi.listMentions({ client, query: { targetItemId: group.targetItemId, cursor, limit: 2 } }));
          receipts.push(...page.items as Mention[]); pages++;
          atCheckpoint('mention display order', () => {
            const expected = reference(snapshot).find(([target]) => target === group.targetItemId)![1];
            expect(page.direction).toBe('inbound'); expect(page.page.limit).toBe(2);
            expect(receipts.map(row => row.id)).toEqual(expected.slice(0, receipts.length));
            expect(page.items.every(row => 'targetItemId' in row && row.targetItemId === group.targetItemId)).toBe(true);
            expect(page.page.nextCursor !== null).toBe(receipts.length < expected.length);
          });
          cursor = page.page.nextCursor ?? undefined;
        } while (cursor);
        actual.push([group.targetItemId, receipts.map(row => row.id)]);
        if (group.targetItemId === '0') expect(pages).toBeGreaterThan(2);
      }
      atCheckpoint('mention display order', () => expect(actual).toEqual(reference(snapshot)));
      const values = groups.map(({ targetItemId, total, visible }) => ({ target: targetItemId, total, visible }));
      const expectedValues = reference(snapshot).map(([target]) => {
        const targetRows = snapshot.filter(row => row.target === Number(target));
        return { target, total: targetRows.length, visible: targetRows.filter(row => row.status === 'verified' && !row.hidden).length };
      });
      atCheckpoint('mention group values', () => expect(values).toEqual(expectedValues));
      const summary = await unwrap(BlyggerApi.getMentionSummary({ client }));
      atCheckpoint('mention group values', () => expect(summary).toEqual({ inbound: snapshot.length, outbound: 0, groups: expectedValues.length }));
      const after = (await stored()).results;
      atCheckpoint('mention input preservation', () => expect(after).toEqual(before));
      if (snapshot.length) expect(groupPages).toBeGreaterThan(2);
    }
  }, [clear]);
});
