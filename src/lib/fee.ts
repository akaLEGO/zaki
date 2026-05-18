// Amil-fee policy.
//
// Riba is not Zakat — it's interest being divested into public good. The
// receiving org absorbs its own admin cost (5%), so the donor pays gross and
// fee_amount on Kaff's side stays 0.
//
// Every other flow IS Zakat-eligible (Zakat itself, Fitrah, Fidyah, Kaffarah,
// Qurban, Sadaqah). The Quran (9:60) lists Amil — those who collect Zakat — as
// one of the 8 Asnaf, so Kaff legitimately receives 5% out of the donation as
// the Amil's share. The recipient gets the remaining 95%.
//
// Server has a mirror of this file at api/_lib/fee.ts — keep them in sync.

export const AMIL_FEE_RATE: Record<string, number> = {
  riba:     0,
  zakat:    0.05,
  fitrah:   0.05,
  fidyah:   0.05,
  kaffarah: 0.05,
  qurban:   0.05,
  sadaqah:  0.05,
};

export function amilFee(flow: string, amount: number): number {
  const rate = AMIL_FEE_RATE[flow] ?? 0;
  return Math.round(amount * rate);
}

export function recipientNet(flow: string, amount: number): number {
  return amount - amilFee(flow, amount);
}
