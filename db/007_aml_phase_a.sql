-- AML Phase A: per-donation IP, User-Agent, and risk tier. Run in Neon SQL
-- editor. Idempotent: safe to re-run. See project_compliance_roadmap.md for
-- the broader Phase A–D plan.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_ip   TEXT,
  ADD COLUMN IF NOT EXISTS donor_ua   TEXT,
  ADD COLUMN IF NOT EXISTS risk_tier  TEXT
    CHECK (risk_tier IS NULL OR risk_tier IN ('low','medium','high','enhanced'));

-- Backfill: classify existing rows by amount so the admin filter is useful
-- even on legacy data. Thresholds are the same the API now enforces.
UPDATE donations
SET risk_tier = CASE
  WHEN amount <  10000  THEN 'low'
  WHEN amount <  100000 THEN 'medium'
  WHEN amount < 2000000 THEN 'high'
  ELSE 'enhanced'
END
WHERE risk_tier IS NULL;

CREATE INDEX IF NOT EXISTS donations_risk_tier_idx ON donations(risk_tier);
CREATE INDEX IF NOT EXISTS donations_donor_ip_idx  ON donations(donor_ip);
