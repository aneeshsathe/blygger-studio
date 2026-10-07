# OAuth protocol hardening and residual clauses

This record retains all source clauses from OL01–OL22. It distinguishes frozen missing-test findings, verified production behavior, and conditional/advisory/operational responsibilities. These are bounded observations, not full RFC/OIDC conformance or committed-head closeout. The source lists below preserve exact authority and triggers; notes do not replace those clauses.

Selected profile: public code + S256, explicit owner consent, resource-bound header Bearer, one-hour OAuth access and maximum thirty-day application grant. Owner password login is not OAuth password grant. DPoP/mTLS and implicit/hybrid/optional signed-request profiles are not promised. Test-only Better Auth fixture results do not establish production routing.

The task-local oauth-oracle-evaluation.md records exact source hashes, RED/GREEN and item dispositions. Named OPEN cells remain required review inputs before broader claims; passing generic tests does not resolve them. Operational tests did not access host credentials or deploy.

### OL01 — Redirect registration and authorization error boundaries

**Bounded evidence:** Exact unregistered redirects stay on the owner origin; relative/fragment/remote-HTTP registration fails; callback query, approval/denial state and hostile Unicode/HTML state survive. Errors can bind state in query or fragment. Owner authentication and main no-307 cases are separate witnesses.

**Residual / owner:** Native loopback/custom schemes and independent client callback security: phase 3 client interoperability. Wider phishing/deployment trust analysis: security review. No exhaustive arbitrary-URI claim.

**Preserved source clauses (12):**

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

### OL02 — PKCE downgrade and parser boundaries

**Bounded evidence:** Missing/empty challenge, unsupported/plain/missing S256 method, malformed/wrong/missing verifier, exact PKCE error enum, production S256 detection, challenge-not-in-code and a valid neighbor have named tests. Implementation oracles own matching-hash syntax cases.

**Residual / owner:** Unsolicited verifier has no freshly issued unchallenged code under S256-only policy. Preserve that reachability reason. Broader extraction/crypto analysis: pinned-provider security review; a substring check is not that proof.

**Preserved source clauses (11):**

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

### OL03 — Access token sender constraints and password-grant prohibition

**Bounded evidence:** Password grant is rejected by the root collateral test; owner password login is separate. Selected profile: standard header Bearer with audience restriction, short OAuth access lifetime and revocation.

**Residual / owner:** DPoP/mTLS is SHOULD, not an unqualified feature mandate. This profile does not promise sender constraints. Bearer theft permits use until expiry/revocation; risk owner: API security review.

**Preserved source clauses (2):**

- **S01-C016** — [S01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1); authority **SHOULD**; trigger: AS and resource server. Use sender-constrained access tokens such as DPoP or mTLS. Boundary: Do not elevate to MUST or require both mechanisms.
- **S01-C023** — [S01 §2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.4); authority **MUST NOT**; trigger: password grant. Do not use the resource-owner-password grant. Boundary: Owner login at AS is not this OAuth grant.

### OL04 — Refresh replay family invalidation and lifetime

**Bounded evidence:** Root proves active descendant refusal after ancestor reuse; implementation oracle tests concurrent rotation and later family checks. Validation adds omitted-scope preservation, other-client/resource refusal and thirty-day grant endpoints.

**Residual / owner:** Immediate-predecessor grace comment is not a measured retry window. Absolute grant expiry differs from inactivity. The valid-side long-delay refresh originally returned 500 and now passes after native-session lifetime repair. Owner: OAuth implementation, not a token-inequality assertion.

**Preserved source clauses (7):**

- **S01-C017** — [S01 §2.2.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.2); authority **MUST**; trigger: refresh tokens for public clients. Use sender constraints or rotation. Boundary: No requirement to issue refresh tokens.
- **S01-C042** — [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); authority **MUST + specified rotation mechanism**; trigger: public-client refresh replay protection uses rotation. Issue replacement each refresh; invalidate previous; retain relationship; detected reuse revokes active refresh token. Boundary: Rotation is an alternative to sender constraints; no prescribed storage transaction mechanism or grace interval.
- **S01-C044** — [S01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2); authority **MAY / SHOULD**; trigger: refresh tokens. May revoke after security events; should expire after inactivity at AS-selected interval. Boundary: No fixed TTL or mandatory logout revocation in this section.
- **S02-C053** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Require grant_type=refresh_token and refresh_token in UTF-8 form POST. Boundary: No optional feature mandate inferred.
- **S02-C054** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Do not expand beyond original scope; omitted scope equals original. Boundary: No optional feature mandate inferred.
- **S02-C057** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Validate refresh token. Boundary: No optional feature mandate inferred.
- **S02-C058** — [S02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6); authority **MUST**; trigger: refresh grant supported. Replacement refresh token preserves refresh scope. Boundary: No optional feature mandate inferred.

### OL05 — Source S01 remaining baseline detail

**Bounded evidence:** Production metadata is directly observed. Root forbids authorization GET/OPTIONS CORS and permits token browser access; those probes failed before the header/route fixes.

**Residual / owner:** Deployed CORS/proxy handoff is operational receiving work; owner: deployment verification. In-process HTTPS strings do not establish real TLS.

**Preserved source clauses (2):**

- **S01-C025** — [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); authority **RECOMMENDED**; trigger: AS/client discovery. Publish and use AS metadata. Boundary: §8414 duties conditional on metadata support.
- **S01-C027** — [S01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6); authority **MAY / MUST NOT**; trigger: browser endpoint access. CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. Boundary: Cross-origin navigation is distinct from CORS.

### OL06 — Deployment threat model and secret transport/storage

**Bounded evidence:** All operational clauses below are preserved. Secure/HttpOnly/SameSite cookies and public routes are bounded observations, not transport, storage or entropy proofs.

**Residual / owner:** OPEN assurance: attacker inventory; edge/proxy header provenance and protected link; TLS/certificates; token/log secrecy; refresh issuance risk; guessing bound; crypto timing. Owner: deployment/security review before public rollout. No credentials or deployment accessed.

**Preserved source clauses (16):**

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

### OL07 — Authorization-page external content, trust and clickjacking breadth

**Bounded evidence:** Root framing, consent binding/cross-origin denial, client-name escaping, hostile state echo and same-origin page resources have separate tests. Consent labels self-asserted name, callback host, resource and lifetime.

**Residual / owner:** Legacy browser effective framing: browser security review. Client callback external content: phase 3 clients. Arbitrary framing origins and automatic repeated-approval trust are not inferred.

**Preserved source clauses (6):**

- **S01-C029** — [S01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4); authority **SHOULD NOT**; trigger: AS authorization page or callback response page. Avoid third-party resources and external links. Boundary: Client callback responsibility conditional on deployed client.
- **S01-C046** — [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); authority **MUST**; trigger: AS interaction pages. Prevent clickjacking. Boundary: No single mandated header satisfies all contexts.
- **S01-C047** — [S01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16); authority **SHOULD**; trigger: AS interaction pages. Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. Boundary: Legacy unsupported-user-agent boundary stated in source.
- **S02-C063** — [S02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2); authority **MUST; SHOULD**; trigger: unauthenticated public clients. Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. Boundary: Prior approval alone not proof of same public-client instance.
- **S02-C073** — [S02 §10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12); authority **MUST**; trigger: AS authorization endpoint. Prevent CSRF and malicious authorization without owner awareness/explicit consent. Boundary: No prescribed CSRF implementation.
- **S02-C074** — [S02 §10.14](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.14); authority **MUST**; trigger: external protocol values. Sanitize, and validate where possible, all received values including state and redirect_uri. Boundary: Exact-state echo must not be silently mutated.

### OL08 — Public-client identification and registration type

**Bounded evidence:** DCR tests distinguish client IDs, explicit public none authentication and authoritative defaults; code/refresh client binding is separate. Consent marks the supplied name self-asserted.

**Residual / owner:** client_id is public routing/binding data, not identity proof. Identifier-size compatibility and credential-exposure classification: API/provider security review. Defaults alone do not establish instance identity.

**Preserved source clauses (4):**

- **S02-C001** — [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); authority **MUST NOT / SHOULD**; trigger: registered clients. Do not treat client_id as a secret or use it alone for authentication. Boundary: No optional feature mandate inferred.
- **S02-C002** — [S02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2); authority **MUST NOT / SHOULD**; trigger: registered clients. Document identifier size. Boundary: No optional feature mandate inferred.
- **S02-C003** — [S02 §2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.1); authority **SHOULD NOT**; trigger: client registration. Do not assume client type without assessing credential exposure. Boundary: Client public/confidential classification not inferred from UI.
- **S02-C004** — [S02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3); authority **MUST NOT**; trigger: public-client authentication. Do not rely on it to identify the client. Boundary: PKCE is not client identity authentication.

### OL09 — Endpoint parsing and required inputs

**Bounded evidence:** Owner identity, GET authorize, missing/empty/duplicate/unknown inputs, unsupported responses, token fields, unknown code and form POST are covered by individual cases. Unknown extension fields preserve valid exchange.

**Residual / owner:** Configured URL query/fragment is a configuration constraint, not an HTTP-received fragment. Missing-scope policy and changed-grant scope reporting need explicit policy/witness. Owner: OAuth implementation. Do not classify repeatable RFC8707 resource as a singular duplicate.

**Preserved source clauses (18):**

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

### OL10 — Authorization-code expiry and invalid-code boundary

**Bounded evidence:** Unused code is checked at 599/600/601 with full Date control; unknown code and concurrent single use are separate. Native lifetime permits the exact expiry instant and rejects one second later.

**Residual / owner:** RFC6749 requires short expiry; ten minutes is RECOMMENDED and does not define equality. The simple model strict-600 predicate was not an approved public equality policy. No 599-second workaround or wrapper is added. Application grant deadline is a different law.

**Preserved source clauses (2):**

- **S02-C033** — [S02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2); authority **MUST**; trigger: code issued. Bind code to client identifier and redirect URI; expire shortly. Boundary: 10-minute maximum is RECOMMENDED, not hard MUST ceiling.
- **S02-C042** — [S02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3); authority **MUST / REQUIRED**; trigger: code token exchange. Validate code. Boundary: No optional feature mandate inferred.

### OL11 — Token response representation and cache policy

**Bounded evidence:** Success 200 JSON, string access/refresh fields, numeric lifetime, Bearer type, Cache-Control no-store and Pragma no-cache have explicit assertions. Consent cache headers have implementation tests.

**Residual / owner:** Optional extra response fields remain permitted. Finite shape tests do not establish every provider extension.

**Preserved source clauses (3):**

- **S02-C046** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **REQUIRED / protocol binding**; trigger: successful token response. Return HTTP 200 JSON object with access_token and case-insensitive token_type. Boundary: No optional feature mandate inferred.
- **S02-C047** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **REQUIRED / protocol binding**; trigger: successful token response. Represent strings as JSON strings and numbers as numbers. Boundary: No optional feature mandate inferred.
- **S02-C049** — [S02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1); authority **MUST**; trigger: any response containing sensitive data. Use Cache-Control: no-store and Pragma: no-cache. Boundary: OIDC errata examples omit Pragma; OAuth requirement remains recorded.

### OL12 — Token errors and auth-scheme fidelity

**Bounded evidence:** Root distinguishes malformed-body invalid_request from valid-wrong-PKCE invalid_grant. Validation distinguishes duplicate form, unknown/expired code, empty inputs and preserved authorization error state; password grant has collateral coverage.

**Residual / owner:** Confidential auth-scheme/status is conditional on registered method. Full enum/ASCII/error_uri boundaries: OAuth implementation testing. Optional description/URI presence is not a requirement.

**Preserved source clauses (2):**

- **S02-C050** — [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); authority **protocol binding / REQUIRED**; trigger: token error. Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. Boundary: Description/URI optional; enum semantics preserved.
- **S02-C052** — [S02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2); authority **MUST NOT / syntax**; trigger: token error fields. Restrict error/description ASCII and error_uri URI-reference syntax. Boundary: Do not confuse REST resource errors with token errors.

### OL13 — Forgery/guess resistance of access tokens

**Bounded evidence:** A mutated real production access JWT signature is denied before protected settings disclosure. Root production ID-token/JWKS verification is a separate observation.

**Residual / owner:** Entropy/guess resistance and arbitrary claim forgery are not proved by bad-token syntax or one mutation. Owner: pinned-provider cryptography/security review; do not expose keys.

**Preserved source clauses (1):**

- **S02-C066** — [S02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3); authority **MUST**; trigger: access tokens. Ensure unauthorized actors cannot generate, alter or guess valid tokens. Boundary: No optional feature mandate inferred.

### OL14 — Resource syntax and granted-resource expansion

**Bounded evidence:** Relative/fragment/foreign resources fail; an API grant cannot refresh to MCP or another client. Valid API reads and MCP audience refusal remain separate.

**Residual / owner:** Multi-resource narrowing is conditional. Omitted/default resource policy and advised invalid_target choices remain explicit cells. Owner: OAuth implementation. Repeated resource is not a generic singular duplicate.

**Preserved source clauses (3):**

- **S05-C001** — [S05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2); authority **MUST / SHOULD NOT**; trigger: resource parameter used. Resource value is absolute URI without fragment. Boundary: No optional feature mandate inferred.
- **S05-C005** — [S05 §2.1](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.1); authority **MAY / advice**; trigger: resource omitted or unacceptable. Omitted resource may use default/no resource or be required by policy; reject unacceptable values using invalid_target advised. Boundary: MCP may impose stricter resource parameter rules in other track.
- **S05-C006** — [S05 §2.2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.2); authority **protocol semantics**; trigger: resource at token exchange. Requested resources stay within granted resources; omission uses grant/default handling; code grant can select narrower resource; refresh can obtain restricted token from multi-resource grant. Boundary: No scope/resource escalation; distinct authorization grant and token audiences.

### OL15 — Resource metadata publication fields and routes

**Bounded evidence:** Challenge-linked metadata asserts resource, issuer array, scopes, header method, JSON 200 and exact API/MCP identity. Implementation test records derived host-root resource metadata 404.

**Residual / owner:** ROUTING DECISION: mount-only forwarding and challenge-linked metadata are selected; RFC9728 host-root well-known publication is not established. Owner: maintainer before claiming full RFC9728 conformance. resource_name is recommended, not mandatory.

**Preserved source clauses (8):**

- **S06-C001** — [S06 §1.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-1.2); authority **definition / SHOULD NOT**; trigger: PRM resource identifier. Use HTTPS URL without fragment; query discouraged with justified exception. Boundary: Not every resource identifier must be origin-only.
- **S06-C002** — [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); authority **REQUIRED**; trigger: protected resource metadata supported. Publish resource identifier. Boundary: authorization_servers optional under RFC itself; MCP profile may strengthen.
- **S06-C003** — [S06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2); authority **RECOMMENDED**; trigger: PRM supported. Publish scopes_supported and resource_name; can omit supported scopes. Boundary: No default bearer method implied by omission.
- **S06-C007** — [S06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3); authority **MUST**; trigger: PRM supported. Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. Boundary: Default /.well-known/oauth-protected-resource; multiple metadata locations allowed.
- **S06-C008** — [S06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1); authority **MUST**; trigger: PRM retrieval. Use GET; strip host terminating slash before prefix insertion with path/query. Boundary: Host root and mounted resource can coexist.
- **S06-C009** — [S06 §3.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2); authority **MUST**; trigger: PRM response. Return 200 application/json object; arrays represent multi-values; omit zero-value parameters; ignore unknown metadata. Boundary: §2 expressly permits empty bearer_methods_supported to mean none; retain tension rather than generalize zero-value wording blindly.
- **S06-C015** — [S06 §6](https://www.rfc-editor.org/rfc/rfc9728.html#section-6); authority **MUST / MUST NOT**; trigger: PRM string comparison. Unescape JSON; compare exact Unicode code points without normalization. Boundary: No URL rewrite normalization.
- **S06-C018** — [S06 §7.4](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.4); authority **SHOULD**; trigger: client expects several RSs. Request audience-restricted tokens with RFC8707; AS should support audience restriction. Boundary: Not mandatory new JWT profile.

### OL16 — DCR defaults unknown values and consistency

**Bounded evidence:** DCR tests reject malformed remote redirects, retain metadata, ignore unknown metadata and check default grant/response/confidential authentication. Public clients explicitly request none. Unknown scope uses invalid_client_metadata.

**Residual / owner:** Grant/response consistency is SHOULD. Unsupported combinations and software statements are conditional/profile cells. Owner: provider/client interoperability. Names/logos are self-asserted; TLS is OL06.

**Preserved source clauses (9):**

- **S07-C001** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **MUST**; trigger: DCR redirects supported. Support redirect_uris metadata; redirect-flow clients register redirects. Boundary: DCR itself optional absent profile requirement.
- **S07-C002** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **defaults / semantics**; trigger: DCR fields omitted. token_endpoint_auth_method defaults client_secret_basic; grant_types defaults authorization_code; response_types defaults code; grants/response types track grant definition. Boundary: Default public-client auth=none must be expressed where applicable; do not infer all methods required.
- **S07-C003** — [S07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2); authority **MUST**; trigger: DCR metadata parsing. Ignore unknown client metadata. Boundary: Known invalid metadata still error.
- **S07-C006** — [S07 §2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.1); authority **SHOULD**; trigger: DCR grant/response relationship. Prevent clients registering inconsistent grants and response types. Boundary: No obligation to support all combinations.
- **S07-C009** — [S07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3); authority **MUST**; trigger: DCR endpoint. Accept POST JSON; protect transport with TLS. Boundary: No requirement to accept arbitrary unbounded requests.
- **S07-C011** — [S07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1); authority **protocol binding / REQUIRED**; trigger: DCR successful response. Return 201 JSON, client_id and all registered metadata including server-provisioned values. Boundary: Server may reject/substitute requested values; granted metadata is authoritative.
- **S07-C014** — [S07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2); authority **protocol binding / REQUIRED**; trigger: DCR rejection. Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. Boundary: Descriptions optional.
- **S07-C015** — [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); authority **MUST**; trigger: DCR redirect security. Redirect values use TLS remote sites, localhost/native local web server, or native scheme permitted by source; S01/S11 narrow handling. Boundary: No arbitrary HTTP remote site.
- **S07-C016** — [S07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5); authority **MUST**; trigger: self-asserted metadata. Treat metadata as self-asserted unless trusted software-statement claim; assess entire request to prevent client impersonation. Boundary: Client name/logo not verified identity.

### OL17 — OIDC metadata production handoff and issuer law

**Bounded evidence:** Root production test checks mounted issuer/endpoints, response/subject types, openid/RS256/S256 and JSON; three-mount MCP tests remain real production receiving cases.

**Residual / owner:** Trailing-slash, metadata empty arrays/defaults and Unicode edge cells are not all measured by one issuer. Mixed-key use/x5c conditions depend on keys published. Owner: metadata/provider interoperability. No fixture handoff credit.

**Preserved source clauses (11):**

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

### OL18 — OIDC signing/JWKS production handoff

**Bounded evidence:** Root verifies production public RSA JWKS, RS256 ID token, issuer/client audience/owner/exp/iat/nonce and wrong audience. Essential auth_time and access signature mutation have separate tests.

**Residual / owner:** Rollover retention, long-term non-reassignment, optional encryption and header variations are lifecycle/security cells. Owner: provider/key lifecycle review. No unsigned or symmetric public-client mode is promised.

**Preserved source clauses (9):**

- **S09-C001** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **REQUIRED**; trigger: ID token issued. Include iss/sub/aud/exp/iat; issuer HTTPS with no query/fragment; sub locally unique never reassigned, <=255 ASCII; aud contains receiving client_id; NumericDate exp/iat. Boundary: Single-owner does not permit subject reuse or audience bypass.
- **S09-C004** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **MUST / MUST NOT**; trigger: ID-token cryptography. Sign ID tokens; if encrypting, sign then encrypt; none allowed only code/no authorization-endpoint token and explicit registration request. Boundary: No universal encryption mandate.
- **S09-C005** — [S09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); authority **SHOULD NOT**; trigger: ID-token JOSE headers. Avoid x5u/x5c/jku/jwk header key references; use established discovery/registration. Boundary: No new key-fetch protocol implied.
- **S09-C014** — [S09 §3.1.3.3](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse); authority **MUST**; trigger: initial OIDC code token response. Return ID token and access token in JSON; token_type Bearer unless other type negotiated; no-store header. Boundary: Non-openid OAuth response need not contain ID token.
- **S09-C028** — [S09 §5.6](https://openid.net/specs/openid-connect-core-1_0.html#ClaimTypes); authority **MUST**; trigger: OP claim support. Support normal claims. Boundary: Aggregated/distributed claims optional; full definitions preserved in raw.
- **S09-C029** — [S09 §5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability); authority **MUST / MUST NOT**; trigger: identity linkage. sub unique and never reassigned per issuer; do not use email/phone/name as unique subject identity. Boundary: Issuer and sub together identify owner.
- **S09-C033** — [S09 §10.1](https://openid.net/specs/openid-connect-core-1_0.html#Signing); authority **MUST / MUST NOT**; trigger: OIDC signing. Choose algorithm appropriate to key; signing key usage; kid for asymmetric keys; forbid symmetric signatures for public clients. Boundary: No mandated ES256 support.
- **S09-C034** — [S09 §10.1.1](https://openid.net/specs/openid-connect-core-1_0.html#RotateSigKeys); authority **SHOULD**; trigger: signing-key rollover. Retain recent decommissioned signing public keys for a reasonable validation transition. Boundary: No fixed retention interval.
- **S09-C040** — [S09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: all OIDC OPs. Support RS256 signing except narrowly described code-only none-only registration case. Boundary: No optional feature mandate inferred.

### OL19 — OIDC request nonce and authentication parameter duties

**Bounded evidence:** Root nonce receiving plus validation advisory display/locales/acr, prompt combinations, retained-cookie nonzero age, essential auth_time and full password/resume/consent/token paths distinguish duties. Silent-none returns login_required without a page; both completed reauth paths reach consent, callback and token exchange (111-test combined GREEN).

**Residual / owner:** Retain native cookies for normal browser age. Legacy-cookie-only bridge recreation is a distinct authentication-age policy, not a normal-browser repro. Hint issuer/subject/expired hint and requested sub remain OP cells. Owner: OAuth identity review. A 302 alone cannot close reauth.

**Preserved source clauses (17):**

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

### OL20 — OIDC offline consent and refresh client binding

**Bounded evidence:** Requested offline access is visibly disclosed before consent. Implementation tests contrast requested/absent and explain lifetime. Refresh from another registered client is denied.

**Residual / owner:** Application-type and non-code offline profiles are conditional interoperability cells. Owner: phase 3 clients. No grant without consent is credited; signed password/resume query integrity has native bridge tests.

**Preserved source clauses (2):**

- **S09-C035** — [S09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess); authority **MUST**; trigger: offline_access requested. Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. Boundary: Refresh tokens can be issued for other contexts; offline_access optional feature.
- **S09-C036** — [S09 §12.1](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST**; trigger: OIDC refresh. Validate refresh token, client binding and registered authentication when applicable. Boundary: Public none auth remains public.

### OL21 — OIDC redirect status and lifetime/revocation breadth

**Bounded evidence:** Actual OAuth access has 3599/3600 observations; long grant has thirty-day observations; visible consent explains hour/30 days/revoke. Main approval/denial redirects exclude 307.

**Residual / owner:** Short/single-use guidance is SHOULD with no universal TTL. Native inactivity, every redirect branch and deployed host schedules are distinct cells. Owner: provider lifecycle/deployment review.

**Preserved source clauses (2):**

- **S09-C057** — [S09 §16.18](https://openid.net/specs/openid-connect-core-1_0.html#TokenLifetime); authority **SHOULD**; trigger: access/refresh lifetimes. Prefer short or single-use access tokens; identify long grants; provide owner token-revocation mechanism. Boundary: RFC7009 endpoint not thereby unconditionally mandated.
- **S09-C059** — [S09 §16.22](https://openid.net/specs/openid-connect-core-1_0.html); authority **MUST NOT**; trigger: OP redirect to client. Do not use HTTP307 to redirect to Redirection URI; 303 preferable. Boundary: Broader than S01 credentials-present trigger.

### OL22 — Bearer challenge grammar and error distinctions

**Bounded evidence:** Bearer scheme, unique quoted attributes, printable syntax, missing-auth no-error, invalid 401, insufficient-scope 403 and metadata recipient origin are asserted. OAuth access expiry is separate from manual expiry.

**Residual / owner:** Malformed-transport versus invalid-token and detailed reasons are SHOULD policy cells, not automatic MUST breaches. Full character/URI fuzzing and browser lifetime policy: API security/interoperability review.

**Preserved source clauses (3):**

- **S10-C006** — [S10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3); authority **MUST NOT / grammar**; trigger: bearer challenge. Do not repeat realm/scope/error/error_description/error_uri; honor character syntax for scope/errors/URI. Boundary: scope/error_description/error_uri optional.
- **S10-C007** — [S10 §3.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-3.1); authority **SHOULD**; trigger: bearer resource errors. invalid_request=>400; invalid_token=>401; insufficient_scope=>403; expose reason when supplied token fails. Boundary: Status strength is SHOULD here; MCP may strengthen.
- **S10-C009** — [S10 §5.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.3); authority **SHOULD**; trigger: bearer issuance. Limit token lifetime, especially browser tokens; scope to recipients. Boundary: Illustrative <=1h is recommendation context, no mandatory universal TTL.


## Later security oracle pass

See [security release oracles](auth-security-oracles.md). It adds signed hostile-claim receiving cases, error-aware credential-leak probes, authenticated introspection revocation, effective Chromium framing and remote-HTTP refusal. Refresh replay now invalidates signed access credentials as well as refreshes, including a controlled two-isolate schedule. These bounded witnesses close particular security cells within the composite records above. They do not close every source clause.

The maintainer deferred OL15's host-root publication decision. Keep the RFC9728 publication limit in the PR body and retain the mounted profile. No `.well-known` root route was added.
