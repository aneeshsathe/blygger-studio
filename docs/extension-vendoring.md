# Vendoring an extension from another repository

An [extension](extensions.md) does not have to live in this repository. If someone publishes a browser-only extension in their own repository, an operator can compile it into their own build with `npm run ext:add`, pinned to one commit and checked before anything is written. This is the second of the three surfaces in [`mods.md`](mods.md), applied to code the operator did not write.

There is no registry. The program does not publish or host an index of extensions ([`mods.md`](mods.md#no-program-hosted-registry), decision #89). You find an extension the way you find any repository, and the only index involved is your own gitignored `extensions.local.json`, which records what you vendored and at which commit. It is a registry of one.

```
operator: npm run ext:add -- <https repo> <commit> ──┐ fetch exactly that commit (operator's machine only)
                                                     │ check layout, browser-only, import boundary, typecheck
                                                     │ print every file, the tree hash and review flags; ask
                                                     ▼
extensions-vendor/<name>/  (gitignored)      extensions.local.json "vendored" lock (gitignored)
                                                     │
npm run build ──────────────────────────────────────▶ re-hash, refuse if edited or if it has a server half; compile in
                                                     │
Settings → extensions ──────────────────────────────▶ owner turns it on (off by default)
```

## What it is and is not

- **It is** a vendoring tool: `npm run ext:add`, `ext:update` and `ext:remove`, and a check in `npm run build`.
- **It is not** a plugin loader, a package manager or a store. No Studio fetches, evaluates or configures anything from another repository at run time. Only the operator's machine fetches, and only when the operator runs the command.
- **Nothing vendored is committed to this repository.** Vendored source goes into the gitignored `extensions-vendor/`, and the record of it into the gitignored `extensions.local.json`. A release is built from `extensions.json` alone (`BLYG_EXTENSIONS_SHIPPED_ONLY=1`), so a release can never carry a vendored extension. `BLYG_EXTENSIONS=all` (the browser suite) means every extension in this repository, never a vendored one.

## Security model

The Studio runs with the owner's session. An extension's UI gets the SDK client carrying that session, so it can call any owner operation, writes included: publish, discard, mint tokens ([`extensions.md`](extensions.md#security-model-in-one-place)). Vendoring someone else's extension means trusting their code with that. The tool keeps two things true so that the trust is a decision rather than an accident:

1. **The only code that runs is code the operator built, at the commit they named.** A pin is an https git URL, a **full commit id** (never a branch, tag or short id) and an optional subdirectory. `ext:add` fetches exactly that commit and records the **tree hash** of the extension's files beside it. `npm run build` re-hashes the vendored copy every time and refuses to compile one that was edited after vendoring. The commit pins history, and the hash pins bytes in a form a build can check without git or a network. If the author publishes a tree hash, pass it as `--sha256` and the fetched tree must match it.
2. **The operator sees what they are adding.** `ext:add` prints the pin, every file, the hash and a list of review flags, and stages the source at `extensions-vendor/.staging-<name>/` for reading. It vendors nothing until the operator answers yes (or passes `--yes`; in a non-interactive shell it refuses without it, and leaves the staged copy to read). The owner then still has to turn the extension on in Settings, where every extension starts off.

The static checks are **necessary, not sufficient**. `ext:add` refuses, mechanically:

| Refused | Why |
| --- | --- |
| A server half (`server.ts`, `contract.ts`) | Vendored code is browser-only; [see below](#why-vendored-code-is-browser-only) |
| An import other than React, `src/ui/extension-api.ts`, `sdk/dist/browser.js` and the extension's own `ui/` files | The import boundary that `test-ui/extensions.test.ts` holds in-repo extensions to. For vendored code it is enforced with the TypeScript parser instead of a regex |
| `import()` and `require()` | A computed specifier cannot be checked |
| CSS `@import` or `url()` naming a remote URL | That would load from the network at run time |
| Anything besides `ui/**/*.{ts,tsx,css}` and top-level docs (README, LICENSE, `*.md`); symlinks; submodules; hidden or non-ASCII paths; more than 200 files or 2 MB | Nothing rides along that the boundary check did not see |
| A repository that is not an https URL; a commit that is not a full id | Only https is fetched (`git` runs with every other transport disabled), and only an immutable pin is accepted |
| A name an extension in this repository holds (any directory under `extensions/`) | The name is the directory, the Settings key and the class-name prefix |
| Code that fails to typecheck against the extension API with `tsconfig.ui.json` | The API it was written against has to be the API it gets |

It **flags**, for a human to read, anything that makes its own network requests, evaluates strings, creates scripts or workers, writes raw HTML, touches storage or cookies, or navigates windows. None of these can be ruled out statically: an extension that `fetch`es could be exfiltrating the owner's drafts. Read the source at the pinned commit with the flags in hand. Look at what it does with `client` (any write is a reason to ask why), every URL it turns into an `href` (`isFollowableUrl`), and any network request. For an update, the diff between the old and new commits is the unit of review.

## Operators

```sh
npm run ext:add -- https://github.com/someone/their-repo.git <full commit id> --path extensions/word-count
npm run ext:add -- … --sha256 <tree hash>           # the author's published hash must match
npm run ext:add -- … --name word-count              # when ui/index.tsx does not visibly declare a name
npm run ext:add -- … --from /path/to/a/clone        # fetch the pinned commit from a mirror; the lock still names the repository
npm run ext:update -- word-count <new commit id>    # shows which files changed; --repo and --path move it
npm run ext:remove -- word-count
```

The name defaults to the `name:` that `ui/index.tsx` declares, because that is what Settings matches on. `ext:add` writes `extensions-vendor/word-count/` and records it in `extensions.local.json`:

```json
{
  "compile": ["word-count"],
  "vendored": {
    "word-count": { "repo": "https://…", "commit": "<full id>", "path": "extensions/word-count", "sha256": "<tree hash>" }
  }
}
```

Then run `npm run build` (or deploy, which builds), and turn the extension on in **Settings → extensions**. To keep an extension vendored but out of a build, remove its name from `compile`. `ext:remove` deletes both the directory and the lock. A stored Settings toggle for an extension that is no longer compiled in does nothing.

If the build says a vendored tree has changed since it was vendored, something edited `extensions-vendor/<name>/`. `npm run ext:update -- <name> <the locked commit>` restores it, and the build message prints that command. To change a vendored extension, change it upstream and update to the new commit; an edit in place is exactly what the build refuses.

`npm run upgrade` does not touch `extensions-vendor/` or `extensions.local.json`. The extension API has no version and no stability promise ([`mods.md`](mods.md#two-promises-a-mod-keeps)), so after an upgrade the build may fail to compile a vendored extension. Update it to a commit its author has fixed, or remove it.

## Authors: publishing an extension others can vendor

Write it like an in-repo extension ([`extensions.md`](extensions.md#writing-one)), browser-only, in a directory of your own repository:

```
<path>/
  ui/index.tsx        export const extension: StudioExtension, with name: '<name>'
  ui/…                .ts, .tsx and .css only
  README.md, LICENSE  optional
```

Import the API as `../../../src/ui/extension-api.ts` and the SDK as `../../../sdk/dist/browser.js`, exactly as an in-repo extension does. The vendored copy sits at the same depth (`extensions-vendor/<name>/ui/`), so the paths resolve unchanged. Keep tests, build tooling and `package.json` outside `<path>`. The easiest way to develop is inside a Studio checkout as `extensions/<name>/`, then move the directory to your own repository to publish.

Tell operators the repository, the full commit and the path, so they can paste one `ext:add` line. Publishing the tree hash for that commit as well lets them pass `--sha256`; `ext:add` prints it, or you can compute it with the recipe below. If you want a list of extensions, publish one yourself: the program points at none, though [blygger.org/ecosystem](https://blygger.org/ecosystem/) may list an extension the way it lists clients, as an observation.

## The tree hash

The hash covers one line per regular file under the extension's path, formatted as `sha256sum` prints it (`<hex>  <relative path>\n`), with the lines sorted by path. The value is the sha256 of the joined lines. `scripts/ext-tree.ts` implements it, and anyone can reproduce it without this repository:

```sh
cd <path> && find . -type f | sed 's|^\./||' | LC_ALL=C sort \
  | while read -r f; do sha256sum "$f"; done | sha256sum
```

`ext:add` reads the files from git objects at the pinned commit, so untracked or ignored files in a working copy never count. Run the recipe in a clean checkout of that commit.

## Why vendored code is browser-only

An extension with a server half contributes contract routes, and the committed `openapi.json` and SDK include the routes of **every extension in the repository**, so that `npm run sdk:generate` is a function of the repository alone and CI's drift check is deterministic ([`extensions.md`](extensions.md#why-every-extensions-routes-are-in-openapijson)). A vendored extension is not in the repository. Its routes would either be missing from the contract, leaving its UI with no SDK methods to call, or would make the contract depend on an operator's local files. A server half also runs in the Worker with the database, which is a larger trust step than a browser slot. So a server half is upstreamed into this repository as a pull request, or it does not run ([`mods.md`](mods.md#2-compiled-in-extensions)). `ext:add` refuses one, and so does the build.

## Tests

`test-ui/extension-vendoring.test.ts` covers the pin, the hash, every refusal, the build's handling of vendored, release and edited trees, and the CLI end to end. It needs no network: it commits `test-ui/fixtures/hello-vendored/` to a throwaway git repository and vendors it with `--from`.
