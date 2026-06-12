-- Allow each chore to opt out of feeding the aquarium.

ALTER TABLE chores ADD COLUMN feeds_aquarium INTEGER NOT NULL DEFAULT 1 CHECK (feeds_aquarium IN (0, 1));
