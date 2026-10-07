import fc from "fast-check";
import { it } from "vitest";

// Vite supplies only these explicit replay inputs. No host environment is
// copied into the Worker. Array histories use assert's seed/path, not commands.
declare const __ORACLE_REPLAY__: { target?: string; seed?: string; path?: string };
class OracleMismatch extends Error {
  constructor(readonly checkpoint: string, cause: unknown) { super(checkpoint, { cause }); }
}
export function atCheckpoint(name: string, compare: () => void) {
  try { compare(); } catch (cause) { throw new OracleMismatch(name, cause); }
}
// Fixed and unseeded lanes run the same grammar and eight-history budget.
// Replay selects the target, seed and shrink path instead of running both lanes.
// A shrink failure at a different checkpoint is not the original fault. Preserve
// that original fault alongside fast-check's reduced case. This bounded campaign
// explores histories; it does not claim an exhaustive state space.
export function campaign<T>(name: string, inputs: fc.Arbitrary<T>, check: (input: T) => Promise<void>, numRuns = 8) {
  const replay = __ORACLE_REPLAY__;
  if (replay.seed !== undefined && !replay.target) throw new Error("ORACLE_TARGET is required for replay");
  if (replay.target && replay.target !== name) return;
  const modes = replay.seed !== undefined ? ["replay"] : ["fixed", "random"];
  for (const mode of modes) it(`${name}: ${mode}`, async () => {
    let comparisons = 0;
    let firstFailure: { checkpoint: string; input: string; error: unknown } | undefined;
    const seed = mode === "fixed" ? 20261001 : mode === "replay" ? Number(replay.seed) : undefined;
    if (seed !== undefined && !Number.isInteger(seed)) throw new Error("ORACLE_SEED must be an integer");
    console.info(`oracle ${name} ${mode}: started`);
    try {
      await fc.assert(fc.asyncProperty(inputs, async input => {
        try { await check(input); comparisons++; }
        catch (error) {
          const checkpoint = error instanceof OracleMismatch ? error.checkpoint : `driver: ${error instanceof Error ? error.name : typeof error}`;
          if (!firstFailure) firstFailure = { checkpoint, input: JSON.stringify(input), error };
          // A reduction that fails at another boundary is not a reproduction.
          if (checkpoint === firstFailure.checkpoint) throw error;
        }
      }), {
        numRuns, ...(seed !== undefined ? { seed } : {}), ...(mode === "replay" ? { path: replay.path ?? "" } : {}),
      });
    } catch (reduced) {
      throw new AggregateError([firstFailure?.error, reduced], `Oracle ${name}: original ${firstFailure?.checkpoint}; original input ${firstFailure?.input}. Fast-check's error contains the reduced input and replay seed/path.`, { cause: firstFailure?.error });
    }
    if (!comparisons) throw new Error("Oracle never reached a successful comparison");
    console.info(`oracle ${name} ${mode}: ${comparisons} histories compared`);
  }, 120_000);
}
