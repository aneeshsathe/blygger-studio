// Read-state limits (read-state.ts), apart so the studio UI can import them
// without the Worker's D1 types.

/** One request marks at most this many rows. Enough for a whole feed at once. */
export const READ_BATCH_MAX = 500;
/** Read versions are the origin's item versions; 32 bits is ample. */
export const READ_VERSION_MAX = 0xffffffff;
/** Longer ids cannot name an imported item; they are refused rather than looked up. */
export const READ_ID_MAX = 1024;
