/** Isolated production controls for ORC-006. Copy only project sources and
 * public test fixtures, not host credentials or contributor planning directories.
 * A nonzero exit counts only if it reaches the intended assertion checkpoint.
 * Baseline, mutation and restore use the same exact receiving test command.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { stripVTControlCharacters } from 'node:util';

const root = resolve('.'), temp = mkdtempSync(join(tmpdir(), 'blygger-polling-controls-'));
const controls = [
  { name: 'old feed overwrite', file: 'src/feed-cache.ts', from: "onlyIf: new Headers(current ? { 'If-Match': current.httpEtag } : { 'If-None-Match': '*' }),", to: '', test: 'test/polling-cache.oracle.test.ts', pattern: 'old builders cannot overwrite', checkpoint: 'feed generation non-regression' },
  { name: 'body-only ETag ABA', file: 'src/feed-cache.ts', from: 'const body = stamp(xml, target);', to: 'const body = xml;', test: 'test/polling-cache.oracle.test.ts', pattern: 'old builders cannot overwrite', checkpoint: 'feed generation non-regression' },
  { name: 'mixed feed read', file: 'src/feed-cache.ts', from: 'if (!same(target, await readFeedRevision(env.DB))) continue;', to: 'await readFeedRevision(env.DB);', test: 'test/polling-cache.oracle.test.ts', pattern: 'discards a render interrupted', checkpoint: 'feed legal snapshot' },
  { name: '304 skips check', file: 'src/feed-cache.ts', from: 'waitUntil(revalidate(request, env, mount, key, artifact)', to: "if (!request.headers.has('If-None-Match')) waitUntil(revalidate(request, env, mount, key, artifact)", test: 'test/polling-cache.oracle.test.ts', pattern: 'serves saved legal XML', checkpoint: 'feed unchanged work' },
  { name: 'HEAD skips feed check', file: 'src/feed-cache.ts', from: 'waitUntil(revalidate(request, env, mount, key, artifact)', to: "if (request.method !== 'HEAD') waitUntil(revalidate(request, env, mount, key, artifact)", test: 'test/polling-cache.oracle.test.ts', pattern: 'cron builds cold', checkpoint: 'scheduled feed changed XML' },
  { name: 'latest Studio cache token', file: 'src/ui/revision-query.ts', from: 'return { data, generation };', to: 'const latest = await readChanges(context); return { data, generation: { epoch: latest.epoch, revision: latest.domains[domain] } };', test: 'test-ui/polling-cache.oracle.test.ts', pattern: 'stores the pre-fetch token', checkpoint: 'Studio pre-fetch revision' },
  { name: 'unchanged token skips changed feed', file: 'src/feed-cache.ts', from: '=> artifact?.generation?.epoch === target.epoch && artifact.generation.revision >= target.revision;', to: '=> !!artifact;', test: 'test/polling-cache.oracle.test.ts', pattern: 'polling-cache: fixed', checkpoint: 'feed settled values', replay: true },
  { name: 'Studio cache ignores changed revision', file: 'src/ui/revision-query.ts', from: 'cached?.generation.epoch === generation.epoch &&\n      cached.generation.revision === generation.revision', to: 'cached?.generation.epoch === generation.epoch', test: 'test-ui/polling-cache.oracle.test.ts', pattern: 'studio-polling: fixed', checkpoint: 'Studio query work and retry', replay: true },
  { name: 'failed Studio cache token', file: 'src/ui/revision-query.ts', from: 'const data = await load(context);', to: 'if (cached) context.client.setQueryData(context.queryKey, { data: cached.data, generation }); const data = await load(context);', test: 'test-ui/polling-cache.oracle.test.ts', pattern: 'failed content loads retain', checkpoint: 'Studio failed-query retry' },
] as const;
let primary: unknown;
try {
  for (const path of ['src', 'test', 'test-ui', 'migrations', 'sdk', 'build', 'package.json', 'package-lock.json', 'models.json', 'openapi.json', 'wrangler.jsonc', 'vitest.config.ts', 'vitest.ui.config.ts', 'tsconfig.json', 'tsconfig.ui.json']) cpSync(join(root, path), join(temp, path), { recursive: true });
  mkdirSync(join(temp, 'scripts')); cpSync(join(root, 'scripts/reset-change-epoch.sql'), join(temp, 'scripts/reset-change-epoch.sql'));
  symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
  const run = (control: typeof controls[number], replay?: { seed: string; path: string }) => {
    const ui = control.test.startsWith('test-ui/');
    const target = ui ? 'studio-polling' : 'polling-cache';
    const result = spawnSync(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--maxWorkers=2', ...(ui ? ['--config', 'vitest.ui.config.ts'] : []), control.test, '-t', replay ? `${target}: replay` : control.pattern], {
      cwd: temp, encoding: 'utf8', timeout: 90_000,
      env: { ...process.env, WRANGLER_LOG_PATH: join(temp, 'wrangler.log'), ORACLE_TARGET: replay ? target : undefined, ORACLE_SEED: replay?.seed, ORACLE_PATH: replay?.path },
    });
    // CI enables ANSI styling between the count and "passed". Formatting must
    // not change execution witnesses, checkpoint matching, or replay parsing.
    return { ...result, stdout: stripVTControlCharacters(result.stdout ?? ''), stderr: stripVTControlCharacters(result.stderr ?? '') };
  };
  for (const control of controls) {
    const baseline = run(control); assert.equal(baseline.status, 0, `${control.name}: baseline failure\n${baseline.stdout}\n${baseline.stderr}`);
    assert.match(baseline.stdout + baseline.stderr, /\b[1-9]\d* passed\b/, `${control.name}: baseline ran no tests`);
    const path = join(temp, control.file), original = readFileSync(path, 'utf8');
    assert.equal(original.split(control.from).length, 2, `${control.name}: ambiguous mutation anchor`);
    let mutant = original.replace(control.from, control.to);
    writeFileSync(path, mutant);
    try {
      const result = run(control), log = result.stdout + '\n' + result.stderr;
      writeFileSync(join(root, 'build', `polling-mutation-${controls.indexOf(control)}.log`), log);
      assert.equal(result.error, undefined, `${control.name}: runner/setup failure`); assert.equal(result.signal, null, `${control.name}: terminated`);
      assert.notEqual(result.status, 0, `${control.name}: survived`);
      assert.ok(log.includes(`Error: ${control.checkpoint}`), `${control.name}: missed intended checkpoint\n${log}`);
      if ('replay' in control) {
        const receipt = /seed:\s*(-?\d+),\s*path:\s*"([^"]*)"/.exec(log);
        assert.ok(receipt, 'Generated failure omitted replay seed/path');
        const replay = run(control, { seed: receipt[1], path: receipt[2] });
        const replayLog = replay.stdout + '\n' + replay.stderr;
        writeFileSync(join(root, 'build', 'polling-mutation-replay.log'), replayLog);
        assert.notEqual(replay.status, 0, 'Generated mutant replay survived');
        assert.ok(replayLog.includes(`Error: ${control.checkpoint}`), 'Replay changed the violated law');
        console.log(`Replayed ${control.checkpoint}: seed=${receipt[1]} path=${receipt[2]}`);
      }
      console.log(`Rejected ${control.name} at ${control.checkpoint}`);
    } finally { writeFileSync(path, original); }
  }
} catch (error) { primary = error; throw error; }
finally {
  try { rmSync(temp, { recursive: true, force: true }); }
  catch (cleanup) { if (primary) throw new AggregateError([primary, cleanup], 'Oracle mutation failure and cleanup failure', { cause: primary }); throw cleanup; }
}
