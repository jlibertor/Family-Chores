-- Repair panic mode schema drift for databases where 0015 was applied before
-- panic_expires_at existed locally.

ALTER TABLE aquarium_state ADD COLUMN panic_expires_at TEXT;
