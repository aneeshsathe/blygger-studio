/** Published references retain both the row and bytes indefinitely. These
 * correlated predicates apply to the media table in reads and mutations. */
export const retainedMediaSql = 'EXISTS (SELECT 1 FROM version_media WHERE media_id = media.id) OR EXISTS (SELECT 1 FROM versions WHERE instr(content_html, media.r2_key) > 0)';
export const avatarMediaSql = "EXISTS (SELECT 1 FROM settings WHERE key = 'avatar_media_id' AND value = media.id)";
