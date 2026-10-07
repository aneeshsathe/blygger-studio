# Polling/cache oracle and loss audit

Contract: [working design v3](d1-polling-cache-design.md). This record owns the
loss comparison and receiving boundary; it does not claim deployed-provider
proof, maximum stale age, global single-flight or actual quota capacity.

The original reduction ledgers below preserve the TLA+ and SQLite comparison.
The current Query Collection audit supersedes the former publication-cursor
implementation. Historical review prose remains in Git history.

## Frozen reduction and source isolation

The first oracle draft was frozen before production implementation:

| File | SHA-256 |
| --- | --- |
| `test/polling-cache.oracle.test.ts` | `820ab3d5642b2d1bbf0499a11249f3c502bfe11b8fbe8b3642aef62a80c2e050` |
| `test/polling-cache-oracle-model.ts` | `531d0bcdf1b13309355a6ba70b1a2dbf7f2917aa2c08b9ea38fc0bbc7a941584` |
| `test-ui/polling-cache.oracle.test.ts` | `671ce66b1ba9f0b66aeb2d8290fc9fe27b20f1ee5a21e738da3bdb8fa4322539` |

Fresh scanners separately read the TLA+ final models/receipts and the SQLite
prototype/receipts. Each saw the frozen reduction, without the sibling source.
The drop rules below describe the observed reduction, not author intent. The
user separately authorized fixing recovered gaps and implementing the design.

## TLA+ loss ledger

| ID | Supported source observation | Where the reduction lost it | Receiving repair |
| --- | --- | --- | --- |
| T1 | `LegalArtifact`/`StoredRevisionSound`: bytes tied to stored generation | History membership collapsed commit/revision/payload | Reference generation map; inspect saved metadata and parsed payload |
| T2 | Sticky `NoRegression`, including repeated values at revisions 1/3 | Final A/ETag sample hid same-valued regression | Same-valued competing builders; exact saved-generation comparison |
| T3 | Atomic source/revision monotonic movement | Changed-domain names replaced upward counter movement | Check increasing expected counters; retain rollback and no-op comparisons |
| T4 | Load may install newer than pre-load target | One race only returned target-equal data | Newer receiving load still requires subsequent target check/refresh |
| T5 | `InstalledIsSource` upper bound | Reference reused observed installed value | Independent source upper-bound control and generated expected installation |
| T6 | Failure can occur at any build stage; artifact unchanged | Only put failure and eventual repair observed | Content-read and put failure; inspect saved bytes/token immediately |
| T7 | Distinct work observations | Batch collapsed to one string, put proxy stood in for rendering | Record batch statements individually; exact allowed unchanged revision query; trigger-write witness |

Retained: mixed-render rejection, old-overwrite/ABA schedule, conditional 304
revalidation, unchanged Studio check/load distinction, target-equal
acknowledgment, independent failed views, later retries. No lost guarantee for
global duplicate suppression, bounded staleness or liveness: the source does
not assert them. Preflight omission is not a loss because generation-CAS-only
also passes. Epoch/auth/visibility/cold/SQL coverage are extensions beyond TLA.

## SQLite loss ledger: all 24 receipts

| Receipt | Frozen result / dropped rule | Receiving repair or retained distinction |
| --- | --- | --- |
| 1 draft INSERT | Setup replaced event | Items family INSERT checkpoint |
| 2 publish state | Started public | Items family status/version transition |
| 3 unchanged-timestamp draft edit | Retained, tighter domains | Items only; excludes unnecessary Reading invalidation |
| 4 no-op UPDATE | Retained | Empty changed-domain set |
| 5 subscription INSERT | Retained | Exact four-domain set |
| 6 diagnostic poll write | Retained direct SQL | Subscriptions only; not a real HTTP-304 importer claim |
| 7 NULL to ETag | Non-null diagnostic representative | Explicit nullable forward transition |
| 8 ETag to NULL | Same compression | Explicit reverse transition |
| 9 provenance title rename | Retained | Subscriptions/Reading/hoppers/feed |
| 10 old-dated import | Retained | Arrival unrelated to remote time |
| 11 direct HTML repair | Retained direct SQL | Reading/hoppers, not feed |
| 12 imported kind/page update | INSERT/body/delete omitted metadata branch | Explicit metadata UPDATE plus family coverage |
| 13 version INSERT | Setup replaced domain observation | Versions INSERT/UPDATE/DELETE family |
| 14 feed setting INSERT | Setup replaced domain observation | Settings family with feed-relevant key |
| 15 non-feed update setting | Exclusion omitted | Settings-only update_checked_at INSERT |
| 16 OLD/NEW key move | Fixed keys replaced identities | Rename feed key out and back in |
| 17 withdrawal | Body edits replaced lifecycle | Direct status/kind/version withdrawal |
| 18 imported DELETE | Retained | Exact three-domain set |
| 19 rollback source and revisions | Source observation omitted | Check reverted title as well as counters |
| 20 security non-effect | Different authentication law substituted | Direct budget write leaves all content tokens unchanged |
| 21 missing singleton gap | Settings substituted for subscription | Nine families × INSERT/UPDATE/DELETE fail-closed tests |
| 22 one-table repair limit | Per-effect limit lost | Same all-family missing-state coverage, not one repair hook |
| 23 missing items-delete calibration | Synthetic arrays replaced receiving path | Drop actual delete trigger, execute DELETE, require named domain failure |
| 24 100-row amplification | Statement counts replaced row writes | 100-row receiving total_changes/counter witness; not deployed billing |

Additional SQL-source scope: nine tables × three events now have receiving
fixtures. Current columns must appear in null-safe update guards. Explicit
OLD/NEW key and nullable checks distinguish plausible wrong boundaries. Feed
field classification still requires response dependency evidence; copying
conservative prototype domains is not independent product judgment. Historical
fixture encoding failure is classified as setup failure, not a semantic kill.

## Oracle guide boundary

The reference imports no production classifier, cursor reducer, renderer or
trigger. Driver helpers may use production routes and native bindings. The
source/installed/applied/artifact distinctions are justified by the recovered
histories; expected installed values are derived from source history, not copied
from the observed result. XML parser supplies observation only.

The TLA+ models are abstract controls; local Cloudflare workerd and native
D1/R2 bindings receive concrete transaction/conditional-write premises. Those
local witnesses do not establish deployed Cloudflare lifetime, billing or
distribution. No production connection or deployment is authorized or needed
for this implementation stage. Implementation must pass the receiving suite;
final execution and numbered ORC outcomes are recorded at closeout.

## Current Query Collection audit (v3)

Authority: the user requires ordinary Query Collection configs whose `queryFn`
fetches changed data or returns its existing cached response. The poller is
restored to upstream and the publication wrapper is deleted. There is no
application cursor, `_state` access, query-update counter, collection registry,
or second revision-query cache. Each invocation checks D1 afresh and uses the
exact Query key's `{ data, generation }` response. `select` materializes rows.

This changes the Studio contract, rather than merely renaming the former
`applied` variable. Fetched cache state can lead adapter publication. The old
TLA+ Studio model and loss rows T4/T5 remain historical; `StudioQuery.tla` now
protects the pre-fetch cache label and accepted response. The distinction
between fetched state and published state is explicit, not a new app-level
acknowledgment algorithm. Original feed and SQL trigger premises are unchanged.

| Guide requirement | Current Studio outcome / evidence |
| --- | --- |
| ORC-001 | Pass within v3: user-approved queryFn cache boundary and design v3. No publication deadline or atomic pagination claim. |
| ORC-002 | Pass: scalar source histories and `StudioQueryReference` predict work/data separately from Query cache and adapter. The revision-match rule is the explicit contract. The reference uses no production imports. |
| ORC-003 | Pass: oracle header names contract, reference, serial grammar, real Query/Collection driver and cache/public-value checks. |
| ORC-004 | Pass in declared serial grammar: 1–20 write/poll/fail/restore/evict actions plus final poll. Examples reconstruct each axis. Dropping write loses invalidation, fail loses retry, restore loses equal-counter epochs, evict loses empty-cache reload, and poll loses observation. Unknown actions/empty supplied histories are excluded. Controlled races and subset ownership are fixed receiving witnesses, not generated claims. |
| ORC-005 | Pass: actual Query Collection queryFns run the production cache-read helper. Cached envelopes, content-load counts, real collection rows and browser requests are observed. |
| ORC-006 | Pass: post-fetch-label, premature failed-label and stale cache-hit controls target the queryFn. Existing five feed controls remain. Model controls reject those three wrong cache designs. Encoding/setup failures are recorded separately. |
| ORC-007 | Pass: fixed seed 20261001 and random lanes share a 50-history budget. Direct UI replay runs the same property. The generated stale-hit mutant captures and replays its seed/shrink path, in addition to the feed replay. No command replayPath applies. |
| ORC-008 | Pass: label vs fetched payload differs during a racing source write; cached vs published differs during local persistence. Present/absent differs on eviction. Epoch differs on counter reuse. One unchanged cached response needs no separate application cursor. |
| ORC-009 | Pass: `label` maps to cached generation, `cached` to accepted response, and `published` to adapter materialization. Old `applied` terminology does not describe current code. |
| ORC-010 | Pass: withOracleCleanup preserves initial mismatch and every cleanup failure. Held reads release and canceled promises receive rejection handlers. Mutation parsing normalizes terminal formatting without weakening checkpoint detection. |
| ORC-011 | Pass: model/TLA and actual adapter distinguish shared-fault hypotheses of latest-token stamping, premature failure stamping, cached-hit counter omission and fetch/publication conflation. A receiving mutation test rejects reuse of a pre-write revision check. |
| ORC-012 | Pass: this versioned delta names all guide outcomes and retains the original loss ledger. No blanket closure claim extends to deployed lifetime, arbitrary pagination snapshots or bounded publication delay. |
| ORC-013 | Pass for retained laws: equal vs changed revision, changed epoch with equal counter, empty cache after eviction, failed/canceled response, source advancing during load, and one-vs-last subset owner all have distinguishing receiving witnesses. |
| ORC-014 | Pass within local receiving scope: real QueryClient and Query Collection supply cancellation, mutation refetch and on-demand ownership behavior. Desktop/mobile HTTP buffering supplies the old-response premise. Server trigger and primary-read premises retain native local D1 evidence. Deployment behavior remains outside these claims. |

The overlapping subset witness now includes a row owned by both queries. It
survives one owner's empty result and disappears after the last owner releases
it. The post-write witness holds an old revision check while mutation refetch
makes a fresh one. Ordinary adapter cancellation prevents the late old result
from replacing the accepted new response.

TLC checks 193602 distinct safe states, with delayed publication permitted.
Latest-label and failed-label controls violate `CacheLabelSound`; ignoring a
changed revision violates `NoStaleHit`. An earlier malformed hostile action is
an encoding/setup failure, not a semantic kill. Final logs and model mapping
live in `models/d1-polling-cache/README.md`.

The nine existing desktop SPA regressions passed for the Query Collection
correction: create/edit/publish, failed-save rollback, editor-safe polling,
paginated Reading, route preload/cache reuse, requested-page reload, settings,
item retry and navigation-save flushing. Current receipts appear below.

## External review receiving checks (2026-10-05)

The concurrent-winner cold path returned 500 after three invalidated renders,
even though another builder had saved a valid same-key artifact. The same
controlled native D1/R2 history now returns 200 with the saved source facts.
An artifact with invalid generation metadata still fails. This fallback serves
existing legal bytes under SWR; it neither publishes mixed source data nor
establishes unconditional cold availability. The feed model's saved-snapshot
safety still applies; its bounded attempts never proved temporal completion.

The feed revision reader accepted a native blob epoch that the Studio reader
rejected. Its type guard now matches, with a receiving regression for SQLite's
permissive TEXT affinity. The unused Reading refresh argument and obsolete
comment are removed. Released Reading subsets have a new adapter receiving
check: after loading three pages and releasing two, a revision bump fetches only
the remaining page. Existing shared-row and active-subset tests remain.

Reviewed implementation: `bda9ec8b20acb52c1cae2edc62a5d3c5539f5040`.

Review receipts: all 78 cache-oracle tests, 40 UI tests, six desktop/mobile cache
browser checks and eight semantic mutation controls pass. Type checks and the
SDK/SPA build pass. The full Worker run passed the other 120 files; its only
failure was a nonexistent fixture column in the new boolean meta.changes probe.
After correcting that setup error, all 78 cache cases pass. This gives 1347
passing Worker cases and five skipped cases across the full run and focused
rerun, rather than claiming an entirely green single full run. The native
boolean probe confirms trigger changes preserve zero/nonzero observations.
An initial parallel type check raced the SDK build's generated output; the
ordered type check after build passes. Neither setup failure is a semantic kill.

Unrelated source writes really can advance feed revision while visible XML stays
identical. Revision-outage fallback, tighter feed dependencies and public ETag
semantics remain design choices. Unbounded SWR, metadata-only R2 reads and old
version-object retention remain named follow-ups in the operations guide. No
policy change is implied by these receiving fixes.


## Proactive cron and maintenance (2026-10-06)

The selected plan adds a feed-only minute tick. The fifteen-minute tick retains
subscription due-selection and outbound retries. A separate midnight-UTC tick
owns legacy imported-URL repair and failed inbound-mention pruning. Owner API,
MCP, Query Collection and individual write handlers need no new rebuild calls.
Canonical site URL supplies the origin unavailable to scheduled events; missing
or invalid configuration keeps request-driven rebuilding. Alias caches retain
request-driven checks. No stale-age deadline or exact cron delivery is promised.

Native RED probes showed that the old scheduled handler never built cold XML,
did subscription work for a feed-only event, repaired legacy URLs every fifteen
minutes and polled subscriptions on a proposed maintenance event. The same
histories are GREEN after separating the jobs. The unchanged minute tick reads
only site URL and feed revision, with no render/put. Cold/changed builds finish
before a reader arrives; failures preserve saved XML and the next tick retries.
The daily event still performs the existing bounded URL repair and claim prune.

The minute tick uses `cachedFeed` with an internal HEAD request, forwarding
background work to the scheduled context. It shares the reader's SWR and local
coalescing rules. A tick joining an older render can retain its legal saved
generation; the next tick detects the remaining source difference. The native
handoff holds an actual R2 PUT, commits a newer state, and gates on the HEAD
handler's pending-job binding access. It observes the older saved artifact,
then the next tick's newer one. This intentionally replaces the earlier
extra-fresh-check warming design recorded in commit `9330026`.

Nine semantic controls include HEAD incorrectly skipping its revision check;
that fault must fail at `scheduled feed changed XML`. Feed/Studio replay
receipts retain seed `20261001` and paths `0:0` / `0:1:0:0:2`. The original
strict-warming control and queued-timer model are historical evidence in Git,
not current guarantees. Earlier fixture observer/setup failures are excluded
from semantic evidence.

`FeedCron.tla` now models internal HEAD ticks starting checks on idle/completed
slots and joining active SWR attempts without changing their captured tokens.
The source counter remains ahead of an older artifact, permitting a later tick
to detect that change. The current model retains the original feed safety laws
and bodyless-timer work law; its final counts and controls are recorded beside
its source: 624,863 safe states, with disabled timer checks, external service
and unstable rendering controls rejected. No fresh-at-every-tick or staleness
deadline is asserted.

The full Worker suite passes 121 files, 1354 cases with 5 skipped. The final native
cache file passes all 85 cases after the HEAD handoff and next-tick scope were received. Types,
SDK/SPA build and template checks pass. These extend local value/work evidence;
canonical URL lookup, cold objects and actual provider handoffs remain native
receiving boundaries rather than invented formal guarantees. SQLite trigger
behavior is unchanged and its earlier loss ledger/receiving cases remain intact.
