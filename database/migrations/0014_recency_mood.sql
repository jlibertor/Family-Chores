-- Recency-based mood: track when the aquarium was last fed and tune the
-- food economy to the household pace (~0-3 chores per day).

ALTER TABLE aquarium_state ADD COLUMN last_fed_at TEXT;

-- Backfill from the most recent feeding event, falling back to now so the
-- tank does not start out miserable after deploying.
UPDATE aquarium_state
SET last_fed_at = COALESCE(
      (SELECT MAX(created_at) FROM aquarium_events WHERE event_type = 'fed'),
      datetime('now')
    ),
    daily_food_consumption = 2,
    updated_at = datetime('now')
WHERE id = 1;
