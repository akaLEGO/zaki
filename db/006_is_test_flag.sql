-- Mark donations created during testing-mode so admin can filter them out
-- (and purge cleanly) before flipping to production. Run in Neon SQL editor.
-- Idempotent: safe to re-run.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: every existing donation was created while testing mode was
-- enabled, so mark them all as tests. Real donations will start arriving
-- only after VITE_KAFF_TESTING_MODE=false is set on Vercel.
UPDATE donations SET is_test = TRUE WHERE is_test = FALSE;

CREATE INDEX IF NOT EXISTS donations_is_test_idx ON donations(is_test);
