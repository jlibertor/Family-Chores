-- Add optional selected avatar id for family members.

ALTER TABLE family_members
  ADD COLUMN avatar_id TEXT;
