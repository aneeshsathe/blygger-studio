// npm run ext:add | ext:update | ext:remove (docs/extension-vendoring.md).
//
// Vendors a browser-only extension from another repository, pinned to a full
// commit, into the gitignored extensions-vendor/<name>/, and records the pin
// and its tree hash in the gitignored extensions.local.json, so `npm run build`
// compiles it in. That file is the whole index: there is no registry to look a
// name up in (docs/mods.md). Nothing is fetched or evaluated by a Studio at run
// time, and nothing vendored is committed or reaches a release build.
//
//   npm run ext:add -- <https repo> <commit> [--path <subdir>] [--name <name>] [--sha256 <hash>] [--from <mirror>] [--yes]
//   npm run ext:update -- <name> <commit> [--repo <https repo>] [--path <subdir>] [--sha256 <hash>] [--from <mirror>] [--yes]
//   npm run ext:remove -- <name>
//
// --path    the extension's directory inside the repository (default: its root)
// --name    the name to vendor it under (default: the name ui/index.tsx declares)
// --sha256  a tree hash the author published; the fetched tree must match it
// --from    fetch the pinned commit from a mirror or local clone instead of the
//           repository; the commit is checked all the same, and the lock
//           records the repository, not the mirror
// --yes     skip the review prompt (you have reviewed the source another way)
import { createInterface } from "node:readline/promises";
import { rmSync } from "node:fs";
import { relative } from "node:path";
import { type Source, checkVendor, commitVendored, hashOfVendored, readLocal, removeVendored, treeDiff, vendoredTree } from "./ext-vendor-lib.ts";

const fail = (msg: string): never => {
  console.error(`ext: ${msg}`);
  process.exit(1);
};

const VALUED = new Set(["--path", "--name", "--sha256", "--from", "--repo"]);
const [command, ...rest] = process.argv.slice(2);
const flags = new Map<string, string | true>();
const positional: string[] = [];
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (arg === "--yes" || arg === "-y") flags.set("yes", true);
  else if (VALUED.has(arg)) flags.set(arg.slice(2), rest[++i] ?? fail(`${arg} needs a value`));
  else if (arg.startsWith("-")) fail(`unknown option ${arg}`);
  else positional.push(arg);
}
const flag = (key: string) => flags.get(key) as string | undefined;

async function confirm(question: string): Promise<boolean> {
  if (flags.get("yes")) return true;
  if (!process.stdin.isTTY) fail("not a terminal: review the staged source and re-run with --yes");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim());
  } finally {
    rl.close();
  }
}

async function vendor(update: boolean) {
  const local = readLocal();
  let source: Source;
  let name: string | undefined;
  if (update) {
    const [target, commit] = positional;
    if (!target || !commit) fail("usage: npm run ext:update -- <name> <full commit id> [--repo <url>] [--path <subdir>]");
    name = target;
    const lock = local.vendored?.[name] ?? fail(`"${name}" is not vendored; use npm run ext:add -- <repo> <commit>`);
    source = { repo: flag("repo") ?? lock.repo, commit, path: flag("path") ?? lock.path };
    if (flag("name")) fail("--name: ext:update keeps the name it was vendored under; ext:remove and ext:add to rename");
    const same = source.repo === lock.repo && source.commit === lock.commit && source.path === lock.path;
    if (same && hashOfVendored(name) === lock.sha256) {
      console.log(`ext: ${name} is current (${lock.commit.slice(0, 12)}), and its vendored copy matches the lock`);
      return;
    }
  } else {
    const [repo, commit] = positional;
    if (!repo || !commit) fail("usage: npm run ext:add -- <https repo> <full commit id> [--path <subdir>] [--name <name>]");
    source = { repo, commit, path: flag("path") ?? "" };
    name = flag("name");
  }

  console.log(`ext: fetching ${source.repo} at ${source.commit}${flag("from") ? ` (from ${flag("from")})` : ""} …`);
  let report;
  try {
    report = await checkVendor(source, { from: flag("from"), name, sha256: flag("sha256"), keepStaged: true });
  } catch (e) {
    return fail((e as Error).message);
  }
  if (report.problems.length) fail(`refusing ${report.name ? `"${report.name}"` : source.repo}:\n  - ${report.problems.join("\n  - ")}`);
  name = report.name;
  if (!update && local.vendored?.[name]) {
    rmSync(report.staged!, { recursive: true, force: true });
    fail(`"${name}" is already vendored at ${local.vendored[name].commit.slice(0, 12)}; use npm run ext:update -- ${name} <commit>`);
  }
  const staged = report.staged!;
  const size = report.files.reduce((sum, file) => sum + file.bytes.length, 0);
  console.log(`
  name      ${name}
  source    ${source.repo} @ ${source.commit}${source.path ? ` : ${source.path}` : ""}
  tree      sha256 ${report.hash}${flag("sha256") ? " (matches --sha256)" : " (recorded as the lock; compare it with the author's, if they publish one)"}
  files     ${report.files.length}, ${(size / 1024).toFixed(1)} KB
${report.files.map((file) => `            ${file.path}`).join("\n")}
`);
  if (update) {
    const lock = local.vendored![name];
    const diff = treeDiff(vendoredTree(name), report.files);
    console.log(`  changes since ${lock.commit.slice(0, 12)}: ${diff.added.length} added, ${diff.changed.length} changed, ${diff.removed.length} removed`);
    for (const [label, paths] of Object.entries(diff)) for (const path of paths) console.log(`            ${label.padEnd(8)}${path}`);
    console.log("");
  }
  console.log(
    report.flags.length
      ? `  For review (not refusals; the extension runs with the owner's session):\n${report.flags.map((item) => `    - ${item}`).join("\n")}\n`
      : "  For review: nothing flagged. Read it anyway; the extension runs with the owner's session.\n",
  );
  console.log(`  The source is staged for review at ${relative(process.cwd(), staged)}/`);
  console.log("  An extension's UI can call any owner operation, writes included (docs/extensions.md, \"Security model\").\n");
  if (!(await confirm(`Vendor ${name} into extensions-vendor/${name}/ and compile it in?`))) {
    rmSync(staged, { recursive: true, force: true });
    fail("not vendored");
  }
  commitVendored(name, source, report.hash, staged);
  console.log(`ext: vendored ${name}. Run npm run build (or deploy), then turn it on in Settings → extensions.`);
}

switch (command) {
  case "add":
    await vendor(false);
    break;
  case "update":
    await vendor(true);
    break;
  case "remove": {
    const name = positional[0] ?? fail("usage: npm run ext:remove -- <name>");
    if (!removeVendored(name)) fail(`"${name}" is not vendored`);
    console.log(`ext: removed ${name} from extensions-vendor/ and extensions.local.json. Its Settings toggle now does nothing.`);
    break;
  }
  default:
    fail("usage: ext-vendor.ts add|update|remove …");
}
