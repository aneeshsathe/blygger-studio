-- Session 49. 0028 stays reserved for the upload guard (blygger-studio#7).
--
-- The optional change classifier's studio-private record: one row per own
-- version it classified (or whose category the author set by hand). Never on
-- the wire: spec decision #19 / TN-1 refuse a version-significance marker, and
-- #77 keeps "ignore this version" reader-side. A category reaches readers only
-- as words in the changelog note, which the author confirms.
--
-- A row is written by POST /items/{id}/classify for the version the working
-- copy would publish as (items.version + 1), with the content_hash of the text
-- it classified, and settled at publish: kept when the published hash matches,
-- marked overridden when the author changed or cleared the category, dropped
-- when the text changed after classifying. A row whose version was never
-- published is replaced by the next classify.
--
-- No change trigger: the Studio reads these rows only inside an item's
-- versions, and the only write that matters to a reader of those (settling at
-- publish) happens in the same request as the versions insert, whose own
-- trigger already bumps the items domain.
CREATE TABLE change_class (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  category TEXT CHECK (category IS NULL OR category IN ('refresh', 'typo', 'minor', 'major')),
  model TEXT,
  probability REAL,
  classified_at TEXT NOT NULL,
  overridden INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT NOT NULL,
  PRIMARY KEY (item_id, version)
);
