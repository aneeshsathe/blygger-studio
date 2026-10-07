/**
 * Webmention fetches are explicitly bounded to 1 MiB (src/mentions/http.ts and
 * v0.3-plan §2.3.5). Refusing after buffering an entire attacker response does
 * not satisfy the memory boundary. This oracle measures work, not elapsed time.
 * Model: at most the cap plus one incoming chunk is consumed; an oversized body
 * is cancelled. The independent driver supplies a real streaming fetch response
 * without Content-Length, passes it through mentionFetch then boundedText, and
 * observes pull/cancel counters. A small UTF-8 neighbor must remain readable.
 * Limits: fixed chunk sizes, local fetch seam; no deployed SSRF or memory claim.
 * Sources: OWASP SSRF and DoS guidance; limits here come from this client's own
 * documented fetch contract, not a universal protocol byte limit.
 * https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
 */
import { expect, it, vi } from 'vitest';
import { mentionFetch, boundedText, MAX_BODY_BYTES } from '../src/mentions/http.ts';

it('cancels an undeclared oversized Webmention body before buffering the whole response', async () => {
  let pulls = 0, cancelled = false;
  const chunk = new Uint8Array(MAX_BODY_BYTES / 2).fill(97);
  const stream = new ReadableStream<Uint8Array>({ pull(controller) {
    pulls++; controller.enqueue(chunk);
    if (pulls === 8) controller.close();
  }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response(stream));
  try {
    const response = await mentionFetch('https://publisher.example/mention');
    expect(await boundedText(response)).toBeNull();
    expect(pulls, 'bounded fetch cannot consume the entire oversized stream').toBeLessThanOrEqual(3);
    expect(cancelled, 'oversized body must cancel its producer').toBe(true);
  } finally { spy.mockRestore(); }
});
it('retains a valid multibyte Webmention body at the byte boundary', async () => {
  const text = 'é'.repeat(MAX_BODY_BYTES / 2);
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response(text));
  try { expect(await boundedText(await mentionFetch('https://publisher.example/mention'))).toBe(text); }
  finally { spy.mockRestore(); }
});

// Fork/freshness readers use the adapter's text() directly. Their caller shape
// must receive the same byte limit as Webmention's boundedText path.
it('direct Webmention text readers cannot bypass the streaming byte cap', async () => {
  let pulls = 0, cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ pull(controller) {
    pulls++; controller.enqueue(new Uint8Array(MAX_BODY_BYTES / 2));
    if (pulls === 8) controller.close();
  }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response(stream));
  try {
    await expect((await mentionFetch('https://publisher.example/')).text()).rejects.toThrow(/body exceeds/i);
    expect(pulls).toBeLessThanOrEqual(3); expect(cancelled).toBe(true);
  } finally { spy.mockRestore(); }
});

it('refuses one byte beyond the Webmention body boundary', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response('a'.repeat(MAX_BODY_BYTES + 1)));
  try { expect(await boundedText(await mentionFetch('https://publisher.example/mention'))).toBeNull(); }
  finally { spy.mockRestore(); }
});

// Import feeds have a separate 4 MiB policy. Exact neighbors reject a shifted
// threshold; a larger streaming body also verifies bounded producer work.
it('importer accepts exactly 4 MiB and refuses the next byte', async () => {
  const { platformFetch } = await import('../src/importer/http.ts');
  const cap = 4 * 1024 * 1024;
  for (const bytes of [cap, cap + 1]) {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).startsWith('https://cloudflare-dns.com/') ? Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) : new Response('a'.repeat(bytes)));
    try {
      const result = await platformFetch('https://publisher.example/feed');
      if (bytes === cap) expect((await result.text()).length).toBe(cap);
      else await expect(result.text()).rejects.toThrow(/body exceeds/i);
    } finally { spy.mockRestore(); }
  }
});
