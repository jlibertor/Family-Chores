-- Add optional family member nicknames for public display.

ALTER TABLE family_members
  ADD COLUMN nickname TEXT;
