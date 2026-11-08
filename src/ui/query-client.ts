import { BasicIndex } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/query-core';

export const collectionRefreshOptions = {
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  refetchOnWindowFocus: 'always',
  refetchOnReconnect: 'always',
} as const;

/** Live collections opt in; ordinary queries never inherit a polling timer. */
export const collectionPollingOptions = {
  ...collectionRefreshOptions,
  refetchInterval: 15_000,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});
