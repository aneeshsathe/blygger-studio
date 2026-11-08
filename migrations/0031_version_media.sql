-- Attachments per version (blygger-studio#7). §5.4 makes media part of a
-- version: each version's document carries its own `media`, and a later
-- version may leave an attachment out while the earlier ones keep serving it.
-- Until now every row attached to an item was listed on every version, so a
-- removed attachment could only leave by detaching it from the live version
-- too. A row here says the version showed that attachment; it is written at
-- publish and never changed, like the version itself. Reads join `media` by
-- id, so a row detached since still lists on the versions that showed it.
CREATE TABLE version_media (
  item_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  media_id TEXT NOT NULL,
  PRIMARY KEY (item_id, version, media_id)
);
CREATE INDEX version_media_media ON version_media(media_id);

-- Backfill, so no live document changes at upgrade: the latest published
-- version keeps every attachment it lists today (appended, or placed in its
-- text). An earlier version gets only what it can have shown, an attachment
-- uploaded no later than it was. Rows detached before this migration are not
-- recovered; they were already off every version.
INSERT OR IGNORE INTO version_media (item_id, version, media_id)
SELECT v.item_id, v.version, m.id
FROM versions v
JOIN items i ON i.id = v.item_id
JOIN media m ON m.item_id = v.item_id
WHERE v.content_html IS NOT NULL AND v.content_html <> ''
  AND (v.version = i.version OR julianday(m.created) <= julianday(v.published_at))
  AND (m.inline = 0 OR instr(v.content_html, '/' || m.r2_key) > 0 OR instr(v.content_html, '"' || m.r2_key) > 0);
