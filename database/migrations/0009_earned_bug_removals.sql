-- Allow Bug Box easter eggs to remove a temporary bug without deleting history.

ALTER TABLE earned_bugs ADD COLUMN removed_at TEXT;
ALTER TABLE earned_bugs ADD COLUMN removed_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_earned_bugs_removed
  ON earned_bugs(removed_at, removed_reason);
