import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';
import { createAuthEndpoint, APIError } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { getMigrations } from 'better-auth/db/migration';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { makeApp } from '../src/index.ts';
import { serveAuthorizedMcp } from '../src/mcp.ts';
import { verifySession } from '../src/auth.ts';

// This integration fixture constructs its own native provider configuration.
// It exposes test-only owner-session/introspection seams and explicit metadata.
// It does not certify the production forwarding allowlist or storage policy.
// Production receiving tests use makeApp through oauth-flow-driver.ts instead.
let browserSequence = 0;
export async function createBetterAuthDriver(mount: string) {
  const ip = `2001:db8:b002:${(++browserSequence).toString(16)}::1`;
  const base = 'https://better-auth-oracle.example.test', path = mount + '/studio/auth', issuer = base + path, resource = base + mount + '/studio/mcp';
  const currentEnv = { ...env, MOUNT: mount };
  const options = {
    database: env.DB, baseURL: base, basePath: path,
    secret: 'oracle-only-secret-with-at-least-32-characters',
    disabledPaths: ['/token', '/sign-up/email', '/sign-in/email'],
    plugins: [jwt({ jwks: { keyPairConfig: { alg: 'RS256' as const } } }), oauthProvider({
      scopes: ['openid', 'offline_access', 'owner:read'],
      loginPage: mount + '/studio/login', consentPage: mount + '/studio/consent',
      allowDynamicClientRegistration: true, allowUnauthenticatedClientRegistration: true,
      grantTypes: ['authorization_code', 'refresh_token'],
      clientPrivileges: ({ user }) => user?.id === 'owner',
      resources: [resource], clientRegistrationDefaultResources: [resource],
    }), {
      id: 'blygger-owner-bridge', endpoints: {
        ownerSession: createAuthEndpoint('/owner-session', { method: 'POST' }, async ctx => {
          if (ctx.headers?.get('origin') !== base) throw new APIError('FORBIDDEN');
          if (!await verifySession(currentEnv, ctx.headers?.get('cookie') ?? undefined)) throw new APIError('UNAUTHORIZED');
          const user = await ctx.context.internalAdapter.findUserById('owner');
          if (!user) throw new APIError('INTERNAL_SERVER_ERROR');
          const session = await ctx.context.internalAdapter.createSession(user.id);
          await setSessionCookie(ctx, { user, session });
          return ctx.json({ ok: true });
        }),
      },
    }],
  };
  // Exercise the package's real D1 schema/migrations, not an in-memory adapter.
  await (await getMigrations(options)).runMigrations();
  const server = betterAuth(options), context = await server.$context;
  if (!await context.internalAdapter.findUserById('owner')) {
    await context.internalAdapter.createUser({ id: 'owner', name: 'Owner', email: 'owner@blygger.invalid', emailVerified: true }, { method: 'other' });
  }
  let introspectionClient: { client_id: string; client_secret?: string | null } | undefined;
  const app = makeApp(mount), log: { path: string; status: number }[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init), url = new URL(request.url);
    request.headers.set('cf-connecting-ip', ip);
    let response: Response;
    if (url.pathname === path + '/resources/mcp') response = Response.json({ resource, authorization_servers: [issuer], scopes_supported: ['owner:read'] });
    else if (url.pathname === new URL(resource).pathname) {
      const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
      if (!token) response = new Response(null, { status: 401, headers: { 'WWW-Authenticate': `Bearer resource_metadata="${issuer}/resources/mcp"` } });
      else {
        try {
          const claims = await verify(token, resource);
          if (!introspectionClient) throw new Error('resource introspection client missing');
          const live = await server.api.oauth2Introspect({ body: { token, client_id: introspectionClient.client_id, client_secret: introspectionClient.client_secret! } });
          if (!live.active) throw new Error('inactive access token');
          const ctx = createExecutionContext();
          response = await serveAuthorizedMcp(request, currentEnv, ctx, { userId: claims.sub!, clientId: String(claims.azp), scope: String(claims.scope).split(' ') });
          await waitOnExecutionContext(ctx);
        } catch { response = new Response(null, { status: 401 }); }
      }
    }
    else if (url.pathname.startsWith(path + '/')) response = await server.handler(request);
    else if (url.pathname.startsWith('/.well-known/')) response = new Response(null, { status: 404 });
    else { const ctx = createExecutionContext(); response = await app.fetch(request, currentEnv, ctx); await waitOnExecutionContext(ctx); }
    log.push({ path: url.pathname, status: response.status }); return response;
  };
  const login = await fetch(base + mount + '/studio/login', { method: 'POST', body: new URLSearchParams({ password: env.OWNER_PASSWORD }) });
  const ownerCookie = login.headers.get('set-cookie')!.split(';')[0];
  const verify = async (token: string, audience?: string) => {
    const metadata = await (await fetch(issuer + '/.well-known/openid-configuration')).json() as { jwks_uri: string };
    const keys = await (await fetch(metadata.jwks_uri)).json() as { keys: any[] };
    return (await jwtVerify(token, createLocalJWKSet(keys), { issuer, audience })).payload;
  };
  const introspect = async (token: string, cookie: string) => {
    introspectionClient ??= await server.api.createOAuthClient({ headers: new Headers({ cookie }), body: { client_name: 'resource oracle', redirect_uris: [base + '/resource-callback'], token_endpoint_auth_method: 'client_secret_post' } });
    return fetch(issuer + '/oauth2/introspect', { method: 'POST', body: new URLSearchParams({ token, client_id: introspectionClient.client_id, client_secret: introspectionClient.client_secret! }) });
  };
  const disableClient = async (clientId: string, cookie: string) => {
    const session = await server.api.getSession({ headers: new Headers({ cookie }) });
    if (session?.user.id !== 'owner') throw new Error('owner session required');
    // The native self-service update API cannot edit an unowned DCR client.
    // Owner administration uses Better Auth's schema-aware database adapter.
    await context.adapter.update({ model: 'oauthClient', where: [{ field: 'clientId', value: clientId }], update: { disabled: true } });
  };
  return { base, resource, fetch, ownerCookie, log, verifyIdToken: verify, verifyAccess: verify, introspect, disableClient };
}
