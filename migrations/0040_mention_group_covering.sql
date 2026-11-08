-- Counts scan this smaller covering index; winner lookups seek one target's
-- normalized group order. Receipt pagination keeps 0039's distinct NULL order.
CREATE INDEX mentions_in_group_covering
  ON mentions_in(target_item_id, COALESCE(verified_at,'') DESC, last_seen DESC, id ASC, status, hidden)
  WHERE status IN ('verified','gone');
