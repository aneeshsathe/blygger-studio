/**
 * A passing comparison must reject a plausible wrong implementation.
 * Contract: docs/oracle-tests.md ORC-006 requires a reached semantic failure, not
 * just a nonzero runner exit. These controls break pin persistence, restore text,
 * pagination and mention discovery independently of the expected models.
 * Driver: isolated copies run lifecycle/pagination witnesses and the fixed
 * mention delivery campaign. The LIKE failure also receives direct replay.
 * Refinement: green baselines precede mutation; each nonzero result must name its
 * intended checkpoint. Restore each source file before the next control.
 * Limits: selected wrong designs, not all defects or a complete oracle audit.
 * This runner copies tracked files and the named mention oracle fixture before
 * its first commit. Other untracked integration sources need explicit handling.
 */
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";

// Mutate isolated copies, never the contributor's checkout. A nonzero exit
// alone is insufficient: each mutant must reach its semantic checkpoint.
const root = resolve(".");
const temp = mkdtempSync(join(tmpdir(), "blygger-oracle-mutations-"));
type Control = { name: string; file: string; from: string; to: string; test: string; pattern: string; checkpoint: string; replayTarget?: string };
const controls: Control[] = [
  { name: "pin is not persisted", file: "src/model.ts", from: "UPDATE versions SET pinned = 1,", to: "UPDATE versions SET pinned = 0,", test: "test/item-lifecycle.oracle.test.ts", pattern: "preserves a pinned history", checkpoint: "lifecycle immutable history" },
  { name: "restore changes the wrong text", file: "src/model.ts", from: ".bind(row.content_md, item.id)", to: '.bind("mutation: wrong restored text", item.id)', test: "test/item-lifecycle.oracle.test.ts", pattern: "preserves a pinned history", checkpoint: "lifecycle owner working copy" },
  { name: "page offset is ignored", file: "src/read-api.ts", from: ".bind(limit, offset).all<T>()", to: ".bind(limit, 0).all<T>()", test: "test/pagination.oracle.test.ts", pattern: "walks ties over more than two pages", checkpoint: "pagination page values and order" },
  { name: "tie order is reversed", file: "src/read-api.ts", from: "signals ORDER BY at DESC, subscription_id, remote_id", to: "signals ORDER BY at DESC, subscription_id DESC, remote_id DESC", test: "test/pagination.oracle.test.ts", pattern: "walks ties over more than two pages", checkpoint: "pagination page values and order" },
  { name: "mention lookup restores LIKE", file: "src/mentions/send.ts", from: "substr(?, 1, length(origin)) = origin", to: "? LIKE origin || '%'", test: "test/mention-delivery.oracle.test.ts", pattern: "mention-delivery: fixed", checkpoint: "mention delivery result", replayTarget: "mention-delivery" },
  { name: "mention lookup selects shortest origin", file: "src/mentions/send.ts", from: "ORDER BY length(origin) DESC LIMIT 1", to: "ORDER BY length(origin) ASC LIMIT 1", test: "test/mention-delivery.oracle.test.ts", pattern: "mention-delivery: fixed", checkpoint: "mention discovery trace" },
  { name: "mention lookup includes RSS", file: "src/mentions/send.ts", from: "WHERE kind = 'blyg' AND substr", to: "WHERE substr", test: "test/mention-delivery.oracle.test.ts", pattern: "mention-delivery: fixed", checkpoint: "mention discovery trace" },
];
try {
  for (const file of execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean)) {
    const destination = join(temp, file); mkdirSync(dirname(destination), { recursive: true }); cpSync(join(root, file), destination);
  }
  // Include this known receiving fixture before its first commit as well.
  cpSync(join(root, "test/mention-delivery.oracle.test.ts"), join(temp, "test/mention-delivery.oracle.test.ts"));
  cpSync(join(root, "sdk/dist"), join(temp, "sdk/dist"), { recursive: true });
  mkdirSync(join(temp, "build"));
  for (const file of ["studio-spa.txt", "studio-spa-style.txt", "models.json", "extensions.names.ts", "extensions.server.ts", "extensions.ui.ts"]) cpSync(join(root, "build", file), join(temp, "build", file));
  symlinkSync(join(root, "node_modules"), join(temp, "node_modules"), "dir");
  const execute = (test: string, pattern: string, replay?: { target: string; seed: string; path: string }) => {
    const result = spawnSync(process.execPath, [join(root, "node_modules/vitest/vitest.mjs"), "run", "--maxWorkers=1", test, "-t", replay ? `${replay.target}: replay` : pattern], { cwd: temp, encoding: "utf8", timeout: 90_000, env: { ...process.env, ORACLE_TARGET: replay?.target, ORACLE_SEED: replay?.seed, ORACLE_PATH: replay?.path, NO_COLOR: "1" } });
    return { ...result, stdout: stripVTControlCharacters(result.stdout ?? ''), stderr: stripVTControlCharacters(result.stderr ?? '') };
  };
  // Green baseline uses precisely the same test entry points as the mutants.
  for (const control of [controls[0], controls[2], controls[4]]) {
    const result = execute(control.test, control.pattern);
    assert.equal(result.status, 0, `Baseline failed: ${result.stdout}\n${result.stderr}`);
    assert.ok(/\b[1-9]\d* passed\b/.test(result.stdout + result.stderr), `Baseline ran no tests: ${control.name}`);
  }
  for (const control of controls) {
    const file = join(temp, control.file), original = readFileSync(file, "utf8");
    assert.equal(original.split(control.from).length, 2, `Mutation anchor must be unique: ${control.name}`);
    writeFileSync(file, original.replace(control.from, control.to));
    try {
      const result = execute(control.test, control.pattern), log = `${result.stdout}\n${result.stderr}`;
      writeFileSync(join(root, "build", `mutation-${controls.indexOf(control)}.log`), log);
      assert.equal(result.error, undefined, `${control.name}: runner error`);
      assert.equal(result.signal, null, `${control.name}: runner terminated`);
      assert.equal(typeof result.status, "number", `${control.name}: missing exit status`);
      assert.notEqual(result.status, 0, `Surviving mutation: ${control.name}`);
      assert.ok(log.includes(`Error: ${control.checkpoint}`), `${control.name}: failed before semantic checkpoint\n${log}`);
      if (control.replayTarget) {
        const receipt = /seed:\s*(-?\d+),\s*path:\s*"([^"]*)"/.exec(log);
        assert.ok(receipt, `${control.name}: missing replay seed/path`);
        const replay = execute(control.test, control.pattern, { target: control.replayTarget, seed: receipt[1], path: receipt[2] });
        const replayLog = `${replay.stdout}\n${replay.stderr}`;
        writeFileSync(join(root, "build", "mutation-mention-replay.log"), replayLog);
        assert.equal(replay.error, undefined, `${control.name}: replay runner error`);
        assert.equal(replay.signal, null, `${control.name}: replay terminated`);
        assert.equal(typeof replay.status, "number", `${control.name}: missing replay status`);
        assert.notEqual(replay.status, 0, `${control.name}: replay survived`);
        assert.ok(replayLog.includes(`Error: ${control.checkpoint}`), `${control.name}: replay changed checkpoint\n${replayLog}`);
        console.log(`Replayed ${control.checkpoint}: seed=${receipt[1]} path=${receipt[2]}`);
      }
      console.log(`Caught production mutation: ${control.name} at ${control.checkpoint}`);
    } finally { writeFileSync(file, original); }
  }
} finally { rmSync(temp, { recursive: true, force: true }); }
