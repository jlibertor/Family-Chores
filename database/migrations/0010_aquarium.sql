-- Household aquarium state powered by chore completions.

CREATE TABLE IF NOT EXISTS aquarium_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  food_reserve INTEGER NOT NULL DEFAULT 14 CHECK (food_reserve >= 0),
  max_food_reserve INTEGER NOT NULL DEFAULT 30 CHECK (max_food_reserve > 0),
  daily_food_consumption INTEGER NOT NULL DEFAULT 4 CHECK (daily_food_consumption >= 0),
  last_consumed_on TEXT NOT NULL DEFAULT (date('now')),
  total_chore_completions INTEGER NOT NULL DEFAULT 0 CHECK (total_chore_completions >= 0),
  creature_unlock_interval INTEGER NOT NULL DEFAULT 25 CHECK (creature_unlock_interval > 0),
  growth_days INTEGER NOT NULL DEFAULT 7 CHECK (growth_days >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS aquarium_creatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id TEXT NOT NULL,
  growth_stage TEXT NOT NULL DEFAULT 'baby' CHECK (growth_stage IN ('baby', 'adult')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS aquarium_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('fed', 'hatched')),
  message TEXT NOT NULL,
  member_name TEXT,
  completion_id INTEGER,
  creature_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id),
  FOREIGN KEY (creature_id) REFERENCES aquarium_creatures(id)
);

CREATE INDEX IF NOT EXISTS idx_aquarium_events_created
  ON aquarium_events(created_at DESC, id DESC);

INSERT OR IGNORE INTO aquarium_state
  (id, food_reserve, max_food_reserve, daily_food_consumption, last_consumed_on, total_chore_completions, creature_unlock_interval, growth_days)
VALUES
  (1, 14, 30, 4, date('now'), COALESCE((SELECT COUNT(*) FROM chore_completions), 0), 25, 7);

INSERT OR IGNORE INTO aquarium_creatures
  (id, species_id, growth_stage)
VALUES
  (1, 'clownfish', 'baby');
