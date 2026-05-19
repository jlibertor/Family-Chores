-- Lightweight convenience fields for reminders and simple household status.

ALTER TABLE chores ADD COLUMN needs_reminder INTEGER NOT NULL DEFAULT 0 CHECK (needs_reminder IN (0, 1));
ALTER TABLE chore_completions ADD COLUMN points INTEGER NOT NULL DEFAULT 1;

UPDATE chores
SET needs_reminder = 1
WHERE name IN ('Feed Pets', 'Take Out Trash', 'Wash Dishes');

CREATE INDEX IF NOT EXISTS idx_chores_reminders
  ON chores(active, needs_reminder, alert_if_overdue);
