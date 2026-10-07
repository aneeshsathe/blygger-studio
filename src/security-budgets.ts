import type { OwnerAccess } from './permissions.ts';
import type { Env } from './types.ts';

/** Positive operator limits; invalid/zero configuration never disables a guard. */
export function securityLimit(value: string | undefined, fallback: number) {
  return value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
}
/** One SQL statement owns admission across isolates; live authority is never cached. */
export async function admit(db: D1Database, key: string, limit: number, windowSeconds: number) {
  const window = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const row = await db.prepare(`INSERT INTO security_budgets(key, window, used) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET window=excluded.window,
      used=CASE WHEN security_budgets.window <> excluded.window THEN 1 ELSE security_budgets.used + 1 END
    WHERE security_budgets.window <> excluded.window OR security_budgets.used < ? RETURNING used`)
    .bind(key, window, limit).first();
  return row !== null;
}
// A request-local symbol is set from verified authority, never caller headers or
// shared Env mutation. Providers inherit the same principal through cloned Env.
const principal = Symbol('verified work principal');
type WorkEnv = Env & { [principal]?: string };
export function withWorkPrincipal(env: Env, access?: OwnerAccess): WorkEnv {
  return { ...env, [principal]: access ? access.grantId ?? access.clientId : undefined };
}
export function workPrincipal(env: Env) { return (env as WorkEnv)[principal]; }
export async function admitApi(env: Env, read: boolean) {
  const kind = read ? 'api-read' : 'api-write', grant = workPrincipal(env);
  const limit = securityLimit(read ? env.API_READ_LIMIT : env.API_WRITE_LIMIT, read ? 1200 : 120);
  if (!await admit(env.DB, grant ? `${kind}:grant:${grant}` : `${kind}:owner`, limit, 60)) return false;
  return !grant || admit(env.DB, `${kind}:delegated`, securityLimit(read ? env.API_DELEGATED_READ_LIMIT : env.API_DELEGATED_WRITE_LIMIT, read ? 600 : 60), 60);
}
export async function admitMcp(env: Env, access: OwnerAccess) {
  const grant = access.grantId ?? access.clientId;
  return await admit(env.DB, 'mcp-request:grant:' + grant, securityLimit(env.MCP_REQUEST_LIMIT, 300), 60)
    && await admit(env.DB, 'mcp-request:delegated', securityLimit(env.MCP_DELEGATED_REQUEST_LIMIT, 150), 60);
}
export async function admitAi(env: Env) {
  const total = securityLimit(env.AI_DAILY_CALL_LIMIT, 20), grant = workPrincipal(env);
  if (grant) {
    const reserve = Math.min(total, securityLimit(env.AI_OWNER_RESERVED_CALLS, 5));
    if (reserve === total) return false;
    if (!await admit(env.DB, 'ai-daily:grant:' + grant, securityLimit(env.AI_GRANT_DAILY_CALL_LIMIT, 5), 86400)) return false;
    if (!await admit(env.DB, 'ai-daily:delegated', total - reserve, 86400)) return false;
  }
  return admit(env.DB, 'ai-daily', total, 86400);
}
export async function reserveClient(env: Env) {
  const id = crypto.randomUUID(), now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('DELETE FROM security_registrations WHERE expires <= ?').bind(now).run();
  // Reclaim only abandoned anonymous registrations. Never collect approved or
  // owner-created clients, native tokens, live codes, or a pending consent flow.
  // better-auth stores dates as ISO text; julianday compares them as instants.
  const cutoff = new Date(Date.now() - securityLimit(env.OAUTH_UNAPPROVED_CLIENT_TTL_SECONDS, 86400) * 1000).toISOString();
  await env.DB.prepare(`DELETE FROM oauthClient WHERE userId IS NULL AND julianday(createdAt) <= julianday(?)
    AND NOT EXISTS (SELECT 1 FROM oauthConsent WHERE clientId=oauthClient.clientId)
    AND NOT EXISTS (SELECT 1 FROM oauth_authorizations WHERE client_id=oauthClient.clientId)
    AND NOT EXISTS (SELECT 1 FROM oauthRefreshToken WHERE clientId=oauthClient.clientId)
    AND NOT EXISTS (SELECT 1 FROM oauthAccessToken WHERE clientId=oauthClient.clientId)
    AND NOT EXISTS (SELECT 1 FROM verification WHERE julianday(expiresAt)>julianday(?) AND instr(value,oauthClient.clientId)>0)
    AND NOT EXISTS (SELECT 1 FROM oauth_records WHERE key LIKE 'consent:%' AND expires>? AND instr(value,oauthClient.clientId)>0)`)
    .bind(cutoff, new Date().toISOString(), now).run();
  // Count persisted clients and live reservations in the same atomic statement.
  // Failed registration releases its slot; crash reservations expire in five minutes.
  const row = await env.DB.prepare(`INSERT INTO security_registrations(id, expires)
    SELECT ?, ? WHERE (SELECT COUNT(*) FROM oauthClient WHERE userId IS NULL) +
      (SELECT COUNT(*) FROM security_registrations WHERE expires > ?) < ? RETURNING id`)
    .bind(id, now + 300, now, securityLimit(env.OAUTH_CLIENT_LIMIT, 100)).first();
  return row ? id : null;
}
export async function releaseClient(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM security_registrations WHERE id=?').bind(id).run();
}
