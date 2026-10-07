/** Handwritten receiving witnesses for the SQLite prototype's nine-table event
 * envelope. These expected domains come from response dependencies, not the
 * production trigger generator. Working-copy edits deliberately exclude Reading.
 */
export const triggerFamilies = [
  { table: 'items', insert: "INSERT INTO items(id,created,updated) VALUES('matrix-item','t','t')", update: "UPDATE items SET status='public',version=1 WHERE id='matrix-item'", remove: "DELETE FROM items WHERE id='matrix-item'", domains: ['items', 'reading', 'feed'] },
  { table: 'versions', insert: "INSERT INTO versions(item_id,version,content_md,content_hash,published_at) VALUES('matrix-item',1,'body','hash','t')", update: "UPDATE versions SET note='new' WHERE item_id='matrix-item'", remove: "DELETE FROM versions WHERE item_id='matrix-item'", domains: ['items', 'reading', 'feed'] },
  { table: 'media', insert: "INSERT INTO media(id,item_id,r2_key,mime,created) VALUES('matrix-media','matrix-item','/media/matrix','image/png','t')", update: "UPDATE media SET alt='alt' WHERE id='matrix-media'", remove: "DELETE FROM media WHERE id='matrix-media'", domains: ['items', 'feed'] },
  { table: 'settings', insert: "INSERT INTO settings(key,value) VALUES('timezone','UTC')", update: "UPDATE settings SET value='America/Denver' WHERE key='timezone'", remove: "DELETE FROM settings WHERE key='timezone'", domains: ['settings', 'feed'] },
  { table: 'subscriptions', insert: "INSERT INTO subscriptions(id,kind,origin,feed_url,created) VALUES('matrix-sub','blyg','https://matrix/','https://matrix/feed.xml','t')", update: "UPDATE subscriptions SET origin='https://changed/' WHERE id='matrix-sub'", remove: "DELETE FROM subscriptions WHERE id='matrix-sub'", domains: ['subscriptions', 'reading', 'hoppers', 'feed'] },
  { table: 'imported_items', insert: "INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,observed_at) VALUES('matrix-sub','matrix-remote','fragment','current',1,'t')", update: "UPDATE imported_items SET page='/f/matrix-remote' WHERE remote_id='matrix-remote'", remove: "DELETE FROM imported_items WHERE remote_id='matrix-remote'", domains: ['reading', 'hoppers', 'feed'] },
  { table: 'hoppers', insert: "INSERT INTO hoppers(id,name,created) VALUES('matrix-hopper','name','t')", update: "UPDATE hoppers SET description='description' WHERE id='matrix-hopper'", remove: "DELETE FROM hoppers WHERE id='matrix-hopper'", domains: ['hoppers'] },
  { table: 'hopper_items', insert: "INSERT INTO hopper_items(hopper_id,subscription_id,remote_id,added_at) VALUES('matrix-hopper','matrix-sub','matrix-remote','t')", update: "UPDATE hopper_items SET added_at='later' WHERE hopper_id='matrix-hopper'", remove: "DELETE FROM hopper_items WHERE hopper_id='matrix-hopper'", domains: ['hoppers'] },
  { table: 'signals', insert: "INSERT INTO signals(subscription_id,remote_id,thumb,at) VALUES('matrix-sub','matrix-remote',1,'t')", update: "UPDATE signals SET thumb=-1 WHERE subscription_id='matrix-sub'", remove: "DELETE FROM signals WHERE subscription_id='matrix-sub'", domains: ['signals'] },
] as const;

// Independent one-field branches that the SQLite prototype supplied in SQL
// beyond its named examples. Keep these explicit so removing a field from the
// production effect classification cannot silently weaken its own test oracle.
export const triggerFields = [
  { family: 4, field: 'title_auto', value: 0, domains: ['subscriptions'] },
  ...['created','updated','forked_from','fork_cite','id','kind','version'].map(field => ({ family: 0, field, value: field === 'kind' ? 'thread' : field === 'version' ? 2 : field === 'id' ? 'renamed' : 'changed', domains: ['items','reading','feed'] })),
  ...['id','origin','title'].map(field => ({ family: 4, field, value: 'changed', domains: ['subscriptions','reading','hoppers','feed'] })),
  ...['subscription_id','remote_id','kind','page'].map(field => ({ family: 5, field, value: field === 'kind' ? 'thread' : 'changed', domains: ['reading','hoppers','feed'] })),
];
