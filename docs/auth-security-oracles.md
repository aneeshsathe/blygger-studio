# Security release oracles

The remaining security gaps were not all RED before this pass. Five public failure witnesses have exact RED/GREEN evidence: access JWTs survived refresh replay for public and Basic-authenticated clients, dependency errors exposed a sentinel secret in logs, remote HTTP login issued an owner cookie, and an uploaded SVG executed script when opened as a same-origin document. The new probes preceded each repair. Passing controls have separate deliberate mutations that must fail at named assertions.

## Receiving boundaries

| Security area | Oracle and required observation | Evidence limit |
|---|---|---|
| Refresh replay and revocation | `test/auth-security.oracle.test.ts`: live successor access works before replay, then returns401 after ancestor replay. Authenticated native introspection returns active before owner revocation and inactive afterward. Invalid client, scope and resource requests leave the legitimate grant usable. A native-authenticated Basic replay returns `invalid_grant` and revokes the successor JWT; a wrong Basic secret returns `invalid_client` and leaves it usable. | A public replay failure was repaired. Access-token introspection was already secure; the follow-up reproduced and repaired refresh-token introspection after individual revocation. Both require a live-token positive checkpoint. |
| Cross-isolate refresh race | `scripts/verify-auth-security-race.ts`: two compiled workerd isolates share D1. A service gate pauses the completed native rotation claim. The other isolate detects replay. Prior access becomes401 and paused issuance returns400 without credentials. | The gate controls one dangerous native interleaving. It does not prove every distributed schedule. Test-only scheduler code stays outside the production entrypoint. |
| Storage and error secrecy | `test/auth-security.oracle.test.ts`: no plaintext owner password, code, refresh token or access JWT in the inspected app/provider tables. Private signing keys remain encrypted. Error-aware serialization captures Error names, messages and stacks at registration, owner login and manual minting. Injected credential markers stay out of responses and console sinks. | Native session bearer tokens remain in D1 by the provider's design. Real database permissions, backups, platform request logs and external sinks still need operator evidence. |
| Hostile token claims | The security oracle uses the native server-only signing API on disposable fixture keys. A valid signed neighbor works. Wrong issuer, owner, audience, expiry, not-before, missing grant, credential version or unsupported sender constraint fails401 before REST or MCP reads and writes. Substituted keys and ID tokens also fail. | This is receiving behavior, not a proof of cryptographic entropy or every algorithm/header combination. No host credentials or private key material enter the test. |
| Browser attacks | `e2e/client-access.spec.ts`: desktop/mobile Chromium completes login and consent, suppresses an external callback Referer, and refuses both owner pages inside a real hostile ancestor. The ancestor shares the site but differs in origin, so cookie suppression cannot stand in for framing protection. | Native cross-origin protocol probes and frame mutations complement these browser cases. Other browsers and production ingress remain separate. |
| Delegated uploads | `e2e/client-access.spec.ts`: draft-only SVG uploads render in an image. Opening the same upload as a document must not execute its harmless `data-script-ran` marker. The media response applies CSP sandbox and disables scripts. | The receiving witness uses Chromium and one SVG script; it does not claim every browser or active-content format. A production-header mutation must reach the marker assertion. |
| Transport and ingress | The security oracle rejects remote HTTP before protected handling and permits only exact localhost,127.0.0.1,[::1] development exceptions. Existing deployment oracles cover forwarding spoofing, IPv6 grouping, shared budgets and missing-IP fallback. | Rejecting HTTP cannot undo credentials already transmitted. Operators must enforce HTTPS at ingress and verify Cloudflare address-header provenance, admitted hosts and direct-origin reachability. These deployment facts have no local RED/GREEN claim. |

## Mutation controls

Run `npm run test:auth:security:mutations`. The runner copies only tracked files and repository source/test paths into a disposable directory. It never mutates this checkout. Each baseline must pass before its mutant runs. Setup errors, missing modules, timeout failures and surviving mutants fail the verifier.

The controls remove the subject check, store raw credentials, expose full dependency errors, store unencrypted signing keys, omit introspection revocation, trust a spoofed forwarding header, remove browser frame blocking, omit cross-isolate grant revocation, expose root errors, restore the native raw-error fallback, remove the HTTPS guard, remove the uploaded-media sandbox and omit Basic replay client classification. Six added controls let stale native browser cookies authorize after password reset, preserve remembered consent after revocation, allow unclassified writes, grant draft operations to read-only credentials, bypass the publication commit check in a controlled upload race, or bypass the same check through MCP. Each must reach its named receiving assertion. The compiled race and real browser controls are part of this runner.

Run `npm run test:auth:security` for the security oracle and the controlled compiled race. Run `npx playwright test e2e/client-access.spec.ts` for browser lifecycle, framing and inert SVG uploads. The full Worker suite includes the new security oracle.

## Deployment evidence still required

No test in this checkout can establish the production account's log access, D1/backup access, edge TLS configuration or admitted host routes. The operator must verify these facts against the actual deployment. Keep them as release conditions in [deployment hardening](auth-deployment-hardening.md). A passing emulator is not a substitute.

## Deferred discovery publication

The maintainer deferred host-root `.well-known` publication. Mounted OIDC discovery and challenge-linked protected-resource metadata remain the selected profile. The official MCP client completes the tested mounted flow. This does not establish full RFC9728 or RFC8414 host-root publication compliance. Preserve this limit in the PR body. No root route was added.

## Verified result

The full Worker suite passes: 109 files, 1,169 tests passed and five existing
skips. All 25 security mutations reach their named failure assertions. The
complete desktop/mobile browser suite passes 236 tests, including imported HTML,
framing and inert SVG uploads. The UI suite passes 23 tests. Worker/UI typechecks
pass. Two-isolate replay, individual revoke and revoke-all schedules pass. New
captured failures and coverage limits live in the attack inventory below.
Deployment-only facts remain unverified.

## Family scope limit

Application tombstones use `grantId`; Better Auth1.7.7 native refresh-family cleanup uses client/user identity. These boundaries differ. The replay oracle checks denial of the compromised grant, and the independent-grant oracle checks another access credential after owner revocation. Neither establishes that refresh replay leaves another same-client grant’s refresh credential usable. The [glossary](glossary.md) names both families explicitly.

## Permission-class follow-up

The independent REST inventory checks every operation against every scope subset. It also covers public response visibility. Same-client silent reauthorization, published media and a controlled upload/publish race have separate receiving laws. See [the expanded oracle map](auth-oracles.md#complete-rest-permission-inventory). These tests preserve the separation of drafting and publication across REST and MCP. They cover the named boundaries and one controlled concurrent schedule, not all authorization defects.

A password reset invalidates old owner sessions and preserves existing delegated tokens, per decision #31 and the user ruling. Manual API/MCP tokens and native OAuth access/refresh remain valid with the same permissions and deadlines. A fresh owner login lists those grants and can explicitly revoke all. Stale native browser cookies cannot authorize silently without a valid password session. These receiving laws and the corresponding mutations remove the policy blocker.


The final dependency probe also makes `Error.name` contain the sentinel. Raw names are not safe diagnostic fields. OAuth, API and Worker handlers use the same whitelisted error kinds and registered route templates. The registration probe reached RED before this repair. All three dependency profiles and the raw-logging mutation pass their required checks afterward.

## Wider attack campaign

The [attack inventory](security-attack-inventory.md) records source-linked laws,
captured pre-fix failures, all fourteen oracle audit outcomes and unresolved
cells. New Worker/browser oracles cover imported HTML, draft deletion races,
JWT headers, streaming/destination guards, work/AI/client quotas, body limits
and Markdown work growth. The mutation runner adds six receiving controls for
counter, AI, storage, REST bytes, outbound destinations and MCP discovery.

The native error-secrecy injection explicitly checks that it reached provider
work. The registration reservation SQL also mentions `oauthClient`; refusing
there would test the application error handler while missing the native fallback.
The unsafe native logging mutation now reaches its named assertion again.

The race driver accepts `revoke` and `revoke-all` as well as its default replay
schedule. Individual revoke preserves a separate same-client grant’s refresh
and access. This does not strengthen the native replay-family isolation claim.

The defaults and deployment caveats live in [work and outbound limits](auth-deployment-hardening.md#work-and-outbound-limits).
In particular, DNS preflight does not prove connection-time enforcement. No
whole-security or every-possible-attack coverage claim follows from these tests.

## Content, resource and grant follow-up

The review follow-up starts at `4a34d11`. Six new literate oracle files cover
transclusion and attribution rendering, media visibility, delegated budgets,
registration retention, native callback disclosure and read-only fork fetching.
The native security oracle adds refresh introspection and a controlled late grant
recording race. Each confirmed failure was captured before its repair; fixture
errors are excluded from RED evidence.

`review-content-security.oracle.test.ts` covers preview, fresh publication and
history, plus old stored bakes on public, pinned, detail, history and reading
surfaces. Browser version navigation reads sanitized pinned-page HTML instead of
raw protocol JSON. A request observer catches authority calls before async minting
finishes; a negative DOM-marker check alone could race the callback. Presentation is inert while frozen stored snapshots remain unchanged.
Citation links are checked twice: a draft token cannot store an active-scheme
`cited.url` or `stub_of.url`, and stored citations render as inert links on
public pages while a stored https citation keeps its exact link. Author links
and `site_url` follow the same rule on write and on read.
Two inventory sweeps write hostile text into every setting a manage token can
store, and into delegated item text, citation captions, collection names and
blogroll titles. They then crawl every public HTML page. Link attributes are
judged across the whole page, with entities decoded as a browser would; script
elements are judged inside the article and counted against a clean baseline
elsewhere. A sink is caught wherever it renders, not only where a test expected it.
`media-visibility-security.oracle.test.ts` checks anonymous refusal, owner preview,
no-store, publication, unused inline attachments and pin retention. Read tokens
work, draft-only and revoked tokens refuse, and non-loopback HTTP private reads
refuse both cookie and bearer credentials.
`delegated-budget-security.oracle.test.ts` separates owner, per-grant and delegated
aggregate quotas and counts provider calls against an AI reserve and total cap,
including AI work reached through an MCP tool.
`registration-retention-security.oracle.test.ts` checks abandoned-client recovery
beside an approved client that remains usable. It ages rows in better-auth's own
ISO text format; an earlier version wrote numbers, which hid a cleanup that never
matched a real row. Consent checks display the full
registered native URI. Fork checks preserve one bounded public fetch, refuse
private transport and suppress a dependency secret marker.

Native refresh introspection must authenticate the issuing confidential client.
An unrelated client's inactive response is not revocation evidence. Grant
recording uses one SQL statement to check tombstones and epoch before insertion;
a controlled pause before that statement proves revocation cannot resurrect the
owner listing. Browser fixtures try to mint a named disposable full-scope grant
from imported native content and inspect both DOM execution and the grant list.

The isolated mutation verifier adds controls for each repair, the AI reserve and
both browser authority paths. Sensitivity to these controls does not certify
arbitrary HTML, distributed schedules or deployed network/ingress behavior.
