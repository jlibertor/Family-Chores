-- Persistent fish-hook captures. Creatures are soft-removed so the household
-- history and exports retain them, while active aquarium queries can hide them.

ALTER TABLE aquarium_creatures ADD COLUMN taken_at TEXT;
ALTER TABLE aquarium_creatures ADD COLUMN taken_reason TEXT
  CHECK (taken_reason IS NULL OR taken_reason = 'fish_hook');

CREATE TABLE IF NOT EXISTS aquarium_hook_captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_key TEXT NOT NULL UNIQUE,
  mood TEXT NOT NULL
    CHECK (mood IN ('happy', 'content', 'peckish', 'hungry', 'very_hungry', 'sad')),
  result TEXT NOT NULL
    CHECK (result IN ('reserved', 'taken', 'skipped')),
  reason TEXT NOT NULL,
  creature_id INTEGER,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (creature_id) REFERENCES aquarium_creatures(id)
);

-- This link makes completing a reservation idempotent: concurrent requests for
-- the same cycle can both observe which reservation actually took the fish.
ALTER TABLE aquarium_creatures ADD COLUMN taken_hook_capture_id INTEGER
  REFERENCES aquarium_hook_captures(id);

CREATE INDEX IF NOT EXISTS idx_aquarium_creatures_active_species
  ON aquarium_creatures(species_id, created_at, id)
  WHERE taken_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_aquarium_hook_captures_cooldown
  ON aquarium_hook_captures(result, updated_at DESC);
