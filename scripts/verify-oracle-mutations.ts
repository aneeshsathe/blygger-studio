import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// Mutate isolated copies, never the contributor's checkout. A nonzero exit
// alone is insufficient: each mutant must reach its semantic checkpoint.
const root = resolve(".");
const temp = mkdtempSync(join(tmpdir(), "blygger-oracle-mutations-"));
const controls = [
  { name: "pin is not persisted", file: "src/model.ts", from: "UPDATE versions SET pinned = 1,", to: "UPDATE versions SET pinned = 0,", test: "test/item-lifecycle.oracle.test.ts", pattern: "preserves a pinned history", checkpoint: "lifecycle immutable history" },
  { name: "restore changes the wrong text", file: "src/model.ts", from: ".bind(row.content_md, item.id)", to: '.bind("mutation: wrong restored text", item.id)', test: "test/item-lifecycle.oracle.test.ts", pattern: "preserves a pinned history", checkpoint: "lifecycle owner working copy" },
  { name: "page offset is ignored", file: "src/read-api.ts", from: ".bind(limit, offset).all<T>()", to: ".bind(limit, 0).all<T>()", test: "test/pagination.oracle.test.ts", pattern: "walks ties over more than two pages", checkpoint: "pagination page values and order" },
  { name: "tie order is reversed", file: "src/read-api.ts", from: "signals ORDER BY at DESC, subscription_id, remote_id", to: "signals ORDER BY at DESC, subscription_id DESC, remote_id DESC", test: "test/pagination.oracle.test.ts", pattern: "walks ties over more than two pages", checkpoint: "pagination page values and order" },
];
try {
  for (const file of execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean)) {
    const destination = join(temp, file); mkdirSync(dirname(destination), { recursive: true }); cpSync(join(root, file), destination);
  }
  cpSync(join(root, "sdk/dist"), join(temp, "sdk/dist"), { recursive: true });
  mkdirSync(join(temp, "build"));
  for (const file of ["studio-spa.txt", "studio-spa-style.txt", "models.json"]) cpSync(join(root, "build", file), join(temp, "build", file));
  symlinkSync(join(root, "node_modules"), join(temp, "node_modules"), "dir");
  const execute = (test: string, pattern: string) => spawnSync(process.execPath, [join(root, "node_modules/vitest/vitest.mjs"), "run", "--maxWorkers=1", test, "-t", pattern], { cwd: temp, encoding: "utf8", timeout: 90_000, env: { ...process.env, ORACLE_TARGET: undefined, ORACLE_SEED: undefined, ORACLE_PATH: undefined, NO_COLOR: "1" } });
  // Green baseline uses precisely the same test entry points as the mutants.
  for (const control of [controls[0], controls[2]]) {
    const result = execute(control.test, control.pattern);
    assert.equal(result.status, 0, `Baseline failed: ${result.stdout}\n${result.stderr}`);
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
      console.log(`Caught production mutation: ${control.name} at ${control.checkpoint}`);
    } finally { writeFileSync(file, original); }
  }
} finally { rmSync(temp, { recursive: true, force: true }); }
