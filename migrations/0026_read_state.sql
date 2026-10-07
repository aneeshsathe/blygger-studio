-- The owner's read state for imported items: per reading row, the highest
-- version read. Studio-private and numbers only; no public page, feed, item
-- document, manifest or export reads it. Writes keep the larger value, so a
-- replayed or reordered mark never lowers it (src/importer/read-state.ts).
CREATE TABLE read_state (
  subscription_id TEXT NOT NULL,
  remote_id TEXT NOT NULL,
  read_version INTEGER NOT NULL,
  updated TEXT NOT NULL,
  PRIMARY KEY (subscription_id, remote_id)
);

-- No foreign keys, like the rest of the schema: these follow the importer's
-- own deletes, so read state never outlives the item or subscription it
-- describes.
CREATE TRIGGER read_state_after_import_delete
AFTER DELETE ON imported_items
BEGIN
  DELETE FROM read_state WHERE subscription_id = OLD.subscription_id AND remote_id = OLD.remote_id;
END;

CREATE TRIGGER read_state_after_subscription_delete
AFTER DELETE ON subscriptions
BEGIN
  DELETE FROM read_state WHERE subscription_id = OLD.id;
END;

-- GET /reading carries readVersion, so a read is a Reading change: a mark on
-- one device invalidates another's cached page. Same shape as 0024's guards
-- (SELECT RAISE ... WHERE, no CASE), so D1's remote splitter keeps each body.
CREATE TRIGGER change_read_state_insert
AFTER INSERT ON read_state
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_read_state_update
AFTER UPDATE ON read_state
WHEN OLD."read_version" IS NOT NEW."read_version" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."subscription_id" IS NOT NEW."subscription_id" OR OLD."updated" IS NOT NEW."updated"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_read_state_delete
AFTER DELETE ON read_state
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1)
  WHERE id=1;
END;
