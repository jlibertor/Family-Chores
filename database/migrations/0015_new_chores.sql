-- Add "Wash the pets" (weekly) if no similar chore already exists
INSERT INTO chores (name, frequency_type, assignment_mode, alert_if_overdue, needs_reminder, feeds_aquarium, active)
SELECT 'Wash the pets', 'weekly', 'household_anyone', 0, 0, 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM chores WHERE active = 1 AND (
    LOWER(name) LIKE '%wash%pet%'
    OR LOWER(name) LIKE '%bathe%pet%'
    OR LOWER(name) LIKE '%bath%pet%'
    OR LOWER(name) LIKE '%wash%dog%'
    OR LOWER(name) LIKE '%bathe%dog%'
  )
);

-- Add "Take the dog for a walk" (daily) if no similar chore already exists
INSERT INTO chores (name, frequency_type, assignment_mode, alert_if_overdue, needs_reminder, feeds_aquarium, active)
SELECT 'Take the dog for a walk', 'daily', 'household_anyone', 0, 0, 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM chores WHERE active = 1 AND (
    LOWER(name) LIKE '%walk%dog%'
    OR LOWER(name) LIKE '%walk%pet%'
    OR LOWER(name) LIKE '%take%dog%walk%'
    OR LOWER(name) LIKE '%dog%walk%'
  )
);
