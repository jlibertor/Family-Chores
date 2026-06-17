-- Add secret-safe provider diagnostics for fish SMS sends.

ALTER TABLE fish_notification_history ADD COLUMN provider_status TEXT;
ALTER TABLE fish_notification_history ADD COLUMN provider_status_code INTEGER;
ALTER TABLE fish_notification_history ADD COLUMN provider_error_code TEXT;
ALTER TABLE fish_notification_history ADD COLUMN provider_error_message TEXT;
ALTER TABLE fish_notification_history ADD COLUMN diagnostic_context TEXT;
