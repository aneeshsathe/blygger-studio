---
instrument: research-survey
title: "Mounted OAuth and MCP: specifications, tests, and deployment boundaries"
question: "Which specifications, testing requirements, and production-hardening practices apply to Blygger's mounted single-owner OAuth/OIDC server and REST/MCP resources on Workers/D1?"
scope: "English primary standards and official guidance, retrieved 2026-10-04; Better Auth 1.7.7 and MCP SDK 2.3.0"
intended_use: "Loss audits first against oracles, then implementation; each finding independently evaluated"
depth: broad
researched_at: 2026-10-04
source_cutoff: 2026-10-04
status: bounded
---

# Mounted OAuth and MCP: research survey

## Survey brief

The question and intended use are above. Included: wire protocol, mounted discovery, issuer/audience binding, OIDC, MCP transport and authorization, test integrity, provider storage, runtime limits, abuse controls and logging. Excluded: multi-user federation, billing, UI redesign, deployment actions, exhaustive penetration testing and certification claims. Starting sources: the TanStack oracle guide and approved mounted OAuth/MCP design. Available source language: English. Scope and coverage cells were frozen before searching. Each of three tracks had a budget of twelve opened load-bearing sources plus a contrary/failure pass. The guide is a fourth, supplied source. The source inventory and complete bounded claim records appear in the appendices.

## Orientation

C1 — Mounted OAuth and OIDC discovery use different URL conventions. A client fallback requirement does not require a server to host every discovery path. [S1](#s1)

C2 — MCP transport/resource conformance and authorization-server correctness have different testing boundaries. The official conformance project explicitly limits the latter. [S2](#s2)

C3 — Provider protections depend on configured storage and runtime conditions. Vendor serverless advice, historical advisories, and current pinned-package mechanisms carry different evidence. [S3](#s3)

C4 — Oracle evidence needs independent judgments, reached observations, calibrated checks and bounded coverage claims; numbered requirements control guide conformance. [S4](#s4)

## Terms and distinctions

AS: authorization server; RS: resource server; OP: OpenID Provider; RP: relying party/client. These roles change which requirements apply. MUST/SHOULD/MAY retain each source's strength. Advice is not promoted to a protocol requirement. Current specification, older compatibility revision, patched advisory and uninspected advisory lead remain distinct. Source text supports a requirement; it does not prove an implementation satisfies it.

## Evidence landscape

Appendix O preserves 290 source-order OAuth/OIDC claim rows from twelve sources. Appendix M preserves 138 MCP clause/lead IDs from twelve sources. Appendix H preserves 36 hardening items and five version/package anchors from twelve web sources. The fourth source is the oracle guide's fourteen numbered obligations. These counts measure the preserved inventory, not independent findings, test counts or coverage. Multiple rows can share the same underlying requirement.

## Positions and mechanisms

The records retain exact redirect binding, PKCE, issuer and audience checks, replay detection, scoped consent, signed-token versus stored-token revocation, stateless transport, shared atomic storage, runtime limits and conformance boundaries. They keep optional profiles and client/proxy duties apart from Blygger's server duties. No choice among optional profiles is made by this survey.

## Disputes and conflicting evidence

The appendices preserve several limiting distinctions: RFC8414 differs from OIDC mounted discovery; DCR remains a supported alternative to other registration mechanisms; module-level memory is not reset merely by constructing a new factory but does not establish distributed counters; ordinary D1 bindings remain primary whereas replica Sessions introduce consistency choices; a patched advisory supplies a regression idea rather than proof of a current defect. The MCP conformance README's older draft wording differs from the official current-version record. No independent empirical deployment evidence resolves these boundaries here. [S1](#s1), [S2](#s2), [S3](#s3).

## Cases and timeline

Foundational OAuth RFCs date from 2012 onward; RFC9700 and RFC9728 date from2025. Current MCP is2026-07-28. SDK2.3.0 release and recent advisory-index leads are retained with their publication dates. Better Auth rolling documentation is separated from pinned1.7.7 package evidence and the historical1.6.11 patch. See original source inventories for dates; retrieval date is not publication date.

## Coverage and gaps

| Cell | Status | Sources | Limit |
| --- | --- | --- | --- |
| OAuth bindings, replay, metadata and OIDC | supported | Appendix O | Optional profiles and client duties need applicability checks |
| MCP mounted discovery and current transport | supported | Appendix M | Historical compatibility clauses only partly inspected |
| Provider/runtime hardening | supported/thin | Appendix H | Rolling documentation does not prove configured behavior |
| Test integrity | supported | S4 | Not a product security specification |
| Official conformance tools | thin | Appendices O/M | Detailed OIDF test plans and MCP scenario source not inspected |
| Live proxy, abuse/load and recovery | unmeasured | All tracks | No deployment or production secrets inspected |
| Full advisories and SSRF fetch paths | thin | Appendices M/H | Index-only leads and conditional features need later verification |

## Claim-to-source ledger

| Claim | Kind | Support | Confidence | Limit |
| --- | --- | --- | --- | --- |
| C1 | primary specification | S1 | solid | URL convention only |
| C2 | official tooling record | S2 | solid | Tool scope, not candidate result |
| C3 | vendor guidance | S3 | solid within published scope | Pinned/deployed applicability is separate |
| C4 | supplied testing guide | S4 | solid | Guide conformance only |

The appendices retain every track claim, its support and its original limit. Source IDs are namespaced O/M/H in this integrated record; raw track claim IDs remain unchanged in the task-local originals. No claim was selected by majority agreement.

## Sources

- <a id="s1"></a>**S1** — [RFC8414 §5](https://www.rfc-editor.org/rfc/rfc8414.html#section-5), IETF,2018. Used for C1. URL placement does not settle application interoperability.
- <a id="s2"></a>**S2** — [MCP conformance requirements](https://github.com/modelcontextprotocol/conformance#conformance-requirements), MCP maintainers, rolling. Used for C2. Current tooling policy, not an AS certification.
- <a id="s3"></a>**S3** — [Better Auth rate limits](https://better-auth.com/docs/concepts/rate-limit), rolling. Used for C3. Configuration guidance, not a measured deployment.
- <a id="s4"></a>**S4** — [Oracle testing guide](https://github.com/TanStack/db/blob/main/docs/contributing/oracle-tests.md), TanStack DB, current text retrieved2026-10-04. Used for C4. Numbered ORC001–014 are the normative guide checklist; no additional obligation is inferred from examples.

All remaining primary sources and package hashes are retained in the appendices.

## Search and control record

- **Search routes:** three separate primary-source tracks: OAuth/OIDC standards and OIDF, MCP specifications/security/testing, Better Auth/Cloudflare/OWASP. See each track for query families and access failures.
- **Prominence counter-search:** first-party failure reports, protocol exceptions, older-versus-current boundaries and non-overview testing guidance were sought; retrieval counts were not treated as consensus.
- **Contrary-evidence search:** checked mounted-discovery differences, replay/rotation failures, JWT revocation limits, storage scope, stale replicas, Node stubs, version/advisory boundaries and conformance omissions.
- **Source-class coverage:** primary standards, official package/runtime documents, maintainers' advisories and OWASP guidance. Vendor sources and their code remain correlated; no independent penetration study was included.
- **Recency check:** foundational standards and current versioned pages are distinguished from rolling documentation and historical advisories. Cutoff2026-10-04.
- **Saturation check:** each track stopped at twelve load-bearing web sources. The two-no-new-mechanism rule did not fire; saturation is not claimed. The guide was supplied separately. Scoped local package anchors supplement the hardening track.

## Limits and unmeasured

Main artifact risk: a detailed, official-source inventory can look exhaustive and turn conditional client/proxy duties into universal server requirements. The appendices preserve applicability and unknowns to limit that distortion. Unmeasured: all conformance plans, complete advisory ranges, real proxy topology, private operator settings, cross-isolate load, recovery drills, non-English sources and runtime safety of every dependency. This is a bounded research substrate, not a security approval or complete coverage claim.

## Handoff index

Appendix O: standards and roles. Appendix M: MCP resource/transport/authentication and testing boundaries. Appendix H: provider/runtime/operational evidence. S4: oracle-quality requirements. These are inputs to the user's separately requested oracle loss audit, implementation loss audit and evaluate-review; the survey itself makes no implementation verdict.


## Appendix O — preserved source track

## OAuth/OIDC normative sources — bounded research track

### Frozen brief

Question: Which published specifications, testing requirements, and production-hardening practices apply to Blygger’s mounted, single-owner OAuth/OIDC authorization server and REST/MCP resources on Cloudflare Workers/D1, using Better Auth 1.7.7 and MCP SDK 2.3.0?

This track covers OAuth/OIDC specifications and official conformance-program evidence only. It supports a later source-preserving test/implementation audit. No candidate code, tests, live behavior or package code was read. No implementation verdict, recommendation, modification or certification is made. Better Auth version is supplied context, not inspected package evidence.

Depth: broad bounded English-primary-source survey, retrieved 2026-10-04. Starting sources are frozen in `/private/tmp/blygger-auth-audit/brief.md`. Exclude multi-user federation, unrelated protocols, billing, UI redesign, deployment, full penetration testing and exhaustive certification. OAuth client obligations are retained as conditional interoperability/client-contract requirements; they are not all duties of the Blygger AS.

### Source inventory

Stable source IDs follow first inspection order within this track. Raw paths contain complete public texts or explicit rescanning pointers. All protocol sources are primary specifications. OS12 is official program guidance, not a protocol normative authority. Each raw file has SHA256 below; HTML and derived compact text remain local for rescanning.

| ID | Inspected primary source | Date | Authority / scope | Raw pointer | SHA256 |
|---|---|---|---|---|---|
| OS01 | [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) | 2025-01 | BCP 240 updates OAuth security | `/private/tmp/blygger-auth-audit/oauth-raw/rfc9700.txt` | `9919d061d40a97886ca866b51c69389b6c81c65cd4b979056c14fdbebfcf622a` |
| OS02 | [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html) | 2012-10 | OAuth framework; read with OS01 updates | `/private/tmp/blygger-auth-audit/oauth-raw/rfc6749.txt` | `f204fc8661d6c92d2ec6e0b54808f961a9ad26e792f57f312d9528335519bd71` |
| OS03 | [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html) | 2015-09 | PKCE Standards Track | `/private/tmp/blygger-auth-audit/oauth-raw/rfc7636.txt` | `1972e5d81cbaba7066cfd46374207bc2b4546b085ed5dd9b034e79e023e0ca31` |
| OS04 | [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html) | 2018-06 | Authorization-server metadata Standards Track | `/private/tmp/blygger-auth-audit/oauth-raw/rfc8414.txt` | `16c816e4e0fdbffb7e910ff3017867bf39debe9cb7f52f5cbc508a052ed660e8` |
| OS05 | [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html) | 2020-02 | Resource indicators Standards Track | `/private/tmp/blygger-auth-audit/oauth-raw/rfc8707.txt` | `3b89844a938b9219571931b664ed4a7b380555a4dda1df4e9445a2f72188e76b` |
| OS06 | [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html) | 2025-04 | Protected-resource metadata Standards Track | `/private/tmp/blygger-auth-audit/oauth-raw/rfc9728.txt` | `b65bcd0d9daf90fd7006a42cf48e0ac3ba24b7f5637d5197f2de41c6b91c8a89` |
| OS07 | [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591.html) | 2015-07 | Dynamic client registration Standards Track | `/private/tmp/blygger-auth-audit/oauth-raw/rfc7591.txt` | `f9cd8b8eefdb2d1b1bd5734310f246926db0abb4ec1b2f933f358d58327964e3` |
| OS08 | [OIDC Discovery 1.0 errata set 2](https://openid.net/specs/openid-connect-discovery-1_0.html) | 2023-12-15 | OpenID Foundation Final specification | `/private/tmp/blygger-auth-audit/oauth-raw/oidc-discovery.html` | `0401a07b35de50e914e195aa2c3c64cc4f6542464381c885d24a2623fbf75ec2` |
| OS09 | [OIDC Core 1.0 errata set 2](https://openid.net/specs/openid-connect-core-1_0.html) | 2023-12-15 | OpenID Foundation Final specification | `/private/tmp/blygger-auth-audit/oauth-raw/oidc-core.html` | `4d016752a645e8a3c259baa4173b5a90cb6c82898ce868fc8444adde262a5aed` |
| OS10 | [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html) | 2012-10 | Bearer-token binding Standards Track; read with OS01 updates | `/private/tmp/blygger-auth-audit/oauth-raw/rfc6750.txt` | `9dc385cf4ecdd85024e5a95e447ede9230e11700bf35251906b25b37557d604b` |
| OS11 | [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html) | 2017-10 | Native-app OAuth BCP 212 | `/private/tmp/blygger-auth-audit/oauth-raw/rfc8252.txt` | `4233c0650ec7e7918c20e0fde2dc565f85e2aa2d4c18123e3cd834295c2f68d0` |
| OS12 | [OpenID Foundation certification page](https://openid.net/certification/) | retrieved 2026-10-04 | Official testing/certification program description, not a protocol standard | `/private/tmp/blygger-auth-audit/oauth-raw/oidf-certification-pointer.txt` | `e0e40d13f499e24dd3cc80fa987d0f6a8a2b104e8d31393f4c82543bd0252123` |

### Claim ledger

Each source-order ID is stable within this frozen record. Support type for OS01–OS11 is **primary normative specification**; OS12 is **official program description**. Capitalized authority is preserved. “Protocol binding”, “definition”, “syntax” and lowercase advice name rules expressed without a keyword; they are not promoted to MUST. Each row states its applicability trigger and boundary. Rows can contain tightly linked subclauses; every such clause remains in the row and full source, for later loss audit.

| Claim ID | Source section | Authority | Applicability trigger | Supported requirement / boundary | Exclusion or limit |
|---|---|---|---|---|---|
| OS01-C001 | [OS01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1) | MUST / MUST NOT | redirect flows | Compare registered redirect URIs by exact string, with only the native loopback port exception. | No optional feature mandate inferred. |
| OS01-C002 | [OS01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1) | MUST / MUST NOT | redirect flows | Do not expose open redirectors on the authorization server or client. | No optional feature mandate inferred. |
| OS01-C003 | [OS01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1) | MUST / MUST NOT | redirect flows | Avoid forwarding owner credentials when redirecting a request that may contain them. | No optional feature mandate inferred. |
| OS01-C004 | [OS01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1) | MUST; MAY alternatives | client callback handling | Clients prevent CSRF; verified PKCE support permits PKCE; OIDC nonce provides protection; otherwise use one-time state bound to user agent. | Client obligation, not a requirement that every AS request contain state. |
| OS01-C005 | [OS01 §2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1) | REQUIRED; SHOULD; MAY alternative | client uses multiple AS issuers | Clients prevent mix-up, preferably with issuer identification; distinct redirect URIs are an alternative. | Single-AS client is expressly exempt under §4.4.2; single-owner AS does not prove client uses only one AS. |
| OS01-C006 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Public clients use PKCE to prevent code injection and misuse. | No optional feature mandate inferred. |
| OS01-C007 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Bind each transaction-specific challenge or OIDC nonce to the client and user agent. | No optional feature mandate inferred. |
| OS01-C008 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Authorization servers support PKCE. | No optional feature mandate inferred. |
| OS01-C009 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Enforce correct verifier whenever authorization includes a valid challenge. | No optional feature mandate inferred. |
| OS01-C010 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Reject a verifier at token exchange if authorization contained no challenge. | No optional feature mandate inferred. |
| OS01-C011 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | MUST | authorization code / PKCE | Provide a detectable PKCE capability. | No optional feature mandate inferred. |
| OS01-C012 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | RECOMMENDED / MAY | PKCE capability publication | Publish code_challenge_methods_supported in AS metadata; deployment-specific detection is permitted. | Metadata field is recommended; capability detection mandatory. |
| OS01-C013 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | RECOMMENDED / MAY | confidential code clients | PKCE recommended; confidential OIDC clients may instead use nonce with §4.5.3.2 safeguards. | No universal confidential-client PKCE MUST. |
| OS01-C014 | [OS01 §2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1) | SHOULD | PKCE clients | Use a method concealing verifier; O<code>S&#50;56</code> is currently the only such method. | OS03 separately makes O<code>S&#50;56</code> server MTI. |
| OS01-C015 | [OS01 §2.1.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.2) | SHOULD NOT / SHOULD | access tokens in authorization response | Avoid implicit/access-token response types unless injection and leakage mitigations hold; prefer code. | Not an unconditional AS prohibition of every implicit OIDC response type. |
| OS01-C016 | [OS01 §2.2.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.1) | SHOULD | AS and resource server | Use sender-constrained access tokens such as DPoP or mTLS. | Do not elevate to MUST or require both mechanisms. |
| OS01-C017 | [OS01 §2.2.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.2.2) | MUST | refresh tokens for public clients | Use sender constraints or rotation. | No requirement to issue refresh tokens. |
| OS01-C018 | [OS01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3) | SHOULD | access token issuance | Restrict privileges to the minimum needed. | No optional feature mandate inferred. |
| OS01-C019 | [OS01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3) | SHOULD | access token issuance | Restrict audience to a specific resource server or a small set if necessary. | No optional feature mandate inferred. |
| OS01-C020 | [OS01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3) | SHOULD | access token issuance | Restrict resources and actions. | No optional feature mandate inferred. |
| OS01-C021 | [OS01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3) | MUST | resource request whose token was intended for another RS | Refuse requests for the wrong resource-server audience. | JWT aud is one permitted expression; JWT access-token format not mandatory. |
| OS01-C022 | [OS01 §2.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.3) | normative lowercase obligation | resource/action restrictions in token | Verify permitted resource and action on every resource request; refuse requests outside them. | No particular scope vocabulary imposed. |
| OS01-C023 | [OS01 §2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.4) | MUST NOT | password grant | Do not use the resource-owner-password grant. | Owner login at AS is not this OAuth grant. |
| OS01-C024 | [OS01 §2.5](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.5) | SHOULD / RECOMMENDED | credentials can feasibly be kept confidential | Enforce client authentication; prefer asymmetric methods. | Public clients cannot be made confidential by distributing a static secret. |
| OS01-C025 | [OS01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6) | RECOMMENDED | AS/client discovery | Publish and use AS metadata. | §8414 duties conditional on metadata support. |
| OS01-C026 | [OS01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6) | MUST NOT | authorization response redirects | Forbid http redirects except native loopback-interface redirects. | Not a ban on native private schemes addressed by OS11. |
| OS01-C027 | [OS01 §2.6](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.6) | MAY / MUST NOT | browser endpoint access | CORS permitted at directly accessed endpoints; do not support CORS at authorization endpoint. | Cross-origin navigation is distinct from CORS. |
| OS01-C028 | [OS01 §3](https://www.rfc-editor.org/rfc/rfc9700.html#section-3) | MUST | deployment threat model | Account for every attacker type possible in the deployment. | BCP minimal model is not exhaustive. |
| OS01-C029 | [OS01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4) | SHOULD NOT | AS authorization page or callback response page | Avoid third-party resources and external links. | Client callback responsibility conditional on deployed client. |
| OS01-C030 | [OS01 §4.2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.2.4) | SHOULD | client state | Invalidate state after first callback use. | State use conditional. |
| OS01-C031 | [OS01 §4.3.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.3.2) | MUST NOT | OAuth clients using access tokens | Do not pass access tokens in URI query parameters. | Updates older OS10 query SHOULD NOT. |
| OS01-C032 | [OS01 §4.5.3.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.5.3.2) | MUST | confidential OIDC client relies on nonce instead of PKCE | Validate token-endpoint ID-token nonce; disregard all received tokens until this check succeeds. | Not universal AS obligation. |
| OS01-C033 | [OS01 §4.7.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.7.1) | MUST | client carries integrity-sensitive application state | Protect state against tampering/swapping. | Not a prescribed state format. |
| OS01-C034 | [OS01 §4.9.3](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.9.3) | MUST | resource server handles access token | Treat token as secret; do not store or transfer in plaintext. | No mandated storage product or cipher. |
| OS01-C035 | [OS01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2) | MUST | registered-client redirect can facilitate phishing | Authenticate owner first; prompt for credentials when needed, except silent authentication; take precautions against redirect phishing. | Existing authenticated session can satisfy owner authentication. |
| OS01-C036 | [OS01 §4.11.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.11.2) | SHOULD | automatic redirect after authorization | Automatically redirect only to trusted URI; may warn owner for untrusted URI. | Risk-based trust, not compulsory permanent allowlist in source. |
| OS01-C037 | [OS01 §4.12](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.12) | MUST NOT / SHOULD | request can contain owner credentials | Do not use 307 redirects; prefer 303 for HTTP redirection. | Broader OIDC 307 rule in OS09. |
| OS01-C038 | [OS01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13) | MUST | TLS terminated by reverse proxy | Sanitize inbound security-relevant headers to preserve their authenticity/integrity. | No optional feature mandate inferred. |
| OS01-C039 | [OS01 §4.13](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.13) | MUST | TLS terminated by reverse proxy | Protect proxy-to-app link against eavesdropping, injection and replay. | No optional feature mandate inferred. |
| OS01-C040 | [OS01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) | MUST | considering refresh-token issuance | Assess risk to decide whether a client receives refresh tokens. | Non-issuance permitted. |
| OS01-C041 | [OS01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) | MUST | refresh tokens issued | Bind refresh token to consented scope and resource servers. | Single owner does not remove consented privilege boundary. |
| OS01-C042 | [OS01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) | MUST + specified rotation mechanism | public-client refresh replay protection uses rotation | Issue replacement each refresh; invalidate previous; retain relationship; detected reuse revokes active refresh token. | Rotation is an alternative to sender constraints; no prescribed storage transaction mechanism or grace interval. |
| OS01-C043 | [OS01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) | MUST | grant identity encoded in refresh token | Ensure token-value integrity, e.g. signatures. | Only encoded-grant mechanism trigger. |
| OS01-C044 | [OS01 §4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) | MAY / SHOULD | refresh tokens | May revoke after security events; should expire after inactivity at AS-selected interval. | No fixed TTL or mandatory logout revocation in this section. |
| OS01-C045 | [OS01 §4.15.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.15.1) | SHOULD NOT; MUST alternative | client/user subject namespace can collide | Prevent client-selected IDs/claims impersonating owners; if unavoidable, let RS distinguish token types. | Client-credentials/common-namespace trigger. |
| OS01-C046 | [OS01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16) | MUST | AS interaction pages | Prevent clickjacking. | No single mandated header satisfies all contexts. |
| OS01-C047 | [OS01 §4.16](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16) | SHOULD | AS interaction pages | Use CSP level 2+ across authorization/authentication pages; permit configured framing origins and add other measures. | Legacy unsupported-user-agent boundary stated in source. |
| OS01-C048 | [OS01 §4.17.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.17.2) | MUST / MUST NOT | postMessage authorization response | Match trusted receiver origin exactly; forbid wildcard; clients verify initiator exactly; apply all §2.1 defenses. | No mandate to implement postMessage flow. |
| OS02-C001 | [OS02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2) | MUST NOT / SHOULD | registered clients | Do not treat client_id as a secret or use it alone for authentication. | No optional feature mandate inferred. |
| OS02-C002 | [OS02 §2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.2) | MUST NOT / SHOULD | registered clients | Document identifier size. | No optional feature mandate inferred. |
| OS02-C003 | [OS02 §2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.1) | SHOULD NOT | client registration | Do not assume client type without assessing credential exposure. | Client public/confidential classification not inferred from UI. |
| OS02-C004 | [OS02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3) | MUST NOT | public-client authentication | Do not rely on it to identify the client. | PKCE is not client identity authentication. |
| OS02-C005 | [OS02 §2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3) | MUST NOT | client token requests | Do not use multiple client-authentication methods in a request. | Token error mapping preserved below. |
| OS02-C006 | [OS02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1) | MUST | client passwords issued | Support HTTP Basic with form-encoded client identifier/password semantics. | No optional feature mandate inferred. |
| OS02-C007 | [OS02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1) | MUST | client passwords issued | Require TLS for password-authenticated requests. | No optional feature mandate inferred. |
| OS02-C008 | [OS02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1) | MUST | client passwords issued | Protect password-authentication endpoints against brute force. | No optional feature mandate inferred. |
| OS02-C009 | [OS02 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.1) | MUST NOT; NOT RECOMMENDED | body client credentials supported | Do not put credentials in request URI; body method discouraged and limited to clients unable to use Basic. | Body method remains permitted. |
| OS02-C010 | [OS02 §2.3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3.2) | MUST | other client-auth methods supported | Define a client registration to authentication-scheme mapping. | No requirement to support arbitrary schemes. |
| OS02-C011 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Verify owner identity before obtaining authorization grant. | No optional feature mandate inferred. |
| OS02-C012 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Use TLS; support GET; POST optional. | No optional feature mandate inferred. |
| OS02-C013 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Retain configured query parameters; forbid fragment component. | No optional feature mandate inferred. |
| OS02-C014 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Treat empty values as omitted. | No optional feature mandate inferred. |
| OS02-C015 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Ignore unknown parameters. | No optional feature mandate inferred. |
| OS02-C016 | [OS02 §3.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1) | MUST | authorization endpoint | Do not include request/response parameters more than once. | No optional feature mandate inferred. |
| OS02-C017 | [OS02 §3.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.1) | MUST | response_type absent or unsupported | Return an authorization error. | Does not require supporting every registered response type. |
| OS02-C018 | [OS02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2) | MUST | redirect URI | Require absolute URI with no fragment. | No optional feature mandate inferred. |
| OS02-C019 | [OS02 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2) | MUST | redirect URI | Retain redirect URI query parameters when adding response. | No optional feature mandate inferred. |
| OS02-C020 | [OS02 §3.1.2.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.2) | MUST; SHOULD | redirect registration | Public clients must register redirects; all-client registration/full URIs recommended. | OS01 exact-match update constrains older partial-URI flexibility. |
| OS02-C021 | [OS02 §3.1.2.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.3) | MUST | multiple registered redirects | Client supplies redirect_uri; server matches registered values. | Single registered URI can permit omission in OAuth, unlike OIDC request requirement. |
| OS02-C022 | [OS02 §3.1.2.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.4) | MUST NOT; SHOULD | missing/invalid/mismatched redirect | Do not redirect to invalid URI; inform owner. | Error must not become open redirect. |
| OS02-C023 | [OS02 §3.1.2.5](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2.5) | SHOULD NOT / MUST conditional | client callback scripts | Avoid third-party scripts; remove credentials before subsequent navigation; if scripts exist, extraction/removal scripts run first. | Client-side duty. |
| OS02-C024 | [OS02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2) | MUST | token endpoint | Require TLS and POST token requests. | No optional feature mandate inferred. |
| OS02-C025 | [OS02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2) | MUST | token endpoint | Retain configured query parameters; forbid fragments. | No optional feature mandate inferred. |
| OS02-C026 | [OS02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2) | MUST | token endpoint | Treat empty parameters as omitted. | No optional feature mandate inferred. |
| OS02-C027 | [OS02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2) | MUST | token endpoint | Ignore unknown parameters. | No optional feature mandate inferred. |
| OS02-C028 | [OS02 §3.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2) | MUST | token endpoint | Do not repeat parameters. | No optional feature mandate inferred. |
| OS02-C029 | [OS02 §3.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2.1) | MUST | confidential clients or issued client credentials | Authenticate at token endpoint. | Public client with no credential uses client_id for code binding. |
| OS02-C030 | [OS02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3) | MUST | scope absent | Use predefined scope default or reject with invalid scope. | Source permits narrower grant. |
| OS02-C031 | [OS02 §3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3) | MUST / SHOULD | scope policy | Return scope when granted differs from requested; document requirements/default. | No requirement to advertise every supported scope. |
| OS02-C032 | [OS02 §4.1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1) | REQUIRED | authorization code request | Use response_type=code and client_id, encoded as form query. | redirect/state/scope conditions elsewhere. |
| OS02-C033 | [OS02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) | MUST | code issued | Bind code to client identifier and redirect URI; expire shortly. | 10-minute maximum is RECOMMENDED, not hard MUST ceiling. |
| OS02-C034 | [OS02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) | MUST; SHOULD | code exchanged more than once | Deny reuse; revoke prior tokens where possible. | No specific database atomic primitive prescribed. |
| OS02-C035 | [OS02 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) | REQUIRED | state supplied | Echo exact state in successful authorization response. | No state creation obligation on AS. |
| OS02-C036 | [OS02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1) | MUST NOT | invalid/missing client ID or redirect URI | Do not automatically redirect on invalid client/URI. | Other errors returned to validated client redirect. |
| OS02-C037 | [OS02 §4.1.2.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2.1) | REQUIRED / syntax | authorization errors | Return error and exact state when supplied; enforce ASCII error/description and URI-reference character syntax. | error_description/error_uri optional. |
| OS02-C038 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Require grant_type=authorization_code and code. | No optional feature mandate inferred. |
| OS02-C039 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Require client_id for unauthenticated client. | No optional feature mandate inferred. |
| OS02-C040 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Require confidential/credentialed authentication; validate included client authentication. | No optional feature mandate inferred. |
| OS02-C041 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Check code belongs to authenticated client or public request client_id. | No optional feature mandate inferred. |
| OS02-C042 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Validate code. | No optional feature mandate inferred. |
| OS02-C043 | [OS02 §4.1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | MUST / REQUIRED | code token exchange | Require identical redirect_uri if it was supplied during authorization. | No optional feature mandate inferred. |
| OS02-C044 | [OS02 §4.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4) | MUST | client-credentials grant supported | Use only confidential clients; require successful client authentication. | No requirement to support client_credentials grant. |
| OS02-C045 | [OS02 §4.4.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4.3) | SHOULD NOT | client-credentials success | Do not include a refresh token. | SHOULD NOT, not unconditional MUST NOT. |
| OS02-C046 | [OS02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1) | REQUIRED / protocol binding | successful token response | Return HTTP 200 JSON object with access_token and case-insensitive token_type. | No optional feature mandate inferred. |
| OS02-C047 | [OS02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1) | REQUIRED / protocol binding | successful token response | Represent strings as JSON strings and numbers as numbers. | No optional feature mandate inferred. |
| OS02-C048 | [OS02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1) | RECOMMENDED / SHOULD | token lifetime | Return expires_in; if omitted give expiry another way or document default. | No universal token TTL. |
| OS02-C049 | [OS02 §5.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1) | MUST | any response containing sensitive data | Use Cache-Control: no-store and Pragma: no-cache. | OIDC errata examples omit Pragma; OAuth requirement remains recorded. |
| OS02-C050 | [OS02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2) | protocol binding / REQUIRED | token error | Use HTTP 400 JSON error unless specified otherwise; invalid_request for duplicates/multiple auth; invalid_grant for expired/revoked/wrong client/redirect; distinguish invalid_client, unauthorized_client, unsupported_grant_type, invalid_scope. | Description/URI optional; enum semantics preserved. |
| OS02-C051 | [OS02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2) | MUST | Authorization-header client auth fails | Return HTTP 401 and matching WWW-Authenticate scheme. | 401 otherwise MAY, not universal token-error status. |
| OS02-C052 | [OS02 §5.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-5.2) | MUST NOT / syntax | token error fields | Restrict error/description ASCII and error_uri URI-reference syntax. | Do not confuse REST resource errors with token errors. |
| OS02-C053 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Require grant_type=refresh_token and refresh_token in UTF-8 form POST. | No optional feature mandate inferred. |
| OS02-C054 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Do not expand beyond original scope; omitted scope equals original. | No optional feature mandate inferred. |
| OS02-C055 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Require authentication for credentialed/confidential client. | No optional feature mandate inferred. |
| OS02-C056 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Validate supplied client authentication and refresh client binding. | No optional feature mandate inferred. |
| OS02-C057 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Validate refresh token. | No optional feature mandate inferred. |
| OS02-C058 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST | refresh grant supported | Replacement refresh token preserves refresh scope. | No optional feature mandate inferred. |
| OS02-C059 | [OS02 §6](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | MUST / MAY | replacement refresh token issued | Client discards old token; source permits AS revocation; OS01 strengthens public-client rotation behavior. | Do not use older MAY to erase BCP replay requirement. |
| OS02-C060 | [OS02 §7](https://www.rfc-editor.org/rfc/rfc6749.html#section-7) | MUST | resource server token request | Validate token, expiry, scope covers requested resource. | No mandated introspection vs local validation method. |
| OS02-C061 | [OS02 §10.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.1) | MUST NOT / MUST | public/native client credentials | Do not issue general shared passwords to identify native/browser public clients; per-installation credential exception exists. | No optional feature mandate inferred. |
| OS02-C062 | [OS02 §10.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.1) | MUST NOT / MUST | public/native client credentials | Keep confidential-client passwords secret. | No optional feature mandate inferred. |
| OS02-C063 | [OS02 §10.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.2) | MUST; SHOULD | unauthenticated public clients | Register redirects; guard impersonation; show client/scope/lifetime and avoid automatic repeated approvals without authentication or other assurance. | Prior approval alone not proof of same public-client instance. |
| OS02-C064 | [OS02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3) | MUST | access tokens | Keep token and confidential attributes secret in transit/storage; share only with AS, valid RS and receiving client. | No optional feature mandate inferred. |
| OS02-C065 | [OS02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3) | MUST | access tokens | Transmit tokens only over authenticated TLS. | No optional feature mandate inferred. |
| OS02-C066 | [OS02 §10.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.3) | MUST | access tokens | Ensure unauthorized actors cannot generate, alter or guess valid tokens. | No optional feature mandate inferred. |
| OS02-C067 | [OS02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4) | MUST | refresh tokens | Keep secret in storage/transit and share only with AS and receiving client. | No optional feature mandate inferred. |
| OS02-C068 | [OS02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4) | MUST | refresh tokens | Maintain client binding and verify when authenticatable. | No optional feature mandate inferred. |
| OS02-C069 | [OS02 §10.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.4) | MUST | refresh tokens | Use authenticated TLS; prevent unauthorized generation/alteration/guessing. | No optional feature mandate inferred. |
| OS02-C070 | [OS02 §10.10](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.10) | MUST / SHOULD | generated credentials | Guess probability at most 2^-128, preferably at most 2^-160; protect human-use credentials by other means. | Not a blanket byte-length equivalence for all token encodings. |
| OS02-C071 | [OS02 §10.8](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.8) | SHOULD NOT | state/scope content | Avoid plaintext sensitive owner/client information. | Not a mandated encoding. |
| OS02-C072 | [OS02 §10.11](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.11) | MUST | end-user endpoints | Require TLS on all owner-interaction endpoints. | Native loopback response exception governed by OS01/OS11. |
| OS02-C073 | [OS02 §10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12) | MUST | AS authorization endpoint | Prevent CSRF and malicious authorization without owner awareness/explicit consent. | No prescribed CSRF implementation. |
| OS02-C074 | [OS02 §10.14](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.14) | MUST | external protocol values | Sanitize, and validate where possible, all received values including state and redirect_uri. | Exact-state echo must not be silently mutated. |
| OS03-C001 | [OS03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1) | syntax / SHOULD | PKCE verifier | Use 43–128 unreserved characters (ALPHA / DIGIT / - . _ ~). | No optional feature mandate inferred. |
| OS03-C002 | [OS03 §4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.1) | syntax / SHOULD | PKCE verifier | Prefer random 32-octet sequence / at least 256-bit entropy. | No optional feature mandate inferred. |
| OS03-C003 | [OS03 §4.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2) | MUST / MTI | PKCE capable client / AS | Client capable of O<code>S&#50;56</code> uses it; server implements O<code>S&#50;56</code>; calculate BASE64URL(SHA256(ASCII(verifier))) without padding. | plain compatibility is conditional, not required by user task. |
| OS03-C004 | [OS03 §4.3](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.3) | REQUIRED / default | PKCE authorization request | Include challenge; omitted challenge method defaults to plain; challenge syntax 43–128 unreserved characters. | Source default does not force new deployments to offer plain. |
| OS03-C005 | [OS03 §4.4](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4) | MUST / MUST NOT | PKCE code issuance | Bind challenge and method to code. | No optional feature mandate inferred. |
| OS03-C006 | [OS03 §4.4](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4) | MUST / MUST NOT | PKCE code issuance | Do not expose challenge in code/client requests in extractable form. | No optional feature mandate inferred. |
| OS03-C007 | [OS03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1) | MUST | PKCE required but challenge absent | Return invalid_request; explain reason as SHOULD. | PKCE policy trigger retained. |
| OS03-C008 | [OS03 §4.4.1](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.4.1) | MUST | challenge method unsupported | Return invalid_request; explain reason as SHOULD. | Do not fall back silently to another method. |
| OS03-C009 | [OS03 §4.5](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.5) | REQUIRED / MUST | PKCE exchange | Require verifier and use code-bound challenge method. | Not a free choice of method at exchange. |
| OS03-C010 | [OS03 §4.6](https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6) | MUST | verifier check | Correct match continues normal processing; mismatch returns invalid_grant. | Matching verifier does not bypass other token validation. |
| OS03-C011 | [OS03 §7.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-7.2) | MUST NOT / SHOULD NOT | PKCE clients | Do not downgrade after O<code>S&#50;56</code>; avoid plain in new implementations unless unable to support O<code>S&#50;56</code>. | Client duty and compatibility boundary. |
| OS03-C012 | [OS03 §7.2](https://www.rfc-editor.org/rfc/rfc7636.html#section-7.2) | MUST | stateless code embeds plain challenge | Encrypt so only AS can extract challenge. | Not all codes must be encrypted if server stores challenge separately. |
| OS04-C001 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | REQUIRED | AS metadata supported | Publish HTTPS issuer without query or fragment. | No optional feature mandate inferred. |
| OS04-C002 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | REQUIRED | AS metadata supported | Publish authorization_endpoint unless no supported grant uses it. | No optional feature mandate inferred. |
| OS04-C003 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | REQUIRED | AS metadata supported | Publish token_endpoint unless only implicit supported. | No optional feature mandate inferred. |
| OS04-C004 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | REQUIRED | AS metadata supported | Publish response_types_supported array. | No optional feature mandate inferred. |
| OS04-C005 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | OPTIONAL / RECOMMENDED | AS metadata supported | Scopes supported recommended, can omit some scopes; jwks/registration/revocation/introspection optional. | OAuth metadata alone does not require OIDC, JWKS, registration, revocation or introspection. |
| OS04-C006 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | defaults | AS metadata optional fields omitted | Omitted grant_types implies authorization_code+implicit; omitted token auth methods implies client_secret_basic; omitted response_modes implies query+fragment. | Omission has meaning even when field is optional. |
| OS04-C007 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | MUST | jwks_uri advertised | Use HTTPS; use on every key if both encryption/signing keys present. | JWKS optional in OAuth-only metadata. |
| OS04-C008 | [OS04 §2](https://www.rfc-editor.org/rfc/rfc8414.html#section-2) | MUST; SHOULD | JWT client auth advertised | Publish signing algorithms for token/revocation/introspection JWT auth entries; forbid none; R<code>S&#50;56</code> recommended for token auth. | Only if private_key_jwt/client_secret_jwt advertised. |
| OS04-C009 | [OS04 §2.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-2.1) | MUST / SHOULD NOT | signed AS metadata used | Sign/MAC JWT; include attesting iss; supported signed values override plain; do not nest signed_metadata. | Signed metadata optional. |
| OS04-C010 | [OS04 §3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3) | MUST | AS metadata supported | Publish JSON at HTTPS issuer-derived well-known insertion between host and path; application specifies registered suffix. | Default suffix oauth-authorization-server; multiple locations MAY. |
| OS04-C011 | [OS04 §3.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.1) | MUST | metadata retrieval | Use GET; strip terminating slash before inserting well-known prefix for path issuer. | Mounted issuer supported. |
| OS04-C012 | [OS04 §3.2](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.2) | MUST / representation | metadata response | Return 200 application/json object; arrays for multi-values; omit zero-element claims. | Other metadata claims MAY. |
| OS04-C013 | [OS04 §3.3](https://www.rfc-editor.org/rfc/rfc8414.html#section-3.3) | MUST / MUST NOT | metadata client validation | Exact issuer match to discovery input; do not use mismatched data. | Client validation does not permit AS publisher inconsistency. |
| OS04-C014 | [OS04 §4](https://www.rfc-editor.org/rfc/rfc8414.html#section-4) | MUST / MUST NOT | JSON string comparisons | Unescape JSON then compare Unicode code points exactly; do not normalize Unicode. | Issuer/path case/slash changes not normalized away. |
| OS04-C015 | [OS04 §5](https://www.rfc-editor.org/rfc/rfc8414.html#section-5) | explicit compatibility boundary | issuer has path | RFC8414 inserts well-known before path; OIDC Discovery appends it. Transitional dual publication permitted. | Do not label correct OIDC mounted path wrong merely by applying RFC8414 convention. |
| OS04-C016 | [OS04 §6.1](https://www.rfc-editor.org/rfc/rfc8414.html#section-6.1) | MUST | metadata TLS | Implement TLS and follow BCP195 guidance. | Specific TLS configuration delegated to hosting track. |
| OS05-C001 | [OS05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2) | MUST / SHOULD NOT | resource parameter used | Resource value is absolute URI without fragment. | No optional feature mandate inferred. |
| OS05-C002 | [OS05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2) | MUST / SHOULD NOT | resource parameter used | Avoid query unless use case needs it. | No optional feature mandate inferred. |
| OS05-C003 | [OS05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2) | extension allowance | multiple intended resources | resource parameter may repeat for multiple resources. | Exception to OS02 generic duplicate rule; duplicate state/code/client_id still invalid. |
| OS05-C004 | [OS05 §2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2) | SHOULD | resource-aware issuance | Audience-restrict tokens to requested resources; audience may map to a more general URI or abstract ID. | No mandatory exact resource-string = JWT aud equivalence. |
| OS05-C005 | [OS05 §2.1](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.1) | MAY / advice | resource omitted or unacceptable | Omitted resource may use default/no resource or be required by policy; reject unacceptable values using invalid_target advised. | MCP may impose stricter resource parameter rules in other track. |
| OS05-C006 | [OS05 §2.2](https://www.rfc-editor.org/rfc/rfc8707.html#section-2.2) | protocol semantics | resource at token exchange | Requested resources stay within granted resources; omission uses grant/default handling; code grant can select narrower resource; refresh can obtain restricted token from multi-resource grant. | No scope/resource escalation; distinct authorization grant and token audiences. |
| OS06-C001 | [OS06 §1.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-1.2) | definition / SHOULD NOT | PRM resource identifier | Use HTTPS URL without fragment; query discouraged with justified exception. | Not every resource identifier must be origin-only. |
| OS06-C002 | [OS06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2) | REQUIRED | protected resource metadata supported | Publish resource identifier. | authorization_servers optional under RFC itself; MCP profile may strengthen. |
| OS06-C003 | [OS06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2) | RECOMMENDED | PRM supported | Publish scopes_supported and resource_name; can omit supported scopes. | No default bearer method implied by omission. |
| OS06-C004 | [OS06 §2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2) | MUST | resource jwks/signing algorithms advertised | Use HTTPS JWKS; key use for mixed signing/encryption keys; forbid none for response signing. | PRM jwks is RS keys for signed responses, not automatically AS token verification keys. |
| OS06-C005 | [OS06 §2.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-2.1) | MUST / SHOULD | internationalized PRM values | Use untagged text as supplied without script/language assumptions; case-insensitive language tags; untagged variants recommended. | Only human-readable localization fields trigger. |
| OS06-C006 | [OS06 §2.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-2.2) | MUST / SHOULD NOT | signed PRM used | Sign/MAC JWT with iss; supported signed values override plain; avoid nested signed_metadata and preferably reject it. | Optional feature. |
| OS06-C007 | [OS06 §3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3) | MUST | PRM supported | Publish issuer/resource-derived well-known JSON, inserting prefix before resource path; profile specifies registered suffix. | Default /.well-known/oauth-protected-resource; multiple metadata locations allowed. |
| OS06-C008 | [OS06 §3.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.1) | MUST | PRM retrieval | Use GET; strip host terminating slash before prefix insertion with path/query. | Host root and mounted resource can coexist. |
| OS06-C009 | [OS06 §3.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2) | MUST | PRM response | Return 200 application/json object; arrays represent multi-values; omit zero-value parameters; ignore unknown metadata. | §2 expressly permits empty bearer_methods_supported to mean none; retain tension rather than generalize zero-value wording blindly. |
| OS06-C010 | [OS06 §3.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.3) | MUST / MUST NOT | client validates fetched PRM | Match returned resource exactly to discovery input; challenge-based retrieval matches URL client requested; do not use mismatched metadata. | Client requirement; not free alias equivalence. |
| OS06-C011 | [OS06 §3.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.3) | MUST / SHOULD | signed PRM consumed | Validate signer key belongs to issuer and signature; invalid or untrusted issuer should be error. | Only signed metadata trigger. |
| OS06-C012 | [OS06 §4](https://www.rfc-editor.org/rfc/rfc9728.html#section-4) | OPTIONAL / advice | enumerable AS/resource relationships | protected_resources AS list optional; profile use should cross-check both association lists. | No universal static trust-list mandate. |
| OS06-C013 | [OS06 §5.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-5.1) | MAY | resource discovery challenge | Return WWW-Authenticate resource_metadata URL; can combine with other schemes/parameters. | RFC itself optional; MCP stronger requirement belongs other track. |
| OS06-C014 | [OS06 §5.2](https://www.rfc-editor.org/rfc/rfc9728.html#section-5.2) | SHOULD | client receives metadata-change challenge | Fetch new metadata and validate before use. | Resource MAY announce changes any time. |
| OS06-C015 | [OS06 §6](https://www.rfc-editor.org/rfc/rfc9728.html#section-6) | MUST / MUST NOT | PRM string comparison | Unescape JSON; compare exact Unicode code points without normalization. | No URL rewrite normalization. |
| OS06-C016 | [OS06 §7.1](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.1) | MUST | PRM implementations | Support TLS and follow BCP195. | TLS details external. |
| OS06-C017 | [OS06 §7.3](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.3) | MUST | client PRM fetch | Check TLS certificate and exact resource identity. | Untrusted metadata not authoritative just because it names resource. |
| OS06-C018 | [OS06 §7.4](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.4) | SHOULD | client expects several RSs | Request audience-restricted tokens with RFC8707; AS should support audience restriction. | Not mandatory new JWT profile. |
| OS06-C019 | [OS06 §7.5](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.5) | RECOMMENDED | PRM use | Use audience restrictions and resource indicators. | BCP audience-rejection rule remains MUST. |
| OS06-C020 | [OS06 §7.6](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.6) | scope limit | AS chosen from metadata | Determining appropriate AS trust for all use cases is out of scope; application-dependent associations remain necessary. | Discovery is not complete trust policy. |
| OS06-C021 | [OS06 §7.7](https://www.rfc-editor.org/rfc/rfc9728.html#section-7.7) | SHOULD | client fetches dynamic AS/RS URLs | Take SSRF precautions, e.g. block internal IP ranges. | Client duty, not automatic accusation against fixed mounted AS. |
| OS07-C001 | [OS07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2) | MUST | DCR redirects supported | Support redirect_uris metadata; redirect-flow clients register redirects. | DCR itself optional absent profile requirement. |
| OS07-C002 | [OS07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2) | defaults / semantics | DCR fields omitted | token_endpoint_auth_method defaults client_secret_basic; grant_types defaults authorization_code; response_types defaults code; grants/response types track grant definition. | Default public-client auth=none must be expressed where applicable; do not infer all methods required. |
| OS07-C003 | [OS07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2) | MUST | DCR metadata parsing | Ignore unknown client metadata. | Known invalid metadata still error. |
| OS07-C004 | [OS07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2) | MUST | client public keys supplied | Require valid JWKS or jwks_uri; never both. | No requirement to support all JWT-auth methods. |
| OS07-C005 | [OS07 §2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2) | MUST / SHOULD | client metadata URLs present | client_uri/tos_uri/policy_uri refer to valid pages; logo_uri valid image; display informational links/logo recommended. | Do not infer URL fetching is always required/safe. |
| OS07-C006 | [OS07 §2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.1) | SHOULD | DCR grant/response relationship | Prevent clients registering inconsistent grants and response types. | No obligation to support all combinations. |
| OS07-C007 | [OS07 §2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.2) | MUST / SHOULD | localized DCR values | Untagged text kept as-is without language assumptions; case-insensitive language tags; untagged display-friendly variants recommended. | Not permission for HTML injection. |
| OS07-C008 | [OS07 §2.3](https://www.rfc-editor.org/rfc/rfc7591.html#section-2.3) | MUST / RECOMMENDED | software statement supported | Signed/MACed JWS includes iss; trusted claims override plain; R<code>S&#50;56</code> and software_id recommended. | Software statements optional. |
| OS07-C009 | [OS07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3) | MUST | DCR endpoint | Accept POST JSON; protect transport with TLS. | No requirement to accept arbitrary unbounded requests. |
| OS07-C010 | [OS07 §3](https://www.rfc-editor.org/rfc/rfc7591.html#section-3) | SHOULD / MAY | DCR access policy | Allow unauthenticated registration for openness; rate limit and initial-token restrictions permitted. | SHOULD does not erase restricted deployment policy. |
| OS07-C011 | [OS07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1) | protocol binding / REQUIRED | DCR successful response | Return 201 JSON, client_id and all registered metadata including server-provisioned values. | Server may reject/substitute requested values; granted metadata is authoritative. |
| OS07-C012 | [OS07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1) | MUST / REQUIRED | client_secret issued by DCR | Secret unique per client_id; include client_secret_expires_at (0 if no expiry). | client_secret itself optional; avoid shared secrets across instances SHOULD. |
| OS07-C013 | [OS07 §3.2.1](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.1) | MUST | software statement used in DCR | Return unmodified statement and used claims as top-level registered metadata. | Optional-feature trigger. |
| OS07-C014 | [OS07 §3.2.2](https://www.rfc-editor.org/rfc/rfc7591.html#section-3.2.2) | protocol binding / REQUIRED | DCR rejection | Return HTTP400 JSON error with invalid_redirect_uri/invalid_client_metadata/unapproved_software_statement/invalid_software_statement as applicable; unknown response members ignored. | Descriptions optional. |
| OS07-C015 | [OS07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5) | MUST | DCR redirect security | Redirect values use TLS remote sites, localhost/native local web server, or native scheme permitted by source; OS01/OS11 narrow handling. | No arbitrary HTTP remote site. |
| OS07-C016 | [OS07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5) | MUST | self-asserted metadata | Treat metadata as self-asserted unless trusted software-statement claim; assess entire request to prevent client impersonation. | Client name/logo not verified identity. |
| OS07-C017 | [OS07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5) | SHOULD | DCR display URLs | Check scheme/host relationship to redirects and validity; protect owner from malicious linked content. | No source mandate to fetch arbitrary URL without SSRF controls. |
| OS07-C018 | [OS07 §5](https://www.rfc-editor.org/rfc/rfc7591.html#section-5) | MUST / SHOULD | registration policy | Consider statement, initial access token and JSON together; suspect/reject conflicting software identity claims; avoid same secret across instances. | No requirement for software statement or initial access token. |
| OS08-C001 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | REQUIRED | OIDC Discovery supported | Publish issuer, authorization_endpoint, token_endpoint unless implicit-only, jwks_uri, response_types_supported, subject_types_supported, id_token_signing_alg_values_supported. | OAuth-only OS04 has fewer required fields. |
| OS08-C002 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST | OIDC issuer | HTTPS without query/fragment; identical to discovered issuer and ID-token iss. | Issuer includes mount path. |
| OS08-C003 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST | OIDC endpoint URLs | Authorization/token/UserInfo/JWKS/registration URLs use HTTPS when published. | Native redirects are client URI not OP endpoint URL. |
| OS08-C004 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST / NOT RECOMMENDED | OP JWKS | No private or symmetric keys; key use if mixed encryption/signing; x5c must include matching bare key; avoid same key for encryption/signing. | JWKS REQUIRED for Discovery, optional for OAuth metadata. |
| OS08-C005 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST / RECOMMENDED | OIDC scope metadata | Support openid; scopes list recommended; standard supported scopes should be advertised; may omit others. | Metadata scope list not exhaustive or permission grant. |
| OS08-C006 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST | OIDC signing metadata | Include R<code>S&#50;56</code>; none permitted only when no ID token from authorization endpoint. | OS09 §15.1 narrow none-only exception retained separately; tension requires profile review. |
| OS08-C007 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | MUST conditional | dynamic OIDC OP | Support code/id_token/id_token token responses and authorization_code/implicit grants. | Dynamic RP relationship trigger, not every OAuth server. |
| OS08-C008 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | defaults / MUST NOT | optional OIDC metadata | Defaults for omitted grants/modes/token auth match stated source; none forbidden for JWT client-auth signing. | Claims/scopes/registration/UserInfo recommended rather than all REQUIRED. |
| OS08-C009 | [OS08 §3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) | SHOULD / NOT RECOMMENDED | browser direct OIDC endpoints | Support CORS or other browser access methods on direct endpoints; authorization CORS discouraged. | OS01 updates this to MUST NOT authorization CORS. |
| OS08-C010 | [OS08 §4](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) | MUST | OIDC Discovery supported | Append /.well-known/openid-configuration to issuer after removing terminating slash; GET returns compliant JSON application/json. | Path issuer uses append rule, unlike OS04. |
| OS08-C011 | [OS08 §4.2](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse) | MUST | Discovery response | Use 200 JSON object; multi-values arrays; omit zero-element claims. | Additional claims allowed. |
| OS08-C012 | [OS08 §4.3](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation) | MUST / MUST NOT | Discovery validation | Exact issuer=input issuer=ID-token iss; abort dependent operations on validation failure and do not use invalid data. | No root-origin issuer substitution for mounted issuer. |
| OS08-C013 | [OS08 §5](https://openid.net/specs/openid-connect-discovery-1_0.html#StringOps) | MUST / MUST NOT | Discovery strings | Unescape JSON and compare code points exactly without Unicode normalization. | Applies case-sensitive metadata names/values where specified. |
| OS08-C014 | [OS08 §7.1](https://openid.net/specs/openid-connect-discovery-1_0.html#TLSRequirements) | MUST / SHOULD | Discovery TLS | TLS confidentiality/integrity and certificate validation required; BCP195 guidance recommended. | TLS version evolves; no old-version pin inferred. |
| OS08-C015 | [OS08 §2](https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery) | conditional exclusion | WebFinger issuer discovery selected | WebFinger requires TLS, defined issuer rel/link, identifier normalization and CSRF-safe web forms. | WebFinger not required for already configured issuer; full raw source retained. |
| OS09-C001 | [OS09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) | REQUIRED | ID token issued | Include iss/sub/aud/exp/iat; issuer HTTPS with no query/fragment; sub locally unique never reassigned, <=255 ASCII; aud contains receiving client_id; NumericDate exp/iat. | Single-owner does not permit subject reuse or audience bypass. |
| OS09-C002 | [OS09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) | MUST | nonce present in request | Include unchanged nonce claim; clients check equality; AS SHOULD avoid further processing. | Nonce optional in code flow, mandatory in implicit/hybrid conditions. |
| OS09-C003 | [OS09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) | REQUIRED | max_age or essential auth_time | Include authentication-time claim. | auth_time not universally required. |
| OS09-C004 | [OS09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) | MUST / MUST NOT | ID-token cryptography | Sign ID tokens; if encrypting, sign then encrypt; none allowed only code/no authorization-endpoint token and explicit registration request. | No universal encryption mandate. |
| OS09-C005 | [OS09 §2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) | SHOULD NOT | ID-token JOSE headers | Avoid x5u/x5c/jku/jwk header key references; use established discovery/registration. | No new key-fetch protocol implied. |
| OS09-C006 | [OS09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest) | REQUIRED | OIDC code authorization request | Require scope containing openid, response_type=code, client_id, exact pre-registered redirect_uri. | Unlike basic OAuth, OIDC redirect_uri request is REQUIRED. |
| OS09-C007 | [OS09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest) | MUST / behaviors | prompt parameter | none shows no UI and errors if silent auth/consent impossible; none cannot combine with other prompt; login reauthentication; consent/select_account behavior and errors when unsatisfied. | Single-account deployment can meet selection without inventing extra accounts. |
| OS09-C008 | [OS09 §3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest) | MUST | max_age request | Attempt active reauthentication if age exceeds limit; include auth_time. | max_age=0 equivalent login. |
| OS09-C009 | [OS09 §3.1.2.2](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequestValidation) | MUST | OIDC request | Validate OAuth and OIDC required fields; requested specific sub must match authenticated owner; ID-token hint must have been issued by this OP; return proper error. | Expired id_token_hint may be accepted for recent session as SHOULD; not an access token. |
| OS09-C010 | [OS09 §3.1.2.3](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates) | MUST / MUST NOT | owner authentication | Authenticate if absent or prompt=login; no interaction prompt=none; prevent CSRF/clickjacking during owner UI. | Existing owner session alone does not satisfy explicit prompt=login. |
| OS09-C011 | [OS09 §3.1.2.4](https://openid.net/specs/openid-connect-core-1_0.html#Consent) | MUST | information release | Obtain authorization decision; dialogue or valid prior/administrative consent permitted. | No universal fresh consent screen on every request. |
| OS09-C012 | [OS09 §3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError) | MUST NOT / response binding | OIDC authorization errors | Do not redirect invalid URI; validated redirects get error/state; unsupported response_mode yields HTTP400 without error parameters. | Do not assume all error cases redirect. |
| OS09-C013 | [OS09 §3.1.3.2](https://openid.net/specs/openid-connect-core-1_0.html#TokenRequestValidation) | MUST | OIDC code exchange | Authenticate as registered; validate issued client/code/redirect; verify code came from OIDC authentication request. | Source says replay check if possible, but OS02/OS01 single-use MUST still applies. |
| OS09-C014 | [OS09 §3.1.3.3](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse) | MUST | initial OIDC code token response | Return ID token and access token in JSON; token_type Bearer unless other type negotiated; no-store header. | Non-openid OAuth response need not contain ID token. |
| OS09-C015 | [OS09 §3.1.3.6](https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken) | OPTIONAL / definition | at_hash in code-flow ID token | at_hash optional; when present uses base64url left half of hash using signing algorithm hash. | Do not require c_hash/at_hash in all code token responses. |
| OS09-C016 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | MUST | RP ID-token validation | Check exact issuer. | No optional feature mandate inferred. |
| OS09-C017 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | MUST | RP ID-token validation | Check aud contains own client_id and no untrusted additional audiences. | No optional feature mandate inferred. |
| OS09-C018 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | MUST | RP ID-token validation | Check expiration. | No optional feature mandate inferred. |
| OS09-C019 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | MUST | RP ID-token validation | Check sent nonce is present and equal. | No optional feature mandate inferred. |
| OS09-C020 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | MUST | RP ID-token validation | Validate signature with issuer keys except direct token-endpoint TLS validation MAY substitute issuer validation. | No optional feature mandate inferred. |
| OS09-C021 | [OS09 §3.1.3.7](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation) | SHOULD | RP optional checks | Check nonce replay, requested acr/auth_time, negotiated encryption and algorithm. | iat age bounds client-specific; azp checks extension-dependent in errata set 2. |
| OS09-C022 | [OS09 §5.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo) | MUST | UserInfo supported | TLS; support GET and POST; accept Authorization Bearer; validate access token. | UserInfo not mandatory for all statically configured OPs; dynamic OP boundary below. |
| OS09-C023 | [OS09 §5.3.2](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse) | MUST | UserInfo responses | Return JSON sub; content type application/json or JWT as negotiated; RP verifies sub exactly matches ID token. | Claims not returned should be absent, not null/empty (SHOULD). |
| OS09-C024 | [OS09 §5.3.2](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse) | MUST | signed/encrypted UserInfo negotiated | Sign then encrypt if both; signed claims include issuer and audience matching OP/client. | No requirement to offer signed/encrypted UserInfo universally. |
| OS09-C025 | [OS09 §5.3.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoError) | binding | UserInfo errors | Follow RFC6750 error response rules. | Other REST errors need their own profile. |
| OS09-C026 | [OS09 §5.4](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) | claim-release semantics | profile/email/address/phone scope supported | Claims returned through UserInfo when access token issued; through ID token if no access token issued. | Scope request not mandatory guarantee all claims returned. |
| OS09-C027 | [OS09 §5.5](https://openid.net/specs/openid-connect-core-1_0.html#ClaimsParameter) | MUST conditional | claims parameter supported | Ignore unknown members; voluntary/essential requests generally do not force an error; specific subject request cannot authenticate another subject. | claims parameter support optional; essential acr has special §5.5.1.1 rules. |
| OS09-C028 | [OS09 §5.6](https://openid.net/specs/openid-connect-core-1_0.html#ClaimTypes) | MUST | OP claim support | Support normal claims. | Aggregated/distributed claims optional; full definitions preserved in raw. |
| OS09-C029 | [OS09 §5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability) | MUST / MUST NOT | identity linkage | sub unique and never reassigned per issuer; do not use email/phone/name as unique subject identity. | Issuer and sub together identify owner. |
| OS09-C030 | [OS09 §6.3](https://openid.net/specs/openid-connect-core-1_0.html#JWTRequests) | MUST conditional | Request Objects supported | Validate encryption/signature using registered algorithms/keys; error on failure; assemble request and validate as authorization request. | No universal Request Object support for static OP; dynamic request_uri requirement below. |
| OS09-C031 | [OS09 §8.1](https://openid.net/specs/openid-connect-core-1_0.html#PairwiseAlg) | MUST conditional | pairwise subject selected | Unique deterministic per sector; not reversible by others; sector URI redirects consistency. | Public subject type remains valid; not all OPs must be pairwise. |
| OS09-C032 | [OS09 §9](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication) | MUST conditional | JWT client authentication used | Require iss/sub/client_id, aud intended AS, unique one-use jti, expiry; correct assertion type and signature method. | No requirement to support private_key_jwt/client_secret_jwt. |
| OS09-C033 | [OS09 §10.1](https://openid.net/specs/openid-connect-core-1_0.html#Signing) | MUST / MUST NOT | OIDC signing | Choose algorithm appropriate to key; signing key usage; kid for asymmetric keys; forbid symmetric signatures for public clients. | No mandated E<code>S&#50;56</code> support. |
| OS09-C034 | [OS09 §10.1.1](https://openid.net/specs/openid-connect-core-1_0.html#RotateSigKeys) | SHOULD | signing-key rollover | Retain recent decommissioned signing public keys for a reasonable validation transition. | No fixed retention interval. |
| OS09-C035 | [OS09 §11](https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess) | MUST | offline_access requested | Obtain offline consent; prompt=consent unless valid other conditions; ignore if insufficient consent or response does not yield code; web explicit consent required, native recommended. | Refresh tokens can be issued for other contexts; offline_access optional feature. |
| OS09-C036 | [OS09 §12.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | OIDC refresh | Validate refresh token, client binding and registered authentication when applicable. | Public none auth remains public. |
| OS09-C037 | [OS09 §12.2](https://openid.net/specs/openid-connect-core-1_0.html#RefreshTokenResponse) | MUST / SHOULD | refresh emits ID token | Preserve original iss/sub/aud and auth_time; iat is new issuance; nonce preferably omitted, otherwise equals original. | Refresh response may omit id_token entirely; azp extension rules conditional. |
| OS09-C038 | [OS09 §13.1](https://openid.net/specs/openid-connect-core-1_0.html#QuerySerialization) | SHOULD | OIDC query serialization | Omit absent/empty parameters rather than empty strings. | OAuth processing still treats empty as absent. |
| OS09-C039 | [OS09 §14](https://openid.net/specs/openid-connect-core-1_0.html#StringOps) | MUST / MUST NOT | OIDC string processing | Unescape and compare code points without Unicode normalization; space (0x20) separates list values. | Exact claim/issuer semantics preserved. |
| OS09-C040 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support R<code>S&#50;56</code> signing except narrowly described code-only none-only registration case. | No optional feature mandate inferred. |
| OS09-C041 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support prompt, including none and login behavior. | No optional feature mandate inferred. |
| OS09-C042 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support display at least without error. | No optional feature mandate inferred. |
| OS09-C043 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support ui_locales and claims_locales at least without error. | No optional feature mandate inferred. |
| OS09-C044 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support auth_time when requested. | No optional feature mandate inferred. |
| OS09-C045 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support max_age enforcement. | No optional feature mandate inferred. |
| OS09-C046 | [OS09 §15.1](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | all OIDC OPs | Support acr_values at least without error. | No optional feature mandate inferred. |
| OS09-C047 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Support code/id_token/id_token token response types for non-self-issued OP. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C048 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Support OIDC Discovery. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C049 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Support OIDC Dynamic Client Registration. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C050 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Support UserInfo when issuing access tokens. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C051 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Publish bare JWK public keys. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C052 | [OS09 §15.2](https://openid.net/specs/openid-connect-core-1_0.html) | MUST | dynamic OP establishes RP relationship without preconfiguration | Support request_uri Request Object retrieval. | Dynamic OIDC obligations cannot be silently inferred from OAuth DCR support alone; single owner does not exempt a truly dynamic OP. OIDC Registration specification not inspected within budget. |
| OS09-C053 | [OS09 §15.3](https://openid.net/specs/openid-connect-core-1_0.html) | explicit boundary | preconfigured OP/RP relationship | Dynamic discovery and registration may be unnecessary. | Publishing OIDC metadata alone does not prove dynamic profile. |
| OS09-C054 | [OS09 §16.12](https://openid.net/specs/openid-connect-core-1_0.html#TimingAttack) | SHOULD | cryptographic validation | Avoid early exit on invalid octet to reduce timing side channels. | No prescribed crypto library; applies cryptographic processing context. |
| OS09-C055 | [OS09 §16.15](https://openid.net/specs/openid-connect-core-1_0.html#IssuerIdentifier) | MUST / RECOMMENDED | issuer identity | Discovery issuer exactly equals ID-token iss; path is issuer identity; single issuer per host recommended but multiple permitted. | Mounted issuer not prohibited. |
| OS09-C056 | [OS09 §16.17](https://openid.net/specs/openid-connect-core-1_0.html#TLSRequirements) | MUST / SHOULD | OIDC TLS | Support TLS confidentiality/integrity and certificate checking; follow BCP195 guidance. | Hosting responsibilities separate. |
| OS09-C057 | [OS09 §16.18](https://openid.net/specs/openid-connect-core-1_0.html#TokenLifetime) | SHOULD | access/refresh lifetimes | Prefer short or single-use access tokens; identify long grants; provide owner token-revocation mechanism. | RFC7009 endpoint not thereby unconditionally mandated. |
| OS09-C058 | [OS09 §16.19](https://openid.net/specs/openid-connect-core-1_0.html#SymmetricKeyEntropy) | MUST | symmetric algorithms use client_secret | Ensure entropy and minimum key octets for MAC; H<code>S&#50;56</code> at least 32 octets. | Public-client symmetric signing forbidden elsewhere. |
| OS09-C059 | [OS09 §16.22](https://openid.net/specs/openid-connect-core-1_0.html) | MUST NOT | OP redirect to client | Do not use HTTP307 to redirect to Redirection URI; 303 preferable. | Broader than OS01 credentials-present trigger. |
| OS09-C060 | [OS09 §17.2](https://openid.net/specs/openid-connect-core-1_0.html#AccessMonitoring) | SHOULD | UserInfo privacy access | Make UserInfo access logs available to owner. | Privacy consideration, not central OAuth endpoint wire contract. |
| OS10-C001 | [OS10 §2](https://www.rfc-editor.org/rfc/rfc6750.html#section-2) | MUST NOT | bearer resource request | Do not use more than one bearer-token transmission method per request. | No obligation to support body/query methods. |
| OS10-C002 | [OS10 §2.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.1) | MUST / SHOULD | bearer RS/client | RS supports Authorization Bearer; client should use it. | Bearer grammar includes one or more spaces and b64token syntax. |
| OS10-C003 | [OS10 §2.2](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.2) | MUST NOT conditional | body bearer method offered | Only form-encoded single-part ASCII body with method having body semantics; never GET; encode access_token properly. | Optional support; application/json body not this method. |
| OS10-C004 | [OS10 §2.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-2.3) | SHOULD NOT / updated MUST NOT | query bearer usage | Avoid query token due logging risk; OS01 now forbids clients using query tokens. | Do not claim RFC6750 requires query support. |
| OS10-C005 | [OS10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3) | MUST | missing or insufficient bearer credentials | Return WWW-Authenticate Bearer challenge with auth params. | Missing authentication should not include error code (SHOULD NOT). |
| OS10-C006 | [OS10 §3](https://www.rfc-editor.org/rfc/rfc6750.html#section-3) | MUST NOT / grammar | bearer challenge | Do not repeat realm/scope/error/error_description/error_uri; honor character syntax for scope/errors/URI. | scope/error_description/error_uri optional. |
| OS10-C007 | [OS10 §3.1](https://www.rfc-editor.org/rfc/rfc6750.html#section-3.1) | SHOULD | bearer resource errors | invalid_request=>400; invalid_token=>401; insufficient_scope=>403; expose reason when supplied token fails. | Status strength is SHOULD here; MCP may strengthen. |
| OS10-C008 | [OS10 §5.2](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.2) | MUST | bearer transport/storage | Implement TLS and certificate validation; protect tokens on TLS termination backends; do not store tokens in cookies sent in clear. | No mandatory HTTP-only cookie auth for bearer API. |
| OS10-C009 | [OS10 §5.3](https://www.rfc-editor.org/rfc/rfc6750.html#section-5.3) | SHOULD | bearer issuance | Limit token lifetime, especially browser tokens; scope to recipients. | Illustrative <=1h is recommendation context, no mandatory universal TTL. |
| OS11-C001 | [OS11 §6](https://www.rfc-editor.org/rfc/rfc8252.html#section-6) | MUST | native public code clients | Native clients and AS use PKCE; support native redirect options described in §7. | Native clients may choose permitted redirect option; generic web clients do not gain loopback exception. |
| OS11-C002 | [OS11 §7.1](https://www.rfc-editor.org/rfc/rfc8252.html#section-7.1) | MUST / SHOULD | native private URI scheme | Use reverse-domain scheme under app control; AS should enforce/reject no-dot schemes. | Not every custom URI scheme automatically valid. |
| OS11-C003 | [OS11 §7.3](https://www.rfc-editor.org/rfc/rfc8252.html#section-7.3) | MUST | native loopback IP redirects | AS permits any request-time port for registered loopback IP redirect; exact scheme/host/path still required. | Native ephemeral port exception, not wildcard host/path. |
| OS11-C004 | [OS11 §8.1](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.1) | SHOULD | native authorization lacking PKCE | AS rejects with invalid_request. | OS01 strengthens public client PKCE MUST; preserve distinct source strengths. |
| OS11-C005 | [OS11 §8.3](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.3) | NOT RECOMMENDED | native localhost redirect | Prefer loopback IP literal over localhost. | localhost not categorically prohibited by source. |
| OS11-C006 | [OS11 §8.4](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.4) | MUST | native client registration | Register as public unless per-instance secret creates confidentiality; AS records type and full redirect incl path; reject mismatch except loopback port. | Claimed HTTPS app links not evidence of confidential client. |
| OS11-C007 | [OS11 §8.5](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.5) | MUST | native client has distributed shared static secret | Treat as public; do not accept secret as identity proof. | Per-instance credential exception is separate. |
| OS11-C008 | [OS11 §8.6](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.6) | SHOULD NOT | native repeated authorization | No automatic approval without proven client identity; previous public client_id consent alone insufficient. | Owner single-user session does not prove client identity. |
| OS11-C009 | [OS11 §8.12](https://www.rfc-editor.org/rfc/rfc8252.html#section-8.12) | MUST NOT / MAY | native authorization user agent | Native clients do not use embedded user agents; AS may detect/block them. | No mandatory browser detection on AS. |
| OS12-C001 | [OS12 §Conformance Testing](https://openid.net/certification/) | official program description | implementation conformance testing | Free tests are available to anyone for mature stable standards/profiles; developers can assess interoperability and implemented security features. | No test run performed here; no proof candidate passes. |
| OS12-C002 | [OS12 §Certification](https://openid.net/certification/) | official program description | certification claim or ecosystem requirement | Self-certification is a separate process allowing certification mark after completion; certification may be ecosystem prerequisite. | No unconditional OAuth/OIDC requirement to certify; overview did not inspect individual plan coverage/test IDs. |

### Contrary evidence and boundaries retained

1. Mounted discovery is supported. OS04 §5 explicitly distinguishes prefix-insertion OAuth metadata from issuer-appended OIDC metadata. OS09 §16.15 gives issuer paths identity meaning. A mount does not itself prove a mismatch.
2. Replay wording has changed or differs across specifications. OS02 code reuse rejection is MUST and prior-token revocation SHOULD; OS09 “if possible” replay-check wording does not erase OAuth single-use rules. OS02 refresh rotation is optional in the foundation; OS01 requires rotation or sender constraints for public refresh tokens and describes active-token revocation on reuse.
3. Duplicate handling has an extension boundary: generic OS02 parameter repetition is forbidden, token repeats map invalid_request, but OS05 resource values may legitimately repeat. No generic “reject every repeated parameter” rule fits all extensions.
4. Public redirect flexibility is narrow: native loopback ports may vary, but path/host matching remains exact. Public clients cannot be treated as confidential solely because a static secret is present. Native private schemes and loopback options remain available within OS11 rules.
5. OIDC and OAuth metadata differ in required fields. OAuth AS metadata does not itself impose OIDC subject types, ID tokens, JWKS or R<code>S&#50;56</code>. OIDC Discovery does. OIDC nonce/at_hash/auth_time are conditional, not all universally mandatory.
6. Dynamic OIDC is a profile boundary: Core §15.2 duties turn on relationships with RPs without preconfiguration. DCR in a generic OAuth server is not alone proof that every OIDC dynamic feature is applicable. A single owner does not itself settle that boundary. Dynamic OIDC’s older implicit-support duties and current BCP advice to avoid access-token response flows are both retained for downstream profile reconciliation.
7. OS06 recommends discovery-time audience/resource use and warns that general AS trust selection remains out of scope. Metadata publication is not full trust policy; optional AS/resource association arrays do not become required lists.
8. OS06 §2 permits an empty bearer_methods_supported array to mean no bearer support while §3.2 directs omission of zero-value parameters. Preserve field-specific definition; do not flatten it into an unconditional empty-array test.
9. OIDC errata set 2 limits azp to extension contexts and changes refresh nonce guidance. Assertions that every multiaudience ID token always needs azp or every refreshed ID token repeats nonce need separate source justification.
10. Conformance testing is available; certification is separate and ecosystem-dependent. An overview page cannot support claims about individual test-plan coverage, exhaustive security, or this mounted implementation’s passing status.

### Coverage and control record

| Coverage cell | Status | Evidence / remaining limit |
|---|---|---|
| OAuth wire bindings / parsing / duplicate parameters | supported | OS02/OS03/OS05/OS10; extension exceptions retained |
| Code/refresh replay / client binding | supported | OS01/OS02/OS03/OS09; no storage concurrency mechanism inferred |
| Mounted discovery / issuer / audience | supported | OS04/OS05/OS06/OS08/OS09; actual mount config not inspected |
| OIDC metadata / ID-token / owner interaction | supported, conditional | OS08/OS09; static vs dynamic OP applicability unresolved without candidate audit |
| Dynamic registration | supported, conditional | OS07; full OIDC Registration spec beyond budget |
| Bearer REST/MCP resources | supported at OAuth layer | OS02/OS10/OS06; MCP profile separate source track |
| Library 1.7.7 configuration / storage / concurrency | unsearched in this track | Assigned package/runtime track; protocol sources prescribe outcomes, not D1 atomic primitives |
| Reverse proxies / credential secrecy / clickjacking | supported at protocol level | OS01/OS02/OS09; platform controls separate |
| Independent testing / certification | thin | OS12 official program overview inspected; no individual plan/source or test execution |
| JWT access-token profile / revocation / introspection / DPoP details | unsearched | Referenced specs RFC9068/7009/7662/9449 not opened within 12-source cap; no inferred full requirements |

Scope control: frozen brief read before source inspection; no candidate reads. Source floor: direct RFC Editor and OIDF pages; full RFC/OIDC texts saved. Search route: direct supplied canonical standards; an official testing URL failed by redirect, then canonical certification overview used. English institutional primary sources intentionally dominate; retrieval does not establish ecosystem prevalence. Foundational RFCs retained with current RFC9700 update, and OIDC errata set 2 retained rather than older memory.

Conflict control: targeted passes over mount-convention compatibility, refresh/code replay normative-strength changes, native/public redirects, extension duplicate exception, optional/dynamic OIDC implementation considerations and errata boundaries. These passes added boundaries, so no saturation claim is made. Source concentration reflects standards authority, not independent experimental corroboration.

Access control: sandbox download lacked network DNS; narrowly scoped escalation fetched only public source documents to this temp directory. No credential files or sockets used. Initial https://openid.net/certification/testing/ redirected to calendar content; its saved bytes are a failed route, excluded from the load-bearing source count. OS12 remains a full source URL plus inspected-section pointer; no individual OIDF test code was inspected.

Stop condition: **12 opened load-bearing source cap**, not two no-new-mechanism passes. Last additions were official conformance-program boundaries and native-client redirect/public classification exceptions. This is a bounded orientation, not exhaustive protocol certification or a formal systematic review. Unmeasured remainder includes implementation applicability, other extension normative texts, errata beyond the published OIDC set, individual official test plans, live certification deployment constraints, concurrency race proof and all actual candidate behavior.

Chief artifact risk: a dense ledger can be mistaken for a complete compliance checklist or can flatten conditional client duties into AS requirements. The trigger/exclusion columns and raw source files must travel with every later audit. No recommended changes or pass/fail findings are produced here.

### Handoff and rescanning index

- `oauth-raw/rfc*.txt`: full RFC primary texts, retain pagination and source headings.
- `oauth-raw/oidc-core.html`, `oidc-discovery.html`: full OIDC source HTML including exact section anchors; `*-compact.txt` are derived text for term rescans, not independent sources.
- `oauth-raw/oidf-certification-pointer.txt`: official conformance overview URL and inspected-section pointer; failed testing/calendar HTML excluded.
- Claim IDs resolve by source inventory and section; rows preserve linked subclauses. Rescan raw full source for conditional optional features once implementation scope is known.
- Candidate/oracle audit remains unperformed; applicability triggers require explicit downstream disposition rather than deletion of inconvenient optional/contrary records.


## Appendix M — preserved source track


## MCP source track

### Survey brief

The frozen brief is `/private/tmp/blygger-auth-audit/brief.md`. This track inspected official public MCP sources only. It did not read the candidate, run its tests, inspect its production code, recommend changes, or measure deployed behavior. Foundational OAuth/OIDC requirements are reserved to the other standards track. The source budget is 12 opened load-bearing sources, plus two navigation-only roots. This is orientation for a loss audit, not certification or a penetration test.

### Orientation

Current published MCP is 2026-07-28, directly identified by the official versioning page [MS1](#m-s1). Older stateful revisions remain separate compatibility targets. Current MCP embeds draft OAuth 2.1 and Client ID Metadata Documents references [MS2](#m-s2); that does not make those drafts published RFCs. Authorization-server implementation is partly outside MCP's own conformance boundary [MS11](#m-s11).

### Terms and distinctions

- `MUST`, `MUST NOT`, `SHOULD`, `MAY`: preserve source strength; uppercase in this inventory reports the source's wording.
- `AS`: authorization server. `RS`: protected MCP resource server. `C`: MCP client. `P`: MCP proxy to a third-party API. `O`: operator/testing tool.
- `conditional`: applies only if that role, feature, or protocol revision exists. Role labels do not assert Blygger has that role.
- Each item below is a primary-record requirement, descriptive implementation fact, or first-party security advice. Item IDs are stable and ordered by source, not importance. Section links resolve to the named source; line ranges refer to inspected web-rendered text and are supplementary, not immutable source coordinates.
- Testing inference rule: each normative item permits positive and negative protocol checks; each conditional item first needs a role/feature applicability check. These are audit ideas inferred from source requirements, not source-mandated test counts. No candidate disposition is implied.

### Evidence landscape

#### MS1 version and publication boundary

[MS1 section: Revisions](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning#revisions), lines 25–54.

| ID | Type/strength | Role | Preserved item |
| --- | --- | --- | --- |
| M001 | primary/version fact | all | Current=2026-07-28; Draft=in-progress; Final=past/frozen; current can receive compatible updates. |
| M002 | MAY | C/RS | Multiple protocol versions can coexist; select/accept each request independently. |
| M003 | primary/protocol fact | C/RS | Current requests declare body protocol version and HTTP mirror; unsupported-version response lists supported versions. |
| M004 | primary/boundary | C/RS | Handshake-based 2025-11-25 and earlier are distinct compatibility targets. |

#### MS2 authorization core

[MS2](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), section pointers below. Lines 44–85, 99–116, 128–172, 182–272.

| ID | Strength | Role | Item and section |
| --- | --- | --- | --- |
| M005 | OPTIONAL/SHOULD | HTTP | Authorization optional; supported HTTP implementations SHOULD conform. #protocol-requirements |
| M006 | MUST | AS | OAuth2.1 security for public/confidential clients. #overview |
| M007 | MUST | RS/AS | PRM; AS offers OAuth metadata or OIDC discovery. #overview |
| M008 | SHOULD | RS | Scope challenge. #scope-selection-strategy |
| M009 | MUST | C | Challenge authoritative; no assumed relationship to metadata scope set. #scope-selection-strategy |
| M010 | SHOULD | C | Initial challenge scopes, else metadata scopes; least privilege. #scope-selection-strategy |
| M011 | MUST/SHOULD | C/AS | Record validated issuer with verifier/state; AS SHOULD emit iss, MUST advertise when emitted. #authorization-response-validation |
| M012 | MUST | C | Issuer validation matrix, exact comparison after decoding; reject advertised-but-missing iss and mismatches, including error responses. #authorization-response-validation |
| M013 | MUST | C | Resource in authorization/token requests, canonical MCP URI regardless AS support. #resource-parameter-implementation |
| M014 | SHOULD | C | Specific canonical resource; scheme/host robustness, consistent slash. #canonical-server-uri |
| M015 | MUST/MUST NOT | C | Bearer header every request; no query token. #token-requirements |
| M016 | MUST | RS | Validate intended audience; invalid/expired=401; no foreign tokens. #token-handling |
| M017 | MUST/SHOULD | C/RS | Confidential refresh storage; refresh metadata; avoid resource offline_access challenges. #refresh-tokens |
| M018 | MUST | RS | Appropriate 401/403/400. #error-handling |
| M019 | SHOULD | RS | Precise complete operation scope challenge, consistent strategy. #runtime-insufficient-scope-errors |
| M020 | SHOULD/MUST | C/RS | Step-up limits/scope union; RS MUST account for hierarchy. #step-up-authorization-flow |

The table is a section-preserving index. Rescan all sentences in each linked section for subordinate conditions, rather than treating these compact rows as replacement specification text.

#### MS3 security-best-practices conditional mechanisms

[MS3](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices). Dense sections are preserved as clause pointers to support independent rescans. These rows name each distinct clause; strength is inherited only from its enclosing source list. Exact-prose rescan coordinates: M021–M042 lines154–181; M043–M048 lines257–287; M049–M052 lines320–322; M053–M060 lines427–442; M061 lines543–549; M062–M067 lines581–600. M043 is MUST; M044–M047 are SHOULD; M048 is advice. M049–M050 are MUST; M051–M052 are SHOULD. M057–M059 are SHOULD; M060 is advice. Number ranges denote separate stable clause IDs, not a single indivisible requirement.

| IDs | Strength | Role | Section/clauses retained |
| --- | --- | --- | --- |
| M021–M023 | MUST | P | #mitigation: approved client registry per user; check before upstream flow; secure consent storage. |
| M024–M028 | MUST | P | Same section: client name; API scopes; redirect URI; CSRF; anti-framing. |
| M029–M032 | MUST | P/cookies | Host prefix; Secure/HttpOnly/Lax; signing/session; client binding. |
| M033–M035 | MUST | P | Exact redirect; reject changed URI; no wildcard. |
| M036–M042 | MUST | P | Random state; store after consent; set before upstream redirect; callback match; reject missing/mismatch; single-use/expiry; never pre-consent state cookie. |
| M043–M048 | MUST/SHOULD/advice | C-server/AS-CIMD | #server-side-request-forgery-ssrf: mitigation; HTTPS; private/reserved IP block; redirects; egress; DNS TOCTOU. |
| M049–M052 | MUST/SHOULD | RS-handles | #state-handle-hijacking: every-request verification; handle not auth; random handles; principal binding. |
| M053–M056 | MUST | C | #oauth-authorization-url-validation: schemes; no shell; URL parsing/sanitization; shell-sensitive character rejection. |
| M057–M060 | SHOULD/advice | C | Same section: allowlist; native opener; CSP; suspicious-URL monitoring. |
| M061 | advice | AS-CIMD | #cimd-trust-policies: domain policy/host display. |
| M062–M067 | advice | RS/C/AS | #scope-minimization: baseline; step-up; downscope; precise challenge; correlated elevation log; denied-loop cache. |

Scope exclusions retained: local binary install/sandbox and stdio process proxy protections, sections #local-mcp-server-compromise and #stdio-transport-security-in-proxy-scenarios, are tool/local-client conditional; they are not Worker AS obligations. Proxy confused-deputy requirements depend on static upstream client identity plus dynamic downstream registration and upstream consent cookies.

#### MS4 mounted discovery and AS binding

[MS4 sections](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-location), lines 30–62.

| ID | Strength | Role | Preserved item |
| --- | --- | --- | --- |
| M068 | MUST | RS | PRM authorization_servers has at least one AS. |
| M069 | MUST/MUST NOT | C | Separate credentials/tokens by issuing AS; no cross-AS assumption. |
| M070 | MUST | RS | Offer challenge resource_metadata OR well-known PRM. |
| M071 | MUST | C | Support both; challenge wins, else path-specific PRM then root. #protected-resource-metadata-discovery-requirements |
| M072 | MUST | C | Mounted issuer discovery order: host/.well-known/oauth-authorization-server/path; host/.well-known/openid-configuration/path; issuer/.well-known/openid-configuration. #authorization-server-metadata-discovery |
| M073 | MUST | C | Root issuer: OAuth metadata then root OIDC. Same section. |
| M074 | MUST/MUST NOT | C | Metadata issuer identical to discovery issuer; reject mismatches. Same section. |

Mount examples are specification examples, not an assertion about any Blygger mount. A client requirement to attempt three paths does not mean an AS must serve all three.

#### MS5 registration alternatives and CIMD

[MS5](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration), lines 25–60, 100–135.

| ID | Strength | Role | Preserved item/section |
| --- | --- | --- | --- |
| M075 | SHOULD | C | Priority: pre-registration, supported CIMD, supported DCR, user credentials. Intro. |
| M076 | SHOULD | C/AS | CIMD support. #client-id-metadata-documents |
| M077 | MUST | C-CIMD | HTTPS client URL with path; client_id/name/redirect_uris; ID equals document URL. #implementation-requirements |
| M078 | MUST | AS-CIMD | Exact fetched ID; JSON/required fields; validate requested redirect. Same section. |
| M079 | SHOULD | AS-CIMD | Fetch URL-form ID; honor cache headers; security considerations. Same section. |
| M080 | MAY | C-CIMD | private_key_jwt with JWKS. Same section. |
| M081 | SHOULD | C | Static credential option. #pre-registration |
| M082 | deprecated/MAY | C/AS | DCR remains allowed compatibility mechanism. #dynamic-client-registration |
| M083 | MUST/SHOULD | C-DCR | Appropriate application_type; native/web guidance; handle redirect rejection and meaningful error. #application-type-and-redirect-uri-constraints |
| M084 | MUST/MUST NOT | C | Persist credential issuer binding; changed AS requires re-registration; no cross-AS reuse. #authorization-server-binding |
| M085 | SHOULD/fact | C | Mismatched pre-registration error; CIMD identifiers portable, no re-registration. Same section. |

#### MS6 normative authorization security

[MS6](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations), lines 25–124.

| ID | Strength | Role | Preserved item/section |
| --- | --- | --- | --- |
| M086 | MUST | C/RS | Secure token storage; OAuth2.1 security. #token-theft |
| M087 | SHOULD | AS | Short-lived access tokens. Same section. |
| M088 | MUST | AS-public | Refresh rotation. Same section. |
| M089 | MUST | AS | HTTPS endpoints; localhost-or-HTTPS redirects. #communication-security |
| M090 | MUST | C | PKCE, verify support before flow, SHA-256 challenge when capable. #authorization-code-protection |
| M091 | MUST | AS-OIDC/C | OIDC metadata advertises challenge methods; C refuses absent field in either discovery style. Same section. |
| M092 | MUST | AS/C | Registered exact redirect validation. #open-redirection |
| M093 | SHOULD | C | State verification; discard missing/mismatch. Same section. |
| M094 | MUST/SHOULD/MAY | AS | Precautions for untrusted redirect; trust before automatic redirect; user warning allowed. Same section. |
| M095 | MUST/SHOULD | AS-CIMD | Consider draft section6 security; SHOULD consider SSRF. #client-id-metadata-document-security |
| M096 | SHOULD/MAY/MUST | AS-CIMD | Localhost warning; optional attestation; MUST display redirect hostname. #localhost-redirect-uri-risks |
| M097 | MAY | AS-CIMD | Domain trust policies. #trust-policies |
| M098 | MUST | P-static | Per-client consent before third-party authorization. #confused-deputy-problem |
| M099 | MUST/MUST NOT | RS | Validate before processing/returning data; audience binding; separate upstream token; no passthrough. #access-token-privilege-restriction |

#### MS7 current Streamable HTTP

[MS7](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), lines 25–82, 94–112, 117–123, 188–197, 253–339, 344–377.

| ID | Strength | Role | Preserved item/section |
| --- | --- | --- | --- |
| M100 | MUST | RS | Single POST endpoint. Intro. |
| M101 | MUST | RS | Validate Origin; invalid present Origin=403. #security--endpoint |
| M102 | SHOULD | local/RS | Localhost bind; authenticate connections. Same section. |
| M103 | MUST | C/RS | New POST per single request/notification; Accept JSON+SSE; 202 empty notifications; JSON-or-SSE response. #sending-messages |
| M104 | MUST/SHOULD | RS | Related notifications only; no independent server requests; final response SHOULD close. #receiving-messages |
| M105 | SHOULD/advice | RS | No-buffer header; keepalive comments; no resumption. Same section. |
| M106 | MUST/SHOULD | RS | Disconnect=cancellation; stop soon; no further messages. #cancellation |
| M107 | MUST | C/RS | Version header/body match; unknown-version 400 supported list; method-not-found 404/-32601. #protocol-version-header |
| M108 | MUST | C/RS | Required Method/Name; safe encoding/decoded comparisons. #standard-request-headers |
| M109 | conditional MUST | schema/C | x-mcp-header syntax/type/path/uniqueness; reject invalid tool. #schema-extension |
| M110 | MUST | C/RS | Encoding, sentinel ambiguity, omitted/null values, invalid-character and mismatch rejection. #value-encoding |
| M111 | MUST/SHOULD | RS/intermediary | 400/-32020 validation; numerical integers; intermediaries verify validation-capable version. #server-validation |
| M112 | SHOULD | compatibility | Inspect modern errors before legacy fallback; modern-only GET/DELETE405, ignore session/resumption headers. #backward-compatibility |

#### MS8 Inspector tooling

[MS8](https://github.com/modelcontextprotocol/inspector#readme), lines 189–210, 245–249.

| ID | Type | Role | Item |
| --- | --- | --- | --- |
| M113 | descriptive/tool | O | Web inspection, scriptable CLI for CI, TUI share package; no claim they prove AS conformance. |
| M114 | security boundary | O | Secrets go to OS keychain when available; fallback secrets file can be unencrypted absent supplied key. |
| M115 | version boundary | O | Main is released v2; v1 is security-fix line. |
| M116 | pointer | O | README links testing/quality guide; not separately inspected within budget. |

#### MS9 SDK advisory index: leads, not affected-version proof

[MS9](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories), lines 148–178. Every item is an official advisory-index fact. Individual advisories were NOT opened. Affected-version ranges, fixes, and whether 2.3.0 is affected remain unmeasured.

| ID | Publication | Lead/source section URL |
| --- | --- | --- |
| M117 | 2026-09-30 | [Credential sent to server-selected AS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6qxp-vccf-f47h) |
| M118 | 2026-10-02 | [Experimental task/session binding](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-22jm-h49p-29qw) |
| M119 | 2026-10-02 | [Cross-origin redirects resend headers/bodies](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6prh-2h8m-c8cw) |
| M120 | 2026-02-04 | [Shared server/transport response leakage](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7) |
| M121 | 2026-01-07 | [UriTemplate ReDoS](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-cqwc-fm46-7fff) |
| M122 | 2025-12-02 | [Localhost DNS protection default](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-w48q-cv73-mx4w) |

#### MS10 Inspector failure case

[MS10](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-7f8r-222p-6f5g#description), lines 133–148.

M123 — Primary advisory: Inspector <0.14.1 allowed unauthenticated proxy requests to launch stdio commands (RCE); patched 0.14.1. Applies to test tooling, not by itself the protected Worker. It supplies a bounded failed case for the proposition that test tools are harmless.

#### MS11 official conformance boundary

[MS11](https://github.com/modelcontextprotocol/conformance#conformance-requirements), inspected lines 186–246, 249–345, 392–451.

| ID | Type | Role | Item |
| --- | --- | --- | --- |
| M124 | testing/tool | C/RS | Independent wire capture and scenario checks; client/server modes are separate. |
| M125 | testing/tool | O | --requirements revision freezes release requirements; --suite/--spec-version selects evolving suites. |
| M126 | boundary | AS | Requirement sets deliberately omit AS scenarios; MCP AS implementation is beyond own role scope. |
| M127 | testing/tool | O | not_scored: extension, added-after-release, pending reference fixture; reports still show them. |
| M128 | testing/tool | O | Baseline failure remains requirement failure even if CI exit0; stale baseline pass exits1. |
| M129 | testing/tool | O | Per-check baseline narrower than whole scenario; repeated IDs collapse; skipped checks differ from reached checks. |
| M130 | testing/tool | O | List scenarios; auth/client metadata/DCR examples; test exact SDK ref and each mode. |
| M131 | limit/conflict | O | README still calls 2026-07-28 “draft” in lifecycle prose while release/versioning sources identify current; do not use that stale label to redefine publication status. |

#### MS12 pinned SDK release behavior

[MS12](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0#upgrade-notes), released Oct2; v2.3.0, commit a202a36; inspected lines 167–193.

| ID | Type | Role | Item |
| --- | --- | --- | --- |
| M132 | implementation guidance | RS | One server/transport per request; already-connected Server.connect rejects. |
| M133 | implementation fact | C | Default redirect policy stays same-origin; same-host HTTP→HTTPS allowed; follow opt-in weakens boundary. Browser redirects otherwise fail. |
| M134 | implementation fact | RS | maxToolInputElements and expectedResource are opt-in/off by default; verifier must support audience check. |
| M135 | version boundary | packages | Server/client/core2.3.0; node2.1.1; express/hono2.0.2; fastify2.0.1. SDK2.3.0 does not imply every adapter2.3.0. |
| M136 | implementation guidance | C | eventsource-parser>=3.0.8, large SSE performance fix. |
| M137 | implementation fact | origins | Origin helper accepts scheme wildcard; presence of helper is not proof of configured origin policy. |
| M138 | implementation fact | C | Legacy SSEClientTransport 401 refresh limited once. |

### Positions and mechanisms

Authorization alternatives, stateless/current transport, legacy compatibility, origin checks, and token audience checks are separate mechanisms. CIMD and DCR have different fetch/registration surfaces [MS5](#m-s5). Proxy consent is an architecture-specific case, not a universal requirement to display third-party API consent [MS3](#m-s3). An SDK option can supply a check while leaving it off by default [MS12](#m-s12).

### Disputes and conflicting evidence

- Publication labels conflict: MS1 directly says current2026-07-28; MS11 retains draft wording in a lifecycle paragraph. Treat this as documentation staleness requiring version-specific records, not proof of an unreleased protocol.
- Optional DCR/CIMD and client fallback do not require all AS registration modes. Likewise clients' multiple discovery probes do not require AS to host every probe URL.
- PKCE is not enough for issuer mix-up; MS3 #mix-up-attacks states verifier disclosure to attacker token endpoint remains possible. MS2 issuer mitigation depends on validated issuer and AS emission; lack of advertised iss permits absent iss in the matrix.
- CIMD proves domain document control, not identity of a localhost listener [MS3 #localhost-redirect-uri-impersonation].
- “Stateless” protocol does not erase application handles, their ownership, or request-local streaming state [MS3 #state-handle-hijacking; MS7 #receiving-messages].
- “Tests pass” is narrower than all scenarios passed when baselines or not_scored entries exist [MS11].

### Cases and timeline

MS10 is a 2025 testing-proxy failure. MS9 lists 2025–2026 SDK failures, including events inside the four days before the cutoff. MS12 is a pinned Oct2 release. Current spec source URLs retain their version identifier but current pages can change compatibly; no archive snapshot hash was captured. No post-cutoff draft was used as a requirement.

### Coverage and gaps

| Coverage cell | Status | Sources | Gap |
| --- | --- | --- | --- |
| Mounted discovery/issuer | supported | MS2,MS4 | RFC/OIDC exact rules belong to standards track |
| PKCE/registration | supported | MS5,MS6 | CIMD draft section6 not independently opened |
| Audience/no passthrough | supported | MS2,MS6,MS12 | Verifier and deployed configuration unmeasured |
| Origin/DNS/headers | supported | MS7,MS12 | Framework helper defaults and runtime proxy topology unmeasured |
| Stateless/streaming/compatibility | supported | MS1,MS7 | Older revision full text not opened |
| SSRF/client metadata | supported | MS3,MS5,MS6 | Exact pinned draft and egress implementation unmeasured |
| Consent/confused deputy | supported/conditional | MS3,MS6 | Candidate proxy role unassessed |
| Tooling/conformance | supported/limited | MS8,MS10,MS11 | Conformance scenarios source and Inspector testing guide not opened |
| SDK advisory affected ranges | thin | MS9 | Index only; individual advisories not read |
| Production endurance/rate limits | thin | MS7,MS12 | No load test specification or operational thresholds established |

### Claim-to-source ledger

Every M-ID is linked through its source block; source block defines evidence type and exact page/section. M001–M004→MS1; M005–M020→MS2; M021–M067→MS3; M068–M074→MS4; M075–M085→MS5; M086–M099→MS6; M100–M112→MS7; M113–M116→MS8; M117–M122→MS9; M123→MS10; M124–M131→MS11; M132–M138→MS12. Confidence is solid about inspected source text, conditional about applicability; no confidence claim about code compliance.

| Claim | Kind | Support | Confidence | Limit |
| --- | --- | --- | --- | --- |
| C1 | primary record | MS1 | solid | Current mutable page |
| C2 | primary record | MS2 | solid | Role/feature conditional |
| C3 | primary record/advice | MS3 | solid | Clause pointers need exact-prose rescan |
| C4 | primary record | MS4 | solid | Client versus AS roles differ |
| C5 | primary record | MS5 | solid | Draft referenced separately |
| C6 | primary record | MS6 | solid | Conditional proxy/CIMD features |
| C7 | primary record | MS7 | solid | Current transport, separate legacy scope |
| C8 | primary tool record | MS8 | solid | No certification inference |
| C9 | primary advisory index | MS9 | solid | Affected ranges not read |
| C10 | primary advisory | MS10 | solid | Inspector only |
| C11 | primary tool record | MS11 | solid | Mutable suite; stale draft wording |
| C12 | primary release record | MS12 | solid | Pinned release, not configured behavior |

### Sources

#### Primary and official

- <a id="m-s1"></a>**MS1** — [Versioning](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning), MCP; retrieved cutoff2026-10-04; current page, publication date not shown.
- <a id="m-s2"></a>**MS2** — [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), MCP2026-07-28; current normative revision.
- <a id="m-s3"></a>**MS3** — [Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), MCP2026-07-28 tutorials; combines uppercase requirements and advice.
- <a id="m-s4"></a>**MS4** — [Authorization Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery), MCP2026-07-28.
- <a id="m-s5"></a>**MS5** — [Client Registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration), MCP2026-07-28.
- <a id="m-s6"></a>**MS6** — [Authorization Security Considerations](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations), MCP2026-07-28.
- <a id="m-s7"></a>**MS7** — [Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), MCP2026-07-28.
- <a id="m-s8"></a>**MS8** — [Inspector README](https://github.com/modelcontextprotocol/inspector), official main; retrieved cutoff2026-10-04; mutable release-line docs.
- <a id="m-s9"></a>**MS9** — [TypeScript SDK advisory index](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories), official; Sep30/Oct2 cutoff advisories and older records; affected versions uninspected.
- <a id="m-s10"></a>**MS10** — [GHSA-7f8r-222p-6f5g](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-7f8r-222p-6f5g), Inspector official advisory, Jun13,2025.
- <a id="m-s11"></a>**MS11** — [Conformance README](https://github.com/modelcontextprotocol/conformance), official main; retrieved cutoff2026-10-04; evolving tool docs, with explicitly noted stale draft wording.
- <a id="m-s12"></a>**MS12** — [SDK2.3.0 release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0), official Oct2,2026; tag v2.3.0, a202a36.

Navigation-only reads excluded from the 12 load-bearing count: transports overview and SDK repository root. Search snippets, including July28 release blog and spec-planning future matrices, were leads only and support no ledger claim.

### Search and control record

- **Search routes:** web primary-domain queries for current auth/version, security SSRF/CIMD, Inspector/testing, conformance, SDK2.3.0; official section-link traversal; direct GitHub source/advisory/release opens.
- **Source-class coverage:** Official primary specifications, official developer/testing guidance, release record, and first-party advisories only; no scholarly or independent empirical assessment was used.
- Source floor: every load-bearing record opened; key long pages reread by section. Index-only advisory boundary explicit. Source extracts kept as typed clauses and named exact-section pointers, not full article copies.
- **Prominence counter-search:** moved beyond general auth overview into discovery, registration, security clauses, release notes, advisory index, conformance scoring/baselines. Publisher diversity intentionally limited by official-only task; records are not independent empirical replications.
- **Contrary-evidence search:** explicit advisory retrieval; default-off audience option; mutable suite versus frozen requirement set; scored-versus-baselined distinction; stale draft label; PKCE mix-up limit; localhost impersonation and SSRF; legacy transport contrast.
- **Recency check:** current version confirmed directly; pinned package release retained; prior advisory dates preserved; no speculative future version obligations.
- **Saturation check:** 12 opened load-bearing-source budget fired. Two no-new-mechanism passes did NOT fire; final additions included conformance scoring limits and pinned SDK optional audience/input-limit behavior. Do not claim saturation.

### Limits and unmeasured

Chief artifact risk: official docs and terse clause inventories can look complete while omitted subordinate conditions or mutable source pages hide boundaries. Several numbered ranges preserve distinct clauses by name and source list order; separate rescans must recover the exact prose, conditions, and strength before candidate adjudication. Web line coordinates can shift. No cryptographic source snapshot was captured.

Not measured: implementation compliance, proxy role, library defaults at package-source level, advisory affected ranges, historical revision full clauses, actual browser/client compatibility, runtime SSRF behavior, auth-server conformance suite coverage, concurrency/endurance/availability thresholds, real production denial or consent flows. Some test design follows by inference from normative clauses; it is not a prescribed certification suite.

### Handoff index

Source-order M001–M138 provides a recovery inventory. MS2/MS4 cover discovery and token binding; MS3/MS6 cover security and conditional proxy/metadata controls; MS7 covers transport/version differences; MS8–MS12 cover tooling, failure leads, and package/version limits. Preserve each item and source section through later loss audits. No later instrument was run in this track.


## Appendix H — preserved source track


## Auth hardening source track

### Survey brief

The exact question and downstream use are in the front matter. This is the hardening track of the frozen brief at `/private/tmp/blygger-auth-audit/brief.md`. It excludes application audit, edits, recommendations, deployment, certification, multi-user federation and billing. Starting sources were Better Auth/OAuth Provider configuration, first-party advisories, Cloudflare runtime guidance and OWASP testing guidance. Only English sources were searched. Twelve distinct load-bearing official web documents were inspected. One old OWASP route failed and its replacement was found. A separately authorized local package-artifact check anchored selected mechanisms to version 1.7.7; it did not read candidate application files.

### Orientation

Configuration and storage determine whether published library protections reach a deployment. H01–H12 preserve that boundary. H13–H16 preserve a patched concurrency failure and D1 transaction scope. H17–H23 separate database consistency, platform limits and import compatibility. H24–H32 preserve OWASP test and logging advice. P01–P04 tie selected rolling claims to local package artifacts.

### Terms and distinctions

- **Vendor requirement** means an API/configuration condition or vendor imperative. It is not an RFC MUST merely because the prose says “must.”
- **OWASP advice/test** means official testing or operational guidance, not a protocol conformance rule.
- **Runtime contract** means documented platform behavior/limits; account plan and compatibility date qualify applicability.
- **Patched advisory** describes affected historical versions. Its mechanism can inform tests; it does not establish a bug in 1.7.7.
- **Package artifact** is inspected published dependency code and metadata, distinct from candidate application evidence.

### Evidence landscape

#### HS01 — OAuth Provider configuration

- **H01 (vendor behavior):** DCR needs `allowDynamicClientRegistration`; anonymous registration additionally needs `allowUnauthenticatedClientRegistration`. Applies only when registration is enabled. Pointer: Dynamic Registration Endpoint / Setup.
- **H02 (vendor behavior):** Protected registration accepts an out-of-band initial access token through `validateInitialAccessToken`; undefined validator rejects Bearer registration. Pointer: Registration.
- **H03 (vendor behavior):** Endpoint counters are per-IP/per-endpoint and depend on global rate limiting. Register defaults to 5/60s, token 20/60s; endpoint `false` falls back to global limits. Pointer: Rate Limiting.
- **H04 (vendor behavior):** Opaque access-token revocation deletes its row but leaves same-grant refresh token valid. Self-contained JWTs cannot be deleted; valid JWT revoke returns `unsupported_token_type`. Pointer: Revoke Endpoint.
- **H05 (vendor setup requirement):** Generate/apply plugin schema; client assertions use a primary-key replay tombstone for concurrent rejection. Pointer: Migrate the Database / OAuth Client Assertion.
- **H06 (vendor behavior):** Client-secret rotation immediately invalidates the previous secret. Pointer: Rotate Client Secret.

#### HS02 — Shared rate-limit storage and trusted IPs

- **H07 (vendor behavior):** Memory is the default; documentation warns it may be unsuitable for serverless use. Database, secondary or custom storage exist. Database storage needs a rate-limit table; Drizzle/Prisma use generated schema and ORM migrations rather than Kysely migration. Pointer: Storage.
- **H08 (vendor API requirement):** `customStorage.consume` checks/increments atomically; separate get/set are not accepted because stale counters permit concurrent passes. Pointer: Custom Storage.
- **H09 (vendor boundary):** Client HTTP requests are limited; server-side `auth.api` calls are not. Production enables default limiting, development disables it. Pointer: introduction.
- **H10 (vendor deployment advice):** Single proxy-set IP headers or trusted proxy chains must be sanitized; chain interpretation cannot verify the direct sender. IPv6 addresses normalize and default to /64 limits. Pointer: Connecting IP Address / IPv6.

#### HS03 — Cookies, origin and proxy trust

- **H11 (vendor behavior/advice):** HTTPS cookies default to Secure, HttpOnly and SameSite=Lax; host-only cookies are the default. CSRF and origin checks are distinct flags; `disableOriginCheck` also disables CSRF checks for compatibility. Production trusted origins should exclude localhost. Pointer: Cookies / Disabling Security Checks / Trusted Origins.
- **H12 (vendor deployment requirement):** Trusted forwarded Host/Proto may derive base URLs only when static/environment base URLs are absent. End users must not forge those headers. Static config wins; request-origin fallback exists. Purpose-specific key upgrades break pending state/proxy flows even if old secret remains; coordinate cutover and restart such flows. Pointer: Trusted Proxy Headers / Secret Rotation.

#### HS04 — Explicit URL and versioned secrets

- **H33 (vendor advice):** Explicit `baseURL` avoids request inference; a path in it overrides `basePath`. Dynamic allowed hosts are distinct deployment support, with forwarded headers ignored unless trusted. Pointer: baseURL / basePath.
- **H34 (vendor behavior):** Dynamic hosts/fallback origins join trusted origins; fallback can hide proxy errors. Cookie Secure also depends on protocol/environment and may be overridden. Pointer: Dynamic Base URL.
- **H35 (vendor API behavior):** Production requires a secret. Versioned `secrets` uses the first key for new encryption and old keys for decryption; singular secret is legacy same-purpose fallback. This is not evidence of JWT-signing key rotation. Pointer: secret / secrets.

#### HS05 — Historical concurrent code redemption

- **H13 (primary advisory):** GHSA-7w99-5wm4-3g79 affects standalone provider >=1.6.0,<1.6.11 and named older embedded/legacy variants; patched 1.6.11. Pinned 1.7.7 is outside that standalone range.
- **H14 (primary advisory mechanism):** Read-then-delete permitted parallel requests to mint multiple token sets. Fix atomically consumes verification and rejects competing code use with `invalid_grant`. Distributed workaround tracking must be shared. Pointer: Summary / Patches / Technical details.

#### HS06 — D1 transaction scope

- **H15 (runtime contract):** D1 auto-commits. Prepared-statement `batch()` executes statements in sequence and rolls the sequence back if a statement fails. This contract does not cover arbitrary read/await/write application sequences. Pointer: batch().
- **H16 (runtime boundary):** Without Sessions API, binding queries continue on primary even if replication is enabled. Pointer: withSession / Guidance.

#### HS07 — D1 limits and overload

- **H17 (runtime contract):** D1 per-database query processing is single-threaded; throughput depends on query duration. Concurrent requests queue; full queue yields overloaded error. Replicas have their own instance limits. Pointer: Concurrency and throughput.
- **H18 (runtime contract/advice):** Per invocation D1 limits are 50 queries free/1000 paid; six simultaneous connections; 100 bound parameters/query, 2MB row, 30s query. Indexes reduce query work. Operations count against Worker CPU/memory. Time Travel retention is 7 days free/30 paid. Pointer: limits table / FAQ.

#### HS08 — D1 replica consistency

- **H19 (runtime contract):** Replicas may lag arbitrarily. Sessions ensure sequential consistency; unconstrained first read may be stale, first-primary starts current, bookmarks carry a lower bound into subsequent sessions. Pointer: Use Sessions API / Start a session.
- **H20 (scope limit/inference):** Sequential consistency alone does not establish that an application-level credential consume is atomic; HS05 and HS06 describe a separate mechanism. Applicability of replication depends on API use, per H16.

#### HS09 — Node compatibility

- **H21 (runtime contract):** Node APIs include full, partial and stub/polyfilled implementations. Imported modules may call no-op or throwing methods. Import success alone does not show runtime compatibility. Pointer: Supported Node.js APIs / Node.js API Polyfills.
- **H22 (versioned runtime contract):** Compatibility dates 2024-09-23 through 2026-08-03 opt in with `nodejs_compat`; >=2026-08-04 enables compatibility by default. Date/flags qualify claims; no deployment configuration was inspected. Pointer: Get Started.

#### HS10 — Worker operational limits

- **H23 (runtime contract):** Memory is 128MB per isolate, shared by concurrent requests. Free CPU is 10ms; paid defaults to 30s and can rise to 5min. Six outgoing connections/request, free daily request cap 100,000; no general request/second ceiling. Startup limit 1s, bundle cap 64MiB uncompressed. Pointer: limits table / Memory / CPU / Daily requests / Worker startup.
- **H36 (vendor advice):** Documented dry-run bundle measurement and CPU profiling can expose deployment/runtime limits. Move costly global initialization to handler/build time; streaming limits memory pressure. Pointer: Worker size / startup / Memory. These are vendor diagnostics, not OAuth requirements.

#### HS11 — OWASP AS testing

- **H24 (OWASP test):** Modify redirect URI and test filter bypasses; attempt code injection across client, resource owner and redirect, plus code replay. Pointer: Insufficient Redirect URI Validation / Authorization Code Injection.
- **H25 (OWASP test):** Omit/empty/forge challenges; omit/empty/use wrong-code verifier. Check consent anti-CSRF values and iframe clickjacking. Pointer: PKCE Downgrade / Consent Page CSRF / Clickjacking.
- **H26 (OWASP test/advice):** Replay access tokens after time intervals; replay refresh tokens, then test invalidation of latest descendants after reuse. Suggested access lifetimes are sensitivity-dependent (example 5–15min), not a universal MUST. Pointer: Token Lifetime.
- **H27 (scope boundary):** Multiple-owner injection is useful guidance but the candidate is single-owner; no claim of current multi-user behavior follows. OWASP's example status codes and request shapes are test illustrations, not exact OAuth response or JSON-encoding requirements.

#### HS12 — OWASP logging

- **H28 (OWASP advice):** Log authentication success/failure, authorization/session failures and relevant errors; record enough when/where/who/what. Event detail should fit risk, avoiding blind checklists. Pointer: Which events to log / Event attributes.
- **H29 (OWASP advice):** Exclude raw session IDs, access tokens, passwords, encryption keys and primary secrets; hash session identifiers where correlation is needed. Pointer: Data to exclude.
- **H30 (OWASP advice):** Sanitize CR/LF/delimiters and encode event output; logging failure should not leak data or stop other application work. Pointer: Event collection.
- **H31 (OWASP test):** Test injection, resource depletion, logging failures, log access controls and adverse user-blocking effects. Pointer: Verification.
- **H32 (scope limit/inference):** Header/body/error logging needs evaluation because it can carry sensitive values. H29 does not establish a specific Cloudflare logging leak or universal requirement to collect request bodies.

### Positions and mechanisms

No independent adversarial measurement of Blygger was performed. The mechanisms are preserved in their source scopes: shared/atomic storage (H07–H10), trusted URL/origin/cookie controls (H11–H12,H33–H35), atomic credential consumption (H13–H16), sequential replica reads (H19), runtime failure constraints (H17–H23,H36), and OWASP test procedures (H24–H32).

### Disputes and conflicting evidence

- HS01 / H04 differs from session revocation: a standalone signature check can keep accepting a JWT whose user session ended. P03 narrows introspection/UserInfo behavior to session-bound tokens; it does not claim every resource verifier checks session liveness.
- H16 limits broad “D1 replication causes stale auth reads” claims: ordinary binding queries remain primary. H19's lag mechanism applies to Sessions/replica usage.
- H21 limits “Node compatibility means all Node code works.” Stub imports can succeed and fail when called.
- H07's serverless warning does not establish that constructing auth per request resets counters: P01 finds module-level memory. Process/isolate scope and cross-isolate sharing remain distinct.
- No unresolved independent conflict was found in these bounded routes. Vendor docs and package implementations are not independent confirmation.

### Cases and timeline

HS05 was published 2026-05-31 and reports patch 1.6.11. P00 confirms package metadata at 1.7.7. HS09 distinguishes compatibility behavior before/after 2026-08-04. Other Better Auth pages are rolling documentation without pinned publication dates.

### Claim-to-source ledger

All H IDs occur once above and link by their section to the corresponding S ID. H20,H27,H32 are explicit bounded inferences/scope qualifications; all remaining H IDs are primary official guidance or records. Confidence is solid for the quoted scope of the inspected publication, plausible for version applicability where not separately package-anchored. None is a candidate finding. P IDs below are package artifact facts, not full adapter verification.

| Claim alias | Track ID | Kind | Support | Confidence | Limit |
| --- | --- | --- | --- | --- | --- |
| C1 | H01 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C2 | H02 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C3 | H03 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C4 | H04 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C5 | H05 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C6 | H06 | official guidance | HS01 | solid within source scope | See individual applicability boundary above |
| C7 | H07 | official guidance | HS02 | solid within source scope | See individual applicability boundary above |
| C8 | H08 | official guidance | HS02 | solid within source scope | See individual applicability boundary above |
| C9 | H09 | official guidance | HS02 | solid within source scope | See individual applicability boundary above |
| C10 | H10 | official guidance | HS02 | solid within source scope | See individual applicability boundary above |
| C11 | H11 | official guidance | HS03 | solid within source scope | See individual applicability boundary above |
| C12 | H12 | official guidance | HS03 | solid within source scope | See individual applicability boundary above |
| C13 | H13 | primary advisory | HS05 | solid within source scope | See individual applicability boundary above |
| C14 | H14 | primary advisory | HS05 | solid within source scope | See individual applicability boundary above |
| C15 | H15 | official guidance | HS06 | solid within source scope | See individual applicability boundary above |
| C16 | H16 | official guidance | HS06 | solid within source scope | See individual applicability boundary above |
| C17 | H17 | official guidance | HS07 | solid within source scope | See individual applicability boundary above |
| C18 | H18 | official guidance | HS07 | solid within source scope | See individual applicability boundary above |
| C19 | H19 | official guidance | HS08 | solid within source scope | See individual applicability boundary above |
| C20 | H20 | inference | HS08 | solid within source scope | See individual applicability boundary above |
| C21 | H21 | official guidance | HS09 | solid within source scope | See individual applicability boundary above |
| C22 | H22 | official guidance | HS09 | solid within source scope | See individual applicability boundary above |
| C23 | H23 | official guidance | HS10 | solid within source scope | See individual applicability boundary above |
| C24 | H24 | official guidance | HS11 | solid within source scope | See individual applicability boundary above |
| C25 | H25 | official guidance | HS11 | solid within source scope | See individual applicability boundary above |
| C26 | H26 | official guidance | HS11 | solid within source scope | See individual applicability boundary above |
| C27 | H27 | inference | HS11 | solid within source scope | See individual applicability boundary above |
| C28 | H28 | official guidance | HS12 | solid within source scope | See individual applicability boundary above |
| C29 | H29 | official guidance | HS12 | solid within source scope | See individual applicability boundary above |
| C30 | H30 | official guidance | HS12 | solid within source scope | See individual applicability boundary above |
| C31 | H31 | official guidance | HS12 | solid within source scope | See individual applicability boundary above |
| C32 | H32 | inference | HS12 | solid within source scope | See individual applicability boundary above |
| C33 | H33 | official guidance | HS04 | solid within source scope | See individual applicability boundary above |
| C34 | H34 | official guidance | HS04 | solid within source scope | See individual applicability boundary above |
| C35 | H35 | official guidance | HS04 | solid within source scope | See individual applicability boundary above |
| C36 | H36 | official guidance | HS10 | solid within source scope | See individual applicability boundary above |

### Sources

#### Primary and official

Stable IDs follow first successful open order, except HS11 retains its initially attempted source slot. All web sources were retrieved 2026-10-04. No publication date is inferred from crawl date.

- <a id="h-s01"></a>**HS01** — [OAuth 2.1 Provider](https://better-auth.com/docs/plugins/oauth-provider), Better Auth, rolling, date unstated. H01–H06. P02/P03/P04 anchor selected mechanisms only.
- <a id="h-s02"></a>**HS02** — [Rate Limit](https://better-auth.com/docs/concepts/rate-limit), Better Auth, rolling, date unstated. H07–H10. P01 anchors memory and consume mechanics.
- <a id="h-s03"></a>**HS03** — [Security](https://better-auth.com/docs/reference/security), Better Auth, rolling, date unstated. H11–H12. Unverified against full pinned source.
- <a id="h-s04"></a>**HS04** — [Options](https://better-auth.com/docs/reference/options), Better Auth, rolling, date unstated. H33–H35. Unverified against full pinned source.
- <a id="h-s05"></a>**HS05** — [GHSA-7w99-5wm4-3g79](https://github.com/better-auth/better-auth/security/advisories/GHSA-7w99-5wm4-3g79), Better Auth maintainers, 2026-05-31; affected/patched ranges above. H13–H14.
- <a id="h-s06"></a>**HS06** — [D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/), Cloudflare, rolling, date unstated. H15–H16.
- <a id="h-s07"></a>**HS07** — [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/), Cloudflare, last updated 2026-04-21. H17–H18. Limits differ by plan and may change.
- <a id="h-s08"></a>**HS08** — [Global read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/), Cloudflare, rolling, date unstated. H19–H20.
- <a id="h-s09"></a>**HS09** — [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/), Cloudflare, rolling, compatibility dates scoped above. H21–H22.
- <a id="h-s10"></a>**HS10** — [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), Cloudflare, rolling, date unstated. H23,H36. Plan/date/limits settings matter.
- <a id="h-s11"></a>**HS11** — [OAuth Authorization Server Weaknesses](https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/05-Authorization/05.1-OAuth_Authorization_Server_Weaknesses/), OWASP WSTG latest, mutable, date unstated. H24–H27. Former Authorization_Testing path failed/redirected; this replacement was inspected.
- <a id="h-s12"></a>**HS12** — [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), OWASP, rolling, date unstated. H28–H32. Advice, not OAuth protocol normative language.

#### Primary package artifacts

Root: `/Users/kylemathews/programs/blygger-studio/.worktrees/codex-oauth-mcp/node_modules`. No candidate application file was read.

- **P00:** `better-auth/package.json:3` and `@better-auth/oauth-provider/package.json:3` each state version 1.7.7.
- **P01:** `better-auth/dist/api/rate-limiter/index.mjs:6` declares a module-level Map. Lines 197–235 select custom consume, require `secondaryStorage.increment`, use module memory or database storage. Lines 289–305 consume in request phase. SHA256 `3fc6abfc752b6333bee53adc22f466c888bfca2ab111a3c9e9e552456fd691ef`. Thus a new auth factory alone is not evidence of a new memory counter; no persistence across isolates is established.
- **P02:** `@better-auth/oauth-provider/dist/authorize-K1WHCNih.mjs:1729` permits registration with session, authorized initial token or anonymous option; line 4206 defaults anonymous option false. SHA256 `f9b43268c16d249a0070df732c4eef59e8b773cba5eae84903ce2623b86eb1f7`.
- **P03:** Same artifact lines 3420–3459 documents/codes valid JWT revoke rejection; its comment says session-bound `sid` tokens are cut off by introspection/UserInfo session-liveness checks. This anchor does not prove any external resource verifier uses those checks.
- **P04:** `@better-auth/oauth-provider/dist/introspect-CNR06Oy3.mjs:1895` calls `internalAdapter.consumeVerificationValue` for authorization code; absence rejects `invalid_grant`. SHA256 `8ac1b5ee30680f2f3d311eef2fb0f575178634c2de84245df07d399d11da74fa`. Underlying adapter atomics were not traced in this survey.

### Coverage and gaps

| Cell | Status | Sources | Limit |
| --- | --- | --- | --- |
| Rate limits / Worker factory / shared storage | supported | HS02,P01 | No application storage selection; database atomic implementation not traced |
| Anonymous DCR abuse boundary | supported | HS01,HS02,P02 | No observed flood or registration storage footprint |
| Cookie / session / origin / Host / proxy | supported | HS03,HS04 | Rolling docs, pinned configuration details not fully traced |
| Secrets and key rotation | thin | HS03,HS04 | Encryption rotation supported; JWT signing-key lifecycle and Cloudflare secret deployment not inspected |
| Concurrent exchanges / migrations | thin | HS01,HS05,HS06,P04 | Patched code consume anchored; full D1 adapter/refresh rotation/migration sequencing not inspected |
| D1 writes / overload / replicas | supported | HS06–HS08 | No measured load; free daily rows-written/pricing not opened |
| Logging / redaction | supported | HS12 | No candidate logs or Cloudflare log settings read |
| JWT revocation semantics | supported | HS01,P03 | External resource validation remains unmeasured |
| Bundling / nodecompat / runtime limits | supported | HS09,HS10 | No build/deployed smoke test or platform account plan inspected |
| Official test guidance | supported | HS11,HS12 | No execution, conformance suite or full ASVS mapping |
| Other Better Auth advisories | thin | HS05 | Search surfaced other advisories; only one opened due budget |

### Search and control record

- **Search routes:** web index queries restricted by intent to Better Auth/GitHub maintainers, Cloudflare docs and OWASP. Families covered rate-limit/serverless/shared storage, anonymous registration, proxy/baseURL, key rotation, concurrent token redemption, D1 transactions/limits/replicas, Node stub APIs and OWASP OAuth/log tests. Direct official documentation was opened before use.
- **Prominence counter-search:** ignored third-party wrappers/blogs/Reddit as evidence; searched first-party advisory mechanisms and runtime failures instead of relying on product overviews.
- **Contrary-evidence search:** targeted `OAuth provider 1.7.7 race`, concurrent redemption advisory, stale replica boundaries, rate-limit `consume`, throwing Node polyfills, Worker isolate memory failure and logging failures. It added atomic consume, primary-only binding boundary and import-stub distinction.
- **Source-class coverage:** three official publishers; first-party advisory, vendor reference and OWASP procedural advice. No scholarly/independent penetration report included. This is appropriate to the source scope but cannot establish deployment safety.
- **Recency check:** current rolling pages separated from dated advisory and pinned local 1.7.7 package facts. No patched vulnerability is presented as a current candidate bug.
- **Saturation check:** **12 opened load-bearing official web sources budget reached**. Saturation was not claimed; the final failure pass still added material boundaries. Extra local package artifacts were inspected only after explicit parent authorization and are reported separately.

### Limits and unmeasured

The chief artifact risk is mistaking rolling, self-described vendor protections for tested 1.7.7 deployment behavior. No recommendation, compliance verdict or finding follows from this inventory. Unmeasured: complete advisory index, all pinned source options, JWT key retention/rotation, secret bindings, migrations/recovery operations, daily D1 write quota, production cache/log behavior, adapter atomics, load and abuse behavior. Twelve sources provide a bounded handoff, not an exhaustive security checklist.

### Handoff index

H01–H36 preserve individual source-scoped items for loss accounting. P00–P04 preserve version and narrow package anchors. Every section names a source URL and rescan heading. Coverage and gaps preserve the unopened residue. This index does not select or run another instrument.
