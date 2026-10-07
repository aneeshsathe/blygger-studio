import { CHANGE_DOMAINS, type ChangeState } from './change-state.ts';

// These reads use the ordinary D1 binding, which reads the primary. A refactor
// to replicas must carry the changes bookmark through every dependent load.
export async function readChanges(db: D1Database): Promise<ChangeState> {
  const row = await db.prepare(`SELECT epoch, ${CHANGE_DOMAINS.join(', ')} FROM change_state WHERE id = 1`).first<Record<string, unknown>>();
  if (!row || typeof row.epoch !== 'string' || !row.epoch) throw new Error('change state unavailable');
  const domains = {} as ChangeState['domains'];
  for (const domain of CHANGE_DOMAINS) {
    const value = row[domain];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid change revision');
    domains[domain] = value;
  }
  return { epoch: row.epoch, domains };
}
export async function readFeedRevision(db: D1Database) {
  const row = await db.prepare('SELECT epoch, feed FROM change_state WHERE id = 1').first<{ epoch: string; feed: number }>();
  if (!row || typeof row.epoch !== 'string' || !row.epoch || !Number.isSafeInteger(row.feed) || row.feed < 0) throw new Error('feed revision unavailable');
  return { epoch: row.epoch, revision: row.feed };
}
