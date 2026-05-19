import type { VercelRequest, VercelResponse } from '@vercel/node';
import QRCode from 'qrcode';
import { withErrors } from '../_lib/handler.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

// GET /api/base/qr?amount=<usdc>
// Generates an EIP-681 payment URI for a USDC transfer on Base (chain 8453)
// and returns it as a scannable SVG QR. Wallets like Coinbase Wallet,
// MetaMask Mobile, Rainbow scan and pre-fill the transaction.
//
// SAFETY: same pattern as /api/promptpay/qr — if KAFF_BASE_WALLET isn't set
// or isn't a valid 0x-prefixed address, return a clearly-marked red
// placeholder SVG that cannot be parsed as a real transfer instruction.

const USDC_BASE_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453;
const HEX_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function placeholderSvg(amount: number, reason: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <rect width="220" height="220" fill="#FBE4DF"/>
  <rect x="10" y="10" width="200" height="200" rx="10" fill="none" stroke="#C0392B" stroke-width="3" stroke-dasharray="8 6"/>
  <text x="110" y="74" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#7a2a1a">TESTING MODE</text>
  <text x="110" y="98" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="12" fill="#7a2a1a">Base wallet not configured</text>
  <text x="110" y="118" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#7a2a1a">${reason}</text>
  <text x="110" y="150" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#7a2a1a">amount requested: ${amount.toFixed(2)} USDC</text>
  <text x="110" y="178" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="10" fill="#7a2a1a">DO NOT SEND · set KAFF_BASE_WALLET on Vercel</text>
</svg>`;
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'qr', max: 60, windowSeconds: 60 }))) return;

  const usdcAmount = Number(req.query.amount);
  if (!Number.isFinite(usdcAmount) || usdcAmount <= 0 || usdcAmount > 1_000_000) {
    return res.status(400).json({ error: 'amount (USDC) required, 0 < x <= 1000000' });
  }

  const wallet = process.env.KAFF_BASE_WALLET;
  const validWallet = wallet && HEX_ADDRESS_RE.test(wallet);

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (!validWallet) {
    return res.send(placeholderSvg(usdcAmount, !wallet ? 'KAFF_BASE_WALLET unset' : 'invalid address format'));
  }

  // USDC has 6 decimals on every chain — convert to base units.
  const microUsdc = BigInt(Math.round(usdcAmount * 1_000_000));
  const uri = `ethereum:${USDC_BASE_CONTRACT}@${BASE_CHAIN_ID}/transfer?address=${wallet}&uint256=${microUsdc.toString()}`;

  const svg = await QRCode.toString(uri, {
    type: 'svg',
    margin: 0,
    width: 220,
    color: { dark: '#0E1A14', light: '#FFFFFF' },
  });
  res.send(svg);
});
