-- Tipping model: Kaff drops the 5% Amil fee. 100% of every donation now
-- goes to the recipient org/partner. Kaff sustains itself via voluntary
-- tips that donors leave on the success screen — those are stored as their
-- own donation rows with flow='tip'.
--
-- Run in Neon SQL editor. Idempotent: safe to re-run.

-- 1) Allow 'tip' as a new flow value.
ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_flow_check,
  ADD CONSTRAINT donations_flow_check CHECK (flow IN (
    'riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah','tip'
  ));

-- 2) Link tips back to the donation they were left for, so admin can see
--    "this tip belongs to KF-123456". Optional; tip rows without a parent
--    are still valid ("standalone gratitude tip").
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS parent_donation_id INTEGER REFERENCES donations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS donations_parent_idx ON donations(parent_donation_id);

-- 3) fee_amount stays in the schema (don't drop — preserves history of past
--    Amil-era donations). All new rows simply get 0. No data change needed.
