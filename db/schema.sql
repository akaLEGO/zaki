-- Kaff schema. Run once via Neon SQL editor (or psql) against your DATABASE_URL.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS orgs (
  id          TEXT PRIMARY KEY,
  icon        TEXT NOT NULL CHECK (icon IN ('hospital','road','toilet','community')),
  name        TEXT NOT NULL,
  goal        TEXT NOT NULL,
  raised      INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL,
  pitch       TEXT NOT NULL,
  hot         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asnaf (
  id            TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  sub           TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recipients (
  id          SERIAL PRIMARY KEY,
  asnaf       TEXT NOT NULL REFERENCES asnaf(id),
  name        TEXT NOT NULL,
  received    INTEGER NOT NULL DEFAULT 0,
  area        TEXT,
  fair        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  tag         TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  title       TEXT NOT NULL,
  sub         TEXT NOT NULL,
  raised      INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL,
  unit        TEXT NOT NULL,
  color       TEXT NOT NULL,
  pitch       TEXT NOT NULL,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  per_unit    INTEGER,
  status      TEXT NOT NULL DEFAULT 'live'
              CHECK (status IN ('draft','live','live-featured','archived')),
  shariah     TEXT NOT NULL DEFAULT 'pending'
              CHECK (shariah IN ('approved','pending')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qurban_options (
  id        SERIAL PRIMARY KEY,
  country   TEXT NOT NULL UNIQUE,
  flag      TEXT NOT NULL,
  price     INTEGER NOT NULL,
  currency  TEXT NOT NULL,
  sub       TEXT,
  animal    TEXT NOT NULL,
  popular   BOOLEAN NOT NULL DEFAULT FALSE,
  special   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS qurban_locations (
  id      TEXT PRIMARY KEY,
  flag    TEXT NOT NULL,
  name    TEXT NOT NULL,
  impact  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kaffarah_types (
  id      TEXT PRIMARY KEY CHECK (id IN ('oath','fast','dhihar','general')),
  label   TEXT NOT NULL,
  amount  INTEGER NOT NULL,
  sub     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS donations (
  id           SERIAL PRIMARY KEY,
  ref          TEXT UNIQUE NOT NULL,
  user_id      TEXT,
  flow         TEXT NOT NULL
               CHECK (flow IN ('riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah')),
  amount       INTEGER NOT NULL,
  destination  TEXT,
  pay_method   TEXT CHECK (pay_method IN ('qr','bank','usdc')),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','completed','failed')),
  niyyah       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_user_idx ON donations(user_id);
CREATE INDEX IF NOT EXISTS donations_flow_idx ON donations(flow);
CREATE INDEX IF NOT EXISTS recipients_asnaf_idx ON recipients(asnaf);
