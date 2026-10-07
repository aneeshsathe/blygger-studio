-- Run after restoring/replacing D1, BEFORE resuming traffic. Do not execute
-- automatically during ordinary upgrades: cursors should survive deployments.
INSERT INTO change_state(id) VALUES(1)
ON CONFLICT(id) DO UPDATE SET epoch=excluded.epoch,
  items=0, reading=0, subscriptions=0, hoppers=0, signals=0, settings=0, feed=0;
