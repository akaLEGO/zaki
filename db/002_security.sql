-- Security hardening migration. Run after schema.sql + seed.sql.

CREATE TABLE IF NOT EXISTS admin_users (
  user_id    TEXT PRIMARY KEY,            -- Clerk user id (subject)
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT,
  action      TEXT NOT NULL,               -- e.g. 'orgs.update', 'campaigns.delete'
  resource_id TEXT,
  payload     JSONB,                       -- the request body for forensic replay
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS rate_buckets (
  key         TEXT PRIMARY KEY,            -- e.g. 'donation:1.2.3.4'
  count       INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tighten donations: amount bounds + text length sanity
ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_amount_check,
  ADD CONSTRAINT donations_amount_check CHECK (amount > 0 AND amount <= 10000000);

-- Bootstrap your own admin row. Edit user_id to your Clerk user_id.
-- Find it at clerk.com -> Users -> click your user -> copy the user_xxx... id.
-- INSERT INTO admin_users (user_id, email, role) VALUES ('user_REPLACE_ME', 'you@example.com', 'super');
