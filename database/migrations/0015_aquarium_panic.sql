-- Panic mode: lets a parent lock the aquarium into a sad state until
-- a set number of new child chores are completed.

ALTER TABLE aquarium_state ADD COLUMN panic_mode INTEGER NOT NULL DEFAULT 0 CHECK (panic_mode IN (0, 1));
ALTER TABLE aquarium_state ADD COLUMN panic_chores_needed INTEGER NOT NULL DEFAULT 0 CHECK (panic_chores_needed >= 0);
