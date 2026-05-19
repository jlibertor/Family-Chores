-- Initial D1 schema draft for the Family Chores app.
-- This migration defines the core household entities without implementing
-- production auth, alerts, rewards, or advanced recurrence.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('adult', 'child')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL DEFAULT 'as_needed'
    CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'as_needed')),
  assigned_member_id INTEGER,
  alert_if_overdue INTEGER NOT NULL DEFAULT 0 CHECK (alert_if_overdue IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS device_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token_hash TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('member', 'kiosk', 'admin')),
  member_id INTEGER,
  device_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS chore_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  completed_by_member_id INTEGER NOT NULL,
  device_session_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (completed_by_member_id) REFERENCES family_members(id),
  FOREIGN KEY (device_session_id) REFERENCES device_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_active_sort
  ON family_members(active, sort_order, display_name);

CREATE INDEX IF NOT EXISTS idx_chores_active
  ON chores(active, frequency_type);

CREATE INDEX IF NOT EXISTS idx_chore_completions_completed_at
  ON chore_completions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chore_completions_chore
  ON chore_completions(chore_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chore_completions_member
  ON chore_completions(completed_by_member_id, completed_at DESC);

INSERT OR IGNORE INTO family_members
  (id, display_name, member_type, sort_order, active)
VALUES
  (1, 'Dad', 'adult', 1, 1),
  (2, 'Mom', 'adult', 2, 1),
  (3, 'Child 1', 'child', 3, 1),
  (4, 'Child 2', 'child', 4, 1),
  (5, 'Child 3', 'child', 5, 1),
  (6, 'Child 4', 'child', 6, 1);

INSERT OR IGNORE INTO chores
  (id, name, description, frequency_type, assigned_member_id, alert_if_overdue, active)
VALUES
  (1, 'Wash Dishes', 'Wash dishes after meals.', 'daily', NULL, 1, 1),
  (2, 'Unload Dishwasher', 'Put clean dishes away.', 'daily', NULL, 1, 1),
  (3, 'Take Out Trash', 'Empty kitchen trash and replace the bag.', 'weekly', NULL, 1, 1),
  (4, 'Feed Pets', 'Feed household pets.', 'daily', NULL, 1, 1),
  (5, 'Clean Bedroom', 'Put away clothes and clear the floor.', 'weekly', NULL, 0, 1),
  (6, 'Vacuum Living Room', 'Vacuum the main living room floor.', 'weekly', NULL, 0, 1),
  (7, 'Wipe Kitchen Counters', 'Wipe down counters after meals.', 'daily', NULL, 1, 1),
  (8, 'Laundry', 'Move laundry forward and fold clean clothes.', 'as_needed', NULL, 0, 1),
  (9, 'Clean Bathroom', 'Wipe sink, mirror, and toilet.', 'weekly', NULL, 0, 1),
  (10, 'Pick Up Toys', 'Return toys and games to their homes.', 'daily', NULL, 0, 1);
