/**
 * Replay must reproduce the reduced failure, not merely fail again.
 * The harness depends on this when it promotes a generated history to evidence.
 *
 * Contract: docs/oracle-tests.md ORC-007 requires direct seed and shrink-path replay.
 * Model: capture the counterexample and error from a deliberately false rule, then
 * require exact agreement when replay uses those captured inputs.
 * History grammar: nonempty arrays of integers zero through ten; the wrong rule
 * claims every integer is zero. Driver: the real fast-check check/shrink/replay API.
 * Refinement: both runs fail with the same reduced counterexample and error.
 * Limits: a harness calibration, not a product oracle. It does not exercise the
 * Worker campaign registry or fc.commands replayPath. Captured auth/storage replay
 * is covered separately by scripts/verify-auth-oracle-mutations.ts.
 */
import fc from "fast-check";
import { expect, it } from "vitest";

it("direct seed/path replay preserves a captured reduced counterexample", () => {
  const wrongRule = fc.property(fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1 }), values => values.every(value => value === 0));
  const captured = fc.check(wrongRule, { seed: 20261001, numRuns: 8 });
  expect(captured.failed).toBe(true);
  if (!captured.failed || captured.counterexamplePath === null) throw new Error("Calibration must capture a failure and replay path");
  const replay = fc.check(wrongRule, { seed: captured.seed, path: captured.counterexamplePath, numRuns: 8, endOnFailure: true });
  expect(replay.failed).toBe(true);
  expect(replay.counterexample).toEqual(captured.counterexample);
  expect(replay.errorInstance).toEqual(captured.errorInstance);
});
