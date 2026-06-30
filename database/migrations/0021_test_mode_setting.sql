-- Add a household-level test mode setting and turn it on for production.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO app_settings (key, value, updated_at)
VALUES ('test_mode', '1', datetime('now'))
ON CONFLICT(key) DO UPDATE SET
  value = '1',
  updated_at = datetime('now');
