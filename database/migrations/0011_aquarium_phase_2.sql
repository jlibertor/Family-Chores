-- Aquarium polish phase: configurable egg lifecycle and tuning values.

ALTER TABLE aquarium_state ADD COLUMN starting_food_reserve INTEGER NOT NULL DEFAULT 14 CHECK (starting_food_reserve >= 0);
ALTER TABLE aquarium_state ADD COLUMN egg_incubation_minutes INTEGER NOT NULL DEFAULT 60 CHECK (egg_incubation_minutes >= 0);

CREATE TABLE IF NOT EXISTS aquarium_eggs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id TEXT NOT NULL,
  laid_at TEXT NOT NULL DEFAULT (datetime('now')),
  hatch_after TEXT NOT NULL,
  hatched_at TEXT,
  creature_id INTEGER,
  completion_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (creature_id) REFERENCES aquarium_creatures(id),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id)
);

CREATE INDEX IF NOT EXISTS idx_aquarium_eggs_pending
  ON aquarium_eggs(hatched_at, hatch_after);

UPDATE aquarium_state
SET starting_food_reserve = MIN(food_reserve, max_food_reserve)
WHERE id = 1;
