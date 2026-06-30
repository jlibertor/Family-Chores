-- Add end-of-day fish reward thank-you SMS support.

CREATE TABLE fish_notification_history_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('hunger', 'new_fish', 'fish_birthday', 'fish_growth', 'tank_success', 'test', 'fish_reward_thank_you')),
  mood TEXT,
  hunger_score INTEGER NOT NULL DEFAULT 0 CHECK (hunger_score >= 0),
  message_body TEXT,
  recipient_phone_number TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
  reason TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  provider_status TEXT,
  provider_status_code INTEGER,
  provider_error_code TEXT,
  provider_error_message TEXT,
  diagnostic_context TEXT,
  recipient_member_id INTEGER REFERENCES family_members(id),
  chore_date TEXT,
  completed_chores_today INTEGER,
  fish_mood_at_send_time TEXT,
  chore_points INTEGER,
  fish_mood_modifier INTEGER,
  final_reward_score INTEGER
);

INSERT INTO fish_notification_history_new (
  id,
  notification_type,
  mood,
  hunger_score,
  message_body,
  recipient_phone_number,
  provider_message_id,
  status,
  reason,
  error_message,
  created_at,
  provider_status,
  provider_status_code,
  provider_error_code,
  provider_error_message,
  diagnostic_context,
  recipient_member_id
)
SELECT
  id,
  notification_type,
  mood,
  hunger_score,
  message_body,
  recipient_phone_number,
  provider_message_id,
  status,
  reason,
  error_message,
  created_at,
  provider_status,
  provider_status_code,
  provider_error_code,
  provider_error_message,
  diagnostic_context,
  recipient_member_id
FROM fish_notification_history;

DROP TABLE fish_notification_history;
ALTER TABLE fish_notification_history_new RENAME TO fish_notification_history;

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_type_created
  ON fish_notification_history(notification_type, mood, status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_created
  ON fish_notification_history(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_member_daily
  ON fish_notification_history(notification_type, reason, recipient_member_id, status, created_at DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fish_reward_thank_you_once_per_child_day
  ON fish_notification_history(notification_type, recipient_member_id, chore_date)
  WHERE notification_type = 'fish_reward_thank_you'
    AND status = 'sent'
    AND recipient_member_id IS NOT NULL
    AND chore_date IS NOT NULL;
