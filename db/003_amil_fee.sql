-- Per-donation fee tracking. Amil (one of the 8 Asnaf) is the canonical recipient
-- for Kaff's administrative cut on Zakat-type flows. For Riba, the receiving org
-- absorbs the fee internally, so fee_amount stays 0.
--
-- Run once in Neon SQL Editor.

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS fee_amount INTEGER NOT NULL DEFAULT 0
    CHECK (fee_amount >= 0);

-- Optional convenience view of "net to recipient" amounts.
CREATE OR REPLACE VIEW donations_with_net AS
  SELECT *, (amount - fee_amount) AS net_amount
  FROM donations;
