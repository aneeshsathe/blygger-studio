# Bounded feed and Studio controls

`Feed.*` and `Studio.*` check the frozen candidate in `design-specimen-v1.md`. The working
design in `docs/d1-polling-cache-design.md` now incorporates the review fixes;
new lifecycle and receiving-test obligations are not additional model results. They do
not model the installed application or prove Cloudflare behavior. The safe
feed assumes a replacement token bound to the source generation: revision-bearing
XML or a revision-bearing manifest (R7). A plain body ETag cannot supply that
premise when the revision exists only in custom metadata.

## Grammar trace

| Candidate | Formal representation and boundary |
| --- | --- |
| M1, R1, P2–P3 | `Feed.source` is a committed source generation; `revision` is its trigger counter. `Mutate` changes both atomically when `CompleteTrigger` is true. One domain and one tracked effect replace the real table/column matrix. |
| M2 | Complete dependencies are an assumption, exposed by `CompleteTrigger`. The missing-trigger mutant checks that assumption's necessity, not the real matrix's completeness. Separate SQLite probes in this directory inspect concrete source effects. |
| M3, R2–R3, P4 | `Studio.applied` and `installed` are separate per-view revisions. Two views poll and apply independently; one serialized attempt per view. `Poll` captures target before `Load`; successful load chooses a revision at least target, assuming an authoritative/session read. `Ack` installs that result and acknowledges only target. |
| M4, R4–R7, P6 | Saved `artifact` stores full two-field payload, rendering commit, source revision and replacement token. Legal bytes are `<<r % 2, r % 2>>`; generations 0 and 2 legitimately have identical payloads. Generation tokens use revision; plain body tokens use the repeated payload value. This is an ABA example, not a hash collision. |
| M5, R3/R5/R6, P7 | Each feed attempt captures before-render revision, commit and expected artifact token. Two fields are read in separate actions. Validation rejects changed revision intervals. `Preflight` samples artifact revision; `Publish` performs only the token comparison atomically with replacement. Failures keep the artifact; a bounded later retry is enabled. Studio failure leaves installed/applied data unchanged and permits another poll. |
| M6, R4/R8, P5/P10 | Separate check, load/render, service and trigger-write observations saturate at 3. They distinguish kinds of work and preserve finite state; they are not exact cost or billing counters. Unchanged checks skip loads/renders. Two feed builders may duplicate render work. |
| P1/P8/P9 | Cadence, visibility, authentication, optimistic edits, epoch and renderer identity are outside these models. They remain candidate obligations. |

Feed requests serve the saved object immediately and schedule a check, including
conditional requests. Saved bytes can be stale throughout a build or failure.
There is no invariant requiring current source freshness. `LegalArtifact` checks
the payload against the recorded rendering commit; `NoRegression` records whether
a successful replacement ever lowered stored revision. `Triggered` checks atomic
revision coverage. `ConditionalRevalidation` checks scheduling even for 304 paths.
`StoredRevisionSound` keeps source revision distinct from payload equality.

Studio's `AppliedIsInstalled` checks that acknowledgment never outruns installed
data. `InstalledIsSource` checks that installed data is an available source
generation. Failed loads remain dirty through the same inequalities and the
retryable `Poll` transition. No temporal completion property is asserted.

## Final runs

TLC2 2.19, 08 August 2024, revision `5a47802`; image `field-lab-tlc:local`, Java
Eclipse Adoptium 21.0.12. Each run uses source revisions 0–3, two feed clients or
two Studio views. Feed clients each issue one modeled request and may capture
at most two build attempts. Complete raw logs include all counterexample states,
checker seed, fingerprint setting, exit code and counts.

| Config | Result / invariant | Generated | Distinct | Trace depth |
| --- | --- | ---: | ---: | ---: |
| `FeedSafe.cfg` | Pass | 168,788 | 57,772 | 26 |
| `FeedGenerationCASOnly.cfg` | Pass, preflight revision guard removed | 169,076 | 57,900 | 26 |
| `FeedOldOverwrite.cfg` | `NoRegression` violated | 99,091 | 38,104 | 17 |
| `FeedMixedRender.cfg` | `LegalPayload` violated | 4,456 | 2,502 | 10 |
| `FeedETagABA.cfg` | `NoRegression` violated | 98,943 | 37,922 | 17 |
| `FeedMissingTrigger.cfg` | `Triggered` violated | 2 | 2 | 2 |
| `FeedConditionalSkip.cfg` | `ConditionalRevalidation` violated | 4 | 4 | 2 |
| `StudioSafe.cfg` | Pass | 18,802 | 6,501 | 16 |
| `StudioLatestAck.cfg` | `AppliedIsInstalled` violated | 119 | 93 | 6 |
| `StudioFailedAck.cfg` | `AppliedIsInstalled` violated | 47 | 40 | 5 |

Counterexample interpretation:

- Old overwrite: builder A renders revision 1 and preflights stored revision 0.
  Builder B renders and publishes revision 2. A publishes 1 after B when the
  conditional token guard is removed, despite A's earlier revision preflight.
- Mixed render: A reads first field at revision 1, source commits revision 2,
  A reads second field there and publishes `<<1,0>>` after interval validation is
  disabled. No legal source generation contains those bytes. This config checks
  `LegalPayload` instead of the stricter `LegalArtifact` so the trace exposes
  actual mixed bytes; otherwise TLC first finds a shorter wrong-label trace.
- ETag ABA: A captures expected body token 0, renders revision 1, and preflights
  artifact revision 0. B publishes revision 2 whose body `<<0,0>>` legitimately
  equals the initial body. Its token remains 0. A's conditional token comparison
  now succeeds and lowers stored revision from 2 to 1. The preflight revision
  check is retained; its separate read does not close the race.
- Missing trigger: first relevant source commit leaves revision 0. This is a
  controlled assumption failure, not evidence that a particular SQL migration
  is complete.
- Conditional skip: a conditional request is served and finishes without
  scheduling its source check.
- Latest acknowledgment: target 1 is loaded successfully as generation 1;
  acknowledgment samples source 2 and sets applied 2 while installed remains 1.
- Failed acknowledgment: target 1 fails to load; applied becomes 1 while
  installed remains 0.

All weakening failures are candidate-rule necessity controls. The ETag-only
sketch is unsafe within this boundary. The repaired generation-token candidate
has no violation within the explored states. A hypothetical atomic metadata
revision guard is not a modeled provider capability or a proposed implementation.

## Receipts and corrections

`logs/*-encoding-v1.log` and `logs/Feed-encoding-v1.tla` preserve the first feed
encoding. Two diagnostic assignments lacked parentheses around a disjunction.
TLA+ parsed equality before OR, allowing an unassigned primed variable when the
OR branch became true. TLC reported successor-state encoding errors in the old
overwrite, ETag ABA and conditional-skip controls. These are not safety findings.
The corrected model parenthesizes each whole assigned expression and reruns all
feed configs. The first version also put a revision check inside atomic publication;
the final version separates `Preflight` from token-only `Publish` to match R2's
available operation. The obsolete body-token-with-atomic-revision-guard pass is
retained as an encoding receipt and excluded from final results.

`logs/Studio*-before-unchanged-polls.log` preserve the first Studio runs. The final
Studio model adds unchanged polling as an explicit revision check that skips the
load. This changed state counts but not the two mutant findings.

`logs/docker-initial-error.log` records the initial Docker API 1.54 HTTP 500
failure. Runs succeeded with `DOCKER_API_VERSION=1.44`. No model-state files,
host sockets, credentials or credential directories were mounted into containers.

To reproduce a final run from the host:

```sh
DOCKER_API_VERSION=1.44 docker run --rm \
  --volume /Users/kylemathews/programs/blygger-studio/models/d1-polling-cache:/work:ro \
  field-lab-tlc:local -metadir /tmp/tlc -config FeedSafe.cfg Feed
```

Use the matching config and module for each table row. Host Docker access needs
scoped sandbox escalation. The model mount is read-only; TLC state lives in
container `/tmp`. Deadlock checks are disabled because bounded terminal attempts
are deliberate. `[][Next]_vars` permits stuttering and there is no fairness.

## Limits

### Concrete trigger prototype

`trigger_probe.py` applies all current repository migrations to an in-memory
SQLite database and creates 27 candidate row triggers. `trigger-prototype.sql`
is a generated test specimen, **not a production migration**. Independent
expected-domain sets check named direct SQL effects; `trigger-probe.json`
preserves 24 receipts. Run with `python3 models/d1-polling-cache/trigger_probe.py`.

The probe checks no-op updates, NULL transitions, unchanged item timestamps,
old-dated imports, diagnostic-only polls, provenance changes, direct HTML
repair, withdrawal, deletes, OLD/NEW setting keys and transaction rollback.
A missing-delete trigger fails the expected-domain comparison. A missing fixed
state row reproduces silent untracked changes; one fail-closed guard repairs
that specific witness, without establishing all-table coverage. Initial fixture
setup failure is retained in `trigger-encoding-error.txt`.

100 source imports cause 100 counter-row updates (200 SQLite total changes).
This is a write-amplification observation, not D1 billing metadata. The prototype
intentionally over-tracks some changes and does not establish the complete
dependency map, installed application path or actual Cloudflare trigger behavior.

### Formal boundary

The initial feed artifact already exists and is legal. Cold start, missing objects,
epoch/reset, renderer changes, withdrawal exceptions, mount/unmount, SQL rollback,
counter overflow, real query payloads and provider read/bookmark mechanics are
outside the boundary. Source generation is a single monotonic sequence. Studio
loads are abstract authoritative results, not the existing refetch machinery.
Dependency completeness is assumed; actual trigger SQL needs its own audit.

Two clients, three source mutations and bounded feed attempts are deliberate
losses of scale. Saturated work counters do not establish a numerical work bound.
There is no cross-isolate single flight, lease, maximum stale time, unconditional
liveness, eventual retry after traffic stops, billing proof, or deployed D1/R2
proof. Further requests, fairness and provider success are not silently assumed.

## Query Collection revision (design v3)

`StudioQuery.tla` replaces the application-cursor boundary for current Studio
code. The old `Studio.tla` remains a frozen historical control, not the current
Query Collection implementation. A query samples a primary source revision,
returns its exact-key cached response on a match, or reads source data and
returns it with the pre-fetch label. TanStack Query accepts the response and
label together. Failure/cancellation leaves the prior cache intact. Query
Collection can publish the fetched response later; `published` can lag `cached`.
There is no application cursor claiming that publication has finished.

`CacheLabelSound` requires the label not to outrun fetched data.
`CachedIsSource` bounds fetched data by source history.
`PublishedMayLagCache` permits adapter publication to lag an accepted fetch.
`NoStaleHit` records whether a fast path ever returned obsolete source data.
Exact keys represent independently cached subsets or collections. Local edits,
epoch reset, on-demand ownership and API authorization remain receiving-test
boundaries. No unconditional liveness or publication deadline is asserted.

Final TLC 2.19 runs use source revisions 0–3, two queries, saturating work counts,
and the same image/Java as the prior runs. Docker now reports API 1.54, so these
runs use its default API. Logs retain checker seeds and complete counterexamples.

| Config | Result | Generated | Distinct |
| --- | --- | ---: | ---: |
| `StudioQuerySafe.cfg` | Pass, all four invariants | 892740 | 193602 |
| `StudioQueryLatest.cfg` | `CacheLabelSound` violated | 130 | 96 |
| `StudioQueryFailure.cfg` | `CacheLabelSound` violated | 92 | 73 |
| `StudioQueryStaleHit.cfg` | `NoStaleHit` violated | 451 | 285 |

The latest-label witness loads revision 1, then source advances to 2 before
acceptance: labelling old data 2 breaks the bound. The failed-label witness
advances a label without accepting new data. The stale-hit witness ignores a
changed revision and returns prior cached data. Receiving mutations now target
the corresponding query function boundaries, rather than the removed poller.

`StudioQueryStaleHit-encoding-error.log` is a setup failure: an unparenthesized
boolean assignment let TLC treat an OR branch as an alternative action that
left `badHit` unspecified. Parenthesizing the assigned expression repairs the
model. Only the final invariant failure counts as a semantic control.
`StudioQueryDockerError.log` records the obsolete API override failing before
TLC started. It is not a model outcome.

```sh
docker run --rm \
  --volume /Users/kylemathews/programs/blygger-studio/models/d1-polling-cache:/work:ro \
  field-lab-tlc:local -metadir /tmp/tlc -config StudioQuerySafe.cfg StudioQuery
```


## Proactive feed cron

`FeedCron.tla` extends `Feed.tla` with at most two internal HEAD ticks. A tick
starts a revision check when its slot is idle/completed/failed. Active SWR work
is joined without advancing its source token. Once that job ends, another tick
can detect the still-newer source counter. No extra fresh-check queue is part
of the current implementation. The earlier queued variant is retained in Git
history at commit `9330026`, not as a current obligation.

`TimerSchedulesCheck` rejects a tick skipping its revision check on an idle
slot. `TimerDoesNotServe` distinguishes internal calls from external HTTP
service. Original legal-artifact, complete-trigger and generation-CAS safety
premises remain.

| Config | Result | Generated | Distinct |
| --- | --- | ---: | ---: |
| `FeedCronSafe.cfg` | Pass, all seven invariants | 2296440 | 624863 |
| `FeedCronServes.cfg` | `TimerDoesNotServe` violated | 103 | 69 |
| `FeedCronMixed.cfg` | `LegalArtifact` violated | 19270 | 8293 |
| `FeedCronNoCheck.cfg` | `TimerSchedulesCheck` violated | 7 | 7 |

Raw final runs live in `logs/FeedCron*.log`. Use the existing Docker command
with `-config FeedCronSafe.cfg FeedCron`; `--network none` is sufficient because
TLC reads only local model files. Container-create errors and an initial Boolean
precedence error in the no-check control were setup failures, not semantic kills.

The model assumes a configured canonical URL and an existing legal artifact.
It does not encode actual minute delivery, canonical lookup, cold objects,
epochs, provider uptime or a staleness deadline. Native scheduled tests receive
those configuration/cold-cache boundaries, internal HEAD/SWR handoff, next-tick
retry and daily maintenance dispatch. The unchanged tick must make only the
site/revision reads. These local observations do not establish deployed billing.
