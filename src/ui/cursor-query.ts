import { createCursorPager } from '@tanstack/query-db-collection';
import type { QueryClient, QueryKey } from '@tanstack/query-core';
import { BlyggerApiError } from '../../sdk/dist/browser.js';

export interface ApiPage<T> {
  items: T[];
  page: { limit: number; nextCursor: string | null };
}

/** Query owns page acquisition. The key identifies a sequence, not a window. */
export async function readCursorWindow<T>(options: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  window: { offset?: number; limit?: number };
  signal: AbortSignal;
  read: (cursor: string | undefined, signal: AbortSignal) => Promise<ApiPage<T>>;
  validate?: (page: ApiPage<T>) => void;
}): Promise<T[]> {
  const pager = createCursorPager({
    queryClient: options.queryClient,
    queryKey: options.queryKey,
    staleTime: Infinity,
    fetchPage: async (cursor, signal) => {
      const result = await options.read(cursor, signal);
      options.validate?.(result);
      return { rows: result.items, nextCursor: result.page.nextCursor };
    },
  });
  try {
    return await pager.read(options.window, options.signal);
  } catch (error) {
    if (!(error instanceof BlyggerApiError) || error.statusCode !== 409 ||
        !error.body || typeof error.body !== 'object' || !('code' in error.body) || error.body.code !== 'cursor-expired') throw error;
    options.signal.throwIfAborted();
    // Discard the entire failed acquisition. Never join pages from two generations.
    pager.reset();
    return pager.read(options.window, options.signal);
  }
}
