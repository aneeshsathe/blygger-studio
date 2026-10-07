/**
 * Cleanup must release every peer without replacing the original oracle failure.
 * Reporting only the first exception can hide both leaked resources and lost evidence.
 *
 * Contract: docs/oracle-tests.md ORC-010 separates primary fault, secondary cleanup
 * faults and release obligations. This is a test-harness law, not product policy.
 * Model: preserve operation failure identity, collect close failures in release
 * order, and attempt each release once even when an earlier release rejects.
 * History grammar: operation failure plus two failed releases; successful operation
 * plus failed release; successful release with Error or undefined primary failure.
 * Driver: actual withOracleCleanup with controlled operation/release promises.
 * Refinement: AggregateError cause/errors, exact original identity, release-order
 * trace and successful return. Throwing undefined remains distinct from success.
 * Limits: no real transport lifecycle here; MCP receiving tests use this helper.
 * These fixed cases check selected synchronous/rejected outcomes, not every hang.
 */
import { expect, it } from 'vitest';
import { withOracleCleanup } from './oracle-cleanup.ts';

it('keeps the original checkpoint and every cleanup error while releasing all peers', async () => {
  const primary = new Error('MCP mounted discovery mismatch'), first = new Error('client close failed'), second = new Error('transport close failed');
  const closed: string[] = [];
  const result = withOracleCleanup(async () => { throw primary; }, [
    async () => { closed.push('client'); throw first; },
    async () => { closed.push('transport'); throw second; },
  ]);
  await expect(result).rejects.toMatchObject({ cause: primary, errors: [primary, first, second] });
  expect(closed).toEqual(['client', 'transport']);
});
it('does not hide cleanup corruption behind a successful operation', async () => {
  const secondary = new Error('close failed');
  await expect(withOracleCleanup(async () => 42, [async () => { throw secondary; }])).rejects.toMatchObject({ errors: [secondary] });
});
it('preserves the exact original failure when cleanup succeeds, including undefined', async () => {
  const error = new Error('OAuth mismatch');
  await expect(withOracleCleanup(async () => { throw error; }, [async () => {}])).rejects.toBe(error);
  await expect(withOracleCleanup(async () => { throw undefined; }, [async () => {}])).rejects.toBeUndefined();
  await expect(withOracleCleanup(async () => 42, [async () => {}])).resolves.toBe(42);
});
