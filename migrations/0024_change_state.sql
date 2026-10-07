-- Fixed revision domains; changes and tracking commit/roll back together.
-- Every effect performs one state-row UPDATE, even when several domains move.
-- Future schema changes must update these guards and their receiving oracle.
-- Guards are SELECT RAISE ... WHERE, never a CASE expression closed by END and
-- a semicolon: D1's remote executor takes that as the end of the trigger and
-- rejected it as "incomplete input" (session 37); local tests applied it fine.
CREATE TABLE change_state (
  id INTEGER PRIMARY KEY CHECK(id=1),
  epoch TEXT NOT NULL DEFAULT (lower(hex(randomblob(16)))) CHECK(length(epoch)>0),
  items INTEGER NOT NULL DEFAULT 0 CHECK(typeof(items)='integer' AND items BETWEEN 0 AND 9007199254740991),
  reading INTEGER NOT NULL DEFAULT 0 CHECK(typeof(reading)='integer' AND reading BETWEEN 0 AND 9007199254740991),
  subscriptions INTEGER NOT NULL DEFAULT 0 CHECK(typeof(subscriptions)='integer' AND subscriptions BETWEEN 0 AND 9007199254740991),
  hoppers INTEGER NOT NULL DEFAULT 0 CHECK(typeof(hoppers)='integer' AND hoppers BETWEEN 0 AND 9007199254740991),
  signals INTEGER NOT NULL DEFAULT 0 CHECK(typeof(signals)='integer' AND signals BETWEEN 0 AND 9007199254740991),
  settings INTEGER NOT NULL DEFAULT 0 CHECK(typeof(settings)='integer' AND settings BETWEEN 0 AND 9007199254740991),
  feed INTEGER NOT NULL DEFAULT 0 CHECK(typeof(feed)='integer' AND feed BETWEEN 0 AND 9007199254740991)
);
INSERT INTO change_state(id) VALUES(1);

CREATE TRIGGER change_items_insert
AFTER INSERT ON items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_items_update
AFTER UPDATE ON items
WHEN OLD."content_md" IS NOT NEW."content_md" OR OLD."created" IS NOT NEW."created" OR OLD."dirty" IS NOT NEW."dirty" OR OLD."fork_cite" IS NOT NEW."fork_cite" OR OLD."forked_from" IS NOT NEW."forked_from" OR OLD."highlight_override" IS NOT NEW."highlight_override" OR OLD."id" IS NOT NEW."id" OR OLD."kind" IS NOT NEW."kind" OR OLD."responses_override" IS NOT NEW."responses_override" OR OLD."show_responses" IS NOT NEW."show_responses" OR OLD."status" IS NOT NEW."status" OR OLD."stub_of" IS NOT NEW."stub_of" OR OLD."tk_provenance_json" IS NOT NEW."tk_provenance_json" OR OLD."updated" IS NOT NEW."updated" OR OLD."version" IS NOT NEW."version"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(CASE WHEN (OLD.status IN ('public','withdrawn') OR NEW.status IN ('public','withdrawn')) AND (OLD."created" IS NOT NEW."created" OR OLD."fork_cite" IS NOT NEW."fork_cite" OR OLD."forked_from" IS NOT NEW."forked_from" OR OLD."id" IS NOT NEW."id" OR OLD."kind" IS NOT NEW."kind" OR OLD."status" IS NOT NEW."status" OR OLD."updated" IS NOT NEW."updated" OR OLD."version" IS NOT NEW."version") THEN 1 ELSE 0 END),
    feed=feed+(CASE WHEN ((OLD.status IN ('public','withdrawn') OR NEW.status IN ('public','withdrawn')) AND (OLD."created" IS NOT NEW."created" OR OLD."fork_cite" IS NOT NEW."fork_cite" OR OLD."forked_from" IS NOT NEW."forked_from" OR OLD."id" IS NOT NEW."id" OR OLD."kind" IS NOT NEW."kind" OR OLD."status" IS NOT NEW."status" OR OLD."updated" IS NOT NEW."updated" OR OLD."version" IS NOT NEW."version")) OR OLD."id" IS NOT NEW."id" OR OLD."kind" IS NOT NEW."kind" THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_items_delete
AFTER DELETE ON items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_versions_insert
AFTER INSERT ON versions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_versions_update
AFTER UPDATE ON versions
WHEN OLD."content_hash" IS NOT NEW."content_hash" OR OLD."content_html" IS NOT NEW."content_html" OR OLD."content_md" IS NOT NEW."content_md" OR OLD."generated_json" IS NOT NEW."generated_json" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."note" IS NOT NEW."note" OR OLD."note_generated" IS NOT NEW."note_generated" OR OLD."pinned" IS NOT NEW."pinned" OR OLD."pinned_at" IS NOT NEW."pinned_at" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."stub_cite" IS NOT NEW."stub_cite" OR OLD."stub_of" IS NOT NEW."stub_of" OR OLD."transclusions" IS NOT NEW."transclusions" OR OLD."version" IS NOT NEW."version"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(CASE WHEN (OLD."content_hash" IS NOT NEW."content_hash" OR OLD."content_html" IS NOT NEW."content_html" OR OLD."content_md" IS NOT NEW."content_md" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."note" IS NOT NEW."note" OR OLD."note_generated" IS NOT NEW."note_generated" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."stub_cite" IS NOT NEW."stub_cite" OR OLD."stub_of" IS NOT NEW."stub_of" OR OLD."transclusions" IS NOT NEW."transclusions" OR OLD."version" IS NOT NEW."version") THEN 1 ELSE 0 END),
    feed=feed+(CASE WHEN (OLD."content_hash" IS NOT NEW."content_hash" OR OLD."content_html" IS NOT NEW."content_html" OR OLD."content_md" IS NOT NEW."content_md" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."note" IS NOT NEW."note" OR OLD."note_generated" IS NOT NEW."note_generated" OR OLD."published_at" IS NOT NEW."published_at" OR OLD."stub_cite" IS NOT NEW."stub_cite" OR OLD."stub_of" IS NOT NEW."stub_of" OR OLD."transclusions" IS NOT NEW."transclusions" OR OLD."version" IS NOT NEW."version") THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_versions_delete
AFTER DELETE ON versions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    reading=reading+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_media_insert
AFTER INSERT ON media
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_media_update
AFTER UPDATE ON media
WHEN OLD."alt" IS NOT NEW."alt" OR OLD."created" IS NOT NEW."created" OR OLD."id" IS NOT NEW."id" OR OLD."inline" IS NOT NEW."inline" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."mime" IS NOT NEW."mime" OR OLD."r2_key" IS NOT NEW."r2_key"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_media_delete
AFTER DELETE ON media
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_settings_insert
AFTER INSERT ON settings
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    settings=settings+(1),
    feed=feed+(CASE WHEN NEW.key IN ('site_title','author_name','author_bio','site_url','timezone') THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_settings_update
AFTER UPDATE ON settings
WHEN OLD."key" IS NOT NEW."key" OR OLD."value" IS NOT NEW."value"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    settings=settings+(1),
    feed=feed+(CASE WHEN OLD.key IN ('site_title','author_name','author_bio','site_url','timezone') OR NEW.key IN ('site_title','author_name','author_bio','site_url','timezone') THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_settings_delete
AFTER DELETE ON settings
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    settings=settings+(1),
    feed=feed+(CASE WHEN OLD.key IN ('site_title','author_name','author_bio','site_url','timezone') THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_subscriptions_insert
AFTER INSERT ON subscriptions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1),
    subscriptions=subscriptions+(1),
    hoppers=hoppers+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_subscriptions_update
AFTER UPDATE ON subscriptions
WHEN OLD."created" IS NOT NEW."created" OR OLD."etag" IS NOT NEW."etag" OR OLD."fail_count" IS NOT NEW."fail_count" OR OLD."feed_url" IS NOT NEW."feed_url" OR OLD."flags" IS NOT NEW."flags" OR OLD."id" IS NOT NEW."id" OR OLD."in_blogroll" IS NOT NEW."in_blogroll" OR OLD."kind" IS NOT NEW."kind" OR OLD."last_index_sync_at" IS NOT NEW."last_index_sync_at" OR OLD."last_modified" IS NOT NEW."last_modified" OR OLD."last_poll_at" IS NOT NEW."last_poll_at" OR OLD."newest_guid" IS NOT NEW."newest_guid" OR OLD."origin" IS NOT NEW."origin" OR OLD."status" IS NOT NEW."status" OR OLD."title" IS NOT NEW."title" OR OLD."title_auto" IS NOT NEW."title_auto"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(CASE WHEN (OLD."id" IS NOT NEW."id" OR OLD."origin" IS NOT NEW."origin" OR OLD."title" IS NOT NEW."title") THEN 1 ELSE 0 END),
    subscriptions=subscriptions+(1),
    hoppers=hoppers+(CASE WHEN (OLD."id" IS NOT NEW."id" OR OLD."origin" IS NOT NEW."origin" OR OLD."title" IS NOT NEW."title") THEN 1 ELSE 0 END),
    feed=feed+(CASE WHEN (OLD."id" IS NOT NEW."id" OR OLD."origin" IS NOT NEW."origin" OR OLD."title" IS NOT NEW."title") THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_subscriptions_delete
AFTER DELETE ON subscriptions
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1),
    subscriptions=subscriptions+(1),
    hoppers=hoppers+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_imported_items_insert
AFTER INSERT ON imported_items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1),
    hoppers=hoppers+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_imported_items_update
AFTER UPDATE ON imported_items
WHEN OLD."author_json" IS NOT NEW."author_json" OR OLD."content_hash" IS NOT NEW."content_hash" OR OLD."content_html" IS NOT NEW."content_html" OR OLD."content_md" IS NOT NEW."content_md" OR OLD."created" IS NOT NEW."created" OR OLD."forked_from_json" IS NOT NEW."forked_from_json" OR OLD."kind" IS NOT NEW."kind" OR OLD."l0" IS NOT NEW."l0" OR OLD."media_json" IS NOT NEW."media_json" OR OLD."observed_at" IS NOT NEW."observed_at" OR OLD."page" IS NOT NEW."page" OR OLD."pinned_version_retained" IS NOT NEW."pinned_version_retained" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."state" IS NOT NEW."state" OR OLD."stub_of_json" IS NOT NEW."stub_of_json" OR OLD."subscription_id" IS NOT NEW."subscription_id" OR OLD."transclusions_json" IS NOT NEW."transclusions_json" OR OLD."updated" IS NOT NEW."updated" OR OLD."version" IS NOT NEW."version"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1),
    hoppers=hoppers+(1),
    feed=feed+(CASE WHEN (OLD."kind" IS NOT NEW."kind" OR OLD."page" IS NOT NEW."page" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."subscription_id" IS NOT NEW."subscription_id") THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_imported_items_delete
AFTER DELETE ON imported_items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    reading=reading+(1),
    hoppers=hoppers+(1),
    feed=feed+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hoppers_insert
AFTER INSERT ON hoppers
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hoppers_update
AFTER UPDATE ON hoppers
WHEN OLD."created" IS NOT NEW."created" OR OLD."description" IS NOT NEW."description" OR OLD."id" IS NOT NEW."id" OR OLD."name" IS NOT NEW."name" OR OLD."public" IS NOT NEW."public" OR OLD."slug" IS NOT NEW."slug" OR OLD."slug_frozen" IS NOT NEW."slug_frozen"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hoppers_delete
AFTER DELETE ON hoppers
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hopper_items_insert
AFTER INSERT ON hopper_items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hopper_items_update
AFTER UPDATE ON hopper_items
WHEN OLD."added_at" IS NOT NEW."added_at" OR OLD."hopper_id" IS NOT NEW."hopper_id" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."subscription_id" IS NOT NEW."subscription_id"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_hopper_items_delete
AFTER DELETE ON hopper_items
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    hoppers=hoppers+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_signals_insert
AFTER INSERT ON signals
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    signals=signals+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_signals_update
AFTER UPDATE ON signals
WHEN OLD."at" IS NOT NEW."at" OR OLD."remote_id" IS NOT NEW."remote_id" OR OLD."subscription_id" IS NOT NEW."subscription_id" OR OLD."thumb" IS NOT NEW."thumb"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    signals=signals+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_signals_delete
AFTER DELETE ON signals
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    signals=signals+(1)
  WHERE id=1;
END;
