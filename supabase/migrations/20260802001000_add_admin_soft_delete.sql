ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE camera_uploads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS activities_deleted_at_idx ON activities (deleted_at);
CREATE INDEX IF NOT EXISTS contributions_deleted_at_idx ON contributions (deleted_at);
CREATE INDEX IF NOT EXISTS photos_deleted_at_idx ON photos (deleted_at);
CREATE INDEX IF NOT EXISTS camera_uploads_deleted_at_idx ON camera_uploads (deleted_at);
