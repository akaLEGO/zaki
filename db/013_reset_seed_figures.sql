-- 013_reset_seed_figures.sql
--
-- Clears the demo progress figures that shipped from db/seed.sql and are
-- currently shown to real donors on www.kaff.me.
--
-- Why this matters: /api/stats reports 0 confirmed donations, yet the app
-- displays "฿184,500 / ฿200,000 · 92% · ใกล้สำเร็จ เหลืออีก ฿15,500" against a
-- named real organisation, plus per-recipient "ได้รับเดือนนี้ ฿800". None of
-- those amounts were ever given through Kaff. That is fabricated social proof
-- used to solicit real money.
--
-- Safe to run: orgs.raised / campaigns.raised are only ever incremented
-- additively (`raised = raised + amount`) and each donation is guarded by
-- donations.counted_in_raised, so zeroing them now simply means real totals
-- start from zero. recipients.received is never written by application code
-- at all — it is static seed data.
--
-- Run in the Neon SQL Editor (same place as the other migrations).

BEGIN;

-- 1. Snapshot the current values first, so this is reversible.
CREATE TABLE IF NOT EXISTS seed_figure_backup_013 (
  kind       TEXT NOT NULL,
  id         TEXT NOT NULL,
  raised     INTEGER,
  hot        BOOLEAN,
  fair       TEXT,
  taken_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO seed_figure_backup_013 (kind, id, raised, hot)
  SELECT 'org', id, raised, hot FROM orgs;

INSERT INTO seed_figure_backup_013 (kind, id, raised)
  SELECT 'campaign', id, raised FROM campaigns;

INSERT INTO seed_figure_backup_013 (kind, id, raised, fair)
  SELECT 'recipient', id::TEXT, received, fair FROM recipients;

-- 2. Reset the fabricated figures.

-- "ใกล้สำเร็จ · เหลืออีก ฿15,500" ribbon is driven by `hot`; with raised = 0
-- the urgency claim is false, so it comes off too.
UPDATE orgs SET raised = 0, hot = FALSE;

UPDATE campaigns SET raised = 0;

-- `fair` ("แนะนำให้กระจาย") is advice derived from the invented `received`
-- amounts, so it goes with them.
UPDATE recipients SET received = 0, fair = NULL;

COMMIT;

-- 3. Verify — every row should read 0.
-- SELECT 'org' AS kind, id, raised, hot::TEXT FROM orgs
-- UNION ALL SELECT 'campaign', id, raised, NULL FROM campaigns
-- UNION ALL SELECT 'recipient', id::TEXT, received, NULL FROM recipients
-- ORDER BY kind, id;

-- To roll back:
-- UPDATE orgs o       SET raised = b.raised, hot = b.hot
--   FROM seed_figure_backup_013 b WHERE b.kind = 'org' AND b.id = o.id;
-- UPDATE campaigns c  SET raised = b.raised
--   FROM seed_figure_backup_013 b WHERE b.kind = 'campaign' AND b.id = c.id;
-- UPDATE recipients r SET received = b.raised, fair = b.fair
--   FROM seed_figure_backup_013 b WHERE b.kind = 'recipient' AND b.id = r.id::TEXT;
