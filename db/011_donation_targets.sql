-- Link donations to the campaign/org they fund, so progress bars reflect
-- real money. Run in Neon SQL editor. Idempotent.
--
-- raised counters live on campaigns.raised / orgs.raised (seeded with a
-- baseline). We increment them when a donation reaches 'completed' (and is
-- not a test). Riba → org_id, Sadaqah → campaign_id. Other flows leave both
-- null. See api/donations.ts + api/donations/[id]/transition.ts for the
-- increment logic.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS org_id      TEXT REFERENCES orgs(id)      ON DELETE SET NULL,
  -- Guard against double-counting: set true the first time we add this
  -- donation's amount to a campaign/org raised total.
  ADD COLUMN IF NOT EXISTS counted_in_raised BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS donations_campaign_idx ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS donations_org_idx      ON donations(org_id);
