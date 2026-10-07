/**
 * A scheduler seam must hold a real production transition rather than emulate it.
 * This driver supports verify-auth-security-race.ts's grant-replay law.
 * It wraps D1 statements, lets native rotation claim complete, then holds the
 * request outside that SQL call before successor insertion. The service gate
 * creates one legal race ordering without a timing sleep or fake token decision.
 * The SQL selector is a dependency-version seam: if native code stops reaching it,
 * the race verifier must reject the setup, not claim a security RED.
 * No scheduler endpoint or header handling enters the release entrypoint.
 */
import { makeApp } from '../src/index.ts';
import type { Env } from '../src/types.ts';

// Compiled only by verify-auth-security-race.ts. The release entrypoint never
// imports this file or exposes its scheduler seam.
export default {
  async fetch(request: Request, env: Env & { ORACLE_GATE: Fetcher }, ctx: ExecutionContext) {
    let paused = false;
    const gate = request.headers.get('x-oracle-gate');
    const statement = (prepared: D1PreparedStatement, sql: string): D1PreparedStatement => new Proxy(prepared, {
      get(target, key) {
        if (key === 'bind') return (...values: unknown[]) => statement(target.bind(...values), sql);
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        return async (...args: unknown[]) => {
          const result = await value.apply(target, args);
          // Pause outside the completed SQL call, after the native atomic
          // rotation claim, before native successor insertion. No timing sleep.
          if (gate && !paused && /^update\s+"?oauthRefreshToken"?/i.test(sql) && /rotatedAt/.test(sql)) {
            paused = true;
            await env.ORACLE_GATE.fetch('https://scheduler.invalid/' + gate);
          }
          return result;
        };
      },
    });
    const database = new Proxy(env.DB, { get(target, key) {
      if (key === 'prepare') return (sql: string) => statement(target.prepare(sql), sql);
      const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
    } });
    return makeApp('/blyg').fetch(request, { ...env, DB: database }, ctx);
  },
};
