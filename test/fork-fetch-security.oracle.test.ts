/**
 * Fork discovery intentionally reads a remote public item, but read scope does
 * not grant private-network access or dependency-error disclosure. OWASP SSRF:
 * https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 * Model: valid public destination returns only pinned choices; a private target
 * reaches no transport; dependency failures expose no sentinel secret. Driver:
 * real REST reader with an injected read capability after JWT verification, plus
 * deterministic public DNS/transport responses. Work counts replace latency.
 * Limits: DNS preflight does not pin the connection address; rebinding remains a
 * deployment gap. This does not claim public fetching itself is forbidden.
 */
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createOwnerApi } from '../src/owner-api.ts';
const app=new Hono().route('/api',createOwnerApi({scope:['owner:read'],clientId:'fork-reader',userId:'owner'}));
async function read(origin:string){const ctx=createExecutionContext();const response=await app.fetch(new Request('https://fork-review.example/api/fork-options?'+new URLSearchParams({origin,id:'00000000000000000000000001'})),env,ctx);await waitOnExecutionContext(ctx);expect(response.status).toBe(200);return response.text();}
it('bounded public fork discovery remains usable without a subscription',async()=>{
  let calls=0;
  const spy=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
    if(String(input).startsWith('https://cloudflare-dns.com/'))return Response.json({Status:0,Answer:[{type:1,data:'93.184.216.34'}]});
    calls++;return Response.json({changelog:[{version:1,at:'2026-10-01',note:null,pinned:true},{version:2,pinned:false}]});
  });
  try{expect(JSON.parse(await read('https://public-publisher.example/')).versions).toEqual([{version:1,at:'2026-10-01',note:null}]);expect(calls).toBe(1);}finally{spy.mockRestore();}
});
it('read-only fork discovery never reaches private network transport',async()=>{
  const spy=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('private bytes'));
  try{const body=await read('http://127.0.0.1/');expect(body).not.toContain('private bytes');expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
});
it('fork discovery does not echo dependency exception secrets',async()=>{
  const secret='disposable-transport-secret-sentinel';
  const spy=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
    if(String(input).startsWith('https://cloudflare-dns.com/'))return Response.json({Status:0,Answer:[{type:1,data:'93.184.216.34'}]});
    throw new Error(secret);
  });
  try{expect(await read('https://public-publisher.example/'),'transport exception text is not API data').not.toContain(secret);}finally{spy.mockRestore();}
});
