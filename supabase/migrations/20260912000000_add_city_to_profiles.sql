-- Add a city field to user profiles so features like Tech Events and
-- push notifications can use the user's actual location instead of
-- a hardcoded default.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city text;

-- Backfill existing rows so no user sees an empty city on next load.
UPDATE profiles SET city = 'Lahore' WHERE city IS NULL;
