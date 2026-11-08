import { createTransaction } from '@tanstack/react-db';
import { queryClient } from './query-client.ts';

/** Both DB transactions and server-only commands acknowledge persistence here. */
export interface MutationReceipt {
  when(state: 'settled'): Promise<unknown>;
}

export function serverMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  return (variables: TVariables) => queryClient.getMutationCache()
    .build(queryClient, { mutationFn, retry: false })
    .execute(variables);
}

/** Capture real source rows; an empty capture still persists through Query. */
export function createRowMutation<TVariables>(options: {
  onMutate: (variables: TVariables) => void;
  mutationFn: (variables: TVariables) => Promise<void>;
  scope?: (variables: TVariables) => string;
}): (variables: TVariables) => MutationReceipt {
  const tails = new Map<string, Promise<void>>();
  const runServer = serverMutation((run: () => Promise<void>) => run());
  return variables => {
    const key = options.scope?.(variables);
    let run!: () => Promise<void>;
    const transaction = createTransaction({
      autoCommit: false,
      mutationFn: async () => { await run(); },
    });
    try {
      transaction.mutate(() => options.onMutate(variables));
    } catch (error) {
      void transaction.when('settled').catch(() => undefined);
      transaction.rollback();
      throw error;
    }

    // Reserve order before Query's async mutation startup can yield to a
    // later DB transaction. Failed work releases the next intent too.
    const previous = key === undefined ? Promise.resolve() : tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const tail = new Promise<void>(resolve => { release = resolve; });
    if (key !== undefined) tails.set(key, tail);
    run = async () => {
      await previous;
      try {
        await options.mutationFn(variables);
      } finally {
        release();
        if (key !== undefined && tails.get(key) === tail) tails.delete(key);
      }
    };

    if (transaction.mutations.length) {
      void transaction.commit().catch(() => undefined);
      return transaction;
    }
    // Release the empty DB transaction; it must not stand in for server work.
    void transaction.commit().catch(() => undefined);
    const settled = runServer(run);
    return { when: () => settled };
  };
}
