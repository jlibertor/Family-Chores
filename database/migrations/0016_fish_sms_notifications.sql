-- Fish SMS notification history and cooldown support.

CREATE TABLE IF NOT EXISTS fish_notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('hunger', 'new_fish', 'fish_birthday', 'fish_growth', 'tank_success', 'test')),
  mood TEXT,
  hunger_score INTEGER NOT NULL DEFAULT 0 CHECK (hunger_score >= 0),
  message_body TEXT,
  recipient_phone_number TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
  reason TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_type_created
  ON fish_notification_history(notification_type, mood, status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_created
  ON fish_notification_history(created_at DESC, id DESC);
