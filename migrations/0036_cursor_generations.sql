-- Private cursor generations for append/clear logs, independent of the reading feed.
ALTER TABLE change_state ADD COLUMN interactions INTEGER NOT NULL DEFAULT 0 CHECK(typeof(interactions)='integer' AND interactions BETWEEN 0 AND 9007199254740991);
ALTER TABLE change_state ADD COLUMN browse INTEGER NOT NULL DEFAULT 0 CHECK(typeof(browse)='integer' AND browse BETWEEN 0 AND 9007199254740991);

CREATE TRIGGER change_interactions_insert
AFTER INSERT ON interactions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET interactions=interactions+1 WHERE id=1;
END;

CREATE TRIGGER change_interactions_update
AFTER UPDATE ON interactions
WHEN OLD."id" IS NOT NEW."id" OR OLD."at" IS NOT NEW."at" OR OLD."kind" IS NOT NEW."kind" OR OLD."origin" IS NOT NEW."origin" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."version" IS NOT NEW."version" OR OLD."own_item_id" IS NOT NEW."own_item_id" OR OLD."own_version" IS NOT NEW."own_version" OR OLD."hopper_id" IS NOT NEW."hopper_id" OR OLD."hopper_name" IS NOT NEW."hopper_name" OR OLD."backfilled" IS NOT NEW."backfilled"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET interactions=interactions+1 WHERE id=1;
END;

CREATE TRIGGER change_interactions_delete
AFTER DELETE ON interactions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET interactions=interactions+1 WHERE id=1;
END;

CREATE TRIGGER change_browse_log_insert
AFTER INSERT ON browse_log
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET browse=browse+1 WHERE id=1;
END;

CREATE TRIGGER change_browse_log_update
AFTER UPDATE ON browse_log
WHEN OLD."id" IS NOT NEW."id" OR OLD."at" IS NOT NEW."at" OR OLD."trail" IS NOT NEW."trail" OR OLD."parent_id" IS NOT NEW."parent_id" OR OLD."origin" IS NOT NEW."origin" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."version" IS NOT NEW."version" OR OLD."via" IS NOT NEW."via" OR OLD."title" IS NOT NEW."title"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET browse=browse+1 WHERE id=1;
END;

CREATE TRIGGER change_browse_log_delete
AFTER DELETE ON browse_log
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET browse=browse+1 WHERE id=1;
END;

-- Match the declared keyset orders, including unique ties.
CREATE INDEX items_private_order ON items(updated DESC, id DESC);
CREATE INDEX subscriptions_private_order ON subscriptions(created ASC, id ASC);
CREATE INDEX hoppers_private_order ON hoppers(created ASC, id ASC);
CREATE INDEX hopper_items_private_order ON hopper_items(hopper_id, added_at DESC, subscription_id ASC, remote_id ASC);
CREATE INDEX mentions_in_private_order ON mentions_in(verified_at DESC, last_seen DESC, id ASC) WHERE status IN ('verified','gone');
CREATE INDEX mentions_out_private_order ON mentions_out(created DESC, id ASC);
CREATE INDEX imported_reading_order ON imported_items(observed_at DESC, subscription_id DESC, remote_id DESC);
