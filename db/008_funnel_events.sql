-- Beta-test analytics: phase tag on donations + a lightweight funnel_events
-- table for tracking visitor sessions and drop-off points. Run on Neon.
-- Idempotent: safe to re-run.

-- 1. Tag donations with the campaign phase they came from.
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'closed_beta';

-- Backfill: every existing donation is from the closed beta period.
UPDATE donations SET phase = 'closed_beta' WHERE phase = '';

CREATE INDEX IF NOT EXISTS donations_phase_idx ON donations(phase);

-- 2. Funnel events — every page view + key action by every visitor (not just
-- those who donate). Lets us answer "how many entered Riba flow but didn't
-- finish?" or "what's the conversion rate from home to checkout?".
CREATE TABLE IF NOT EXISTS funnel_events (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,                    -- client UUID in localStorage
  user_id     TEXT,                             -- Clerk userId when signed in
  event       TEXT NOT NULL,                    -- 'page_view' | 'service_picked' | 'checkout_viewed' | 'donation_completed' | ...
  flow        TEXT,                             -- 'riba' | 'zakat' | ... if applicable
  step        TEXT,                             -- screen key like 'home' | 'riba-2' | 'checkout'
  meta        JSONB,                            -- free-form payload (amount, payMethod, etc.)
  phase       TEXT NOT NULL DEFAULT 'closed_beta',
  ip          TEXT,
  ua          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS funnel_events_session_idx ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS funnel_events_event_idx   ON funnel_events(event);
CREATE INDEX IF NOT EXISTS funnel_events_phase_idx   ON funnel_events(phase);
CREATE INDEX IF NOT EXISTS funnel_events_created_idx ON funnel_events(created_at DESC);
