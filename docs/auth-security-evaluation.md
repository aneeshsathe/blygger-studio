> Current result: see “Security follow-up” and “Security follow-up validation” below. Earlier closeouts are historical snapshots.

# OAuth and MCP security evaluation

The source survey and two loss audits are complete. Confirmed defects were repaired with focused RED/GREEN probes. The implementation is not certified as fully conformant or production hardened. Fourteen composite OAuth coverage records remain open; they preserve unmeasured clauses, not fourteen demonstrated defects.

## Scope and evidence

The survey reads 36 primary sources, pinned package artifacts and the supplied TanStack oracle guide. It preserves 483 source claims: 290 OAuth/OIDC, 138 MCP, 41 deployment/package claims and 14 guide blocks. See [the source survey](auth-security-survey.md). The first loss audit compares these sources with the frozen oracles. The second compares them with the frozen implementation. Source roles and MUST, SHOULD and optional requirements stay distinct.

The reviewed snapshot is an uncommitted worktree based on HEAD `b88a0f34dfe6860c100322438552058945d0c8c4`. Its initial manifest digest is `5eda53b131c633b7d5bc135c29e504a65f3586c54aeb24060788faa99bd33c3c`. Findings were registered before probes and repairs. Original records remain in the appendix. Evidence logs and source snapshots live in `/private/tmp/blygger-auth-audit`; these are local evidence, not deployed observations. The final file manifest is recorded separately after repairs.

## Reviewer assessment

The audits are accurate and useful as bounded source inventories. They recover lifecycle, parser, browser and deployment boundaries that broad success tests miss. They keep client duties apart from server duties. Their dense composite records require clause-by-clause partial closure; a coverage omission alone does not prove a product bug. Fixes were accepted only after public probes or direct documentation evidence, and several overstrict expectations were corrected against the source.

Hire recommendation: yes for source-grounded security review paired with executable verification. Do not use these inventories alone as release approval or a penetration-test report. Their main weakness is prioritization: optional profiles, production evidence and immediate defects initially share the same inventory format.

## Repairs and validation

Repairs include native shared D1 rate limits; fail-closed owner-password configuration; owner-cookie invalidation on password reset; separate grant listing and revocation; revoked UserInfo rejection; OAuth form parsing, PKCE grammar and exact error handling; login and consent framing; explicit offline-access disclosure; real reauthentication continuation; grant/session lifetime alignment; native MCP scope challenges; and browser form referrer behavior. The oracle runner now preserves primary failures through cleanup and replays actual captured auth and storage failures.

- Full Worker suite: 95 files, 990 passed, five existing skips, 995 total. `final-worker-suite-green.log`.
- UI suite: six passed. `final-ui-suite.log`.
- Worker and UI typechecks passed. `final-typecheck.log`.
- Three deliberate mutants were detected; two actual captured failures were replayed with their target, seed, path and semantic checkpoint. `final-auth-mutations.log`.
- Compiled full Worker rate limits survive isolate restart and reject spoofed forwarding identities in the local fixture. `compiled-hardening-settled-green.log`.
- The original 0.8.3 upgrade script completed against the local fixture and installed all 17 auth tables. `hardening-upgrade-final-green.log`.
- Browser and focused post-browser validation results are appended below. The full-suite result predates the final browser fixes; it is not presented as a rerun of those changes.

## Open boundaries

Every deferred item has a named destination in [deployment hardening](auth-deployment-hardening.md), [MCP hardening](mcp-hardening.md), [OAuth implementation hardening](oauth-implementation-hardening.md) or [OAuth protocol hardening](oauth-protocol-hardening.md). Oracle grammar and evidence limits remain in [auth oracles](auth-oracles.md).

The fourteen open records are OL01, OL04, OL06, OL07, OL08, OL09, OL12, OL13, OL14, OL17, OL18, OL19, OL21 and OL22. Their remaining clauses include deployed TLS/proxy/log secrecy, crypto and key lifecycle assurance, full error and metadata grammar, optional OIDC request branches and distributed lifecycle schedules. Each exact source clause, owner and acceptance boundary remains in the protocol hardening document. Generic passing suites do not close them.

OL15 and ILO14 refer to one pending design question: keep mounted challenge-linked resource metadata with an explicit RFC9728 publication limit, or permit host-root protected-resource well-known routes. No host-root route was added. RFC8414 host-root publication is an unselected profile under the existing mount-only/OIDC choice (ILO12); it is not claimed satisfied.

## Loss accounting

The original 116 records remain separate: 75 oracle/guide records and 41 implementation records. Six supplements retain adjacent failures: PI01–PI05 and HL10-S1. No overlap was removed from the count.

`122 raw records = 52 fixed-now + 53 deferred + 14 confirmed-open + 1 stale + 2 design-decision`.

“Fixed” includes documentation and test-integrity repairs, not just product bugs. The stale advisory lead keeps its surviving dependency-check value. Final reconciliation reads the raw ledger, source coverage maps, footnotes and conditional clauses rather than relying on test totals. No record lacks a disposition or destination. Open records lack the specific remaining evidence named above.

## Finding ledger

Each row separates validity/evidence, action and surviving value. Original claims and proposed repairs are preserved in the raw appendix, including mistaken premises and narrower surviving claims.

| ID | Technical validity and evidence | PR action | Durable value and destination |
|---|---|---|---|
| G01 | Technical validity and severity: Confirmed documentation/evidence gap, P3. The storage grammar had bounds/reconstruction but no separate ablation/exclusion account; credential controls could not stand in for it.; Evidence: Frozen `oauth-storage.oracle.test.ts:13,47–48`, frozen coverage record:15–23, ORC-004. Added direct source-grounded storage controls; focused validation finds all four controls and each semantic axis. No product failure is alleged or invented. | fixed-now in working snapshot | Separate grammar ownership, inactive-field normalization, overlap/range/exclusion limits survive in `docs/auth-oracles.md`, “Storage history grammar controls.” |
| G02 | Technical validity and severity: Confirmed test-evidence gap, P2. A generic `fc.check` failure replay plus a successful auth interface replay did not reproduce a captured auth/storage campaign failure through the suite registry.; Evidence: Controlled original runner seam RED; same seam GREEN; actual isolated auth/storage mutations captured and replayed through ORACLE_TARGET/SEED/PATH at the same semantic checkpoint and reduced counterexample. | fixed-now in working snapshot | `scripts/verify-auth-oracle-mutations.ts` now preserves target, seed, path, checkpoint, counterexample and outcome in `build/auth-replay-*.json/.log`; the documentation records the distinguishing cases. |
| G03 | Technical validity and severity: Confirmed cleanup test-integrity flaw, P2. An original rejecting client close replaced the primary mismatch and prevented transport close.; Evidence: Controlled frozen finally-body RED; same operation/release fixture GREEN with the helper; focused Worker suite 3 files / 12 tests. | fixed-now in working snapshot | `test/oracle-cleanup.ts` and `test/oracle-cleanup.test.ts` retain exact primary cause, every secondary error and every attempted release; production/test-only MCP callers use it without changing their observations. |
| G04 | Technical validity and severity: Confirmed new-oracle evidence gap, P3. Grouped statuses omitted the other three limits and trigger distinctions.; Evidence: Frozen docs:23–30 and later chronology versus all 14 guide blocks; direct validation of the new 14-row map and explicit non-closeout limit. | fixed-now in working snapshot | Consolidated `docs/auth-oracles.md` map retains each applicable outcome and conditional trigger limit. Exact committed-head closeout remains separately pending; this item is not upgraded into a complete conformance claim. |
| HL01 | Technical validity / surviving boundary: High abuse-control issue reproduced: compiled DCR accepted seven instead of five. Native threshold, concurrency, reset, endpoint separation now tested. Other endpoint defaults anchored to pinned package, not all threshold-tested. | fixed-now | E1/E3; test/auth-deployment.oracle.test.ts; src/oauth.ts; migration0018 |
| HL02 | Technical validity / surviving boundary: Coverage fix, no current native revocation bug. Production JWT revoke400 unsupported_token_type/access200; refresh-only revoke200 then refresh400/access200. Opaque-token mode unselected, so same-grant opaque deletion/survival is conditional rather than silently claimed tested. | fixed-now | E6/E11; auth-lifecycle test revocation; deployment doc conditional alternatives |
| HL03 | Technical validity / surviving boundary: Actual old0.8.3 upgrade now runs to completion, checks17native/appauth tables and native limiter columns. Synthetic failed migration-batch rollback is separately reached. Private assertion replay remains conditional. Remote production upgrade/recovery rehearsal is still external. | fixed-now | E12; scripts/verify-upgrade.ts; lifecycle schema/rollback; rollout D1 recovery |
| HL04 | Technical validity / surviving boundary: High shared-budget issue reproduced across compiled Worker path. D1 native table/backend now selected; counter survived destroying/recreating Worker. Module-global memory is per isolate, not reset by every factory. | fixed-now | E1/E2; src/oauth.ts; migration0018; compiled probe |
| HL05 | Technical validity / surviving boundary: Compiled no-NODE_ENV enforcement fixed; same-flow publicDCR429 vs authenticated manual API mint200 and unauthenticated401 now demonstrates HTTP/API distinction without disabling limits. | fixed-now | E2/E6/E11; auth-lifecycle API bypass; deployment test |
| HL06 | Technical validity / surviving boundary: Local spoof, /64 representation/reset and missing-header boundaries pass. Actual trusted-hop overwrite/direct-origin reachability needs the deployed ingress. A header name alone is not proof. | deferred | E3; deployment doc Ingress and origin |
| HL07 | Technical validity / surviving boundary: Native cookie flags/path/host-only and actual signed nativeconsent hostileOrigin/localhost403, bogusnativecookie401; false wrapper owner gate separately tested. Security checks stay enabled. This is bounded behavior, not every browser attack. | fixed-now | E3/E6/E11; deployment and lifecycle tests; HL19 retains actual iframe observation |
| HL08 | Technical validity / surviving boundary: Local forwarded host/proto forgery ignored; configured cookie-secret cutover rejects pendingcode400 and oldJWT401. Purpose-versioned retained-old-key state/proxy upgrade is unselected alternative, not claimed tested. Real ingress remains deferred HL06/09. | fixed-now | E3/E6/E11; lifecycle cutover; deployment doc alternatives/ingress |
| HL09 | Technical validity / surviving boundary: Two ordinary mounted request hosts deliberately produce corresponding issuer despite forged forwarding. No project requirement for optional canonical-host allowlist inferred. Actual accepted deployed Host inventory is external; baseURL-path override is unused because configured string contains origin only. | deferred | E6/E11; lifecycle requesthosts; deployment doc Ingress and origin |
| HL10 | Technical validity / surviving boundary: Empty wrapping secret login500/no cookie. Adjacent missing owner password RED302, root nonempty-config guard GREEN403/no cookie; configured owner login still302. Versioned encryption/fallback unselected; conditional idea preserved. Critical only under missing owner-password config. | fixed-now | E7/E11; HL10-S1 supplemental below; rootauth.ts; deployment doc alternatives |
| HL11 | Technical validity / surviving boundary: Current native code-consume concurrency probe passes public race: at most one200 and competitors400, with real D1 and request factories. Original historical advisory remains patched, not current vulnerability claim. Cross-region real deployment contention not measured. | fixed-now | hardening-final-candidate.log; oauth-validation concurrent exchange; H14/P04 anchors |
| HL12 | Technical validity / surviving boundary: Meaningful failed D1 batch CREATE/INSERT/duplicate throws and leaves no created table. Atomic batch contract reached; no claim arbitrary read-await-write request sequence is atomic, nor that replicas add atomicity. | fixed-now | E6/E11; lifecycle rollback; deployment doc transaction boundary |
| HL13 | Technical validity / surviving boundary: Unmeasured real D1 queue/overload condition; local bursts cannot establish production throughput. | deferred | deployment doc D1 capacity and recovery |
| HL14 | Technical validity / surviving boundary: Plan-specific database budgets and recovery retention remain unknown. Indexed schema does not prove quota headroom. | deferred | deployment doc D1 capacity and recovery |
| HL15 | Technical validity / surviving boundary: Compiled full Worker selected auth paths run on local workerd; broad Node API stub/unsupported behavior and deployed path still unmeasured. | deferred | E2; deployment doc Worker runtime |
| HL16 | Technical validity / surviving boundary: Local full-bundle execution is stronger than isolated-provider bytes, but no live CPU/memory/startup/connection/plan limit claim follows. | deferred | E2; deployment doc Worker runtime |
| HL17 | Technical validity / surviving boundary: Optional profiling/pressure diagnostics are operational work, not a defect merely because absent. | deferred | deployment doc Worker runtime |
| HL18 | Technical validity / surviving boundary: Public authorization rejects unregistered evil/trailing slash/case/query callbacks; registered query/state preserved; DCR rejects relative/fragment/remotehttp redirects. Multi-owner injection outside single-owner premise remains conditional. | fixed-now | hardening-final-candidate.log; oauth-validation first8redirect cases |
| HL19 | Technical validity / surviving boundary: PKCE omitted/empty/forgedchallenge and method syntax covered by root+guide; lifecycle additionally missing/empty/valid43char wrong verifier400/no token and signed nativeconsent scope tamper400. Browser/wrapper binding and crosssite tests pass. Actual iframe-rendering observation remains named browser rollout test; header assertion is not browser proof. OWASP testing advice, not inferred RFC MUST. | deferred | E11; lifecycle verifier/nativeconsent; oauth-validation grammar; deployment doc Ingress/browser measurement |
| HL20 | Technical validity / surviving boundary: Product expiry issue reached: nominal offline grant refreshed at30days-1 returned500 because issued JWT native session inactive after7days. Rootsession lifetime30days fixes same refresh200/API200; exact fixeddeadline renewedAPI401/refresh400. Actual OAuth hour exp-1ms200/exp401, native refresh expiry400; root spec rejects live descendant after ancestor reuse400. | fixed-now | E10/E11; lifecycle fixeddeadline; oauth-spec live refresh descendant; rootsession config |
| HL21 | Technical validity / surviving boundary: Structured security event inventory is absent in inspected paths. Medium operational advice; a debug trace is not audit events, but no protocol event requirement inferred. | deferred | deployment doc Security logging |
| HL22 | Technical validity / surviving boundary: No sentinel log-redaction test and no proved secret leak. Outer Error.name cannot establish every dependency/sink secret boundary. | deferred | deployment doc Security logging |
| HL23 | Technical validity / surviving boundary: Log encoding/failure isolation remains unmeasured; no actual logging failure reproduced. | deferred | deployment doc Security logging |
| HL24 | Technical validity / surviving boundary: Log access/resource depletion/user-blocking effects need real pipeline and failure injection. | deferred | deployment doc Security logging |
| ILH01 | Technical validity / surviving boundary: High confirmed DCR global-enable defect. Explicit native limiter fixes actual compiled HTTP path without NODE_ENV assumption. Distinct owner login now shares native infrastructure, separate budget. | fixed-now | E1/E2/E3; HL01; src/oauth.ts; parent spa integration |
| ILH02 | Technical validity / surviving boundary: Native D1 storage and rateLimit schema now explicit; persisted isolate-restart budget observed. No independent limiter algorithm introduced. | fixed-now | E1/E2; HL04; migration0018 |
| ILH03 | Technical validity / surviving boundary: Actual release-equivalent compiled Worker without NODE_ENV produced RED then GREEN. Explicit enabled:true avoids relying on environment predicate. auth.api bypass is preserved separately in HL05. | fixed-now | E1/E2; compiled probe |
| ILH04 | Technical validity / surviving boundary: Authoritative header configured and spoofed XFF cannot reset local budget. Real ingress overwrite remains an external trust premise. | deferred | E3; HL06; deployment doc Ingress and origin |
| ILH05 | Technical validity / surviving boundary: Request-host derived issuer is intended portable installation behavior in bounded tests. No mandatory allowed-host change follows. Exact external premise: which Host values Cloudflare deployment admits, whether direct origin exposed. | deferred | E6/E11; HL09; deployment doc Ingress and origin |
| ILH06 | Technical validity / surviving boundary: No real queue overload/load evidence; low local bursts prove budget decisions only. | deferred | HL13; deployment doc D1 capacity and recovery |
| ILH07 | Technical validity / surviving boundary: Per-request/database budget and retention need deployed measurements; no quota bug inferred from repeated setup code. | deferred | HL14; deployment doc D1 capacity and recovery |
| ILH08 | Technical validity / surviving boundary: Compiled full selected auth path runs locally; not complete Node API compatibility/deployed path coverage. | deferred | E2; HL15; deployment doc Worker runtime |
| ILH09 | Technical validity / surviving boundary: Low configuration omission: persistence child at2026-07-01 lacked opt-in. Added nodejs_compat; direct config validation matches generic/release verifier. No standalone original persistence runtime RED claimed. | fixed-now | scripts/persistence-worker.ts; deployed/runtime coverage remains ILH08 |
| ILH10 | Technical validity / surviving boundary: Live resource headroom and plan unknown; compiled smoke cannot prove limits. | deferred | HL16; deployment doc Worker runtime |
| ILH11 | Technical validity / surviving boundary: Optional diagnostics remain an explicit rollout measurement. | deferred | HL17; deployment doc Worker runtime |
| ILH12 | Technical validity / surviving boundary: Structured event inventory not implemented; operational design/test value retained without treating OWASP advice as universal mandatory feature. | deferred | HL21; deployment doc Security logging |
| ILH13 | Technical validity / surviving boundary: Full-stack secrecy boundary unknown, no leak proved. Native error stack/object output exists; shutoff would lose diagnostics without proving redaction. | deferred | HL22; deployment doc Security logging |
| ILH14 | Technical validity / surviving boundary: Central sanitizer/log failure isolation unknown; no log behavior reproduced. | deferred | HL23; deployment doc Security logging |
| ILH15 | Technical validity / surviving boundary: External pipeline access/failure/depletion controls cannot be established from generic Worker config. | deferred | HL24; deployment doc Security logging |
| HL10-S1 | Original supplemental claim / scope: Empty or undefined configured OWNER_PASSWORD can match an empty submitted password and grant owner login; test the missing-owner config with valid COOKIE_SECRET before root's nonempty-password guard.; Severity / HEAD: Critical under missing-password config; HEADb88a0f34dfe6860c100322438552058945d0c8c4 + uncommitted candidate; Evidence: E7RED public302 twice; E11/E13 samecases403/no cookie plus configuredowner302; Technical verdict: Confirmed behavioral config flaw, fixed; not a claim every deployed host omitted its password | fixed-now; rootauth.ts rejects missing/empty configured strings, preserves digest comparison for configured secrets | test/auth-lifecycle.oracle.test.ts empty/undefined owner-password cases; docs/auth-deployment-hardening.md fail-closed account; parent expanded ledger120 |
| ML01 | Claim: Version publication/per-request behavior; Evidence / technical verdict: Native version/head mismatch and unsupported-version tests added. Missing standard headers now explicitly reject400/-32020. Preserve full prior-revision matrix as distinct future coverage; current publication is directly sourced, not inferred from package. | deferred | docs/mcp-hardening.md#ml01; full raw support below |
| ML02 | Claim: AS security breadth; Evidence / technical verdict: Imported OAuth2.1 breadth includes confidential auth and missing/downgraded PKCE; root standards evaluator owns overlapping provider work, but this track does not invent full certification. | deferred | docs/mcp-hardening.md#ml02; full raw support below |
| ML03 | Claim: Production protected-resource metadata/challenge; Evidence / technical verdict: Production PRM/challenge checked directly: canonical resource, one mounted AS, offline_access exclusion, denied-request metadata pointer. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML04 | Claim: Scope challenge content; Evidence / technical verdict: Public operation403 RED200→GREEN403; exact publish and dynamic draft+publish scopes, MCP metadata pointer. Native scope hook and verified authInfo now wired. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML05 | Claim: AS response issuer advertisement/errors; Evidence / technical verdict: Production advertisement now asserted. Full AS error-response iss and client issuer-rejection matrix remain separate; client duties outside Worker. | deferred | docs/mcp-hardening.md#ml05; full raw support below |
| ML06 | Claim: MCP invalid/expired/foreign token receiving boundary; Evidence / technical verdict: Real production OAuth MCP token now passes at exp-1 and fails401 at exp; valid API-audience OAuth token fails401 at MCP, malformed/tampered token negatives also pass. Isolated foreign-issuer receiving matrix remains separate; root owns verifier. | deferred | docs/mcp-hardening.md#ml06; full raw support below |
| ML07 | Claim: Refresh confidentiality and RS offline_access challenge; Evidence / technical verdict: PRM excludes offline_access and challenge metadata is asserted. Refresh storage/transit secrecy requires broader persistence/deployment evidence. | deferred | docs/mcp-hardening.md#ml07; full raw support below |
| ML08 | Claim: MCP malformed/insufficient-scope HTTP decisions; Evidence / technical verdict: 403 challenge fixed (ML04/ILM03). Auth omission/tampering receives401; malformed-auth400 taxonomy and every classifier branch not covered by these focused cases. | deferred | docs/mcp-hardening.md#ml08; full raw support below |
| ML09 | Claim: Scope hierarchy at RS; Evidence / technical verdict: Independent literal owner scopes do not declare a hierarchy. Add hierarchy law only if the permission contract defines one; no widening invented. | deferred | docs/mcp-hardening.md#ml09; full raw support below |
| ML10 | Claim: Every inbound request despite application handles; Evidence / technical verdict: Independent valid, absent, malformed and tampered bearer POSTs plus concurrent distinct-grant requests reach real Worker. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML11 | Claim: Scope-minimization advice; Evidence / technical verdict: Default initial challenge is owner:read; incremental operation challenge now implemented. Downscope, correlated elevation audit events and denied-loop caching have distinct AS/client premises; do not add client cache to Worker. | deferred | docs/mcp-hardening.md#ml11; full raw support below |
| ML12 | Claim: Token storage confidentiality; Evidence / technical verdict: Wrapper hashes and provider checks do not establish deployment storage/log secrecy. Preserve provider persistence/log audit separately. | deferred | docs/mcp-hardening.md#ml12; full raw support below |
| ML13 | Claim: HTTPS and redirect-scheme boundary; Evidence / technical verdict: HTTPS test URL does not prove edge TLS or full redirect scheme enforcement. Native localhost exceptions and Worker deployment boundary require exact tests/config evidence. | deferred | docs/mcp-hardening.md#ml13; full raw support below |
| ML14 | Claim: Production discovery PKCE advertisement; Evidence / technical verdict: Production OIDC discovery now directly asserts S256 PKCE advertisement and mounted issuer; no fixture credit. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML15 | Claim: Authorization redirect validation/trust; Evidence / technical verdict: Provider trusted redirect checks code-observed; root standards probes own redirect flow work. Explicit authorization bad redirect/error escape matrix is not replaced by token exchange checks. | deferred | docs/mcp-hardening.md#ml15; full raw support below |
| ML16 | Claim: Before-data-release token validation/no passthrough; Evidence / technical verdict: Real OAuth intended-audience success, API-audience denial, T-1/T expiry and tampered-token denial observed before protected result. Wrapper strips inbound bearer internally. Isolated foreign issuer/no upstream-token transfer needs distinct architecture premise. | deferred | docs/mcp-hardening.md#ml16; full raw support below |
| ML17 | Claim: HTTP endpoint/messaging rules; Evidence / technical verdict: Public Worker notification202 empty body, batch/response400, wrong-method405 and ordinary POST200 now directly tested; JSON response is valid, active SSE feature remains separately conditional. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML18 | Claim: MCP Origin/DNS-rebinding gate; Evidence / technical verdict: Valid/absent Origin200, invalid Origin403 at actual MCP route; deployment DNS/proxy topology remains external. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML19 | Claim: Every MCP connection authentication; Evidence / technical verdict: Per-request credentials tested now (ML10). Streaming/listen-request authentication is conditional because none configured; no universal connection authorization inferred from one Client. | deferred | docs/mcp-hardening.md#ml19; full raw support below |
| ML20 | Claim: SSE lifecycle/cancellation advice and rules; Evidence / technical verdict: Controlled SDK lifecycle experiment proves forced close-on-Response truncates active SSE, while native delayed result survives. Production tools emit no progress and select auto JSON; full streaming/cancellation feature must supply same-path fixture before product-bug claim. | deferred | docs/mcp-hardening.md#ml20; full raw support below |
| ML21 | Claim: Header/body routing and version validation; Evidence / technical verdict: Native missing-version/method/name and version/method/name/encoding mismatches400/-32020, unsupported400 with supported-list, unknown RPC404/-32601 are public-observed. Null/sentinel/custom parameter/intermediary matrices remain distinct conditions; no duplicate local native guard added. | deferred | docs/mcp-hardening.md#ml21; full raw support below |
| ML22 | Claim: Modern-only legacy traffic/fallback boundary; Evidence / technical verdict: Default SDK includes legacy fallback; GET405 observed. Modern-only/resumption-ignore and older full handshake guarantees not assumed or exhaustively tested. | deferred | docs/mcp-hardening.md#ml22; full raw support below |
| ML23 | Claim: Independent conformance/scoring limits; Evidence / technical verdict: Conformance requirement revision/mode/scoring/baseline accounting is an independent tool campaign, not equivalence to local oracle count. AS excluded by core role scope. | deferred | docs/mcp-hardening.md#ml23; full raw support below |
| ML24 | Claim: Server/transport request isolation; Evidence / technical verdict: Concurrent read grant200 and draft grant403 reach separate request transports; all15 scope inventories still pass. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ML25 | Claim: Large single-event SSE processing boundary; Evidence / technical verdict: Large SSE event parser performance concerns client role and active stream; preserve optional interoperability endurance test, not Worker AS mandate. | deferred | docs/mcp-hardening.md#ml25; full raw support below |
| ILM01 | Claim: Broad AS security delegation remains bounded; Evidence / technical verdict: Bounded provider delegation is not proof of all imported OAuth2.1 clauses; preserve confidential/security breadth investigation, cross-reference ML02. | deferred | docs/mcp-hardening.md#ilm01; full raw support below |
| ILM02 | Claim: Storage and refresh secrecy evidence boundary; Evidence / technical verdict: Unknown native persistence, deployment confidentiality and logging; wrapper hashed records are evidence only. Cross-reference ML07/ML12. | deferred | docs/mcp-hardening.md#ilm02; full raw support below |
| ILM03 | Claim: Operation-specific MCP insufficient-scope boundary; Evidence / technical verdict: Confirmed product issue; scope challenge fixed through public SDK requireScopes/scopeChallenge and handler.fetch authInfo. Scope-filtered inventory retained through public low-level handler. | fixed-now | src/mcp.ts; test/mcp.oracle.test.ts; residual boundaries retained below |
| ILM04 | Claim: Correlated scope-elevation log advice; Evidence / technical verdict: No correlated elevation event observed; advice not MUST. Preserve event/privacy design before adding log payloads; no token logging proposed. | deferred | docs/mcp-hardening.md#ilm04; full raw support below |
| ILM05 | Claim: Production HTTPS boundary remains unknown; Evidence / technical verdict: Deployed TLS/full redirect schemes not established; source-config https fixtures do not resolve edge behavior. Cross-reference ML13. | deferred | docs/mcp-hardening.md#ilm05; full raw support below |
| ILM06 | Claim: Conditional response-stream lifetime boundary; Evidence / technical verdict: Controlled public SDK lifecycle probe confirms conditional close-on-Response failure; current production JSON tools lack required streaming precondition. No unsupported tasks/progress feature added to claim a production RED. | deferred | docs/mcp-hardening.md#ilm06; full raw support below |
| ILM07 | Claim: Advisory applicability remains unknown; Evidence / technical verdict: Official advisory pages opened in authorized post-survey extension: sdk>=1.10.0<=1.25.3 shared-instance issue patched1.26.0; sdk<1.25.2 UriTemplate issue patched1.25.2. Worker uses fresh server/transport, no resource templates; package server2.3.0 is distinct from v1 sdk. Prior unknown-range statement is historical, resolved without claiming general v2 immunity. | stale | docs/mcp-hardening.md#ilm07; full raw support below |
| ILM08 | Claim: Optional SDK input-limit fact retained; Evidence / technical verdict: Native encoded body budget is now explicitly8MiB so5MiB media can travel as Base64; exact5MiB success and over8MiB envelope rejection tested. maxToolInputElements remains optional/off. Audience gate exists in wrapper and new request probes deny altered credentials. Optional cardinality limit needs explicit threshold/work bound; expectedResource middleware omission does not mean missing audience enforcement. | deferred | docs/mcp-hardening.md#ilm08; full raw support below |
| OL01 | Original claim: Redirect registration and authorization error boundaries; Technical validity / exact evidence: Valid frozen omission; Exact HTTPS redirect/query/state/denial and no-owner login cases now GREEN; safe local error redirect is valid, not an open redirect. | confirmed-open | Full credentials-on-redirect, every error-character and trust regime remain unmeasured; phase-3 native/client duties are conditional. OL01 source list remains the acceptance boundary. docs/oauth-protocol-hardening.md OL01. |
| OL02 | Original claim: PKCE downgrade and parser boundaries; Technical validity / exact evidence: Valid frozen omission; Root wrong-verifier error RED→GREEN; validation missing/plain/unsupported challenge methods; implementation matching-hash syntax and native S256 detection GREEN. | fixed-now | S256-only cannot issue a fresh unchallenged code; optional other profiles are not added. Substring observation is not crypto extraction proof (OL13). docs/oauth-protocol-hardening.md OL02. |
| OL03 | Original claim: Access token sender constraints and password-grant prohibition; Technical validity / exact evidence: Valid frozen omission; Unsupported password grant rejected; owner password login remains independent. Bearer profile selected. | deferred | Sender constraint SHOULD advice is a security/profile decision, not an unconditional feature mandate. API security owner retains token-theft risk and DPoP/mTLS option in OL03. docs/oauth-protocol-hardening.md OL03. |
| OL04 | Original claim: Refresh replay family invalidation and lifetime; Technical validity / exact evidence: Valid frozen omission; Active descendant denial already passes; concurrent native rotation and cross-client/resource refusal GREEN. Thirty-day valid-side refresh500 RED→GREEN; expiry endpoint400 GREEN. | confirmed-open | Inactivity expiry and immediate-predecessor retry/grace window are distinct unmeasured lifecycle cells. OAuth lifecycle owner retains exact clauses; no token-inequality proxy. docs/oauth-protocol-hardening.md OL04. |
| OL05 | Original claim: Source S01 remaining baseline detail; Technical validity / exact evidence: Valid frozen omission; Authorization GET/OPTIONS CORS presence RED→GREEN; token browser CORS and production metadata GREEN. | fixed-now | Real deployed proxy/TLS belongs OL06; fixture HTTPS URL does not establish transport. docs/oauth-protocol-hardening.md OL05. |
| OL06 | Original claim: Deployment threat model and secret transport/storage; Technical validity / exact evidence: Valid frozen omission; Direct source comparison confirms these operational/crypto clauses were absent from frozen receiving oracles. | confirmed-open | Attacker inventory, protected proxy link/header provenance, certificates/TLS, logging/token secrecy, issuance risk, entropy/guess and timing assurances remain OPEN before public rollout; deployment/security owner. docs/oauth-protocol-hardening.md OL06. |
| OL07 | Original claim: Authorization-page external content, trust and clickjacking breadth; Technical validity / exact evidence: Valid frozen omission; Owner frame headers RED→GREEN; consent binding/cross-origin refusal, escaped self-asserted name, same-origin resources and hostile state GREEN. | confirmed-open | Real-browser legacy framing and external client callback duties have no deployed/client witness; security review and phase-3 clients retain named duties. docs/oauth-protocol-hardening.md OL07. |
| OL08 | Original claim: Public-client identification and registration type; Technical validity / exact evidence: Valid frozen omission; DCR independent IDs, explicit public none, confidential default and registered callback fields GREEN; code/refresh binding tested. | confirmed-open | Identifier-size/interface compatibility and credential-exposure classification remain evidence gaps for API/provider security review; client_id does not prove client identity. docs/oauth-protocol-hardening.md OL08. |
| OL09 | Original claim: Endpoint parsing and required inputs; Technical validity / exact evidence: Valid frozen omission; Duplicate code/grant/verifier accepted RED→GREEN; missing/empty response_type enum RED→GREEN. Required/empty/duplicate/unknown, unsupported types, owner GET, token form POST and valid neighboring exchange GREEN. | confirmed-open | Configured endpoint query/fragment constraints, absent scope policy, changed-grant response scope and every singular field need dedicated receiving laws; OAuth implementation owner. Repeatable resource is not singular. docs/oauth-protocol-hardening.md OL09. |
| OL10 | Original claim: Authorization-code expiry and invalid-code boundary; Technical validity / exact evidence: Valid frozen omission; Unknown code400, concurrent single-use200/400, full-Date599/600 success and601 invalid_grant GREEN. | fixed-now | Strict600 rejection was not a source law: native expiry instant is inclusive. Preserve exact-boundary test, not a599-second workaround. docs/oauth-protocol-hardening.md OL10. |
| OL11 | Original claim: Token response representation and cache policy; Technical validity / exact evidence: Valid frozen omission; 200 JSON access/refresh strings, numeric expiry, Bearer type, no-store and Pragma no-cache GREEN; consent headers separately measured. | fixed-now | Optional response extensions remain allowed; finite assertions make no universal extension claim. docs/oauth-protocol-hardening.md OL11. |
| OL12 | Original claim: Token errors and auth-scheme fidelity; Technical validity / exact evidence: Valid frozen omission; Malformed JSON/plain body500 and valid-wrong-PKCE wrongenum RED→GREEN. Duplicate invalid_request, unknown/expired code invalid_grant, absent verifier and unsupported password grant GREEN. | confirmed-open | Remaining public error enum variants and full ASCII/error_uri syntax lack exhaustive witnesses; confidential auth method/status conditional. OAuth implementation testing owns residuals. docs/oauth-protocol-hardening.md OL12. |
| OL13 | Original claim: Forgery/guess resistance of access tokens; Technical validity / exact evidence: Valid frozen omission; Real production access-JWT signature mutation denied401 before settings disclosure GREEN; production signed ID-token/JWKS evidence separate. | confirmed-open | Generation entropy, guessing bound and arbitrary claim forgery not proved by one mutation; pinned-provider cryptography/security review retains MUST requirement. docs/oauth-protocol-hardening.md OL13. |
| OL14 | Original claim: Resource syntax and granted-resource expansion; Technical validity / exact evidence: Valid frozen omission; Relative/fragment/foreign resource rejection and cross-client/MCP refresh expansion refusal GREEN. | confirmed-open | Omitted/default resource law still lacks a dedicated receiving case; multi-resource narrowing optional, invalid_target advised. OAuth implementation owner retains these separate clauses. docs/oauth-protocol-hardening.md OL14. |
| OL15 | Original claim: Resource metadata publication fields and routes; Technical validity / exact evidence: Valid frozen omission; Challenge-linked JSON metadata fields/API/MCP identity GREEN; implementation confirms derived host-root metadata404. | design-decision | Exact choice: provide RFC9728 host-root well-known routing outside forwarded mounts, or retain mount-only/challenge-linked discovery and state narrower profile. Maintainer decision pending, no full RFC9728 claim. docs/oauth-protocol-hardening.md OL15. |
| OL16 | Original claim: DCR defaults unknown values and consistency; Technical validity / exact evidence: Valid frozen omission; DCR malformed redirects/default auth/grant/response/unknown metadata and unknown-scope invalid_client_metadata GREEN. | fixed-now | Grant-response consistency SHOULD and optional software statements/other profiles retained for provider/client interoperability; no blanket feature mandate. docs/oauth-protocol-hardening.md OL16. |
| OL17 | Original claim: OIDC metadata production handoff and issuer law; Technical validity / exact evidence: Valid frozen omission; Real mounted OIDC issuer/endpoints/required arrays/openid/RS256/S256/public keys and actual issuance coherence GREEN, not test-only fixture. | confirmed-open | Zero-element omission, every array/default shape, trailing slash and exact Unicode/string metadata cells remain unmeasured; metadata/provider interoperability owner. docs/oauth-protocol-hardening.md OL17. |
| OL18 | Original claim: OIDC signing/JWKS production handoff; Technical validity / exact evidence: Valid frozen omission; Production RSA JWKS public-only, signed RS256 issuance/iss/aud/sub/exp/iat/nonce and wrong recipient audience GREEN; essential auth_time GREEN. | confirmed-open | Long-term subject non-reassignment, JOSE header variations, optional encryption and rollover retention require distinct lifecycle/security witnesses; provider/key owner. docs/oauth-protocol-hardening.md OL18. |
| OL19 | Original claim: OIDC request nonce and authentication parameter duties; Technical validity / exact evidence: Valid frozen omission; Unauthenticated prompt=none owner-login RED→GREEN; full prompt=login/max_age0 password resume GET302 RED→GREEN. Both now reach login form, POST, consent, callback and token200. Retained-cookie nonzero age and nonce/auth_time/advisory fields GREEN. | confirmed-open | Hint issuer/subject/expired-hint and requested-sub OP conditions still lack individual receiving laws; normal-browser auth-age test passes, legacy-only bridge age is a separate policy. OAuth identity owner. docs/oauth-protocol-hardening.md OL19. |
| OL20 | Original claim: OIDC offline consent and refresh client binding; Technical validity / exact evidence: Valid frozen omission; Hidden offline-access consent disclosure RED→GREEN; requested/absent scope, lifetime explanation, client binding and completed owner consent GREEN. | fixed-now | Native application/noncode offline profiles are conditional phase-3 interoperability duties, preserved without promising unsupported modes. docs/oauth-protocol-hardening.md OL20. |
| OL21 | Original claim: OIDC redirect status and lifetime/revocation breadth; Technical validity / exact evidence: Valid frozen omission; Actual OAuth access3599 success/3600 denial and absolute grant2591999 success/2592000 denial GREEN; visible lifetime and primary no307 flows measured. | confirmed-open | All redirect branches, inactivity schedule and deployed-host expiry remain distinct unmeasured lifecycle cells. SHOULD short/single-use advice has no universal TTL; provider/deployment owner. docs/oauth-protocol-hardening.md OL21. |
| OL22 | Original claim: Bearer challenge grammar and error distinctions; Technical validity / exact evidence: Valid frozen omission; Exact Bearer scheme/unique quoted attributes/printable syntax, absent-auth no-error, invalid401, insufficient-scope403 and metadata origin GREEN. | confirmed-open | Full malformed transport vs invalid-token detail, arbitrary grammar/URI cases and lifetime disclosure policy remain API security/interoperability cells; SHOULD guidance not silently promoted to MUST. docs/oauth-protocol-hardening.md OL22. |
| ILO01 | Technical validity: Advice accurately preserved; selected resources reject cnf. No normative requirement to add both sender-constraint mechanisms.; Evidence: Static source/options; S01-C016 SHOULD. | deferred | Separate DPoP/mTLS profile decision in docs/oauth-implementation-hardening.md; no product fix proposed. |
| ILO02 | Technical validity: Confirmed public bug on frozen path; authorization GET/OPTIONS leaked wildcard CORS.; Evidence: oauth-spec-red.log -> oauth-spec-green.log; oauth-syntax-green.log27pass. | fixed-now | Root changed endpoint CORS. Durable direct endpoint/authorization collateral test in oauth-spec.oracle.test.ts. |
| ILO03 | Technical validity: The source demands assessment, not a callback. Static lack of risk callback does not prove assessment was absent.; Evidence: Original source RFC9700§4.14.2 plus selected code/refresh options/owner approval. | deferred | Risk policy, absolute30d deadline, context-change trigger now recorded in docs/oauth-implementation-hardening.md. No fabricated scoring API. |
| ILO04 | Technical validity: Confirmed absent owner login framing while consent framing existed.; Evidence: oauth-spec-red.log -> oauth-spec-green.log; same public login path. | fixed-now | Root applied ownerpage CSP/XFO; separate consent/login receiving witnesses survive. |
| ILO05 | Technical validity: Documentation obligation cannot be represented by server code alone; frozen scan correctly retained category residue.; Evidence: Pinned provider authorize:1928 generates32ASCII letters; docs direct focused review. | fixed-now | Current size documented in docs/oauth-implementation-hardening.md; opaque client contract retained. No behavioral RED invented. |
| ILO06 | Technical validity: Frozen wrapper lacked owner guess limiter; native defaults existed but production predicate/shared storage unresolved. Raw claim was not proof all native clientauth protection absent.; Evidence: Root/hardening tests auth-deployment.oracle.test.ts and hardening-eight-green.log43pass; source enabled/database rateLimit and authoritative address. | fixed-now | Root/hardening added explicit sharednative limiter and ownerlogin admission budget. Deployment ingress trust remains operational limit. |
| ILO07 | Technical validity: Body500 confirmed; rawgeneric duplicates preserved as separate clauses. Native authduplicates exist; current wrapper handles generic singular repetition and media type.; Evidence: oauth-spec-red/green bodyerror; oauth-validation-stable.log duplicatecases pass, code/media collateral; current oauth-routes singular guard. | fixed-now | Root fixes body parsing/error envelope and cardinality. token resource repetition remains allowed. Empty/error subtype residue stays in validation oracle rather than generalized any4xx. |
| ILO08 | Technical validity: Native noStore response already supplied both headers through core; wrapper-only consent omission was real. Do not promote it into a native token endpoint bug.; Evidence: Core/api index:19–21,54; native token metadata noStore; current public consent render checks both headers. | fixed-now | Root added Pragma consent; owned test verifies sensitive custom HTML. Initial broader native-header absence refuted but surviving wrapper detail preserved. |
| ILO09 | Technical validity: Lifetime is a source SHOULD; frozen UI omitted it. CurrentUI states1h access/30d offline grant.; Evidence: Frozen template directsource; currentpublic render with/without offline scope. | fixed-now | Root UI disclosure; test checks1h always,30d only offline. An initial oracle that required30d wording for nonoffline was overstrict and corrected; no source fixedTTL mandate. |
| ILO10 | Technical validity: Confirmed malformed grammar accepted at authorize and minted tokens at exchange despite matchingS256 hash.; Evidence: oauth-implementation-red.log6syntaxfailures -> oauth-syntax-green.log27pass; public request/code/token route. | fixed-now | Root wrapper enforces43–128unreserved grammar; test hostile short/129/! plus legalneighbor. Client entropy remains separate. |
| ILO11 | Technical validity: Confirmed wellformed wrongverifier wrongenum; HTTPstatus rewrite alone insufficient.; Evidence: oauth-spec-red.log -> oauth-spec-green.log and syntax-green27pass. | fixed-now | Root specific error normalization preserves missingverifier/parser/client/grant distinctions; collateral source-bound tests. |
| ILO12 | Technical validity: 404 reproduction is true but initial fullRFC8414 expectation crossed explicit user mount-only constraint. OIDC appending is valid and selectedMCP ASdiscovery route.; Evidence: oauth-implementation-red.log hostprefix404; corrected mountedmetadata/no-root witness; official MCP test at3mounts alreadyreceives mountedOIDC. | deferred | No hostroot route added. Currentdeclared limit: RFC8414 publication convention unselected; rawsource MUST/placement remains intact for profile selection, not called satisfied. Existing mount-only/OIDC selection settles this profile choice; retain RFC8414 limit in docs/oauth-implementation-hardening.md. No new human decision is needed. |
| ILO13 | Technical validity: resource_name advice absent, while required resource field exists. Source strength RECOMMENDED does not justify mandatory authentication bug assertion.; Evidence: Frozen/current PRM JSON and RFC9728§2. | deferred | Displayname advice preserved in docs/oauth-implementation-hardening.md; noforced feature or broadfullconformance claim. |
| ILO14 | Technical validity: Derivedroute404 and challengeinterop can both be true. RFC9728§3 publicationMUST is not expressly waived by §5.1 explicitURL; conflicts with approved no-hostroot deployment boundary.; Evidence: Original rfc9728.txt:361–405; §3.3 challengeequality; §5.1 URLdefinition. Publicmountedchallenge witness passes; earlier derivedroute404 RED retained. | design-decision | Exact question: retain mountedchallenge-only profile with explicit fullRFC9728 publicationlimit, or permit fullRFC9728 derivedpublication through a compatible deployment? Root userquestionpending; no rootroute edit. |
| ILO15 | Technical validity: Confirmed unknownregistrationmetadata scope usedtoken invalid_scope rather than DCRinvalid_client_metadata.; Evidence: oauth-implementation-red.log DCRenumfail -> oauth-syntax-green.log27pass. RFC7591§3.2.2 exactenum meanings retained. | fixed-now | Root narrownormalization; ownedpositiveDCRreceiving test. Softwarestatements remain conditional, not invented. |
| ILO16 | Technical validity: Confirmed GET/password continuation loss and old-cookie freshness gap are fixed through native signed-query hooks and session adapter timestamps.; Evidence: oauth-reauthentication-green-final.log: 6 files, 119 passed; typecheck exit 0; final hashes recorded below. | fixed-now | SPA continuation, signed-query/session guards and 30-day native session configuration. Full guide continuation plus owned same-second, legacy-age, invalid-signature and cross-origin witnesses; docs/oauth-implementation-hardening.md. |
| ILO17 | Technical validity: Frozenofflineaccess hidden in permissiondialogue. Currentoffline request has explicitrenewal/30day disclosure before allow; nooffline neighbor lacks that disclosure.; Evidence: Frozen template directsource; public current consentrender witnesses; oauth-validation-stable.log initialoffline RED. | fixed-now | Root changed consenttext; ownedpositive/negative renderwitness. Doesnotrequire separatecheckbox or refreshforallfeaturecontexts. |
| ILO18 | Technical validity: Privacy SHOULD distinct from grantlisting; noownerUserInfo accesslogpipeline measured.; Evidence: Source Core§17.2 plus frozen management/routes/model absence. | deferred | Privacy/accesshistory scope and deploymentlogging assurance preserved in docs/oauth-implementation-hardening.md; no hypothetical platform bug asserted. |
| PI01 | Original claim: Same-client grants hide prior permissions and cannot revoke separately; Validity/evidence: Confirmed public RED: two explicitly approved grants, first broad token still200, list only1row; oauth-grants-red-final.log. Narrower first attempt reached auto-consent302 and was not used as evidence. GREEN oauth-grants-green2.log: list2rows, broad grant revoked401 while narrow grant remains200. | fixed-now | test/oauth-grant-list.oracle.test.ts; native authorization-code hash is grant key; manual random grant key. Native refresh preserves family. App tombstones apply independently, revoke-all epoch applies without disabling legitimate future client grants. |
| PI02 | Original claim: Forwarded native UserInfo misses owner revocation; Validity/evidence: Confirmed public RED oauth-userinfo-red.log: valid openid token UserInfo200 before and after owner grant DELETE. GREEN oauth-userinfo-green.log: same request becomes401afterrevoke; other grant remains200. | fixed-now | test/oauth-grant-list.oracle.test.ts; forwarded UserInfo requires live app grant and retains native OIDC scope checks. Introspection's native authenticated result gets app-active check for JWT; exact introspection regression test pending. |
| PI03 | Original claim: Old root cookie remains able to mint grants after owner password reset; Validity/evidence: owner-reset-red.log: mint200 after reset; same probe owner-reset-green.log returns401; auth collateral9 passed | fixed-now | test/owner-reset.oracle.test.ts; src/auth.ts; docs/client-access.md |
| PI04 | Original claim: Browser form Origin is suppressed by no-referrer policy; Validity/evidence: Actual desktop/mobile login POST Origin:null returns403. Same-origin policy preserves origin and suppresses external callback Referer; browser final results recorded below. | fixed-now | src/spa.ts; src/oauth-routes.ts; e2e/client-access.spec.ts |
| PI05 | Original claim: Manual credential registration fails at local HTTP loopback; Validity/evidence: Browser public mint500 with native invalid_redirect_uri for web loopback callback. Select native registration on exact loopback hosts; deployed web profile unchanged. | fixed-now | src/authorization-api.ts; e2e/client-access.spec.ts |

## Raw registered claims and append-only evidence

The following is the original task ledger. Earlier statuses are historical; the table above gives the final disposition.

# Append-only review ledger

Starting HEAD: b88a0f34dfe6860c100322438552058945d0c8c4.
Reviewed candidate is the uncommitted snapshot at candidate/, not a claim about committed HEAD. File hashes are in manifest.json; manifest digest is 5eda53b131c633b7d5bc135c29e504a65f3586c54aeb24060788faa99bd33c3c.

Raw inputs will be the oracle-only loss audit followed by the implementation-only loss audit. Every explicit recovered item gets a source-order ledger ID before a probe or edit. Original claim and proposed repair remain immutable; verdict updates append evidence instead of replacing original text. Technical validity, PR action, and surviving test/documentation value are separate. Source requirements not recovered remain accounted for in per-source scan coverage maps.

Unchanged baseline: 86 Worker test files passed, 850 tests passed, five existing skips. Command: WRANGLER_LOG_PATH=/private/tmp/blygger-oauth-wrangler.log npx vitest run --maxWorkers=2. Output: baseline-tests.log. This establishes a baseline only; it does not verify any audit finding.

## Raw oracle-hardening items (immutable claim record)

No proposed fix was supplied by this assay. All rows are coverage observations, not product bug claims. Severity is unassigned until evaluation. Candidate identity: frozen manifest above.

| ID | Original source/support | Original omitted boundary / vanish point | Original inferred reduction rule | Initial status |
| --- | --- | --- | --- | --- |
| HL01 | H03, S01 Rate Limiting | Threshold/reset/global dependence; E01/E03 success-only registration/exchange checkpoints | Legal-flow success displaces abuse counters  unverified |
| HL02 | H04/P03, S01 Revoke Endpoint + pinned artifact lines3420–3459 | Native JWT revoke and refresh-only vs client-wide state; E01 combines operations before dead-token check | Composite revocation compressed into one dead-token result  unverified |
| HL03 | H05, S01 schema/assertion sections | Failure/upgrade migration boundary (applicable) and private assertion race (conditional); E02 clean setup | Setup success stands for lifecycle; optional grant not represented  unverified |
| HL04 | H07/P01, S02 Storage + module-map artifact | Isolate/shared persistence and limiter schema; E07 factory and E09 unrelated restart data | Runtime storage topology mismatched to protocol fixture  unverified |
| HL05 | H09, S02 introduction | Production enablement/auth.api bypass; E02 mixed HTTP/server API driver | Test-mode calls collapse execution context  unverified |
| HL06 | H10, S02 IP sections | Spoof/chain/IPv6 bypass; E01/E03 plain requests | Network identity omitted from legal protocol grammar  unverified |
| HL07 | H11, S03 Cookies/Disabling Checks/Trusted Origins | Native-cookie flags/domain and native origin branches; E04 owner cookie plus E01 cookie-presence checkpoint | Wrapper and native credentials share one coverage category  unverified |
| HL08 | H12, S03 Proxy Headers/Secret Rotation | Forged forwarded host/proto and purpose-cutover pendingflow failure; E02 static URL/secret | Fixed fixture removes deployment/key-transition branches  unverified |
| HL09 | H33, S04 baseURL/basePath | Incoming-host inference/path override; E01 mounted literals | Ordinary mounted path success compresses trust resolution  unverified |
| HL10 | H35, S04 secret/secrets | Missing secret and encryption-key/legacy rotation; E06 root/password invalidation | Application revocation substituted for encryption lifecycle  unverified |
| HL11 | H14/P04, S05 Technical Details + consume artifact | Parallel same-code exchange; E03 awaits each request | Sequential history excludes race interleavings  unverified |
| HL12 | H15, S06 batch | Rollback and multi-call atomicity boundary; E08 successful migration batches | Happy setup outcome omits error transaction contract  unverified |
| HL13 | H17, S07 Concurrency/throughput | Auth load/queue overload; E01/E03 local low-volume flows | Operational load falls outside credential state model  unverified |
| HL14 | H18, S07 table/FAQ | Auth D1 work/resource quotas and recovery retention; E08/E09 happy local storage | Persistence functionality compresses platform limits  unverified |
| HL15 | H21, S09 APIs/polyfills | Unsupported-method behavior and deployed runtime; E07/E08 selected local code paths | Passing smoke paths generalized beyond invoked APIs  unverified |
| HL16 | H23, S10 limits | Fullbundle/startup/memory/CPU/request/connection ceilings; E07 isolated bytes/E08 local smoke | Size print/basic execution substituted for resource-boundary observations  unverified |
| HL17 | H36, S10 diagnostics | Startup profiling/streaming-pressure diagnostics; E07 bundle print | Single diagnostic displaces distinct runtime diagnostics  unverified |
| HL18 | H24, S11 Redirect/Injection | Authorization redirect filter attacks; E03 exchange-only changed redirect | Later codebinding covers a different redirect phase  unverified |
| HL19 | H25, S11 PKCE/Consent/Clickjacking | Omitted/empty challenge/verifier, wrong-valid-code verifier, native consent tampering/iframe attack; E03 wrong-string verifier/CSP | One mismatch stands for downgrade matrix; header stands for browser behavior  unverified |
| HL20 | H26, S11 Token Lifetime | Issued OAuth token expiry and replay-descendant invalidation; E06 manual 30-day clock/E03 deniedancestor only | Credential kinds and refresh outcomes compressed  unverified |
| HL21 | H28, S12 events/attributes | Security event inventory/fields; E02 path/status debug capture | Test request trace conflated with audit events  unverified |
| HL22 | H29, S12 Data to exclude | Token/session/key redaction; E10 config secrecy only | Secret storage advice treated as complete secrecy boundary  unverified |
| HL23 | H30, S12 Event collection | Log injection encoding and loggingfailure isolation; no relevant witness | Operational logging behavior outside auth decisions  unverified |
| HL24 | H31, S12 Verification | Log resource/failure/accesscontrol/userblock tests; no relevant witness | Log pipeline excluded from bounded auth test vocabulary  unverified |

## Raw oracle-guide-loss.md items (immutable)

No repairs proposed; initial status unverified. The exact raw text is preserved below.

### G01 — Storage grammar ablation and exclusion did not survive into the evidence

- **Source requirement/support:** ORC-004, frozen guide:87–104. A generated legal grammar must account for reconstruction, ablation, range and exclusion. Its acceptance evidence accounts for each semantic axis/rule/overlap and names a nearby invalid state/history the grammar rejects.
- **Absent observation:** The storage property has `put/delete/advance`, six key forms, values −10…10, TTL null/1/60/600, five time steps, and histories 1…18 (`test/oauth-storage.oracle.test.ts:13`). Its fixed history demonstrates reconstruction, punctuation, overwrite, delete, pagination and adjacent expiry (:47–48). No inspected comment, control, or review entry accounts for that grammar's ablations or gives a nearby invalid storage input/history rejected by its grammar. The authorization model's negative-clock/empty-scope controls do not belong to the storage grammar.
- **Where it vanished:** The record's grammar section is entirely the credential grammar (`docs/auth-oracles.md:15–19`), then its grouped ORC-001–005 outcome credits bounded grammar controls (:23). The storage reconstruction example and bounds reached code, but its other required controls did not reach that record.
- **Reduction rule:** **Inferred cause: compression/category mismatch.** One generated grammar's control paragraph appears to carry the grouped guide outcome for a second grammar with different legal inputs. This is an inference from the surviving evidence, not author intent.

### G02 — Captured seed/path failure is not checked through the actual replay interface

- **Source requirement/support:** ORC-007, frozen guide:131–149. Acceptance evidence includes a checked replay command reproducing a captured seed-and-path failure. Campaign parity and a configured replay registry are separate evidence.
- **Absent observation:** `test/oracle-replay.test.ts:4–12` captures and replays a deliberately wrong array-of-integers property by calling `fc.check` directly. It never reaches `campaign`, Vite's injected inputs, target selection, or an authorization/storage production checkpoint. `docs/auth-oracles.md:53` reports a successful direct authorization replay at seed 20261001/path 0; that is not a captured failed auth/storage history reproduced through the interface. No such checked command/result is retained in the inspected files.
- **Where it vanished:** The record moves from pending “replay proof” (:25) to a successful interface replay plus a library-level counterexample calibration (:53). Those two observations do not retain the requested interface-level failure reproduction.
- **Reduction rule:** **Inferred cause: category mismatch/compression.** Proof that fast-check replays and proof that this suite selects a successful replay were combined into a stronger failure-reproduction claim. No `fc.commands` replayPath omission is alleged; these histories are arrays.

### G03 — Closing MCP resources can erase the primary failure or skip a release

- **Source requirement/support:** ORC-010, frozen guide:173–186. When cleanup can replace a failure, preserve the original law/checkpoint, retain distinguishable secondary cleanup diagnostics, and release resources. AggregateError is one permitted representation, not a mandatory format.
- **Absent observation:** Production receiving discovery closes `client` then `transport` in one finally at `test/mcp.oracle.test.ts:81`. If the first close rejects after a checkpoint failure, JavaScript replaces that primary exception and does not reach the second close. The other MCP finally blocks (:88,105) and test-only Better Auth finally (`better-auth.oracle.test.ts:67`) also do not preserve an earlier mismatch separately if close rejects. There is no secondary-diagnostic capture around these closes. This is a static failure-path observation, not evidence that a close failed during a recorded run.
- **Where it vanished:** The campaign preserves mismatch/reduction errors (`test/oracle-campaign.ts:20–37`), and the review's ORC-008–010 entry credits clock finally cleanup (`docs/auth-oracles.md:26`). Receiving-test resource cleanup lies outside that aggregate capture. The primary/secondary distinction does not survive those finally blocks.
- **Reduction rule:** **Inferred cause: category mismatch/low salience.** Clock restoration and shrink capture were treated as the cleanup/fidelity account, while resource-close failure paths remained a different owner. The code does not establish why that reduction was chosen.

### G04 — New-oracle review record lacks concrete outcomes for the recovered gaps and trigger limits

- **Source requirement/support:** ORC-012, frozen guide:203–227. A new/repaired oracle's review evidence records every other applicable numbered requirement and identifies non-applicable requirements with trigger-based reasons. Comprehensive closure is a separate conditional obligation.
- **Absent observation:** `docs/auth-oracles.md:23–30` credits ORC-001–005 and ORC-008–010 as groups, and :42–79 records subsequent checks. It does not identify G01's storage controls, G02's interface failure-replay limit, or G03's close-error paths as unresolved, nor distinguish ORC-004's generated properties from fixed bounded cases or ORC-011's conditional trigger. Its explicit pending final audit (:81–83) is preserved; it is not converted into a false completed audit claim.
- **Where it vanished:** Source-level obligations were compressed into grouped initial statuses. Later chronological result paragraphs supersede individual old gaps, but no consolidated requirement/trigger map remains for the new-oracle claim.
- **Reduction rule:** **Inferred cause: compression.** The result log retains executions and honest broad limits while dropping requirement-by-requirement distinctions. This is evidence structure loss, not a claim that the executions did not occur.


## Raw oracle-mcp-loss.md items (immutable)

No repairs proposed; initial status unverified. The exact raw text is preserved below.

### ML01 — Version publication/per-request behavior

- **Source IDs/support:** M001, M003; [S1 / M001 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning); [S1 / M003 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M001: Current=2026-07-28; Draft=in-progress; Final=past/frozen; current can receive compatible updates.; M003: Current requests declare body protocol version and HTTP mirror; unsupported-version response lists supported versions.
- **Missing tested boundary:** No named protocol-version identity or unsupported-version receiving assertion; package version and ordinary client success do not establish this boundary.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — happy-path interoperability compression. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML02 — AS security breadth

- **Source IDs/support:** M006; [S2 / M006 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M006: OAuth2.1 security for public/confidential clients. #overview
- **Missing tested boundary:** Public authorization-code success and wrong verifier are reached; confidential-client authentication and public missing/downgraded challenge rejection are not named receiving cases. Broad OAuth2.1 mandate remains wider than grammar.
- **Where it vanished:** oauth-flow.oracle:25–39,60–71.
- **Reduction rule:** Inferred — bounded public-client/code-input grammar. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML03 — Production protected-resource metadata/challenge

- **Source IDs/support:** M007, M068, M070; [S2 / M007 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview); [S4 / M068 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery); [S4 / M070 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M007: PRM; AS offers OAuth metadata or OIDC discovery. #overview; M068: PRM authorization_servers has at least one AS.; M070: Offer challenge resource_metadata OR well-known PRM.
- **Missing tested boundary:** Real official client reaches authorization and tool call; production PRM authorization_servers content and malformed/absent metadata challenge are not directly asserted. Fixture metadata in BetterAuthDriver:54 cannot supply production coverage.
- **Where it vanished:** mcp.oracle:63–80; better-auth-driver:54–57.
- **Reduction rule:** Inferred — implicit successful discovery substituted for explicit metadata contract. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML04 — Scope challenge content

- **Source IDs/support:** M008, M019, M065; [S2 / M008 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#scope-selection-strategy); [S2 / M019 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#runtime-insufficient-scope-errors); [S3 / M065 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M008: Scope challenge. #scope-selection-strategy; M019: Precise complete operation scope challenge, consistent strategy. #runtime-insufficient-scope-errors; M065: Precise scope challenges
- **Missing tested boundary:** REST status/challenge checks assert resource_metadata and insufficient_scope text, but not exact complete required scope set nor MCP operation-specific 403 challenge.
- **Where it vanished:** authorization.oracle:75–79; mcp.oracle:83–89.
- **Reduction rule:** Inferred — decision/status projection drops scope payload. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML05 — AS response issuer advertisement/errors

- **Source IDs/support:** M011; [S2 / M011 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#authorization-response-validation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M011: Record validated issuer with verifier/state; AS SHOULD emit iss, MUST advertise when emitted. #authorization-response-validation
- **Missing tested boundary:** Production approval asserts iss equals mounted issuer; denial asserts error/no code but not iss; production AS advertisement is not asserted. Client issuer validation parts are outside scope.
- **Where it vanished:** oauth-flow.oracle:49,58.
- **Reduction rule:** Inferred — success callback projection. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML06 — MCP invalid/expired/foreign token receiving boundary

- **Source IDs/support:** M016; [S2 / M016 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#token-handling). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M016: Validate intended audience; invalid/expired=401; no foreign tokens. #token-handling
- **Missing tested boundary:** Wrong audience is asserted at production MCP; valid OAuth getSettings succeeds. Exact-expiry oracle judges REST requests, and altered signature/wrong verifier audience checks reside in test-only driver. Production MCP expired/signature/foreign-issuer negative distinctions remain absent.
- **Where it vanished:** authorization.oracle:61–65,74–87; mcp.oracle:74–75; better-auth.oracle:51–55.
- **Reduction rule:** Inferred — REST/fixture token checks substituted for MCP negative matrix. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML07 — Refresh confidentiality and RS offline_access challenge

- **Source IDs/support:** M017; [S2 / M017 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#refresh-tokens). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M017: Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens
- **Missing tested boundary:** Rotation is observed, but token confidentiality in storage/transit and production PRM/challenge omission of offline_access have no oracle assertion. Client grant metadata duties excluded.
- **Where it vanished:** oauth-flow.oracle:84–96; better-auth-driver:54.
- **Reduction rule:** Inferred — rotation observation drops metadata/storage boundary. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML08 — MCP malformed/insufficient-scope HTTP decisions

- **Source IDs/support:** M018; [S2 / M018 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#error-handling). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M018: Appropriate 401/403/400. #error-handling
- **Missing tested boundary:** Production REST observes scope403 and OAuth bad-input400; valid MCP scopes affect listTools. No explicit malformed-auth MCP400 versus MCP403 challenge witness.
- **Where it vanished:** authorization.oracle:75–79; mcp.oracle:83–89.
- **Reduction rule:** Inferred — REST status equivalence assumed for unobserved MCP response. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML09 — Scope hierarchy at RS

- **Source IDs/support:** M020; [S2 / M020 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#step-up-authorization-flow). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M020: Step-up limits/scope union; RS MUST account for hierarchy. #step-up-authorization-flow
- **Missing tested boundary:** All15 literal scope subsets have inventories; reference judge is exact membership. No wider-implies-narrower scope hierarchy premise or RS negative/positive law. Client step-up duties outside scope.
- **Where it vanished:** mcp.oracle:83–89; auth-oracle-model:23.
- **Reduction rule:** Inferred — literal-set grammar excludes hierarchy. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML10 — Every inbound request despite application handles

- **Source IDs/support:** M049; [S3 / M049 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#state-handle-hijacking). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M049: Verify every inbound request
- **Missing tested boundary:** Production client tool success and revocation rejection are reached, but no raw unauthorized second/parallel MCP request witness. Handle-specific possession/random/principal clauses remain feature-conditional.
- **Where it vanished:** mcp.oracle:74–75,103–104.
- **Reduction rule:** Inferred — connection/client-level happy path replaces per-request matrix. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML11 — Scope-minimization advice

- **Source IDs/support:** M062, M063, M064, M066; [S3 / M062 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M063 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M064 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M066 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M062: Minimal initial scope set; M063: Incremental elevation; M064: Downscope tolerance; M066: Correlated elevation logs
- **Missing tested boundary:** No oracle receives minimal baseline versus elevated scope behavior, acceptance of reduced-scope issued token, or correlated elevation events. Static all-scope OAuth client and exact subset inventories cover different observations. This is advice recovery, not a MUST finding.
- **Where it vanished:** mcp.oracle:54,83–89.
- **Reduction rule:** Inferred — fixed capabilities substitute for progressive authorization/observability. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML12 — Token storage confidentiality

- **Source IDs/support:** M086; [S6 / M086 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#token-theft). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M086: Secure token storage; OAuth2.1 security. #token-theft
- **Missing tested boundary:** Oracle storage checks string-record expiry and pagination; no secrecy or absence of raw tokens in persistence/log/error outputs is asserted.
- **Where it vanished:** oauth-storage.oracle:23–41.
- **Reduction rule:** Inferred — storage functional model omits secrecy. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML13 — HTTPS and redirect-scheme boundary

- **Source IDs/support:** M089; [S6 / M089 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#communication-security). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M089: HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security
- **Missing tested boundary:** All protocol fixtures use HTTPS; no public rejection of non-loopback HTTP endpoints/redirect schemes. Localhost/native exceptions require separate conditional handling.
- **Where it vanished:** oauth-flow.oracle:15–17,25; mcp.oracle:51.
- **Reduction rule:** Inferred — safe URL constants erase insecure-input boundary. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML14 — Production discovery PKCE advertisement

- **Source IDs/support:** M091; [S6 / M091 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M091: OIDC metadata advertises challenge methods; C refuses absent field in either discovery style. Same section.
- **Missing tested boundary:** PKCE method metadata is asserted only in BetterAuthDriver-based fixture; production client handshake depends on it but does not assert exact advertised methods or negative capability behavior. Client refusal duty outside scope.
- **Where it vanished:** better-auth.oracle:17; better-auth-driver:18–42; mcp.oracle:63–80.
- **Reduction rule:** Inferred — provider-spike metadata projection mistaken for production handoff. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML15 — Authorization redirect validation/trust

- **Source IDs/support:** M092, M094; [S6 / M092 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#open-redirection); [S6 / M094 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M092: Registered exact redirect validation. #open-redirection; M094: Precautions for untrusted redirect; trust before automatic redirect; user warning allowed. Same section.
- **Missing tested boundary:** Changed redirect is rejected at code exchange; no authorization-endpoint altered/unregistered URI case or public invalid-request redirect escape observation. Valid consent/approval exists.
- **Where it vanished:** oauth-flow.oracle:30–39,60–71.
- **Reduction rule:** Inferred — token-exchange check substituted for authorization redirect gate. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML16 — Before-data-release token validation/no passthrough

- **Source IDs/support:** M099; [S6 / M099 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#access-token-privilege-restriction). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M099: Validate before processing/returning data; audience binding; separate upstream token; no passthrough. #access-token-privilege-restriction
- **Missing tested boundary:** Wrong resource401 is checked before a useful MCP body. No protected-result negative test with foreign issuer/signature or observation that inbound token is not forwarded. Upstream-api portions are conditional, not assumed present.
- **Where it vanished:** authorization.oracle:61–65; mcp.oracle:74–75; better-auth.oracle:51–55.
- **Reduction rule:** Inferred — audience/status witness compresses distinct recipient/data-release boundaries. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML17 — HTTP endpoint/messaging rules

- **Source IDs/support:** M100, M103; [S7 / M100 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); [S7 / M103 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#sending-messages). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M100: Single POST endpoint. Intro.; M103: New POST per single request/notification; Accept JSON+SSE; 202 empty notifications; JSON-or-SSE response. #sending-messages
- **Missing tested boundary:** Official client tool success observes normal POST path. No raw receiving matrix for wrong method, batched/response body, notification202 empty, Accept negotiation, or JSON/SSE alternatives.
- **Where it vanished:** mcp.oracle:59–80,91–105.
- **Reduction rule:** Inferred — SDK constructs only conforming happy messages. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML18 — MCP Origin/DNS-rebinding gate

- **Source IDs/support:** M101; [S7 / M101 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#security--endpoint). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M101: Validate Origin; invalid present Origin=403. #security--endpoint
- **Missing tested boundary:** Cross-origin consent and REST-cookie writes are denied; no Origin-at-MCP valid/invalid/absent tests. Different HTTP surface cannot establish this gate.
- **Where it vanished:** oauth-flow.oracle:55; authorization-boundaries:33–40.
- **Reduction rule:** Inferred — category mismatch between CSRF and MCP Origin checks. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML19 — Every MCP connection authentication

- **Source IDs/support:** M102; [S7 / M102 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M102: Localhost bind; authenticate connections. Same section.
- **Missing tested boundary:** Valid client tool and revoke-denied tool exist, but no raw second-request/stream request with omitted or invalid authorization. Local bind obligation outside remote Worker role.
- **Where it vanished:** mcp.oracle:74–75,103–104.
- **Reduction rule:** Inferred — connected-client success collapses per-request authorization. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML20 — SSE lifecycle/cancellation advice and rules

- **Source IDs/support:** M104, M105, M106; [S7 / M104 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#receiving-messages); [S7 / M105 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); [S7 / M106 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#cancellation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M104: Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages; M105: No-buffer header; keepalive comments; no resumption. Same section.; M106: Disconnect=cancellation; stop soon; no further messages. #cancellation
- **Missing tested boundary:** No oracle observes request-related-only streamed notifications, forbidden server requests, final termination, buffering/keepalive behavior, or disconnect cancellation/no further messages. Conditional notification/subscription features must first be identified; basic streaming response remains a supported HTTP alternative.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — completed-result projection drops streaming lifetime. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML21 — Header/body routing and version validation

- **Source IDs/support:** M107, M108, M110, M111; [S7 / M107 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#protocol-version-header); [S7 / M108 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#standard-request-headers); [S7 / M110 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#value-encoding); [S7 / M111 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#server-validation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M107: Version header/body match; unknown-version 400 supported list; method-not-found 404/-32601. #protocol-version-header; M108: Required Method/Name; safe encoding/decoded comparisons. #standard-request-headers; M110: Encoding, sentinel ambiguity, omitted/null values, invalid-character and mismatch rejection. #value-encoding; M111: 400/-32020 validation; numerical integers; intermediaries verify validation-capable version. #server-validation
- **Missing tested boundary:** No raw mismatch/missing/invalid header tests for protocol, method/name, encoding/sentinel, decoded comparison, or 400/-32020; no unsupported-version supported-list or RPC404/-32601 witness. Custom parameters are conditional, not assumed.
- **Where it vanished:** mcp.oracle:59–80; targeted search found no named headers.
- **Reduction rule:** Inferred — SDK-generated happy headers erase contradictory envelope/body cases. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML22 — Modern-only legacy traffic/fallback boundary

- **Source IDs/support:** M112; [S7 / M112 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#backward-compatibility). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M112: Inspect modern errors before legacy fallback; modern-only GET/DELETE405, ignore session/resumption headers. #backward-compatibility
- **Missing tested boundary:** No GET/DELETE/session/resumption receiving tests; version capability scope not explicitly declared. Legacy support is not assumed, and full old revision obligations are excluded.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — one ecosystem client path drops era-boundary traffic. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML23 — Independent conformance/scoring limits

- **Source IDs/support:** M124, M125, M126, M127, M128, M129, M130; [S11 / M124 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M125 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M126 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M127 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M128 section](https://github.com/modelcontextprotocol/conformance#expected-failures); [S11 / M129 section](https://github.com/modelcontextprotocol/conformance#expected-failures); [S11 / M130 section](https://github.com/modelcontextprotocol/conformance#running-against-an-sdk-at-a-specific-ref). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M124: Independent wire capture and scenario checks; client/server modes are separate.; M125: --requirements revision freezes release requirements; --suite/--spec-version selects evolving suites.; M126: Requirement sets deliberately omit AS scenarios; MCP AS implementation is beyond own role scope.; M127: not_scored: extension, added-after-release, pending reference fixture; reports still show them.; M128: Baseline failure remains requirement failure even if CI exit0; stale baseline pass exits1.; M129: Per-check baseline narrower than whole scenario; repeated IDs collapse; skipped checks differ from reached checks.; M130: List scenarios; auth/client metadata/DCR examples; test exact SDK ref and each mode.
- **Missing tested boundary:** No checked-in MCP conformance requirement-set run, wire report, named scenario inventory, role split, or explicit baseline/not_scored accounting. Test-only spike and local oracle campaign are different tools; AS conformance deliberately exceeds core MCP requirement scope. These are testing ideas/boundaries, not universal test mandates.
- **Where it vanished:** package.json:scripts; docs/auth-oracles current verification; docs/testing.
- **Reduction rule:** Inferred — local pass counts compress ecosystem/scoring distinctions. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML24 — Server/transport request isolation

- **Source IDs/support:** M132; [S12 / M132 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M132: One server/transport per request; already-connected Server.connect rejects.
- **Missing tested boundary:** No public concurrent distinct-token request test that distinguishes responses/transport ownership; ordinary sequential calls and tool inventories do not witness cross-client isolation.
- **Where it vanished:** mcp.oracle:83–105.
- **Reduction rule:** Inferred — sequential receiving grammar omits overlap. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

### ML25 — Large single-event SSE processing boundary

- **Source IDs/support:** M136; [S12 / M136 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M136: eventsource-parser>=3.0.8, large SSE performance fix.
- **Missing tested boundary:** No large-event receiving/endurance witness or named parser-version assertion. Release guidance concerns clients; retained only as optional interoperability test idea, not Worker AS obligation.
- **Where it vanished:** mcp.oracle:59–80; package.json.
- **Reduction rule:** Inferred — small normal-result projection. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.


## Raw oracle OAuth items (immutable)

No repairs proposed; initialstatusunverified. Originalsourceclaims/applicability remainbelow.

### OL01 — Redirect registration and authorization error boundaries

**Original support and every preserved detail:**

- **S01-C001** — [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); authority **MUST / MUST NOT**; trigger: redirect flows. Compare registered redirect URIs by exact string, with only the native loopback port exception. Boundary: No optional feature mandate inferred.
- **S01-C002** — [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); authority **MUST / MUST NOT**; trigger: redirect flows. Do not expose open redirectors on the authorization server or client. Boundary: No optional feature mandate inferred.
- **S01-C003** — [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); authority **MUST / MUST NOT**; trigger: redirect flows. Avoid forwarding owner credentials when redirecting a request that may contain them. Boundary: No optional feature mandate inferred.
- **S01-C026** — [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); authority **MUST NOT**; trigger: authorization response redirects. Forbid http redirects except native loopback-interface redirects. Boundary: Not a ban on native private schemes addressed by S11.
- **S01-C035** — [S01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2); authority **MUST**; trigger: registered-client redirect can facilitate phishing. Authenticate owner first; prompt for credentials when needed, except silent authentication; take precautions against redirect phishing. Boundary: Existing authenticated session can satisfy owner authentication.
- **S01-C036** — [S01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2); authority **SHOULD**; trigger: automatic redirect after authorization. Automatically redirect only to trusted URI; may warn owner for untrusted URI. Boundary: Risk-based trust, not compulsory permanent allowlist in source.
- **S01-C037** — [S01 §4.12](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.12); authority **MUST NOT / SHOULD**; trigger: request can contain owner credentials. Do not use 307 redirects; prefer 303 for HTTP redirection. Boundary: Broader OIDC 307 rule in S09.
- **S02-C018** — [S02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2); authority **MUST**; trigger: redirect URI. Require absolute URI with no fragment. Boundary: No optional feature mandate inferred.
- **S02-C019** — [S02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2); authority **MUST**; trigger: redirect URI. Retain redirect URI query parameters when adding response. Boundary: No optional feature mandate inferred.
- **S02-C022** — [S02 §3.1.2.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.4); authority **MUST NOT; SHOULD**; trigger: missing/invalid/mismatched redirect. Do not redirect to invalid URI; inform owner. Boundary: Error must not become open redirect.
- **S02-C036** — [S02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1); authority **MUST NOT**; trigger: invalid/missing client ID or redirect URI. Do not automatically redirect on invalid client/URI. Boundary: Other errors returned to validated client redirect.
- **S02-C037** — [S02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1); authority **REQUIRED / syntax**; trigger: authorization errors. Return error and exact state when supplied; enforce ASCII error/description and URI-reference character syntax. Boundary: error_description/error_uri optional.

**Promised/measured observation:** oauth-flow.oracle.test.ts:29-30 uses one registered HTTPS callback; :49 matches origin/path/state; :59-71 mutates redirect at token exchange, not authorization; :55 cross-site consent. No query-bearing callback witness.

**Unmeasured observation / where vanished:** Authorization-time unregistered redirect, exact query/path/case/slash matching, absolute/no-fragment policy, arbitrary remote HTTP, safe local error without Location, state echo on all denial/errors and credential-preserving redirect status are unmeasured. Successful callback status302 is observed but does not establish every redirect status/input case.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL02 — PKCE downgrade and parser boundaries

**Original support and every preserved detail:**

- **S01-C007** — [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); authority **MUST**; trigger: authorization code / PKCE. Bind each transaction-specific challenge or OIDC nonce to the client and user agent. Boundary: No optional feature mandate inferred.
- **S01-C010** — [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); authority **MUST**; trigger: authorization code / PKCE. Reject a verifier at token exchange if authorization contained no challenge. Boundary: No optional feature mandate inferred.
- **S01-C011** — [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); authority **MUST**; trigger: authorization code / PKCE. Provide a detectable PKCE capability. Boundary: No optional feature mandate inferred.
- **S01-C012** — [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); authority **RECOMMENDED / MAY**; trigger: PKCE capability publication. Publish code_challenge_methods_supported in AS metadata; deployment-specific detection is permitted. Boundary: Metadata field is recommended; capability detection mandatory.
- **S03-C001** — [S03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1); authority **syntax / SHOULD**; trigger: PKCE verifier. Use 43–128 unreserved characters (ALPHA / DIGIT / - . _ ~). Boundary: No optional feature mandate inferred.
- **S03-C004** — [S03 §4.3](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.3); authority **REQUIRED / default**; trigger: PKCE authorization request. Include challenge; omitted challenge method defaults to plain; challenge syntax 43–128 unreserved characters. Boundary: Source default does not force new deployments to offer plain.
- **S03-C006** — [S03 §4.4](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4); authority **MUST / MUST NOT**; trigger: PKCE code issuance. Do not expose challenge in code/client requests in extractable form. Boundary: No optional feature mandate inferred.
- **S03-C007** — [S03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1); authority **MUST**; trigger: PKCE required but challenge absent. Return invalid_request; explain reason as SHOULD. Boundary: PKCE policy trigger retained.
- **S03-C008** — [S03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1); authority **MUST**; trigger: challenge method unsupported. Return invalid_request; explain reason as SHOULD. Boundary: Do not fall back silently to another method.
- **S03-C009** — [S03 §4.5](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.5); authority **REQUIRED / MUST**; trigger: PKCE exchange. Require verifier and use code-bound challenge method. Boundary: Not a free choice of method at exchange.
- **S03-C010** — [S03 §4.6](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6); authority **MUST**; trigger: verifier check. Correct match continues normal processing; mismatch returns invalid_grant. Boundary: Matching verifier does not bypass other token validation.

**Promised/measured observation:** oauth-flow.oracle.test.ts:27-30 uses a single valid verifier/challenge/S256; :59-71 wrong verifier returns400 without token. better-auth.oracle.test.ts:17 detectsS256 only on alternatefixture.

**Unmeasured observation / where vanished:** No missing challenge/verifier, unsolicited verifier, unsupported/missing method, verifier/challenge syntax length/charset boundaries, challenge exposure or transaction-constant behavior observations. Error JSON is read only for diagnostic status; invalid_grant/invalid_request spelling not asserted. Production PKCE metadata detection field not asserted.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL03 — Access token sender constraints and password-grant prohibition

**Original support and every preserved detail:**

- **S01-C016** — [S01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1); authority **SHOULD**; trigger: AS and resource server. Use sender-constrained access tokens such as DPoP or mTLS. Boundary: Do not elevate to MUST or require both mechanisms.
- **S01-C023** — [S01 §2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.4); authority **MUST NOT**; trigger: password grant. Do not use the resource-owner-password grant. Boundary: Owner login at AS is not this OAuth grant.

**Promised/measured observation:** All tests send ordinary header bearer; oauth-flow.oracle.test.ts token grant literals only code/refresh.

**Unmeasured observation / where vanished:** No sender-constraint policy/deployment rationale recorded; password-grant refusal unmeasured. Sender constraints are SHOULD and do not impose DPoP/mTLS implementation. Password grant source MUSTNOT preserved without runtime bug claim.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL04 — Refresh replay family invalidation and lifetime

**Original support and every preserved detail:**

- **S01-C017** — [S01 §2.2.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.2); authority **MUST**; trigger: refresh tokens for public clients. Use sender constraints or rotation. Boundary: No requirement to issue refresh tokens.
- **S01-C042** — [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); authority **MUST + specified rotation mechanism**; trigger: public-client refresh replay protection uses rotation. Issue replacement each refresh; invalidate previous; retain relationship; detected reuse revokes active refresh token. Boundary: Rotation is an alternative to sender constraints; no prescribed storage transaction mechanism or grace interval.
- **S01-C044** — [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); authority **MAY / SHOULD**; trigger: refresh tokens. May revoke after security events; should expire after inactivity at AS-selected interval. Boundary: No fixed TTL or mandatory logout revocation in this section.
- **S02-C053** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Require grant_type=refresh_token and refresh_token in UTF-8 form POST. Boundary: No optional feature mandate inferred.
- **S02-C054** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Do not expand beyond original scope; omitted scope equals original. Boundary: No optional feature mandate inferred.
- **S02-C057** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Validate refresh token. Boundary: No optional feature mandate inferred.
- **S02-C058** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Replacement refresh token preserves refresh scope. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** oauth-flow.oracle.test.ts:84-98 observes replacement differs, advances replacement then old-token400, scope unchanged and escalation400, right REST200/wrong MCP401. Comment:89-90 permits immediate previous token until replacement use. Code reuse then grant401 is separate :99-102.

**Unmeasured observation / where vanished:** After old refresh replay400, active successor refresh is never submitted and descendant access is not tested for replay-triggered revocation. Immediate predecessor retry window not exercised despite comment. Omitted-refresh-scope semantics, client substitution on refresh, unknown/expired refresh and exact refresh lifetime/inactivity boundary absent. Refresh model/reference missing; no parallel replay probes run.

**Reduction rule:** known: auth-oracles.md Model state explicitly excludes refresh rotation from credential model; inferred: rejection/status and token-string inequality compress family history/replay outcome. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL05 — Source S01 remaining baseline detail

**Original support and every preserved detail:**

- **S01-C025** — [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); authority **RECOMMENDED**; trigger: AS/client discovery. Publish and use AS metadata. Boundary: §8414 duties conditional on metadata support.
- **S01-C027** — [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); authority **MAY / MUST NOT**; trigger: browser endpoint access. CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. Boundary: Cross-origin navigation is distinct from CORS.

**Promised/measured observation:** Relevant production protocol/credential tests and docs were inspected; no distinguishing assertion for this full source row was found.

**Unmeasured observation / where vanished:** The exact source clauses listed below are unmeasured in the frozen oracle reduction; related happy-path examples do not establish full law.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL06 — Deployment threat model and secret transport/storage

**Original support and every preserved detail:**

- **S01-C028** — [S01 §3](https://www.rfc-editor.org/rfc/rfc9700.html#section-3); authority **MUST**; trigger: deployment threat model. Account for every attacker type possible in the deployment. Boundary: BCP minimal model is not exhaustive.
- **S01-C034** — [S01 §4.9.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.9.3); authority **MUST**; trigger: resource server handles access token. Treat token as secret; do not store or transfer in plaintext. Boundary: No mandated storage product or cipher.
- **S01-C038** — [S01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13); authority **MUST**; trigger: TLS terminated by reverse proxy. Sanitize inbound security-relevant headers to preserve their authenticity/integrity. Boundary: No optional feature mandate inferred.
- **S01-C039** — [S01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13); authority **MUST**; trigger: TLS terminated by reverse proxy. Protect proxy-to-app link against eavesdropping, injection and replay. Boundary: No optional feature mandate inferred.
- **S01-C040** — [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); authority **MUST**; trigger: considering refresh-token issuance. Assess risk to decide whether a client receives refresh tokens. Boundary: Non-issuance permitted.
- **S02-C064** — [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); authority **MUST**; trigger: access tokens. Keep token and confidential attributes secret in transit/storage; share only with AS, valid RS and receiving client. Boundary: No optional feature mandate inferred.
- **S02-C065** — [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); authority **MUST**; trigger: access tokens. Transmit tokens only over authenticated TLS. Boundary: No optional feature mandate inferred.
- **S02-C067** — [S02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4); authority **MUST**; trigger: refresh tokens. Keep secret in storage/transit and share only with AS and receiving client. Boundary: No optional feature mandate inferred.
- **S02-C069** — [S02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4); authority **MUST**; trigger: refresh tokens. Use authenticated TLS; prevent unauthorized generation/alteration/guessing. Boundary: No optional feature mandate inferred.
- **S02-C070** — [S02 §10.10](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.10); authority **MUST / SHOULD**; trigger: generated credentials. Guess probability at most 2^-128, preferably at most 2^-160; protect human-use credentials by other means. Boundary: Not a blanket byte-length equivalence for all token encodings.
- **S02-C072** — [S02 §10.11](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.11); authority **MUST**; trigger: end-user endpoints. Require TLS on all owner-interaction endpoints. Boundary: Native loopback response exception governed by S01/S11.
- **S06-C016** — [S06 §7.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.1); authority **MUST**; trigger: PRM implementations. Support TLS and follow BCP195. Boundary: TLS details external.
- **S08-C014** — [S08 §7.1](https://openid.net/specs/openid-connect-discovery-1_0.html#TLSRequirements); authority **MUST / SHOULD**; trigger: Discovery TLS. TLS confidentiality/integrity and certificate validation required; BCP195 guidance recommended. Boundary: TLS version evolves; no old-version pin inferred.
- **S09-C054** — [S09 §16.12](https://openid.net/specs/openid-connect-core-1_0.html#TimingAttack); authority **SHOULD**; trigger: cryptographic validation. Avoid early exit on invalid octet to reduce timing side channels. Boundary: No prescribed crypto library; applies cryptographic processing context.
- **S09-C056** — [S09 §16.17](https://openid.net/specs/openid-connect-core-1_0.html#TLSRequirements); authority **MUST / SHOULD**; trigger: OIDC TLS. Support TLS confidentiality/integrity and certificate checking; follow BCP195 guidance. Boundary: Hosting responsibilities separate.
- **S10-C008** — [S10 §5.2](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.2); authority **MUST**; trigger: bearer transport/storage. Implement TLS and certificate validation; protect tokens on TLS termination backends; do not store tokens in cookies sent in clear. Boundary: No mandatory HTTP-only cookie auth for bearer API.

**Promised/measured observation:** docs/auth-oracles.md ORC014 explicitly leaves deployed proxy/browser/product integration unverified. Test URLs usehttps but in-process Worker dispatch has no TLS peer. client-access.md tells callers to use credential store and Wrangler prompts. auth.test.ts:24-33 asserts Secure/HttpOnly/SameSite cookie.

**Unmeasured observation / where vanished:** TLS certificate/link protection, reverse-proxy header provenance, logging/storage token secrecy, generated credential guessing bound, refresh issuance risk assessment, environmental attacker accounting and cryptographic timing behavior lack oracle/deployment evidence. These are operational assurance limits, not unit-test bugs.

**Reduction rule:** known: docs/auth-oracles.md ORC014 explicitly excludes deployed proxy verification; inferred: in-process protocol driver cannot measure transport/operational controls. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL07 — Authorization-page external content, trust and clickjacking breadth

**Original support and every preserved detail:**

- **S01-C029** — [S01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4); authority **SHOULD NOT**; trigger: AS authorization page or callback response page. Avoid third-party resources and external links. Boundary: Client callback responsibility conditional on deployed client.
- **S01-C046** — [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); authority **MUST**; trigger: AS interaction pages. Prevent clickjacking. Boundary: No single mandated header satisfies all contexts.
- **S01-C047** — [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); authority **SHOULD**; trigger: AS interaction pages. Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. Boundary: Legacy unsupported-user-agent boundary stated in source.
- **S02-C063** — [S02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2); authority **MUST; SHOULD**; trigger: unauthenticated public clients. Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. Boundary: Prior approval alone not proof of same public-client instance.
- **S02-C073** — [S02 §10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12); authority **MUST**; trigger: AS authorization endpoint. Prevent CSRF and malicious authorization without owner awareness/explicit consent. Boundary: No prescribed CSRF implementation.
- **S02-C074** — [S02 §10.14](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.14); authority **MUST**; trigger: external protocol values. Sanitize, and validate where possible, all received values including state and redirect_uri. Boundary: Exact-state echo must not be silently mutated.

**Promised/measured observation:** oauth-flow.oracle.test.ts:32 checks frame-ancestors substring on one consent page, :34 escapes one clientname; browser-binding and cross-site hostile cases :43-58.

**Unmeasured observation / where vanished:** Owner authorization CSRF consent branch has positive+hostile witnesses, but all external protocol-value sanitization, other login/error/authorization framing pages, third-party content exclusion, repeated public-client approval trust and configured framing origins remain unmeasured. Substring frame-ancestors lacks a hostile framing/browser witness or exact effective policy. No claim consent binding absent.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL08 — Public-client identification and registration type

**Original support and every preserved detail:**

- **S02-C001** — [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); authority **MUST NOT / SHOULD**; trigger: registered clients. Do not treat client_id as a secret or use it alone for authentication. Boundary: No optional feature mandate inferred.
- **S02-C002** — [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); authority **MUST NOT / SHOULD**; trigger: registered clients. Document identifier size. Boundary: No optional feature mandate inferred.
- **S02-C003** — [S02 §2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.1); authority **SHOULD NOT**; trigger: client registration. Do not assume client type without assessing credential exposure. Boundary: Client public/confidential classification not inferred from UI.
- **S02-C004** — [S02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3); authority **MUST NOT**; trigger: public-client authentication. Do not rely on it to identify the client. Boundary: PKCE is not client identity authentication.

**Promised/measured observation:** Public registration sends none and one client_name/redirect: oauth-flow.oracle.test.ts:25; model binds code client :59-71.

**Unmeasured observation / where vanished:** No identity-versus-client_id distinction law, classification under credential exposure, caller-chosen ID impersonation boundary or identifier-size docs. client_id mismatch400 proves codebinding, not confidential/public classification or identity assurance.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL09 — Endpoint parsing and required inputs

**Original support and every preserved detail:**

- **S02-C011** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Verify owner identity before obtaining authorization grant. Boundary: No optional feature mandate inferred.
- **S02-C012** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Use TLS; support GET; POST optional. Boundary: No optional feature mandate inferred.
- **S02-C013** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Retain configured query parameters; forbid fragment component. Boundary: No optional feature mandate inferred.
- **S02-C014** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Treat empty values as omitted. Boundary: No optional feature mandate inferred.
- **S02-C015** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Ignore unknown parameters. Boundary: No optional feature mandate inferred.
- **S02-C016** — [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); authority **MUST**; trigger: authorization endpoint. Do not include request/response parameters more than once. Boundary: No optional feature mandate inferred.
- **S02-C017** — [S02 §3.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.1); authority **MUST**; trigger: response_type absent or unsupported. Return an authorization error. Boundary: Does not require supporting every registered response type.
- **S02-C020** — [S02 §3.1.2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.2); authority **MUST; SHOULD**; trigger: redirect registration. Public clients must register redirects; all-client registration/full URIs recommended. Boundary: S01 exact-match update constrains older partial-URI flexibility.
- **S02-C024** — [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); authority **MUST**; trigger: token endpoint. Require TLS and POST token requests. Boundary: No optional feature mandate inferred.
- **S02-C025** — [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); authority **MUST**; trigger: token endpoint. Retain configured query parameters; forbid fragments. Boundary: No optional feature mandate inferred.
- **S02-C026** — [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); authority **MUST**; trigger: token endpoint. Treat empty parameters as omitted. Boundary: No optional feature mandate inferred.
- **S02-C027** — [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); authority **MUST**; trigger: token endpoint. Ignore unknown parameters. Boundary: No optional feature mandate inferred.
- **S02-C028** — [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); authority **MUST**; trigger: token endpoint. Do not repeat parameters. Boundary: No optional feature mandate inferred.
- **S02-C030** — [S02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3); authority **MUST**; trigger: scope absent. Use predefined scope default or reject with invalid scope. Boundary: Source permits narrower grant.
- **S02-C031** — [S02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3); authority **MUST / SHOULD**; trigger: scope policy. Return scope when granted differs from requested; document requirements/default. Boundary: No requirement to advertise every supported scope.
- **S02-C032** — [S02 §4.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1); authority **REQUIRED**; trigger: authorization code request. Use response_type=code and client_id, encoded as form query. Boundary: redirect/state/scope conditions elsewhere.
- **S02-C038** — [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); authority **MUST / REQUIRED**; trigger: code token exchange. Require grant_type=authorization_code and code. Boundary: No optional feature mandate inferred.
- **S02-C039** — [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); authority **MUST / REQUIRED**; trigger: code token exchange. Require client_id for unauthenticated client. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** Production happy path uses authenticated owner GET authorize and POST token with all fields: oauth-flow.oracle.test.ts:23-30,38. Cross-site/wrong-browser consent denied; official MCP client finishes complete well-formed requests.

**Unmeasured observation / where vanished:** No duplicate/empty/unknown/absent parameter oracle; missing response_type/client_id/grant_type/code, fragment/configured-query retention, missing unauthenticated client_id, unsupported response_type, omitted scope default/invalid-scope policy, or granted-scope-diff response law. GET/POST and owner identity happy path partially covered; no full protocol rejection law inferred.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL10 — Authorization-code expiry and invalid-code boundary

**Original support and every preserved detail:**

- **S02-C033** — [S02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2); authority **MUST**; trigger: code issued. Bind code to client identifier and redirect URI; expire shortly. Boundary: 10-minute maximum is RECOMMENDED, not hard MUST ceiling.
- **S02-C042** — [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); authority **MUST / REQUIRED**; trigger: code token exchange. Validate code. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** OAuthModel includes code expires600 auth-oracle-model.ts:44-49; oauth-flow.oracle.test.ts:104-107 tests consent-handle expiry, not code expiry. Code success and reuse400 are real.

**Unmeasured observation / where vanished:** Fresh unused authorization code atT-1/T and unknown/expired-code observation absent. Code/client/redirect bindings have hostile witnesses; no unsupported claim they are missing. Model field alone does not establish a real Worker code-expiry checkpoint.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL11 — Token response representation and cache policy

**Original support and every preserved detail:**

- **S02-C046** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **REQUIRED / protocol binding**; trigger: successful token response. Return HTTP 200 JSON object with access_token and case-insensitive token_type. Boundary: No optional feature mandate inferred.
- **S02-C047** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **REQUIRED / protocol binding**; trigger: successful token response. Represent strings as JSON strings and numbers as numbers. Boundary: No optional feature mandate inferred.
- **S02-C049** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **MUST**; trigger: any response containing sensitive data. Use Cache-Control: no-store and Pragma: no-cache. Boundary: OIDC errata examples omit Pragma; OAuth requirement remains recorded.

**Promised/measured observation:** oauth-flow.oracle.test.ts:80-82 gets200 JSON, consumes access/refresh tokens and expires_in3600; SDK tests check no-store on REST calls, not OAuth token responses.

**Unmeasured observation / where vanished:** Token_type and string/number type contract, cache no-store plus Pragma:no-cache on OAuth sensitive responses not asserted. Successful JSON parsing not all JSON shape/type/cache clauses.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL12 — Token errors and auth-scheme fidelity

**Original support and every preserved detail:**

- **S02-C050** — [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); authority **protocol binding / REQUIRED**; trigger: token error. Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. Boundary: Description/URI optional; enum semantics preserved.
- **S02-C052** — [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); authority **MUST NOT / syntax**; trigger: token error fields. Restrict error/description ASCII and error_uri URI-reference syntax. Boundary: Do not confuse REST resource errors with token errors.

**Promised/measured observation:** oauth-flow.oracle.test.ts:70 enforces400 and no access_token, :93/:96 enforce400 for replay/escalation; diagnostics stringify error but do not compareerror.

**Unmeasured observation / where vanished:** Exact invalid_request/invalid_grant/unauthorized_client/unsupported_grant_type/invalid_scope distinctions, numeric/ASCII/URI syntax and malformed-request contrast absent. Confidential Authorization-header401 belongs conditional scope, not universal public-client400 test.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL13 — Forgery/guess resistance of access tokens

**Original support and every preserved detail:**

- **S02-C066** — [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); authority **MUST**; trigger: access tokens. Ensure unauthorized actors cannot generate, alter or guess valid tokens. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** authorization-boundaries.test.ts:29-31 rejects supplied bad-token even with cookie. better-auth.oracle.test.ts:53-55 tampers fixture ID-token signature; verifyAccess wrongaudience is directfixture helper.

**Unmeasured observation / where vanished:** Production signed access token signature/claim mutation rejection and token-generation entropy unmeasured by bad-token syntax case. Alternatefixture ID-token tamper does not prove production access JWT validation.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL14 — Resource syntax and granted-resource expansion

**Original support and every preserved detail:**

- **S05-C001** — [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); authority **MUST / SHOULD NOT**; trigger: resource parameter used. Resource value is absolute URI without fragment. Boundary: No optional feature mandate inferred.
- **S05-C005** — [S05 §2.1](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.1); authority **MAY / advice**; trigger: resource omitted or unacceptable. Omitted resource may use default/no resource or be required by policy; reject unacceptable values using invalid_target advised. Boundary: MCP may impose stricter resource parameter rules in other track.
- **S05-C006** — [S05 §2.2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.2); authority **protocol semantics**; trigger: resource at token exchange. Requested resources stay within granted resources; omission uses grant/default handling; code grant can select narrower resource; refresh can obtain restricted token from multi-resource grant. Boundary: No scope/resource escalation; distinct authorization grant and token audiences.

**Promised/measured observation:** oauth-flow.oracle.test.ts:59-71 uses alternate known MCP resource at code exchange =>400; :97-98 proves selected resource, not URI grammar.

**Unmeasured observation / where vanished:** Malformed/nonabsolute/fragment resource input, omitted/default/required resource policy, invalid_target error, refresh resource switching/expansion and grant-versus-token resource narrowing unmeasured. Multi-resource optional allowance remains conditional, not a universal support omission.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL15 — Resource metadata publication fields and routes

**Original support and every preserved detail:**

- **S06-C001** — [S06 §1.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-1.2); authority **definition / SHOULD NOT**; trigger: PRM resource identifier. Use HTTPS URL without fragment; query discouraged with justified exception. Boundary: Not every resource identifier must be origin-only.
- **S06-C002** — [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); authority **REQUIRED**; trigger: protected resource metadata supported. Publish resource identifier. Boundary: authorization_servers optional under RFC itself; MCP profile may strengthen.
- **S06-C003** — [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); authority **RECOMMENDED**; trigger: PRM supported. Publish scopes_supported and resource_name; can omit supported scopes. Boundary: No default bearer method implied by omission.
- **S06-C007** — [S06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3); authority **MUST**; trigger: PRM supported. Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. Boundary: Default /.well-known/oauth-protected-resource; multiple metadata locations allowed.
- **S06-C008** — [S06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1); authority **MUST**; trigger: PRM retrieval. Use GET; strip host terminating slash before prefix insertion with path/query. Boundary: Host root and mounted resource can coexist.
- **S06-C009** — [S06 §3.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2); authority **MUST**; trigger: PRM response. Return 200 application/json object; arrays represent multi-values; omit zero-value parameters; ignore unknown metadata. Boundary: §2 expressly permits empty bearer_methods_supported to mean none; retain tension rather than generalize zero-value wording blindly.
- **S06-C015** — [S06 §6](https://www.rfc-editor.org/rfc/rfc9728.html#section-6); authority **MUST / MUST NOT**; trigger: PRM string comparison. Unescape JSON; compare exact Unicode code points without normalization. Boundary: No URL rewrite normalization.
- **S06-C018** — [S06 §7.4](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.4); authority **SHOULD**; trigger: client expects several RSs. Request audience-restricted tokens with RFC8707; AS should support audience restriction. Boundary: Not mandatory new JWT profile.

**Promised/measured observation:** mcp.oracle.test.ts:49-79 follows live discovery challenge, asserts mounted OIDC route200 and toolcall; authorization.oracle.test.ts:78 asserts challenge URLstring. No direct PRM field assertions found.

**Unmeasured observation / where vanished:** No independent PRM resource equality/HTTPS/no-fragment field, supported scopes/name recommendations, derived well-known placement, GET response contenttype/status/array shape/unknown/zero-values or Unicode comparison witness. Client multiRS responsibility not imposed; AS audience support portion already covered by resource laws.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL16 — DCR defaults unknown values and consistency

**Original support and every preserved detail:**

- **S07-C001** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **MUST**; trigger: DCR redirects supported. Support redirect_uris metadata; redirect-flow clients register redirects. Boundary: DCR itself optional absent profile requirement.
- **S07-C002** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **defaults / semantics**; trigger: DCR fields omitted. token_endpoint_auth_method defaults client_secret_basic; grant_types defaults authorization_code; response_types defaults code; grants/response types track grant definition. Boundary: Default public-client auth=none must be expressed where applicable; do not infer all methods required.
- **S07-C003** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **MUST**; trigger: DCR metadata parsing. Ignore unknown client metadata. Boundary: Known invalid metadata still error.
- **S07-C006** — [S07 §2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.1); authority **SHOULD**; trigger: DCR grant/response relationship. Prevent clients registering inconsistent grants and response types. Boundary: No obligation to support all combinations.
- **S07-C009** — [S07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3); authority **MUST**; trigger: DCR endpoint. Accept POST JSON; protect transport with TLS. Boundary: No requirement to accept arbitrary unbounded requests.
- **S07-C011** — [S07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1); authority **protocol binding / REQUIRED**; trigger: DCR successful response. Return 201 JSON, client_id and all registered metadata including server-provisioned values. Boundary: Server may reject/substitute requested values; granted metadata is authoritative.
- **S07-C014** — [S07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2); authority **protocol binding / REQUIRED**; trigger: DCR rejection. Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. Boundary: Descriptions optional.
- **S07-C015** — [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); authority **MUST**; trigger: DCR redirect security. Redirect values use TLS remote sites, localhost/native local web server, or native scheme permitted by source; S01/S11 narrow handling. Boundary: No arbitrary HTTP remote site.
- **S07-C016** — [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); authority **MUST**; trigger: self-asserted metadata. Treat metadata as self-asserted unless trusted software-statement claim; assess entire request to prevent client impersonation. Boundary: Client name/logo not verified identity.

**Promised/measured observation:** oauth-flow.oracle.test.ts:25-26 anonymous POSTJSON returns201; client_id consumed; one complete valid redirect/grant/response set and escaped name :34.

**Unmeasured observation / where vanished:** No omitted metadata defaults, ignored unknown knowninvalid metadata, inconsistent grant/response errors, malformed/invalid redirect registration, full registered-metadata echo, self-asserted-name impersonation policy, duplicate client isolation witness. Transport TLS part unmeasured operational;201 POSTJSON alone partially covers binding.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL17 — OIDC metadata production handoff and issuer law

**Original support and every preserved detail:**

- **S08-C001** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **REQUIRED**; trigger: OIDC Discovery supported. Publish issuer, authorization_endpoint, token_endpoint unless implicit-only, jwks_uri, response_types_supported, subject_types_supported, id_token_signing_alg_values_supported. Boundary: OAuth-only S04 has fewer required fields.
- **S08-C002** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **MUST**; trigger: OIDC issuer. HTTPS without query/fragment; identical to discovered issuer and ID-token iss. Boundary: Issuer includes mount path.
- **S08-C003** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **MUST**; trigger: OIDC endpoint URLs. Authorization/token/UserInfo/JWKS/registration URLs use HTTPS when published. Boundary: Native redirects are client URI not OP endpoint URL.
- **S08-C004** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **MUST / NOT RECOMMENDED**; trigger: OP JWKS. No private or symmetric keys; key use if mixed encryption/signing; x5c must include matching bare key; avoid same key for encryption/signing. Boundary: JWKS REQUIRED for Discovery, optional for OAuth metadata.
- **S08-C005** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **MUST / RECOMMENDED**; trigger: OIDC scope metadata. Support openid; scopes list recommended; standard supported scopes should be advertised; may omit others. Boundary: Metadata scope list not exhaustive or permission grant.
- **S08-C006** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **MUST**; trigger: OIDC signing metadata. Include RS256; none permitted only when no ID token from authorization endpoint. Boundary: S09 §15.1 narrow none-only exception retained separately; tension requires profile review.
- **S08-C009** — [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); authority **SHOULD / NOT RECOMMENDED**; trigger: browser direct OIDC endpoints. Support CORS or other browser access methods on direct endpoints; authorization CORS discouraged. Boundary: S01 updates this to MUST NOT authorization CORS.
- **S08-C010** — [S08 §4](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig); authority **MUST**; trigger: OIDC Discovery supported. Append /.well-known/openid-configuration to issuer after removing terminating slash; GET returns compliant JSON application/json. Boundary: Path issuer uses append rule, unlike S04.
- **S08-C011** — [S08 §4.2](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse); authority **MUST**; trigger: Discovery response. Use 200 JSON object; multi-values arrays; omit zero-element claims. Boundary: Additional claims allowed.
- **S08-C013** — [S08 §5](https://openid.net/specs/openid-connect-discovery-1_0.html#StringOps); authority **MUST / MUST NOT**; trigger: Discovery strings. Unescape JSON and compare code points exactly without Unicode normalization. Boundary: Applies case-sensitive metadata names/values where specified.
- **S09-C055** — [S09 §16.15](https://openid.net/specs/openid-connect-core-1_0.html#IssuerIdentifier); authority **MUST / RECOMMENDED**; trigger: issuer identity. Discovery issuer exactly equals ID-token iss; path is issuer identity; single issuer per host recommended but multiple permitted. Boundary: Mounted issuer not prohibited.

**Promised/measured observation:** mcp.oracle.test.ts:49-79 uses real makeApp and SDK; positive mounted OIDC route and negative RFC8414 prefix routes across three mounts. better-auth.oracle.test.ts:11-20 explicitly checks metadata fields on createBetterAuthDriver, an alternate configuredserver. verify-mounted-oidc.ts:39-50 builds provider-only inlinefixture.

**Unmeasured observation / where vanished:** Production receiving oracle lacks explicit issuer/endpoints/response_types/subject_types/RS256/openid/scopes/tokenauthdefaults/contenttype/arrays/empty-fields/CORS/string-equality observations. Fixture fields are not a productionhandoff law. Actual mounted route transformation is covered; trailing-slash and exact-issuer/ID-token coherence not established. Correct OIDC append routing does not require forbidden root-prefixroute.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL18 — OIDC signing/JWKS production handoff

**Original support and every preserved detail:**

- **S09-C001** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **REQUIRED**; trigger: ID token issued. Include iss/sub/aud/exp/iat; issuer HTTPS with no query/fragment; sub locally unique never reassigned, <=255 ASCII; aud contains receiving client_id; NumericDate exp/iat. Boundary: Single-owner does not permit subject reuse or audience bypass.
- **S09-C004** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **MUST / MUST NOT**; trigger: ID-token cryptography. Sign ID tokens; if encrypting, sign then encrypt; none allowed only code/no authorization-endpoint token and explicit registration request. Boundary: No universal encryption mandate.
- **S09-C005** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **SHOULD NOT**; trigger: ID-token JOSE headers. Avoid x5u/x5c/jku/jwk header key references; use established discovery/registration. Boundary: No new key-fetch protocol implied.
- **S09-C014** — [S09 §3.1.3.3](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse); authority **MUST**; trigger: initial OIDC code token response. Return ID token and access token in JSON; token_type Bearer unless other type negotiated; no-store header. Boundary: Non-openid OAuth response need not contain ID token.
- **S09-C028** — [S09 §5.6](https://openid.net/specs/openid-connect-core-1_0.html#ClaimTypes); authority **MUST**; trigger: OP claim support. Support normal claims. Boundary: Aggregated/distributed claims optional; full definitions preserved in raw.
- **S09-C029** — [S09 §5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability); authority **MUST / MUST NOT**; trigger: identity linkage. sub unique and never reassigned per issuer; do not use email/phone/name as unique subject identity. Boundary: Issuer and sub together identify owner.
- **S09-C033** — [S09 §10.1](https://openid.net/specs/openid-connect-core-1_0.html#Signing); authority **MUST / MUST NOT**; trigger: OIDC signing. Choose algorithm appropriate to key; signing key usage; kid for asymmetric keys; forbid symmetric signatures for public clients. Boundary: No mandated ES256 support.
- **S09-C034** — [S09 §10.1.1](https://openid.net/specs/openid-connect-core-1_0.html#RotateSigKeys); authority **SHOULD**; trigger: signing-key rollover. Retain recent decommissioned signing public keys for a reasonable validation transition. Boundary: No fixed retention interval.
- **S09-C040** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support RS256 signing except narrowly described code-only none-only registration case. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** better-auth.oracle.test.ts:48-57 fixture verifies issuer/clientaud/sub, signed token and signaturetamper; helper jwtVerify in better-auth-driver.ts:77-82 passes issuer only for IDtoken (audience undefined). verify-mounted-oidc.ts:44-49 checks fixture RSA keys/no RSA privatefields.

**Unmeasured observation / where vanished:** No production ID-token issuance/iss/sub/aud/exp/iat type/subject-stability/audience/alg/kid/header constraints/JWKS publiconly/private+symmetric-key exclusion/signing rollover law. Fixture aud equality is issuance check, not RP hostile audience validation; optional encryption stays conditional. No assertion all these are runtime faults.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL19 — OIDC request nonce and authentication parameter duties

**Original support and every preserved detail:**

- **S09-C002** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **MUST**; trigger: nonce present in request. Include unchanged nonce claim; clients check equality; AS SHOULD avoid further processing. Boundary: Nonce optional in code flow, mandatory in implicit/hybrid conditions.
- **S09-C003** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **REQUIRED**; trigger: max_age or essential auth_time. Include authentication-time claim. Boundary: auth_time not universally required.
- **S09-C006** — [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); authority **REQUIRED**; trigger: OIDC code authorization request. Require scope containing openid, response_type=code, client_id, exact pre-registered redirect_uri. Boundary: Unlike basic OAuth, OIDC redirect_uri request is REQUIRED.
- **S09-C007** — [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); authority **MUST / behaviors**; trigger: prompt parameter. none shows no UI and errors if silent auth/consent impossible; none cannot combine with other prompt; login reauthentication; consent/select_account behavior and errors when unsatisfied. Boundary: Single-account deployment can meet selection without inventing extra accounts.
- **S09-C008** — [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); authority **MUST**; trigger: max_age request. Attempt active reauthentication if age exceeds limit; include auth_time. Boundary: max_age=0 equivalent login.
- **S09-C009** — [S09 §3.1.2.2](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequestValidation); authority **MUST**; trigger: OIDC request. Validate OAuth and OIDC required fields; requested specific sub must match authenticated owner; ID-token hint must have been issued by this OP; return proper error. Boundary: Expired id_token_hint may be accepted for recent session as SHOULD; not an access token.
- **S09-C010** — [S09 §3.1.2.3](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates); authority **MUST / MUST NOT**; trigger: owner authentication. Authenticate if absent or prompt=login; no interaction prompt=none; prevent CSRF/clickjacking during owner UI. Boundary: Existing owner session alone does not satisfy explicit prompt=login.
- **S09-C012** — [S09 §3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError); authority **MUST NOT / response binding**; trigger: OIDC authorization errors. Do not redirect invalid URI; validated redirects get error/state; unsupported response_mode yields HTTP400 without error parameters. Boundary: Do not assume all error cases redirect.
- **S09-C013** — [S09 §3.1.3.2](https://openid.net/specs/openid-connect-core-1_0.html#TokenRequestValidation); authority **MUST**; trigger: OIDC code exchange. Authenticate as registered; validate issued client/code/redirect; verify code came from OIDC authentication request. Boundary: Source says replay check if possible, but S02/S01 single-use MUST still applies.
- **S09-C038** — [S09 §13.1](https://openid.net/specs/openid-connect-core-1_0.html#QuerySerialization); authority **SHOULD**; trigger: OIDC query serialization. Omit absent/empty parameters rather than empty strings. Boundary: OAuth processing still treats empty as absent.
- **S09-C039** — [S09 §14](https://openid.net/specs/openid-connect-core-1_0.html#StringOps); authority **MUST / MUST NOT**; trigger: OIDC string processing. Unescape and compare code points without Unicode normalization; space (0x20) separates list values. Boundary: Exact claim/issuer semantics preserved.
- **S09-C041** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support prompt, including none and login behavior. Boundary: No optional feature mandate inferred.
- **S09-C042** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support display at least without error. Boundary: No optional feature mandate inferred.
- **S09-C043** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support ui_locales and claims_locales at least without error. Boundary: No optional feature mandate inferred.
- **S09-C044** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support auth_time when requested. Boundary: No optional feature mandate inferred.
- **S09-C045** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support max_age enforcement. Boundary: No optional feature mandate inferred.
- **S09-C046** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support acr_values at least without error. Boundary: No optional feature mandate inferred.

**Promised/measured observation:** Production MCP provider requests owner scopes withoutopenid (mcp.oracle.test.ts:54); alternatefixture requestsopenid/offlineaccess (better-auth.oracle.test.ts:29-35), all valid fields, no nonce/max_age/prompt/display/ui_locales/claims_locales/acr_values branches.

**Unmeasured observation / where vanished:** No production positive+hostile nonce echo, auth_time/max_age, promptnone/loginnoninteraction/reauth, display/locales/acr minimal no-error support, ID-tokenhint issuer/subject/expiredhint boundary, OIDC required-field/redirect response_mode errors, code-from-OIDC check or Unicode/queryserialization law. These are basic OP duties if advertised OIDC contract is held, not requirements to implement every optional OIDC feature.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL20 — OIDC offline consent and refresh client binding

**Original support and every preserved detail:**

- **S09-C035** — [S09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess); authority **MUST**; trigger: offline_access requested. Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. Boundary: Refresh tokens can be issued for other contexts; offline_access optional feature.
- **S09-C036** — [S09 §12.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: OIDC refresh. Validate refresh token, client binding and registered authentication when applicable. Boundary: Public none auth remains public.

**Promised/measured observation:** Fixture uses offline_access and explicitaccept; production flow :30 also requests offline_access but notopenid; production refresh sameclient only :84-98.

**Unmeasured observation / where vanished:** Offline-specific consent/prompt or alternative conditions, ignore offline_access outside codeflow/without permittedconsent, registered application type distinction and refresh clientsubstitution/registered authentication unmeasured. Generic explicitconsent success does not establish all offline conditions.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL21 — OIDC redirect status and lifetime/revocation breadth

**Original support and every preserved detail:**

- **S09-C057** — [S09 §16.18](https://openid.net/specs/openid-connect-core-1_0.html#TokenLifetime); authority **SHOULD**; trigger: access/refresh lifetimes. Prefer short or single-use access tokens; identify long grants; provide owner token-revocation mechanism. Boundary: RFC7009 endpoint not thereby unconditionally mandated.
- **S09-C059** — [S09 §16.22](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST NOT**; trigger: OP redirect to client. Do not use HTTP307 to redirect to Redirection URI; 303 preferable. Boundary: Broader than S01 credentials-present trigger.

**Promised/measured observation:** Production OAuth approval302 :49; credentialhistory tests expiry/revocations; docs/client-access.md shows long grant resource/permissions/expiry; fixture disableclient tests immediate access/refresh refusal.

**Unmeasured observation / where vanished:** No general no307 redirect status law across OP paths; longgrant identification in OAuth consent and actual OAuth-issued token expiryT-1/T, refreshinactiveexpiry unmeasured. Manual revocation law and docowner grantUI are observed portions, not omitted. Short-token guidance is SHOULD, no prescribedTTL.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.

### OL22 — Bearer challenge grammar and error distinctions

**Original support and every preserved detail:**

- **S10-C006** — [S10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3); authority **MUST NOT / grammar**; trigger: bearer challenge. Do not repeat realm/scope/error/error_description/error_uri; honor character syntax for scope/errors/URI. Boundary: scope/error_description/error_uri optional.
- **S10-C007** — [S10 §3.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-3.1); authority **SHOULD**; trigger: bearer resource errors. invalid_request=>400; invalid_token=>401; insufficient_scope=>403; expose reason when supplied token fails. Boundary: Status strength is SHOULD here; MCP may strengthen.
- **S10-C009** — [S10 §5.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.3); authority **SHOULD**; trigger: bearer issuance. Limit token lifetime, especially browser tokens; scope to recipients. Boundary: Illustrative <=1h is recommendation context, no mandatory universal TTL.

**Promised/measured observation:** authorization.oracle.test.ts:77-80 checks resource_metadata and insufficient_scope substring; expected401/403decision law. authorization-boundaries.test.ts badtoken401. No malformed bearer/errorgrammar test found.

**Unmeasured observation / where vanished:** No exact Bearer scheme/duplicatechallenge attributes/character syntax, unauthenticated-noerror contrast, malformedrequest400 versus invalidtoken401, comprehensive error reason or OAuth accessTTL boundary law. Manual expiry law covered separately; lifetime guidance not fixed requirement.

**Reduction rule:** inferred: bounded happy-path/selected hostile examples compress wider protocol input space. This is a source-to-oracle omission trace, not a reason to restore the item or a runtime finding.


All four oracle inputs registered: 4 G +24 HL +25 ML +22 OL =75 raw recoveries. Separate unknown advisory leads M118/M121 and operational remainder remain in the source maps; not asserted as current bugs. Implementation raw inputs pending.


## Raw implementation input: implementation-hardening-loss.md

# Implementation-only hardening loss assay

Frozen source: `/private/tmp/blygger-auth-audit/hardening-sources.md`, all S01–S12/H01–H36/P00–P04. Frozen candidate: `/private/tmp/blygger-auth-audit/candidate`. Date: 2026-10-04. The original hardening source was re-scanned; sibling research/audit outputs were not read. The loss-audit card was read again. The preceding oracle assay supplies stage context only; this file independently maps production capability.

No probes, tests, production edits, repair proposals or usefulness judgments occurred. “Covered” below means code/config exposes the cited mechanism, **not behavioral compliance proof**. “Applicable omission” describes a missing local boundary or operational control within inspected code. “Unknown” preserves deployment/API/runtime facts that static inspection cannot establish. Optional features are not made mandatory. Prior regression pass counts are not finding evidence.

## Inspected implementation evidence

Production pointers are relative to the frozen candidate root.

- **I01** `src/oauth.ts:12–14,32–68`: locations/baseURL/issuer/resources derive from incoming request URL origin; both DCR options enabled; only code/refresh grants; 3600s OAuth access and 30-day refresh/manual grant defaults; owner-only privilege; no rateLimit/secondaryStorage/IP/trusted-host configuration; singular secret is hash of COOKIE_SECRET. Default native cookie path/SameSite configured.
- **I02** `src/oauth.ts:57–91,103–111`: owner bridge rejects Bearer, checks owner HMAC cookie and supplied Origin/cross-site Fetch Metadata, creates native owner session/cookie; internal delegatedAccess invokes provider.requireActiveAccessToken. These are separate owner and native session paths.
- **I03** `src/oauth.ts:20–27,44–55,93–101,117–144`: epoch/password/cookie-secret grant version; deadline and access exp checks; active native validation for REST/MCP; audience/owner/client checks; grant tombstones; owner revoke disables client; revoke-all advances epoch. Signing wrapping-secret change deletes jwks inside D1 batch and updates secret_version; this is destructive signing-key/cookie/grant cutover, not vendor versioned encryption rotation.
- **I04** `src/oauth-routes.ts:12–15,27–78,80–106`: no-store/CORS, outer errors log Error.name only; signed query and owner/native session consent binding; escaped client metadata, CSP/XFO/no-referrer; expiry-bound DELETE RETURNING consent consumption. Token route delegates native exchange, then records authorization and code-family marker; later seen invalid_grant inserts family tombstone. Protocol-only forwarding includes register/introspect/revoke/UserInfo/JWKS.
- **I05** `src/authorization-api.ts:8–31`, `src/owner-api.ts:14–35`, `src/mcp.ts:14–17`: cookie-only management and supplied-Origin/cross-site rejection; REST/MCP use verifyBearer; native management endpoints not exposed by I04.
- **I06** `src/auth.ts:38–63`, `src/spa.ts:17,40–54`: separate owner HMAC cookie Secure/HttpOnly/Lax, no Domain, Path=/, password comparison, expiry and safe bounded relative return path. Owner login is outside native Better Auth email routes; no native limiter follows merely from installing the plugin.
- **I07** `migrations/0018_oauth.sql`: native 1.7.7 schema and indexes, assertion primary key; owner oauth_records expiry index, oauth_state epoch/secret_version, authorizations/version index and grant tombstones. No rateLimit table. `src/oauth-storage.ts:5–29` checks expiry on reads, parameterized upsert/delete/prefix paging; no physical expired-record cleanup is shown.
- **I08** `wrangler.jsonc:20–21,44–56`: generic deployment, date 2026-07-01/nodejs_compat/D1 binding; no NODE_ENV, shared limiter binding, host allowlist, observed plan, CPU budget or log-redaction settings. This is generic config, not live deployment evidence.
- **I09** `scripts/release.ts:18–22`, `scripts/verify-release.ts:31–43`, `scripts/persistence-worker.ts:8–11`: Worker build selects workerd/module and external cloudflare/node modules; release verifier explicitly enables nodejs_compat. Persistence child uses date 2026-07-01 but has **no compatibilityFlags**. SPA build's production NODE_ENV define (`scripts/build-spa.ts:13`) applies to browser bundle; Worker release build has no such define.

Dependency anchors, inspected read-only under `/Users/kylemathews/programs/blygger-studio/.worktrees/codex-oauth-mcp/node_modules` (not frozen application modifications):

- **D01** `better-auth/dist/context/create-context.mjs:170–175`; `@better-auth/core/dist/env/env-impl.mjs:30–35`: limiter defaults enabled=isProduction (NODE_ENV==='production'), memory absent secondaryStorage, window10/max100. `better-auth/dist/api/rate-limiter/index.mjs:6,197–235,289–305`: module-global memory; consume in HTTP request phase; custom atomic consume and secondary increment. `@better-auth/oauth-provider/dist/authorize-K1WHCNih.mjs:5235–5267`: per-endpoint rules including register5/60/token20/60. Factory recreation is **not evidence of counter reset**; cross-isolate shared counts are not provided by module memory.
- **D02** `better-auth/dist/cookies/index.mjs:20–40`: Secure from HTTPS/static baseURL, HttpOnly/Lax defaults, host-only absent cross-subdomain option; I01 supplies incoming-origin static string each factory. Native cookies depend on request-origin scheme; owner cookie is separately always Secure.
- **D03** `@better-auth/oauth-provider/dist/introspect-CNR06Oy3.mjs:1895`; `better-auth/dist/db/internal-adapter.mjs:787–849`; `@better-auth/kysely-adapter/dist/index.mjs:104–107,613–650`: consume verification then consumeOne; D1 dialect has transaction=false, SQLite consume uses DELETE with RETURNING, returning null if no row. This preserves native atomic claim capability; full concurrent exchange not executed.
- **D04** same provider introspect artifact:1498–1526,1572–1602,2146–2166,2225–2275,2466–2470: conditional revoked-null update before refresh replacement; revoked reuse outside interval deletes client/user refresh family and related opaque access rows; JWT active validation checks signature/expiry/resource/client disabled and session liveness when sid. requireActiveAccessToken rejects inactive result. I03 adds epoch/grant checks.
- **D05** provider authorize artifact:3420–3459 and original P03: direct valid JWT revoke unsupported_token_type; opaque and refresh revocation are distinct native operations. I04 forwards it rather than pretending a JWT is deleted.

## Complete source-item map

| Item | Status | Inspected mechanism or absent/conditional boundary | Recovery |
| --- | --- | --- | --- |
| S01 H01 | covered | I01 both DCR flags/I04 registration forwarding; no claim that public metadata is trusted identity. | — |
| S01 H02 | conditional not applicable | No initial-token validator configured; anonymous DCR is selected. Optional protected-DCR path is not a required missing feature. | — |
| S01 H03 | applicable omission, partial | D01 native endpoint rules exist; I01 leaves global enablement to NODE_ENV and storage to module memory. Cross-isolate shared enforcement and deliberate production enablement absent/unknown. | ILH01 |
| S01 H04 | covered | I04 forwards native revoke/D05 preserves JWT unsupported semantics; I03/I05 enforce active client/epoch/grant state separately. Opaque behavior remains native conditional mode; fixture claims not substituted. | — |
| S01 H05 | covered, capability | I07 includes plugin tables/indexes and assertion PK; native provider supplies assertion replay handling (original S01/P anchors). Migration failure/upgrade behavior still unmeasured, not absence of schema. | — |
| S01 H06 | conditional not applicable | Native client-secret rotation API is not forwarded (I04); app manual clients public. Anonymous confidential registrations can exist but optional secret rotation administration was not specified by frozen source as mandatory. | — |
| S02 H07 | applicable omission | I01 no shared limiter selection/I07 no limiter table/D01 module memory. D1 auth database does not automatically make counters distributed. | ILH02 |
| S02 H08 | conditional not applicable | No customStorage selected; atomic custom consume API does not impose an unused custom backend. Native memory check/increment is within D01. | — |
| S02 H09 | applicable omission/unknown, partial | Native HTTP/auth.api boundary retained D01; I02/I03 server API active validation bypasses HTTP limiter as documented. Actual deployed NODE_ENV unknown, no explicit enabled flag or Worker build define I09. | ILH03 |
| S02 H10 | applicable omission/unknown | I01 lacks Cloudflare authoritative-IP header/trustedProxies selection; default dependency logic applies. Proxy header sanitization/direct-origin reachability and distributed IPv6/chain behavior remain unknown. | ILH04 |
| S03 H11 | covered, capability | I01/D02 native Lax/path/HttpOnly/HTTPS-dependent Secure, host-only; I06 owner always Secure and host-only. No disabling flags/localhost trusted list configured. I02/I04/I05 enforce owner-wrapper origin/browser consent; does not prove all browser cases or native route decisions. | — |
| S03 H12 | applicable omission/unknown, partial | trustedProxyHeaders is not enabled, so forwarded Host/Proto trust is conditional unused; **incoming request origin** still sets trusted/static baseURL every factory I01. No deployment-fixed expected host/scheme in generic I08. Purpose-key pendingflow cutover is native dependency/operational boundary, not measured. | ILH05 |
| S04 H33 | applicable omission, partial | I01 explicitly sets a static-form baseURL and mounted basePath, but computes it from request origin. It is not a fixed deployment authority; request trust boundary remains unresolved. | ILH05 |
| S04 H34 | conditional not applicable | Dynamic object allowedHosts/fallback/cookie-domain path not selected. I01 request-derived string must not be mislabeled vendor dynamic allowlist configuration. | — |
| S04 H35 | covered for chosen design; conditional alternative | I01 supplies hashed secret/I03 coordinates destructive wrapping/signing reset; I07 retains secret_version. Versioned encryption secrets/legacy migration are unused alternatives, not obligatory. Missing/weak host secret checks and entropy cannot be established from a hash length; operational entropy unknown. | — |
| S05 H13 | covered as dependency scope | Source package 1.7.7 outside affected standalone <1.6.11. No current bug attribution; dependency code anchors original source. | — |
| S05 H14 | covered, capability | D03 native verification claim uses SQLite DELETE RETURNING; I04 consent also atomic. Parallel code redemption correctness is unmeasured; the old find-delete advisory is not a current implementation omission. Own code-family marker is post-response and separate from native one-use claim. | — |
| S06 H15 | covered, capability/unknown request transaction | I03 key-reset/revoke batches use documented D1 scope; I04 consent atomic statement. Whole authorize/token/remember/code-marker sequence has multiple calls and is not one batch. No source statement required whole request atomicity; error/crash behavior unknown. | — |
| S06 H16 | covered, API selection | I01 uses direct D1 binding and no Sessions wrapper; I07 direct prepare operations. Primary-only ordinary binding scope applies, not arbitrary replica stale-read claim. | — |
| S07 H17 | unknown operational boundary | I01/I03/I04 issue multiple database calls; I08 contains no measured throughput or queue behavior. No overload/backpressure observation; vendor limits cannot prove actual load safety. | ILH06 |
| S07 H18 | unknown operational boundary, partial | I07 indexes/parameterization exist; no auth query/connection/row/time/CPU/plan quota budget or Time Travel measurement. I03 performs key/state batch on every server construction; this is work, not a quantified limit violation. | ILH07 |
| S08 H19 | conditional not applicable | No read replication Sessions API selected; ordinary primary binding H16. Live database replication settings do not alone route ordinary bindings to replicas. | — |
| S08 H20 | covered scope distinction | D03 uses statement atomic claim separately from read consistency. I03/I04 do not claim Sessions imply credential atomicity. | — |
| S09 H21 | unknown runtime behavior, partial | I08/I09 supply compatibility/bundle externals; dependencies imported and code paths present. No executed stub/partial-API or full deployed-path behavior was observed in this static stage. | ILH08 |
| S09 H22 | applicable omission, partial | I08 production config and release verifier include flag appropriate to 2026-07-01; I09 persistence child same date lacks nodejs_compat. Separate fixture compatibility boundary absent; no inferred deployed config failure. | ILH09 |
| S10 H23 | unknown operational boundary | I08 does not fix live plan/CPU/memory/startup/request/connection quotas; code/bundle config does not measure headroom. | ILH10 |
| S10 H36 | unknown operational diagnostics, partial | I09 builds bundled artifact; no complete product diagnostic budget/profile/streamingpressure measurements in this stage. Optional vendor methods are not mandatory implementation features. | ILH11 |
| S11 H24 | conditional testing obligation; code capability | I04 forwards native authorize/code validation; D03 single-use consume. Single-owner limits other-owner injection. AS redirect/code attack tests are already retained by oracle-only stage; static scan adds no behavioral proof. | — |
| S11 H25 | conditional testing obligation; partial code capability | I04 signed query/session/browser binding/expiry consumed consent, CSP/XFO and native PKCE flow. I06 owner login lies outside native first-login CSRF machinery and contains no Origin/Fetch-Metadata guard, unlike I04 consent. Scope of source H25 is consent/PKCE/iframe tests; no new owner-login finding asserted here. | — |
| S11 H26 | covered lifetime/rotation capability; testing unknown | I01 one-hour OAuth/30-day manual/grant, I03 exp/grant deadline, D04 rotation conditionalclaim and descendant refresh-family deletion. 5–15min example is advice, not MUST. No assumed JWT deletion on refresh family cleanup; native active check + epoch/tombstones are distinct. | — |
| S11 H27 | covered qualification | I02 owner identity literal and I03 owner sub checks; illustrative OWASP requests/status are not treated as exact server contract. | — |
| S12 H28 | applicable omission, partial | I04 logs outer Error.name. Inspected owner login/denials/management lack structured authentication-success/failure, authorization/sessionfailure audit events/when-who-what. Dependency error logging is not an app event inventory. | ILH12 |
| S12 H29 | applicable omission/unknown, partial | I04 outer log avoids token bodies; catch in I03 returns null. Native dependency error loggers can emit error.message/stack/object; no central redaction adapter/logger configured I01. No actual token leak proven. Cloudflare automatic log capture/retention unknown. | ILH13 |
| S12 H30 | applicable omission/unknown, partial | Outer fixed string/Error.name I04 has narrow output, but no central log sanitization/format/failure isolation policy for native error objects. Runtime sink failure unknown. | ILH14 |
| S12 H31 | conditional testing obligation/unknown operational control | No log pipeline/failure/access control policy/config in I08; official test obligations already retained by oracle stage. Cannot infer externally managed log access controls from generic Worker config. | ILH15 |
| S12 H32 | unknown inference boundary retained | Header/body/error leak evaluation needs runtime error/log capture; none performed. I04 controlled outer log does not prove all native logger messages safe or unsafe. | ILH13 |
| P00 | covered dependency anchor | Original pinned metadata 1.7.7 retained; dependencies inspected read-only. Actual deployed install not proved. | — |
| P01 | applicable omission, fact retained | D01 module Map/default memory/global enablement. Repeated authorizationServer factory in I03 does not reset module Map. Cross-isolate sharing absent, deployed enablement unknown. | ILH02/ILH03 |
| P02 | covered | I01 anonymous DCR branch enabled and I04 registration handler exposed; original pinned artifact branch retained. | — |
| P03 | covered, capability | I04 native revoke forwarded/D05 JWT rejection; I02 delegatedAccess/D04 active check and I03 epoch/client/code tombstone state. This extends beyond fixture-only behavior but remains static inspection. | — |
| P04 | covered, capability | D03 traces provider consume through adapter into SQLite DELETE RETURNING. Underlying guarded claim present; no new concurrency probe was run. | — |

## Raw recovered boundaries in source order

Exact source pointers are original frozen sections; S URLs resolve in `hardening-sources.md`. All vanish rules are **inferred** from code structure. No history showing deliberate compression/rejection was inspected. Unknown operational records are preserved for later evaluation, not elevated to absent mandatory features.

| Recovery | Source support / pointer | Absent production boundary and vanish point | Reduction rule and certainty |
| --- | --- | --- | --- |
| ILH01 | H03/S01 Rate Limiting | Deliberate global enablement/shared enforcement for anonymous DCR; I01 options omit limiter while D01 plugin rules depend on global enablement | Inferred: endpoint-rule presence compresses global/runtime dependence |
| ILH02 | H07/P01/S02 Storage; original pinned memory artifact | Shared counts/limiter schema/backend absent at I01/I07; D1 auth binding does not select database limiter; Map remains per module/isolate | Inferred: database-backed auth categorized as distributed storage generally |
| ILH03 | H09/P01/S02 introduction; D01 context/env | Production mode explicitness absent in I01/I08/I09 Worker; deployed NODE_ENV unknown; server APIs correctly bypass limiter | Inferred: product deployment called production without freezing library's environment predicate |
| ILH04 | H10/S02 Connecting IP/IPv6 | Authoritative Cloudflare IP header and sanitized trusted-hop ingress policy not stated I01/I08; dependency defaults cannot authenticate immediate sender | Inferred: platform header trust falls outside app auth configuration |
| ILH05 | H12/H33/S03 Trusted Proxy Headers + S04 baseURL | Expected deployment origin/host restriction absent; I01 static string regenerated from untrusted-to-this-assay request URL; trusted forwarded feature itself unused | Inferred: explicit option shape conflated with stable deployment authority |
| ILH06 | H17/S07 Concurrency/throughput | Auth queue/overload/backpressure observations absent I01/I08; low-level database calls alone provide no throughput claim | Inferred: platform capacity omitted by functional auth scope |
| ILH07 | H18/S07 table/FAQ | Per-request/database budget and recovery retention facts unmeasured; I03 repeated setup work and I07 indexes do not establish quota headroom | Inferred: successful indexed SQL abstracts away aggregate work/plan limits |
| ILH08 | H21/S09 Supported APIs/Polyfills | Unsupported-method/fullpath/deployed runtime behavior unmeasured I08/I09 | Inferred: module resolution and config replace runtime API execution boundary |
| ILH09 | H22/S09 Get Started | Persistence child's predefault compatibility date has no nodejs_compat (scripts/persistence-worker.ts:8); production generic and release verifier flags exist | Inferred: verifier fixtures treated as one shared configuration class |
| ILH10 | H23/S10 limits table/CPU/Memory/startup | Full resource headroom and live plan settings unmeasured I08/I09 | Inferred: bundle/build capability compresses runtime limits |
| ILH11 | H36/S10 diagnostics sections | Fullproduct profiling/startup/memory pressure diagnostics unmeasured; I09 builds but no static budget measurement | Inferred: bundle production displaces optional runtime diagnostics |
| ILH12 | H28/S12 Which events/Event attributes | Structured auth-success/failure/session/authorization/management events not emitted in inspected I02/I04/I05/I06 branches | Inferred: HTTP decisions and error-only log treated as sufficient audit observability |
| ILH13 | H29/H32/S12 Data to exclude + explicit inference | Full-stack error/sink token secrecy/redaction boundary absent/unknown; I04 narrow outer log cannot constrain dependency logger.message/stack/object | Inferred: outer-error sanitization stands for all logging layers |
| ILH14 | H30/S12 Event collection | Central sanitation/encoding/log failure isolation absent/unknown I01/I04; logger objects delegated to runtime/native sink | Inferred: operational sink behavior outside authentication code boundary |
| ILH15 | H31/S12 Verification | Pipeline access control/failure/resource-depletion evaluation unresolved; I08 generic config cannot establish external log access settings | Inferred: externally operated logs excluded from implementation/config review |

## Scope, counts and stop

All 36 H and five P source items are individually mapped: 16 covered within code/source scope, eight conditional, 11 applicable omissions or partial omissions, and six unknown operational/inference items. These are trace dispositions, not severity or compliance counts. The source groups preserve alternatives and unknowns rather than merging every untested practice into a defect. Fifteen ILH records retain applicable/unknown omitted boundaries; alias source items remain explicit in the map. No recommendation to restore an item or modify a capability follows from this assay.

Known code facts: both DCR flags; native module memory; dependency isProduction predicate; request-derived static-form baseURL; native active-token validation; guarded SQLite claim; consent DELETE RETURNING; schema/indexes; compatibility flag in generic config/release verifier and absence from persistence child. Unknown: deployed NODE_ENV/host trust/proxy ingress, logging sink and sensitive error contents, quotas/load/headroom, full-path runtime compatibility, concurrent crash/error behavior, and real deployment contents. No claim that patched 1.6.11 advisory still affects 1.7.7, or that factory reset defeats the Map.

This stage stops after source-by-source traces. It does not update the oracle-stage map, run counterexamples, evaluate usefulness or select repairs. Source requirements keep their own MUST/SHOULD/vendor-advice scope; OWASP testing guidance is not converted into production feature requirements.


## Raw implementation input: implementation-mcp-loss.md

# MCP implementation-only loss assay

Inputs: frozen `mcp-sources.md`, all M001–M138, and `/private/tmp/blygger-auth-audit/candidate` production snapshot. Source cutoff2026-10-04. MCP current revision2026-07-28; SDK release2.3.0 Oct2,2026. Field Lab loss-audit card applied. Original source track rescanned; prior oracle findings were not used as substitute. No sibling-source reads, probes, tests, production edits, usefulness judgments or repairs.

Code observations establish implemented branches and delegation, not public behavior. I=custom implementation branch observed; D=native dependency delegation observed (negative behavior unmeasured); O=applicable boundary absent; K=feature/role conditional; X=client, testing/operator or source-context outside implementation; U=unknown breadth, deployed property, streaming premise or advisory range. Composite items preserve outside subclauses explicitly. An SDK-native guard is not called absent merely because the wrapper does not repeat it.

## Evidence and scope

Candidate anchors: `mcp`=src/mcp.ts, `oauth`=src/oauth.ts, `oauth-routes`=src/oauth-routes.ts, `permissions`=src/permissions.ts, `owner-api`=src/owner-api.ts, `index`=src/index.ts; package.json and wrangler.jsonc. All line numbers one-based. Production entry paths, owner authorization policy and OAuth configuration were read. Tests/docs changed after freeze were excluded from this implementation assay.

Dependency root: `/Users/kylemathews/programs/blygger-studio/.worktrees/codex-oauth-mcp/node_modules/`. Installed server package2.3.0 verified. SDK `index` anchors resolve to @modelcontextprotocol/server/dist/index.mjs; `src` to dist/src-Cqbh3MYc.mjs; `mcp bundle` to dist/mcp-DIH4cS6P.mjs. Provider anchors resolve to @better-auth/oauth-provider/dist/authorize-K1WHCNih.mjs, introspect-CNR06Oy3.mjs and utils-D6Hp4Qd_.mjs. Dependency directory is a supplied pinned dependency anchor, not cryptographically included in candidate manifest. No assertion about byte identity beyond observed package version.

Read source blocks in original order, then trace each relevant boundary through wrappers and native guards. Conditional roles were not invented: this Worker is AS/RS; no upstream MCP proxy, AS-CIMD fetch, experimental tasks, application-handle protocol or resource-template registration is established. Conformance testing advice remains in full coverage map as outside an implementation-only assay, not silently satisfied. No affected-version verdict uses unopened advisory pages.

## Full source-order map

| ID | State | Source/strength | Exact clause or preserved source index | Implementation boundary/disposition |
| --- | --- | --- | --- | --- |
| M001 | D | [S1 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning#revisions); primary/version fact | Current=2026-07-28; Draft=in-progress; Final=past/frozen; current can receive compatible updates. | SDK index:1344–1469 supports current revision and default legacy fallback; current revision constant src:4186. Full historical requirements not rescanned. |
| M002 | D | [S1 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning#revisions); MAY | Multiple protocol versions can coexist; select/accept each request independently. | SDK index:1344–1469 supports current revision and default legacy fallback; current revision constant src:4186. Full historical requirements not rescanned. |
| M003 | D | [S1 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning#revisions); primary/protocol fact | Current requests declare body protocol version and HTTP mirror; unsupported-version response lists supported versions. | SDK index:1344–1469 supports current revision and default legacy fallback; current revision constant src:4186. Full historical requirements not rescanned. |
| M004 | D | [S1 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning#revisions); primary/boundary | Handshake-based 2025-11-25 and earlier are distinct compatibility targets. | SDK index:1344–1469 supports current revision and default legacy fallback; current revision constant src:4186. Full historical requirements not rescanned. |
| M005 | I | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#protocol-requirements); OPTIONAL/SHOULD | Authorization optional; supported HTTP implementations SHOULD conform. #protocol-requirements | mcp:15–18 authenticates HTTP entry; delegated current handler follows. |
| M006 | U | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview); MUST | OAuth2.1 security for public/confidential clients. #overview | oauth:32–68 configures native OAuth provider; PKCE/client/token checks inspected, but broad OAuth2.1 public/confidential security is not fully established by bounded code scan; ILM01. ILM01. |
| M007 | I | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview); MUST | PRM; AS offers OAuth metadata or OIDC discovery. #overview | oauth-routes:17–21 emits PRM with mounted issuer;106–112 forwards both mounted OAuth/OIDC discovery. oauth:113–115 challenges with resource_metadata. AS need not expose all client probe paths. |
| M008 | I | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#scope-selection-strategy); SHOULD | Scope challenge. #scope-selection-strategy | oauth:113–115 initial challenge advertises default owner:read and PRM. |
| M009 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#scope-selection-strategy); MUST | Challenge authoritative; no assumed relationship to metadata scope set. #scope-selection-strategy | Client/operator/source context outside production AS/RS implementation assay. |
| M010 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#scope-selection-strategy); SHOULD | Initial challenge scopes, else metadata scopes; least privilege. #scope-selection-strategy | Client/operator/source context outside production AS/RS implementation assay. |
| M011 | D | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#authorization-response-validation); MUST/SHOULD | Record validated issuer with verifier/state; AS SHOULD emit iss, MUST advertise when emitted. #authorization-response-validation | Provider authorize:725–726 advertises issuer support;5484–5500 trusted error redirect adds iss;5757–5760 success adds iss. Client issuer-recording subclause outside Worker. |
| M012 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#authorization-response-validation); MUST | Issuer validation matrix, exact comparison after decoding; reject advertised-but-missing iss and mismatches, including error responses. #authorization-response-validation | Client/operator/source context outside production AS/RS implementation assay. |
| M013 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#resource-parameter-implementation); MUST | Resource in authorization/token requests, canonical MCP URI regardless AS support. #resource-parameter-implementation | Client/operator/source context outside production AS/RS implementation assay. |
| M014 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#canonical-server-uri); SHOULD | Specific canonical resource; scheme/host robustness, consistent slash. #canonical-server-uri | Client/operator/source context outside production AS/RS implementation assay. |
| M015 | X | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#token-requirements); MUST/MUST NOT | Bearer header every request; no query token. #token-requirements | Client/operator/source context outside production AS/RS implementation assay. |
| M016 | I | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#token-handling); MUST | Validate intended audience; invalid/expired=401; no foreign tokens. #token-handling | mcp:17–18 verifies before handler; oauth:117–130 native active JWT then owner/cnf/audience/credential-version/expiry/family/client/scope checks. mcp:40 creates internal request without incoming bearer. Handle-specific and upstream-token branches conditional. |
| M017 | I | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#refresh-tokens); MUST/SHOULD | Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens | oauth-routes:17–21 excludes offline_access from PRM; oauth:113–115 challenges operation scopes. Refresh confidentiality/storage part remains ILM04 unknown; client refresh metadata outside scope. ILM02. |
| M018 | O | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#error-handling); MUST | Appropriate 401/403/400. #error-handling | ILM02: owner-api:33–35 emits inner REST403 challenge, but mcp:28 filters inventory and40–42 converts inner error into tool content/isError; no MCP scope hook/authInfo. ILM03. |
| M019 | O | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#runtime-insufficient-scope-errors); SHOULD | Precise complete operation scope challenge, consistent strategy. #runtime-insufficient-scope-errors | ILM02: owner-api:33–35 emits inner REST403 challenge, but mcp:28 filters inventory and40–42 converts inner error into tool content/isError; no MCP scope hook/authInfo. ILM03. |
| M020 | K | [S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#step-up-authorization-flow); SHOULD/MUST | Step-up limits/scope union; RS MUST account for hierarchy. #step-up-authorization-flow | No scope hierarchy is declared: permissions has independent exact scope names; client step-up union/limits outside Worker. Hierarchy clause remains conditional, not inferred missing. |
| M021 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Approved client registry per user | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M022 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Check approval before third-party flow | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M023 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Secure consent storage | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M024 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent client name | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M025 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent API scopes | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M026 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent registered redirect URI | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M027 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent CSRF protection | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M028 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent anti-framing | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M029 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent cookie Host prefix | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M030 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent cookie Secure/HttpOnly/Lax | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M031 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent cookie signing or session | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M032 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Consent cookie client binding | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M033 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Exact redirect matching | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M034 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Reject changed registered redirect | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M035 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | No redirect patterns/wildcards | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M036 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Random per-request state | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M037 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Store state after consent | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M038 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Set state immediately before upstream redirect | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M039 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Callback state exact match | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M040 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Reject missing/mismatched state | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M041 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Single-use short-lived state | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M042 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#mitigation); MUST | Never set pre-consent state cookie | Static upstream identity/dynamic downstream proxy architecture not present in read entry points; native owner consent is not third-party proxy consent. |
| M043 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | SSRF mitigation for server-side MCP clients | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M044 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | HTTPS OAuth URLs | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M045 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | Private/reserved IP blocking | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M046 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | Validate each redirect destination | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M047 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | Egress policy/proxy consideration | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M048 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#server-side-request-forgery-ssrf); MUST/SHOULD/advice | DNS TOCTOU/pinning defense | No server-side MCP client or AS-CIMD metadata fetch configured; native metadata-fetch SSRF premise not established. |
| M049 | I | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#state-handle-hijacking); MUST/SHOULD | Verify every inbound request | mcp:17–18 verifies before handler; oauth:117–130 native active JWT then owner/cnf/audience/credential-version/expiry/family/client/scope checks. mcp:40 creates internal request without incoming bearer. Handle-specific and upstream-token branches conditional. |
| M050 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#state-handle-hijacking); MUST/SHOULD | Handle possession is not authentication | No application resource handle transport configured. OAuth consent handle is a distinct AS transaction; oauth-routes:33–34,61–71 binds it to owner session and expiry. |
| M051 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#state-handle-hijacking); MUST/SHOULD | Secure random handles | No application resource handle transport configured. OAuth consent handle is a distinct AS transaction; oauth-routes:33–34,61–71 binds it to owner session and expiry. |
| M052 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#state-handle-hijacking); MUST/SHOULD | Bind handles to authenticated principal | No application resource handle transport configured. OAuth consent handle is a distinct AS transaction; oauth-routes:33–34,61–71 binds it to owner session and expiry. |
| M053 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); MUST | Only allowed URL schemes; loopback development exception | Client/operator/source context outside production AS/RS implementation assay. |
| M054 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); MUST | No shell URL opening | Client/operator/source context outside production AS/RS implementation assay. |
| M055 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); MUST | URL parsing and sanitization | Client/operator/source context outside production AS/RS implementation assay. |
| M056 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); MUST | Reject shell-sensitive URL characters | Client/operator/source context outside production AS/RS implementation assay. |
| M057 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); SHOULD/advice | URL allowlist | Client/operator/source context outside production AS/RS implementation assay. |
| M058 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); SHOULD/advice | Platform native URL opener | Client/operator/source context outside production AS/RS implementation assay. |
| M059 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); SHOULD/advice | Browser CSP | Client/operator/source context outside production AS/RS implementation assay. |
| M060 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#oauth-authorization-url-validation); SHOULD/advice | Suspicious URL monitoring | Client/operator/source context outside production AS/RS implementation assay. |
| M061 | K | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#cimd-trust-policies); advice | CIMD domain trust and hostname display | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M062 | I | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Minimal initial scope set | oauth:113–115 initial missing-token challenge defaults owner:read; PRM enumerates supported scope set rather than forcing initial all-scope request. |
| M063 | O | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Incremental elevation | ILM02: owner-api:33–35 emits inner REST403 challenge, but mcp:28 filters inventory and40–42 converts inner error into tool content/isError; no MCP scope hook/authInfo. ILM03. |
| M064 | I | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Downscope tolerance | oauth-routes:68–75 checks selection is subset of consent scopes and forwards selected owner scopes; oauth:128–129 accepts resulting scope string. No runtime proof asserted. |
| M065 | O | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Precise scope challenges | ILM02: owner-api:33–35 emits inner REST403 challenge, but mcp:28 filters inventory and40–42 converts inner error into tool content/isError; no MCP scope hook/authInfo. ILM03. |
| M066 | O | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Correlated elevation logs | ILM03: oauth-routes:13–15 records error.name only; no correlated scope-elevation event/log observed in read production paths. ILM04. |
| M067 | X | [S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); advice | Denied elevation-loop cache | Client/operator/source context outside production AS/RS implementation assay. |
| M068 | I | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-location); MUST | PRM authorization_servers has at least one AS. | oauth-routes:17–21 emits PRM with mounted issuer;106–112 forwards both mounted OAuth/OIDC discovery. oauth:113–115 challenges with resource_metadata. AS need not expose all client probe paths. |
| M069 | X | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-location); MUST/MUST NOT | Separate credentials/tokens by issuing AS; no cross-AS assumption. | Client/operator/source context outside production AS/RS implementation assay. |
| M070 | I | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-location); MUST | Offer challenge resource_metadata OR well-known PRM. | oauth-routes:17–21 emits PRM with mounted issuer;106–112 forwards both mounted OAuth/OIDC discovery. oauth:113–115 challenges with resource_metadata. AS need not expose all client probe paths. |
| M071 | X | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#protected-resource-metadata-discovery-requirements); MUST | Support both; challenge wins, else path-specific PRM then root. #protected-resource-metadata-discovery-requirements | Client/operator/source context outside production AS/RS implementation assay. |
| M072 | X | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-metadata-discovery); MUST | Mounted issuer discovery order: host/.well-known/oauth-authorization-server/path; host/.well-known/openid-configuration/path; issuer/.well-known/openid-configuration. #authorization-server-metadata-discovery | Client/operator/source context outside production AS/RS implementation assay. |
| M073 | X | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery); MUST | Root issuer: OAuth metadata then root OIDC. Same section. | Client/operator/source context outside production AS/RS implementation assay. |
| M074 | X | [S4 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery); MUST/MUST NOT | Metadata issuer identical to discovery issuer; reject mismatches. Same section. | Client/operator/source context outside production AS/RS implementation assay. |
| M075 | X | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration); SHOULD | Priority: pre-registration, supported CIMD, supported DCR, user credentials. Intro. | Client/operator/source context outside production AS/RS implementation assay. |
| M076 | K | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#client-id-metadata-documents); SHOULD | CIMD support. #client-id-metadata-documents | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M077 | K | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#implementation-requirements); MUST | HTTPS client URL with path; client_id/name/redirect_uris; ID equals document URL. #implementation-requirements | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M078 | K | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration); MUST | Exact fetched ID; JSON/required fields; validate requested redirect. Same section. | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M079 | K | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration); SHOULD | Fetch URL-form ID; honor cache headers; security considerations. Same section. | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M080 | K | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration); MAY | private_key_jwt with JWKS. Same section. | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M081 | X | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#pre-registration); SHOULD | Static credential option. #pre-registration | Client/operator/source context outside production AS/RS implementation assay. |
| M082 | I | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#dynamic-client-registration); deprecated/MAY | DCR remains allowed compatibility mechanism. #dynamic-client-registration | oauth:37 allows anonymous DCR; oauth-routes:106 forwards register. Source says compatibility MAY, not mandatory DCR. |
| M083 | X | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#application-type-and-redirect-uri-constraints); MUST/SHOULD | Appropriate application_type; native/web guidance; handle redirect rejection and meaningful error. #application-type-and-redirect-uri-constraints | Client/operator/source context outside production AS/RS implementation assay. |
| M084 | X | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration#authorization-server-binding); MUST/MUST NOT | Persist credential issuer binding; changed AS requires re-registration; no cross-AS reuse. #authorization-server-binding | Client/operator/source context outside production AS/RS implementation assay. |
| M085 | X | [S5 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration); SHOULD/fact | Mismatched pre-registration error; CIMD identifiers portable, no re-registration. Same section. | Client/operator/source context outside production AS/RS implementation assay. |
| M086 | U | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#token-theft); MUST | Secure token storage; OAuth2.1 security. #token-theft | ILM04: wrapper stores code/token hashes, grant metadata and hashed client secret; full provider persistence confidentiality/production log/transit properties not established. ILM02. |
| M087 | I | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations); SHOULD | Short-lived access tokens. Same section. | oauth:39 configures normal access token3600s, manual token30days. Source provides no numeric maximum; this is configuration evidence, not judgment that all tokens are short. |
| M088 | D | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations); MUST | Refresh rotation. Same section. | Native provider introspect:1881 rotation and2146 replay branch, oauth:44–55 family bookkeeping; public runtime outcomes not measured. |
| M089 | U | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#communication-security); MUST | HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security | ILM05: locations derived from request.url and provider issuer helper; deployment TLS and full non-loopback redirect-scheme matrix not established by frozen config. ILM05. |
| M090 | X | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#authorization-code-protection); MUST | PKCE, verify support before flow, SHA-256 challenge when capable. #authorization-code-protection | Client/operator/source context outside production AS/RS implementation assay. |
| M091 | D | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations); MUST | OIDC metadata advertises challenge methods; C refuses absent field in either discovery style. Same section. | Provider metadata authorize:725 code_challenge_methods_supported=[S256]; native PKCE utils:838–848 defaults required and validates SHA256. Client refusal part outside Worker. |
| M092 | D | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#open-redirection); MUST | Registered exact redirect validation. #open-redirection | Provider authorize:5390–5428 resolves registered redirect (loopback port handling explicit);5484–5500 checks trusted redirect before error redirect. oauth-routes:38 displays hostname with anti-framing. No public negative proof asserted. |
| M093 | X | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations); SHOULD | State verification; discard missing/mismatch. Same section. | Client/operator/source context outside production AS/RS implementation assay. |
| M094 | D | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations); MUST/SHOULD/MAY | Precautions for untrusted redirect; trust before automatic redirect; user warning allowed. Same section. | Provider authorize:5390–5428 resolves registered redirect (loopback port handling explicit);5484–5500 checks trusted redirect before error redirect. oauth-routes:38 displays hostname with anti-framing. No public negative proof asserted. |
| M095 | K | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#client-id-metadata-document-security); MUST/SHOULD | Consider draft section6 security; SHOULD consider SSRF. #client-id-metadata-document-security | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M096 | K | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#localhost-redirect-uri-risks); SHOULD/MAY/MUST | Localhost warning; optional attestation; MUST display redirect hostname. #localhost-redirect-uri-risks | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M097 | K | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#trust-policies); MAY | Domain trust policies. #trust-policies | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M098 | K | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#confused-deputy-problem); MUST | Per-client consent before third-party authorization. #confused-deputy-problem | CIMD/proxy feature not configured. DCR compatibility exists; do not promote optional-feature support advice into assumed Worker defect. |
| M099 | I | [S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#access-token-privilege-restriction); MUST/MUST NOT | Validate before processing/returning data; audience binding; separate upstream token; no passthrough. #access-token-privilege-restriction | mcp:17–18 verifies before handler; oauth:117–130 native active JWT then owner/cnf/audience/credential-version/expiry/family/client/scope checks. mcp:40 creates internal request without incoming bearer. Handle-specific and upstream-token branches conditional. |
| M100 | I | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); MUST | Single POST endpoint. Intro. | index:40 mounts one MCP route; handler index:1066,modern dispatch require POST (legacy fallback distinct). |
| M101 | I | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#security--endpoint); MUST | Validate Origin; invalid present Origin=403. #security--endpoint | mcp:15–16 rejects present Origin not equal request URL origin with403; absent Origin continues. Custom guard used, not SDK wildcard helper. Native edge topology not measured. |
| M102 | I | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); SHOULD | Localhost bind; authenticate connections. Same section. | mcp:17 verifies each entry request; Worker remote deployment has no local listen bind. Proper-auth SHOULD has concrete custom wrapper. |
| M103 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#sending-messages); MUST | New POST per single request/notification; Accept JSON+SSE; 202 empty notifications; JSON-or-SSE response. #sending-messages | SDK index:40–210 PerRequestHTTPServerTransport and1346–1469 modern classifier support notification202 and JSON/auto-SSE response; validation delegated. No raw HTTP proof asserted. |
| M104 | U | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#receiving-messages); MUST/SHOULD | Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages | ILM06: SDK emits related SSE, no-buffer/keepalive and cancellation controls; wrapper mcp:48–53 closes handler immediately after Response resolves. Stream feature/lifetime boundary conditional; ordinary JSON callback does not prove stream truncation. ILM06. |
| M105 | U | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); SHOULD/advice | No-buffer header; keepalive comments; no resumption. Same section. | ILM06: SDK emits related SSE, no-buffer/keepalive and cancellation controls; wrapper mcp:48–53 closes handler immediately after Response resolves. Stream feature/lifetime boundary conditional; ordinary JSON callback does not prove stream truncation. ILM06. |
| M106 | U | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#cancellation); MUST/SHOULD | Disconnect=cancellation; stop soon; no further messages. #cancellation | ILM06: SDK emits related SSE, no-buffer/keepalive and cancellation controls; wrapper mcp:48–53 closes handler immediately after Response resolves. Stream feature/lifetime boundary conditional; ordinary JSON callback does not prove stream truncation. ILM06. |
| M107 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#protocol-version-header); MUST | Version header/body match; unknown-version 400 supported list; method-not-found 404/-32601. #protocol-version-header | SDK src:5121–5206 checks standard headers, version/body and decoded method/name; index:1354 unsupported version400 supported-list,1356 guard, installModernOnlyHandlers. Native negative coverage unknown; absence local duplicate guard not bug. Intermediary subclauses outside Worker. |
| M108 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#standard-request-headers); MUST | Required Method/Name; safe encoding/decoded comparisons. #standard-request-headers | SDK src:5121–5206 checks standard headers, version/body and decoded method/name; index:1354 unsupported version400 supported-list,1356 guard, installModernOnlyHandlers. Native negative coverage unknown; absence local duplicate guard not bug. Intermediary subclauses outside Worker. |
| M109 | K | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#schema-extension); conditional MUST | x-mcp-header syntax/type/path/uniqueness; reject invalid tool. #schema-extension | No x-mcp-header schema annotation in registered tools (mcp:29–35); SDK index:1393 supports schema validation if configured. |
| M110 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#value-encoding); MUST | Encoding, sentinel ambiguity, omitted/null values, invalid-character and mismatch rejection. #value-encoding | SDK src:5121–5206 checks standard headers, version/body and decoded method/name; index:1354 unsupported version400 supported-list,1356 guard, installModernOnlyHandlers. Native negative coverage unknown; absence local duplicate guard not bug. Intermediary subclauses outside Worker. |
| M111 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#server-validation); MUST/SHOULD | 400/-32020 validation; numerical integers; intermediaries verify validation-capable version. #server-validation | SDK src:5121–5206 checks standard headers, version/body and decoded method/name; index:1354 unsupported version400 supported-list,1356 guard, installModernOnlyHandlers. Native negative coverage unknown; absence local duplicate guard not bug. Intermediary subclauses outside Worker. |
| M112 | D | [S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#backward-compatibility); SHOULD | Inspect modern errors before legacy fallback; modern-only GET/DELETE405, ignore session/resumption headers. #backward-compatibility | SDK index:1344 default legacy fallback; modern path installs method handlers, legacy path1066POST-only. App did not request modern-only mode. Client fallback subclause outside Worker. |
| M113 | X | [S8 section](https://github.com/modelcontextprotocol/inspector); descriptive/tool | Web inspection, scriptable CLI for CI, TUI share package; no claim they prove AS conformance. | Client/operator/source context outside production AS/RS implementation assay. |
| M114 | X | [S8 section](https://github.com/modelcontextprotocol/inspector); security boundary | Secrets go to OS keychain when available; fallback secrets file can be unencrypted absent supplied key. | Client/operator/source context outside production AS/RS implementation assay. |
| M115 | X | [S8 section](https://github.com/modelcontextprotocol/inspector); version boundary | Main is released v2; v1 is security-fix line. | Client/operator/source context outside production AS/RS implementation assay. |
| M116 | X | [S8 section](https://github.com/modelcontextprotocol/inspector); pointer | README links testing/quality guide; not separately inspected within budget. | Client/operator/source context outside production AS/RS implementation assay. |
| M117 | K | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6qxp-vccf-f47h); 2026-09-30 | [Credential sent to server-selected AS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6qxp-vccf-f47h) | Advisory index-only lead: client/proxy/task/localhost feature absent in read Worker paths; affected ranges remain unknown, not cleared as safe. |
| M118 | K | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-22jm-h49p-29qw); 2026-10-02 | [Experimental task/session binding](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-22jm-h49p-29qw) | Advisory index-only lead: client/proxy/task/localhost feature absent in read Worker paths; affected ranges remain unknown, not cleared as safe. |
| M119 | K | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6prh-2h8m-c8cw); 2026-10-02 | [Cross-origin redirects resend headers/bodies](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6prh-2h8m-c8cw) | Advisory index-only lead: client/proxy/task/localhost feature absent in read Worker paths; affected ranges remain unknown, not cleared as safe. |
| M120 | U | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7); 2026-02-04 | [Shared server/transport response leakage](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7) | ILM07: advisory pages/ranges not opened in frozen source budget; no affected-version conclusion. Per-request factory present; UriTemplate resource feature not used by visible tools. ILM07. |
| M121 | U | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff); 2026-01-07 | [UriTemplate ReDoS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff) | ILM07: advisory pages/ranges not opened in frozen source budget; no affected-version conclusion. Per-request factory present; UriTemplate resource feature not used by visible tools. ILM07. |
| M122 | K | [S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-w48q-cv73-mx4w); 2025-12-02 | [Localhost DNS protection default](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-w48q-cv73-mx4w) | Advisory index-only lead: client/proxy/task/localhost feature absent in read Worker paths; affected ranges remain unknown, not cleared as safe. |
| M123 | K | [S10 section](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-7f8r-222p-6f5g#description); primary advisory | Inspector<0.14.1 unauthenticated stdio proxy RCE; patched0.14.1, S10#description | Inspector stdio proxy not a production Worker component; advisory applies to external tooling if deployed. |
| M124 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); testing/tool | Independent wire capture and scenario checks; client/server modes are separate. | Client/operator/source context outside production AS/RS implementation assay. |
| M125 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); testing/tool | --requirements revision freezes release requirements; --suite/--spec-version selects evolving suites. | Client/operator/source context outside production AS/RS implementation assay. |
| M126 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); boundary | Requirement sets deliberately omit AS scenarios; MCP AS implementation is beyond own role scope. | Client/operator/source context outside production AS/RS implementation assay. |
| M127 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); testing/tool | not_scored: extension, added-after-release, pending reference fixture; reports still show them. | Client/operator/source context outside production AS/RS implementation assay. |
| M128 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#expected-failures); testing/tool | Baseline failure remains requirement failure even if CI exit0; stale baseline pass exits1. | Client/operator/source context outside production AS/RS implementation assay. |
| M129 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#expected-failures); testing/tool | Per-check baseline narrower than whole scenario; repeated IDs collapse; skipped checks differ from reached checks. | Client/operator/source context outside production AS/RS implementation assay. |
| M130 | X | [S11 section](https://github.com/modelcontextprotocol/conformance#running-against-an-sdk-at-a-specific-ref); testing/tool | List scenarios; auth/client metadata/DCR examples; test exact SDK ref and each mode. | Client/operator/source context outside production AS/RS implementation assay. |
| M131 | X | [S11 section](https://github.com/modelcontextprotocol/conformance); limit/conflict | README still calls 2026-07-28 “draft” in lifecycle prose while release/versioning sources identify current; do not use that stale label to redefine publication status. | Client/operator/source context outside production AS/RS implementation assay. |
| M132 | I | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes); implementation guidance | One server/transport per request; already-connected Server.connect rejects. | mcp:25–26 creates factory/newMcpServer per handler; SDK index:1377/1431/1498 creates per-request instance/inflight closure. No concurrency runtime proof asserted. |
| M133 | X | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes); implementation fact | Default redirect policy stays same-origin; same-host HTTP→HTTPS allowed; follow opt-in weakens boundary. Browser redirects otherwise fail. | Client/operator/source context outside production AS/RS implementation assay. |
| M134 | K | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes); implementation fact | maxToolInputElements and expectedResource are opt-in/off by default; verifier must support audience check. | ILM08: maxToolInputElements not passed at mcp:26, SDK mcp bundle:1639/1811 leaves it off. expectedResource middleware not used; oauth:124 implements audience gate explicitly. Optional configuration fact preserved, no MUST omission. ILM08. |
| M135 | I | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes); version boundary | Server/client/core2.3.0; node2.1.1; express/hono2.0.2; fastify2.0.1. SDK2.3.0 does not imply every adapter2.3.0. | package.json pins server/client2.3.0; installed server package inspected2.3.0. Other adapters not assigned this version without evidence. |
| M136 | X | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes); implementation guidance | eventsource-parser>=3.0.8, large SSE performance fix. | Client/operator/source context outside production AS/RS implementation assay. |
| M137 | K | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0); implementation fact | Origin helper accepts scheme wildcard; presence of helper is not proof of configured origin policy. | SDK helper wildcard fact does not govern custom mcp:15–16 exact-origin guard; helper use not assumed. |
| M138 | X | [S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0); implementation fact | Legacy SSEClientTransport 401 refresh limited once. | Client/operator/source context outside production AS/RS implementation assay. |

## Raw recovered items, source order

### ILM01 — Broad AS security delegation remains bounded

- Source support: [M006, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview) — MUST: OAuth2.1 security for public/confidential clients. #overview. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Native authorization/token validation code exists, but this source row imports broad OAuth2.1 security beyond the clauses independently traced here. This is an unresolved breadth boundary, not an assertion that the provider lacks a guard.
- Where it vanished or stopped: oauth:32–68; native provider PKCE/issuer/client/redirect routines.
- Reduction rule: A provider configuration can stand in for a full imported security contract; inferred only. No explicit author rejection or motive was observed.

### ILM02 — Storage and refresh secrecy evidence boundary

- Source support: [M017, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#refresh-tokens) — MUST/SHOULD: Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens; [M086, S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#token-theft) — MUST: Secure token storage; OAuth2.1 security. #token-theft. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Grant/code hashes and hashed client-secret configuration exist. Full native token persistence representation, deployment confidentiality, and logging secrecy were not established. Unknown, not absence of secure storage.
- Where it vanished or stopped: oauth:16,64,132–153; bounded native provider inspection.
- Reduction rule: Functional token validation and hashed wrapper records compress a broader storage/transit contract; inferred only. No explicit author rejection or motive was observed.

### ILM03 — Operation-specific MCP insufficient-scope boundary

- Source support: [M018, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#error-handling) — MUST: Appropriate 401/403/400. #error-handling; [M019, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#runtime-insufficient-scope-errors) — SHOULD: Precise complete operation scope challenge, consistent strategy. #runtime-insufficient-scope-errors; [M063, S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization) — advice: Incremental elevation; [M065, S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization) — advice: Precise scope challenges. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: An MCP operation HTTP403 with precise complete required scopes is absent from the wrapper. Missing basic scopes hide tools; conditional additional publish scope reaches inner REST403, then becomes tool error content. Initial401 discovery challenge remains implemented.
- Where it vanished or stopped: mcp:28,35,40–42,48; owner-api:29–35; SDK index:1408; SDK scope hook mcp bundle:753–775.
- Reduction rule: Tool availability and error content reduce distinct transport-level authorization decisions; inferred only. No explicit author rejection or motive was observed.

### ILM04 — Correlated scope-elevation log advice

- Source support: [M066, S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization) — advice: Correlated elevation logs. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: No production path in the read files records requested/new/prior scopes as a correlated elevation event. The only explicit error logger emits name. Advice strength retained.
- Where it vanished or stopped: oauth-routes:13–15,61–78; mcp:28–42.
- Reduction rule: Minimal error logging omits an elevation observation dimension; inferred only. No explicit author rejection or motive was observed.

### ILM05 — Production HTTPS boundary remains unknown

- Source support: [M089, S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#communication-security) — MUST: HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Endpoint/issuer locations depend on request URL; provider helper normalizes issuer URL and native redirect validation exists. Frozen Worker configuration does not establish deployed HTTPS enforcement or every unsafe redirect-scheme receiving branch.
- Where it vanished or stopped: oauth:12–14,63; provider authorize:5350,5390–5428; wrangler.jsonc:20–21.
- Reduction rule: HTTPS deployment context is implicit rather than observed; inferred only. No explicit author rejection or motive was observed.

### ILM06 — Conditional response-stream lifetime boundary

- Source support: [M104, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#receiving-messages) — MUST/SHOULD: Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages; [M105, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) — SHOULD/advice: No-buffer header; keepalive comments; no resumption. Same section.; [M106, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#cancellation) — MUST/SHOULD: Disconnect=cancellation; stop soon; no further messages. #cancellation. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: SDK can resolve an SSE Response before final result and carries no-buffer, keepalive and cancellation controls. Wrapper finally closes handler after fetch returns. No progress notification/task/subscription path configured in visible tools; thus continued streaming lifetime is unresolved when such a path is active, not a demonstrated ordinary-call failure.
- Where it vanished or stopped: mcp:48–53; SDK index:148–210,1408–1441,1498–1503.
- Reduction rule: Response object completion is treated as operation completion; inferred from unconditional finally closure, not known intent. No explicit author rejection or motive was observed.

### ILM07 — Advisory applicability remains unknown

- Source support: [M120, S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7) — 2026-02-04: [Shared server/transport response leakage](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7); [M121, S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff) — 2026-01-07: [UriTemplate ReDoS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff). Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Frozen source preserves advisory titles only; exact affected ranges and fixes unavailable in this assay. Per-request instances and absent resource templates are architecture observations, not proof of unaffected installed package.
- Where it vanished or stopped: mcp:25–26; S9 advisory-index-only source boundary.
- Reduction rule: Release pin or architectural alignment cannot replace an uninspected advisory range; inferred only. No explicit author rejection or motive was observed.

### ILM08 — Optional SDK input-limit fact retained

- Source support: [M134, S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes) — implementation fact: maxToolInputElements and expectedResource are opt-in/off by default; verifier must support audience check.. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: No maxToolInputElements configured; option remains off. This is a conditional hardening fact, not missing mandatory behavior. The parallel expectedResource option is also unused, but wrapper verifies resource audience itself.
- Where it vanished or stopped: mcp:26; oauth:124; SDK mcp bundle:515–540,1639,1811.
- Reduction rule: SDK defaults retained for input breadth while audience enforcement is supplied outside middleware; inferred from configuration, not known rationale. No explicit author rejection or motive was observed.

## Coverage, limits and stop

138/138 individual source IDs mapped once. 8 recovered records retain 15 distinct source IDs; includes conditional and unknown recoveries, not 8 confirmed defects. State counts: {'D': 15, 'I': 18, 'K': 50, 'O': 5, 'U': 8, 'X': 42}. Applicable absent boundary IDs: M018, M019, M063, M065, M066 (normative/SHOULD/advice distinctions retained).

All12 frozen source blocks received a disposition. Normative/header behaviors delegated to SDK are code-observed, with public positive/negative and edge-proxy behavior unknown. Broad imported OAuth2.1 obligations, native persistence confidentiality, deployed HTTPS, active streaming lifetime and two advisory affected ranges remain unknown. Optional input limit remains explicitly off; audience is explicitly checked in wrapper. No recommendation, risk rank or usefulness score follows from recovery.

Stop: bounded implementation-only pass complete. No test execution, public endpoint request, full historical-protocol audit, exhaustive provider audit, dependency advisory expansion or production modification occurred.

## Supplemental project-invariant record PI01 (registered before probe)
Decision52 requires one listed/revocable token model, per-token and revoke-all. Candidate remembers OAuth authorizations keyed by client_id; repeated grant with narrowed scope overwrites the listing while prior tokens may remain active. Claim to verify: two independently approved grants for the same DCR client cannot be listed or revoked separately and listing may understate scope. Severity pending public reproduction. Root owns production grant rows/claims; HEAD unchanged b88a0f34 + frozen hash above.


## Raw implementation OAuth loss assay (immutable, before evaluation probes)

Snapshot: frozen candidate per manifest; assay file implementation-oauth-loss.md. No proposed repair or severity supplied. Initial all18 ILO records unverified. Full original raw support, mapping and limits follow.

# Implementation-only OAuth/OIDC loss audit

Frozen input: oauth-sources.md, all290 claim rows,12 primary sources; frozen candidate production only. This is the Field Lab loss-audit assay. No test execution, probes, production edits, repair advice, severity or usefulness judgment. Static covered means an inspected branch/configuration represents the relevant AS/RS/OP obligation; it is not behavioral compliance. Mixed client clauses are outside server responsibility and remain verbatim in the mapping. Unknown means incomplete static evidence; it is not applicable omission.

Partition: **132 covered / 28 applicable omission / 59 conditional/outside / 71 unknown =290**. **18 raw recovered records**, source-order ILO01–ILO18. No row is dropped or counted twice. Applicable omission means source detail absent or differently represented in inspected surface, including SHOULD/advice and documentation boundaries; it is not an established vulnerability.

## Inspected inputs and boundaries

Original sources: all inventory/raw files/section URLs from oauth-sources.md. Raw source excerpts were re-scanned directly (oauth-raw/implementation-rescan-extracts.txt plus full original raw pointers), including OAuth/PKCE error enums, refresh/code replay, CORS/frame defense, mounted metadata conventions, resource metadata, DCR and OIDC prompt/offline/dynamic clauses. The oracle summary and sibling tracks were not used as source substitutes. S12 remains official overview only; no individual conformance plan opened.

Production: candidate/src/oauth.ts,oauth-routes.ts,oauth-storage.ts,authorization-api.ts,auth.ts,spa.ts,owner-api.ts,permissions.ts,index.ts; bearer integration in mcp.ts; migration0018. Original manifest binds freeze. Dependencies: exact lockfile-resolved @better-auth/oauth-provider1.7.7 and better-auth1.7.7 public archives, SHA512 integrity verified before extraction, at oauth-dependency-source. Their public library keys/fixtures are not host credentials. No host credentials inspected.

Anchors below are relative to candidate/src/ or provider package/dist/ unless Better Auth db path named. Dependency hashes and frozen primary hashes remain in lock/manifest/original inventory. Tests/docs are outside this stage; alternate BetterAuthDriver fixtures do not prove production handoff.

## Anchor groups

### R

Provider authorize-K1WHCNih.mjs:1679–1712,1754–1805,5384–5444,5570–5586; exact registered strings, narrow loopback port matching, native reverse-domain registration rules, invalid redirect goes to local error route. oauth-routes.ts:42–54 preserves native validated response; spa.ts:17 restricts return_to. This covers AS branches, not every external client.

### P

oauth.ts:35–40 only code/refresh; provider metadata:699–725 advertises code/S256; authorize:5617–5626 enforces required paired S256; introspect:1892–1945 binds code/client/redirect/resource and 1980–2011 binds verifier to stored challenge. Client portions remain outside server assessment. Exact verifier syntax/error distinctions are separately recovered.

### A

Provider utils-D6Hp4Qd_.mjs:521–594 raw form credential cardinality, empties omitted, multiple authentication methods rejected, decoded Basic;629–665 maps registered auth method, disabled/client/secret/grant/scope validation and Basic challenge. authorize:1831–1869 mutually exclusive valid public JWKS/JWKS_URI. oauth-routes.ts:80–102 preserves response headers but normalizes status; no new universal challenge requirement inferred for body-only invalid_client.

### T

oauth.ts:23–27 absolute 30d grant deadline and credential-version guard,117–130 active token/sub/aud/cnf/expiry/scopes/family verification; owner-api.ts and permissions.ts apply operation scopes; MCP bearer gate uses same verifier. Provider introspect:945–979 resource URI syntax,355–389 repeated resource extraction,1892–1945 code resource subset,2128–2179 refresh scope/resource binding,1545–1619 stored refresh scope/resources,1869–1884 JSON token fields. oauth.ts:132–153 owner revocation/listing. Cryptographic randomness/signing code presence is evidence, not an entropy test or deployment assurance.

### M

oauth.ts:14 mounted issuer, jwt RS256 at68; oauth-routes.ts:17–21 JSON PRM and106 native metadata forwarding. Provider authorize:690–790 explicit code/query/code+refresh grants/auth methods/S256/public subjects/RS256 configuration/JWKS/UserInfo; introspect authorization schema:1031–1053 accepts display/ui_locales/acr_values and passthrough claims_locales. OIDC issuer-appended well-known is correct for mounted OIDC. RFC8414 prefix route separately recovered. Transport scheme/complete JWKS content remain unknown where not verified.

### O

oauth.ts:57–79 owner-only bridge; oauth-routes.ts:27–78 signed query, native owner/session/version binding,10min one-use DELETE consent, local stylesheet, escaped self-asserted name/redirect host warning and selected owner scopes; default Hono redirects302 (not307). Provider authorize token-code binding and state serialization; introspect:1395–1425 ID token iss/owner sub/client aud/nonce/iat/exp/auth_time/at_hash and RS256 sign. No automatic public-client prior approval: fresh consentReferenceId. This does not establish prompt/login/max_age semantics, offline consent specificity or full sanitation.

### D

Provider authorize:1720–1753 DCR enabled/anonymous gate,POST response201;1754–1805 defaults/application type/grants-response consistency;2190–2277 native registration field mapping; client secrets generated and hashed by default(utils:475ff). Language/text handling and unknown metadata follow native passthrough/default representation; transport TLS remains unknown. Coverage is server clause static anchor, not measured network behavior.

### B

oauth.ts:117–130 Authorization Bearer gate exists; accepts case-insensitive scheme, uses native active-token validation. Regex is broader than RFC bearer grammar; no claim that arbitrary whitespace tokens authenticate. Full malformed-wire behavior unmeasured.

### C

RP/client obligations, optional unselected signed metadata/Request Objects/pairwise/software statements/symmetric ID-token signing/body-query bearer/client_credentials/WebFinger/Web Message, or official conformance-program description without certification claim. Mixed server/client rows keep all original clauses below; server binding is covered elsewhere when applicable. No universal optional-feature mandate. S06 trust selection remains an express boundary. Public/static-secret registration type exposure itself remains unknown.

### F

Specific unresolved mechanism/profile detail; see U-Family, U-OP and source-level traces below. Library code is present, but full dynamic outcome, arbitrary hint/request subject checks, UserInfo wire errors/methods, native type confidentiality, and dynamic-OP profile obligations are not established by this bounded static inspection.

### U — unresolved static evidence

Includes TLS/certificate/proxy/backend secrecy, deployment threatmodel, complete codepoint/errorcharacter guarantees, full library random entropy/security, all endpoint cacheheaders, JWKS private-key stripping/rollover, UserInfo negotiated signatures/wirechallenge, authentication method assertions and client-type exposure. No inference that a feature absent from the wrapper is absent from dependencies. Deployment requirements remain operational limits, not bugs.

### U-Family — concurrency, code deadlines and scope lineage

Native refresh rotation marksoldrevoked via incrementOne then creates replacement (introspect:1545–1605). Native replay invalidates client/user family (2146–2166), with an explicit known TODO at1488–1495: separate access/refresh deleteMany permit concurrent rotation to rebuild family. Source promises detected reuse revokes active refresh, not a prescribed transaction primitive. Static mechanism exists; full inter-worker outcome remains unknown. Custom code replay adds oauth_revocations only when seen.client equals first form client_id and error invalid_grant (oauth-routes:88–100); Basic client_id lives in header, native checks still occur, so JWT revocation reach in that case is unknown, not assumed universally effective. Code consume uses Better Auth internal-adapter.mjs:787–857 transaction/consumeOne and expiry check; adapter actual atomic/deadline behavior was not probed. Native short codeTTL and wrapper30d grantdeadline are separate clocks. Refresh TTL renews on issuance, but wrapper grantReference deadline caps access; no universal TTL inferred. Native refresh scopes/resources retain bound values. oauth_authorizations listing is keyedclient_id and latest token overwrites scopes/resource; RS checks signed per-token scope, never this listing. No inspected normative source mandates one listing row per token or exact historical grant inventory, so no invented listing omission.

### U-OP — profile and production continuity

RS256/publicsubject/OIDCIDtokens/native auth_time are configured and codepresent. auth_time comes from native session creation; oldlegacycookie bridge createsnative session now, so true authentication freshness and refresh auth_time preservation remain unmeasured. Native max_age/prompt parser is present; custombridge issue recovered above. Native specificsub/idtokenhint/requestObject validation and complete UserInfo duties are unresolved. Metadata advertises end_session_endpoint which wrapper does not forward; no inspected source makes that optional endpoint universally required, so this mismatch is residue for a separately authorized metadata-truth assessment, not an invented mandatory endpoint claim. Code-only advertised response types versus Discovery recommended/required values and Core dynamicOP15.2 requirements remain profile-bound unknown: anonymous OAuthDCR plus openid scopes creates a plausible dynamic OP trigger, but full OIDC registration/profile relationship is not established by these12 sources. Retain each dynamic duty without declaring every OAuthAS must offer implicit/request_uri.

## Raw recovered records

### ILO01 — Sender constraint advice versus selected Bearer resources

Source IDs: S01-C016.

Static observation: Source SHOULD is applicable advice, not MUST. The package supports DPoP options, but oauth.ts:117–130 rejects any cnf token and no corresponding DPoP/mTLS resource verification is configured.

Where vanished: Resource bearer policy at oauth.ts:120.

Reduction rule: Known selected mechanism is ordinary Bearer; intent behind omitting sender constraints is unknown.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C016** [S01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1); **SHOULD**; trigger: AS and resource server. Use sender-constrained access tokens such as DPoP or mTLS. Boundary: Do not elevate to MUST or require both mechanisms.

### ILO02 — Authorization endpoint receives wildcard CORS

Source IDs: S01-C027, S08-C009.

Static observation: oauth-routes.ts:12 installs Access-Control-Allow-Origin:* on all paths and23–25 supplies OPTIONS headers for all paths, including authorize. Native metadata/direct-endpoint CORS support does not erase RFC9700 MUST NOT on authorization endpoint. OIDC direct browser-access advice remains distinct.

Where vanished: Wildcard OAuth middleware rather than endpoint-specific policy.

Reduction rule: Inferred reduction: one CORS rule for every protocol endpoint; code proves scope, not design intent.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C027** [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); **MAY / MUST NOT**; trigger: browser endpoint access. CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. Boundary: Cross-origin navigation is distinct from CORS.
- **S08-C009** [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); **SHOULD / NOT RECOMMENDED**; trigger: browser direct OIDC endpoints. Support CORS or other browser access methods on direct endpoints; authorization CORS discouraged. Boundary: S01 updates this to MUST NOT authorization CORS.

### ILO03 — Refresh issuance risk decision is not expressed per client

Source IDs: S01-C040.

Static observation: oauth.ts:35–40 enables offline_access/refresh with global TTL; no inspected custom risk callback decides which anonymous/public client should receive refresh tokens. Package issuance permission and owner consent exist; they are not a recorded threat/risk decision.

Where vanished: Provider options/issuance policy.

Reduction rule: Inferred reduction: global supported grant plus consent stands in for client risk assessment; no known rejection.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C040** [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); **MUST**; trigger: considering refresh-token issuance. Assess risk to decide whether a client receives refresh tokens. Boundary: Non-issuance permitted.

### ILO04 — Frame defense spans consent but not owner login

Source IDs: S01-C046, S01-C047, S09-C010.

Static observation: oauth-routes.ts:38 adds frame-ancestors none and XFO DENY only to consent. spa.ts login and shell have no matching frame header; index.ts mounts these routes without inspected framing middleware. Retain all-pages CSP SHOULD separately from clickjacking prevention MUST, and OIDC owner-UI defense. Authentication/prompt clauses in S09-C010 are also recovered in prompt record.

Where vanished: Legacy owner-authentication route outside consent renderer.

Reduction rule: Inferred reduction: protect explicit consent page rather than all authentication pages; no intent evidence.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C046** [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); **MUST**; trigger: AS interaction pages. Prevent clickjacking. Boundary: No single mandated header satisfies all contexts.
- **S01-C047** [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); **SHOULD**; trigger: AS interaction pages. Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. Boundary: Legacy unsupported-user-agent boundary stated in source.
- **S09-C010** [S09 §3.1.2.3](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates); **MUST / MUST NOT**; trigger: owner authentication. Authenticate if absent or prompt=login; no interaction prompt=none; prevent CSRF/clickjacking during owner UI. Boundary: Existing owner session alone does not satisfy explicit prompt=login.

### ILO05 — Client identifier-size documentation not part of production mapping

Source IDs: S02-C002.

Static observation: Native identifier generation exists; no production source contract documents its size. Documentation evidence is excluded in this implementation-only stage. This records source-to-code residue, not a bug in lack of code comments.

Where vanished: Documentation obligation cannot be demonstrated by server code alone.

Reduction rule: Known category boundary: implementation-only read, not known author choice.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C002** [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); **MUST NOT / SHOULD**; trigger: registered clients. Document identifier size. Boundary: No optional feature mandate inferred.

### ILO06 — Password authentication brute-force control absent from inspected owner layer

Source IDs: S02-C008.

Static observation: spa.ts:45–51 checks every supplied owner password; no owner-login rate policy in this production path. Native client-auth validation exists, but no selected token-specific brute-force policy was established in inspected provider configuration. This keeps owner-login evidence separate from source trigger client password-authenticated endpoint; package-wide defaults remain unknown, so only absent owner-layer policy is known.

Where vanished: Owner route and provider options.

Reduction rule: Inferred reduction: rely on password check/native defaults. Native default efficacy is unresolved; no dynamic claim.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C008** [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); **MUST**; trigger: client passwords issued. Protect password-authentication endpoints against brute force. Boundary: No optional feature mandate inferred.

### ILO07 — Token wrapper parsing precedes native cardinality/error handler

Source IDs: S02-C026, S02-C028, S02-C050.

Static observation: oauth-routes.ts:82 clone.formData() executes before native handler; unsupported/malformed body parse can reach onError JSON500. Native utils:537–579 detects duplicated nonempty authentication fields, but native token schema:4586–4598 and form parser preserve only resource specially; no inspected raw generic duplicate guard for code/grant_type/scope/verifier. Empty auth fields normalize; complete empty grant/scope omission not established. Native failed-verifier is invalid_request; wrapper normalizes status only. Preserve invalid_grant distinctions and duplicates/multiple-auth/unsupported-grant/invalid-scope fields, not generic any4xx.

Where vanished: Wrapper pre-parser and native token body-schema/error mapping.

Reduction rule: Known first-value wrapper get and native credential-only raw cardinality; inferred reduction: delegate all parser validity to native despite wrapper preparse.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C026** [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); **MUST**; trigger: token endpoint. Treat empty parameters as omitted. Boundary: No optional feature mandate inferred.
- **S02-C028** [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); **MUST**; trigger: token endpoint. Do not repeat parameters. Boundary: No optional feature mandate inferred.
- **S02-C050** [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); **protocol binding / REQUIRED**; trigger: token error. Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. Boundary: Description/URI optional; enum semantics preserved.

### ILO08 — Sensitive OAuth responses only explicitly carry no-store

Source IDs: S02-C049.

Static observation: oauth-routes.ts:12/38 sets no-store, no Pragma. Native token response createUserTokens introspect:1869–1884 returns JSON; provider NO_STORE_HEADERS definition must be assessed for every endpoint, so this absence is wrapper-local. Consent itself is a sensitive response with no Pragma. Exact RFC6749 requirement includes both headers; OIDC errata no-store alone does not delete it.

Where vanished: Custom consent response and OAuth middleware.

Reduction rule: Known wrapper header selection; inferred compression to one cache directive.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C049** [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); **MUST**; trigger: any response containing sensitive data. Use Cache-Control: no-store and Pragma: no-cache. Boundary: OIDC errata examples omit Pragma; OAuth requirement remains recorded.

### ILO09 — Public-client consent shows client and scope but no lifetime

Source IDs: S02-C063.

Static observation: oauth-routes.ts:35–38 renders self-asserted name, return host, resource and selected OWNER_SCOPES; no grant/token lifetime text. Fresh consentReferenceId avoids automatic prior approval and registered redirect/nativePKCE safeguards are present. The distinct source detail lifetime is absent from this UI.

Where vanished: Custom consent template.

Reduction rule: Inferred reduction: scope/host disclosure retained while lifetime omitted.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C063** [S02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2); **MUST; SHOULD**; trigger: unauthenticated public clients. Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. Boundary: Prior approval alone not proof of same public-client instance.

### ILO10 — PKCE verifier/challenge syntax not enforced by inspected schemas

Source IDs: S03-C001, S03-C004.

Static observation: Provider authorizationQuerySchema introspect:1047 code_challenge is plain string; token endpoint authorize:4592 verifier plain string; S256 hash comparison introspect:2007 does not enforce43–128 unreserved-character grammar. Method defaults/plain compatibility are conditional; requiring S256 is retained rather than making plain a mandate.

Where vanished: Native PKCE string schema and hash check.

Reduction rule: Known generic string validation; inferred reduction: hash equality stands in for syntactic contract.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S03-C001** [S03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1); **syntax / SHOULD**; trigger: PKCE verifier. Use 43–128 unreserved characters (ALPHA / DIGIT / - . _ ~). Boundary: No optional feature mandate inferred.
- **S03-C004** [S03 §4.3](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.3); **REQUIRED / default**; trigger: PKCE authorization request. Include challenge; omitted challenge method defaults to plain; challenge syntax 43–128 unreserved characters. Boundary: Source default does not force new deployments to offer plain.

### ILO11 — PKCE mismatch has invalid_request rather than invalid_grant

Source IDs: S03-C010.

Static observation: Provider introspect:2007–2011 throws UNAUTHORIZED with invalid_request when hash differs. oauth-routes.ts:100 changes HTTP to400 but preserves error body. Normal grant processing after valid match is present.

Where vanished: Native error enum survives wrapper status normalization.

Reduction rule: Known explicit enum; no inferred intent required.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S03-C010** [S03 §4.6](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6); **MUST**; trigger: verifier check. Correct match continues normal processing; mismatch returns invalid_grant. Boundary: Matching verifier does not bypass other token validation.

### ILO12 — OAuth metadata uses OIDC appended route for path issuer

Source IDs: S04-C010, S04-C011.

Static observation: oauth-routes.ts:106 forwards mounted /issuer/.well-known/oauth-authorization-server; index.ts mounts at issuer path, without inspected /.well-known/oauth-authorization-server/issuer-path route. RFC8414 requires host-before-path insertion for its convention; OIDC appending remains supported and correct. Application registered suffix/metadata profile details stay conditional, no blanket root-only issuer requirement.

Where vanished: Mounted OAuth metadata route selection.

Reduction rule: Known route placement; inferred reduction: share appended OIDC discovery routing across both documents.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S04-C010** [S04 §3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3); **MUST**; trigger: AS metadata supported. Publish JSON at HTTPS issuer-derived well-known insertion between host and path; application specifies registered suffix. Boundary: Default suffix oauth-authorization-server; multiple locations MAY.
- **S04-C011** [S04 §3.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.1); **MUST**; trigger: metadata retrieval. Use GET; strip terminating slash before inserting well-known prefix for path issuer. Boundary: Mounted issuer supported.

### ILO13 — Protected-resource metadata has no resource_name

Source IDs: S06-C003.

Static observation: oauth-routes.ts:21 publishes resource/scopes/authserver/header method, but no resource_name. Source strength RECOMMENDED is retained; not a MUST or functional behavior verdict.

Where vanished: Custom PRM JSON object.

Reduction rule: Known selected fields; inferred compression: identifiers and scopes retained, display name omitted.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S06-C003** [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); **RECOMMENDED**; trigger: PRM supported. Publish scopes_supported and resource_name; can omit supported scopes. Boundary: No default bearer method implied by omission.

### ILO14 — PRM has custom challenge URL but not derived well-known route

Source IDs: S06-C007, S06-C008.

Static observation: oauth-routes.ts:17–21 serves mounted auth/resources/api|mcp; oauth.ts:113–115 challenge uses that URL. No source-derived /.well-known/oauth-protected-resource/{resource-path} GET route appears in index mounts. Custom challenge retrieval is separately covered S06-C013. Source publication convention and profile suffix remain distinct.

Where vanished: Resource discovery route surface.

Reduction rule: Known route choice; inferred reduction: challenge-linked custom URL stands in for issuer/resource-derived convention.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S06-C007** [S06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3); **MUST**; trigger: PRM supported. Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. Boundary: Default /.well-known/oauth-protected-resource; multiple metadata locations allowed.
- **S06-C008** [S06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1); **MUST**; trigger: PRM retrieval. Use GET; strip host terminating slash before prefix insertion with path/query. Boundary: Host root and mounted resource can coexist.

### ILO15 — DCR invalid scope error has non-DCR error enum

Source IDs: S07-C014.

Static observation: Provider authorize:1824–1830 returns invalid_scope for unknown registration scope; RFC7591 registration response requires invalid_client_metadata for invalid client metadata. Normal201/client defaults and invalid_redirect_uri branches exist. Other software-statement error clauses remain conditional; all original support retained below.

Where vanished: Native DCR scope-validation enum.

Reduction rule: Known explicit error enum; presumed reuse of OAuth scope error is inferred.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S07-C014** [S07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2); **protocol binding / REQUIRED**; trigger: DCR rejection. Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. Boundary: Descriptions optional.

### ILO16 — Legacy login/bridge does not carry native prompt reauthentication law

Source IDs: S09-C007, S09-C041, S09-C045.

Static observation: oauth-routes.ts:43–46 redirects unauthenticated legacycookie request to interactive login before native prompt=none branch. oauth.ts:70–79/103–111 bridges old validlegacycookie to newlycreatednative session with current creation time; native authorize:5628–5634 applies max_age to native session.createdAt and routes prompt=login to configured login. spa.ts:41–44 validlegacycookie GETlogin goes tobase without reauthentication, and POSTlogin issues onlylegacycookie; no continuation clearing nativeprompt or renewingnativeauth demonstrated. Thus native prompt/max_age checks exist but wrapper prevents establishing silent error/noUI and actual active reauthentication; broad prompt selections/errors remain each exact source clause below.

Where vanished: Pre-native authorize gate, ownerSession creation and existing-cookie login route.

Reduction rule: Known separate session timelines/routes; inferred reduction: owner cookie validity supplies all OP authentication freshness.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C007** [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); **MUST / behaviors**; trigger: prompt parameter. none shows no UI and errors if silent auth/consent impossible; none cannot combine with other prompt; login reauthentication; consent/select_account behavior and errors when unsatisfied. Boundary: Single-account deployment can meet selection without inventing extra accounts.
- **S09-C041** [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); **MUST**; trigger: all OIDC OPs. Support prompt, including none and login behavior. Boundary: No optional feature mandate inferred.
- **S09-C045** [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); **MUST**; trigger: all OIDC OPs. Support max_age enforcement. Boundary: No optional feature mandate inferred.

### ILO17 — Offline_access remains hidden automatically retained protocol scope

Source IDs: S09-C035.

Static observation: oauth-routes.ts:35–38 displays only OWNER_SCOPES;71–74 re-adds openid/offline_access automatically on allow. No inspected explicit offline disclosure/choice or valid alternate-consent basis. Owner selectedscope consent exists; source requires offline consent and prompt=consent except valid otherconditions, web explicit/native recommended. No claim refresh issuance in every context needs offline_access.

Where vanished: Consent UI and protocol-scope merge.

Reduction rule: Known hidden protocolscope merge; inferred reduction: owner permission consent used as offline consent too.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C035** [S09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess); **MUST**; trigger: offline_access requested. Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. Boundary: Refresh tokens can be issued for other contexts; offline_access optional feature.

### ILO18 — Owner UserInfo access-log availability not expressed

Source IDs: S09-C060.

Static observation: Native UserInfo endpoint is forwarded; no owner access-log route/model is in inspected authorization-api/owner-api/migration. Source is privacy SHOULD and implementation-only absence; platform logs/access outside this snapshot remain unknown.

Where vanished: Owner management resource/log data model.

Reduction rule: Inferred category omission: authorization listing substituted for privacy access history; no known author decision.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C060** [S09 §17.2](https://openid.net/specs/openid-connect-core-1_0.html#AccessMonitoring); **SHOULD**; trigger: UserInfo privacy access. Make UserInfo access logs available to owner. Boundary: Privacy consideration, not central OAuth endpoint wire contract.

## Complete source coverage ledger

Every original ID occurs exactly once below. This reproduces original support rather than substituting a reduced audit summary. Evidence labels above give traceable code sites and limits. Unknown rows retain their exact source requirement for subsequent evaluation.

| Claim | Status | Anchor / record | Source / authority / trigger | Exact requirement | Boundary |
|---|---|---|---|---|---|
| S01-C001 | covered | R | [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); MUST / MUST NOT; redirect flows | Compare registered redirect URIs by exact string, with only the native loopback port exception. | No optional feature mandate inferred. |
| S01-C002 | covered | R | [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); MUST / MUST NOT; redirect flows | Do not expose open redirectors on the authorization server or client. | No optional feature mandate inferred. |
| S01-C003 | covered | O | [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); MUST / MUST NOT; redirect flows | Avoid forwarding owner credentials when redirecting a request that may contain them. | No optional feature mandate inferred. |
| S01-C004 | conditional/outside | C | [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); MUST; MAY alternatives; client callback handling | Clients prevent CSRF; verified PKCE support permits PKCE; OIDC nonce provides protection; otherwise use one-time state bound to user agent. | Client obligation, not a requirement that every AS request contain state. |
| S01-C005 | conditional/outside | C | [S01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1); REQUIRED; SHOULD; MAY alternative; client uses multiple AS issuers | Clients prevent mix-up, preferably with issuer identification; distinct redirect URIs are an alternative. | Single-AS client is expressly exempt under §4.4.2; single-owner AS does not prove client uses only one AS. |
| S01-C006 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Public clients use PKCE to prevent code injection and misuse. | No optional feature mandate inferred. |
| S01-C007 | conditional/outside | C | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Bind each transaction-specific challenge or OIDC nonce to the client and user agent. | No optional feature mandate inferred. |
| S01-C008 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Authorization servers support PKCE. | No optional feature mandate inferred. |
| S01-C009 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Enforce correct verifier whenever authorization includes a valid challenge. | No optional feature mandate inferred. |
| S01-C010 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Reject a verifier at token exchange if authorization contained no challenge. | No optional feature mandate inferred. |
| S01-C011 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); MUST; authorization code / PKCE | Provide a detectable PKCE capability. | No optional feature mandate inferred. |
| S01-C012 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); RECOMMENDED / MAY; PKCE capability publication | Publish code_challenge_methods_supported in AS metadata; deployment-specific detection is permitted. | Metadata field is recommended; capability detection mandatory. |
| S01-C013 | covered | P | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); RECOMMENDED / MAY; confidential code clients | PKCE recommended; confidential OIDC clients may instead use nonce with §4.5.3.2 safeguards. | No universal confidential-client PKCE MUST. |
| S01-C014 | conditional/outside | C | [S01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1); SHOULD; PKCE clients | Use a method concealing verifier; S256 is currently the only such method. | S03 separately makes S256 server MTI. |
| S01-C015 | covered | P | [S01 §2.1.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.2); SHOULD NOT / SHOULD; access tokens in authorization response | Avoid implicit/access-token response types unless injection and leakage mitigations hold; prefer code. | Not an unconditional AS prohibition of every implicit OIDC response type. |
| S01-C016 | applicable omission | ILO01 | [S01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1); SHOULD; AS and resource server | Use sender-constrained access tokens such as DPoP or mTLS. | Do not elevate to MUST or require both mechanisms. |
| S01-C017 | unknown | F | [S01 §2.2.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.2); MUST; refresh tokens for public clients | Use sender constraints or rotation. | No requirement to issue refresh tokens. |
| S01-C018 | covered | T | [S01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3); SHOULD; access token issuance | Restrict privileges to the minimum needed. | No optional feature mandate inferred. |
| S01-C019 | covered | T | [S01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3); SHOULD; access token issuance | Restrict audience to a specific resource server or a small set if necessary. | No optional feature mandate inferred. |
| S01-C020 | covered | T | [S01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3); SHOULD; access token issuance | Restrict resources and actions. | No optional feature mandate inferred. |
| S01-C021 | covered | T | [S01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3); MUST; resource request whose token was intended for another RS | Refuse requests for the wrong resource-server audience. | JWT aud is one permitted expression; JWT access-token format not mandatory. |
| S01-C022 | covered | T | [S01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3); normative lowercase obligation; resource/action restrictions in token | Verify permitted resource and action on every resource request; refuse requests outside them. | No particular scope vocabulary imposed. |
| S01-C023 | covered | P | [S01 §2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.4); MUST NOT; password grant | Do not use the resource-owner-password grant. | Owner login at AS is not this OAuth grant. |
| S01-C024 | covered | A | [S01 §2.5](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.5); SHOULD / RECOMMENDED; credentials can feasibly be kept confidential | Enforce client authentication; prefer asymmetric methods. | Public clients cannot be made confidential by distributing a static secret. |
| S01-C025 | covered | M | [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); RECOMMENDED; AS/client discovery | Publish and use AS metadata. | §8414 duties conditional on metadata support. |
| S01-C026 | covered | R | [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); MUST NOT; authorization response redirects | Forbid http redirects except native loopback-interface redirects. | Not a ban on native private schemes addressed by S11. |
| S01-C027 | applicable omission | ILO02 | [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); MAY / MUST NOT; browser endpoint access | CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. | Cross-origin navigation is distinct from CORS. |
| S01-C028 | unknown | U | [S01 §3](https://www.rfc-editor.org/rfc/rfc9700.html#section-3); MUST; deployment threat model | Account for every attacker type possible in the deployment. | BCP minimal model is not exhaustive. |
| S01-C029 | covered | O | [S01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4); SHOULD NOT; AS authorization page or callback response page | Avoid third-party resources and external links. | Client callback responsibility conditional on deployed client. |
| S01-C030 | conditional/outside | C | [S01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4); SHOULD; client state | Invalidate state after first callback use. | State use conditional. |
| S01-C031 | conditional/outside | C | [S01 §4.3.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.3.2); MUST NOT; OAuth clients using access tokens | Do not pass access tokens in URI query parameters. | Updates older S10 query SHOULD NOT. |
| S01-C032 | conditional/outside | C | [S01 §4.5.3.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.5.3.2); MUST; confidential OIDC client relies on nonce instead of PKCE | Validate token-endpoint ID-token nonce; disregard all received tokens until this check succeeds. | Not universal AS obligation. |
| S01-C033 | conditional/outside | C | [S01 §4.7.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.7.1); MUST; client carries integrity-sensitive application state | Protect state against tampering/swapping. | Not a prescribed state format. |
| S01-C034 | unknown | U | [S01 §4.9.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.9.3); MUST; resource server handles access token | Treat token as secret; do not store or transfer in plaintext. | No mandated storage product or cipher. |
| S01-C035 | covered | O | [S01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2); MUST; registered-client redirect can facilitate phishing | Authenticate owner first; prompt for credentials when needed, except silent authentication; take precautions against redirect phishing. | Existing authenticated session can satisfy owner authentication. |
| S01-C036 | covered | O | [S01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2); SHOULD; automatic redirect after authorization | Automatically redirect only to trusted URI; may warn owner for untrusted URI. | Risk-based trust, not compulsory permanent allowlist in source. |
| S01-C037 | covered | O | [S01 §4.12](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.12); MUST NOT / SHOULD; request can contain owner credentials | Do not use 307 redirects; prefer 303 for HTTP redirection. | Broader OIDC 307 rule in S09. |
| S01-C038 | unknown | U | [S01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13); MUST; TLS terminated by reverse proxy | Sanitize inbound security-relevant headers to preserve their authenticity/integrity. | No optional feature mandate inferred. |
| S01-C039 | unknown | U | [S01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13); MUST; TLS terminated by reverse proxy | Protect proxy-to-app link against eavesdropping, injection and replay. | No optional feature mandate inferred. |
| S01-C040 | applicable omission | ILO03 | [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); MUST; considering refresh-token issuance | Assess risk to decide whether a client receives refresh tokens. | Non-issuance permitted. |
| S01-C041 | covered | T | [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); MUST; refresh tokens issued | Bind refresh token to consented scope and resource servers. | Single owner does not remove consented privilege boundary. |
| S01-C042 | unknown | F | [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); MUST + specified rotation mechanism; public-client refresh replay protection uses rotation | Issue replacement each refresh; invalidate previous; retain relationship; detected reuse revokes active refresh token. | Rotation is an alternative to sender constraints; no prescribed storage transaction mechanism or grace interval. |
| S01-C043 | covered | T | [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); MUST; grant identity encoded in refresh token | Ensure token-value integrity, e.g. signatures. | Only encoded-grant mechanism trigger. |
| S01-C044 | covered | T | [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); MAY / SHOULD; refresh tokens | May revoke after security events; should expire after inactivity at AS-selected interval. | No fixed TTL or mandatory logout revocation in this section. |
| S01-C045 | conditional/outside | C | [S01 §4.15.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.15.1); SHOULD NOT; MUST alternative; client/user subject namespace can collide | Prevent client-selected IDs/claims impersonating owners; if unavoidable, let RS distinguish token types. | Client-credentials/common-namespace trigger. |
| S01-C046 | applicable omission | ILO04 | [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); MUST; AS interaction pages | Prevent clickjacking. | No single mandated header satisfies all contexts. |
| S01-C047 | applicable omission | ILO04 | [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); SHOULD; AS interaction pages | Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. | Legacy unsupported-user-agent boundary stated in source. |
| S01-C048 | conditional/outside | C | [S01 §4.17.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.17.2); MUST / MUST NOT; postMessage authorization response | Match trusted receiver origin exactly; forbid wildcard; clients verify initiator exactly; apply all §2.1 defenses. | No mandate to implement postMessage flow. |
| S02-C001 | covered | A | [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); MUST NOT / SHOULD; registered clients | Do not treat client_id as a secret or use it alone for authentication. | No optional feature mandate inferred. |
| S02-C002 | applicable omission | ILO05 | [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); MUST NOT / SHOULD; registered clients | Document identifier size. | No optional feature mandate inferred. |
| S02-C003 | unknown | F | [S02 §2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.1); SHOULD NOT; client registration | Do not assume client type without assessing credential exposure. | Client public/confidential classification not inferred from UI. |
| S02-C004 | covered | A | [S02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3); MUST NOT; public-client authentication | Do not rely on it to identify the client. | PKCE is not client identity authentication. |
| S02-C005 | covered | A | [S02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3); MUST NOT; client token requests | Do not use multiple client-authentication methods in a request. | Token error mapping preserved below. |
| S02-C006 | covered | A | [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); MUST; client passwords issued | Support HTTP Basic with form-encoded client identifier/password semantics. | No optional feature mandate inferred. |
| S02-C007 | unknown | U | [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); MUST; client passwords issued | Require TLS for password-authenticated requests. | No optional feature mandate inferred. |
| S02-C008 | applicable omission | ILO06 | [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); MUST; client passwords issued | Protect password-authentication endpoints against brute force. | No optional feature mandate inferred. |
| S02-C009 | covered | A | [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); MUST NOT; NOT RECOMMENDED; body client credentials supported | Do not put credentials in request URI; body method discouraged and limited to clients unable to use Basic. | Body method remains permitted. |
| S02-C010 | covered | A | [S02 §2.3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.2); MUST; other client-auth methods supported | Define a client registration to authentication-scheme mapping. | No requirement to support arbitrary schemes. |
| S02-C011 | covered | O | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Verify owner identity before obtaining authorization grant. | No optional feature mandate inferred. |
| S02-C012 | unknown | U | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Use TLS; support GET; POST optional. | No optional feature mandate inferred. |
| S02-C013 | unknown | U | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Retain configured query parameters; forbid fragment component. | No optional feature mandate inferred. |
| S02-C014 | unknown | U | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Treat empty values as omitted. | No optional feature mandate inferred. |
| S02-C015 | unknown | U | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Ignore unknown parameters. | No optional feature mandate inferred. |
| S02-C016 | unknown | U | [S02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1); MUST; authorization endpoint | Do not include request/response parameters more than once. | No optional feature mandate inferred. |
| S02-C017 | unknown | U | [S02 §3.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.1); MUST; response_type absent or unsupported | Return an authorization error. | Does not require supporting every registered response type. |
| S02-C018 | covered | R | [S02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2); MUST; redirect URI | Require absolute URI with no fragment. | No optional feature mandate inferred. |
| S02-C019 | covered | O | [S02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2); MUST; redirect URI | Retain redirect URI query parameters when adding response. | No optional feature mandate inferred. |
| S02-C020 | covered | R | [S02 §3.1.2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.2); MUST; SHOULD; redirect registration | Public clients must register redirects; all-client registration/full URIs recommended. | S01 exact-match update constrains older partial-URI flexibility. |
| S02-C021 | covered | R | [S02 §3.1.2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.3); MUST; multiple registered redirects | Client supplies redirect_uri; server matches registered values. | Single registered URI can permit omission in OAuth, unlike OIDC request requirement. |
| S02-C022 | covered | R | [S02 §3.1.2.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.4); MUST NOT; SHOULD; missing/invalid/mismatched redirect | Do not redirect to invalid URI; inform owner. | Error must not become open redirect. |
| S02-C023 | conditional/outside | C | [S02 §3.1.2.5](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.5); SHOULD NOT / MUST conditional; client callback scripts | Avoid third-party scripts; remove credentials before subsequent navigation; if scripts exist, extraction/removal scripts run first. | Client-side duty. |
| S02-C024 | unknown | U | [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); MUST; token endpoint | Require TLS and POST token requests. | No optional feature mandate inferred. |
| S02-C025 | unknown | U | [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); MUST; token endpoint | Retain configured query parameters; forbid fragments. | No optional feature mandate inferred. |
| S02-C026 | applicable omission | ILO07 | [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); MUST; token endpoint | Treat empty parameters as omitted. | No optional feature mandate inferred. |
| S02-C027 | unknown | U | [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); MUST; token endpoint | Ignore unknown parameters. | No optional feature mandate inferred. |
| S02-C028 | applicable omission | ILO07 | [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); MUST; token endpoint | Do not repeat parameters. | No optional feature mandate inferred. |
| S02-C029 | covered | A | [S02 §3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1); MUST; confidential clients or issued client credentials | Authenticate at token endpoint. | Public client with no credential uses client_id for code binding. |
| S02-C030 | covered | T | [S02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3); MUST; scope absent | Use predefined scope default or reject with invalid scope. | Source permits narrower grant. |
| S02-C031 | unknown | U | [S02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3); MUST / SHOULD; scope policy | Return scope when granted differs from requested; document requirements/default. | No requirement to advertise every supported scope. |
| S02-C032 | covered | O | [S02 §4.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1); REQUIRED; authorization code request | Use response_type=code and client_id, encoded as form query. | redirect/state/scope conditions elsewhere. |
| S02-C033 | unknown | F | [S02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2); MUST; code issued | Bind code to client identifier and redirect URI; expire shortly. | 10-minute maximum is RECOMMENDED, not hard MUST ceiling. |
| S02-C034 | unknown | F | [S02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2); MUST; SHOULD; code exchanged more than once | Deny reuse; revoke prior tokens where possible. | No specific database atomic primitive prescribed. |
| S02-C035 | covered | O | [S02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2); REQUIRED; state supplied | Echo exact state in successful authorization response. | No state creation obligation on AS. |
| S02-C036 | covered | R | [S02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1); MUST NOT; invalid/missing client ID or redirect URI | Do not automatically redirect on invalid client/URI. | Other errors returned to validated client redirect. |
| S02-C037 | unknown | U | [S02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1); REQUIRED / syntax; authorization errors | Return error and exact state when supplied; enforce ASCII error/description and URI-reference character syntax. | error_description/error_uri optional. |
| S02-C038 | covered | A | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Require grant_type=authorization_code and code. | No optional feature mandate inferred. |
| S02-C039 | covered | A | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Require client_id for unauthenticated client. | No optional feature mandate inferred. |
| S02-C040 | covered | A | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Require confidential/credentialed authentication; validate included client authentication. | No optional feature mandate inferred. |
| S02-C041 | covered | A | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Check code belongs to authenticated client or public request client_id. | No optional feature mandate inferred. |
| S02-C042 | unknown | F | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Validate code. | No optional feature mandate inferred. |
| S02-C043 | covered | A | [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); MUST / REQUIRED; code token exchange | Require identical redirect_uri if it was supplied during authorization. | No optional feature mandate inferred. |
| S02-C044 | conditional/outside | C | [S02 §4.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4); MUST; client-credentials grant supported | Use only confidential clients; require successful client authentication. | No requirement to support client_credentials grant. |
| S02-C045 | conditional/outside | C | [S02 §4.4.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4.3); SHOULD NOT; client-credentials success | Do not include a refresh token. | SHOULD NOT, not unconditional MUST NOT. |
| S02-C046 | covered | T | [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); REQUIRED / protocol binding; successful token response | Return HTTP 200 JSON object with access_token and case-insensitive token_type. | No optional feature mandate inferred. |
| S02-C047 | covered | T | [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); REQUIRED / protocol binding; successful token response | Represent strings as JSON strings and numbers as numbers. | No optional feature mandate inferred. |
| S02-C048 | covered | T | [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); RECOMMENDED / SHOULD; token lifetime | Return expires_in; if omitted give expiry another way or document default. | No universal token TTL. |
| S02-C049 | applicable omission | ILO08 | [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); MUST; any response containing sensitive data | Use Cache-Control: no-store and Pragma: no-cache. | OIDC errata examples omit Pragma; OAuth requirement remains recorded. |
| S02-C050 | applicable omission | ILO07 | [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); protocol binding / REQUIRED; token error | Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. | Description/URI optional; enum semantics preserved. |
| S02-C051 | unknown | U | [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); MUST; Authorization-header client auth fails | Return HTTP 401 and matching WWW-Authenticate scheme. | 401 otherwise MAY, not universal token-error status. |
| S02-C052 | unknown | U | [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); MUST NOT / syntax; token error fields | Restrict error/description ASCII and error_uri URI-reference syntax. | Do not confuse REST resource errors with token errors. |
| S02-C053 | unknown | U | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Require grant_type=refresh_token and refresh_token in UTF-8 form POST. | No optional feature mandate inferred. |
| S02-C054 | covered | T | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Do not expand beyond original scope; omitted scope equals original. | No optional feature mandate inferred. |
| S02-C055 | covered | A | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Require authentication for credentialed/confidential client. | No optional feature mandate inferred. |
| S02-C056 | covered | A | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Validate supplied client authentication and refresh client binding. | No optional feature mandate inferred. |
| S02-C057 | unknown | F | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Validate refresh token. | No optional feature mandate inferred. |
| S02-C058 | covered | T | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST; refresh grant supported | Replacement refresh token preserves refresh scope. | No optional feature mandate inferred. |
| S02-C059 | conditional/outside | C | [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); MUST / MAY; replacement refresh token issued | Client discards old token; source permits AS revocation; S01 strengthens public-client rotation behavior. | Do not use older MAY to erase BCP replay requirement. |
| S02-C060 | covered | T | [S02 §7](https://www.rfc-editor.org/rfc/rfc6749.html#section-7); MUST; resource server token request | Validate token, expiry, scope covers requested resource. | No mandated introspection vs local validation method. |
| S02-C061 | conditional/outside | C | [S02 §10.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.1); MUST NOT / MUST; public/native client credentials | Do not issue general shared passwords to identify native/browser public clients; per-installation credential exception exists. | No optional feature mandate inferred. |
| S02-C062 | conditional/outside | C | [S02 §10.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.1); MUST NOT / MUST; public/native client credentials | Keep confidential-client passwords secret. | No optional feature mandate inferred. |
| S02-C063 | applicable omission | ILO09 | [S02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2); MUST; SHOULD; unauthenticated public clients | Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. | Prior approval alone not proof of same public-client instance. |
| S02-C064 | unknown | U | [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); MUST; access tokens | Keep token and confidential attributes secret in transit/storage; share only with AS, valid RS and receiving client. | No optional feature mandate inferred. |
| S02-C065 | unknown | U | [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); MUST; access tokens | Transmit tokens only over authenticated TLS. | No optional feature mandate inferred. |
| S02-C066 | covered | T | [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); MUST; access tokens | Ensure unauthorized actors cannot generate, alter or guess valid tokens. | No optional feature mandate inferred. |
| S02-C067 | unknown | U | [S02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4); MUST; refresh tokens | Keep secret in storage/transit and share only with AS and receiving client. | No optional feature mandate inferred. |
| S02-C068 | covered | A | [S02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4); MUST; refresh tokens | Maintain client binding and verify when authenticatable. | No optional feature mandate inferred. |
| S02-C069 | unknown | U | [S02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4); MUST; refresh tokens | Use authenticated TLS; prevent unauthorized generation/alteration/guessing. | No optional feature mandate inferred. |
| S02-C070 | covered | T | [S02 §10.10](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.10); MUST / SHOULD; generated credentials | Guess probability at most 2^-128, preferably at most 2^-160; protect human-use credentials by other means. | Not a blanket byte-length equivalence for all token encodings. |
| S02-C071 | conditional/outside | C | [S02 §10.8](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.8); SHOULD NOT; state/scope content | Avoid plaintext sensitive owner/client information. | Not a mandated encoding. |
| S02-C072 | unknown | U | [S02 §10.11](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.11); MUST; end-user endpoints | Require TLS on all owner-interaction endpoints. | Native loopback response exception governed by S01/S11. |
| S02-C073 | covered | O | [S02 §10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12); MUST; AS authorization endpoint | Prevent CSRF and malicious authorization without owner awareness/explicit consent. | No prescribed CSRF implementation. |
| S02-C074 | unknown | U | [S02 §10.14](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.14); MUST; external protocol values | Sanitize, and validate where possible, all received values including state and redirect_uri. | Exact-state echo must not be silently mutated. |
| S03-C001 | applicable omission | ILO10 | [S03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1); syntax / SHOULD; PKCE verifier | Use 43–128 unreserved characters (ALPHA / DIGIT / - . _ ~). | No optional feature mandate inferred. |
| S03-C002 | conditional/outside | C | [S03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1); syntax / SHOULD; PKCE verifier | Prefer random 32-octet sequence / at least 256-bit entropy. | No optional feature mandate inferred. |
| S03-C003 | covered | P | [S03 §4.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2); MUST / MTI; PKCE capable client / AS | Client capable of S256 uses it; server implements S256; calculate BASE64URL(SHA256(ASCII(verifier))) without padding. | plain compatibility is conditional, not required by user task. |
| S03-C004 | applicable omission | ILO10 | [S03 §4.3](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.3); REQUIRED / default; PKCE authorization request | Include challenge; omitted challenge method defaults to plain; challenge syntax 43–128 unreserved characters. | Source default does not force new deployments to offer plain. |
| S03-C005 | covered | P | [S03 §4.4](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4); MUST / MUST NOT; PKCE code issuance | Bind challenge and method to code. | No optional feature mandate inferred. |
| S03-C006 | covered | P | [S03 §4.4](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4); MUST / MUST NOT; PKCE code issuance | Do not expose challenge in code/client requests in extractable form. | No optional feature mandate inferred. |
| S03-C007 | covered | P | [S03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1); MUST; PKCE required but challenge absent | Return invalid_request; explain reason as SHOULD. | PKCE policy trigger retained. |
| S03-C008 | covered | P | [S03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1); MUST; challenge method unsupported | Return invalid_request; explain reason as SHOULD. | Do not fall back silently to another method. |
| S03-C009 | covered | P | [S03 §4.5](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.5); REQUIRED / MUST; PKCE exchange | Require verifier and use code-bound challenge method. | Not a free choice of method at exchange. |
| S03-C010 | applicable omission | ILO11 | [S03 §4.6](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6); MUST; verifier check | Correct match continues normal processing; mismatch returns invalid_grant. | Matching verifier does not bypass other token validation. |
| S03-C011 | conditional/outside | C | [S03 §7.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-7.2); MUST NOT / SHOULD NOT; PKCE clients | Do not downgrade after S256; avoid plain in new implementations unless unable to support S256. | Client duty and compatibility boundary. |
| S03-C012 | conditional/outside | C | [S03 §7.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-7.2); MUST; stateless code embeds plain challenge | Encrypt so only AS can extract challenge. | Not all codes must be encrypted if server stores challenge separately. |
| S04-C001 | unknown | U | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); REQUIRED; AS metadata supported | Publish HTTPS issuer without query or fragment. | No optional feature mandate inferred. |
| S04-C002 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); REQUIRED; AS metadata supported | Publish authorization_endpoint unless no supported grant uses it. | No optional feature mandate inferred. |
| S04-C003 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); REQUIRED; AS metadata supported | Publish token_endpoint unless only implicit supported. | No optional feature mandate inferred. |
| S04-C004 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); REQUIRED; AS metadata supported | Publish response_types_supported array. | No optional feature mandate inferred. |
| S04-C005 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); OPTIONAL / RECOMMENDED; AS metadata supported | Scopes supported recommended, can omit some scopes; jwks/registration/revocation/introspection optional. | OAuth metadata alone does not require OIDC, JWKS, registration, revocation or introspection. |
| S04-C006 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); defaults; AS metadata optional fields omitted | Omitted grant_types implies authorization_code+implicit; omitted token auth methods implies client_secret_basic; omitted response_modes implies query+fragment. | Omission has meaning even when field is optional. |
| S04-C007 | unknown | U | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); MUST; jwks_uri advertised | Use HTTPS; use on every key if both encryption/signing keys present. | JWKS optional in OAuth-only metadata. |
| S04-C008 | covered | M | [S04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2); MUST; SHOULD; JWT client auth advertised | Publish signing algorithms for token/revocation/introspection JWT auth entries; forbid none; RS256 recommended for token auth. | Only if private_key_jwt/client_secret_jwt advertised. |
| S04-C009 | conditional/outside | C | [S04 §2.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-2.1); MUST / SHOULD NOT; signed AS metadata used | Sign/MAC JWT; include attesting iss; supported signed values override plain; do not nest signed_metadata. | Signed metadata optional. |
| S04-C010 | applicable omission | ILO12 | [S04 §3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3); MUST; AS metadata supported | Publish JSON at HTTPS issuer-derived well-known insertion between host and path; application specifies registered suffix. | Default suffix oauth-authorization-server; multiple locations MAY. |
| S04-C011 | applicable omission | ILO12 | [S04 §3.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.1); MUST; metadata retrieval | Use GET; strip terminating slash before inserting well-known prefix for path issuer. | Mounted issuer supported. |
| S04-C012 | covered | M | [S04 §3.2](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.2); MUST / representation; metadata response | Return 200 application/json object; arrays for multi-values; omit zero-element claims. | Other metadata claims MAY. |
| S04-C013 | conditional/outside | C | [S04 §3.3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.3); MUST / MUST NOT; metadata client validation | Exact issuer match to discovery input; do not use mismatched data. | Client validation does not permit AS publisher inconsistency. |
| S04-C014 | conditional/outside | C | [S04 §4](https://www.rfc-editor.org/rfc/rfc8414.html#section-4); MUST / MUST NOT; JSON string comparisons | Unescape JSON then compare Unicode code points exactly; do not normalize Unicode. | Issuer/path case/slash changes not normalized away. |
| S04-C015 | covered | M | [S04 §5](https://www.rfc-editor.org/rfc/rfc8414.html#section-5); explicit compatibility boundary; issuer has path | RFC8414 inserts well-known before path; OIDC Discovery appends it. Transitional dual publication permitted. | Do not label correct OIDC mounted path wrong merely by applying RFC8414 convention. |
| S04-C016 | unknown | U | [S04 §6.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-6.1); MUST; metadata TLS | Implement TLS and follow BCP195 guidance. | Specific TLS configuration delegated to hosting track. |
| S05-C001 | covered | T | [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); MUST / SHOULD NOT; resource parameter used | Resource value is absolute URI without fragment. | No optional feature mandate inferred. |
| S05-C002 | covered | T | [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); MUST / SHOULD NOT; resource parameter used | Avoid query unless use case needs it. | No optional feature mandate inferred. |
| S05-C003 | covered | T | [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); extension allowance; multiple intended resources | resource parameter may repeat for multiple resources. | Exception to S02 generic duplicate rule; duplicate state/code/client_id still invalid. |
| S05-C004 | covered | T | [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); SHOULD; resource-aware issuance | Audience-restrict tokens to requested resources; audience may map to a more general URI or abstract ID. | No mandatory exact resource-string = JWT aud equivalence. |
| S05-C005 | covered | T | [S05 §2.1](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.1); MAY / advice; resource omitted or unacceptable | Omitted resource may use default/no resource or be required by policy; reject unacceptable values using invalid_target advised. | MCP may impose stricter resource parameter rules in other track. |
| S05-C006 | covered | T | [S05 §2.2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.2); protocol semantics; resource at token exchange | Requested resources stay within granted resources; omission uses grant/default handling; code grant can select narrower resource; refresh can obtain restricted token from multi-resource grant. | No scope/resource escalation; distinct authorization grant and token audiences. |
| S06-C001 | unknown | U | [S06 §1.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-1.2); definition / SHOULD NOT; PRM resource identifier | Use HTTPS URL without fragment; query discouraged with justified exception. | Not every resource identifier must be origin-only. |
| S06-C002 | covered | M | [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); REQUIRED; protected resource metadata supported | Publish resource identifier. | authorization_servers optional under RFC itself; MCP profile may strengthen. |
| S06-C003 | applicable omission | ILO13 | [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); RECOMMENDED; PRM supported | Publish scopes_supported and resource_name; can omit supported scopes. | No default bearer method implied by omission. |
| S06-C004 | conditional/outside | C | [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); MUST; resource jwks/signing algorithms advertised | Use HTTPS JWKS; key use for mixed signing/encryption keys; forbid none for response signing. | PRM jwks is RS keys for signed responses, not automatically AS token verification keys. |
| S06-C005 | conditional/outside | C | [S06 §2.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-2.1); MUST / SHOULD; internationalized PRM values | Use untagged text as supplied without script/language assumptions; case-insensitive language tags; untagged variants recommended. | Only human-readable localization fields trigger. |
| S06-C006 | conditional/outside | C | [S06 §2.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2.2); MUST / SHOULD NOT; signed PRM used | Sign/MAC JWT with iss; supported signed values override plain; avoid nested signed_metadata and preferably reject it. | Optional feature. |
| S06-C007 | applicable omission | ILO14 | [S06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3); MUST; PRM supported | Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. | Default /.well-known/oauth-protected-resource; multiple metadata locations allowed. |
| S06-C008 | applicable omission | ILO14 | [S06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1); MUST; PRM retrieval | Use GET; strip host terminating slash before prefix insertion with path/query. | Host root and mounted resource can coexist. |
| S06-C009 | covered | M | [S06 §3.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2); MUST; PRM response | Return 200 application/json object; arrays represent multi-values; omit zero-value parameters; ignore unknown metadata. | §2 expressly permits empty bearer_methods_supported to mean none; retain tension rather than generalize zero-value wording blindly. |
| S06-C010 | conditional/outside | C | [S06 §3.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.3); MUST / MUST NOT; client validates fetched PRM | Match returned resource exactly to discovery input; challenge-based retrieval matches URL client requested; do not use mismatched metadata. | Client requirement; not free alias equivalence. |
| S06-C011 | conditional/outside | C | [S06 §3.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.3); MUST / SHOULD; signed PRM consumed | Validate signer key belongs to issuer and signature; invalid or untrusted issuer should be error. | Only signed metadata trigger. |
| S06-C012 | conditional/outside | C | [S06 §4](https://www.rfc-editor.org/rfc/rfc9728.html#section-4); OPTIONAL / advice; enumerable AS/resource relationships | protected_resources AS list optional; profile use should cross-check both association lists. | No universal static trust-list mandate. |
| S06-C013 | covered | T | [S06 §5.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-5.1); MAY; resource discovery challenge | Return WWW-Authenticate resource_metadata URL; can combine with other schemes/parameters. | RFC itself optional; MCP stronger requirement belongs other track. |
| S06-C014 | conditional/outside | C | [S06 §5.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-5.2); SHOULD; client receives metadata-change challenge | Fetch new metadata and validate before use. | Resource MAY announce changes any time. |
| S06-C015 | conditional/outside | C | [S06 §6](https://www.rfc-editor.org/rfc/rfc9728.html#section-6); MUST / MUST NOT; PRM string comparison | Unescape JSON; compare exact Unicode code points without normalization. | No URL rewrite normalization. |
| S06-C016 | unknown | U | [S06 §7.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.1); MUST; PRM implementations | Support TLS and follow BCP195. | TLS details external. |
| S06-C017 | conditional/outside | C | [S06 §7.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.3); MUST; client PRM fetch | Check TLS certificate and exact resource identity. | Untrusted metadata not authoritative just because it names resource. |
| S06-C018 | covered | T | [S06 §7.4](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.4); SHOULD; client expects several RSs | Request audience-restricted tokens with RFC8707; AS should support audience restriction. | Not mandatory new JWT profile. |
| S06-C019 | covered | T | [S06 §7.5](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.5); RECOMMENDED; PRM use | Use audience restrictions and resource indicators. | BCP audience-rejection rule remains MUST. |
| S06-C020 | conditional/outside | C | [S06 §7.6](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.6); scope limit; AS chosen from metadata | Determining appropriate AS trust for all use cases is out of scope; application-dependent associations remain necessary. | Discovery is not complete trust policy. |
| S06-C021 | conditional/outside | C | [S06 §7.7](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.7); SHOULD; client fetches dynamic AS/RS URLs | Take SSRF precautions, e.g. block internal IP ranges. | Client duty, not automatic accusation against fixed mounted AS. |
| S07-C001 | covered | R | [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); MUST; DCR redirects supported | Support redirect_uris metadata; redirect-flow clients register redirects. | DCR itself optional absent profile requirement. |
| S07-C002 | covered | D | [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); defaults / semantics; DCR fields omitted | token_endpoint_auth_method defaults client_secret_basic; grant_types defaults authorization_code; response_types defaults code; grants/response types track grant definition. | Default public-client auth=none must be expressed where applicable; do not infer all methods required. |
| S07-C003 | covered | D | [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); MUST; DCR metadata parsing | Ignore unknown client metadata. | Known invalid metadata still error. |
| S07-C004 | covered | A | [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); MUST; client public keys supplied | Require valid JWKS or jwks_uri; never both. | No requirement to support all JWT-auth methods. |
| S07-C005 | unknown | U | [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); MUST / SHOULD; client metadata URLs present | client_uri/tos_uri/policy_uri refer to valid pages; logo_uri valid image; display informational links/logo recommended. | Do not infer URL fetching is always required/safe. |
| S07-C006 | covered | R | [S07 §2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.1); SHOULD; DCR grant/response relationship | Prevent clients registering inconsistent grants and response types. | No obligation to support all combinations. |
| S07-C007 | covered | D | [S07 §2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.2); MUST / SHOULD; localized DCR values | Untagged text kept as-is without language assumptions; case-insensitive language tags; untagged display-friendly variants recommended. | Not permission for HTML injection. |
| S07-C008 | conditional/outside | C | [S07 §2.3](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.3); MUST / RECOMMENDED; software statement supported | Signed/MACed JWS includes iss; trusted claims override plain; RS256 and software_id recommended. | Software statements optional. |
| S07-C009 | covered | D | [S07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3); MUST; DCR endpoint | Accept POST JSON; protect transport with TLS. | No requirement to accept arbitrary unbounded requests. |
| S07-C010 | covered | O | [S07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3); SHOULD / MAY; DCR access policy | Allow unauthenticated registration for openness; rate limit and initial-token restrictions permitted. | SHOULD does not erase restricted deployment policy. |
| S07-C011 | covered | D | [S07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1); protocol binding / REQUIRED; DCR successful response | Return 201 JSON, client_id and all registered metadata including server-provisioned values. | Server may reject/substitute requested values; granted metadata is authoritative. |
| S07-C012 | covered | D | [S07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1); MUST / REQUIRED; client_secret issued by DCR | Secret unique per client_id; include client_secret_expires_at (0 if no expiry). | client_secret itself optional; avoid shared secrets across instances SHOULD. |
| S07-C013 | conditional/outside | C | [S07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1); MUST; software statement used in DCR | Return unmodified statement and used claims as top-level registered metadata. | Optional-feature trigger. |
| S07-C014 | applicable omission | ILO15 | [S07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2); protocol binding / REQUIRED; DCR rejection | Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. | Descriptions optional. |
| S07-C015 | covered | R | [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); MUST; DCR redirect security | Redirect values use TLS remote sites, localhost/native local web server, or native scheme permitted by source; S01/S11 narrow handling. | No arbitrary HTTP remote site. |
| S07-C016 | covered | O | [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); MUST; self-asserted metadata | Treat metadata as self-asserted unless trusted software-statement claim; assess entire request to prevent client impersonation. | Client name/logo not verified identity. |
| S07-C017 | unknown | U | [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); SHOULD; DCR display URLs | Check scheme/host relationship to redirects and validity; protect owner from malicious linked content. | No source mandate to fetch arbitrary URL without SSRF controls. |
| S07-C018 | conditional/outside | C | [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); MUST / SHOULD; registration policy | Consider statement, initial access token and JSON together; suspect/reject conflicting software identity claims; avoid same secret across instances. | No requirement for software statement or initial access token. |
| S08-C001 | covered | M | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); REQUIRED; OIDC Discovery supported | Publish issuer, authorization_endpoint, token_endpoint unless implicit-only, jwks_uri, response_types_supported, subject_types_supported, id_token_signing_alg_values_supported. | OAuth-only S04 has fewer required fields. |
| S08-C002 | unknown | U | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST; OIDC issuer | HTTPS without query/fragment; identical to discovered issuer and ID-token iss. | Issuer includes mount path. |
| S08-C003 | unknown | U | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST; OIDC endpoint URLs | Authorization/token/UserInfo/JWKS/registration URLs use HTTPS when published. | Native redirects are client URI not OP endpoint URL. |
| S08-C004 | unknown | F | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST / NOT RECOMMENDED; OP JWKS | No private or symmetric keys; key use if mixed encryption/signing; x5c must include matching bare key; avoid same key for encryption/signing. | JWKS REQUIRED for Discovery, optional for OAuth metadata. |
| S08-C005 | covered | M | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST / RECOMMENDED; OIDC scope metadata | Support openid; scopes list recommended; standard supported scopes should be advertised; may omit others. | Metadata scope list not exhaustive or permission grant. |
| S08-C006 | covered | M | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST; OIDC signing metadata | Include RS256; none permitted only when no ID token from authorization endpoint. | S09 §15.1 narrow none-only exception retained separately; tension requires profile review. |
| S08-C007 | unknown | F | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); MUST conditional; dynamic OIDC OP | Support code/id_token/id_token token responses and authorization_code/implicit grants. | Dynamic RP relationship trigger, not every OAuth server. |
| S08-C008 | covered | M | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); defaults / MUST NOT; optional OIDC metadata | Defaults for omitted grants/modes/token auth match stated source; none forbidden for JWT client-auth signing. | Claims/scopes/registration/UserInfo recommended rather than all REQUIRED. |
| S08-C009 | applicable omission | ILO02 | [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); SHOULD / NOT RECOMMENDED; browser direct OIDC endpoints | Support CORS or other browser access methods on direct endpoints; authorization CORS discouraged. | S01 updates this to MUST NOT authorization CORS. |
| S08-C010 | covered | M | [S08 §4](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig); MUST; OIDC Discovery supported | Append /.well-known/openid-configuration to issuer after removing terminating slash; GET returns compliant JSON application/json. | Path issuer uses append rule, unlike S04. |
| S08-C011 | covered | M | [S08 §4.2](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse); MUST; Discovery response | Use 200 JSON object; multi-values arrays; omit zero-element claims. | Additional claims allowed. |
| S08-C012 | conditional/outside | C | [S08 §4.3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation); MUST / MUST NOT; Discovery validation | Exact issuer=input issuer=ID-token iss; abort dependent operations on validation failure and do not use invalid data. | No root-origin issuer substitution for mounted issuer. |
| S08-C013 | conditional/outside | C | [S08 §5](https://openid.net/specs/openid-connect-discovery-1_0.html#StringOps); MUST / MUST NOT; Discovery strings | Unescape JSON and compare code points exactly without Unicode normalization. | Applies case-sensitive metadata names/values where specified. |
| S08-C014 | unknown | U | [S08 §7.1](https://openid.net/specs/openid-connect-discovery-1_0.html#TLSRequirements); MUST / SHOULD; Discovery TLS | TLS confidentiality/integrity and certificate validation required; BCP195 guidance recommended. | TLS version evolves; no old-version pin inferred. |
| S08-C015 | conditional/outside | C | [S08 §2](https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery); conditional exclusion; WebFinger issuer discovery selected | WebFinger requires TLS, defined issuer rel/link, identifier normalization and CSRF-safe web forms. | WebFinger not required for already configured issuer; full raw source retained. |
| S09-C001 | covered | O | [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); REQUIRED; ID token issued | Include iss/sub/aud/exp/iat; issuer HTTPS with no query/fragment; sub locally unique never reassigned, <=255 ASCII; aud contains receiving client_id; NumericDate exp/iat. | Single-owner does not permit subject reuse or audience bypass. |
| S09-C002 | covered | O | [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); MUST; nonce present in request | Include unchanged nonce claim; clients check equality; AS SHOULD avoid further processing. | Nonce optional in code flow, mandatory in implicit/hybrid conditions. |
| S09-C003 | unknown | F | [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); REQUIRED; max_age or essential auth_time | Include authentication-time claim. | auth_time not universally required. |
| S09-C004 | covered | O | [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); MUST / MUST NOT; ID-token cryptography | Sign ID tokens; if encrypting, sign then encrypt; none allowed only code/no authorization-endpoint token and explicit registration request. | No universal encryption mandate. |
| S09-C005 | unknown | U | [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); SHOULD NOT; ID-token JOSE headers | Avoid x5u/x5c/jku/jwk header key references; use established discovery/registration. | No new key-fetch protocol implied. |
| S09-C006 | unknown | U | [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); REQUIRED; OIDC code authorization request | Require scope containing openid, response_type=code, client_id, exact pre-registered redirect_uri. | Unlike basic OAuth, OIDC redirect_uri request is REQUIRED. |
| S09-C007 | applicable omission | ILO16 | [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); MUST / behaviors; prompt parameter | none shows no UI and errors if silent auth/consent impossible; none cannot combine with other prompt; login reauthentication; consent/select_account behavior and errors when unsatisfied. | Single-account deployment can meet selection without inventing extra accounts. |
| S09-C008 | unknown | F | [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); MUST; max_age request | Attempt active reauthentication if age exceeds limit; include auth_time. | max_age=0 equivalent login. |
| S09-C009 | unknown | F | [S09 §3.1.2.2](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequestValidation); MUST; OIDC request | Validate OAuth and OIDC required fields; requested specific sub must match authenticated owner; ID-token hint must have been issued by this OP; return proper error. | Expired id_token_hint may be accepted for recent session as SHOULD; not an access token. |
| S09-C010 | applicable omission | ILO04 | [S09 §3.1.2.3](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates); MUST / MUST NOT; owner authentication | Authenticate if absent or prompt=login; no interaction prompt=none; prevent CSRF/clickjacking during owner UI. | Existing owner session alone does not satisfy explicit prompt=login. |
| S09-C011 | covered | O | [S09 §3.1.2.4](https://openid.net/specs/openid-connect-core-1_0.html#Consent); MUST; information release | Obtain authorization decision; dialogue or valid prior/administrative consent permitted. | No universal fresh consent screen on every request. |
| S09-C012 | unknown | F | [S09 §3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError); MUST NOT / response binding; OIDC authorization errors | Do not redirect invalid URI; validated redirects get error/state; unsupported response_mode yields HTTP400 without error parameters. | Do not assume all error cases redirect. |
| S09-C013 | covered | O | [S09 §3.1.3.2](https://openid.net/specs/openid-connect-core-1_0.html#TokenRequestValidation); MUST; OIDC code exchange | Authenticate as registered; validate issued client/code/redirect; verify code came from OIDC authentication request. | Source says replay check if possible, but S02/S01 single-use MUST still applies. |
| S09-C014 | covered | T | [S09 §3.1.3.3](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse); MUST; initial OIDC code token response | Return ID token and access token in JSON; token_type Bearer unless other type negotiated; no-store header. | Non-openid OAuth response need not contain ID token. |
| S09-C015 | covered | O | [S09 §3.1.3.6](https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken); OPTIONAL / definition; at_hash in code-flow ID token | at_hash optional; when present uses base64url left half of hash using signing algorithm hash. | Do not require c_hash/at_hash in all code token responses. |
| S09-C016 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); MUST; RP ID-token validation | Check exact issuer. | No optional feature mandate inferred. |
| S09-C017 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); MUST; RP ID-token validation | Check aud contains own client_id and no untrusted additional audiences. | No optional feature mandate inferred. |
| S09-C018 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); MUST; RP ID-token validation | Check expiration. | No optional feature mandate inferred. |
| S09-C019 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); MUST; RP ID-token validation | Check sent nonce is present and equal. | No optional feature mandate inferred. |
| S09-C020 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); MUST; RP ID-token validation | Validate signature with issuer keys except direct token-endpoint TLS validation MAY substitute issuer validation. | No optional feature mandate inferred. |
| S09-C021 | conditional/outside | C | [S09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation); SHOULD; RP optional checks | Check nonce replay, requested acr/auth_time, negotiated encryption and algorithm. | iat age bounds client-specific; azp checks extension-dependent in errata set 2. |
| S09-C022 | unknown | F | [S09 §5.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo); MUST; UserInfo supported | TLS; support GET and POST; accept Authorization Bearer; validate access token. | UserInfo not mandatory for all statically configured OPs; dynamic OP boundary below. |
| S09-C023 | unknown | F | [S09 §5.3.2](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse); MUST; UserInfo responses | Return JSON sub; content type application/json or JWT as negotiated; RP verifies sub exactly matches ID token. | Claims not returned should be absent, not null/empty (SHOULD). |
| S09-C024 | conditional/outside | C | [S09 §5.3.2](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse); MUST; signed/encrypted UserInfo negotiated | Sign then encrypt if both; signed claims include issuer and audience matching OP/client. | No requirement to offer signed/encrypted UserInfo universally. |
| S09-C025 | unknown | F | [S09 §5.3.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoError); binding; UserInfo errors | Follow RFC6750 error response rules. | Other REST errors need their own profile. |
| S09-C026 | covered | O | [S09 §5.4](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims); claim-release semantics; profile/email/address/phone scope supported | Claims returned through UserInfo when access token issued; through ID token if no access token issued. | Scope request not mandatory guarantee all claims returned. |
| S09-C027 | unknown | F | [S09 §5.5](https://openid.net/specs/openid-connect-core-1_0.html#ClaimsParameter); MUST conditional; claims parameter supported | Ignore unknown members; voluntary/essential requests generally do not force an error; specific subject request cannot authenticate another subject. | claims parameter support optional; essential acr has special §5.5.1.1 rules. |
| S09-C028 | covered | O | [S09 §5.6](https://openid.net/specs/openid-connect-core-1_0.html#ClaimTypes); MUST; OP claim support | Support normal claims. | Aggregated/distributed claims optional; full definitions preserved in raw. |
| S09-C029 | covered | O | [S09 §5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability); MUST / MUST NOT; identity linkage | sub unique and never reassigned per issuer; do not use email/phone/name as unique subject identity. | Issuer and sub together identify owner. |
| S09-C030 | conditional/outside | C | [S09 §6.3](https://openid.net/specs/openid-connect-core-1_0.html#JWTRequests); MUST conditional; Request Objects supported | Validate encryption/signature using registered algorithms/keys; error on failure; assemble request and validate as authorization request. | No universal Request Object support for static OP; dynamic request_uri requirement below. |
| S09-C031 | conditional/outside | C | [S09 §8.1](https://openid.net/specs/openid-connect-core-1_0.html#PairwiseAlg); MUST conditional; pairwise subject selected | Unique deterministic per sector; not reversible by others; sector URI redirects consistency. | Public subject type remains valid; not all OPs must be pairwise. |
| S09-C032 | unknown | F | [S09 §9](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication); MUST conditional; JWT client authentication used | Require iss/sub/client_id, aud intended AS, unique one-use jti, expiry; correct assertion type and signature method. | No requirement to support private_key_jwt/client_secret_jwt. |
| S09-C033 | covered | O | [S09 §10.1](https://openid.net/specs/openid-connect-core-1_0.html#Signing); MUST / MUST NOT; OIDC signing | Choose algorithm appropriate to key; signing key usage; kid for asymmetric keys; forbid symmetric signatures for public clients. | No mandated ES256 support. |
| S09-C034 | unknown | F | [S09 §10.1.1](https://openid.net/specs/openid-connect-core-1_0.html#RotateSigKeys); SHOULD; signing-key rollover | Retain recent decommissioned signing public keys for a reasonable validation transition. | No fixed retention interval. |
| S09-C035 | applicable omission | ILO17 | [S09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess); MUST; offline_access requested | Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. | Refresh tokens can be issued for other contexts; offline_access optional feature. |
| S09-C036 | covered | T | [S09 §12.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; OIDC refresh | Validate refresh token, client binding and registered authentication when applicable. | Public none auth remains public. |
| S09-C037 | unknown | F | [S09 §12.2](https://openid.net/specs/openid-connect-core-1_0.html#RefreshTokenResponse); MUST / SHOULD; refresh emits ID token | Preserve original iss/sub/aud and auth_time; iat is new issuance; nonce preferably omitted, otherwise equals original. | Refresh response may omit id_token entirely; azp extension rules conditional. |
| S09-C038 | conditional/outside | C | [S09 §13.1](https://openid.net/specs/openid-connect-core-1_0.html#QuerySerialization); SHOULD; OIDC query serialization | Omit absent/empty parameters rather than empty strings. | OAuth processing still treats empty as absent. |
| S09-C039 | unknown | U | [S09 §14](https://openid.net/specs/openid-connect-core-1_0.html#StringOps); MUST / MUST NOT; OIDC string processing | Unescape and compare code points without Unicode normalization; space (0x20) separates list values. | Exact claim/issuer semantics preserved. |
| S09-C040 | covered | M | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support RS256 signing except narrowly described code-only none-only registration case. | No optional feature mandate inferred. |
| S09-C041 | applicable omission | ILO16 | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support prompt, including none and login behavior. | No optional feature mandate inferred. |
| S09-C042 | covered | M | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support display at least without error. | No optional feature mandate inferred. |
| S09-C043 | covered | M | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support ui_locales and claims_locales at least without error. | No optional feature mandate inferred. |
| S09-C044 | unknown | F | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support auth_time when requested. | No optional feature mandate inferred. |
| S09-C045 | applicable omission | ILO16 | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support max_age enforcement. | No optional feature mandate inferred. |
| S09-C046 | covered | M | [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); MUST; all OIDC OPs | Support acr_values at least without error. | No optional feature mandate inferred. |
| S09-C047 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Support code/id_token/id_token token response types for non-self-issued OP. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C048 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Support OIDC Discovery. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C049 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Support OIDC Dynamic Client Registration. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C050 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Support UserInfo when issuing access tokens. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C051 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Publish bare JWK public keys. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C052 | unknown | F | [S09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html); MUST; dynamic OP establishes RP relationship without preconfiguration | Support request_uri Request Object retrieval. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| S09-C053 | conditional/outside | C | [S09 §15.3](https://openid.net/specs/openid-connect-core-1_0.html); explicit boundary; preconfigured OP/RP relationship | Dynamic discovery and registration may be unnecessary. | Publishing OIDC metadata alone does not prove dynamic profile. |
| S09-C054 | unknown | U | [S09 §16.12](https://openid.net/specs/openid-connect-core-1_0.html#TimingAttack); SHOULD; cryptographic validation | Avoid early exit on invalid octet to reduce timing side channels. | No prescribed crypto library; applies cryptographic processing context. |
| S09-C055 | covered | M | [S09 §16.15](https://openid.net/specs/openid-connect-core-1_0.html#IssuerIdentifier); MUST / RECOMMENDED; issuer identity | Discovery issuer exactly equals ID-token iss; path is issuer identity; single issuer per host recommended but multiple permitted. | Mounted issuer not prohibited. |
| S09-C056 | unknown | U | [S09 §16.17](https://openid.net/specs/openid-connect-core-1_0.html#TLSRequirements); MUST / SHOULD; OIDC TLS | Support TLS confidentiality/integrity and certificate checking; follow BCP195 guidance. | Hosting responsibilities separate. |
| S09-C057 | covered | T | [S09 §16.18](https://openid.net/specs/openid-connect-core-1_0.html#TokenLifetime); SHOULD; access/refresh lifetimes | Prefer short or single-use access tokens; identify long grants; provide owner token-revocation mechanism. | RFC7009 endpoint not thereby unconditionally mandated. |
| S09-C058 | conditional/outside | C | [S09 §16.19](https://openid.net/specs/openid-connect-core-1_0.html#SymmetricKeyEntropy); MUST; symmetric algorithms use client_secret | Ensure entropy and minimum key octets for MAC; HS256 at least 32 octets. | Public-client symmetric signing forbidden elsewhere. |
| S09-C059 | covered | O | [S09 §16.22](https://openid.net/specs/openid-connect-core-1_0.html); MUST NOT; OP redirect to client | Do not use HTTP307 to redirect to Redirection URI; 303 preferable. | Broader than S01 credentials-present trigger. |
| S09-C060 | applicable omission | ILO18 | [S09 §17.2](https://openid.net/specs/openid-connect-core-1_0.html#AccessMonitoring); SHOULD; UserInfo privacy access | Make UserInfo access logs available to owner. | Privacy consideration, not central OAuth endpoint wire contract. |
| S10-C001 | conditional/outside | C | [S10 §2](https://www.rfc-editor.org/rfc/rfc6750.html#section-2); MUST NOT; bearer resource request | Do not use more than one bearer-token transmission method per request. | No obligation to support body/query methods. |
| S10-C002 | covered | B | [S10 §2.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1); MUST / SHOULD; bearer RS/client | RS supports Authorization Bearer; client should use it. | Bearer grammar includes one or more spaces and b64token syntax. |
| S10-C003 | conditional/outside | C | [S10 §2.2](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.2); MUST NOT conditional; body bearer method offered | Only form-encoded single-part ASCII body with method having body semantics; never GET; encode access_token properly. | Optional support; application/json body not this method. |
| S10-C004 | conditional/outside | C | [S10 §2.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.3); SHOULD NOT / updated MUST NOT; query bearer usage | Avoid query token due logging risk; S01 now forbids clients using query tokens. | Do not claim RFC6750 requires query support. |
| S10-C005 | covered | T | [S10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3); MUST; missing or insufficient bearer credentials | Return WWW-Authenticate Bearer challenge with auth params. | Missing authentication should not include error code (SHOULD NOT). |
| S10-C006 | covered | T | [S10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3); MUST NOT / grammar; bearer challenge | Do not repeat realm/scope/error/error_description/error_uri; honor character syntax for scope/errors/URI. | scope/error_description/error_uri optional. |
| S10-C007 | unknown | U | [S10 §3.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-3.1); SHOULD; bearer resource errors | invalid_request=>400; invalid_token=>401; insufficient_scope=>403; expose reason when supplied token fails. | Status strength is SHOULD here; MCP may strengthen. |
| S10-C008 | unknown | U | [S10 §5.2](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.2); MUST; bearer transport/storage | Implement TLS and certificate validation; protect tokens on TLS termination backends; do not store tokens in cookies sent in clear. | No mandatory HTTP-only cookie auth for bearer API. |
| S10-C009 | covered | T | [S10 §5.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.3); SHOULD; bearer issuance | Limit token lifetime, especially browser tokens; scope to recipients. | Illustrative <=1h is recommendation context, no mandatory universal TTL. |
| S11-C001 | covered | P | [S11 §6](https://www.rfc-editor.org/rfc/rfc8252.html#section-6); MUST; native public code clients | Native clients and AS use PKCE; support native redirect options described in §7. | Native clients may choose permitted redirect option; generic web clients do not gain loopback exception. |
| S11-C002 | covered | R | [S11 §7.1](https://www.rfc-editor.org/rfc/rfc8252.html#section-7.1); MUST / SHOULD; native private URI scheme | Use reverse-domain scheme under app control; AS should enforce/reject no-dot schemes. | Not every custom URI scheme automatically valid. |
| S11-C003 | covered | R | [S11 §7.3](https://www.rfc-editor.org/rfc/rfc8252.html#section-7.3); MUST; native loopback IP redirects | AS permits any request-time port for registered loopback IP redirect; exact scheme/host/path still required. | Native ephemeral port exception, not wildcard host/path. |
| S11-C004 | covered | R | [S11 §8.1](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.1); SHOULD; native authorization lacking PKCE | AS rejects with invalid_request. | S01 strengthens public client PKCE MUST; preserve distinct source strengths. |
| S11-C005 | conditional/outside | C | [S11 §8.3](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.3); NOT RECOMMENDED; native localhost redirect | Prefer loopback IP literal over localhost. | localhost not categorically prohibited by source. |
| S11-C006 | unknown | F | [S11 §8.4](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.4); MUST; native client registration | Register as public unless per-instance secret creates confidentiality; AS records type and full redirect incl path; reject mismatch except loopback port. | Claimed HTTPS app links not evidence of confidential client. |
| S11-C007 | unknown | F | [S11 §8.5](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.5); MUST; native client has distributed shared static secret | Treat as public; do not accept secret as identity proof. | Per-instance credential exception is separate. |
| S11-C008 | covered | O | [S11 §8.6](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.6); SHOULD NOT; native repeated authorization | No automatic approval without proven client identity; previous public client_id consent alone insufficient. | Owner single-user session does not prove client identity. |
| S11-C009 | conditional/outside | C | [S11 §8.12](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.12); MUST NOT / MAY; native authorization user agent | Native clients do not use embedded user agents; AS may detect/block them. | No mandatory browser detection on AS. |
| S12-C001 | conditional/outside | C | [S12 §Conformance Testing](https://openid.net/certification/); official program description; implementation conformance testing | Free tests are available to anyone for mature stable standards/profiles; developers can assess interoperability and implemented security features. | No test run performed here; no proof candidate passes. |
| S12-C002 | conditional/outside | C | [S12 §Certification](https://openid.net/certification/); official program description; certification claim or ecosystem requirement | Self-certification is a separate process allowing certification mark after completion; certification may be ecosystem prerequisite. | No unconditional OAuth/OIDC requirement to certify; overview did not inspect individual plan coverage/test IDs. |

## Source-by-source control / stop

| Source | Covered | Omission | Conditional/outside | Unknown | Recovered trace |
|---|---|---|---|---|---|
| S01 | 27 | 5 | 10 | 6 | ILO01, ILO02, ILO03, ILO04 |
| S02 | 34 | 7 | 7 | 26 | ILO05, ILO06, ILO07, ILO08, ILO09 |
| S03 | 6 | 3 | 3 | 0 | ILO10, ILO11 |
| S04 | 8 | 2 | 3 | 3 | ILO12 |
| S05 | 6 | 0 | 0 | 0 | No applicable omitted detail established; retain mapped boundary/unknown rows. |
| S06 | 5 | 3 | 11 | 2 | ILO13, ILO14 |
| S07 | 12 | 1 | 3 | 2 | ILO15 |
| S08 | 6 | 1 | 3 | 5 | ILO02 |
| S09 | 19 | 6 | 12 | 23 | ILO04, ILO16, ILO17, ILO18 |
| S10 | 4 | 0 | 3 | 2 | No applicable omitted detail established; retain mapped boundary/unknown rows. |
| S11 | 5 | 0 | 2 | 2 | No applicable omitted detail established; retain mapped boundary/unknown rows. |
| S12 | 0 | 0 | 2 | 0 | No applicable omitted detail established; retain mapped boundary/unknown rows. |

Stop: one bounded production-source pass across all12 source groups and290 frozen rows complete. Exactpartition validated; recoveredIDs unique and all omissionrows linked to records. No certification, saturation, deployment security or runtime correctness claim. Unknown/profile/operational cells remain explicitly open. No source budget expansion.

## Supplemental project-invariant PI02 (registered before probe)
Owner grant revocation must apply to forwarded native UserInfo as well as REST/MCP. Native active JWT verification may not check app grant tombstones/epoch. Claim pending public same-path probe with openid token: UserInfo continues200after per-grant revoke. No finding assumed from staticcall alone. RootstartingHEADunchanged.

## MCP follow-up source evidence (authorized extension, 2026-10-04)

M120/ILM07 advisory opened: https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7#description. PublishedFeb4,2026. Package @modelcontextprotocol/sdk, affected>=1.10.0 <=1.25.3; patched1.26.0. Two preconditions: shared stateless transport, or server reconnected across transports. Fresh server+transport per request avoids both. New MCP concurrent same-ID receiving probe and factory observations remain separate from package-range facts.

M121/ILM07 advisory opened: https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff#description. PublishedJan7,2026. Package @modelcontextprotocol/sdk affected<1.25.2; patched1.25.2. Exploded resource-template patterns produce nested regex backtracking on attacker URI. No resource templates registered here. @modelcontextprotocol/server2.3.0 is a distinct package; do not turn v1 range into guessed v2 guarantee. The earlier frozen assay unknown statement stays historical; current range/premise evidence resolves that investigation.

Follow-up receiving probes registered before execution: production OAuth MCP token at exp-1 and exp, valid api-audience token denied at MCP, notification202/no-body and invalid request/batch classification. Original ML06/ML16/ML17/ML21 boundaries remain individually tracked.


## OAuth implementation evaluation event — all 18 raw items accounted for

# OAuth implementation evaluation

All 18 raw ILO records were appended in full to evaluate-ledger.md before any probe or edit. Frozen static mapping remains132covered/28omission/59conditional/71unknown=290; evaluation does not rewrite that history. Starting/currentHEAD b88a0f34dfe6860c100322438552058945d0c8c4; current working tree includes authorized root/hardening fixes. Exactfreeze manifest remains reference for original claims.

The assay recovered real parser/UI/schema details but static evidence overreached in generic native-header/limiter absence and host-root profile assumptions. Those limits are corrected without dropping source clauses. Technical validity, PR action and durable test/doc value remain separate. No human reviewer or hiring decision is being evaluated; no hire recommendation follows from an internal source assay.

## Evidence and scope

- RED: oauth-implementation-red.log19 cases,10 failed / 9 passed:6 PKCE grammar,1 DCR enum,3 derived metadata 404s. Of these, metadata expectations are profile choices constrained by explicit mount-only instruction, not authorized root route fixes.
- GREEN after root fix: oauth-syntax-green.log3 files, 27 passed, including 18 owned cases; public syntax/DCR paths reached. Final owned consent additions: oauth-implementation-green2.log, one file, 20 tests passed.
- Concurrent refresh bounded case passes 1 winner / 1 failure then old token replay and winner descendant denial. Native administrative endpoints: 7 cases return 404. These witnesses do not prove all distributed schedules.
- Root CORS/login/body/enum RED/GREEN: oauth-root-evidence.md and oauth-spec-red.log/oauth-spec-green.log. Native JWT/JWKS/nonce/audience and refresh ancestor replay supplied positive public evidence.
- Current consent render tests added for noStore+Pragma,1h access and conditional offline 30 days. First owned rerun: 20 cases, 19 pass / 1 fail used overstrict 30-day wording for nonoffline; corrected to actual source boundary (access lifetime always,offline grant deadline when requested). This was an oracle error, not another production bug.
- Guide public validation and hardening receiving logs are cross-references, not substitutions for original source. Production was changed only by parent/hardening owners; thisagent edited its test/document files only.

## Lossless verdict ledger

| ID | Disposition | Technical validity | Evidence | PR action / durable destination |
|---|---|---|---|---|
| ILO01 | deferred | Advice accurately preserved; selected resources reject cnf. No normative requirement to add both sender-constraint mechanisms. | Static source/options; S01-C016 SHOULD. | Separate DPoP/mTLS profile decision in docs/oauth-implementation-hardening.md; no product fix proposed. |
| ILO02 | fixed-now | Confirmed public bug on frozen path; authorization GET/OPTIONS leaked wildcard CORS. | oauth-spec-red.log -> oauth-spec-green.log; oauth-syntax-green.log27pass. | Root changed endpoint CORS. Durable direct endpoint/authorization collateral test in oauth-spec.oracle.test.ts. |
| ILO03 | deferred | The source demands assessment, not a callback. Static lack of risk callback does not prove assessment was absent. | Original source RFC9700§4.14.2 plus selected code/refresh options/owner approval. | Risk policy, absolute30d deadline, context-change trigger now recorded in docs/oauth-implementation-hardening.md. No fabricated scoring API. |
| ILO04 | fixed-now | Confirmed absent owner login framing while consent framing existed. | oauth-spec-red.log -> oauth-spec-green.log; same public login path. | Root applied ownerpage CSP/XFO; separate consent/login receiving witnesses survive. |
| ILO05 | fixed-now | Documentation obligation cannot be represented by server code alone; frozen scan correctly retained category residue. | Pinned provider authorize:1928 generates32ASCII letters; docs direct focused review. | Current size documented in docs/oauth-implementation-hardening.md; opaque client contract retained. No behavioral RED invented. |
| ILO06 | fixed-now | Frozen wrapper lacked owner guess limiter; native defaults existed but production predicate/shared storage unresolved. Raw claim was not proof all native clientauth protection absent. | Root/hardening tests auth-deployment.oracle.test.ts and hardening-eight-green.log43pass; source enabled/database rateLimit and authoritative address. | Root/hardening added explicit sharednative limiter and ownerlogin admission budget. Deployment ingress trust remains operational limit. |
| ILO07 | fixed-now | Body500 confirmed; rawgeneric duplicates preserved as separate clauses. Native authduplicates exist; current wrapper handles generic singular repetition and media type. | oauth-spec-red/green bodyerror; oauth-validation-stable.log duplicatecases pass, code/media collateral; current oauth-routes singular guard. | Root fixes body parsing/error envelope and cardinality. token resource repetition remains allowed. Empty/error subtype residue stays in validation oracle rather than generalized any4xx. |
| ILO08 | fixed-now | Native noStore response already supplied both headers through core; wrapper-only consent omission was real. Do not promote it into a native token endpoint bug. | Core/api index:19–21,54; native token metadata noStore; current public consent render checks both headers. | Root added Pragma consent; owned test verifies sensitive custom HTML. Initial broader native-header absence refuted but surviving wrapper detail preserved. |
| ILO09 | fixed-now | Lifetime is a source SHOULD; frozen UI omitted it. CurrentUI states1h access/30d offline grant. | Frozen template directsource; currentpublic render with/without offline scope. | Root UI disclosure; test checks1h always,30d only offline. An initial oracle that required30d wording for nonoffline was overstrict and corrected; no source fixedTTL mandate. |
| ILO10 | fixed-now | Confirmed malformed grammar accepted at authorize and minted tokens at exchange despite matchingS256 hash. | oauth-implementation-red.log6syntaxfailures -> oauth-syntax-green.log27pass; public request/code/token route. | Root wrapper enforces43–128unreserved grammar; test hostile short/129/! plus legalneighbor. Client entropy remains separate. |
| ILO11 | fixed-now | Confirmed wellformed wrongverifier wrongenum; HTTPstatus rewrite alone insufficient. | oauth-spec-red.log -> oauth-spec-green.log and syntax-green27pass. | Root specific error normalization preserves missingverifier/parser/client/grant distinctions; collateral source-bound tests. |
| ILO12 | design-decision | 404 reproduction is true but initial fullRFC8414 expectation crossed explicit user mount-only constraint. OIDC appending is valid and selectedMCP ASdiscovery route. | oauth-implementation-red.log hostprefix404; corrected mountedmetadata/no-root witness; official MCP test at3mounts alreadyreceives mountedOIDC. | No hostroot route added. Currentdeclared limit: RFC8414 publication convention unselected; rawsource MUST/placement remains intact for profile selection, not called satisfied. |
| ILO13 | deferred | resource_name advice absent, while required resource field exists. Source strength RECOMMENDED does not justify mandatory authentication bug assertion. | Frozen/current PRM JSON and RFC9728§2. | Displayname advice preserved in docs/oauth-implementation-hardening.md; noforced feature or broadfullconformance claim. |
| ILO14 | design-decision | Derivedroute404 and challengeinterop can both be true. RFC9728§3 publicationMUST is not expressly waived by §5.1 explicitURL; conflicts with approved no-hostroot deployment boundary. | Original rfc9728.txt:361–405; §3.3 challengeequality; §5.1 URLdefinition. Publicmountedchallenge witness passes; earlier derivedroute404 RED retained. | Exact question: retain mountedchallenge-only profile with explicit fullRFC9728 publicationlimit, or permit fullRFC9728 derivedpublication through a compatible deployment? Root userquestionpending; no rootroute edit. |
| ILO15 | fixed-now | Confirmed unknownregistrationmetadata scope usedtoken invalid_scope rather than DCRinvalid_client_metadata. | oauth-implementation-red.log DCRenumfail -> oauth-syntax-green.log27pass. RFC7591§3.2.2 exactenum meanings retained. | Root narrownormalization; ownedpositiveDCRreceiving test. Softwarestatements remain conditional, not invented. |
| ILO16 | confirmed-open | Nativeprompt/max_age present; originalbridge clock and unauthenticatedsilentgate need samepathbehavior. guide found unauthenticatedpromptnone UIredirect; other reauthentication/age cases require fullcontinuation evidence. | oauth-validation-stable.log promptnonefailure; root/guide owns promptcontinuation fixes and current evidence. | Durable exactUI/noUI/freshness boundaries in docs/oauth-implementation-hardening.md and oauth-validation.oracle.test.ts. No claim staleauth_time proved until consistent clock/bridge preconditions reached. |
| ILO17 | fixed-now | Frozenofflineaccess hidden in permissiondialogue. Currentoffline request has explicitrenewal/30day disclosure before allow; nooffline neighbor lacks that disclosure. | Frozen template directsource; public current consentrender witnesses; oauth-validation-stable.log initialoffline RED. | Root changed consenttext; ownedpositive/negative renderwitness. Doesnotrequire separatecheckbox or refreshforallfeaturecontexts. |
| ILO18 | deferred | Privacy SHOULD distinct from grantlisting; noownerUserInfo accesslogpipeline measured. | Source Core§17.2 plus frozen management/routes/model absence. | Privacy/accesshistory scope and deploymentlogging assurance preserved in docs/oauth-implementation-hardening.md; no hypothetical platform bug asserted. |

## Full original records retained

The following unchangedrawrecords include each originalsource ID, strength, applicability, everyunique detail, vanishpoint and known/inferred reductionrule. No fix was proposed by originalassay.

### ILO01 — Sender constraint advice versus selected Bearer resources

Source IDs: S01-C016.

Static observation: Source SHOULD is applicable advice, not MUST. The package supports DPoP options, but oauth.ts:117–130 rejects any cnf token and no corresponding DPoP/mTLS resource verification is configured.

Where vanished: Resource bearer policy at oauth.ts:120.

Reduction rule: Known selected mechanism is ordinary Bearer; intent behind omitting sender constraints is unknown.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C016** [S01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1); **SHOULD**; trigger: AS and resource server. Use sender-constrained access tokens such as DPoP or mTLS. Boundary: Do not elevate to MUST or require both mechanisms.

### ILO02 — Authorization endpoint receives wildcard CORS

Source IDs: S01-C027, S08-C009.

Static observation: oauth-routes.ts:12 installs Access-Control-Allow-Origin:* on all paths and23–25 supplies OPTIONS headers for all paths, including authorize. Native metadata/direct-endpoint CORS support does not erase RFC9700 MUST NOT on authorization endpoint. OIDC direct browser-access advice remains distinct.

Where vanished: Wildcard OAuth middleware rather than endpoint-specific policy.

Reduction rule: Inferred reduction: one CORS rule for every protocol endpoint; code proves scope, not design intent.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C027** [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); **MAY / MUST NOT**; trigger: browser endpoint access. CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. Boundary: Cross-origin navigation is distinct from CORS.
- **S08-C009** [S08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata); **SHOULD / NOT RECOMMENDED**; trigger: browser direct OIDC endpoints. Support CORS or other browser access methods on direct endpoints; authorization CORS discouraged. Boundary: S01 updates this to MUST NOT authorization CORS.

### ILO03 — Refresh issuance risk decision is not expressed per client

Source IDs: S01-C040.

Static observation: oauth.ts:35–40 enables offline_access/refresh with global TTL; no inspected custom risk callback decides which anonymous/public client should receive refresh tokens. Package issuance permission and owner consent exist; they are not a recorded threat/risk decision.

Where vanished: Provider options/issuance policy.

Reduction rule: Inferred reduction: global supported grant plus consent stands in for client risk assessment; no known rejection.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C040** [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); **MUST**; trigger: considering refresh-token issuance. Assess risk to decide whether a client receives refresh tokens. Boundary: Non-issuance permitted.

### ILO04 — Frame defense spans consent but not owner login

Source IDs: S01-C046, S01-C047, S09-C010.

Static observation: oauth-routes.ts:38 adds frame-ancestors none and XFO DENY only to consent. spa.ts login and shell have no matching frame header; index.ts mounts these routes without inspected framing middleware. Retain all-pages CSP SHOULD separately from clickjacking prevention MUST, and OIDC owner-UI defense. Authentication/prompt clauses in S09-C010 are also recovered in prompt record.

Where vanished: Legacy owner-authentication route outside consent renderer.

Reduction rule: Inferred reduction: protect explicit consent page rather than all authentication pages; no intent evidence.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S01-C046** [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); **MUST**; trigger: AS interaction pages. Prevent clickjacking. Boundary: No single mandated header satisfies all contexts.
- **S01-C047** [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); **SHOULD**; trigger: AS interaction pages. Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. Boundary: Legacy unsupported-user-agent boundary stated in source.
- **S09-C010** [S09 §3.1.2.3](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates); **MUST / MUST NOT**; trigger: owner authentication. Authenticate if absent or prompt=login; no interaction prompt=none; prevent CSRF/clickjacking during owner UI. Boundary: Existing owner session alone does not satisfy explicit prompt=login.

### ILO05 — Client identifier-size documentation not part of production mapping

Source IDs: S02-C002.

Static observation: Native identifier generation exists; no production source contract documents its size. Documentation evidence is excluded in this implementation-only stage. This records source-to-code residue, not a bug in lack of code comments.

Where vanished: Documentation obligation cannot be demonstrated by server code alone.

Reduction rule: Known category boundary: implementation-only read, not known author choice.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C002** [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); **MUST NOT / SHOULD**; trigger: registered clients. Document identifier size. Boundary: No optional feature mandate inferred.

### ILO06 — Password authentication brute-force control absent from inspected owner layer

Source IDs: S02-C008.

Static observation: spa.ts:45–51 checks every supplied owner password; no owner-login rate policy in this production path. Native client-auth validation exists, but no selected token-specific brute-force policy was established in inspected provider configuration. This keeps owner-login evidence separate from source trigger client password-authenticated endpoint; package-wide defaults remain unknown, so only absent owner-layer policy is known.

Where vanished: Owner route and provider options.

Reduction rule: Inferred reduction: rely on password check/native defaults. Native default efficacy is unresolved; no dynamic claim.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C008** [S02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1); **MUST**; trigger: client passwords issued. Protect password-authentication endpoints against brute force. Boundary: No optional feature mandate inferred.

### ILO07 — Token wrapper parsing precedes native cardinality/error handler

Source IDs: S02-C026, S02-C028, S02-C050.

Static observation: oauth-routes.ts:82 clone.formData() executes before native handler; unsupported/malformed body parse can reach onError JSON500. Native utils:537–579 detects duplicated nonempty authentication fields, but native token schema:4586–4598 and form parser preserve only resource specially; no inspected raw generic duplicate guard for code/grant_type/scope/verifier. Empty auth fields normalize; complete empty grant/scope omission not established. Native failed-verifier is invalid_request; wrapper normalizes status only. Preserve invalid_grant distinctions and duplicates/multiple-auth/unsupported-grant/invalid-scope fields, not generic any4xx.

Where vanished: Wrapper pre-parser and native token body-schema/error mapping.

Reduction rule: Known first-value wrapper get and native credential-only raw cardinality; inferred reduction: delegate all parser validity to native despite wrapper preparse.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C026** [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); **MUST**; trigger: token endpoint. Treat empty parameters as omitted. Boundary: No optional feature mandate inferred.
- **S02-C028** [S02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2); **MUST**; trigger: token endpoint. Do not repeat parameters. Boundary: No optional feature mandate inferred.
- **S02-C050** [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); **protocol binding / REQUIRED**; trigger: token error. Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. Boundary: Description/URI optional; enum semantics preserved.

### ILO08 — Sensitive OAuth responses only explicitly carry no-store

Source IDs: S02-C049.

Static observation: oauth-routes.ts:12/38 sets no-store, no Pragma. Native token response createUserTokens introspect:1869–1884 returns JSON; provider NO_STORE_HEADERS definition must be assessed for every endpoint, so this absence is wrapper-local. Consent itself is a sensitive response with no Pragma. Exact RFC6749 requirement includes both headers; OIDC errata no-store alone does not delete it.

Where vanished: Custom consent response and OAuth middleware.

Reduction rule: Known wrapper header selection; inferred compression to one cache directive.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C049** [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); **MUST**; trigger: any response containing sensitive data. Use Cache-Control: no-store and Pragma: no-cache. Boundary: OIDC errata examples omit Pragma; OAuth requirement remains recorded.

### ILO09 — Public-client consent shows client and scope but no lifetime

Source IDs: S02-C063.

Static observation: oauth-routes.ts:35–38 renders self-asserted name, return host, resource and selected OWNER_SCOPES; no grant/token lifetime text. Fresh consentReferenceId avoids automatic prior approval and registered redirect/nativePKCE safeguards are present. The distinct source detail lifetime is absent from this UI.

Where vanished: Custom consent template.

Reduction rule: Inferred reduction: scope/host disclosure retained while lifetime omitted.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S02-C063** [S02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2); **MUST; SHOULD**; trigger: unauthenticated public clients. Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. Boundary: Prior approval alone not proof of same public-client instance.

### ILO10 — PKCE verifier/challenge syntax not enforced by inspected schemas

Source IDs: S03-C001, S03-C004.

Static observation: Provider authorizationQuerySchema introspect:1047 code_challenge is plain string; token endpoint authorize:4592 verifier plain string; S256 hash comparison introspect:2007 does not enforce43–128 unreserved-character grammar. Method defaults/plain compatibility are conditional; requiring S256 is retained rather than making plain a mandate.

Where vanished: Native PKCE string schema and hash check.

Reduction rule: Known generic string validation; inferred reduction: hash equality stands in for syntactic contract.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S03-C001** [S03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1); **syntax / SHOULD**; trigger: PKCE verifier. Use 43–128 unreserved characters (ALPHA / DIGIT / - . _ ~). Boundary: No optional feature mandate inferred.
- **S03-C004** [S03 §4.3](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.3); **REQUIRED / default**; trigger: PKCE authorization request. Include challenge; omitted challenge method defaults to plain; challenge syntax 43–128 unreserved characters. Boundary: Source default does not force new deployments to offer plain.

### ILO11 — PKCE mismatch has invalid_request rather than invalid_grant

Source IDs: S03-C010.

Static observation: Provider introspect:2007–2011 throws UNAUTHORIZED with invalid_request when hash differs. oauth-routes.ts:100 changes HTTP to400 but preserves error body. Normal grant processing after valid match is present.

Where vanished: Native error enum survives wrapper status normalization.

Reduction rule: Known explicit enum; no inferred intent required.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S03-C010** [S03 §4.6](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6); **MUST**; trigger: verifier check. Correct match continues normal processing; mismatch returns invalid_grant. Boundary: Matching verifier does not bypass other token validation.

### ILO12 — OAuth metadata uses OIDC appended route for path issuer

Source IDs: S04-C010, S04-C011.

Static observation: oauth-routes.ts:106 forwards mounted /issuer/.well-known/oauth-authorization-server; index.ts mounts at issuer path, without inspected /.well-known/oauth-authorization-server/issuer-path route. RFC8414 requires host-before-path insertion for its convention; OIDC appending remains supported and correct. Application registered suffix/metadata profile details stay conditional, no blanket root-only issuer requirement.

Where vanished: Mounted OAuth metadata route selection.

Reduction rule: Known route placement; inferred reduction: share appended OIDC discovery routing across both documents.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S04-C010** [S04 §3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3); **MUST**; trigger: AS metadata supported. Publish JSON at HTTPS issuer-derived well-known insertion between host and path; application specifies registered suffix. Boundary: Default suffix oauth-authorization-server; multiple locations MAY.
- **S04-C011** [S04 §3.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.1); **MUST**; trigger: metadata retrieval. Use GET; strip terminating slash before inserting well-known prefix for path issuer. Boundary: Mounted issuer supported.

### ILO13 — Protected-resource metadata has no resource_name

Source IDs: S06-C003.

Static observation: oauth-routes.ts:21 publishes resource/scopes/authserver/header method, but no resource_name. Source strength RECOMMENDED is retained; not a MUST or functional behavior verdict.

Where vanished: Custom PRM JSON object.

Reduction rule: Known selected fields; inferred compression: identifiers and scopes retained, display name omitted.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S06-C003** [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); **RECOMMENDED**; trigger: PRM supported. Publish scopes_supported and resource_name; can omit supported scopes. Boundary: No default bearer method implied by omission.

### ILO14 — PRM has custom challenge URL but not derived well-known route

Source IDs: S06-C007, S06-C008.

Static observation: oauth-routes.ts:17–21 serves mounted auth/resources/api|mcp; oauth.ts:113–115 challenge uses that URL. No source-derived /.well-known/oauth-protected-resource/{resource-path} GET route appears in index mounts. Custom challenge retrieval is separately covered S06-C013. Source publication convention and profile suffix remain distinct.

Where vanished: Resource discovery route surface.

Reduction rule: Known route choice; inferred reduction: challenge-linked custom URL stands in for issuer/resource-derived convention.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S06-C007** [S06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3); **MUST**; trigger: PRM supported. Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. Boundary: Default /.well-known/oauth-protected-resource; multiple metadata locations allowed.
- **S06-C008** [S06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1); **MUST**; trigger: PRM retrieval. Use GET; strip host terminating slash before prefix insertion with path/query. Boundary: Host root and mounted resource can coexist.

### ILO15 — DCR invalid scope error has non-DCR error enum

Source IDs: S07-C014.

Static observation: Provider authorize:1824–1830 returns invalid_scope for unknown registration scope; RFC7591 registration response requires invalid_client_metadata for invalid client metadata. Normal201/client defaults and invalid_redirect_uri branches exist. Other software-statement error clauses remain conditional; all original support retained below.

Where vanished: Native DCR scope-validation enum.

Reduction rule: Known explicit error enum; presumed reuse of OAuth scope error is inferred.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S07-C014** [S07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2); **protocol binding / REQUIRED**; trigger: DCR rejection. Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. Boundary: Descriptions optional.

### ILO16 — Legacy login/bridge does not carry native prompt reauthentication law

Source IDs: S09-C007, S09-C041, S09-C045.

Static observation: oauth-routes.ts:43–46 redirects unauthenticated legacycookie request to interactive login before native prompt=none branch. oauth.ts:70–79/103–111 bridges old validlegacycookie to newlycreatednative session with current creation time; native authorize:5628–5634 applies max_age to native session.createdAt and routes prompt=login to configured login. spa.ts:41–44 validlegacycookie GETlogin goes tobase without reauthentication, and POSTlogin issues onlylegacycookie; no continuation clearing nativeprompt or renewingnativeauth demonstrated. Thus native prompt/max_age checks exist but wrapper prevents establishing silent error/noUI and actual active reauthentication; broad prompt selections/errors remain each exact source clause below.

Where vanished: Pre-native authorize gate, ownerSession creation and existing-cookie login route.

Reduction rule: Known separate session timelines/routes; inferred reduction: owner cookie validity supplies all OP authentication freshness.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C007** [S09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest); **MUST / behaviors**; trigger: prompt parameter. none shows no UI and errors if silent auth/consent impossible; none cannot combine with other prompt; login reauthentication; consent/select_account behavior and errors when unsatisfied. Boundary: Single-account deployment can meet selection without inventing extra accounts.
- **S09-C041** [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); **MUST**; trigger: all OIDC OPs. Support prompt, including none and login behavior. Boundary: No optional feature mandate inferred.
- **S09-C045** [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); **MUST**; trigger: all OIDC OPs. Support max_age enforcement. Boundary: No optional feature mandate inferred.

### ILO17 — Offline_access remains hidden automatically retained protocol scope

Source IDs: S09-C035.

Static observation: oauth-routes.ts:35–38 displays only OWNER_SCOPES;71–74 re-adds openid/offline_access automatically on allow. No inspected explicit offline disclosure/choice or valid alternate-consent basis. Owner selectedscope consent exists; source requires offline consent and prompt=consent except valid otherconditions, web explicit/native recommended. No claim refresh issuance in every context needs offline_access.

Where vanished: Consent UI and protocol-scope merge.

Reduction rule: Known hidden protocolscope merge; inferred reduction: owner permission consent used as offline consent too.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C035** [S09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess); **MUST**; trigger: offline_access requested. Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. Boundary: Refresh tokens can be issued for other contexts; offline_access optional feature.

### ILO18 — Owner UserInfo access-log availability not expressed

Source IDs: S09-C060.

Static observation: Native UserInfo endpoint is forwarded; no owner access-log route/model is in inspected authorization-api/owner-api/migration. Source is privacy SHOULD and implementation-only absence; platform logs/access outside this snapshot remain unknown.

Where vanished: Owner management resource/log data model.

Reduction rule: Inferred category omission: authorization listing substituted for privacy access history; no known author decision.

Exact support (authority, trigger, every distinct clause and exclusions):

- **S09-C060** [S09 §17.2](https://openid.net/specs/openid-connect-core-1_0.html#AccessMonitoring); **SHOULD**; trigger: UserInfo privacy access. Make UserInfo access logs available to owner. Boundary: Privacy consideration, not central OAuth endpoint wire contract.

## Final accounting

18 = 4 deferred + 11 fixed-now + 2 design-decision + 1 confirmed-open. Noitems capped/merged/dropped. ILO07 preserves parser/duplicates/subtypes; ILO08 preserves refutednative premise and customconsent residue; ILO12/14 preserve normativemountconvention and selectedprofileconstraints separately. All deferred/design values have docs/oauth-implementation-hardening.md asdurabledestination. ILO16 evidenceclosure pending root/guide samepathfix verification; full deployed/runtimeconformance remains unclaimed.

## Supplemental project-invariant PI03 (registered before probe)
Root password reset should not leave an old owner cookie able to mint fresh delegated credentials. Current stateless HMAC binds expiry to COOKIE_SECRET only. Pending public probe: log in, change OWNER_PASSWORD binding, use old cookie POST/api/authorizations; expected401 and no access_token. This supplements decision52 credential-reset invariant, not a proven bug until public RED. Rootowns auth.ts; HEAD unchanged.


## ILO16 closure event — native password continuation verified

Disposition: **fixed-now**. Current ILO totals: **12 fixed-now + 4 deferred + 2 design-decision = 18**. The frozen 290-row map and original 18 raw records remain unchanged. ILO12 names the selected mount-only profile limit; ILO14 remains the full RFC9728 publication decision.

Original RED: oauth-reauthentication-red.log and guide validation evidence reached the GET login page with a valid existing owner cookie and could not complete password reauthentication. The native signed query already carried the correct prompt/freshness request; the legacy route discarded it. A first implementation run also exposed a setup error: ordinary ownerHeaders needed body:{} after the native endpoint schema gained a body. That setup failure is recorded in oauth-reauthentication-green-first.log and is not a caught semantic fault.

Production changes use native hooks. SPA GET verifies the provider's signed query and renders the password form despite an existing legacy cookie. POST denies cross-origin requests, validates the signed query before authentication side effects, checks the password, creates a fresh legacy cookie, and calls the server-only ownerSession endpoint with oauth_query. The call supplies the native Request context that authorizeEndpoint requires. Native before/after hooks validate the signature, select the new session, clear their own login/max_age fields and return the continuation URL; no signed parameters are edited by the wrapper. Ordinary unsigned bounded return_to login remains separate.

The server-only endpoint is a trust boundary: only the password-checked SPA continuation supplies oauth_query. Its new session uses the actual password-check time at millisecond precision. Ordinary body:{} bridges preserve the verified legacy cookie's original authentication time via the native session adapter override. This prevents a bridge from making an old cookie appear fresh, while avoiding a same-second max_age loop caused by the cookie's whole-second timestamp. Native sessions now last30days to match the maximum grant lifetime, rather than rejecting a live offline grant at the earlier default7day session limit.

GREEN: oauth-reauthentication-green-final.log: **6 files,119 tests passed**. This includes the guide's full password POST -> resumed consent -> authorization code -> token exchange for prompt=login/max_age; unauthenticated prompt=none; a legacy-only2hour-old owner cookie with max_age3600; both same-second continuation modes; invalid signed GET/POST with no new sessions/cookies; foreign Origin/Sec-Fetch-Site denial; exact30day grant boundary; OAuth code flow, manual credential history, independent grant listing and owner login collateral. Owned oracle now has27cases. Typecheck: oauth-reauthentication-typecheck-final.log exited0. The earlier expectation of30day text for nonoffline requests was an oracle calibration error and remains recorded separately.

HEAD remains b88a0f34dfe6860c100322438552058945d0c8c4; implementation is uncommitted working tree. Final source/test hashes are in oauth-reauthentication-final-hashes.json. Exact oauth.ts SHA256: 8db7743b57425bd58ebb5da282483bc5ee6b1beb8350197bbf857aa35d378d19. Durable tests: oauth-implementation.oracle.test.ts plus guide-owned oauth-validation.oracle.test.ts. Durable record: docs/oauth-implementation-hardening.md. Deployed TLS/proxy assurance, exhaustive OIDC profiles and all distributed race schedules remain unclaimed.

## PI04 — browser form Origin suppressed by referrer policy

Registered before repair. HEAD b88a0f34 + working candidate. The desktop and mobile browser receiving probe POST /studio/login sends Origin:null with Sec-Fetch-Site:same-origin under Referrer-Policy:no-referrer; server rejects403, login never reaches composer. Existing direct request tests supplied Origin and missed actual browser behavior. Proposed repair: same-origin referrer policy on Studio shell to suppress external-site referrers while preserving internal form Origin; retain strict login Origin check. Evidence final-client-browser-settled.log and sanitized trace-header inspection. Severity P1, PR action pending exact rerun; durable destination e2e/client-access.spec.ts and docs/auth-security-evaluation.md.

PI04 adjacent boundary: custom consent also posts a native HTML form under no-referrer and uses the same Origin rejection. Add real browser authorization/consent/code/token receiving probe before changing that response.

## PI05 — local manual credential registration rejects loopback callback

Registered before repair. Public browser POST /api/authorizations returns500; pinned provider validation rejects default web client's HTTP loopback redirect at the internally registered manual-callback. final-client-browser-origin-green.log reaches owner login and token creation. Local development must use the provider's supported native loopback registration profile; deployed HTTPS registrations retain web profile. Severity P2 local development, proposed narrow loopback profile selection; durable browser lifecycle test.

## Final reconciliation after browser probes

HL10-S1 is retained as a supplemental critical-under-missing-configuration claim: empty/undefined OWNER_PASSWORD with valid COOKIE_SECRET granted302 owner login. Public RED was registered under the original HL10 missing-configuration boundary before repair; focused same-path GREEN denies403 without a cookie while configured login still302. Source and full supplemental row are retained in hardening-evaluation.md. Destination test/auth-lifecycle.oracle.test.ts and docs/auth-deployment-hardening.md.

PI03 confirmed fixed-now: root owner cookies include the configured owner password in signed versioned payload; old cookie after password reset cannot mint delegated credentials. owner-reset-red.log200 -> owner-reset-green.log401, auth collateral9passes.
PI04 confirmed fixed-now: desktop/mobile traces measured login and consent Origin:null/403. Both page responses now use same-origin referrer policy. Browser-final-settled-green.log4passes includes actual consent form and external callback with no Referer. Existing strict Origin checks remain. The first token-exchange fixture reused owner cookies without Origin and correctly got403; a separate client context reaches token200 without owner credentials. This is fixture correction, not a waived guard.
PI05 confirmed fixed-now: manual credential registration chooses the supported native application profile only on exact loopback hosts; deployed web registration unchanged. Browser token creation, scoped reading, write denial, revocation and reload pass on desktop/mobile.

ILO12 final action deferred, rather than design-decision. The existing mount-only/OIDC selection already excludes RFC8414 host-root publication; its original normative clause is retained as unsatisfied for that unselected profile. Destination docs/oauth-implementation-hardening.md ILO12. The only outstanding human design question is protected-resource metadata publication, represented separately by OL15 and ILO14.

Final counts: 122 =52fixed-now +53deferred +14confirmed-open +1stale +2design-decision. Original116 records plus PI01–PI05 and HL10-S1; no records dropped or merged. All14open records preserve exact unmeasured clauses and named ownership in docs/oauth-protocol-hardening.md. Runtime/referrer-browser probes do not prove deployed TLS, logs, capacity or complete conformance.

Final exact validation: Worker fullsuite95files990passed5existing skips (995total); UI6passed; 3mutantsdetected plus2capturedfailure replays; compiledfullWorker limiter persistence; original0.8.3upgrade17authtables. Post-browser production repairs: affected6files112passed, finaltypecheckpassed, browser4passed desktop/mobile. Fullsuite result predates browser repairs and is not described as their full rerun. HEADb88a0f34 unchanged; allrepairs uncommitted. No merge/deployment.

## Final post-browser validation

`browser-final-settled-green.log`: four tests passed on desktop and mobile. They exercise owner login, one-time token display, read-only enforcement, per-grant revocation and reload. They also submit the real OAuth consent form, observe no Referer at an external callback, and exchange the code from a separate client context.

`post-browser-auth-green.log`: six affected files, 112 tests passed. `post-browser-typecheck.log`: Worker and UI typechecks passed. Local manual registrations use the provider's native loopback profile; deployed HTTPS web registrations keep their web profile. These changes preserve origin checks rather than waiving them.

PI02's native introspection inactive-result guard has no dedicated same-path regression yet. The public UserInfo regression is RED/GREEN verified. The missing introspection witness remains a named test follow-up here; do not infer it from the UserInfo probe.

The final manifest and its SHA256 digest are `/private/tmp/blygger-auth-audit/final-manifest.json` and `/private/tmp/blygger-auth-audit/final-manifest.sha256`. They identify the completed working snapshot, including this report; they do not identify a new commit.

## Security follow-up: current result supersedes the prior closeout

The maintainer requested RED oracles for the remaining security gaps and deferred host-root `.well-known` publication. [Security release oracles](auth-security-oracles.md) maps each high-level risk to its tests, mutation controls and deployment limit.

Three new supplemental records preserve public failures before repair:

| ID | Claim and exact RED | Repair and durable destination |
|---|---|---|
| PI06 | Rotated access JWT still read settings200 after ancestor refresh replay400. | Shared grant-family tombstone and hashed code/refresh issuance mappings. Same probe requires401. Invalid-client/scope/resource neighbors stay valid. `test/auth-security.oracle.test.ts`, compiled two-isolate race. |
| PI07 | Error-aware capture found the sentinel credential in native fallback logs. Owner login and manual minting also reached Hono's raw Error logger. | Native bounded logger, native error propagation and safe root handling. Same three error-path probes require HTTP500 without secrets in either response or console. The initial JSON-only Error serializer hid its message/stack and was corrected. |
| PI08 | Non-loopback HTTP owner login issued302 with a cookie. Other protected routes had no common transport refusal. | Early HTTPS guard for Studio/API/MCP, exact loopback development exceptions. Remote requests fail400 without cookies. Operators still must enforce HTTPS before a client transmits credentials. |

OL15 and ILO14 are now `deferred` by the maintainer, with the profile limit preserved in the hardening documents and PR draft. The earlier `design-decision` rows remain historical evidence. Current accounting is `125 =55fixed-now +55deferred +14confirmed-open +1stale`. The original116 records and all nine supplements remain accounted for. The composite open records retain unmeasured clauses, including external deployment evidence.

The prior final manifest identifies the earlier snapshot only. Security follow-up hashes and final validation are recorded in `/private/tmp/blygger-auth-audit/security-final-manifest.json` and the security logs. No deployed observation or new committed HEAD is claimed.

## Security follow-up validation

The full Worker suite passes: 96 files, 1,017 tests passed and five existing skips. All eleven security mutations reach their named failure assertions. Six browser tests pass on desktop and mobile. The controlled two-isolate replay probe and Worker/UI typechecks pass.

Exact logs: `security-full-suite-settled-green.log`, `security-all-controls-green.log`, `security-browser-complete-green.log`, `security-cross-isolate-race-configured.log` and `security-typecheck-final-green.log` in the audit scratch directory. Each command exited0. The dedicated authenticated introspection regression now closes the earlier missing witness. No deployment facts, new commit or existing PR update are claimed.


## PR preparation finding: delegated SVG documents

The merge review found that a draft-only client's SVG upload could execute script
when opened as a same-origin document. This could cross the owner's permission
boundary. A receiving browser oracle now uses a harmless DOM marker to test that
law. It first confirms a draft token cannot change settings, checks the uploaded
SVG renders as an image, then opens it as a document.

RED: `prep-svg-red.log` reached `data-script-ran="yes"` at the document checkpoint.
GREEN: `prep-auth-browser-green.log` passed all eight auth browser cases on desktop
and mobile after public media responses gained `sandbox; script-src 'none'`.
The twelfth security mutation removes that header and reaches the same checkpoint.
The fixture's earlier 401 setup failure is not RED evidence.

Sources: [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
and [CSP sandbox](https://www.w3.org/TR/CSP3/#directive-sandbox).
Disposition: fixed-now. This supplementary prep finding does not rewrite the
original 125-entry lossless audit ledger.


## PR preparation finding: HTTP Basic refresh replay

Native confidential registration selects `client_secret_basic`. RFC6749 §2.3.1
puts its client identity in the Authorization header, not the token form. The
application replay wrapper previously required the form's `client_id`, so native
refresh invalidation left that grant's signed access JWT usable.

RED: `basic-replay-red.log` reached the named authenticated Basic replay checkpoint
with protected read200 instead of401. A wrong-secret neighbor returned401 and left
the valid access JWT usable. GREEN: `prep-basic-green.log` passed104 tests across
security, OAuth flow and OAuth validation after the wrapper resolved Basic client
identity for native `invalid_grant` responses. Native authentication still owns
secret validation. `invalid_client` never triggers this revocation path.

The thirteenth security mutation removes the Basic identity branch and must reach
the same receiving assertion. Disposition: fixed-now. This supplementary finding
resolves the Basic replay unknown in the earlier audit record without altering its
original text or the125-entry ledger.
Source: [RFC6749 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1).


## Owner-password reset ruling and current authority model

Decision #31 and the user ruling preserve delegated access and refresh credentials after owner-password reset. Prior source snapshots and review claims above retain their original evidence. The current credential version depends on cookie secret and revoke-all epoch, excluding owner password. Owner-session HMAC still binds the owner password. Stale native OAuth cookies cannot silently authorize without a valid owner session.

The owner-reset receiving oracles capture API/MCP token survival, native refresh, stable grant deadlines and listing, explicit revoke-all, and stale-browser login requirements. Password reset is a separate generated-history action that preserves delegated model state. This replaces the earlier password-coupled delegated invalidation rule. It does not weaken signing-secret rotation or grant revocation.
