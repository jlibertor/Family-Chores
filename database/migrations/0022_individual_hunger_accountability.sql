-- Track fish SMS history by member for individual hunger accountability.

ALTER TABLE fish_notification_history
  ADD COLUMN recipient_member_id INTEGER REFERENCES family_members(id);

CREATE INDEX IF NOT EXISTS idx_fish_notification_history_member_daily
  ON fish_notification_history(notification_type, reason, recipient_member_id, status, created_at DESC, id DESC);
