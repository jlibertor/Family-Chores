-- Chore assignment model: household, one-person, and per-person obligations.

ALTER TABLE chores
  ADD COLUMN assignment_mode TEXT NOT NULL DEFAULT 'household_anyone'
  CHECK (assignment_mode IN ('household_anyone', 'assigned_individual', 'per_person'));

ALTER TABLE chore_completions
  ADD COLUMN responsible_member_id INTEGER REFERENCES family_members(id);

CREATE TABLE IF NOT EXISTS chore_assignments (
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

UPDATE chores
SET assignment_mode = 'assigned_individual'
WHERE assigned_member_id IS NOT NULL;

INSERT OR IGNORE INTO chore_assignments (chore_id, family_member_id, active)
SELECT id, assigned_member_id, active
FROM chores
WHERE assigned_member_id IS NOT NULL;

UPDATE chore_completions
SET responsible_member_id = completed_by_member_id
WHERE responsible_member_id IS NULL
  AND chore_id IN (
    SELECT id
    FROM chores
    WHERE assignment_mode IN ('assigned_individual', 'per_person')
  );

CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore
  ON chore_assignments(chore_id, active);

CREATE INDEX IF NOT EXISTS idx_chore_assignments_member
  ON chore_assignments(family_member_id, active);

CREATE INDEX IF NOT EXISTS idx_chore_completions_responsible
  ON chore_completions(chore_id, responsible_member_id, completed_at DESC);
