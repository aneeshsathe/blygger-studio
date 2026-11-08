-- Two revision domains for Webmentions, so their views stop waiting out a
-- timer: `mentions` for the Studio (GET /mentions, both directions) and
-- `responses` for public HTML (the responses list under an item, which reads
-- mentions_in through listPublicResponses).
--
-- They are separate because their response dependencies differ, and because
-- the public one must not move on unverified claims. Anyone can POST a claim;
-- if every pending row rolled the public cache key, a stranger could empty the
-- edge cache at the receiver's rate cap. So:
--   mentions  moves on any mentions_out change, and on a mentions_in change
--             that touches a row the Studio lists (status verified or gone,
--             before or after).
--   responses moves on a mentions_in change that touches a row the public list
--             shows (status verified and not hidden, before or after): a new
--             verification, a hide, a show, a re-claim that sends it back to
--             pending, a withdrawal found on re-verification.
-- A pending claim, and its failure, move neither; they still pay the one
-- state-row write every tracked table pays, and still need the state row.
--
-- Same shape as 0024's guards: SELECT RAISE ... WHERE for the missing row, and
-- every CASE closed inside parentheses, never by END and a semicolon, which
-- D1's remote executor takes as the end of the trigger (session 37).
ALTER TABLE change_state ADD COLUMN mentions INTEGER NOT NULL DEFAULT 0 CHECK(typeof(mentions)='integer' AND mentions BETWEEN 0 AND 9007199254740991);
ALTER TABLE change_state ADD COLUMN responses INTEGER NOT NULL DEFAULT 0 CHECK(typeof(responses)='integer' AND responses BETWEEN 0 AND 9007199254740991);

CREATE TRIGGER change_mentions_in_insert
AFTER INSERT ON mentions_in
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(CASE WHEN NEW.status IN ('verified','gone') THEN 1 ELSE 0 END),
    responses=responses+(CASE WHEN NEW.status='verified' AND NEW.hidden=0 THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_mentions_in_update
AFTER UPDATE ON mentions_in
WHEN OLD."attempts" IS NOT NEW."attempts" OR OLD."error" IS NOT NEW."error" OR OLD."first_seen" IS NOT NEW."first_seen" OR OLD."hidden" IS NOT NEW."hidden" OR OLD."id" IS NOT NEW."id" OR OLD."last_seen" IS NOT NEW."last_seen" OR OLD."relation" IS NOT NEW."relation" OR OLD."source" IS NOT NEW."source" OR OLD."source_author_json" IS NOT NEW."source_author_json" OR OLD."source_id" IS NOT NEW."source_id" OR OLD."source_kind" IS NOT NEW."source_kind" OR OLD."source_origin" IS NOT NEW."source_origin" OR OLD."source_page" IS NOT NEW."source_page" OR OLD."source_version" IS NOT NEW."source_version" OR OLD."status" IS NOT NEW."status" OR OLD."target" IS NOT NEW."target" OR OLD."target_item_id" IS NOT NEW."target_item_id" OR OLD."verified_at" IS NOT NEW."verified_at"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(CASE WHEN OLD.status IN ('verified','gone') OR NEW.status IN ('verified','gone') THEN 1 ELSE 0 END),
    responses=responses+(CASE WHEN (OLD.status='verified' AND OLD.hidden=0) OR (NEW.status='verified' AND NEW.hidden=0) THEN 1 ELSE 0 END)
  WHERE id=1;
END;

CREATE TRIGGER change_mentions_in_delete
AFTER DELETE ON mentions_in
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(CASE WHEN OLD.status IN ('verified','gone') THEN 1 ELSE 0 END),
    responses=responses+(CASE WHEN OLD.status='verified' AND OLD.hidden=0 THEN 1 ELSE 0 END)
  WHERE id=1;
END;

-- The Studio lists every outbound row, status and retry time included, so any
-- change is a mentions change. Outbound rows never reach a public page.
CREATE TRIGGER change_mentions_out_insert
AFTER INSERT ON mentions_out
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_mentions_out_update
AFTER UPDATE ON mentions_out
WHEN OLD."attempts" IS NOT NEW."attempts" OR OLD."created" IS NOT NEW."created" OR OLD."endpoint" IS NOT NEW."endpoint" OR OLD."id" IS NOT NEW."id" OR OLD."item_id" IS NOT NEW."item_id" OR OLD."last_error" IS NOT NEW."last_error" OR OLD."next_attempt_at" IS NOT NEW."next_attempt_at" OR OLD."status" IS NOT NEW."status" OR OLD."target" IS NOT NEW."target" OR OLD."target_version" IS NOT NEW."target_version" OR OLD."version" IS NOT NEW."version"
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(1)
  WHERE id=1;
END;

CREATE TRIGGER change_mentions_out_delete
AFTER DELETE ON mentions_out
BEGIN
  SELECT RAISE(ABORT, 'missing change state') WHERE NOT EXISTS(SELECT 1 FROM change_state WHERE id=1);
  UPDATE change_state SET
    mentions=mentions+(1)
  WHERE id=1;
END;
