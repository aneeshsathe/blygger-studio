# OAuth implementation boundaries

The public Worker oracles test the mounted OAuth/OIDC routes and the single owner's REST/MCP resources. They do not claim complete OIDC certification, full RFC 8414 publication, or deployed proxy/TLS assurance. The frozen survey retains all 290 source claims; the implementation assay classified 132 as represented in code, 28 as omitted details, 59 as conditional or outside the server's role, and 71 as unknown. Those static counts are not pass counts.

The application uses issuer-appended OIDC discovery under the Studio mount. Host-root routes are excluded by the approved deployment constraint. The official MCP client follows the explicit resource-metadata challenge, discovers the mounted provider and completes a tool call. This proves that path works. It does not erase RFC 9728 §3's separate derived publication rule. That rule remains a profile decision: either declare the challenge-linked mounted profile's limit or select full RFC 9728 publication with a compatible deployment. Adding a root route is not an authorized default. RFC 8414's host-before-path convention is unselected; publishing an OAuth metadata alias under the mount does not establish full RFC 8414 support.

`test/oauth-implementation.oracle.test.ts` checks PKCE string syntax with both hostile strings and a legal neighbor, DCR error semantics, concurrent refresh rotation followed by a settled ancestor replay, and the public exclusion of native administrative endpoints. These are fixed bounded cases. One local refresh race is not proof of all cross-isolate schedules or transactional family invalidation. The pinned provider has a documented two-delete race window; deployment and adapter scheduling remain open. Code expiry and same-code exchange are checked separately in `test/oauth-validation.oracle.test.ts`. Native sessions last 30 days so a live offline grant does not fail at the provider’s earlier default seven-day session boundary.

The selected refresh policy permits code-flow clients after owner approval. Refreshes remain bound to the granted resources and scopes. A fixed 30-day grant deadline bounds repeated refreshes; access tokens normally last one hour. This is an explicit single-owner policy, not evidence that every public client has the same risk. RFC 9700 requires assessing issuance risk; it does not prescribe a callback or a risk-score API. Future changes to anonymous registration, public exposure or offline consent must revisit that policy.

Client identifiers are opaque and public. The pinned provider generates 32 ASCII letters for its default client ID. Clients must not rely on that internal alphabet or treat the ID as authentication. Registered confidential credentials use their selected authentication method. Native clients cannot gain confidentiality merely by registering a distributed static secret.

## Preserved decisions and limits

| Raw item | Requirement and durable boundary |
|---|---|
| ILO01 | Sender-constrained access tokens are RFC 9700 advice, not a universal MUST. The selected REST/MCP profile accepts Bearer and rejects `cnf`; adding DPoP or mTLS is a separate protocol choice. |
| ILO02 | Authorization CORS is forbidden by RFC 9700. Direct token/discovery access has a different CORS boundary. `oauth-spec.oracle.test.ts` keeps both cases. |
| ILO03 | Refresh issuance needs a risk assessment. The policy above states the present scope; no mandatory scoring callback is inferred. |
| ILO04 | Consent framing and owner-login framing are separate receiving boundaries. `oauth-spec.oracle.test.ts` checks login; consent checks remain in the flow driver. |
| ILO05 | The current generated identifier size is documented above. IDs remain opaque. |
| ILO06 | The provider's native password/client-auth limiter and the legacy owner-login limiter are separate. `auth-deployment.oracle.test.ts` checks shared budgets, identity spoofing and owner guessing. Native server API calls do not prove HTTP admission controls. |
| ILO07 | Wrong media type, duplicate parameters, empty fields, multiple client authentication and wrong verifier have distinct protocol errors. Wrapper parsing must not run outside the protocol error envelope. Repeated `resource` is an allowed exception. |
| ILO08 | Native credential responses use both `Cache-Control: no-store` and `Pragma: no-cache`. Custom consent HTML now also sends both headers; a public render witness checks them. OIDC no-store examples do not remove the OAuth rule. |
| ILO09 | RFC 6749 recommends showing the client, scope and lifetime. The consent page now shows its 30-day grant limit. A public render witness checks that disclosure. This is a SHOULD UI detail, not an invented fixed token TTL requirement. |
| ILO10 | PKCE syntax is 43–128 unreserved characters. Hash equality does not establish syntax or verifier entropy. Verifier creation entropy is a client duty; AS rejection of malformed values is a separate receiving test. |
| ILO11 | A well-formed wrong PKCE verifier yields `invalid_grant`; omitted/malformed protocol fields remain distinct. A status-only rewrite cannot supply the right error enum. |
| ILO12 | The RFC 8414 host-before-path publication convention is unselected under the mount-only constraint. OIDC issuer-appended discovery remains valid. The public no-root witness does not mean RFC 8414 is satisfied. |
| ILO13 | `resource_name` is recommended metadata. Its omission is retained as advice; it is not a required authentication field. |
| ILO14 | RFC 9728 §3 requires derived well-known publication; §5.1 names an explicit challenge URL and §3.3 gives its validation rule without expressly waiving §3. Challenge interoperability and full publication conformance are distinct. The mount-only constraint is the unresolved profile boundary. |
| ILO15 | An invalid registration metadata value maps to `invalid_client_metadata`, not a token endpoint's `invalid_scope`. Software-statement error variants remain conditional on that optional feature. |
| ILO16 | The ordinary legacy bridge now preserves the verified cookie’s original authentication time. A password-checked signed-query continuation creates a fresh native session and lets the provider clear its own prompt/max_age fields. Tests reach the password POST, resume consent and token issuance, reject invalid signatures/cross-origin requests without sessions, preserve a two-hour-old legacy-only cookie’s age, and complete both modes within the same second. Local cases do not establish all OIDC optional prompt profiles. |
| ILO17 | Offline access consent is distinct from owner API permission consent. The consent page now explains requested offline renewal and its limit before approval. A public render witness distinguishes requests with and without that scope. Refresh tokens issued in other contexts do not universally require this scope. |
| ILO18 | Owner availability of UserInfo access logs is a privacy SHOULD. Authorization listings are not access history. No owner log pipeline or platform access assurance is claimed. |

Unknown cells remain open: deployed TLS/certificates/proxy links; key rollover; all refresh/code interleavings; client-type credential exposure; full UserInfo privacy/wire duties; dynamic OP applicability; Request Objects; complete error character and Unicode processing; and official conformance plans. Optional features and RP validation duties do not become universal AS requirements.

The client-keyed authorization list is separate from signed per-token scope enforcement. No inspected normative source requires a historical row for every token. Decision #52's individual/all-credential revocation contract still needs its own receiving witness; source absence is not proof that contract is met.

## Later security and profile decisions

The grant list now uses a distinct grant key, with public independent-grant revocation tests. The earlier client-keyed-list observation above describes the frozen snapshot. Refresh replay now writes a shared app grant tombstone using hashed issuance mappings. A controlled cross-isolate race proves that pending issuance cannot return usable credentials after replay. This contains the selected JWT resource profile without claiming that the native provider's multi-call row cleanup became a transaction.

The maintainer deferred the host-root `.well-known` publication question. ILO14 and OL15 now have action `deferred`, with this document and the PR body as destinations. The normative publication clauses remain intact. Mounted discovery interoperability does not establish full host-root publication compliance.
