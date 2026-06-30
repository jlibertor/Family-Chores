-- Make fish eggs last three days before hatching.

UPDATE aquarium_state
SET egg_incubation_minutes = 4320,
    updated_at = datetime('now')
WHERE id = 1;

UPDATE aquarium_eggs
SET hatch_after = datetime(laid_at, '+3 days'),
    updated_at = datetime('now')
WHERE hatched_at IS NULL;
