CREATE TABLE IF NOT EXISTS camera_uploads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id     uuid NOT NULL,
  guest_name   text,
  storage_key  text NOT NULL,
  url          text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS camera_uploads_guest_id_idx   ON camera_uploads(guest_id);
CREATE INDEX IF NOT EXISTS camera_uploads_created_at_idx ON camera_uploads(created_at DESC);
