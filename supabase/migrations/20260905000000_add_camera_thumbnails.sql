ALTER TABLE camera_uploads
  ADD COLUMN IF NOT EXISTS thumbnail_storage_key text;

CREATE UNIQUE INDEX IF NOT EXISTS camera_uploads_thumbnail_storage_key_unique
  ON camera_uploads (thumbnail_storage_key)
  WHERE thumbnail_storage_key IS NOT NULL;
