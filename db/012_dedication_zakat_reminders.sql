-- Dedication giving + Zakat hawl reminders. Run in Neon SQL editor. Idempotent.

-- "ทำในนามของ / อุทิศแด่" — e.g. Qurban on behalf of a deceased parent.
-- Shown on receipt, shareable card, and the email.
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS dedication TEXT;

-- Annual Zakat (hawl) reminder. One row per email, recurring: after each
-- send the cron advances next_due_date by ~1 lunar year (354 days).
CREATE TABLE IF NOT EXISTS zakat_reminders (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  name          TEXT,
  next_due_date DATE NOT NULL,
  last_sent_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS zakat_reminders_email_ux
  ON zakat_reminders (LOWER(email));
CREATE INDEX IF NOT EXISTS zakat_reminders_due_idx
  ON zakat_reminders (next_due_date);
