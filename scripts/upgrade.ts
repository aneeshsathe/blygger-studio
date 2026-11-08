// `npm run upgrade` — pull a new release of the client into your own copy.
//
// A copy of this repo is a fork, and forks drift. Without an answer here the
// artifact strands people on whatever version they installed, which is worse
// than shipping nothing — so this is a first-class deliverable, not a footnote.
//
// Runs under `node --experimental-strip-types` (Node 22+); no dependencies.
//
// ── The conflict surface, and why it is small ────────────────────────────────
// Everything about *your* deployment lives in exactly two files: `wrangler.jsonc`
// (committed in your copy, generic upstream) and `deploy-targets.json`
// (gitignored, so it never merges at all). Nothing under `src/` should ever need
// editing to configure an instance.
//
// That is a constraint on us, not on you. Any change upstream that makes a
// self-hoster edit `src/` to configure their instance breaks this path and
// should be a setting or an env var instead. If you find one, report it.
//
// `wrangler.jsonc` is the one file that can conflict, because you wrote yours
// and we keep editing ours. Yours always wins — see below.

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";

const root = path.join(import.meta.dirname, "..");
const UPSTREAM = "https://github.com/blygger/blygger-studio.git";
/** Files that are yours by definition: on a conflict, keep your side. */
const YOURS = ["wrangler.jsonc"];

const rl = createInterface({ input: stdin, output: stdout });

function git(args: string[], quiet = false) {
  const res = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (!quiet && res.status !== 0 && res.stderr) process.stderr.write(res.stderr);
  return res;
}
function run(cmd: string, args: string[]) {
  return spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
}
function die(msg: string): never {
  console.error(`\n✘ ${msg}`);
  rl.close();
  process.exit(1);
}
const ask = async (q: string) => (await rl.question(`${q} [y/N]: `)).trim().toLowerCase();
const yes = (a: string) => a === "y" || a === "yes";

// ── 1. Refuse to merge into a dirty tree ─────────────────────────────────────

if (git(["rev-parse", "--git-dir"], true).status !== 0) {
  die(
    "this is not a git repository, so there is nothing to merge into.\n" +
      "  If you downloaded a zip rather than cloning, the upgrade path is to clone\n" +
      `  ${UPSTREAM} fresh and copy your wrangler.jsonc across.`,
  );
}
if (`${git(["status", "--porcelain"]).stdout}`.trim()) {
  die("you have uncommitted changes. Commit or stash them first — a merge on top\n  of a dirty tree is how work gets lost.");
}

// ── 2. Point at upstream ─────────────────────────────────────────────────────

const remotes = `${git(["remote"]).stdout}`.split("\n").map((r) => r.trim());
if (!remotes.includes("upstream")) {
  console.log(`— adding upstream remote: ${UPSTREAM}`);
  git(["remote", "add", "upstream", UPSTREAM]);
}
console.log("— fetching upstream");
if (git(["fetch", "upstream", "--tags"]).status !== 0) die("could not fetch upstream.");

// ── 2b. Upgrade to the latest RELEASE, not to the tip of main ────────────────
//
// This merged `upstream/main` until session 29, which put the two halves of the
// version story in disagreement with each other:
//
//   * the studio's update alert compares `CLIENT.version` against the GitHub
//     **releases** feed, so it is talking about tags;
//   * this script moved you to whatever was on **main**, which is usually ahead
//     of the last tag and is sometimes half of something.
//
// An operator could therefore upgrade, land on unreleased commits, and still be
// told they were current — or be told they were behind while running code newer
// than the release they were being pointed at. Worse, `CLIENT.version` on main
// between releases is the *previous* release's number, so "what am I running?"
// had no answer that meant anything.
//
// Tags are the contract now: `v*` sorted by version, newest wins. A release is
// a thing with a changelog entry stating `Migrations:`, which is exactly what
// an operator needs before deciding how careful to be.
//
// `--no-tags` is deliberately absent above; the fetch already pulls tags.
function latestReleaseTag(): string | null {
  const out = git(["tag", "--list", "v*", "--sort=-v:refname"]).stdout ?? "";
  const tags = `${out}`.split("\n").map((t) => t.trim()).filter(Boolean);
  return tags[0] ?? null;
}

const target = latestReleaseTag();
if (!target) {
  die(
    "no release tags found on upstream. This script upgrades between releases;\n" +
      "  if you are deliberately tracking main, merge `upstream/main` yourself.",
  );
}
console.log(`— latest release: ${target}`);

// ── 3. Say what is about to change, before changing it ───────────────────────

const range = `HEAD..${target}`;
const log = `${git(["log", "--oneline", range]).stdout}`.trim();
if (!log) {
  // Ahead of the tag is a normal state for anyone tracking main, and it is not
  // an error — say which, rather than claiming they are up to date.
  const ahead = `${git(["log", "--oneline", `${target}..HEAD`]).stdout}`.trim();
  console.log(ahead ? `\n✓ already on ${target} or newer.` : `\n✓ already up to date (${target}).`);
  rl.close();
  process.exit(0);
}

const changed = `${git(["diff", "--name-only", range]).stdout}`.split("\n").filter(Boolean);
const newMigrations = changed.filter((f) => f.startsWith("migrations/"));
const touchesYours = changed.filter((f) => YOURS.includes(f));

console.log(`\n${log.split("\n").length} new commit(s):\n`);
console.log(log.split("\n").map((l) => `  ${l}`).join("\n"));

// The changelog is the thing to actually read: every entry states `Migrations:`
// explicitly, which is the line that decides how careful this upgrade is.
if (changed.includes("CHANGELOG.md")) {
  console.log(`\n  Read the changelog entries for these:\n  ${UPSTREAM.replace(/\.git$/, "")}/blob/main/CHANGELOG.md`);
}
if (newMigrations.length) {
  console.log(`\n  ⚠ ${newMigrations.length} migration file(s) changed — your database will need them:`);
  for (const m of newMigrations) console.log(`      ${m}`);
}
if (touchesYours.length) {
  console.log(`\n  ${touchesYours.join(", ")} changed upstream. Yours will be kept — see below.`);
}

if (!yes(await ask("\nMerge these?"))) {
  console.log("Nothing changed.");
  rl.close();
  process.exit(0);
}

// ── 4. Merge, keeping your config ────────────────────────────────────────────

const merged = git(["merge", target!, "--no-edit"]);
if (merged.status !== 0) {
  const conflicts = `${git(["diff", "--name-only", "--diff-filter=U"]).stdout}`.split("\n").filter(Boolean);
  const ours = conflicts.filter((f) => YOURS.includes(f));
  const theirs = conflicts.filter((f) => !YOURS.includes(f));

  for (const f of ours) {
    // Your deployment config is yours by definition: it names your account,
    // your database and your domain, and upstream's copy is a generic template
    // that would overwrite all of it. Resolved without asking, and reported.
    git(["checkout", "--ours", "--", f]);
    git(["add", "--", f]);
    console.log(`  kept your ${f}`);
  }

  if (theirs.length) {
    die(
      `merge conflicts this script will not guess at:\n    ${theirs.join("\n    ")}\n\n` +
        `  These are files you have edited that upstream also changed. Resolve them,\n` +
        `  then:  git add <files> && git commit\n\n` +
        `  If you have edited src/ to configure your instance, that is worth\n` +
        `  reporting — configuration should never require a source edit, and it is\n` +
        `  what will make every future upgrade hurt.`,
    );
  }
  if (git(["commit", "--no-edit"]).status !== 0) die("could not complete the merge commit.");
}
console.log("\n→ merged");

// ── 5. Dependencies, schema, and a gate before deploying ─────────────────────

console.log("\n— installing dependencies");
// --legacy-peer-deps: npm 10.9's peer resolver crashes on vitest's optional
// peer graph. An environment quirk, not this project's.
if (run("npm", ["install", "--legacy-peer-deps"]).status !== 0) die("npm install failed.");

if (newMigrations.length) {
  console.log("\n— applying new database migrations");
  if (run("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--remote"]).status !== 0) {
    die("migrations failed. Your Worker is untouched — the old code is still live.");
  }
}

console.log("\n— normalizing stored imported dates");
if (run("node", ["--import", "tsx", "scripts/normalize-import-dates.ts", "--remote"]).status !== 0) die("date normalization failed. Nothing deployed. Finish pending writes, then run: node --import tsx scripts/normalize-import-dates.ts --remote");

console.log("\n— checking the merge result before it goes anywhere near your blyg");
if (run("npm", ["run", "build"]).status !== 0) die("SDK build failed after merge. Nothing deployed.");
if (run("npx", ["tsc", "--noEmit"]).status !== 0) die("typecheck failed after merge. Nothing deployed.");
if (run("npm", ["test"]).status !== 0) die("tests failed after merge. Nothing deployed.");
console.log("→ green");

if (yes(await ask("\nDeploy now?"))) {
  run("npm", ["run", "deploy"]);
} else {
  console.log("\nWhen you are ready:  npm run deploy");
}

console.log(`
Note: before 1.0 the wire format itself can change between releases. That is
stated rather than buried — a release can require a redeploy of a *reader* to
keep making sense of what a *publisher* emits. The changelog says when.
`);

rl.close();
