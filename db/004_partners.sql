-- Partner fulfillment + donation state machine. Run in Neon SQL editor.
-- Idempotent: safe to re-run.

-- Third-party partners (Ummatee, etc.) that fulfill donations physically.
CREATE TABLE IF NOT EXISTS partners (
  id            TEXT PRIMARY KEY,                  -- slug, e.g. 'ummatee'
  name          TEXT NOT NULL,
  contact_email TEXT,
  contact_line  TEXT,
  webhook_url   TEXT,
  flows         TEXT[] NOT NULL DEFAULT '{}',      -- which donation flows this partner handles
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event log per donation — lifecycle separate from audit_log (which tracks admin actions).
CREATE TABLE IF NOT EXISTS donation_events (
  id          BIGSERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  actor       TEXT NOT NULL,                       -- 'system' | 'admin:<userId>' | 'partner:<id>'
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS donation_events_donation_idx
  ON donation_events(donation_id, created_at DESC);

-- Expand donations.status to the partner-fulfillment state machine.
ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_status_check,
  ADD CONSTRAINT donations_status_check CHECK (status IN (
    'pending',
    'paid',
    'awaiting_partner',
    'partner_confirmed',
    'completed',
    'partner_rejected',
    'refunded',
    'failed'
  ));

-- Partner linkage + fulfillment metadata.
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS partner_id            TEXT REFERENCES partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_ref           TEXT,
  ADD COLUMN IF NOT EXISTS partner_note          TEXT,
  ADD COLUMN IF NOT EXISTS partner_notified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_confirmed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_ref            TEXT;

CREATE INDEX IF NOT EXISTS donations_partner_idx ON donations(partner_id);
CREATE INDEX IF NOT EXISTS donations_status_idx  ON donations(status);

-- Seed Ummatee as the canonical Qurban partner.
INSERT INTO partners (id, name, contact_email, contact_line, flows, active, notes) VALUES
  ('ummatee', 'Ummatee', NULL, NULL, ARRAY['qurban'], TRUE,
   'Qurban fulfillment partner — manual slaughter + distribution coordination')
ON CONFLICT (id) DO NOTHING;
