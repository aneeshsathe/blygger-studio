# API cleanup progress

The implementation follows [the cleanup plan](api-cleanup-plan.md) and
[issue 92](https://github.com/blygger/blygger-studio/issues/92). Record
source findings, decisions, checks, and PR dependencies here as work proceeds.
Update the plan when a finding changes its scope or design.

## Decisions

- The private API can break. API, SDK, Studio, and MCP change together in each PR.
- Mounted REST moves to `{mount}/api` without root aliases or dual audiences.
- Validators cover complete representations. Immutable caching requires fixed
  bytes, a content-hash URL, and suitable retention.
- CI tooling reliability and scheduling remain separate from this series.
- Use TanStack's on-demand collection protocol and cursor pager rather than an
  application-owned cursor traversal engine.
- Ambiguous historical empty versions keep their existing interpretation.
  New versions store explicit state. Upgrades do not require manual classification.
- Use stacked PRs when a dependency is still in review. Each PR must leave its
  API and consumers working. Do not merge or deploy without a separate request.

## Stack

| Part | Status | Branch and base | PR |
| --- | --- | --- | --- |
| 1a Attachment restore and provenance validation | Open, all nine upstream CI jobs pass | `codex/api-cleanup`, based on upstream `main` at `2582d73` | [90](https://github.com/blygger/blygger-studio/pull/90) |
| 1b Explicit version state | Open, all nine upstream CI jobs pass | `codex/api-version-state`, based on `codex/api-http` | [93](https://github.com/blygger/blygger-studio/pull/93) |
| 2 HTTP behavior | Open, all nine upstream CI jobs pass | `codex/api-http`, based on `codex/api-cleanup` | [91](https://github.com/blygger/blygger-studio/pull/91) |
| 3a Operation policies and discovery | Open, all nine upstream CI jobs pass | `codex/api-operation-policy`, after 93 | [95](https://github.com/blygger/blygger-studio/pull/95) |
| 3b Shared operation execution | Open, all nine upstream CI jobs pass | `codex/api-operation-runner`, after 95 | [96](https://github.com/blygger/blygger-studio/pull/96) |
| 4 Mounted API cutover | Open, all nine upstream CI jobs pass | `codex/api-mount-cutover`, after 96 | [97](https://github.com/blygger/blygger-studio/pull/97) |
| 5 Conditional mutations | Open, all nine upstream CI jobs pass | `codex/api-item-revisions`, after 97 | [98](https://github.com/blygger/blygger-studio/pull/98) |
| 6 Private resources | Open, all nine upstream CI jobs pass | `codex/api-private-resources`, after 98 | [99](https://github.com/blygger/blygger-studio/pull/99) |
| 7 Cursor pages and TanStack loading | Open, all nine upstream CI jobs pass | `codex/api-cursor-pages`, after 99 | [100](https://github.com/blygger/blygger-studio/pull/100) |
| 8 Hash-addressed media | Open, all nine upstream CI jobs pass | `codex/api-media-digests`, after 100 | [101](https://github.com/blygger/blygger-studio/pull/101) |

## Findings on 2026 10 31

### Historical empty versions need a separate migration policy

`withdraw()` inserts an empty `content_md`, while empty normal publications
can store the same text and default HTML/transclusion values. Older fragment
versions therefore need not retain enough data to distinguish the two intents.
Current item state resolves some latest versions but not every historical row.
The publication note is not a reliable discriminator.

Plan change: split the version-state migration into PR 1b. PR 1a contains the
attachment and validation repairs and needs no migration. No production data
was inspected or changed. The user selected preservation of existing behavior
for ambiguous legacy versions, with explicit stored state for new versions.

### Restore spans media membership and the item row

Working membership is `media.item_id`; published membership is `version_media`.
Restoring text alone could mark an item clean while leaving the wrong working
attachments. Restore now detaches additions and reattaches the selected
version's retained media in the same transaction as the text update. Every
statement guards the caller's captured item state. A stale restore changes
neither the item nor membership. Historical memberships and R2 bytes remain.

Discarded uploads are detached, not physically deleted. Garbage collection is
not part of this repair. Restoring a version with generated text still leaves
the working copy dirty because stripped text cannot recreate positional TK
authoring provenance.

### Provenance needs a conditional text premise

A provenance-only PATCH validates scopes against stored text. Its atomic guard
must include that text. A PATCH providing replacement text validates that
replacement instead and does not need a new general text revision rule here.
The deterministic tests cover both cases with a real competing edit.

### Dependency and review baseline

Upstream `main` still resolves to `2582d73` at the start of this implementation.
The fork's `origin/main` is 85 commits behind it, so PR comparisons target
upstream `main`. GitHub reports read-only upstream access. Dependent branches
therefore remain stacked on the fork, while upstream PRs target `main` and link
to their parent-relative comparisons. Main diffs include unmerged parents
until the stack advances. Dependencies were installed from the merged lockfile:
DB/React DB `1.0.0-rc.1` and Query Collection `1.5.0`.

## Verification for PR 1a

- `npx vitest run test/version-media.test.ts test/restore-version.test.ts test/patch-atomicity.oracle.test.ts --maxWorkers=2`:
  33 passed with the fix. With original production source and the new tests,
  four regressions failed and 29 tests passed. The fixed source was restored
  after that control.
- `npm run typecheck`: passed.
- Separate read-only reviews of restore/media and provenance/guard changes:
  no actionable findings.
- Full Worker suite: 150 files passed, 1,868 tests passed, five skipped.
- `npm run release:check`: passed for client 0.49.2.
- `npm run sdk:generate`: passed with no tracked artifact drift.
- PR publication: [PR 90](https://github.com/blygger/blygger-studio/pull/90).
- Upstream CI: all nine checks passed, including e2e, auth-security Worker/browser
  mutations, polling-cache/oracle mutations, OAuth interop, SDK generation, and scope.

The local Worker tests need a loopback socket, so they run with a narrowly
scoped sandbox escalation. Fixtures disable remote bindings and outbound
network access. This does not change the repository's CI policy.

## Findings for HTTP response policies

Hono's `Context.res` setter preserves headers from the prior response. Replacing
`c.res` with a cloned response can restore a cache or CORS header that the clone
changed or removed. Apply final policy with `Context.header` after dispatch.
The final route matcher also escapes literal regex characters, so an unknown
`openapiXjson` path stays 404. The native OAuth provider returns 404 for metadata
HEAD requests. The adapter maps HEAD to native GET and applies body removal and
validation after dispatch.

Native responses outside a Hono context still use an ordinary header-preserving
response wrapper. Receiving tests exposed this difference before publication.

Mutable public JSON, OPML, CSS, and feed reads revalidate. Their validators cover
the full representation. A live item's pin status and a pinned document's live
author/origin metadata can change its ETag without changing `content_hash`.
Private media validates only after current access checks. Legacy media URLs
contain random IDs, so this PR removes their immutable promise and supplies
storage validators. Hash-addressed uploads remain PR 8.

The native OAuth discovery TTL remains intact. JWKS gets an explicit public
revalidation policy. Token responses remain `no-store`. Authorization endpoints
have no CORS allow headers, with or without a trailing slash and on preflight.
Private body-limit errors and MCP origin denials also receive `no-store`.

The audit's cookie-only 401/challenge question remains a separate auth-contract
choice for the operation/error work. PR 2 does not add a misleading Bearer
challenge to cookie-only routes.

## Verification for PR 2

- Focused HTTP, HTML, media, mount, OAuth/MCP, and polling-cache tests: 276 passed.
- Typecheck passed after correcting test fixture types.
- Parent-source control: all 19 receiving tests failed on the parent source.
  The fixed source was restored after the control.
- Full Worker suite after the final fixes: 151 files passed, 1,888 tests passed,
  five skipped. An earlier run passed 1,886 tests and failed only the old
  `public, max-age=60` assertion, which now checks the intended revalidation policy.
- Final focused route, metadata HEAD, and OAuth regression suite: 121 passed.
- Final typecheck, release check for 0.49.3, and SDK generation passed.
  SDK generation produced no tracked OpenAPI or generated SDK drift.
- Read-only cache/resource, transport/header, and final-fix reviews completed.
  The transport review found the literal route matcher defect, now fixed and
  covered by the negative-path receiving test. Final review found no issues.
- PR publication: [PR 91](https://github.com/blygger/blygger-studio/pull/91).

## Findings for explicit version state

Owner history and eligibility used empty markdown as a withdrawal marker.
Public pinned pages and forks instead used transclusion-column presence.
Some live-item kind recovery used truthiness. A single legacy fallback would
change existing behavior, so unresolved old rows retain the rule at each read
boundary. New rows use explicit stored kind everywhere.

Migration 0034 leaves the field nullable because migration runs before Worker
deployment. The prior Worker can still insert its old column list during that
window. Backfill recognizes nonempty fragments, valid thread arrays, and known
current item state. It does not infer intent from note text or version parity.
Only the new field changes. Trigger guards include it so all relevant revision
domains change with it.

The audit also found Studio pin/restore controls gated on truthy markdown.
They now use the version resource's kind. The lifecycle oracle chooses legal
pin/restore actions from its own snapshot-kind model and generates empty edits.
Background reading, publishing history, quote links, RSS, fork citations, and
mention route checks use explicit authored kind while retaining legacy rules.

## prep-pr receipts

The user requested prep-pr for every PR after PRs 90 and 91 opened. Retrospective
parallel simplification and comprehensive code-review passes covered each frozen
branch diff. Both reviews found no actionable bugs or instruction violations.
PR 90 had no simplification suggestions. PR 91 had one optional P3 suggestion:
compile method matchers at API construction instead of each fallback request.
The user authorized evaluation and automatic repair of routine findings.
The matcher cleanup is evaluated, verified, and pushed on PR 91.

This repository does not use Changesets. The changeset skill stops without
creating a directory. Release notes and version fields follow the repository's
existing scheme. Evaluate review findings and apply routine repairs. Present only novel design
decisions to the user, as instructed on 2026-10-31. Then run its
CI-loop step against the published head.

## Verification for PR 1b

- Initial state/lifecycle/trigger/migration-shape suite: 174 passed, with two
  test-fixture selector failures corrected to use the reading entry's own ID.
- State, lifecycle oracle, and populated migration fixture: 14 passed.
- Parent-production control: all five new state receiving tests failed, then
  the candidate source was restored in a finally block.
- Browser regression: desktop and mobile both passed. The fixture uses browser
  fetch so the Secure owner cookie reaches the local HTTP fixture, and matches
  the actual restore sheet title.
- The real v0.8.3 upgrade entry point passed against a synthetic local release:
  offline install/build, migration acquisition including nullable version state,
  typecheck, SDK/Worker smoke, and explicitly declined deployment.
- Typecheck passed. SDK generation passed with no tracked generated drift after
  omitting the stored kind before extending the explicit Version resource kind.
- prep-pr found two missed fork paths: local pin-choice filtering and remote
  empty-content rejection. Four new receiving cases fail on the current
  candidate, confirming both findings. Both fixes are now applied after RED evidence confirmed the failures.
- Simplifier proposals: share the repeated authored-kind SQL expression while
  retaining the distinct pin fallback, and replace the backfill's proven
  fragment lookup with the literal fragment value. Both simplifications are applied after source evaluation.

- Full Worker suite before review fixes: 151 files passed, two files failed.
  1,896 tests passed, five skipped, and exactly the four new fork regressions
  failed. No additional failures. Final typecheck and release check passed.
- Tracking issue published and verified: [92](https://github.com/blygger/blygger-studio/issues/92),
  containing the full plan and unchecked delivery checklist. PRs are not marked
  complete until merged. GitHub connector creation returned integration 403, so
  the authorized CLI fallback created the issue successfully.

The earlier add/skip gates were superseded by the user's instruction to use
evaluate-review and present only novel design decisions. The five pending
items require no novel design choice. The scratch ledger preserves all original
claims, footnotes, technical verdicts, actions, test evidence, and destinations.
No scratch review ledger is committed to this branch.

## prep-pr review for PR 2

The retrospective code review found no new bugs. The simplifier suggested
compiling fallback method patterns once at API construction. Evaluation confirmed
that this preserves the static route inventory and its order. A temporary
executable counter measured 138 constructions across two fallback requests
before the change and zero during those requests afterward. Existing receiving
tests still distinguish literal paths, 404/405 statuses, and Allow headers.
The probe and its logs remain in task-local scratch, outside the PR.

The final focused suite passed 38 cases across the probe, HTTP response
contract, and MCP oracle. Typecheck passed. The user requested automatic
evaluation and repair of straightforward items, with only novel design decisions
presented for approval. This replaces the earlier add/skip and documentation
readiness gates for this series. The repo uses its existing version/changelog
scheme because it has no Changesets configuration.

The full series is tracked in [issue 92](https://github.com/blygger/blygger-studio/issues/92).

## Evaluation of prep-pr findings

PR 91 now compiles method matchers at API construction. PR 1b now includes
explicit empty publications in local fork choices and accepts empty strings
from remote pinned publications. Missing/null/numeric markdown and withdrawal
endcaps still fail remote fork creation. Legacy unknown empty rows keep their
old exclusion from local fork choices.

The three batched authored-kind readers share one SQL expression, with
code-owned aliases and their existing truthy fallback. The separate pinned
version nullness fallback remains. Migration 0034 uses the literal fragment
value after its predicate establishes that fact. The guarded JSON expression
and nullable old-Worker insertion window remain intact.

The child branch advanced from 437634d to PR 91's 51df219. Earlier evidence is
recorded against its original head. Relevant checks will run again against
the final child candidate before publication. The stash checkpoint remains
available at 6c4aacb until this work is complete.

## Final local results for PR 1b

All five evaluated review items are fixed. There are no open evidence gaps or
novel design decisions. The review ledger and raw claims remain in
`/tmp/blygger-api-review-evaluation`, outside the PR. Final loss audit: five raw
items, five fixed, none omitted, deferred, refuted, or awaiting a decision.
The correctness reviewer found both fork defects with precise consumer paths.
The simplifier found three valid small cleanups. Both passes were useful.

- Full Worker suite: 153 files passed, 1,904 tests passed, five skipped.
- Desktop/mobile empty-publication pin, restore, and history-to-fork: two passed.
- Focused state, lifecycle, fork, feed, and populated migration suite: 61 passed.
- Final typecheck, release check, and SDK generation passed. No generated drift.
- Actual old-version upgrade fixture rerun after migration cleanup: passed.
- Separate final review of the evaluated fixes: no actionable findings.

PR 91's method cleanup and retrospective PR descriptions are published. The
quiet CI heartbeat monitors the stack and checks review submissions/comments;
its local automation ID is `api-cleanup-ci`. It stops after tracked heads are
green and every discovered review item has a disposition.

Version-state publication: [PR 93](https://github.com/blygger/blygger-studio/pull/93),
stacked on PR 91. Final review audit: five items fixed, no unresolved evidence.

## Restack on PR 94 — 2026-10-31

The user requested the whole stack on [PR 94](https://github.com/blygger/blygger-studio/pull/94),
head `cb2fa974fe2914577bcd12510a580a8d9ed2c612`. All six API commits replayed
without patch changes. The branch order is dependency updates, PR 90, PR 91,
PR 93, then the unpublished operation-policy branch. The source analysis still
refers to its original upstream baseline.

The package baseline now has Better Auth/provider 1.7.14, MCP client/server
2.4.0, Cloudflare vitest-plugin 1.4.11, Miniflare 5.20261023.3-beta, Zod 4.6.7,
and Hono 4.13.14. TanStack DB/React DB remain pinned to 1.0.0-rc.1 and Query
Collection remains 1.5.0. Installed with the updated lockfile: zero audit findings.

Fresh combined-stack results on this dependency baseline:

- Full Worker suite: 153 files, 1,905 passed, five skipped.
- UI suite: 14 files, 112 passed.
- Studio and client-access browser suites: 34 passed across desktop/mobile.
- Typecheck, SDK generation without tracked drift, and local old-version upgrade
  fixture: passed. No deployment.

The browser run exposed a shared test fixture collision. Desktop and mobile
saved the same site title, so the second no-op emitted no PATCH. The test now
uses project/repeat/retry-specific titles while retaining the real PATCH/200,
saved-status, reload, and persistence assertions. A source-driven cardinality
probe proved retry values differ. A controlled browser probe deliberately
failed after its first successful save, then passed on retry. Scratch probes
stay outside the PR. The fixture repair is on PR 90 so every child inherits it.

The operation-policy checkpoint is retained at `2016bb93ecc8deefcde5105df61ed4fb25c0504f`.
Restack inputs, original remote heads for explicit push leases, range comparisons,
and logs are in `/tmp/blygger-api-restack-pr94`. CI monitoring paused during the
restack and resumes against the new published heads.

Part 3 has 64 existing operations and roughly 1,400 lines of route handlers.
Split its implementation into 3a (explicit policy facts and capability discovery)
and 3b (shared domain execution). This changes review size, not the agreed API
architecture or the hard-cutover decisions.

## Part 3a: operation policies and discovery — 2026-10-31

Extended the existing route declarations with scopes, conditional permissions,
feature requirements, effects, and work budgets. REST scope checks and work
admission use those facts. MCP descriptions and hints derive from them. Runtime
policy functions stay out of generated OpenAPI. Static extension routes stay in
OpenAPI and the SDK; discovery uses current compiled/enabled/granted state.

Added authenticated capabilities for every valid identity, including a grant
with only reading-state authority. The REST permission oracle covers all 32
scope subsets. MCP's real-credential oracle now covers all 31 valid nonempty
subsets; injected empty authority is tested separately. The larger real-client
matrix exceeded the shared test MCP budget, so test bindings now provide high
request limits, like the existing API fixture. Budget oracles still set small
limits explicitly. Production quotas stay unchanged.

prep-pr's parallel review found four small corrections. evaluate-review retained
all four raw claims and evidence in `/tmp/blygger-api-policy-review`. Discovery
work now runs only for discovery requests. REST owns live extension execution
checks. Uncompiled extension paths return 404, including direct calls. MCP hints
mark classification and signal replacement as destructive because they can
replace or delete existing data. Deterministic query probes reproduced 1 extra
preview query, 2 capability queries, and 3 extension queries before repair. They
now expect 0, 1, and 1 respectively. The same extension probe reproduced 405
before the unavailable-route repair and expects 404 afterward.

All 14 policy-specific cases pass after those repairs. The initial wider suite
passed 170 cases before the final review repairs. Final broad results follow.
No new design decision or plan change.

Restacked PRs 90, 91, and 93 now have all nine upstream CI jobs green at
`0d46c5c`, `9eed3a4`, and `694664e`. Reviews and inline comments are empty.
The heartbeat stopped after those heads completed. It resumes for new PRs.

Final part 3a results: 154 Worker files passed, 1,919 tests passed, five skipped.
UI: 14 files and 112 tests passed. Studio/client-access/extensions browser
flows: 38 passed across desktop/mobile. Typecheck, SDK generation, release
check and diff whitespace checks passed. The final independent review found
no further issues. Four raw review items are fixed, with no unresolved idea,
evidence gap or design decision. Version 0.49.5, no migration.

Part 3a is published as [PR 95](https://github.com/blygger/blygger-studio/pull/95),
head `9f43bf3`, on PR 93. The plan issue includes its results. CI monitoring now
tracks PRs 90, 91, 93, and 95.

## Part 3b: shared domain execution — 2026-10-31

Extracted 63 core operations and the two compiled extension reads from HTTP
handlers into typed domain handlers. They receive verified authority, the node
environment and URL, compiled extensions, a defer function, and validated data.
They receive no Hono context or HTTP request and return no Response objects.
REST and MCP call one runner. MCP no longer constructs synthetic REST requests,
FormData, or File objects. Both upload adapters produce byte input.

Existing create/fork/response, publish/refresh/withdraw, classification, warnings,
attachment rollback, and deferred mentions remain in their operation pipeline.
The runner catches input-schema failures separately from domain/output failures,
so damaged output remains an internal error. Multipart metadata is validated
before normalization, preserving rejection of invalid inline and item fields.

Initial parity/security suite: 197 passed. Additional direct-runner, media,
authority, budget, race and mention regressions: 46 passed. Typecheck passes.
prep-pr reviews and final broad verification are in progress. Version 0.49.6,
no migration. No plan change.

PR 95 CI found three stale security mutation anchors after policy extraction.
The controls now mutate the policy declarations and retain their original
semantic checkpoints. Highlight, avatar and draft-scope baselines pass; all
three broken controls fail at the required security assertion. Repair published
as `2dfca6e`. The operation-runner branch advanced to that parent without patch
changes. Its checkpoint remains `0e7681d` until publication.

Part 3b prep-pr/evaluate-review retained 11 claims, including preliminary
suspicions and documentation footnotes, in `/tmp/blygger-api-runner`. Four
correctness defects reproduced: disabled-method 405 instead of404, MIME case
normalization, missing admission on uncompiled tools, and raw infrastructure
errors from native MCP. Seven receiving cases failed before repair; the same
40-case suite passes afterward. A further tools/list error probe reproduced a
raw native-32603 message and now returns a generic message with the same code.
All54 boundary/auth cases pass. The body-limit suspicion conflicts with the
documented REST-only setting and fixed8MiB MCP envelope policy; a direct test
now states that distinction. No new design choice.

The simplifier removed dead media context/form state and the unused extension
HTTP adapter, shared Zod error formatting, and named body-only policy input
ScopeInput. Domain output-schema failures remain500 rather than client400.
Server extension callback docs and client-access dispatch docs match the new
runner. Final independent review found no remaining actionable issue. Ledger
loss audit: 11 raw claims, 10 fixed, one refuted defect claim with its useful
boundary test retained. No omitted or unresolved idea.

The full run found two additional existing415 expectations that exposed a
missing REST media-type gate. Restored the installed Hono OpenAPI JSON/form
rules in the adapter. Typed decode failures still pass through shared scope
and admission checks. The two exact receiving tests and their47-case neighbor
suite pass. A final independent review found no further issue.

Final part3b results:155 Worker files passed,1,933 tests passed,five skipped.
UI:112 passed. Desktop/mobile Studio, client access and extension flows:38
passed after the media-gate repair. Typecheck, release check and generated SDK
without tracked drift pass. Four moved security controls and three authorization
controls reached their original semantic failure assertions, with two captured
replays. All81 exact mutation anchors match current source. Final loss audit:
12 raw claims,11 fixed,one refuted defect interpretation with its useful test
retained. No open evidence gap, omitted idea or new design decision.

Local validation must serialize SDK rebuilds with typecheck. One overlapping
browser build temporarily removed sdk/dist while tsc ran. Repeating tsc after
that build completed passed without a source change.

Part 3b is published as [PR 96](https://github.com/blygger/blygger-studio/pull/96),
head `623a413`, on PR 95. All nine upstream CI jobs for PR95 at `2dfca6e` passed.
Reviews and inline comments are empty. PR96 CI is still running.

## Part 4: mounted API cutover — 2026-10-31

The private API now follows the deployment mount. Shared deployment paths and
URLs supply routing, audiences, capabilities, OpenAPI servers, creation
Location headers and Studio boot data. Generated operation paths are relative
to the complete API base. Root deployments retain `/api`; mounted deployments
serve `{mount}/api` without a host-root alias. Contract version is 2.0.0.

Client and grant notes describe replacement or new consent for the old mounted
REST audience. MCP audiences stay unchanged. Receiving fixtures now use the
node's actual mounted REST address. Initial mounted route/SDK/OAuth/MCP suite:
80 passed. Typecheck passes. Full Worker, UI and prep-pr reviews are in progress.
No plan change.

Final part4 results:156 Worker files passed,1,937 tests passed,five skipped.
UI:112 passed. Desktop/mobile Studio, access, extensions and forwarded nested
Studio:40 passed. Pinned MCP Inspector and browser OAuth interoperability:8
passed. Controlled cross-isolate refresh/revoke replay passed. Installed SDK
0.3.0 Node/Chromium consumers, both TypeScript resolution modes and fresh
Worker D1/R2 persistence pass. The0.8.3 upgrade path passes through the new
SDK contract and declines deployment. Typecheck, SDK generation, release check,
syntax and whitespace checks pass. All81 mutation anchors remain valid.

prep-pr/evaluate-review retained10 raw claims in `/tmp/blygger-api-mount`:
nine fixed and one duplicate with its intentional negative-control detail
preserved. Repairs corrected receiving fixtures, package navigation, the SDK's
independent version, CLI guidance and repeated URL resolution. No production
fault or novel design decision arose. The initial full run's four stale
fixture failures have exact focused GREEN receipts and a full GREEN rerun.

The service-worker assertion now executes the fetch handler: API GET/POST
requests are never intercepted, even though the owner-free offline shell
correctly includes the API boot path. SDK archive names use a version
placeholder so old generated paths cannot be paired with new base URLs.
Client0.49.7, private contract2.0.0, SDK0.3.0. No migration.

Part4 is published as [PR97](https://github.com/blygger/blygger-studio/pull/97),
head `6a7ff15`, on PR96. The plan issue and CI heartbeat include it. Part5
continues on `codex/api-item-revisions` without waiting for parent merges.

All nine upstream jobs passed for each published head90,91,93,95,96,97.
All review submissions and inline comment lists are empty. The current-head
snapshot is in `/tmp/blygger-api-review-evaluation/stack-green-20261031.json`.
The CI heartbeat stops until another head is published.

## Part 5: conditional item mutations — 2026-10-31

Work continues on `codex/api-item-revisions`. Every participating API writer
captures a private revision, checks it at commit, and returns the resulting
revision. Text and positional provenance install together. Attachment changes
and publication transitions advance that same item revision. Studio carries
its observed revision through a paced command queue and rejects stale work.

Review reproduced missing polling invalidation on revision-only writes, stale
media deletion after detachment, restore read-back adopting a foreign revision,
and inconsistent typed conflict details at upload/discard/generation boundaries.
Focused repairs preserve public reading/feed invalidation policy and retained
media bytes. Evidence and the lossless ledger are under
`/tmp/blygger-api-item-revisions`.

The rollout audit reproduced an old in-flight generation overwriting a new
revision-aware edit across two Worker isolates sharing D1. A control that drains
old writes before migration/cutover prevents it. The upgrade procedure needs a
write-pause/drain boundary or mixed-version writer safeguards. That choice is
pending with the user; independent implementation and fixture repairs continue.

Part5 validation so far:159 Worker files,1,950 tests passed,five skipped.
All121 UI tests pass, including actual quick-editor actions and controlled
restore/read-back queues. The installed SDK0.4.0 accepts its own revision
receipts, rejects stale publication, and retains the committed text/version.
Installed Node/Chromium consumers, both TypeScript resolution modes, fresh
Worker D1/R2 persistence, and the0.8.3 local upgrade pass. The upgrade receiver
also checks an existing draft's initial revision and selective polling trigger.
The archived lineage demo silently left both rows unpublished against the new
API; the repaired demo publishes both through explicit receipt chains.

Two media mutation controls reach their semantic failure checkpoints. All82
exact mutation anchors match. Typecheck, SDK generation, release check and
whitespace checks pass. Full desktop/mobile browser verification is running.
The release build/verification and lineage demo ran in an isolated temporary
copy so browser tests retained stable SDK and asset files.

Both prep-pr reviewers completed their final source pass without another
actionable production finding. The lossless ledger also records the
lost-response browser contract: a real committed save whose response is lost
retains local text, and a repeat with the old revision must409 rather than
silently adopt another token. Rollout choice I14 remains pending.

Part8 follow-up from the final header pass: inspect the mounted private API's
early OPTIONS204 in `src/index.ts`. Its local CORS branch currently omits an
explicit Cache-Control header, unlike public-wire preflight. Add a same-path
probe before repair and preserve root/nested behavior. This remains a named
header-audit follow-up rather than an unverified claim of shared caching.

Final part5 browser run:399 passed,five skipped across the full desktop/mobile
suite (404 declared cases). The real lost-response histories pass for both
fragments and threads on both devices. All19 regenerated SDK/OpenAPI files
match the working source. Final ledger:18 retained rows,12 fixed,five
duplicates and one design decision (I14). No other open review item.

The user clarified that these are single-user APIs. The rollout risk requires
an old in-flight request and a new write to the same item during cutover.
Keep the upgrade simple: finish pending writes, including generation, before
upgrading, and avoid edits until deployment finishes. Record this limit in the
changelog and both installation guides. Add no maintenance gate or mixed-version
writer layer. The concrete old/new evidence remains in
`/tmp/blygger-api-item-revisions/rollout-boundary.md`.

I14 is disposed as a known, accepted upgrade limit with documented operator
guidance. The final ledger has18 rows:12 fixed,five duplicates and one deferred
mixed-version compatibility requirement. No open design decision. Parts6–8
retain their planned scope.

Part5 is published as [PR98](https://github.com/blygger/blygger-studio/pull/98),
head `15ba930`, stacked on PR97. CI is running and review/comment lists are
empty. Part6 continues on `codex/api-private-resources`.

PR98's randomized authorization campaign found a stale publish probe that omitted
the required revision. Seed -1957230746 and its exact shrink path reproduced
400 instead of the intended missing-resource404. The same replay and all six
authorization cases pass with expectedRevision:1. Repair0e65c59 is pushed and
fast-forwarded into part6. Receipts and CI98-01 are preserved in
`/tmp/blygger-api-review-evaluation`.

Part6 now uses explicit camelCase private resource schemas and shallow, named
storage adapters. Imported metadata is decoded per column, retains unknown
nested members, and uses null for damaged data. Media URLs are absolute at the
deployment's canonical public base. Private errors use code/message/details;
OAuth and public protocol payloads keep their native forms. Receiving fixtures
and browser checks are still in progress. Review found old client adapters for
release checks, OPML errors, relative media references, and outer private errors.
Each is recorded before repair in the part6 review ledger. No plan change.

Part6 review repairs now cover the actual receiving paths: release-update state
adapts into the existing storage helper, OPML uses the server message, relative
media markdown still prevents removal, and outer private HTTPS/exception failures
share the declared error envelope. Focused probes demonstrated each old failure
and pass after the repair. All134 UI tests and both TypeScript projects pass.

The fixture audit caught two tests that could pass for the wrong reason after a
hard representation cutover. Numeric-content and missing-revision probes must
send a valid new field name before testing their intended error. A successful
SDK response-schema test must also demand its expected200 status, rather than
accept a well-formed validation error. These assertions now name the intended
issue paths/status. SDK wrapper.error remains a transport member, and successful
preview diagnostics remain top-level errors. Only failed private operations use
code/message/details.

Absolute private media URLs, relative public protocol URLs, and R2 keys are
distinct values. Receiving fixtures now derive a public/R2 key explicitly where
that is their subject and fetch canonical private URLs directly. Public formats
and stored snapshot assertions keep their existing spellings. Two renamed
mutation anchors were updated; all82 anchors match, and the two changed security
mutants are caught at their original semantic checkpoints. The full Worker and
desktop/mobile browser runs remain in progress.

The published stack through PR98 is now green at all current heads:90/91/93/95/
96/97/98, with nine successful jobs each. PR98's final head is0e65c59. Complete
review submissions and inline threads are empty. The completed CI heartbeat is
paused until the next PR publishes. Raw final audit: stack-green.json in the
shared review-evaluation directory.

Part6's complete Worker run passed1958 tests with five skipped. Final review
then reproduced an old multipart field being silently ignored, which could
create unattached media. Strict multipart field validation now matches the
JSON cutover. Its focused positive/negative receiving checks are in progress;
this does not change the agreed design or the public protocol.

The strict multipart witness is GREEN4/4 after RED2/4. Affected REST/SDK/MCP,
authorization-race, media-history, and HTTP checks pass72 tests. A further37
resource/corrupt-column checks pass, including an empty thread's authored kind
in both detail and list after withdrawal and republication. UI remains134/134
and both TypeScript projects pass. Remaining private descriptions/error labels
now use the same field names as the contract.

The committed candidate's SDK archive passes installed Node and Chromium
consumers, both TypeScript resolution modes, and fresh-process D1/R2 persistence.
The restart fixture initially reused the first process's absolute media URL
after its ephemeral port closed. It now asserts that original canonical origin,
then addresses the same media path at the restarted fixture origin. Its privacy
and exact-byte checks pass. This is a local fixture correction, not a production
URL fallback.

Part8 receiving coverage follow-up C2: combine fresh and duplicate uploads,
working and published attachment URL fields, root/nested mounts, and private/
public fetches in one matrix when digest-bearing URLs arrive. Part6 already
checks those component paths; preserve this combined coverage idea alongside
the earlier private OPTIONS Cache-Control follow-up.

Part6 is published as PR99 at1c3ee04, stacked on PR98. CI is running; reviews
and inline comments are empty. Its complete desktop/mobile rerun passed399
tests with five skipped and no flaky results. Installed SDK, persistence,
TypeScript, generated-artifact reproduction, and relevant targeted checks pass.
The reconciled review ledger has37 items:29 fixed, four duplicates, three
already satisfied, and one named part8 coverage follow-up. No design decision
or confirmed-open review item remains.

Part7 begins on codex/api-cursor-pages from the published part6 head. Local
TanStack source confirms createCursorPager owns opaque continuation acquisition
and cancellation, while useLiveInfiniteQuery grows DB windows. Backend pages
must bind collection/filter/order/generation and reject stale continuations.
The existing Reading loader scans every identity before slicing, so replacing
only its HTTP envelope would leave the bounded-loading requirement unsatisfied.
The implementation must select identities with bounded SQL before loading bodies.

PR99 CI found three stale receivers after the strict field cutover: the
controlled draft-deletion race uploaded item_id; OAuth interoperability demanded
site_title in MCP results; and one security mutant classifier demanded the old
site_url assertion label. Each reproduced locally and passed on the same path
after the spelling repair. Six multipart/race tests, all eight root/nested
OAuth browser/Inspector cases, and the exact insecure-control rejection pass.
Commit9448c4c is published and fast-forwarded into part7. Full raw CI logs and
RED/GREEN receipts are in pr99-ci-ledger.jsonl under the shared evaluation
directory. Three raw findings, three fixed, none omitted. CI reruns at the new
head; no production behavior or design changed.

The cursor primitive passes15 focused D1 cases and both TypeScript projects.
The cases cover mixed ASC/DESC ties, NULL positions, Unicode keys, malformed
and oversized tokens, source/filter/order/domain binding, relevant generation
expiry, and controlled changes during projection. First-page construction
retries once; continuation construction rejects a changed generation. Page SQL
uses a bounded limit and no OFFSET. This is primitive verification, not evidence
that the server/client pagination cutover is complete.

All published heads90/91/93/95/96/97/98/99 now have nine successful upstream
jobs each. PR99 is9448c4c. Complete review submissions and inline threads are
empty, with no pagination omitted from those reads. The exact-head GraphQL
audit is stack-final-pr99.json in the shared evaluation directory. Three CI
findings are fixed with same-path RED/GREEN evidence. The CI heartbeat is
paused until the next publication. Nothing was merged or deployed.

Part7 implementation findings: the installed DB loader completes leading-value
ties through separate equality demands. A timestamp-first multi-column order
can therefore load a whole large tie. Windowed Studio sources now derive one
unique binary order key. Exact boundary demands decode that client key into
ordinary API equality filters; they never become backend continuation cursors.
Items use updated DESC/id DESC so the client and server can express the same
unique order. Public protocol ordering is unchanged. The native pager still owns
all opaque-page acquisition. A5000-row timestamp tie stays bounded while the
actual DB window grows25 to50 rows; all24 source-collection tests pass.

A page-schema check must run inside the native page fetch, before Query stores
it as successful. A focused witness accepted a damaged row before that check;
it now rejects the row and retries successfully at the same generation. All
seven pager-adapter tests pass, including cancellation and expired-acquisition
restart. Source schemas retain their later projection checks as well.

Part7 is not yet review-ready. The API/SDK and Studio cutover is in progress;
history, collection, migration, permission-inventory, release and browser
receivers must be brought through final checks. Hopper detail and hopper Reading
still request complete membership cohorts through the native pager; finish
their bounded UI demand before claiming part7 complete. No PR for this part
has been published.

Part7 now bounds hopper Reading and management windows as well as item/history
windows. The full Worker run passed1992 with two stale receivers failing and
five skipped. Those two receivers now pass their ten focused tests: Reading
counts moved to the named summary; list wire DTOs require pin summaries while
write acknowledgements do not contain them. All156 UI tests and both TypeScript
projects pass after review repairs. All82 mutation anchors match. Nine semantic
mutation controls fail at their intended checkpoints, including ignored cursor
continuations and reversed tie order; mention replays still work.

The prep-pr reviews reproduced first-save and fork cache insert failures caused
by treating write DTOs as read rows. New drafts now supply known-empty pins;
existing saves preserve cached pins or obtain authoritative summaries when the
item is unloaded. Copy/share now point-loads only referenced own targets that
fall outside the loaded window. Controlled actual-handler RED/GREEN probes cover
quote/link retention, shared point demand, pending reads and HTTP failures.
Browsing history now shows loading and query failure while preserving earlier
walks and clear-action errors. Six small simplifications removed dead filters,
flags/constants, an extra subscription lookup and stale comments, and shared the
unchanged legacy pin-kind expression.

One review finding changes the implementation plan: SQLite julianday cannot
parse retained RSS date formats supported by the existing Date.parse clamp.
The actual Reading query puts a July1 RFC822 item ahead of an August1 ISO item
when both were observed August5. The RED witness is cursor-reading-dates.test.ts.
A persisted JS-normalized numeric sort key plus a resumable metadata-only upgrade
backfill preserves exact date rules and bounded reads, but all existing upgrade
paths currently run SQL migrations only. The user is choosing this recommended
new data step versus allowing timestamp metadata scans on each Reading request.
Do not publish part7 until this choice is resolved and the witness is GREEN.
Details and writer/upgrade-path inventory: b1-repair-options.md under
/tmp/blygger-api-cursor-review. The lossless review ledger is ledger.jsonl there.

The first browser snapshot confirmed the create/fork failures plus stale tests
that assumed eagerly mounted history, HTTP offset, embedded counts, old hopper
preview detail and complete Compose rows. It was stopped after190 passes and49
failures;165 were skipped or unrun, so this is not a complete result. Receiver
repairs keep their exact content/order checks and use bounded windows, named
summaries and explicit history opening. A new isolated fixed snapshot is running
all desktop/mobile cases; no full browser GREEN is claimed yet.

Part7 review followups preserved without treating them as defects: Signals may
avoid one bounded activity preload until its tab opens; unused internal offset
helpers may be removed once their remaining direct test/type consumers are
accounted for. No private HTTP offset alias remains. No merge or deploy occurred.

The user selected normalization in the existing created/updated columns. There
is no new timestamp column. Every foreign-date write now uses the existing
ISO8601 UTC normalizer; invalid or absent dates become null. A metadata-only
keyset repair processes at most100 rows per batch, writes one guarded batch,
and can resume by rerunning. It preserves versions, bodies, observation time
and read state. Source/deployment/archive upgrade paths run or document the
repair before deployment. Old updater processes require the documented explicit
command after declining their deploy prompt.

Reading order also handles canonical signed extended years, where SQLite's date
parser cannot represent the same range as JavaScript. Controlled SQL pages match
the projected clamp across that range. Ordinary UTC order and hopper membership
order retain their promised tie breaks.

The complete post-normalization Worker suite passes2028 tests with five skipped
and no failures. All156 UI tests and both type projects pass. The second full
browser run passed395 with four failures and five skipped. The four failures
were stale pin/history opening, wide-card injection using removed HTTP offset,
and a buffered-response waiter registered after the native window had already
received the fresh response. Their scoped desktop/mobile reruns pass60 plus8
cases, with four intentional phone-only skips in the former. Production polling
needed no repair. Final publication verification remains in progress.

Supplemental review caught Wrangler remote --file returning import statistics,
while local --file returns query rows. The normalizer now uses --command query
mode and validates metadata row fields. The actual CLI-boundary witness is RED
on the old path and GREEN on the same simulated remote receiving path; no live
Cloudflare database or credentials were used. The local installed-upgrade and
bundled-release checks remain separate receiving verification.

Normalization limits: batch size bounds row count rather than SQL byte count.
Unusually large retained identities/date strings can exceed a CLI/query size
limit and need a smaller-batch followup. The repair does not claim online
migration safety: writers remain drained through repair and deployment, as
already agreed for this single-user cutover.

Part7 final local checks pass at the committed release candidate: extracted
Worker/bundled normalizer, installed SDK Node/Chromium consumers, both TypeScript
resolution modes, D1/R2 fresh-process persistence, source upgrade with explicit
legacy-date repair and idempotent rerun,156 UI tests,23 SDK/policy cases, and34
normalization/order cases. Studio0.49.10, SDK0.6.0 and private contract5.0.0 are
committed. Review repairs are committed before release metadata, per prep-pr.
The loss audit has77 stable raw/context/footnote entries:26 fixed,41 already
satisfied, six duplicates and four named followups. None remain open. Full raw
reports and per-item evidence are under /tmp/blygger-api-cursor-review; the final
audit is audit-final.md. Generated reproduction and upstream publication follow.

## Part 8 implementation and review

New uploads, including unattached files, compute SHA-256 from the exact R2 bytes.
Their key is media/{id}/{sha256}.{ext}; duplicate uploads keep the existing row,
URL and revision. A legacy duplicate can therefore keep its flat URL. Serving
requires exact stored-key and digest matches before reading bytes or validating
an ETag. No media schema or private DTO shape changes.

Immutable public caching requires a durable published-version reference.
Current avatars and attachments added after the last publication can cease to
be public or can be deleted, so they revalidate. Private digest URLs remain
no-store. Legacy flat URLs and stable Studio assets revalidate. A deployed asset
bundle does not retain older fingerprinted files, so adding hashes to that
bundle would not justify an immutable promise; this series adds no such promise.

The combined parts 6 and 8 matrix reproduced an existing retention defect: discarding
a never-published draft deleted a media row used by another published post.
Discard now deletes only unretained non-avatar rows and detaches retained rows
in the same guarded transaction. Serving, explicit media deletion, and draft
discard share the historical-reference predicate. Existing object orphan cleanup
and exporter coverage for avatar-only/historical-only assets remain separate
pre-existing limits, not new API cleanup requirements.

Private API preflight now explicitly sends no-store at root and nested mounts.
The prep-pr simplifier and comprehensive/consumer reviews found no new design
decision. They found strict fresh-upload regexes and two security mutation
controls whose SQL anchors moved. Their receivers are being verified at the
same paths; legacy cache fixtures keep their old URL and no-cache expectations.
Raw reports and the append-only item ledger are in /tmp/blygger-api-media-review.

The first complete part 8 Worker run passed 2037 tests, skipped five, and failed
only the three stale contract-version checks also caught on parent PR 100. The
parent repair is pushed as1f7656c; final-source checks follow. The initial 42-case
browser receiver run passed 40 and found two mobile action timeouts. A same-path
width witness measured 792px in a 390px viewport after upload: digest URL text
widened the attachment card. Narrow wrapping of its URL/hint preserves ordinary
publish/remove clicks; no forced click or timeout waiver is used.

Preserved review limits: the existing historical-HTML reference scan can grow
with versions, and draft discard must scan for borrowed references too. A future
reference-index work item must preserve cross-item retention before replacing
that fallback. A borrowed-file publication racing its unrelated owner's deletion
before commit remains the previously accepted single-user boundary. Optional
direct restore/digest and private Bearer-CORS fixture expansion stays with
[test/media-digest.test.ts](../test/media-digest.test.ts); existing restore and
media-security suites still cover those underlying paths. Migration0028's NULL
hash comment describes old rows; no migration is rewritten. The local getMedia
intersection supplies hash metadata without broadening public row DTOs.


PR 100 publication CI caught a stale mount receiver after the native contract bump:
capabilities correctly advertised 5.0.0, while the root/nested mount test still
required 4.0.0. The isolated parent repair updates that strict expectation only.
All four mount/audience cases are GREEN after same-path RED on the published
head. Future contract bumps must rerun version-sensitive receivers after metadata
changes; a pre-bump full suite is not evidence for the final release metadata.

Final part 8 receiving checks pass 108 Worker/SDK/MCP cases, all 162 UI cases,
both type projects, and 44 desktop/mobile browser cases with no skips or flakes.
The 12-case digest matrix includes borrowed draft retention, draft-owned avatar
retention, transient-public attachment deletion, and legacy known-hash duplicates.
Both adapted withdrawal mutation controls run a passing baseline and catch the
intended semantic regression. The first candidate's quoting error was rejected
by the harness and is not counted as mutation sensitivity. All 82 mutation anchors
match. SDK/OpenAPI regeneration reproduces with no drift.

Review fixes are committed as 5fdb972, followed by merge 44436e1 of the parent's
isolated CI repair. The merge resolves only a journal append conflict and keeps
both learning notes. Studio advances to 0.49.11 using the repository's native
version/changelog flow. SDK 0.6.0 and private contract 5.0.0 remain unchanged because
this part changes no private payload schema. No new migration is needed.

Part 8 is published as [PR 101](https://github.com/blygger/blygger-studio/pull/101),
stacked on repaired parent PR 100. All planned implementation parts now have PRs.
Final 0.49.11 release checks pass: extracted Worker/checksums, bundled normalizer,
installed Node and Chromium SDK consumers, both TypeScript resolution modes,
and D1/R2 persistence across fresh processes. The version-sensitive mount
receiver passes all four cases after release metadata changes. No generated
schema drift or migration is introduced by this part.

The loss audit has 71 raw findings/context/footnotes: 14 fixed, 43 already satisfied,
eight duplicates and six named followups. None are open or await a design
decision. Full raw reports, evidence links and per-item dispositions are in
/tmp/blygger-api-media-review/audit-final.md and ledger.jsonl. The CI heartbeat
now watches all ten published heads and all reviews. Earlier eight heads were
green at the latest audit; PR 100 reruns after the strict-version fixture repair,
and PR 101 starts final CI. No PR has been merged or deployment run.

PR 100's next CI run exposed a browser-oracle timing gap: two rendering frames
can finish before a local missing image raises its error event. An unsafe
legacy-navigation mutant therefore survived the negative assertion in CI. The
unchanged local control caught it, confirming that the event timing mattered.
The test now explicitly dispatches the DOM error before checking attempted
owner-authority calls. Its safe baseline passes and the same unsafe control
reaches the named assertion. Test-only parent repair 7ff584d is included in the
final media branch. The two publication CI items are fixed in the separate
/tmp/blygger-api-review-evaluation ledger. The plan and production behavior do
not change. CI restarts at the new published heads.

The next full browser run found two receiving-test gaps. The buffered polling
waiter read every item-list response as a page, including expected 409
cursor-expired errors. It could also hold a continuation or native boundary
read rather than the intended first page. A fixture now inserts 30 older rows
in the disposable database, so the case always reaches cursor continuations
without depending on previous tests or placing filler beside the live markers.
The gate verifies the unfiltered first page and correlates its exact request.
Both markers must appear by the next poll. One-step clock advances avoid
simulating every intervening animation frame; the 30-second timeout remains.
The separate pre-fetch generation oracle still passes all 17 cases.

The hopper parity trace's four preview requests all came from Compose while
login finished. The observer now starts after that document exits. It still
observes the hopper before navigation, and an injected hopper preview fails
the exact no-preview assertion. This is document isolation, not a preview
allowlist or a retry waiver.

All 10 desktop/mobile polling and hopper receivers pass without skips, retries,
or flakes. Both type projects pass after SDK generation completes. Parent
repair 90037fd is merged into the final media branch. These two additional CI
findings have fixed dispositions in /tmp/blygger-api-review-evaluation/ledger.jsonl,
with raw logs, trace evidence, deterministic RED/GREEN, and a collateral negative
control. Production source and the API plan do not change. Full upstream CI
restarts at the new heads; no merge or deploy occurred.


## Published source CI complete — 2026-11-01 00:37 UTC

All ten published source heads pass all nine upstream CI jobs. The complete
review submissions and inline review threads are empty, with no pagination left
unread. All local review findings have dispositions; the four publication CI
findings are fixed. No new design decision remains. PRs remain open and no
deployment has run.

| PR | Verified source head |
| --- | --- |
| 90 | `0d46c5cb060fa5fa0bf1184f6a9ed3bdbdf6e2d5` |
| 91 | `9eed3a4c819e44c3682afe0538c7ad452b0f61bc` |
| 93 | `694664ecabf960054706d181f4a0d4d8105939a6` |
| 95 | `2dfca6efc519576b0e4719ca732c748a9a5a093a` |
| 96 | `623a413549f09fc4915d834b6a58d663d936fe24` |
| 97 | `6a7ff1504533afee634941303aaad835ef5920e0` |
| 98 | `0e65c599d114dfc0b48fde38cf891b7b242226a6` |
| 99 | `9448c4cfd4110d65d8ddf3d118557addcab2f022` |
| 100 | `90037fd49fbc6ceee9858decfb860e8484188587` |
| 101 | `5cc55679e6905b180e3df374554bb64e549624b9` |

The lossless final snapshot is
/tmp/blygger-api-review-evaluation/stack-api-source-complete.json. The publication
CI audit is ci-api-publication-audit.md in that directory; the part 7 and part 8
local audits remain in /tmp/blygger-api-cursor-review and
/tmp/blygger-api-media-review. This receipt changes documentation only. The
monitor will stop after its published documentation head passes CI too; that
final receipt is kept in the scratch audit to avoid another documentation run.
