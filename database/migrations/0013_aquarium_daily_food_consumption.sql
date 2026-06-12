-- Increase aquarium daily food usage from 2 to 4.

UPDATE aquarium_state
SET daily_food_consumption = 4,
    updated_at = datetime('now')
WHERE id = 1;
