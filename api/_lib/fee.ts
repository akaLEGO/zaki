// Server mirror of src/lib/fee.ts. Single source of truth lives in the
// client file's comments — keep this in lockstep.
//
// As of v0.5.0-beta.2 (tipping model): Kaff no longer takes an Amil fee.
// 100% of every donation goes to the recipient/partner. Kaff sustains
// itself via voluntary tips left on the success screen (flow='tip').
// We keep this module + the fee_amount column for backwards-compat with
// pre-pivot donations.

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
