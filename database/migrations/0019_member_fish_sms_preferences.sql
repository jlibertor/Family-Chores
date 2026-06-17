ALTER TABLE family_members
  ADD COLUMN phone_number TEXT;

ALTER TABLE family_members
  ADD COLUMN receives_fish_texts INTEGER NOT NULL DEFAULT 0 CHECK (receives_fish_texts IN (0, 1));

ALTER TABLE family_members
  ADD COLUMN fish_text_start_time TEXT NOT NULL DEFAULT '09:00';

ALTER TABLE family_members
  ADD COLUMN fish_text_stop_time TEXT NOT NULL DEFAULT '23:00';
