-- Zakat disbursement chain: 8-asnaf split, partner payout, recipient notice,
-- thank-you relay. Run in Neon SQL editor. Idempotent.
--
-- Model: Kaff never pays an individual directly. The chain is
--   donor → Kaff → partner (มัสยิด/มูลนิธิ) → recipient
-- Kaff can attest to the first two links from its own records; the third is
-- attested by the partner and only recorded here. Every receipt must keep
-- those confidence levels distinct.
--
-- Privacy: both sides are anonymous by default. The donor never sees a
-- recipient's name, the recipient never sees the donor's. The donor's bank
-- slip is internal verification evidence only and is never forwarded — the
-- recipient gets a Kaff-generated notice instead (disbursement_notices), so
-- donor identity is absent by construction rather than redacted after the
-- fact.

-- ── donations ───────────────────────────────────────────────────────────────

ALTER TABLE donations
  -- Zakat previously recorded its target only as the free-text `destination`
  -- name, so a gift could not be tied back to a recipient row.
  ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES recipients(id) ON DELETE SET NULL,
  -- Anonymous in both directions. Default TRUE: anonymity is the safe state,
  -- and un-anonymising requires a deliberate write.
  ADD COLUMN IF NOT EXISTS anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  -- Slip retention. The slip carries the donor's account number and, on some
  -- banks, their balance; keep it only as long as reconciliation needs it.
  ADD COLUMN IF NOT EXISTS slip_purge_after TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slip_purged_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS donations_recipient_idx ON donations(recipient_id);
-- Drives the purge job: rows still holding an image past their retention date.
CREATE INDEX IF NOT EXISTS donations_slip_purge_idx
  ON donations(slip_purge_after)
  WHERE slip_image IS NOT NULL AND slip_purged_at IS NULL;

-- ── recipients ──────────────────────────────────────────────────────────────
-- A recipient is vouched for by a partner organisation — Kaff does not certify
-- asnaf eligibility itself. Contact details and the real name stay here for the
-- partner's use; the app renders `display_label` instead.

ALTER TABLE recipients
  ADD COLUMN IF NOT EXISTS vouched_by     TEXT REFERENCES partners(id) ON DELETE SET NULL,
  -- Pseudonym shown in the app, e.g. "ครอบครัว ก. · ยะลา". Never the real name.
  ADD COLUMN IF NOT EXISTS display_label  TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS contact_note   TEXT,
  -- PDPA: recorded consent to be listed (pseudonymously) and to receive notices.
  ADD COLUMN IF NOT EXISTS consent_listed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_note   TEXT,
  ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active         BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS recipients_vouched_idx ON recipients(vouched_by);

-- Only recipients who are vouched for AND have consented may be listed.
-- Enforced in the API; this view is the single source of truth for "listable".
CREATE OR REPLACE VIEW recipients_listable AS
  SELECT id, asnaf, COALESCE(display_label, 'ผู้รับ #' || id) AS label,
         area, vouched_by, verified_at
    FROM recipients
   WHERE active
     AND consent_listed
     AND vouched_by IS NOT NULL
     AND verified_at IS NOT NULL;

-- ── donation_allocations ────────────────────────────────────────────────────
-- One zakat payment split across the 8 asnaf. Percentages are stored alongside
-- the resolved amount so a later change to the split rule cannot silently
-- rewrite history.

CREATE TABLE IF NOT EXISTS donation_allocations (
  id          SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  asnaf       TEXT    NOT NULL REFERENCES asnaf(id),
  percent     NUMERIC(5,2) NOT NULL CHECK (percent > 0 AND percent <= 100),
  amount      INTEGER NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (donation_id, asnaf)
);
CREATE INDEX IF NOT EXISTS donation_allocations_donation_idx
  ON donation_allocations(donation_id);

-- ── disbursements ───────────────────────────────────────────────────────────
-- The partner's report that money reached a recipient. Kaff records it; the
-- partner attests to it. `attested_by` names who is making the claim, so a
-- receipt can say "รับรองโดย <partner>" rather than implying Kaff observed it.

CREATE TABLE IF NOT EXISTS disbursements (
  id           SERIAL PRIMARY KEY,
  donation_id  INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  partner_id   TEXT    NOT NULL REFERENCES partners(id),
  recipient_id INTEGER REFERENCES recipients(id) ON DELETE SET NULL,
  asnaf        TEXT    REFERENCES asnaf(id),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  method       TEXT    NOT NULL DEFAULT 'cash'
                       CHECK (method IN ('cash','transfer','goods')),
  disbursed_at TIMESTAMPTZ NOT NULL,
  -- Handover evidence from the partner: photo, signed receipt, voucher.
  proof_url    TEXT,
  proof_note   TEXT,
  -- Who asserts this happened, e.g. 'partner:masjid-yala' or 'admin:<userId>'
  -- when an admin enters it from the partner's emailed report.
  attested_by  TEXT    NOT NULL,
  -- Recipient notification — normally the partner tells them in person.
  recipient_notified_at TIMESTAMPTZ,
  notified_via TEXT CHECK (notified_via IN ('in_person','sms','line','none')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS disbursements_donation_idx  ON disbursements(donation_id);
CREATE INDEX IF NOT EXISTS disbursements_recipient_idx ON disbursements(recipient_id);
CREATE INDEX IF NOT EXISTS disbursements_partner_idx   ON disbursements(partner_id, disbursed_at DESC);

-- ── disbursement_notices ────────────────────────────────────────────────────
-- The recipient-facing document Kaff generates. Replaces forwarding a redacted
-- bank slip: it holds only amount, date, reference, asnaf and the vouching
-- partner, so there is no donor identity in it to leak.

CREATE TABLE IF NOT EXISTS disbursement_notices (
  id              SERIAL PRIMARY KEY,
  disbursement_id INTEGER NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
  notice_ref      TEXT UNIQUE NOT NULL,
  amount          INTEGER NOT NULL,
  asnaf_label     TEXT,
  partner_name    TEXT,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  delivered_via   TEXT CHECK (delivered_via IN ('in_person','sms','line','print'))
);
CREATE INDEX IF NOT EXISTS disbursement_notices_disb_idx
  ON disbursement_notices(disbursement_id);

-- ── recipient_messages ──────────────────────────────────────────────────────
-- Thank-you from recipient to donor. One-way and mediated: the recipient gives
-- it to the partner, the partner records it with consent, Kaff moderates, then
-- it is relayed to the donor with no identity on either side. There is no reply
-- path by design — a direct channel between a donor who knows someone is poor
-- and a vulnerable person is not a feature worth having.

CREATE TABLE IF NOT EXISTS recipient_messages (
  id               SERIAL PRIMARY KEY,
  disbursement_id  INTEGER NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
  body             TEXT,
  media_url        TEXT,              -- voice note or photo, if the recipient prefers
  -- Recorded consent to pass the message on. Without it the message is held
  -- and never relayed.
  consent_to_share BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by      TEXT NOT NULL,     -- 'partner:<id>' | 'admin:<userId>'
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','relayed')),
  -- Moderation strips anything identifying either side before relay.
  moderated_by     TEXT,
  moderated_at     TIMESTAMPTZ,
  moderation_note  TEXT,
  relayed_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recipient_messages_body_or_media
    CHECK (body IS NOT NULL OR media_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS recipient_messages_disb_idx
  ON recipient_messages(disbursement_id);
-- Moderation queue.
CREATE INDEX IF NOT EXISTS recipient_messages_pending_idx
  ON recipient_messages(created_at)
  WHERE status = 'pending';

-- ── verify ──────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--  WHERE table_name IN ('donation_allocations','disbursements',
--                       'disbursement_notices','recipient_messages')
--  ORDER BY table_name;
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'donations' AND column_name IN
--        ('recipient_id','anonymous','slip_purge_after','slip_purged_at');
