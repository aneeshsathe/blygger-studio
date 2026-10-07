# Security attack inventory

This is a bounded attack inventory, not a claim that every possible vulnerability
has a test. Each row names a receiving law, attack history and observation. Real
failures must be captured before repairs. Passing probes stay distinct from
mutation evidence and production-only facts. The starting commit is
`a16f9dfd443c6dfba4216769453e4c46447ad26e`.

| ID | Attack class and required law | Probe and status |
|---|---|---|
| SEC-01 | Imported HTML cannot execute script with owner authority: URL parser normalization, SVG/MathML, event handlers, malformed markup, DOM reparsing. Safe text, links and transclusions remain usable. | Worker corpus and desktop/mobile browser parsing captured executable normalized JavaScript and SVG links before repair. Ten attacks plus a public legacy-collection bypass now pass. Follow-up REDs cover transclusion preview/public/history, legacy public/pinned/Studio presentation and injected attribution hrefs; snapshots remain unchanged. Ordinary editorial markup and transclusions retain positive tests. Arbitrary browser/parser payloads remain outside this fixed corpus. |
| SEC-02 | Active uploaded content cannot borrow owner authority: SVG documents, MIME confusion, inline content and filenames. | Existing SVG browser and MCP media oracles pass. MIME/filename combinations beyond those histories remain untested. |
| SEC-03 | Draft operations cannot change the public projection, including deletion, restoration, metadata edits, uploads and races. | Successful draft patch/restore preserve published JSON bytes. A controlled publish/delete race captured stale deletion before repair; atomic deletion now preserves both the published item and its media. Existing upload races cover attachment commits. Follow-up media oracles require anonymous draft refusal, authenticated no-store previews, actual public use, and published bytes that survive later versions and withdrawal (§5.4, §9). Choosing the avatar needs publish scope. |
| SEC-04 | Read operations cannot expose private material without read permission; error paths cannot disclose credentials. | All 49 operations × all 16 scope subsets pass. Separate denial and dependency sentinel probes pass. This inventory does not prove every private resource projection. |
| SEC-05 | Revocation contains in-flight refresh and issuance across individual/all revoke and signing-secret changes. | Two real Worker isolates cover refresh replay, individual revoke and revoke-all while native refresh issuance pauses. Each rejects old access and the paused issuance. A controlled post-validation recording race also proves late persistence cannot resurrect a revoked grant list entry. Access and refresh introspection require live grant state. Other distributed schedules remain untested. |
| SEC-06 | Independent same-client grants retain the documented isolation boundary. | Individual revoke preserves another same-client grant’s access and refresh. Native replay cleanup may invalidate sibling refresh tokens for that client/owner; no stronger replay-family isolation is claimed. |
| SEC-07 | JWT header/key/algorithm confusion cannot turn an untrusted token into authority. | Eight hostile unsigned/algorithm/key/header/syntax tokens fail protected reads and writes beside a valid neighbor. Existing signed claim/type/cutover probes pass. This is not an exhaustive JOSE certification. |
| SEC-08 | Browser cookies cannot replace explicit owner login after reset; CSRF, framing and silent reauthorization cannot bypass consent. | Reset, consent, silent reauthorization, framing and CSRF oracles pass. Desktop/mobile browser checks exercise media sandboxing and hostile ancestors. |
| SEC-09 | Expensive REST/MCP calls have explicit byte, work, concurrency and cost bounds. | Unbounded write/AI admission and oversized REST/OAuth bodies were captured before guards. Separate owner/per-grant and delegated aggregate fixed-window API/MCP limits protect owner capacity. AI has a total ceiling plus an owner reserve. Sequential, concurrent and grant-isolation probes count actual work. These limits do not bound in-flight concurrency, CPU per admitted call or monetary spend per model. |
| SEC-10 | Anonymous registration and expired auth records cannot grow storage without an operator-controlled bound. | Unbounded client creation was captured before the stored-client/reservation cap. Sequential and concurrent registration now stay within it. Failed requests release slots and expired reservations are deleted on registration. Abandoned unapproved anonymous clients expire after a configurable grace; approved clients, live codes/consent and tokens are retained. Other native auth records still need operator retention. |
| SEC-11 | Importer/Webmention requests cannot become unbounded fetch amplifiers: destination, redirect, timeout and streamed body limits. | The old Webmention path buffered eight chunks before refusal; boundedText and direct text readers now cancel at the cap plus one chunk. Literal, canonical, special-name, mixed DNS and redirect attacks fail before destination fetch. Explicit LAN opt-in and public neighbors work. The read-only fork endpoint also has a receiving public/private transport witness and suppresses raw exception text. DNS rebinding between validation and connection remains unresolved. |
| SEC-12 | Secrets do not escape through application/dependency logs or credential responses. | Existing sentinel, at-rest credentials and no-store oracles pass. External log sinks, backups and operator access remain unverified. |
| SEC-13 | Key rotation works across warm/cold provider instances; revoked grants stay revoked after caching. | Existing provider-cache and signing-secret cutover laws pass. Arbitrary replica/cache/rotation schedules remain untested. |
| SEC-14 | Real ingress enforces TLS, admits intended hosts and overwrites limiter identity headers. | Local transport/forwarding probes pass. Actual ingress host admission, client-address overwrite and network enforcement remain unverified. No live-site attacks were run. |
| SEC-15 | D1 restore, access controls and load failures do not undo revocation or leak credentials. | Local failed-batch rollback and cross-isolate race laws pass. D1 backups, restore policy, account access and deployed overload recovery still need operator evidence. |

| SEC-16 | Reachable parser dependencies cannot consume quadratic work for ordinary untrusted Markdown. | The old linkifier copied 392,192 token slots at 256 lines and 1,570,816 at 512. The patched Markdown dependency passes the work-growth oracle while preserving every link. Compatible dependency updates leave the production npm audit with zero reported advisories. Other algorithmic paths remain untested. |

Authority: decision #52 and the four separate owner capabilities; the
[oracle guide](oracle-tests.md); [OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html),
[authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html),
[SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
and [OAuth security BCP](https://www.rfc-editor.org/rfc/rfc9700.html).
Byte/time limits must follow an existing contract or an explicit local security
policy; this inventory does not invent a protocol requirement or cost quota.

## Receiving evidence and oracle audit

New literate oracles: `imported-html-security`, `draft-authority-security`,
`token-header-security`, `outbound-security`, `outbound-destination-security`,
`work-admission-security`, `request-body-security` and `markdown-work-security`.
Their prose states the law, independent observation, fixture boundary and limits.
The browser corpus observes DOM execution after actual owner login and SDK reads.
The native race driver also accepts `revoke` and `revoke-all` schedules.

Captured pre-fix failures distinguish security RED from fixture failures:
normalized browser URLs/SVG, the committed legacy public renderer, stale draft
deletion, stream buffering, quadratic linkification, admission/storage/cost and
request-body caps. MCP discovery has its own envelope budget after a captured bypass. DNS fixtures and permission-matrix budget exhaustion were
setup problems, not new vulnerabilities. The registration quota initially intercepted
a dependency-log fault before native work. The receiving oracle now explicitly
checks that its native failure seam ran; the unsafe-logging mutation fails again. Six disposable-copy mutations remove
counter, AI, storage, byte, MCP discovery and destination guards and must reach named assertions.
Run `node --import tsx scripts/verify-auth-security-mutations.ts admission`.

ORC audit for this bounded campaign (reviewed changes on top of the starting
commit above; the record and executable evidence travel in the same commit):

| Requirement | Outcome |
|---|---|
| ORC-001 authority | Each file cites the user policy, existing fetch/publication law or security source and limits its claim. |
| ORC-002 independence | Literal denied capabilities, byte/work counters, raw public bytes and DOM markers do not import production policy classifiers. |
| ORC-003 prose/responsibilities | Each new oracle states its contract, fixed history, production driver, observation and limit. |
| ORC-004 generated grammar | Not applicable to these new fixed corpora/schedules. Existing generated auth campaigns remain separate. |
| ORC-005 receiving path | Real REST/MCP/HTML renderers, browser parsing, production provider transport and stream adapters reach positive and negative checkpoints. |
| ORC-006 calibration | Captured pre-fix semantic failures and six isolated broken-control assertions. Fixture errors are excluded. |
| ORC-007 random/replay | Not applicable to fixed examples. No random/exhaustive coverage claim is made for them. |
| ORC-008 minimal state | Budgets retain counts and window identity: a next action distinguishes an exhausted counter from an available one. Draft races retain publication state because deletion is legal only before publication. No reusable state machine is merged. |
| ORC-009 terms | Owner, grant, scope, draft and publication use the glossary meanings. Byte/pull counters are local fixture observations, not provider state. |
| ORC-010 failure/cleanup | Browser marker/status and persisted-state assertions own the failure. Fetch spies restore in finally; streams cancel/release readers; disposable mutation copies preserve assertion output. No shrinking/capture reducer is introduced. |
| ORC-011 alternate formulation | Worker URL inspection missed encoded URL normalization; actual browser parsing/clicks supply the independent second observation. DNS connection binding remains an explicit unresolved shared-fault risk. |
| ORC-012 review evidence | This table records all fourteen outcomes. SEC rows own remaining cells. No entire-security or bug-class closure claim is made. |
| ORC-013 boundaries | Quotas observe admission at two and rejection at three; bodies include exact byte boundaries and valid neighbors. Hostile/public URL and draft/publication neighbors distinguish the tested laws. Other values/schedules remain untested. |
| ORC-014 provider handoff | DNS, AI transport and network streams are synthetic and claims stop at their controlled boundaries. Real browser reparsing and native D1/OAuth races supply their own receiving premises. Production DNS rebinding, spend, ingress and recovery remain operator-owned gaps. |
