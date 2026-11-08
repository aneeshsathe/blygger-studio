import type { Request } from '@playwright/test';

export function matchesGetItemBatch(request: Request, id: string): boolean {
  if (new URL(request.url()).pathname !== '/api/read-batch' || request.method() !== 'POST') return false;
  const body = request.postDataJSON() as { operation: string; requests: { path?: { id?: string } }[] };
  return body.operation === 'getItem' && body.requests.some(child => child.path?.id === id);
}
