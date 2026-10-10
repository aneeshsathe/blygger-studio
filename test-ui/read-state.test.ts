import { expect, test } from 'vitest';
import { needsRead, planReadWrites, readStatus, readWrites } from '../src/ui/read-state.ts';

test('status: own entries have none; null is unread; below the held version is updated', () => {
  expect(readStatus(undefined)).toBeNull();
  expect(readStatus({ readVersion: null, version: 3 })).toBe('unread');
  expect(readStatus({ readVersion: 2, version: 3 })).toBe('updated');
  expect(readStatus({ readVersion: 3, version: 3 })).toBe('read');
  // A read ahead of what this server holds (another device saw a newer poll) is read.
  expect(readStatus({ readVersion: 4, version: 3 })).toBe('read');
  expect([null, 'unread', 'updated', 'read'].map((s) => needsRead(s as never))).toEqual([false, true, true, false]);
});

test('one row is one PUT or DELETE, the shape opening an entry sends', () => {
  const mark = { sub: 's', remote_id: 'r', version: 2 };
  expect(planReadWrites([mark], [])).toEqual([{ op: 'put', mark }]);
  expect(planReadWrites([], [{ sub: 's', remote_id: 'r' }])).toEqual([{ op: 'delete', mark: { sub: 's', remote_id: 'r' } }]);
  expect(planReadWrites([], [])).toEqual([]);
});

test('many rows are chunked to the server cap, never over it', () => {
  const rows = Array.from({ length: 1201 }, (_, i) => ({ sub: 's', remote_id: `r${i}`, version: 1 }));
  const ops = planReadWrites(rows, []);
  expect(ops.map((op) => (op.op === 'read' ? op.items.length : -1))).toEqual([500, 500, 201]);
  expect(ops.flatMap((op) => (op.op === 'read' ? op.items : []))).toEqual(rows);
  const unread = planReadWrites([], rows.slice(0, 2).map(({ sub, remote_id }) => ({ sub, remote_id })), 1);
  expect(unread).toEqual([
    { op: 'unread', items: [{ sub: 's', remote_id: 'r0' }] },
    { op: 'unread', items: [{ sub: 's', remote_id: 'r1' }] },
  ]);
});

test('the studio marks at the held version and never sends read_at', () => {
  const imported = (remoteId: string, version: number) => ({ imported: { subscriptionId: 's', remoteId, version, readVersion: null } });
  const entries = [imported('a', 3), { imported: undefined }, imported('b', 1)];
  const read = readWrites(entries, true);
  expect(read).toEqual({ read: [{ sub: 's', remote_id: 'a', version: 3 }, { sub: 's', remote_id: 'b', version: 1 }], unread: [] });
  for (const op of planReadWrites(read.read, read.unread)) {
    const marks = op.op === 'put' ? [op.mark] : op.op === 'read' ? op.items : [];
    for (const mark of marks) expect(mark).not.toHaveProperty('read_at');
  }
  expect(readWrites(entries, false)).toEqual({ read: [], unread: [{ sub: 's', remote_id: 'a' }, { sub: 's', remote_id: 'b' }] });
});
