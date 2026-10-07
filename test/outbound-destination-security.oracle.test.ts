/**
 * User ruling: public destinations by default; private/LAN fetches require an
 * explicit deployment opt-in. OWASP SSRF advice covers canonical IP parsing,
 * every redirect destination, DNS answers and credentials in user-supplied URLs:
 * https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 * Model: these literal/special-name targets never reach the network; a public
 * target works. Both importer and Webmention production adapters receive the
 * same corpus. Fetch is a recorder, not a security classifier. All responses
 * are synthetic, so no private network or live deployment is contacted.
 * Limits: fixed addresses/redirects; DNS rebinding between check and connect is
 * an unresolved network-layer boundary, not proven by URL rejection.
 */
import { expect, it, vi } from 'vitest';
import { platformFetch } from '../src/importer/http.ts';
import { mentionFetch } from '../src/mentions/http.ts';
const blocked = ['http://localhost/private', 'http://localhost./private', 'http://127.1/private', 'http://2130706433/private', 'http://0x7f000001/private', 'http://10.0.0.1/private', 'http://172.16.0.1/private', 'http://192.168.1.1/private', 'http://169.254.169.254/latest/meta-data', 'http://[::1]/private', 'http://[::ffff:127.0.0.1]/private', 'http://[fc00::1]/private', 'https://printer.local/private', 'https://user:password@public.example/private'];
for (const [name, subject] of [['importer', platformFetch], ['webmention', mentionFetch]] as const) {
  it.each(blocked)(name + ' denies restricted destination %s before network work', async url => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('private target reached'));
    try {
      await expect(subject(url), 'restricted destination must be rejected').rejects.toThrow(/destination/i);
      expect(spy).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); }
  });
}
it('Webmention rechecks a redirect from a public host to a private target', async () => {
  const seen: string[] = [];
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const url = String(input instanceof Request ? input.url : input); seen.push(url);
    if (url.startsWith('https://cloudflare-dns.com/')) return Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] });
    return seen.filter(value => !value.startsWith('https://cloudflare-dns.com/')).length === 1 ? new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/private' } }) : new Response('private target reached');
  });
  try {
    await expect(mentionFetch('https://publisher.example/mention'), 'redirect destination must be rejected').rejects.toThrow(/destination/i);
    expect(seen).not.toContain('http://127.0.0.1/private');
  } finally { spy.mockRestore(); }
});

it.each([{ addresses: ['127.0.0.1'] }, { addresses: ['93.184.216.34', '10.0.0.1'] }, { addresses: ['::ffff:127.0.0.1'] }, { addresses: ['fd00::1'] }])('denies hostnames with restricted DNS answers: %j', async ({ addresses }) => {
  const destinations: string[] = [];
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const url = String(input); destinations.push(url);
    return url.startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: addresses.map(data => ({ type: data.includes(':') ? 28 : 1, data })) }) : new Response('private target reached');
  });
  try {
    for (const subject of [platformFetch, mentionFetch]) await expect(subject('https://publisher.example/')).rejects.toThrow(/destination/i);
    expect(destinations.every(url => url.startsWith('https://cloudflare-dns.com/')), 'restricted DNS must deny before destination fetch').toBe(true);
  } finally { spy.mockRestore(); }
});
it('the explicit LAN opt-in preserves local subscriptions and mentions', async () => {
  const { platformFetchFor } = await import('../src/importer/http.ts');
  const { mentionFetchFor } = await import('../src/mentions/http.ts');
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('LAN neighbor'));
  try {
    for (const subject of [platformFetchFor({ ALLOW_PRIVATE_FETCH: 'true' }), mentionFetchFor({ ALLOW_PRIVATE_FETCH: 'true' })]) expect(await (await subject('http://127.0.0.1/feed')).text()).toBe('LAN neighbor');
    expect(spy).toHaveBeenCalledTimes(2);
  } finally { spy.mockRestore(); }
});
it('public DNS neighbors still reach the importer and mentions transport', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response('Public neighbor'));
  try { for (const subject of [platformFetch, mentionFetch]) expect(await (await subject('https://publisher.example/')).text()).toBe('Public neighbor'); }
  finally { spy.mockRestore(); }
});
