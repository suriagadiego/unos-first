-- Stores the S3-compatible URL of the payment proof submitted with a fund contribution.
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS proof_url TEXT;
