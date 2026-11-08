-- 0.49.0: the owner's browsing path through the reader, and a cache of which
-- links point at blyg items. Both are studio-private: never on the wire and
-- never on a public page (decisions #11/#12: editorial convenience is never
-- in the protocol).
--
-- A trail is one walk: it starts when the owner opens an entry from the feed
-- and each step is a link followed from the entry before it (parent_id), so
-- the log keeps the tree of a descent, not just a list. Targets are keyed by
-- origin + id (§13.1 rule 7), so the record survives an unsubscribe.
CREATE TABLE browse_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  at        TEXT NOT NULL,
  trail     TEXT NOT NULL,
  parent_id INTEGER,           -- the step this one was reached from; NULL for a trail's first
  origin    TEXT NOT NULL,
  remote_id TEXT NOT NULL,
  version   INTEGER,
  via       TEXT NOT NULL,     -- start | stub | quote | link | back
  title     TEXT               -- as it read then; the item may change or vanish
);
CREATE INDEX browse_log_trail ON browse_log (trail, id);
CREATE INDEX browse_log_at ON browse_log (at DESC, id DESC);

-- Whether a link found in an entry names a blyg item, learned by looking at
-- the page it points to (§5.8's rel="alternate" application/json). Misses are
-- kept too, so a Wikipedia link is not fetched again on every open.
CREATE TABLE link_probe (
  url        TEXT PRIMARY KEY,
  origin     TEXT,             -- NULL: not a blyg item
  remote_id  TEXT,
  checked_at TEXT NOT NULL
);
