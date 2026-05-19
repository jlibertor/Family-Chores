-- Lightweight household notes for simple coordination beyond chores.

CREATE TABLE IF NOT EXISTS household_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'shopping', 'reminder')),
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_household_notes_active_type
  ON household_notes(active, note_type, updated_at DESC);
