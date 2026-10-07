/**
 * Delegation is the intersection of identity, time, resource and explicit scope.
 * Decision #52 supplies capabilities and lifetimes. Decision #31 and the user
 * ruling separate owner-password reset from delegated token invalidation.
 * RFC6750 §3 supplies the invalid-token/insufficient-scope distinction:
 * https://www.rfc-editor.org/rfc/rfc6750.html#section-3
 * RFC8707 §2 supplies resource binding:
 * https://www.rfc-editor.org/rfc/rfc8707.html#section-2
 *
 * This model stores only facts a later action can distinguish. A revoked flag
 * separates one deleted grant from a live neighbor. A generation counter models
 * revoke-all/signing-secret reset without erasing history; it is not a production signing-key ID.
 * Scope arrays have no implication: owner:draft does not grant owner:read.
 *
 * OAuthModel is a separate, partial one-use/binding law. It predicts browser
 * decisions and code exchange, not refresh rotation or native cryptography.
 * Browser names and credential slots are model labels for driver-held cookies
 * and issued credentials. They are not production identity identifiers.
 * AuthorizationModel judges manual credentials; it stores no client identity or
 * refresh ancestry. OAuthModel judges consent/code bindings, not native refresh
 * families. Neither predicts same-client refresh isolation after replay. Those
 * receiving boundaries need separate witnesses.
 * The models import no production verifier, storage, scope or permission code.
 */
export type Scope = 'owner:read' | 'owner:draft' | 'owner:publish' | 'owner:manage';
export type Resource = 'api' | 'mcp';
export type Credential = { scope: Scope[]; resource: Resource; expires: number; generation: number; revoked: boolean };
export class AuthorizationModel {
  now = 0;
  generation = 0;
  credentials = new Map<number, Credential>();
  mint(slot: number, scope: Scope[], resource: Resource, lifetime: number) {
    if (!scope.length || lifetime <= 0) throw new Error('invalid model authorization');
    this.credentials.set(slot, { scope: [...scope], resource, expires: this.now + lifetime, generation: this.generation, revoked: false });
  }
  revoke(slot: number) { const credential = this.credentials.get(slot); if (credential) credential.revoked = true; }
  revokeAll() { this.generation++; }
  advance(seconds: number) { if (seconds < 0) throw new Error('time cannot run backward'); this.now += seconds; }
  // Invalid authority takes precedence over missing scope. At the exact expiry
  // boundary, a credential is already invalid. Only a live matching-resource
  // credential can produce403 for missing scope. This predicts authorization,
  // not an operation's success body or missing-item404.
  judge(slot: number, resource: Resource, required: Scope[]): 200 | 401 | 403 {
    const credential = this.credentials.get(slot);
    if (!credential || credential.revoked || credential.generation !== this.generation || credential.expires <= this.now || credential.resource !== resource) return 401;
    return required.every(scope => credential.scope.includes(scope)) ? 200 : 403;
  }
}
export type Consent = { browser: string; scopes: Scope[]; used: boolean; expires: number };
export type Code = { verifier: string; client: string; redirect: string; resource: Resource; used: boolean; expires: number };
export class OAuthModel {
  now = 0;
  consents = new Map<string, Consent>();
  codes = new Map<string, Code>();
  consent(handle: string, browser: string, scopes: Scope[]) {
    this.consents.set(handle, { browser, scopes: [...scopes], used: false, expires: this.now + 600 });
  }
  // Consent is browser-bound and single-use, including denial. Rejecting another
  // browser must leave the legitimate browser's decision available. The ten-minute
  // handle lifetime is local policy; the model does not derive it from provider rows.
  decide(handle: string, browser: string, allow: boolean): 'code' | 'denied' | 'rejected' {
    const consent = this.consents.get(handle);
    if (!consent || consent.used || consent.expires <= this.now || consent.browser !== browser) return 'rejected';
    consent.used = true;
    return allow ? 'code' : 'denied';
  }
  // RFC6749 §4.1.3 and RFC7636 §4.6 bind a one-use code to these inputs:
  // https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3
  // https://www.rfc-editor.org/rfc/rfc7636.html#section-4.6
  // Reject a mismatched input without marking this model record used. These tests
  // do not infer that every failed native exchange permits a later successful retry.
  exchange(code: string, verifier: string, client: string, redirect: string, resource: Resource): 'token' | 'rejected' {
    const record = this.codes.get(code);
    if (!record || record.used || record.expires <= this.now || record.verifier !== verifier || record.client !== client || record.redirect !== redirect || record.resource !== resource) return 'rejected';
    record.used = true;
    return 'token';
  }
}
