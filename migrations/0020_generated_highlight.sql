-- Highlight generated portions on public pages (0.27.0): a global default in
-- settings (`highlight_generated_default`, a key-value row, no schema needed)
-- and a per-item override here, shaped like `responses_override` (0012).
--
-- NULL means follow the global default; 0 and 1 mean this item decides for
-- itself. Every existing item inherits, and the default is off, so upgrading
-- changes nothing anyone can see. Presentation only: nothing reaches the item
-- document, the feed or content_html.
ALTER TABLE items ADD COLUMN highlight_override INTEGER;  -- NULL = inherit the global default
