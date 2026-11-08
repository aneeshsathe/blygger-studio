/** Opt-in JSON reads. The contract and client matcher share these paths. */
export const READ_BATCH_PATHS = {
  getItem: '/items/{id}',
  listMentionGroups: '/mention-groups',
  listMentions: '/mentions',
  getMentionSummary: '/mentions/summary',
} as const;
export type ReadBatchOperation = keyof typeof READ_BATCH_PATHS;
export const READ_BATCH_OPERATIONS = Object.keys(READ_BATCH_PATHS) as ReadBatchOperation[];
export const READ_BATCH_MAX = 50;
export interface ReadBatchInput { path?: Record<string, string>; query?: Record<string, string> }
