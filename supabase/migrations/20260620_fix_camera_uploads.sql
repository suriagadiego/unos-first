-- Drop FK to guests table (no longer needed — guest_id is now a plain client-generated UUID)
ALTER TABLE camera_uploads DROP CONSTRAINT IF EXISTS camera_uploads_guest_id_fkey;

-- Add guest_name if it doesn't exist yet
ALTER TABLE camera_uploads ADD COLUMN IF NOT EXISTS guest_name text;
