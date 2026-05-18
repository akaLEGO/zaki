// Server mirror of src/lib/fee.ts. Single source of truth for the policy lives
// in the client file's comments — keep this in lockstep.

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
