import { routes } from './contract/routes.ts';

import type { OwnerScope } from './auth-scopes.ts';
export { OWNER_SCOPES, SCOPE_DESCRIPTIONS } from './auth-scopes.ts';
export interface OwnerAccess { scope: string[]; clientId: string; userId: string; grantId?: string }
const draft = new Set(['createItem', 'updateItem', 'deleteItem', 'restoreItem', 'uploadMedia', 'generateItem', 'draftNote', 'preview']);
const publish = new Set(['publishItem', 'withdrawItem', 'pinItem', 'refreshItem', 'deleteMedia']);
// Read state is low-stakes, reversible bookkeeping: a sync-only reader app should not
// need the grant that can also delete subscriptions (studio#45, session 43).
const readState = new Set(['markRead', 'markUnread', 'markReadBatch', 'markUnreadBatch']);
export function operationScopes(operation: string): OwnerScope[] {
  const route = routes[operation as keyof typeof routes];
  if (!route) throw new Error(`Unknown operation: ${operation}`);
  if (route.method === 'get') return ['owner:read'];
  if (draft.has(operation)) return ['owner:draft'];
  if (publish.has(operation)) return ['owner:publish'];
  if (readState.has(operation)) return ['reading:state'];
  return ['owner:manage'];
}
// Use the route patterns Hono actually matched, not a second URL router.
const registeredOperations = new Map(Object.entries(routes).map(([id, route]) => [
  `${route.method.toUpperCase()} /api${route.path.replace(/\{(\w+)\}/g, ':$1')}`,
  [id, route] as const,
]));
export function matchOperation(method: string, paths: Iterable<string>) {
  const verb = method === 'HEAD' ? 'GET' : method.toUpperCase();
  for (const path of paths) {
    const operation = registeredOperations.get(`${verb} ${path}`);
    if (operation) return operation;
  }
}
