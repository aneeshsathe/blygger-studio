/**
 * Immutable tool schemas belong to the isolate; credentials belong to a request.
 * Count schema conversion rather than elapsed time. Two differently scoped
 * requests must reuse schema descriptions without sharing tool visibility.
 * This work bound is an implementation policy. The MCP capability oracle owns
 * the complete tool inventory and native credential validation remains separate.
 */
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { expect, it } from 'vitest';
import { z } from 'zod';
import { serveAuthorizedMcp } from '../src/mcp.ts';
it('reuses immutable tool schemas without sharing request permissions', async () => {
  const original = z.toJSONSchema; let conversions = 0;
  Object.defineProperty(z, 'toJSONSchema', { value: (...args: Parameters<typeof original>) => { conversions++; return original(...args); } });
  try {
    const list = async (scope: string[]) => {
      const ctx = createExecutionContext();
      const request = new Request('https://mcp-work.example.test/blyg/studio/mcp', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } }),
      });
      const response = await serveAuthorizedMcp(request, env, ctx, { scope, clientId: 'oracle', userId: 'owner' });
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      const value = await response.json() as { result: { tools: { name: string }[] } };
      return value.result.tools.map(tool => tool.name);
    };
    const read = await list(['owner:read']), draft = await list(['owner:draft']);
    expect(read).toContain('getSettings'); expect(read).not.toContain('createItem');
    expect(draft).toContain('createItem'); expect(draft).not.toContain('getSettings');
    expect(conversions, 'requests must reuse isolate tool schemas').toBe(0);
  } finally { Object.defineProperty(z, 'toJSONSchema', { value: original }); }
});
