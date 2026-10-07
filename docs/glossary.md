# Project glossary

Use these terms for the same concepts in production code, tests and docs. Reuse a term without importing production logic into an independent model. When a model combines or splits a production concept, explain the mapping beside the model.

The [oracle-writing guide](oracle-tests.md) describes how to keep contracts, models and observations together. [Client access](client-access.md) defines the selected auth policy. The [auth oracle map](auth-oracles.md) and [security oracle map](auth-security-oracles.md) state test coverage and limits. Definitions here name the current contract; they do not add new policy.

## Content and deployment

| Term | Meaning |
| --- | --- |
| Item | The stored content resource. Its authored kind is fragment or thread; a withdrawn item can expose `kind: withdrawn`. |
| Authored kind | Fragment or thread identity, distinct from the withdrawn marker in item/version projections. The lifecycle oracle compares the API’s `authored_kind` without treating withdrawal as an authored kind change. |
| Fragment | An item with its own content. It can be quoted by a thread. |
| Thread | An item that can include transclusions of other content. |
| Transclusion | An embedded quoted snapshot with a source identity and version. It does not silently track later source edits. |
| Draft | Item content that has not been published as the current public version. Editing a published item can produce draft changes. |
| Working copy | The current editable item content, distinct from its published version snapshots. |
| Dirty | The API flag that working content needs publication. It is distinct from the browser having an unacknowledged edit. |
| Withdrawal | Publishing a withdrawn snapshot to remove the current public content while keeping published history and pins. |
| Version | A numbered published content snapshot. It is distinct from the current editable item. |
| Pin | A public reference to a fixed version. Later edits do not replace that snapshot. |
| Generated-content provenance | Claims about generated content, also called generation provenance in recorded checkpoints. This is distinct from model generation or credential version. |
| Provenance | Client-supplied claims about generated content and its sources. Alignment checks do not prove that a claim is true. |
| TK span | A marked generated-content region. Provenance entries align with these regions in content order. |
| Mount | The configured public path prefix, such as `/blyg`. An empty mount places the public app at the domain root. |
| Studio path | The owner UI path: `{mount}/studio`. REST remains at `/api`; MCP and auth routes sit under the Studio path. |
| Worker isolate | One Cloudflare Worker runtime instance. Local process state is not shared with another isolate. |
| D1 | The SQL store shared by Worker instances. Test fixtures use local D1; they do not establish production access controls. |
| R2 | The object store for media. SQL metadata and stored bytes are separate observations. |

## Identity and authority

| Term | Meaning |
| --- | --- |
| Owner | The single account that controls this installation. A delegated client acts with part of the owner's authority. |
| Client | An application that requests or uses delegated access. Its registration is not an approval to access private data. |
| Client registration | The provider record for client identity, callbacks and authentication metadata. One registered client can receive several distinct grants. |
| Owner session | The browser's authenticated owner context. The legacy Studio cookie and the native provider session are distinct credentials joined by the owner bridge. |
| Owner-password reset | Changing `OWNER_PASSWORD`. Existing owner sessions lose access. Delegated access and refresh credentials keep their scopes and deadlines until expiry or explicit revocation. |
| Owner bridge (owner-session bridge) | Server-side conversion of a verified Studio owner session into the native provider context. Recreating it is not a new password authentication. |
| Authentication time | When the owner proved their identity. OIDC `auth_time` and `max_age` concern this event, not a wrapper's session creation time. |
| Consent | The owner's approval or denial of requested client authority. The browser-bound consent handle is single-use and expires. |
| Grant / authorization | In Blygger, one approved delegation record with scopes, resource and deadline. The API calls it an authorization. Several records can belong to one client. OAuth’s formal authorization grant is a credential representing authorization, such as a code; it is not this database record. |
| Grant family | Blygger’s related access and refresh credentials keyed by one `grantId`. Its tombstone denies that grant. This differs from the native provider’s broader refresh family. |
| Native refresh family | Better Auth1.7.7 groups refresh rows by client and user. Detected reuse deletes that group and related access rows. Its cleanup can affect refresh credentials from another Blygger grant for the same client/owner. |
| Scope | One explicitly granted capability: `owner:read`, `owner:draft`, `owner:publish` or `owner:manage`. These scopes do not imply each other. An operation can require more than one. |
| Resource | The intended protected endpoint, identified by its absolute URL. REST API and MCP are separate resources. |
| Audience | The token claim that binds it to its intended receiver. A client audience in an ID token is different from a resource audience in an access token. |
| Issuer | The authorization server identity, here the origin plus `{mount}/studio/auth`. It is not taken from an untrusted forwarded host. |
| Bearer credential | A credential whose possession permits its use. It must remain secret; a valid signature alone does not establish current authority. |
| Access token | A credential presented to a protected resource. The selected OAuth profile uses signed JWTs with one-hour expiry, further bounded by grant validity. |
| Manual token | An owner-created access credential with a fixed thirty-day lifetime and no refresh token. It is not the owner password or session cookie. |
| Refresh token | An opaque credential used at the token endpoint to renew access within an existing grant. It cannot authorize an API read by itself. |
| ID token | An OIDC statement about owner authentication for the client. It is not an API or MCP access credential. |
| Authorization code | A short-lived, single-use intermediate credential bound to the client, callback and PKCE proof. It is exchanged for tokens. |
| PKCE | Proof Key for Code Exchange. The selected S256 method binds the code to a verifier through its SHA-256 challenge. Syntax and hash binding are separate checks. |
| Revoke-all epoch | The shared counter advanced by owner revoke-all. It contributes to credential version; it is not a published item version or a signing-key ID. |
| Credential version | The application validity claim derived from cookie secret and revoke-all epoch. A change to either invalidates earlier delegated credentials. Owner-password reset preserves them. It is distinct from a signing-key identifier. |
| Refresh rotation | Consuming a refresh credential and issuing its successor. It does not extend the grant's absolute deadline. |
| Replay | Reusing a code or refresh credential after consumption. Selected zero-grace refresh reuse revokes the grant family, including signed access tokens. |
| Revocation | Removing authority before its deadline. Owner grant revocation, revoke-all and native refresh-token revocation have different boundaries. |
| Grant tombstone | Shared state that records a revoked grant family. Other isolates must consult it before accepting access or returning pending issuance. |

## Protocol and security boundaries

| Term | Meaning |
| --- | --- |
| Origin | The URL's scheme, host and port. Same-site requests can still have different origins; cookie behavior cannot replace an Origin check. |
| Root invalidation | Loss of delegated authority after cookie-secret change or owner revoke-all. Owner-password reset instead invalidates owner sessions and preserves delegated tokens. It is not necessarily signing-key rotation. |
| Protected resource metadata | A document identifying the resource, its authorization servers and supported capabilities. Its URL can appear in a Bearer challenge. |
| Discovery | A client's retrieval of server metadata. Mounted OIDC discovery works in the selected profile; host-root `.well-known` publication remains deferred. |
| MCP | Model Context Protocol. Authorized tool calls expose selected API capabilities and must pass receiving authorization on each request. |
| Save acknowledgment | A successful save response received by the editor. A write can commit even when its acknowledgment is lost. |
| Save queue | The editor's ordering of submitted saves. An older acknowledgment must not replace newer editor input. |
| Receiving boundary | The real endpoint or browser behavior where a promise is checked. A helper-level rejection alone does not prove endpoint enforcement. |
| Positive neighbor | A nearby valid request that must succeed. It prevents blanket denial from satisfying only negative security cases. |
| Fail closed | Refuse protected work when required authority or configuration cannot be established. Exact errors remain part of each test's stated contract. |

## Oracle tests

| Term | Meaning |
| --- | --- |
| Contract | The promised behavior, derived from an approved design, established API or cited specification. The test author does not invent it through assertions. |
| Oracle | An independent judgment of an observed result. A filename containing `oracle` does not prove complete coverage. |
| Reference model | The smallest independent rule or state machine that predicts the modeled observations. It does not reuse production semantic helpers. |
| History grammar | The legal values, actions, relationships and schedules a campaign can construct, including its bounds and exclusions. |
| Production driver | The test code that invokes the real entry point and records observations. A fixture-specific provider driver must state that narrower boundary. |
| Checkpoint | A named event boundary at which observations are compared, such as a completed HTTP response or settled replay. |
| Refinement check | The comparison between production observations and the independent contract/model. It preserves distinctions the contract promises. |
| Fixed witness | A chosen history that forces a known boundary or regression. It does not claim random exploration. |
| Campaign | Repeated generated histories. Fixed and unseeded lanes use the same grammar and budget; neither exhausts an unbounded domain. |
| Seed / shrink path | Inputs that reproduce a generated failure and its reduced history. A seed alone need not select the same reduced case. |
| Security RED | Failure at the intended security assertion. A timeout, missing module or failed fixture setup does not count. |
| GREEN | The same receiving check passes. It proves only the stated boundary and observations under the tested conditions. |
| Mutation control | A deliberate plausible defect that the unchanged oracle must catch at its named assertion. It measures sensitivity, not absence of other bugs. |
| Controlled schedule | A driver-enforced ordering of concurrent events. One forced cross-isolate schedule does not cover every race. |
| Model generation | The independent authorization model's `generation` reset counter. It maps to root invalidation; it is not a production session or signing-key ID. |

TanStack DB examples in the copied guide use their own query and synchronization vocabulary. Those examples illustrate oracle methods; they do not introduce a Blygger sync-run or acquisition-lease API.

## Source cross-check

The [research survey](auth-security-survey.md) supplies protocol claims; application code supplies local definitions. RFC6749 [§1.1](https://www.rfc-editor.org/rfc/rfc6749.html#section-1.1), [§1.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-1.3) and [§2](https://www.rfc-editor.org/rfc/rfc6749.html#section-2) distinguish client, authorization-grant credential and registration. RFC9700 [§4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2) requires replay defense for the selected rotation strategy; revoking signed access tokens as well is Blygger policy.

Survey claim OS05-C004 notes that resource indicators and audience identifiers need not be identical in every implementation. This installation uses its API/MCP URLs as accepted resource audiences. OIDC [§2](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) defines authentication time; token issuance time is a different claim. Survey claims OS09-C003/C008/C037 preserve that distinction.

`src/oauth.ts` defines credential version and revoke-all epoch. Its grant tombstones are application-scoped. The pinned provider’s `invalidateRefreshFamily` filters refresh rows by `clientId` and `userId`, not `grantId`; the audit records this native boundary. The independent-grant oracle proves owner revocation leaves another grant’s access usable. It does not prove that native replay preserves another same-client grant’s refresh credential. Do not infer that stronger isolation claim from the word “family.”

## Resource and network security

| Term | Meaning here |
|---|---|
| Admission | The atomic decision to admit work before its handler or provider call starts. |
| Work budget | A call count for a named principal or aggregate within a fixed minute or UTC day. Owner request quotas, per-grant quotas and delegated aggregate quotas are separate; AI also has a total ceiling. It is separate from owner permissions and the per-IP OAuth limiter. |
| Owner reserve | Daily AI capacity that delegated calls cannot consume. Owner request quotas are separate from delegated quotas. |
| Abandoned registration | An anonymous client older than the configured grace with no approval, token or live authorization work. It can be reclaimed. |
| Private media | Uploaded bytes no publication has used: not in any published version's text, not attached to an item that was ever published, and not the avatar. Published media stays public through later versions and withdrawal (protocol §5.4). Reading private media requires an owner cookie or API read token. |
| Registration claim | A temporary D1 slot held while anonymous OAuth client creation runs. It expires after five minutes and does not confer authorization. |
| Editorial allowlist | The tags, attributes and URL schemes imported rendering permits. It does not change raw stored publisher content. |
| SSRF | Server-side request forgery: a caller makes the Worker contact a destination the installation should refuse. |
| DNS rebinding | DNS answers change between validation and connection. A DNS preflight cannot establish connection-time destination enforcement. |
| LAN opt-in | `ALLOW_PRIVATE_FETCH="true"`, which permits private network destinations for the installation’s outbound adapters. It does not grant new API scopes. |
