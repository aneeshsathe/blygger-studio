# Terminology audit

This scan checks current Blygger source, oracle tests, drivers, scripts and maintained docs against [the glossary](glossary.md). It is a reviewed vocabulary scan, not a proof that every sentence is unambiguous.

| Distinction | Finding and action |
| --- | --- |
| Client registration / grant | Corrected current auth coverage prose from client-wide to grant-level revocation. Changed the Studio grant list heading to “Authorizations.” One registered client can retain another grant after one grant is revoked. |
| Root invalidation / signing-key rotation | Changed the authorization witness and its mutation-runner selector to “root invalidation.” Owner-password reset invalidates owner sessions and preserves delegated authority. Cookie-secret rotation and revoke-all invalidate delegated authority. Actual key replacement on wrapping-secret change remains called signing-key rotation. |
| Model generation / credential version / revoke-all epoch | Mapped the model's `generation` field explicitly. Corrected production comments to “credential version” and the upgrade assertion to “revoke-all epoch.” These terms name different layers of the reset mechanism. |
| Owner bridge / authentication time | Used “owner bridge” in current lifecycle prose and the bounded bridge error. The glossary retains “owner-session bridge” as an explicit alias. Creating a provider session is not a fresh password check. |
| Working copy / version | Used “working copy” for current editable content in API docs, lifecycle model prose and public-feed comments. Kept version/snapshot for published history and pin observations. |
| Generated-content provenance / model generation | Added the qualified content term and its existing checkpoint alias. Generated text claims do not refer to a credential reset counter. |
| Native client-disable fixture / production grant revocation | Described the integration fixture’s actual client-disable boundary separately from production’s grant-level contract. Removed superseded implementation descriptions from the coverage docs. |

## Terms retained deliberately

`authorization` is the public API name for a grant. Client access remains a useful page name; it does not name the unit of revocation. Scope and resource name approved capabilities and receiver identity; audience names the token claim used for binding. Access-token expiry and grant deadline remain separate clocks.

Native fields such as `client_id`, `referenceId`, `authorizationCodeId`, `grantId` and `credentialVersion` keep their provider or wire names. The model's `generation`, `slot` and browser labels keep their internal names with explicit glossary mappings. No route, database column, SDK method or token claim was renamed by this pass.

Original review findings and failure logs retain their exact recorded wording in the audit evidence. They are not alternate descriptions of this PR’s final implementation. Upstream guide examples use TanStack DB vocabulary. Literal fixture content such as “private working draft” also remains test data. The copied guide's TanStack DB lifecycle terms do not define Blygger internals.

## Scan method

Use `rg` over `src`, `test`, `e2e`, `scripts` and `docs` for client/grant revocation, root rotation/invalidation, generation/version/epoch, bridge/authentication time, working draft/copy, and token/grant deadlines. Review each match in context before changing it. Labels and aliases alone are not semantic conflicts; a changed scope or boundary is.

Verification:58 affected Worker tests passed across five files, and Worker/UI typechecks passed. The residual scan found only declared aliases, literal fixture content and recorded audit evidence for the corrected terms.

## Research-survey cross-check

Qualified Blygger’s stored grant/authorization separately from RFC6749’s authorization-grant credential. Split application grant family from native client/user refresh family. The provider’s replay cleanup can cross application grant boundaries; independent access after owner revocation is not evidence of independent refresh after native replay. Credential version depends on cookie secret and revoke-all epoch. It excludes owner password, per decision #31 and the user ruling. Resource/audience identity and signed-access revocation are selected application policies, not universal protocol definitions. See the glossary’s source cross-check.
