-- Slip-based payment verification. The payer uploads a transfer slip after
-- paying; the donation lands in 'pending' and an admin approves/rejects it
-- in the back office. Run in Neon SQL editor. Idempotent.
--
-- STORAGE NOTE: slip_image holds a client-compressed base64 data URL
-- (~50-100KB JPEG). This keeps beta zero-infra. At scale, migrate to
-- Vercel Blob / S3 and store only the URL here — the column type (TEXT)
-- accommodates both. Never SELECT slip_image in list queries (it's large);
-- only fetch it in the single-donation detail endpoint.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS slip_image       TEXT,
  ADD COLUMN IF NOT EXISTS slip_uploaded_at TIMESTAMPTZ;
