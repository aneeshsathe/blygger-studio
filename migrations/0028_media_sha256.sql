-- The upload guard (blygger-studio#7): a SHA-256 of an attachment's bytes, so
-- an identical file uploaded again to the same item returns the existing row
-- instead of storing a second copy. NULL for rows uploaded before this
-- migration (not backfilled) and for uploads not attached to an item.
ALTER TABLE media ADD COLUMN sha256 TEXT;
CREATE INDEX media_item_sha256 ON media(item_id, sha256);

-- The polling cache's change trigger (0024) lists every column it watches, and
-- an oracle test holds it to the table's full column set. Recreated with
-- `sha256` added; otherwise identical to 0024's.
DROP TRIGGER IF EXISTS change_media_update;
CREATE TRIGGER change_media_update
AFTER UPDATE ON media
WHEN OLD."alt" IS NOT NEW."alt" OR OLD."created" IS NOT NEW."created" OR OLD."id" IS NOT NEW."id" OR OLD."inline" IS NOT NEW."inline" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."mime" IS NOT NEW."mime" OR OLD."r2_key" IS NOT NEW."r2_key" OR OLD."sha256" IS NOT NEW."sha256"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    items=items+(1),
    feed=feed+(1)
  WHERE id=1;
END;
