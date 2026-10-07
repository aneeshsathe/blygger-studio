/** Fixed domains shared by the API and Studio. Adding a response dependency
 * requires its trigger and receiving witness, not a caller invalidation hook. */
export const CHANGE_DOMAINS = ['items', 'reading', 'subscriptions', 'hoppers', 'signals', 'settings', 'feed'] as const;
export type ChangeDomain = typeof CHANGE_DOMAINS[number];
export type ChangeState = { epoch: string; domains: Record<ChangeDomain, number> };
