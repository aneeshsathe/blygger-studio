-- Match each target's private receipt pages, including unique ties. The same
-- target prefix also bounds point reads of its private group counts.
CREATE INDEX mentions_in_target_private_order
  ON mentions_in(target_item_id, verified_at DESC, last_seen DESC, id ASC)
  WHERE status IN ('verified','gone');
