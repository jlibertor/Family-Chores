-- Allow chores to recur only on weekdays or only on weekends.
-- SQLite cannot widen a CHECK constraint in place, so rebuild chores and
-- the child tables that reference it.

PRAGMA defer_foreign_keys = ON;

ALTER TABLE chores RENAME TO chores_old;

CREATE TABLE chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL DEFAULT 'as_needed'
    CHECK (frequency_type IN ('daily', 'weekdays', 'weekends', 'weekly', 'monthly', 'as_needed')),
  assigned_member_id INTEGER,
  alert_if_overdue INTEGER NOT NULL DEFAULT 0 CHECK (alert_if_overdue IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  needs_reminder INTEGER NOT NULL DEFAULT 0 CHECK (needs_reminder IN (0, 1)),
  assignment_mode TEXT NOT NULL DEFAULT 'household_anyone'
    CHECK (assignment_mode IN ('household_anyone', 'assigned_individual', 'per_person')),
  FOREIGN KEY (assigned_member_id) REFERENCES family_members(id)
);

INSERT INTO chores (
  id,
  name,
  description,
  frequency_type,
  assigned_member_id,
  alert_if_overdue,
  active,
  created_at,
  updated_at,
  needs_reminder,
  assignment_mode
)
SELECT
  id,
  name,
  description,
  frequency_type,
  assigned_member_id,
  alert_if_overdue,
  active,
  created_at,
  updated_at,
  COALESCE(needs_reminder, 0),
  COALESCE(assignment_mode, 'household_anyone')
FROM chores_old;

CREATE TABLE chore_assignments_rebuild (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  family_member_id INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (family_member_id) REFERENCES family_members(id),
  UNIQUE (chore_id, family_member_id)
);

INSERT INTO chore_assignments_rebuild (
  id,
  chore_id,
  family_member_id,
  active,
  created_at,
  updated_at
)
SELECT
  id,
  chore_id,
  family_member_id,
  active,
  created_at,
  updated_at
FROM chore_assignments;

DROP TABLE chore_assignments;
ALTER TABLE chore_assignments_rebuild RENAME TO chore_assignments;

CREATE TABLE chore_completions_rebuild (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  completed_by_member_id INTEGER NOT NULL,
  device_session_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  responsible_member_id INTEGER REFERENCES family_members(id),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (completed_by_member_id) REFERENCES family_members(id),
  FOREIGN KEY (device_session_id) REFERENCES device_sessions(id)
);

INSERT INTO chore_completions_rebuild (
  id,
  chore_id,
  completed_by_member_id,
  device_session_id,
  completed_at,
  notes,
  points,
  responsible_member_id
)
SELECT
  id,
  chore_id,
  completed_by_member_id,
  device_session_id,
  completed_at,
  notes,
  COALESCE(points, 1),
  responsible_member_id
FROM chore_completions;

DROP TABLE chore_completions;
ALTER TABLE chore_completions_rebuild RENAME TO chore_completions;

DROP TABLE chores_old;

CREATE INDEX IF NOT EXISTS idx_chores_active
  ON chores(active, frequency_type);

CREATE INDEX IF NOT EXISTS idx_chores_reminders
  ON chores(active, needs_reminder, alert_if_overdue);

CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore
  ON chore_assignments(chore_id, active);

CREATE INDEX IF NOT EXISTS idx_chore_assignments_member
  ON chore_assignments(family_member_id, active);

CREATE INDEX IF NOT EXISTS idx_chore_completions_completed_at
  ON chore_completions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chore_completions_chore
  ON chore_completions(chore_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chore_completions_member
  ON chore_completions(completed_by_member_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chore_completions_responsible
  ON chore_completions(chore_id, responsible_member_id, completed_at DESC);
