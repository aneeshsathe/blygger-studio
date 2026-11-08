// Vendoring an extension from another repository (docs/extension-vendoring.md).
// What these pin, all without network:
//   1. A pin is an https repository, a full commit id and a relative path;
//      nothing else is fetched.
//   2. The tree hash is reproducible, is what the lock records, and an
//      expected hash the operator passes is checked.
//   3. Vendoring refuses a server half, an import outside the extension
//      boundary and a name an in-repo extension holds; a good fixture
//      typechecks against the extension API.
//   4. A vendored extension compiles in from extensions.local.json, and a
//      release build (BLYG_EXTENSIONS_SHIPPED_ONLY) never carries it; a tree
//      edited after vendoring fails the build.
//   5. The CLI shows what it will vendor, will not proceed unreviewed, and
//      ext:update restores an edited copy.
//   6. extensions-vendor/ is gitignored and holds nothing tracked.
// Sources are throwaway git repositories made from test-ui/fixtures/hello-vendored/.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { type Source, checkImports, checkLayout, checkSource, checkVendor, commitVendored, readLocal, removeVendored } from '../scripts/ext-vendor-lib.ts';
import { hashDirectory, readTree, treeHash } from '../scripts/ext-tree.ts';

const REPO = resolve('.');
const FIXTURE = join(REPO, 'test-ui/fixtures/hello-vendored');
const TSX = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const URL = 'https://example.invalid/hello-vendored.git';
const temps: string[] = [];
const temp = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
};
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/** A git repository holding `files` under `ext/`, committed once. */
function sourceRepo(files: Record<string, string>): { dir: string; commit: string } {
  const dir = temp('blyg-ext-src-');
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, 'ext', path)), { recursive: true });
    writeFileSync(join(dir, 'ext', path), content);
  }
  writeFileSync(join(dir, 'outside.txt'), 'not part of the extension');
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8' }).trim();
  git('init', '-q');
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  return { dir, commit: git('rev-parse', 'HEAD') };
}

const fixtureFiles = (): Record<string, string> =>
  Object.fromEntries(readTree(FIXTURE).map((file) => [file.path, new TextDecoder().decode(file.bytes)]));
const hashOf = (files: Record<string, string>) => treeHash(Object.entries(files).map(([path, content]) => ({ path, bytes: new TextEncoder().encode(content) })));
const pin = (repo: { commit: string }): Source => ({ repo: URL, commit: repo.commit, path: 'ext' });

/** A throwaway checkout: the real source, SDK and dependencies by symlink, and its own build/, local file and vendor directory. */
function checkoutRoot(): string {
  const root = temp('blyg-ext-root-');
  for (const link of ['src', 'sdk', 'node_modules', 'extensions', 'scripts', 'tsconfig.ui.json']) symlinkSync(join(REPO, link), join(root, link));
  for (const copy of ['package.json', 'extensions.json']) cpSync(join(REPO, copy), join(root, copy));
  return root;
}
// The operator's environment, without an override of the extension list.
const { BLYG_EXTENSIONS: _override, BLYG_EXTENSIONS_SHIPPED_ONLY: _shippedOnly, ...shipped } = process.env;
const buildExtensions = (root: string, env: Record<string, string> = {}) =>
  spawnSync(process.execPath, ['--import', TSX, join(REPO, 'scripts/build-extensions.ts')], { cwd: root, encoding: 'utf8', env: { ...shipped, ...env } });

describe('a pin', () => {
  const valid: Source = { repo: URL, commit: 'a'.repeat(40), path: 'ext' };

  test('is an https repository, a full commit id and a relative path', () => {
    expect(checkSource(valid)).toEqual([]);
    expect(checkSource({ ...valid, path: '' })).toEqual([]);
    expect(checkSource({ ...valid, commit: 'c'.repeat(64) })).toEqual([]);
  });

  test('refuses a branch, a short or uppercase id, a non-https or exotic transport, and an escaping path', () => {
    const bad = (patch: Partial<Source>) => checkSource({ ...valid, ...patch }).join('\n');
    expect(bad({ commit: 'main' })).toMatch(/full, lowercase commit id/);
    expect(bad({ commit: 'abc1234' })).toMatch(/commit/);
    expect(bad({ commit: 'A'.repeat(40) })).toMatch(/commit/);
    expect(bad({ repo: 'http://example.invalid/x.git' })).toMatch(/https/);
    expect(bad({ repo: 'ext::sh -c touch% /tmp/pwned' })).toMatch(/https/);
    expect(bad({ repo: '/a/local/clone' })).toMatch(/--from/);
    expect(bad({ path: '../escape' })).toMatch(/subdirectory/);
  });

  test('is checked before anything is fetched', async () => {
    const report = await checkVendor({ ...valid, commit: 'main' }, { from: '/nonexistent', root: checkoutRoot() });
    expect(report.files).toEqual([]);
    expect(report.problems.join('\n')).toMatch(/commit id/);
  });
});

describe('the tree hash', () => {
  test('is the sha256 of sha256sum-style lines sorted by path, whatever order the files arrive in', () => {
    const files = [
      { path: 'ui/index.tsx', bytes: new TextEncoder().encode('a') },
      { path: 'README.md', bytes: new TextEncoder().encode('b') },
    ];
    const hex = (data: string) => createHash('sha256').update(data).digest('hex');
    const expected = hex(`${hex('b')}  README.md\n${hex('a')}  ui/index.tsx\n`);
    expect(treeHash(files)).toBe(expected);
    expect(treeHash([...files].reverse())).toBe(expected);
  });

  test('of a fetched commit equals the hash of the same files on disk, and excludes what is outside the path', async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const report = await checkVendor(pin(repo), { from: repo.dir, root: checkoutRoot(), typecheck: false });
    expect(report.problems).toEqual([]);
    expect(report.name).toBe('hello-vendored');
    expect(report.hash).toBe(hashDirectory(FIXTURE));
    expect(report.files.map((file) => file.path)).not.toContain('outside.txt');
  });

  test("a mismatch with the author's published hash is refused", async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const root = checkoutRoot();
    const report = await checkVendor(pin(repo), { from: repo.dir, root, typecheck: false, sha256: '0'.repeat(64) });
    expect(report.problems.join('\n')).toMatch(/tree hash is [0-9a-f]{64}, expected 0{64}/);
    const right = await checkVendor(pin(repo), { from: repo.dir, root, typecheck: false, sha256: hashOf(files) });
    expect(right.problems).toEqual([]);
  });

  test('a commit the source does not have is refused', async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    await expect(checkVendor(pin({ commit: 'b'.repeat(40) }), { from: repo.dir, root: checkoutRoot(), typecheck: false })).rejects.toThrow(/not in/);
  });
});

describe('what may be vendored', () => {
  const bytes = (files: Record<string, string>) => Object.entries(files).map(([path, content]) => ({ path, bytes: new TextEncoder().encode(content) }));

  test('a server half is refused, with the reason', async () => {
    const files = { ...fixtureFiles(), 'server.ts': 'export const server = {};', 'contract.ts': 'export const routes = {};' };
    expect(checkLayout(bytes(files)).join('\n')).toMatch(/server\.ts: vendored extensions are browser-only\. .*openapi\.json/);
    const repo = sourceRepo(files);
    const report = await checkVendor(pin(repo), { from: repo.dir, root: checkoutRoot(), typecheck: false });
    expect(report.problems.some((problem) => problem.startsWith('contract.ts: vendored extensions are browser-only'))).toBe(true);
  });

  test('ui/ holds code and styles only, and nothing else rides along', () => {
    const problems = checkLayout(bytes({ 'ui/index.tsx': '', 'ui/payload.js': '', 'tools/build.ts': '', '.github/x.yml': '', 'LICENSE': '', 'NOTES.md': '' }));
    expect(problems).toEqual([
      'ui/payload.js: ui/ holds .ts, .tsx and .css files only',
      'tools/build.ts: a vendored extension carries ui/ and top-level docs (README, LICENSE, *.md) only',
      '.github/x.yml: paths are ASCII letters, digits, ".", "_" and "-", with no hidden files',
    ]);
    expect(checkLayout(bytes({ 'ui/other.tsx': '' }))).toEqual(['ui/index.tsx is missing (it must export `extension: StudioExtension`)']);
  });

  test('the import boundary holds for vendored code, enforced by the parser', async () => {
    const ok = bytes({
      'ui/index.tsx': "import { useState } from 'react';\nimport { jsx } from 'react/jsx-runtime';\nimport type { StudioExtension } from '../../../src/ui/extension-api.ts';\nimport { unwrap } from '../../../sdk/dist/browser.js';\nimport { x } from './lib/x.ts';\nimport './style.css';",
      'ui/lib/x.ts': "export { y } from '../y.ts';",
      'ui/y.ts': '',
      'ui/style.css': '.a { background: url(data:image/png;base64,AA==); }',
    });
    expect(await checkImports(ok)).toEqual([]);
    const bad = bytes({
      'ui/index.tsx': [
        "import { router } from '../../../src/ui/router.tsx';",
        "import _ from 'lodash';",
        "export * from '../README.md';",
        "import x from '../../other-extension/ui/index.tsx';",
        "const later = import('./y.ts');",
        "const old = require('./y.ts');",
      ].join('\n'),
      'ui/y.ts': '',
      'ui/style.css': "@import 'https://fonts.example/x.css';\n.a { background: url(https://tracker.example/p.gif); }",
      'README.md': '',
    });
    expect(await checkImports(bad)).toEqual([
      'ui/index.tsx: dynamic import() is not allowed in a vendored extension',
      'ui/index.tsx: require() is not allowed in a vendored extension',
      'ui/index.tsx imports "../../../src/ui/router.tsx": only React, the extension API, the SDK and the extension\'s own ui/ files',
      'ui/index.tsx imports "lodash": only React, the extension API, the SDK and the extension\'s own ui/ files',
      'ui/index.tsx imports "../README.md": only React, the extension API, the SDK and the extension\'s own ui/ files',
      'ui/index.tsx imports "../../other-extension/ui/index.tsx": only React, the extension API, the SDK and the extension\'s own ui/ files',
      'ui/style.css: url(https://tracker.example/p.gif) loads from the network at run time',
      'ui/style.css imports "https://fonts.example/x.css": only React, the extension API, the SDK and the extension\'s own ui/ files',
    ]);
  });

  test('the name comes from ui/index.tsx or --name, and an in-repo name is refused', async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const root = checkoutRoot();
    const taken = await checkVendor(pin(repo), { from: repo.dir, root, typecheck: false, name: 'inspect' });
    expect(taken.problems).toContain('"inspect" is the name of an extension in this repository');
    const renamed = await checkVendor(pin(repo), { from: repo.dir, root, typecheck: false, name: 'hello-other' });
    expect(renamed.problems).toEqual([]);
    expect(renamed.flags.join('\n')).toMatch(/does not visibly declare name: "hello-other"/);
    const badName = await checkVendor(pin(repo), { from: repo.dir, root, typecheck: false, name: 'Bad_Name' });
    expect(badName.problems.join('\n')).toMatch(/lowercase letters, digits and single hyphens/);
    const anonymous = { ...files, 'ui/index.tsx': files['ui/index.tsx'].replace("name: 'hello-vendored',", '') };
    const anonRepo = sourceRepo(anonymous);
    const unnamed = await checkVendor(pin(anonRepo), { from: anonRepo.dir, root, typecheck: false });
    expect(unnamed.problems.join('\n')).toMatch(/pass --name/);
  });

  test('a good extension typechecks against the extension API; a bad one does not', async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const root = checkoutRoot();
    const good = await checkVendor(pin(repo), { from: repo.dir, root });
    expect(good.problems).toEqual([]);
    const broken = { ...files, 'ui/greeting.ts': 'export const greeting = (kind: number) => kind;' };
    const brokenRepo = sourceRepo(broken);
    const bad = await checkVendor(pin(brokenRepo), { from: brokenRepo.dir, root });
    expect(bad.problems.join('\n')).toMatch(/does not typecheck against the extension API:\nui\/index.tsx\(\d+,\d+\): error TS2345/);
    expect(existsSync(join(root, 'extensions-vendor/.staging-hello-vendored'))).toBe(false);
  }, 120_000);
});

describe('vendored extensions in a build', () => {
  test('compile in from extensions.local.json, never into a release build, and not once edited', async () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const root = checkoutRoot();
    const source = pin(repo);
    const report = await checkVendor(source, { from: repo.dir, root, typecheck: false, keepStaged: true });
    expect(report.problems).toEqual([]);
    commitVendored(report.name, source, report.hash, report.staged!, root);
    expect(readLocal(root)).toEqual({
      compile: ['hello-vendored'],
      vendored: { 'hello-vendored': { repo: URL, commit: repo.commit, path: 'ext', sha256: hashOf(files) } },
    });

    const operator = buildExtensions(root);
    expect(operator.status, operator.stderr).toBe(0);
    const ui = readFileSync(join(root, 'build/extensions.ui.ts'), 'utf8');
    expect(ui).toContain('from "../extensions-vendor/hello-vendored/ui/index.tsx"');
    expect(ui).toContain('from "../extensions/inspect/ui/index.tsx"');
    expect(readFileSync(join(root, 'build/extensions.names.ts'), 'utf8')).toContain('"hello-vendored"');
    expect(readFileSync(join(root, 'build/extensions.server.ts'), 'utf8')).not.toContain('hello-vendored');

    const release = buildExtensions(root, { BLYG_EXTENSIONS_SHIPPED_ONLY: '1' });
    expect(release.status, release.stderr).toBe(0);
    expect(readFileSync(join(root, 'build/extensions.ui.ts'), 'utf8')).not.toContain('extensions-vendor');
    expect(readFileSync(join(root, 'build/extensions.names.ts'), 'utf8')).toContain('["inspect","reading-time"]');
    // The browser suite's "all" means the catalogue, never a vendored extension.
    const all = buildExtensions(root, { BLYG_EXTENSIONS: 'all' });
    expect(readFileSync(join(root, 'build/extensions.ui.ts'), 'utf8'), all.stderr).not.toContain('extensions-vendor');

    writeFileSync(join(root, 'extensions-vendor/hello-vendored/ui/greeting.ts'), 'export const greeting = () => "edited";\n');
    const edited = buildExtensions(root);
    expect(edited.status).toBe(1);
    expect(edited.stderr).toMatch(/extensions-vendor\/hello-vendored has changed since it was vendored/);
    expect(edited.stderr).toContain(`npm run ext:update -- hello-vendored ${repo.commit}`);

    // A server half that appears in the vendored copy is refused before its hash is compared.
    writeFileSync(join(root, 'extensions-vendor/hello-vendored/server.ts'), 'export const server = {};\n');
    expect(buildExtensions(root).stderr).toMatch(/has a server half; vendored extensions are browser-only/);

    expect(removeVendored('hello-vendored', root)).toBe(true);
    expect(existsSync(join(root, 'extensions-vendor/hello-vendored'))).toBe(false);
    expect(readLocal(root)).toEqual({ compile: [] });
  });

  test('the CLI shows what it will vendor, will not proceed unreviewed without --yes, and update restores an edited copy', () => {
    const files = fixtureFiles();
    const repo = sourceRepo(files);
    const root = checkoutRoot();
    const cli = (...args: string[]) =>
      spawnSync(process.execPath, ['--import', TSX, join(REPO, 'scripts/ext-vendor.ts'), ...args], { cwd: root, encoding: 'utf8', input: '' });

    const unreviewed = cli('add', URL, repo.commit, '--path', 'ext', '--from', repo.dir);
    expect(unreviewed.status).toBe(1);
    expect(unreviewed.stdout).toContain(`source    ${URL} @ ${repo.commit} : ext`);
    expect(unreviewed.stdout).toContain(`tree      sha256 ${hashOf(files)}`);
    expect(unreviewed.stdout).toContain('ui/index.tsx');
    expect(unreviewed.stdout).toContain("runs with the owner's session");
    expect(unreviewed.stderr).toContain('re-run with --yes');
    expect(existsSync(join(root, 'extensions.local.json'))).toBe(false);
    // Left for the operator to read; nothing is vendored or compiled in.
    expect(existsSync(join(root, 'extensions-vendor/.staging-hello-vendored/ui/index.tsx'))).toBe(true);
    expect(existsSync(join(root, 'extensions-vendor/hello-vendored'))).toBe(false);

    expect(cli('add', URL, 'main', '--from', repo.dir, '--yes').stderr).toMatch(/full, lowercase commit id/);

    const added = cli('add', URL, repo.commit, '--path', 'ext', '--from', repo.dir, '--yes');
    expect(added.status, added.stderr).toBe(0);
    expect(existsSync(join(root, 'extensions-vendor/hello-vendored/ui/index.tsx'))).toBe(true);
    expect(readLocal(root).vendored?.['hello-vendored']).toEqual({ repo: URL, commit: repo.commit, path: 'ext', sha256: hashOf(files) });
    expect(cli('add', URL, repo.commit, '--path', 'ext', '--from', repo.dir, '--yes').stderr).toContain('already vendored');
    expect(cli('update', 'hello-vendored', repo.commit, '--from', repo.dir).stdout).toContain('is current');

    writeFileSync(join(root, 'extensions-vendor/hello-vendored/ui/greeting.ts'), 'export const greeting = () => "edited";\n');
    const restored = cli('update', 'hello-vendored', repo.commit, '--from', repo.dir, '--yes');
    expect(restored.status, restored.stderr).toBe(0);
    expect(restored.stdout).toContain('1 changed');
    expect(hashDirectory(join(root, 'extensions-vendor/hello-vendored'))).toBe(hashOf(files));

    expect(cli('remove', 'hello-vendored').status).toBe(0);
    expect(existsSync(join(root, 'extensions-vendor/hello-vendored'))).toBe(false);
    expect(cli('update', 'hello-vendored', repo.commit).stderr).toContain('is not vendored');
  }, 60_000);

  test('extensions-vendor/ is gitignored and nothing in it is tracked', () => {
    const ignored = spawnSync('git', ['check-ignore', '-q', 'extensions-vendor/anything/ui/index.tsx'], { cwd: REPO });
    expect(ignored.status).toBe(0);
    expect(execFileSync('git', ['ls-files', 'extensions-vendor'], { cwd: REPO, encoding: 'utf8' })).toBe('');
  });
});
