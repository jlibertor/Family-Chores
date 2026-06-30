-- Parent override: keep the aquarium happy briefly when the real-world
-- situation is fine and no chores should be forced.

ALTER TABLE aquarium_state ADD COLUMN everything_good_until TEXT;
