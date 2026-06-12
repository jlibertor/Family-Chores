-- Temporary Bug Box rewards earned from chore completions.

CREATE TABLE IF NOT EXISTS earned_bugs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL,
  bug_id TEXT NOT NULL,
  chore_id INTEGER NOT NULL,
  completion_id INTEGER NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (family_member_id) REFERENCES family_members(id),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id)
);

CREATE INDEX IF NOT EXISTS idx_earned_bugs_member_active
  ON earned_bugs(family_member_id, expires_at DESC, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_earned_bugs_completion
  ON earned_bugs(completion_id);
