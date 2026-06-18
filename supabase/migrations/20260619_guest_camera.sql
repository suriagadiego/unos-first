-- Guest identity (one row per anonymous Supabase auth user)
CREATE TABLE guests (
  id           uuid PRIMARY KEY,
  display_name text,
  created_at   timestamptz DEFAULT now()
);

-- One row per uploaded photo from the guest camera
CREATE TABLE camera_uploads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id     uuid NOT NULL REFERENCES guests(id),
  storage_key  text NOT NULL,
  url          text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX camera_uploads_guest_id_idx  ON camera_uploads(guest_id);
CREATE INDEX camera_uploads_created_at_idx ON camera_uploads(created_at DESC);
