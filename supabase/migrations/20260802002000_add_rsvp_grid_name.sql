ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS grid_name TEXT;

COMMENT ON COLUMN rsvps.grid_name IS
  'Optional admin override for the generated public On the Grid team title.';
