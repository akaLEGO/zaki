import type { VercelRequest, VercelResponse } from '@vercel/node';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { withErrors } from '../_lib/handler.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

// GET /api/promptpay/qr?amount=120
// Returns an SVG QR that any Thai bank app can scan via PromptPay.
// Receiver = PROMPTPAY_ID env var (set on Vercel). Falls back to a placeholder
// so the demo still renders something scannable until the real ID is wired.

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (!(await rateLimit(req, res, { scope: 'qr', max: 60, windowSeconds: 60 }))) return;

  const amount = Number(req.query.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return res.status(400).json({ error: 'amount required, 1..10000000' });
  }

  const target = process.env.PROMPTPAY_ID || '0812345678';
  const payload = generatePayload(target, { amount });
  const svg = await QRCode.toString(payload, { type: 'svg', margin: 0, width: 220, color: { dark: '#0E1A14', light: '#FFFFFF' } });

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(svg);
});
