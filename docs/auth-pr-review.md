# OAuth and MCP PR review

Reviewed implementation commit: `6558b78a8e7fe16c7173840be47de36d42c12f92`.
Base: upstream main `0f6108f`. This record adds documentation after that source
snapshot. It does not change runtime code or test assertions.

The prep review integrated the current upstream UI and API, renamed the new
migration to `0020_oauth.sql`, and prepared Studio 0.27.0 and SDK 0.2.0. It retained
upstream's tag-triggered release policy. Client access lives in More.

## Confirmed findings

- Uploaded SVG documents could run script with the owner's origin. A harmless
  browser marker reached RED. Media now carries a CSP sandbox. Image rendering
  and inert document behavior pass on desktop and mobile. The sandbox-removal
  mutation reaches the same receiving assertion.
- Authenticated HTTP Basic refresh replay did not revoke the application's JWT
  grant. The receiving oracle reached RED with read 200 instead of 401. Resolving
  the native-authenticated client identity fixes it. The wrong-secret neighbor
  preserves the legitimate grant. A classification-removal mutation reaches RED.
- Upstream added model, interaction and thumb reads. The independent MCP scope
  inventory now names all three. The full scope-subset campaign passes.
- Upgrade and mutation fixtures now include the model build artifact and reflect
  renamed/deleted candidate files. The upgrade no longer applies both migration names.

The lossless audit retains the original findings and appends the two confirmed
security repairs. See [security evaluation](auth-security-evaluation.md).

## Verification

| Check | Result |
| --- | --- |
| Full Worker suite, two workers | 98 files, 1,052 passed, 5 existing skips |
| Full desktop/mobile Chromium suite | 214 passed |
| UI suite | 4 files, 23 passed |
| Focused security/flow/validation rerun | 3 files, 104 passed |
| Lifecycle/pagination mutations | 4 named checkpoints |
| Auth mutations and direct seed/path replay | 3 controls and 2 reproduced histories |
| Security mutations | 13 named checkpoints, including browser and two-isolate controls |
| Mounted native OIDC fixture | Root, `/blyg`, `/nested/blyg` |
| Real 0.8.3 upgrade entry point | Build, types, D1 migrations, SDK smoke, declined deploy |
| Extracted release artifacts | Checksums, Worker, Node/browser SDK consumers, both type-resolution modes, D1/R2 restart persistence |
| Worker/UI types, generation and template checks | Pass |

The release manifest identifies the reviewed implementation commit. Local logs
are under the task's `/private/tmp/blygger-auth-audit` evidence directory. CI
uploads mutation and browser failure artifacts. The assertions and receiving
oracles remain versioned; scratch logs are local evidence, not durable downloads.

## Limits

Host-root discovery publication remains deferred. Mounted discovery and the
challenge-linked metadata do not establish full RFC9728/RFC8414 publication
conformance. Better Auth's native refresh cleanup can invalidate another refresh
token for the same client and owner; application grant tombstones remain separate.
The sibling oracle proves access-token isolation after individual owner revocation,
not refresh isolation after replay. Production TLS, trusted ingress headers,
operator/database access, external logs and every distributed schedule remain
outside these local checks. No deployment or upstream merge occurred.

The [oracle map](auth-oracles.md), [security map](auth-security-oracles.md),
[glossary](glossary.md) and [merged oracle guide](oracle-tests.md) define the laws,
sources, driver limits and terms. This review does not claim complete guide or
protocol conformance.

## External review follow-up against e689b63

The ten-item review produced two direct security failures and an adversarial fail-open classifier witness. The receiving tests reached RED before those fixes. Broader independent permission laws and deliberate mutations now check the surrounding class.

| Item | Disposition and retained value |
| --- | --- |
| 1. Silent authorization after grant revoke | Fixed. Revocation clears client consent. The same `prompt=none` path now requires a fresh decision. Sibling access-token isolation stays tested. |
| 2. Draft-only attachment changes a published item | Fixed. SQL checks publication at the media-row commit. REST, direct MCP and a controlled R2/publish race preserve the public projection. |
| 3. Existing owner cookies fail after upgrade | Confirmed intentional compatibility change. The release notes now require one-time login again. Password-reset session invalidation follows the user's ruling. |
| 4. SDK session strings select both schemes | Confirmed. SDK 0.2.0 already includes a pre-1.0 version change. Release notes now show the native cookie or scheme-specific callback migration. No generator workaround was added. |
| 5. Basic header overrides owner cookies | Fixed. Only Bearer selects delegated credentials. An invalid Bearer still cannot fall back to a cookie. |
| 6. Remote/LAN HTTP gets400 | Confirmed deliberate transport rule. The prior Worker redirect premise was not established. Document HTTPS ingress and LAN testing with TLS. |
| 7. Password reset also revokes client tokens | Fixed after the user confirmed decision #31. Old owner sessions fail. Delegated API/MCP and native refresh credentials survive with unchanged deadlines. Stale native browser cookies cannot silently authorize. |
| 8. Unclassified write falls back to read | Fixed. Use Hono's matched route metadata and deny unclassified writes. The literal model checks 49 operations across 16 scope subsets. |
| 9. Error logs lose diagnostics | Fixed with bounded error kind, method and route template shared by OAuth, API and Worker handlers. Dependency-defined error names, messages, stacks and path values remain excluded. The credential-leak control still fails when raw logs return. |
| 10. Repeated provider/schema construction | Fixed. Cache provider configuration and immutable MCP schemas. Live authority checks and per-request handlers remain separate. Work counters prove reuse. |

The concluding priority advice is also retained: security repairs came first, compatibility changes gained release notes, and item 7 follows the user ruling. No finding was dropped. The scratch ledger contains ten findings plus this prose item: ten fixed-now dispositions and one duplicate priority entry.

The full Worker run passed 101 files and 1,101 tests with five existing skips. The final focused auth receiving file passed ten tests after adding the dependency-name boundary. Worker/UI types passed. All 19 security controls reached their named assertions. Eight auth browser tests and the four upstream CI-failing browser cases passed on desktop/mobile. The CI screenshot fixture now uses Playwright's output directory and restores shared settings on failure.

Recommend this reviewer for bug discovery, with a required verification pass. The two security holes and fail-open classifier claim reproduced. The review needs sharper distinctions between a deliberate security policy, a compatibility change and a missing version note. Caching credential-bound MCP servers would be unsafe; only immutable metadata is shared here.


The password-policy follow-up captured RED for delegated survival before repair: API/manual and native OAuth reads returned401 instead of200. The stale-native-session probe returned `consent_required` instead of `login_required`. After separating grant validity from owner password and refusing native-cookie fallback, all four reset receiving tests pass. The generated grammar includes resets without changing delegated model state. The new mutation proves that dropping the stale-browser guard allows a new code and fails the receiving assertion. This follows the user's token-survival ruling and closes item 7.


The final logging class probe places the credential sentinel in `Error.name` as well as message and stack. Registration reached RED through the OAuth handler's raw name field. OAuth now uses the shared bounded diagnostic helper. All three dependency profiles pass, and the raw-logging mutation still reaches its named failure. The final security/reset receiving run passed 42 tests. Final Worker/UI types and OpenAPI sync passed. All 19 security controls, three auth mutations and two captured-history replays passed their required checks.
