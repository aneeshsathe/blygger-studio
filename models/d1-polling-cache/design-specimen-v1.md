# Trigger revisions, Studio change checks, and R2 feed revalidation

Design specimen v1, 2026-10-05, upstream `f32519b`. This is a design and stress
test artifact, not an installed migration or production cache. It replaces the
scope of the earlier general cache coordinator, not its files or implementation.

## Source and success standard

The user wants the existing polling speed, less D1 work, and little change at
application write points. The selected narrow surfaces are Studio polling and
`feed.xml`. The user accepts stale-while-revalidate for XML. No maximum stale
age or withdrawal exception has been selected.

The prior conversational sketch serves saved XML, performs a cheap revision
check in the background, and rebuilds only when necessary. It proposes triggers
for change tracking and conditional R2 writes for overlapping builds. It does
not yet specify complete dependencies, cursor acknowledgment, rebuild claim,
provider consistency, or whether the conditional token covers metadata.

Current source:

- `src/ui/polling.ts`: mounted views refresh every 15 seconds; hidden tabs pause.
- `src/ui/data.ts`: list collections refetch all pages. Existing local optimistic
  edits and query collection behavior must remain intact.
- `src/reading-data.ts`: Reading loads all identities for ordering and counts.
- `src/api.ts:148-160`: working-copy edits need not change `items.updated`.
- `src/protocol.ts:217-346`: XML includes current published item content,
  publication events, media, settings, and quote provenance.
- `src/public-feed.ts:82-112`: provenance also reads subscription origin/title
  and imported kind/page, not just published own items.
- `src/importer/store.ts:73-104`: unchanged imports still change poll diagnostics.
- `src/owner-api.ts`: authentication/admission precede private handlers.

## Provisional preservation contract

P1 user-required: keep Studio's 15-second cadence and hidden-tab behavior.
P2 user-required: record ordinary content changes without adding invalidation
calls at every write site. SQL migrations and reader/client code still change.
P3 source-established: inserts, edits, withdrawals and deletes remain visible;
unchanged item timestamps cannot be used as a complete change cursor.
P4 proposed: a Studio cursor means successfully installed local data through
that revision, not merely a revision that the server has reported.
P5 proposed: warm unchanged Studio polls skip watched collection SQL; cached
XML responses do not wait for a full render. Cheap checks remain D1 work.
P6 user-accepted: saved XML may be older than D1 while revalidation runs. It must
be a legal complete rendering; successful older builds cannot replace newer ones.
P7 proposed: failed refreshes/builds remain dirty and retryable. No unconditional
eventual completion or bounded stale age is claimed.
P8 source-established: current private authentication/admission and optimistic
draft protections remain. No cached credential decisions are introduced.
P9 proposed: identity includes database epoch, deployment/origin/mount and
renderer/schema version. Restore/reset must not silently reuse old cursors.
P10 limit: a formal or SQLite fixture is not a deployed Cloudflare proof, actual
billed-row measurement, complete trigger matrix, or global single-flight proof.

## Minimal candidate grammar

M1 committed source and revision vector: fixed `change_state` row with an epoch
and counters for affected data domains, including the XML domain. Triggers
advance appropriate counters in the same transaction as actual row changes.
One trigger may advance several counters in one UPDATE. No append-only journal
is needed for change detection plus full refresh; that would be a later delta
sync feature. Counter movement is per relevant row effect, not per user command.

M2 dependency relation: source table/column effects -> domain counters -> watched
queries/feed. This is two small explicit maps, not automatic semantic inference.

M3 applied Studio state: per watched view's dependency revision token and its
installed collection result. Failed or unmounted views do not become applied
merely because another view completed or a changes response arrived.

M4 reusable feed artifact: XML, its source revision, epoch, renderer identity,
and a conditional replacement token. ETag/HTTP validation names saved XML, not
the current D1 state. A 304 can legitimately refer to a stale saved feed.

M5 attempt: a refresh or build has captured source revisions, results, current
status, and expected replacement identity. Failure/reset can abandon an attempt.

M6 work observation: change checks, collection loads, feed renders, trigger
writes and remaining auth/admission costs are counted separately.

Rules:

R1 triggers record INSERT/UPDATE/DELETE effects atomically, including background
and direct SQL paths. UPDATE guards compare old/new values with null-safe
semantics. Tracking tables and security counters never track themselves.
Missing state rows, schema evolution and restore epochs need fail-safe handling.

R2 Studio initially loads a view, then polls one fixed revision row for mounted
views. On change, refresh only affected views. Reuse existing refetch machinery;
no optimistic-draft merge algorithm or row delta API is introduced here.

R3 sample a target revision BEFORE refreshing. Mark only successful views
applied through that target, never a newer token sampled after the load. Tie
results to at least that target with authoritative primary reads or a shared
D1 session/bookmark. Serialize/coalesce polls and retain failed dirty views.
When a view mounts later it loads independently; unknown epochs force reload.

R4 cached feed is served immediately; unconditional and conditional requests
both schedule a revision check. If source token equals artifact token, do not
render or rewrite. A missing object needs a blocking initial build. Failed
background work keeps the last good artifact and remains eligible on later
requests. This is request-driven convergence, not an idle-time timer guarantee.

R5 feed renderer uses a monotonic-consistent source read path, samples source
revision before/after its multi-query render and discards a changed interval.
It cannot label arbitrary partial mixed data with the newest revision. This is
an analyst-added prerequisite, not already implemented in buildFeedXml.

R6 publication uses the expected replacement token captured BEFORE rendering,
plus an explicit source-revision non-regression check. Losing conditional writes
discard/retry rather than blindly overwrite. Mutations after validation can
still leave the new artifact temporarily stale; SWR permits that window.

R7 a replacement token must bind generation, not only visible XML bytes. The
previous sketch's plain XML ETag + custom revision metadata is an unresolved
branch: repeated body bytes can repeat ETags despite newer metadata. Candidate
repairs are revision-bearing XML bytes or a revision-bearing manifest. These
are different representations, not evidence the original ETag guard suffices.

R8 duplicate background renders are possible across isolates. Local pending
promises reduce duplicates only locally. A global rebuild claim/lease is not
included in this candidate: a global work bound remains unresolved. A lease,
if later selected, must have recovery/expiry and is extra D1/platform work.

## Dependency preview, not a complete migration

| Source effects | Studio domains | XML domain |
| --- | --- | --- |
| Item working-copy changes | Items/detail | Only if fields read by XML/provenance change; draft text alone excluded |
| Publish/withdraw/version changes | Items/detail/Reading | Yes |
| Media changes | Items/detail | Media association/rendered fields |
| Settings | Settings/update-state | Feed title, bio, byline, canonical URL, timezone used in citation rendering |
| Imported content | Reading/hopper detail | Imported kind/page used in uncited provenance |
| Subscription title/origin/membership | Subscriptions/Reading/hopper detail | Provenance title/origin effects |
| Subscription poll diagnostics | Subscriptions | No |
| Hoppers/membership/signals | Hoppers/detail/signals | No direct XML dependency found |

Deletion and changes moving a row between categories must cover both OLD and
NEW dependencies. UPDATE OF alone detects named columns, not changed values.
SQL columns added in future must be reviewed against renderers and consumers.
Conservative over-tracking is safe for values but may reduce work savings.

## Concrete limits and open branches

The feed may retain pre-withdrawal bytes during SWR or repeated rebuild failures.
No prior immediate-freshness law carries over automatically. A hard stale-age
cutoff or withdrawal gate is a separate policy, not silently selected here.

D1's primary/session reads and R2's conditional operations do not form one
cross-service transaction. Safety concerns legal source renders and monotonic
artifact replacement, not instantaneous alignment with the latest D1 commit.
Retries after all requests stop, endless writes, and failed providers have no
unconditional progress guarantee.

Triggers remove caller notification obligations, not dependency maintenance.
The candidate still needs a migration, one change endpoint, client polling
dispatch, a feed read/revalidation helper and tests. Auth/admission writes remain.
The fixed counters add row writes per mutation; batches/imports can amplify them.

## Provider basis and receiving checks

- [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/):
  batches are transactions; default non-session reads use the primary; sessions
  can begin at primary or a bookmark and preserve sequential consistency.
- [SQLite CREATE TRIGGER](https://www.sqlite.org/lang_createtrigger.html): row
  triggers, WHEN and UPDATE OF semantics. SQLite fixture evidence alone is not
  D1 deployment evidence; migration/runtime verification remains required.
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/):
  object custom metadata, ETags, conditional put and strong object consistency.
  Actual ETag/generation behavior needs a receiving provider witness.
- [Workers context](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil):
  background lifetime is finite; later-request retry must cover interruption.

Controlled models check the above candidate rules independently of production
rendering. Receiving tests must exercise the real Studio/feed routes and D1/R2
behavior before any production correctness or quota claim.
