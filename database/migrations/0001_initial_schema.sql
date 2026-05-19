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
