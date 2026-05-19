import type { VercelRequest, VercelResponse } from '@vercel/node';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { withErrors } from '../_lib/handler.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

// GET /api/promptpay/qr?amount=120
// Returns an SVG QR that Thai bank apps can scan via PromptPay.
//
// SAFETY: PROMPTPAY_ID MUST be set in the environment. If it's missing or
// equals the well-known sample number 0812345678 (a valid Thai phone format
// that may be registered to an unknown account), we refuse to generate a
// real scannable QR. Instead we return a placeholder SVG that says
// "NOT CONFIGURED" so beta testers can't accidentally pay a stranger.

const UNSAFE_PLACEHOLDER = '0812345678';

function placeholderSvg(amount: number, reason: string): string {
  // Plain SVG — no real PromptPay payload encoded. Cannot be scanned for payment.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <rect width="220" height="220" fill="#FBE4DF"/>
  <rect x="10" y="10" width="200" height="200" rx="10" fill="none" stroke="#C0392B" stroke-width="3" stroke-dasharray="8 6"/>
  <text x="110" y="74" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#7a2a1a">TESTING MODE</text>
  <text x="110" y="98" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="12" fill="#7a2a1a">QR not configured</text>
  <text x="110" y="118" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#7a2a1a">${reason}</text>
  <text x="110" y="150" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#7a2a1a">amount requested: ฿${amount.toLocaleString()}</text>
  <text x="110" y="178" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="10" fill="#7a2a1a">DO NOT PAY · set PROMPTPAY_ID on Vercel</text>
</svg>`;
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (!(await rateLimit(req, res, { scope: 'qr', max: 60, windowSeconds: 60 }))) return;

  const amount = Number(req.query.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return res.status(400).json({ error: 'amount required, 1..10000000' });
  }

  const target = process.env.PROMPTPAY_ID;
  const isPlaceholder = !target || target === UNSAFE_PLACEHOLDER;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (isPlaceholder) {
    return res.send(placeholderSvg(amount, !target ? 'PROMPTPAY_ID unset' : 'sample number blocked'));
  }

  const payload = generatePayload(target, { amount });
  const svg = await QRCode.toString(payload, { type: 'svg', margin: 0, width: 220, color: { dark: '#0E1A14', light: '#FFFFFF' } });
  res.send(svg);
});
