# MCP hardening boundaries

These entries preserve remaining MCP loss-assay boundaries and historical unknowns resolved by later primary evidence. They are not claims that optional client/proxy/tasks/CIMD features exist in this Worker. MCP current source revision2026-07-28 and SDK2.3.0 Oct2,2026 are distinct. The frozen survey was advisory-index-only; authorized follow-up opened both ranges below without rewriting that historical artifact. No conformance certification follows from local passing tests.

Source records: `/private/tmp/blygger-auth-audit/mcp-sources.md`, oracle-mcp-loss.md and implementation-mcp-loss.md, cutoff2026-10-04. Each retained source ID below carries the exact original section URL/support. Keep normative strength, role and feature premise when dispatching any later task.

## ML01 — Version publication/per-request behavior

Native version/head mismatch and unsupported-version tests added. Missing standard headers now explicitly reject400/-32020. Preserve full prior-revision matrix as distinct future coverage; current publication is directly sourced, not inferred from package.

- **Source IDs/support:** M001, M003; [S1 / M001 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning); [S1 / M003 section](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M001: Current=2026-07-28; Draft=in-progress; Final=past/frozen; current can receive compatible updates.; M003: Current requests declare body protocol version and HTTP mirror; unsupported-version response lists supported versions.
- **Missing tested boundary:** No named protocol-version identity or unsupported-version receiving assertion; package version and ordinary client success do not establish this boundary.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — happy-path interoperability compression. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML02 — AS security breadth

Imported OAuth2.1 breadth includes confidential auth and missing/downgraded PKCE; root standards evaluator owns overlapping provider work, but this track does not invent full certification.

- **Source IDs/support:** M006; [S2 / M006 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M006: OAuth2.1 security for public/confidential clients. #overview
- **Missing tested boundary:** Public authorization-code success and wrong verifier are reached; confidential-client authentication and public missing/downgraded challenge rejection are not named receiving cases. Broad OAuth2.1 mandate remains wider than grammar.
- **Where it vanished:** oauth-flow.oracle:25–39,60–71.
- **Reduction rule:** Inferred — bounded public-client/code-input grammar. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML05 — AS response issuer advertisement/errors

Production advertisement now asserted. Full AS error-response iss and client issuer-rejection matrix remain separate; client duties outside Worker.

- **Source IDs/support:** M011; [S2 / M011 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#authorization-response-validation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M011: Record validated issuer with verifier/state; AS SHOULD emit iss, MUST advertise when emitted. #authorization-response-validation
- **Missing tested boundary:** Production approval asserts iss equals mounted issuer; denial asserts error/no code but not iss; production AS advertisement is not asserted. Client issuer validation parts are outside scope.
- **Where it vanished:** oauth-flow.oracle:49,58.
- **Reduction rule:** Inferred — success callback projection. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML06 — MCP invalid/expired/foreign token receiving boundary

Real production OAuth MCP token now passes at exp-1 and fails401 at exp; valid API-audience OAuth token fails401 at MCP, malformed/tampered token negatives also pass. Isolated foreign-issuer receiving matrix remains separate; root owns verifier.

- **Source IDs/support:** M016; [S2 / M016 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#token-handling). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M016: Validate intended audience; invalid/expired=401; no foreign tokens. #token-handling
- **Missing tested boundary:** Wrong audience is asserted at production MCP; valid OAuth getSettings succeeds. Exact-expiry oracle judges REST requests, and altered signature/wrong verifier audience checks reside in test-only driver. Production MCP expired/signature/foreign-issuer negative distinctions remain absent.
- **Where it vanished:** authorization.oracle:61–65,74–87; mcp.oracle:74–75; better-auth.oracle:51–55.
- **Reduction rule:** Inferred — REST/fixture token checks substituted for MCP negative matrix. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML07 — Refresh confidentiality and RS offline_access challenge

PRM excludes offline_access and challenge metadata is asserted. Refresh storage/transit secrecy requires broader persistence/deployment evidence.

- **Source IDs/support:** M017; [S2 / M017 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#refresh-tokens). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M017: Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens
- **Missing tested boundary:** Rotation is observed, but token confidentiality in storage/transit and production PRM/challenge omission of offline_access have no oracle assertion. Client grant metadata duties excluded.
- **Where it vanished:** oauth-flow.oracle:84–96; better-auth-driver:54.
- **Reduction rule:** Inferred — rotation observation drops metadata/storage boundary. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML08 — MCP malformed/insufficient-scope HTTP decisions

403 challenge fixed (ML04/ILM03). Auth omission/tampering receives401; malformed-auth400 taxonomy and every classifier branch not covered by these focused cases.

- **Source IDs/support:** M018; [S2 / M018 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#error-handling). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M018: Appropriate 401/403/400. #error-handling
- **Missing tested boundary:** Production REST observes scope403 and OAuth bad-input400; valid MCP scopes affect listTools. No explicit malformed-auth MCP400 versus MCP403 challenge witness.
- **Where it vanished:** authorization.oracle:75–79; mcp.oracle:83–89.
- **Reduction rule:** Inferred — REST status equivalence assumed for unobserved MCP response. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML09 — Scope hierarchy at RS

Independent literal owner scopes do not declare a hierarchy. Add hierarchy law only if the permission contract defines one; no widening invented.

- **Source IDs/support:** M020; [S2 / M020 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#step-up-authorization-flow). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M020: Step-up limits/scope union; RS MUST account for hierarchy. #step-up-authorization-flow
- **Missing tested boundary:** All15 literal scope subsets have inventories; reference judge is exact membership. No wider-implies-narrower scope hierarchy premise or RS negative/positive law. Client step-up duties outside scope.
- **Where it vanished:** mcp.oracle:83–89; auth-oracle-model:23.
- **Reduction rule:** Inferred — literal-set grammar excludes hierarchy. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML11 — Scope-minimization advice

Default initial challenge is owner:read; incremental operation challenge now implemented. Downscope, correlated elevation audit events and denied-loop caching have distinct AS/client premises; do not add client cache to Worker.

- **Source IDs/support:** M062, M063, M064, M066; [S3 / M062 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M063 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M064 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization); [S3 / M066 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M062: Minimal initial scope set; M063: Incremental elevation; M064: Downscope tolerance; M066: Correlated elevation logs
- **Missing tested boundary:** No oracle receives minimal baseline versus elevated scope behavior, acceptance of reduced-scope issued token, or correlated elevation events. Static all-scope OAuth client and exact subset inventories cover different observations. This is advice recovery, not a MUST finding.
- **Where it vanished:** mcp.oracle:54,83–89.
- **Reduction rule:** Inferred — fixed capabilities substitute for progressive authorization/observability. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML12 — Token storage confidentiality

Wrapper hashes and provider checks do not establish deployment storage/log secrecy. Preserve provider persistence/log audit separately.

- **Source IDs/support:** M086; [S6 / M086 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#token-theft). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M086: Secure token storage; OAuth2.1 security. #token-theft
- **Missing tested boundary:** Oracle storage checks string-record expiry and pagination; no secrecy or absence of raw tokens in persistence/log/error outputs is asserted.
- **Where it vanished:** oauth-storage.oracle:23–41.
- **Reduction rule:** Inferred — storage functional model omits secrecy. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML13 — HTTPS and redirect-scheme boundary

HTTPS test URL does not prove edge TLS or full redirect scheme enforcement. Native localhost exceptions and Worker deployment boundary require exact tests/config evidence.

- **Source IDs/support:** M089; [S6 / M089 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#communication-security). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M089: HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security
- **Missing tested boundary:** All protocol fixtures use HTTPS; no public rejection of non-loopback HTTP endpoints/redirect schemes. Localhost/native exceptions require separate conditional handling.
- **Where it vanished:** oauth-flow.oracle:15–17,25; mcp.oracle:51.
- **Reduction rule:** Inferred — safe URL constants erase insecure-input boundary. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML15 — Authorization redirect validation/trust

Provider trusted redirect checks code-observed; root standards probes own redirect flow work. Explicit authorization bad redirect/error escape matrix is not replaced by token exchange checks.

- **Source IDs/support:** M092, M094; [S6 / M092 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#open-redirection); [S6 / M094 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M092: Registered exact redirect validation. #open-redirection; M094: Precautions for untrusted redirect; trust before automatic redirect; user warning allowed. Same section.
- **Missing tested boundary:** Changed redirect is rejected at code exchange; no authorization-endpoint altered/unregistered URI case or public invalid-request redirect escape observation. Valid consent/approval exists.
- **Where it vanished:** oauth-flow.oracle:30–39,60–71.
- **Reduction rule:** Inferred — token-exchange check substituted for authorization redirect gate. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML16 — Before-data-release token validation/no passthrough

Real OAuth intended-audience success, API-audience denial, T-1/T expiry and tampered-token denial observed before protected result. Wrapper strips inbound bearer internally. Isolated foreign issuer/no upstream-token transfer needs distinct architecture premise.

- **Source IDs/support:** M099; [S6 / M099 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#access-token-privilege-restriction). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M099: Validate before processing/returning data; audience binding; separate upstream token; no passthrough. #access-token-privilege-restriction
- **Missing tested boundary:** Wrong resource401 is checked before a useful MCP body. No protected-result negative test with foreign issuer/signature or observation that inbound token is not forwarded. Upstream-api portions are conditional, not assumed present.
- **Where it vanished:** authorization.oracle:61–65; mcp.oracle:74–75; better-auth.oracle:51–55.
- **Reduction rule:** Inferred — audience/status witness compresses distinct recipient/data-release boundaries. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML19 — Every MCP connection authentication

Per-request credentials tested now (ML10). Streaming/listen-request authentication is conditional because none configured; no universal connection authorization inferred from one Client.

- **Source IDs/support:** M102; [S7 / M102 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M102: Localhost bind; authenticate connections. Same section.
- **Missing tested boundary:** Valid client tool and revoke-denied tool exist, but no raw second-request/stream request with omitted or invalid authorization. Local bind obligation outside remote Worker role.
- **Where it vanished:** mcp.oracle:74–75,103–104.
- **Reduction rule:** Inferred — connected-client success collapses per-request authorization. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML20 — SSE lifecycle/cancellation advice and rules

Controlled SDK lifecycle experiment proves forced close-on-Response truncates active SSE, while native delayed result survives. Production tools emit no progress and select auto JSON; full streaming/cancellation feature must supply same-path fixture before product-bug claim.

- **Source IDs/support:** M104, M105, M106; [S7 / M104 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#receiving-messages); [S7 / M105 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http); [S7 / M106 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#cancellation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M104: Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages; M105: No-buffer header; keepalive comments; no resumption. Same section.; M106: Disconnect=cancellation; stop soon; no further messages. #cancellation
- **Missing tested boundary:** No oracle observes request-related-only streamed notifications, forbidden server requests, final termination, buffering/keepalive behavior, or disconnect cancellation/no further messages. Conditional notification/subscription features must first be identified; basic streaming response remains a supported HTTP alternative.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — completed-result projection drops streaming lifetime. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML21 — Header/body routing and version validation

Native missing-version/method/name and version/method/name/encoding mismatches400/-32020, unsupported400 with supported-list, unknown RPC404/-32601 are public-observed. Null/sentinel/custom parameter/intermediary matrices remain distinct conditions; no duplicate local native guard added.

- **Source IDs/support:** M107, M108, M110, M111; [S7 / M107 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#protocol-version-header); [S7 / M108 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#standard-request-headers); [S7 / M110 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#value-encoding); [S7 / M111 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#server-validation). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M107: Version header/body match; unknown-version 400 supported list; method-not-found 404/-32601. #protocol-version-header; M108: Required Method/Name; safe encoding/decoded comparisons. #standard-request-headers; M110: Encoding, sentinel ambiguity, omitted/null values, invalid-character and mismatch rejection. #value-encoding; M111: 400/-32020 validation; numerical integers; intermediaries verify validation-capable version. #server-validation
- **Missing tested boundary:** No raw mismatch/missing/invalid header tests for protocol, method/name, encoding/sentinel, decoded comparison, or 400/-32020; no unsupported-version supported-list or RPC404/-32601 witness. Custom parameters are conditional, not assumed.
- **Where it vanished:** mcp.oracle:59–80; targeted search found no named headers.
- **Reduction rule:** Inferred — SDK-generated happy headers erase contradictory envelope/body cases. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML22 — Modern-only legacy traffic/fallback boundary

Default SDK includes legacy fallback; GET405 observed. Modern-only/resumption-ignore and older full handshake guarantees not assumed or exhaustively tested.

- **Source IDs/support:** M112; [S7 / M112 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#backward-compatibility). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M112: Inspect modern errors before legacy fallback; modern-only GET/DELETE405, ignore session/resumption headers. #backward-compatibility
- **Missing tested boundary:** No GET/DELETE/session/resumption receiving tests; version capability scope not explicitly declared. Legacy support is not assumed, and full old revision obligations are excluded.
- **Where it vanished:** mcp.oracle:59–80.
- **Reduction rule:** Inferred — one ecosystem client path drops era-boundary traffic. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML23 — Independent conformance/scoring limits

Conformance requirement revision/mode/scoring/baseline accounting is an independent tool campaign, not equivalence to local oracle count. AS excluded by core role scope.

- **Source IDs/support:** M124, M125, M126, M127, M128, M129, M130; [S11 / M124 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M125 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M126 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M127 section](https://github.com/modelcontextprotocol/conformance#conformance-requirements); [S11 / M128 section](https://github.com/modelcontextprotocol/conformance#expected-failures); [S11 / M129 section](https://github.com/modelcontextprotocol/conformance#expected-failures); [S11 / M130 section](https://github.com/modelcontextprotocol/conformance#running-against-an-sdk-at-a-specific-ref). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M124: Independent wire capture and scenario checks; client/server modes are separate.; M125: --requirements revision freezes release requirements; --suite/--spec-version selects evolving suites.; M126: Requirement sets deliberately omit AS scenarios; MCP AS implementation is beyond own role scope.; M127: not_scored: extension, added-after-release, pending reference fixture; reports still show them.; M128: Baseline failure remains requirement failure even if CI exit0; stale baseline pass exits1.; M129: Per-check baseline narrower than whole scenario; repeated IDs collapse; skipped checks differ from reached checks.; M130: List scenarios; auth/client metadata/DCR examples; test exact SDK ref and each mode.
- **Missing tested boundary:** No checked-in MCP conformance requirement-set run, wire report, named scenario inventory, role split, or explicit baseline/not_scored accounting. Test-only spike and local oracle campaign are different tools; AS conformance deliberately exceeds core MCP requirement scope. These are testing ideas/boundaries, not universal test mandates.
- **Where it vanished:** package.json:scripts; docs/auth-oracles current verification; docs/testing.
- **Reduction rule:** Inferred — local pass counts compress ecosystem/scoring distinctions. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ML25 — Large single-event SSE processing boundary

Large SSE event parser performance concerns client role and active stream; preserve optional interoperability endurance test, not Worker AS mandate.

- **Source IDs/support:** M136; [S12 / M136 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes). Source version and exact named section pointers: frozen mcp-sources.md source block/table rows for those IDs.
- **Supported clause(s):** M136: eventsource-parser>=3.0.8, large SSE performance fix.
- **Missing tested boundary:** No large-event receiving/endurance witness or named parser-version assertion. Release guidance concerns clients; retained only as optional interoperability test idea, not Worker AS obligation.
- **Where it vanished:** mcp.oracle:59–80; package.json.
- **Reduction rule:** Inferred — small normal-result projection. Known fact is the absent named distinguishing oracle in inspected files; author motive or explicit rejection is not known.

## ILM01 — Broad AS security delegation remains bounded

Bounded provider delegation is not proof of all imported OAuth2.1 clauses; preserve confidential/security breadth investigation, cross-reference ML02.

- Source support: [M006, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#overview) — MUST: OAuth2.1 security for public/confidential clients. #overview. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Native authorization/token validation code exists, but this source row imports broad OAuth2.1 security beyond the clauses independently traced here. This is an unresolved breadth boundary, not an assertion that the provider lacks a guard.
- Where it vanished or stopped: oauth:32–68; native provider PKCE/issuer/client/redirect routines.
- Reduction rule: A provider configuration can stand in for a full imported security contract; inferred only. No explicit author rejection or motive was observed.

## ILM02 — Storage and refresh secrecy evidence boundary

Unknown native persistence, deployment confidentiality and logging; wrapper hashed records are evidence only. Cross-reference ML07/ML12.

- Source support: [M017, S2 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization#refresh-tokens) — MUST/SHOULD: Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens; [M086, S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#token-theft) — MUST: Secure token storage; OAuth2.1 security. #token-theft. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Grant/code hashes and hashed client-secret configuration exist. Full native token persistence representation, deployment confidentiality, and logging secrecy were not established. Unknown, not absence of secure storage.
- Where it vanished or stopped: oauth:16,64,132–153; bounded native provider inspection.
- Reduction rule: Functional token validation and hashed wrapper records compress a broader storage/transit contract; inferred only. No explicit author rejection or motive was observed.

## ILM04 — Correlated scope-elevation log advice

No correlated elevation event observed; advice not MUST. Preserve event/privacy design before adding log payloads; no token logging proposed.

- Source support: [M066, S3 section](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#scope-minimization) — advice: Correlated elevation logs. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: No production path in the read files records requested/new/prior scopes as a correlated elevation event. The only explicit error logger emits name. Advice strength retained.
- Where it vanished or stopped: oauth-routes:13–15,61–78; mcp:28–42.
- Reduction rule: Minimal error logging omits an elevation observation dimension; inferred only. No explicit author rejection or motive was observed.

## ILM05 — Production HTTPS boundary remains unknown

Deployed TLS/full redirect schemes not established; source-config https fixtures do not resolve edge behavior. Cross-reference ML13.

- Source support: [M089, S6 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations#communication-security) — MUST: HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Endpoint/issuer locations depend on request URL; provider helper normalizes issuer URL and native redirect validation exists. Frozen Worker configuration does not establish deployed HTTPS enforcement or every unsafe redirect-scheme receiving branch.
- Where it vanished or stopped: oauth:12–14,63; provider authorize:5350,5390–5428; wrangler.jsonc:20–21.
- Reduction rule: HTTPS deployment context is implicit rather than observed; inferred only. No explicit author rejection or motive was observed.

## ILM06 — Conditional response-stream lifetime boundary

Controlled public SDK lifecycle probe confirms conditional close-on-Response failure; current production JSON tools lack required streaming precondition. No unsupported tasks/progress feature added to claim a production RED.

- Source support: [M104, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#receiving-messages) — MUST/SHOULD: Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages; [M105, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) — SHOULD/advice: No-buffer header; keepalive comments; no resumption. Same section.; [M106, S7 section](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#cancellation) — MUST/SHOULD: Disconnect=cancellation; stop soon; no further messages. #cancellation. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: SDK can resolve an SSE Response before final result and carries no-buffer, keepalive and cancellation controls. Wrapper finally closes handler after fetch returns. No progress notification/task/subscription path configured in visible tools; thus continued streaming lifetime is unresolved when such a path is active, not a demonstrated ordinary-call failure.
- Where it vanished or stopped: mcp:48–53; SDK index:148–210,1408–1441,1498–1503.
- Reduction rule: Response object completion is treated as operation completion; inferred from unconditional finally closure, not known intent. No explicit author rejection or motive was observed.

## ILM07 — Advisory applicability remains unknown

Official advisory pages opened in authorized post-survey extension: sdk>=1.10.0<=1.25.3 shared-instance issue patched1.26.0; sdk<1.25.2 UriTemplate issue patched1.25.2. Worker uses fresh server/transport, no resource templates; package server2.3.0 is distinct from v1 sdk. Prior unknown-range statement is historical, resolved without claiming general v2 immunity.

- Source support: [M120, S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7) — 2026-02-04: [Shared server/transport response leakage](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7); [M121, S9 section](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff) — 2026-01-07: [UriTemplate ReDoS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff). Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: Frozen source preserves advisory titles only; exact affected ranges and fixes unavailable in this assay. Per-request instances and absent resource templates are architecture observations, not proof of unaffected installed package.
- Where it vanished or stopped: mcp:25–26; S9 advisory-index-only source boundary.
- Reduction rule: Release pin or architectural alignment cannot replace an uninspected advisory range; inferred only. No explicit author rejection or motive was observed.

## ILM08 — Optional SDK input-limit fact retained

Native encoded body budget is now explicitly8MiB so5MiB media can travel as Base64; exact5MiB success and over8MiB envelope rejection tested. maxToolInputElements remains optional/off. Audience gate exists in wrapper and new request probes deny altered credentials. Optional cardinality limit needs explicit threshold/work bound; expectedResource middleware omission does not mean missing audience enforcement.

- Source support: [M134, S12 section](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes) — implementation fact: maxToolInputElements and expectedResource are opt-in/off by default; verifier must support audience check.. Original source version/conditions remain in mcp-sources.md.
- Absent or unresolved boundary: No maxToolInputElements configured; option remains off. This is a conditional hardening fact, not missing mandatory behavior. The parallel expectedResource option is also unused, but wrapper verifies resource audience itself.
- Where it vanished or stopped: mcp:26; oauth:124; SDK mcp bundle:515–540,1639,1811.
- Reduction rule: SDK defaults retained for input breadth while audience enforcement is supplied outside middleware; inferred from configuration, not known rationale. No explicit author rejection or motive was observed.


## Follow-up implementation boundary

Media parity now calls the canonical multipart REST handler from a Base64 adapter. Native maxRequestBodySize=8MiB bounds the encoded JSON request; exact5MiB image bytes pass and larger decoded image files are rejected by REST. maxToolInputElements stays optional/off; body-byte limit and element cardinality are different controls. The5MiB file rule does not become a new generic input threshold.

[Shared instance advisory](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7#description), Feb4,2026: sdk>=1.10.0<=1.25.3; patch1.26.0; separate server/transport per request avoids both described sharing regimes. [UriTemplate advisory](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff#description), Jan7,2026: sdk<1.25.2; patch1.25.2; requires exploded resource template patterns. No templates exist here. Split server2.3.0 is a different package; this is exact range/premise evidence, not an invented v2 blanket guarantee.
