-- Subscription names follow their source (0.29): a blyg's manifest title, an
-- RSS feed's channel title, refreshed while polling. title_auto = 0 means the
-- owner named it, and refreshes leave it alone.
-- Existing blyg subscriptions follow their source. Existing RSS ones keep
-- their names: an RSS subscription's only automatic name was its hostname, so
-- any other name there was the owner's choice.
ALTER TABLE subscriptions ADD COLUMN title_auto INTEGER NOT NULL DEFAULT 1;
UPDATE subscriptions SET title_auto = 0 WHERE kind = 'rss';
