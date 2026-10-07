/**
 * Consent must identify the registered return destination, not only an unverified
 * display name. RFC8252 §§7.1–7.3 permits private-use schemes and loopback URIs:
 * https://www.rfc-editor.org/rfc/rfc8252#section-7
 * RFC9700 §4.1 requires exact redirect matching; displaying only host erases the
 * application scheme or callback path even when matching is correct:
 * https://www.rfc-editor.org/rfc/rfc9700#section-4.1
 * Model: the owner sees the whole validated callback for every allowed native
 * destination, including scheme/path/port. Driver: actual DCR and authorize with
 * the ordinary S256 fixture. Limits: disclosure does not prove app identity or
 * prevent another local app from intercepting a custom scheme.
 */
import { expect, it } from 'vitest';
import { flow } from './oauth-flow-driver.ts';
it.each(['org.example.editor:/oauth/callback', 'http://127.0.0.1:54321/editor/callback'])('consent identifies the exact native destination %s', async redirect => {
  const f = await flow();
  const registered = await f.request(f.issuer + '/oauth2/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({client_name:'Native editor', application_type:'native', redirect_uris:[redirect], token_endpoint_auth_method:'none'}) });
  expect(registered.status, 'fixture must use an allowed registered native callback').toBe(201);
  const {client_id}=await registered.json() as {client_id:string};
  const authorize=new URL(f.authorize); authorize.searchParams.set('client_id',client_id);authorize.searchParams.set('redirect_uri',redirect);
  const consent=await f.request(authorize.href,{headers:{cookie:f.owner}});expect(consent.status).toBe(200);
  const html=await consent.text(); expect(html, 'owner consent must identify scheme and callback path').toContain('<strong>'+redirect+'</strong>');
});
