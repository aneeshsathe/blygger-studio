/** Blygger consent and replay records in the deployment's existing D1.
 * Expiry is checked on reads, not left to a background cleanup task. */
export class OAuthStorage {
  constructor(private readonly db: D1Database) {}
  async get(key: string, options?: string | { type?: string }) {
    const row = await this.db.prepare('SELECT value FROM oauth_records WHERE key = ? AND (expires IS NULL OR expires > ?)')
      .bind(key, Math.floor(Date.now() / 1000)).first<{ value: string }>();
    if (!row) return null;
    const type = typeof options === 'string' ? options : options?.type;
    if (type === 'json') return JSON.parse(row.value);
    if (type === 'arrayBuffer') return new TextEncoder().encode(row.value).buffer;
    if (type === 'stream') return new Response(row.value).body;
    return row.value;
  }
  async put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }) {
    if (typeof value !== 'string') throw new TypeError('OAuth records must be strings');
    const expires = options?.expiration ?? (options?.expirationTtl === undefined ? null : Math.floor(Date.now() / 1000) + options.expirationTtl);
    await this.db.prepare('INSERT INTO oauth_records(key, value, expires) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires=excluded.expires')
      .bind(key, value, expires).run();
  }
  async delete(key: string) { await this.db.prepare('DELETE FROM oauth_records WHERE key = ?').bind(key).run(); }
  async list(options: { prefix?: string; limit?: number; cursor?: string } = {}) {
    const prefix = options.prefix ?? '';
    const after = options.cursor ? decodeURIComponent(options.cursor) : '';
    const limit = Math.max(1, Math.min(options.limit ?? 1000, 1000));
    const { results } = await this.db.prepare('SELECT key AS name, expires AS expiration FROM oauth_records WHERE key >= ? AND key < ? AND key > ? AND (expires IS NULL OR expires > ?) ORDER BY key LIMIT ?')
      .bind(prefix, prefix + '\uffff', after, Math.floor(Date.now() / 1000), limit + 1).all<{ name: string; expiration: number | null }>();
    const complete = results.length <= limit;
    const keys = results.slice(0, limit).map(row => ({ name: row.name, ...(row.expiration === null ? {} : { expiration: row.expiration }) }));
    return { keys, list_complete: complete, cursor: complete ? '' : encodeURIComponent(keys.at(-1)!.name), cacheStatus: null };
  }
}
