ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS rsvps_deleted_at_idx ON rsvps (deleted_at);
