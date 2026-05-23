// Tipping model — no Amil fee anymore.
//
// Pre-pivot policy was: Kaff took 5% of every Zakat-eligible donation as
// the "Amil" share (Quran 9:60). New policy as of v0.5.0-beta.2: donors
// pay 100% to the recipient/partner, and Kaff is sustained by voluntary
// tips left at checkout success (flow='tip'). No fee is computed for any
// flow now. The fee_amount column on donations stays for historical rows.
//
// Server has a mirror of this file at api/_lib/fee.ts — keep them in sync.

export const AMIL_FEE_RATE: Record<string, number> = {
  riba:     0,
  zakat:    0,
  fitrah:   0,
  fidyah:   0,
  kaffarah: 0,
  qurban:   0,
  sadaqah:  0,
  tip:      0,
};

export function amilFee(_flow: string, _amount: number): number {
  return 0;
}

export function recipientNet(_flow: string, amount: number): number {
  return amount;
}
