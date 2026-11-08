import { BlyggerApi, unwrap } from '../../sdk/dist/browser.js';
import type { AddHopperItemData, CreateAuthorizationData, CreateItemData, CreateSubscriptionData, LogBrowseData, UploadMediaData } from '../../sdk/dist/browser.js';
import { authorizations, browse, changed, client, hoppers, items, markReading, subscriptions } from './data.ts';
import { serverMutation } from './mutation.ts';
import { sourceSchemas } from './data-schemas.ts';
import { retryAfterMs, runImport, type Attempt, type ImportSummary, type OpmlFeed, type RowStatus } from './opml.ts';
import type { ReadWrite, UnreadWrite } from './read-state.ts';

export const uploadMedia = serverMutation((body: UploadMediaData['body']) =>
  unwrap(BlyggerApi.uploadMedia({ client, body })));

export const createItem = serverMutation(async (body: CreateItemData['body']) => {
  const item = await unwrap(BlyggerApi.createItem({ client, body }));
  await items.utils.writeUpsert(sourceSchemas.items.parse({ ...item, pins: [] }));
  // Creation is confirmed by its returned row; a failed count refresh must
  // not make a retry create another item.
  await Promise.allSettled([changed('item-summary')]);
  return item;
});

export const createSubscription = serverMutation(async (body: CreateSubscriptionData['body']) => {
  const result = await unwrap(BlyggerApi.createSubscription({ client, body }));
  if (!('needsConfirm' in result)) await subscriptions.utils.writeUpsert(result);
  // Native collection polling observes the server's background backfill.
  return result;
});

export const resyncSubscription = serverMutation(async (id: string) => {
  const result = await unwrap(BlyggerApi.resyncSubscription({ client, path: { id } }));
  await changed('subscriptions', 'reading');
  return result;
});

export const pollSubscriptions = serverMutation(async (_: void) => {
  // The server polls in the background. Active collections already poll every 15s.
  return unwrap(BlyggerApi.pollAllSubscriptions({ client }));
});

export const createHopper = serverMutation(async (name: string) => {
  const hopper = await unwrap(BlyggerApi.createHopper({ client, body: { name } }));
  await hoppers.utils.writeUpsert(hopper);
  return hopper;
});

export const addHopperItem = serverMutation(async (path: AddHopperItemData['path']) => {
  await unwrap(BlyggerApi.addHopperItem({ client, path }));
  await changed('hoppers');
});

export const removeHopperItem = serverMutation(async (path: AddHopperItemData['path']) => {
  await unwrap(BlyggerApi.removeHopperItem({ client, path }));
  await changed('hoppers');
});

export const markUnheldRead = (writes: { read: ReadWrite[]; unread: UnreadWrite[] }) =>
  markReading({ keys: [], read: true, writes }).when('settled');

export const logBrowse = serverMutation(async ({ body, onLogged }: {
  body: LogBrowseData['body']; onLogged: (id: number) => void;
}) => {
  const result = await unwrap(BlyggerApi.logBrowse({ client, body }));
  // The next step can name this parent as soon as its write is acknowledged.
  onLogged(result.id);
  await changed('browse');
  return result;
});

export const clearBrowse = serverMutation(async (_: void) => {
  await unwrap(BlyggerApi.clearBrowse({ client }));
  await browse.utils.writeDelete([...browse.keys()]);
  await changed('browse');
});

export const createAuthorization = serverMutation(async (body: CreateAuthorizationData['body']) => {
  const result = await unwrap(BlyggerApi.createAuthorization({ client, body }));
  await authorizations.utils.writeUpsert(result.authorization);
  return result;
});

export const revokeAuthorization = serverMutation(async (id: string) => {
  if (id === 'all') await unwrap(BlyggerApi.revokeAllAuthorizations({ client }));
  else await unwrap(BlyggerApi.revokeAuthorization({ client, path: { id } }));
  await changed('authorizations');
});

/** Preserve per-feed failures and retry budgets while confirming a partial import. */
export const importFeeds = serverMutation(async (options: {
  feeds: OpmlFeed[];
  known: (feed: OpmlFeed) => boolean;
  blogroll: boolean;
  onRow: (index: number, status: RowStatus) => void;
  onImported: (summary: ImportSummary) => void;
  shouldStop: () => boolean;
}) => {
  const result = await runImport(options.feeds, {
    known: options.known,
    subscribe: feed => importAttempt(BlyggerApi.createSubscription({ client, body: { url: feed.xmlUrl, confirm: true, backfill: false } })),
    afterAdd: options.blogroll
      ? id => importAttempt(BlyggerApi.updateSubscription({ client, path: { id }, body: { inBlogroll: true } }))
      : undefined,
    onRow: options.onRow,
    shouldStop: options.shouldStop,
  });
  options.onImported(result);
  await changed('subscriptions', 'reading');
  return result;
});

async function importAttempt(pending: Promise<{ data?: unknown; error?: unknown; response?: Response }>): Promise<Attempt> {
  const result = await pending;
  const response = result.response;
  if (!response) return { kind: 'failed', reason: result.error instanceof Error ? result.error.message : 'network error' };
  const error = result.error;
  const reason = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message : `request failed (${response.status})`;
  if (response.status === 409) return { kind: 'exists', message: reason };
  if (response.status === 429) return { kind: 'throttled', retryAfterMs: retryAfterMs(response.headers.get('Retry-After')) };
  if (!response.ok) return { kind: 'failed', reason };
  const data = result.data;
  if (data && typeof data === 'object' && 'needsConfirm' in data) return { kind: 'failed', reason: 'the server asked for confirmation' };
  return { kind: 'ok', id: data && typeof data === 'object' && 'id' in data ? String(data.id) : undefined };
}
