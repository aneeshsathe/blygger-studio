import type { OperationDefinition } from './operations.ts';
import { runOperation } from './operation-runner.ts';
import { success, failure, type OperationContext, type OperationInput, type OperationFailure } from './operation-types.ts';
import { operationHttp } from './operation-http.ts';
import { authLocations } from './oauth.ts';
import { READ_BATCH_PATHS, type ReadBatchOperation, type ReadBatchInput } from './read-batch-policy.ts';
import { packReadDatabase } from './read-batch-db.ts';

export async function executeReadBatch(definitions: Map<string, OperationDefinition>, context: OperationContext, input: OperationInput) {
  const { operation, requests } = input.body as { operation: ReadBatchOperation; requests: ReadBatchInput[] };
  const definition = definitions.get(operation);
  // Keep the opt-in inventory read-only even if a future route changes policy.
  if (!definition || definition.route.method !== 'get' || definition.route.path !== READ_BATCH_PATHS[operation] ||
      definition.route.policy.effects.writes.length || definition.route.policy.effects.network) {
    return failure('invalid-input', { error: 'Operation cannot be batched' });
  }
  const api = authLocations(context.url, context.env).api;
  const env = { ...context.env, DB: packReadDatabase(context.env.DB) };
  return success(await Promise.all(requests.map(async request => {
    const path = request.path ?? {}, query = request.query ?? {};
    let url = context.url, inputFailure: OperationFailure | undefined;
    try {
      const childUrl = new URL(api + definition.route.path.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(path[key] ?? '')));
      childUrl.search = new URLSearchParams(query).toString();
      url = childUrl.href;
    } catch (error) {
      if (!(error instanceof URIError)) throw error;
      inputFailure = failure('invalid-input', { error: 'Path contains invalid Unicode' });
    }
    // Invalid paths still pass through child permissions and admission charges.
    const result = await runOperation(definition, { path, query, inputFailure }, { ...context, env, url });
    return operationHttp(result, url, context.env);
  })));
}
