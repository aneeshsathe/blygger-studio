// The outbound DNS preflight must run on the Workers runtime as deployed, not
// only under a permissive fetch mock. Production fetch rejects
// redirect: 'error' ("won't be implemented since it does not make sense at the
// edge"); 0.28.0-0.28.2 passed it, so every check threw and every feed poll
// and Webmention failed. This stub refuses it the way the edge does.
import { afterEach, expect, it, vi } from "vitest";
import { checkDestination } from "../src/outbound-policy.ts";

afterEach(() => vi.restoreAllMocks());
function edgeFetch(doh: (url: string) => Response) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (init?.redirect === "error") throw new TypeError('Invalid redirect value, must be one of "follow" or "manual"');
    return doh(String(input));
  });
}

it("admits a public host using only redirect modes the edge supports", async () => {
  edgeFetch(() => Response.json({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34" }] }));
  await expect(checkDestination("https://feeds.example.org/feed.xml")).resolves.toBeUndefined();
});

it("still fails closed when the DNS service answers with a redirect", async () => {
  edgeFetch(() => new Response(null, { status: 302, headers: { Location: "https://elsewhere.example/" } }));
  await expect(checkDestination("https://feeds.example.org/feed.xml")).rejects.toThrow("DNS validation failed");
});
