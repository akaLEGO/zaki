-- Donor contact info on each donation. Run in Neon SQL editor.
-- Idempotent: safe to re-run.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_first_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_last_name  TEXT,
  ADD COLUMN IF NOT EXISTS donor_email      TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone      TEXT,
  ADD COLUMN IF NOT EXISTS donor_line_id    TEXT;

-- Lookup indexes for admin search "find donations by phone/email"
CREATE INDEX IF NOT EXISTS donations_donor_email_idx ON donations(donor_email);
CREATE INDEX IF NOT EXISTS donations_donor_phone_idx ON donations(donor_phone);
