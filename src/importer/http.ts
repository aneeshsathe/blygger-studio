// Injectable fetch abstraction shared by every importer module (resolve,
// feed parser, poller). Decouples "final URL after redirects" from
// platform fetch()'s Response.url quirk (only populated by real network
// fetches) so resolution/poll logic is testable with plain deterministic
// fixture stubs, not a real HTTP layer. platformFetch below is the
// production implementation; tests inject their own FetchLike.

import { checkDestination, privateFetchAllowed } from "../outbound-policy.ts";
import type { Env } from "../types.ts";
import { GENERATOR } from "../types.ts";

export interface FetchResult {
  ok: boolean;
  status: number;
  /** Final URL after following redirects — the resolve-side identity input (§2.1). */
  url: string;
  headers: Headers;
  text(): Promise<string>;
  /** Production stream; optional for deterministic text-only network fixtures. */
  body?: ReadableStream<Uint8Array> | null;
}

export interface FetchInit {
  headers?: Record<string, string>;
  /** v0.3: Webmention discovery uses HEAD, and sending uses POST — the importer only ever GETs. */
  method?: string;
  body?: string;
}

export type FetchLike = (url: string, init?: FetchInit) => Promise<FetchResult>;

/** Every outbound importer request carries this (§4.2). */
export const IMPORTER_USER_AGENT = `${GENERATOR} (+https://blygger.org)`;

const IMPORT_MAX_BYTES = 4 * 1024 * 1024;
function importerFetch(allowPrivate: boolean): FetchLike {
  return async (url, init) => {
    let current = url;
    const signal = AbortSignal.timeout(10_000);
    for (let hop = 0; hop <= 3; hop++) {
      await checkDestination(current, allowPrivate, signal);
      signal.throwIfAborted();
      const res = await fetch(current, { redirect: 'manual', signal,
        method: init?.method ?? 'GET', body: init?.body,
        headers: { 'User-Agent': IMPORTER_USER_AGENT, ...(init?.headers ?? {}) },
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel(); current = new URL(location, current).toString(); continue;
      }
      return { ok: res.ok, status: res.status, url: current, headers: res.headers,
        text: async () => {
          if (!res.body) return '';
          const reader = res.body.getReader(), decoder = new TextDecoder();
          let bytes = 0, text = '';
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) return text + decoder.decode();
              bytes += value.byteLength;
              if (bytes > IMPORT_MAX_BYTES) { await reader.cancel(); throw new Error('import body exceeds 4 MiB'); }
              text += decoder.decode(value, { stream: true });
            }
          } finally { reader.releaseLock(); }
        },
      };
    }
    throw new Error('import redirect limit exceeded');
  };
}
export const platformFetch = importerFetch(false);
export const platformFetchFor = (env: Pick<Env, 'ALLOW_PRIVATE_FETCH'>): FetchLike => importerFetch(privateFetchAllowed(env));
