import {
  createCollection,
  createLiveQueryCollection,
  and,
  gte,
  lt,
} from '@tanstack/react-db';
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from '@tanstack/query-db-collection';
import { QueryClient, type QueryFunction, type QueryFunctionContext } from '@tanstack/query-core';
import type {
  ListItemsResponses,
  GetItemResponses,
  Settings,
  Subscription,
  Hopper,
  SignalRow,
  ListReadingResponses,
  UpdateItemData,
  GetHopperResponses,
} from '../../sdk/dist/browser.js';
import {
  BlyggerApi,
  createBlyggerClient,
  unwrap,
} from '../../sdk/dist/browser.js';
import { Polling } from './polling.ts';
import { readIfChanged, type CachedResponse } from './revision-query.ts';
import type { ChangeDomain } from '../change-state.ts';
import { scoped } from './scoped.ts';

export const client = createBlyggerClient({ baseUrl: location.origin });
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
queryClient.mount();
// Poll errors are view state, not replacements for cached rows or local drafts.
export const polling = new Polling(
  () => document.visibilityState === 'visible',
  (error) =>
    window.dispatchEvent(
      new CustomEvent('studio-read-error', { detail: error }),
    ),
);
polling.start(window, document);
function cachedQuery<T>(context: QueryFunctionContext, domain: ChangeDomain, load: QueryFunction<T>) {
  return readIfChanged(context, domain, ({ signal }) => unwrap(BlyggerApi.getChanges({ client, signal })), load);
}

async function pages<T>(
  read: (offset: number) => Promise<{ items: T[]; total: number }>,
) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await read(offset);
    rows.push(...page.items);
    if (offset + page.items.length >= page.total) return rows;
    if (!page.items.length)
      throw new Error('Collection ended before its declared total');
  }
}
export const items = createCollection(
  queryCollectionOptions({
    id: 'items',
    queryKey: ['items'],
    queryClient,
    getKey: (row: ListItemsResponses[200]['items'][number]) => row.id,
    queryFn: (context) =>
      cachedQuery(context, 'items', ({ signal }) =>
        pages((offset) =>
          unwrap(
            BlyggerApi.listItems({
              client,
              query: { offset, limit: 100 },
              signal,
            }),
          ),
        ),
      ),
    select: (response) => response.data,
    onUpdate: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const changes = mutation.changes;
        const body: UpdateItemData['body'] = {};
        for (const field of ['content_md', 'responses', 'highlight', 'stub_of'] as const)
          if (field in changes)
            Object.assign(body, { [field]: changes[field] });
        if (changes.kind === 'fragment' || changes.kind === 'thread')
          body.kind = changes.kind;
        await unwrap(
          BlyggerApi.updateItem({
            client,
            path: { id: mutation.key as string },
            body,
          }),
        );
      }
    },
    onDelete: async ({ transaction }) => {
      for (const mutation of transaction.mutations)
        await unwrap(
          BlyggerApi.deleteItem({
            client,
            path: { id: mutation.key as string },
          }),
        );
    },
  }),
);
export const settings = createCollection(
  queryCollectionOptions({
    id: 'settings',
    queryKey: ['settings'],
    queryClient,
    getKey: (row: Settings & { key: string }) => row.key,
    queryFn: (context) =>
      cachedQuery(context, 'settings', async ({ signal }) => [
        {
          ...(await unwrap(BlyggerApi.getSettings({ client, signal }))),
          key: 'settings',
        },
      ],
      ),
    select: (response) => response.data,
    onUpdate: async ({ transaction }) => {
      for (const { changes } of transaction.mutations) {
        const { key: _key, ...body } = changes;
        await unwrap(BlyggerApi.updateSettings({ client, body }));
      }
    },
  }),
);
export const subscriptions = createCollection(
  queryCollectionOptions({
    id: 'subscriptions',
    queryKey: ['subscriptions'],
    queryClient,
    getKey: (row: Subscription) => row.id,
    queryFn: (context) =>
      cachedQuery(context, 'subscriptions', ({ signal }) =>
        pages((offset) =>
          unwrap(
            BlyggerApi.listSubscriptions({
              client,
              query: { offset, limit: 100 },
              signal,
            }),
          ),
        ),
      ),
    select: (response) => response.data,
    onUpdate: async ({ transaction }) => {
      for (const { key, changes } of transaction.mutations)
        await unwrap(
          BlyggerApi.updateSubscription({
            client,
            path: { id: key as string },
            body: {
              ...(changes.title !== undefined ? { title: changes.title } : {}),
              ...(changes.in_blogroll !== undefined
                ? { in_blogroll: changes.in_blogroll }
                : {}),
              ...(changes.status !== undefined
                ? { paused: changes.status === 'paused' }
                : {}),
            },
          }),
        );
    },
    onDelete: async ({ transaction }) => {
      for (const { key } of transaction.mutations)
        await unwrap(
          BlyggerApi.deleteSubscription({
            client,
            path: { id: key as string },
          }),
        );
    },
  }),
);
export const hoppers = createCollection(
  queryCollectionOptions({
    id: 'hoppers',
    queryKey: ['hoppers'],
    queryClient,
    getKey: (row: Hopper) => row.id,
    queryFn: (context) =>
      cachedQuery(context, 'hoppers', ({ signal }) =>
        pages((offset) =>
          unwrap(
            BlyggerApi.listHoppers({
              client,
              query: { offset, limit: 100 },
              signal,
            }),
          ),
        ),
      ),
    select: (response) => response.data,
    onUpdate: async ({ transaction }) => {
      for (const { key, changes } of transaction.mutations)
        await unwrap(
          BlyggerApi.updateHopper({
            client,
            path: { id: String(key) },
            body: {
              ...(changes.name !== undefined ? { name: changes.name } : {}),
              ...(changes.public !== undefined
                ? { public: changes.public }
                : {}),
            },
          }),
        );
    },
    onDelete: async ({ transaction }) => {
      for (const { key } of transaction.mutations)
        await unwrap(
          BlyggerApi.deleteHopper({ client, path: { id: String(key) } }),
        );
    },
  }),
);
export const signals = createCollection(
  queryCollectionOptions({
    id: 'signals',
    queryKey: ['signals'],
    queryClient,
    getKey: (row: SignalRow) => JSON.stringify([row.subscription_id, row.remote_id]),
    queryFn: (context) =>
      cachedQuery(context, 'signals', ({ signal }) =>
        pages((offset) =>
          unwrap(
            BlyggerApi.listSignals({
              client,
              query: { offset, limit: 100 },
              signal,
            }),
          ),
        ),
      ),
    select: (response) => response.data,
  }),
);
export type Detail = GetItemResponses[200];

function detailCollection(id: string) {
  return createCollection(
    queryCollectionOptions({
      id: `item:${id}`,
      queryKey: ['item', id],
      queryClient,
      getKey: (row: Detail) => row.id,
      queryFn: (context) =>
        cachedQuery(context, 'items', async ({ signal }) => [
          await unwrap(BlyggerApi.getItem({ client, path: { id }, signal })),
        ],
        ),
      select: (response) => response.data,
      onUpdate: async ({ transaction }) => {
        for (const { changes } of transaction.mutations)
          await unwrap(
            BlyggerApi.updateItem({
              client,
              path: { id },
              body: { content_md: changes.content_md },
            }),
          );
      },
    }),
  );
}
export const itemDetail = scoped(detailCollection);
export type Reading = ListReadingResponses[200]['items'][number] & {
  rank: number;
};
/**
 * Reading lenses (0.25.0). "threads" and "fragments" narrow a timeline and its
 * counts by kind; "background" and "smart" are placeholders for features that
 * are not built yet (procedural updates with ignyr; the AI-ranked feed).
 */
export const LENSES = ['all', 'threads', 'fragments', 'background', 'smart'] as const;
export type Lens = (typeof LENSES)[number];
export const lensKind = (lens: Lens | undefined): 'thread' | 'fragment' | undefined =>
  lens === 'threads' ? 'thread' : lens === 'fragments' ? 'fragment' : undefined;
/**
 * The cache key for one source under one lens: the source alone for the
 * unfiltered view (so every existing key is unchanged), `sub~kind` otherwise.
 */
export const readingKey = (sub: string, lens?: Lens) => {
  const kind = lensKind(lens);
  return kind ? `${sub}~${kind}` : sub;
};
function readingCollection(key: string) {
  const [sub, kind] = key.split('~') as [string, 'thread' | 'fragment' | undefined];
  return createCollection(
    queryCollectionOptions({
      id: `reading:${key}`,
      syncMode: 'on-demand',
      queryKey: ['reading', key],
      queryClient,
      getKey: (row: Reading) => row.key,
      queryFn: (context) =>
        cachedQuery(context, 'reading', async ({ signal, meta }) => {
          const subset = parseLoadSubsetOptions(meta?.loadSubsetOptions);
          const start = subset.filters.find(
            (filter) =>
              filter.field.join('.') === 'rank' && filter.operator === 'gte',
          );
          const offset = typeof start?.value === 'number' ? start.value : 0;
          const limit = 25;
          return unwrap(
            BlyggerApi.listReading({
              client,
              query: { sub, offset, limit, ...(kind ? { kind } : {}) },
              signal,
            }),
          );
        },
        ),
      select: ({ data: page }: CachedResponse<ListReadingResponses[200]>) =>
        page.items.map((row, i) => ({ ...row, rank: page.offset + i })),
    }),
  );
}
export const reading = scoped(readingCollection);
function readingViewCollection(sub: string, offset: number) {
  const collection = reading(sub);
  return createLiveQueryCollection({
    id: `reading-view:${sub}:${offset}`,
    gcTime: 1_000,
    query: (q) =>
      q
        .from({ entry: collection })
        .where(({ entry }) =>
          and(gte(entry.rank, offset), lt(entry.rank, offset + 25)),
        )
        .orderBy(({ entry }) => entry.rank, 'asc'),
  });
}
const readingViews = scoped((key) => {
  const [sub, offset] = JSON.parse(key) as [string, number];
  return readingViewCollection(sub, offset);
});
export const readingView = (sub: string, offset: number) =>
  readingViews(JSON.stringify([sub, offset]));
export function refreshReading(sub: string) {
  return reading(sub).utils.refetch({ throwOnError: true });
}

function hopperDetailCollection(id: string) {
  return createCollection(
    queryCollectionOptions({
      id: `hopper:${id}`,
      queryKey: ['hopper', id],
      queryClient,
      getKey: (row: GetHopperResponses[200]) => row.hopper.id,
      queryFn: (context) =>
        cachedQuery(context, 'hoppers', async ({ signal }) => [
          await unwrap(BlyggerApi.getHopper({ client, path: { id }, signal })),
        ],
        ),
      select: (response) => response.data,
    }),
  );
}
export const hopperDetail = scoped(hopperDetailCollection);
// Cancel pending reads before invalidation, so earlier responses cannot replace
// acknowledged writes. Query collection mutation handlers own rollback on failure.
export async function changed(...keys: string[]) {
  await Promise.all(
    keys.map((key) => queryClient.cancelQueries({ queryKey: [key] })),
  );
  await Promise.all(
    keys.map((key) =>
      queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' }),
    ),
  );
}

export const updates = createCollection(
  queryCollectionOptions<Record<string, string>>({
    id: 'updates',
    queryKey: ['updates'],
    queryClient,
    getKey: (row) => row.key,
    queryFn: async ({ signal }) => [
      {
        ...(await unwrap(BlyggerApi.getUpdateState({ client, signal }))),
        key: 'updates',
      },
    ],
  }),
);

export const hopperPreview = scoped((id) =>
  createCollection(
    queryCollectionOptions({
      id: `hopper-preview:${id}`,
      queryKey: ['hopper-preview', id],
      queryClient,
      getKey: (row: GetHopperResponses[200]) => row.hopper.id,
      queryFn: (context) =>
        cachedQuery(context, 'hoppers', async ({ signal }) => [
          await unwrap(
            BlyggerApi.getHopper({
              client,
              path: { id },
              query: { preview: 'true' },
              signal,
            }),
          ),
        ],
        ),
      select: (response) => response.data,
    }),
  ),
);

export const authorizations = createCollection(queryCollectionOptions<import('../../sdk/dist/browser.js').Authorization>({
  id: 'authorizations', queryKey: ['authorizations'], queryClient, getKey: row => row.id,
  queryFn: async ({ signal }) => (await unwrap(BlyggerApi.listAuthorizations({ client, signal }))).items,
}));
