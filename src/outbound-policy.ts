import ipaddr from 'ipaddr.js';
import type { Env } from './types.ts';

const DNS_ORIGIN = 'https://cloudflare-dns.com/dns-query';
function publicAddress(host: string) {
  try { return ipaddr.process(host.replace(/^\[|\]$/g, '')).range() === 'unicast'; }
  catch { return false; }
}
/** Validate each hop before fetch. No credentials are sent to supplied URLs. */
export async function checkDestination(raw: string, allowPrivate = false, signal?: AbortSignal) {
  const url = new URL(raw), host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('outbound destination is not permitted');
  if (allowPrivate) return;
  const literal = host.replace(/^\[|\]$/g, '');
  if (ipaddr.isValid(literal)) {
    if (!publicAddress(literal)) throw new Error('private outbound destination requires ALLOW_PRIVATE_FETCH=true');
    return;
  }
  if (!host.includes('.') || /(?:^|\.)(?:localhost|local|internal|lan|home|test)$/.test(host)) throw new Error('private outbound destination requires ALLOW_PRIVATE_FETCH=true');
  // Reject mixed public/private answers too: fetch may choose either family.
  // This preflight does not pin fetch's later DNS resolution. A production
  // egress boundary must also block private addresses at connection time.
  const answers = await Promise.all([1, 28].map(async type => {
    const query = new URL(DNS_ORIGIN); query.search = new URLSearchParams({ name: host, type: String(type) }).toString();
    // 'manual', never 'error': the Workers runtime rejects redirect: 'error'
    // outright, which failed every check (and so every poll and mention) in
    // 0.28.0-0.28.2. A redirect still fails closed: it is not 200.
    const response = await fetch(query, { headers: { Accept: 'application/dns-json' }, signal: signal ?? AbortSignal.timeout(5000), redirect: 'manual' });
    if (response.status !== 200) throw new Error('outbound destination DNS validation failed');
    const value = await response.json() as { Status?: number; Answer?: { type: number; data: string }[] };
    if (value.Status !== 0) throw new Error('outbound destination DNS validation failed');
    return (value.Answer ?? []).filter(record => record.type === 1 || record.type === 28).map(record => record.data);
  }));
  const addresses = answers.flat();
  if (!addresses.length || addresses.some(address => !publicAddress(address))) throw new Error('outbound destination has no exclusively public addresses');
}
export function privateFetchAllowed(env: Pick<Env, 'ALLOW_PRIVATE_FETCH'>) { return env.ALLOW_PRIVATE_FETCH === 'true'; }
