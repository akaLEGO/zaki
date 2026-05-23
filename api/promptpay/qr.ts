import type { VercelRequest, VercelResponse } from '@vercel/node';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { withErrors } from '../_lib/handler.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

// GET /api/promptpay/qr?amount=120&to=ngo|kaff   (to defaults to ngo)
// Returns an SVG QR that Thai bank apps can scan via PromptPay.
//
// Tipping-model split:
//   PROMPTPAY_NGO_ID  — recipient organisation (donations land here, 100%)
//   PROMPTPAY_KAFF_ID — Kaff Foundation (tips land here)
//
// Backwards-compat: if PROMPTPAY_NGO_ID isn't set we fall back to the older
// PROMPTPAY_ID env so existing Vercel projects keep working until env is
// renamed.
//
// SAFETY: if the chosen target isn't set OR equals the well-known sample
// 0812345678 (a valid Thai phone format that may be registered to an
// unknown account), we refuse to encode a real PromptPay payload and
// return a clearly-marked red placeholder SVG instead.

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

  const to = String(req.query.to || 'ngo').toLowerCase();
  let target: string | undefined;
  if (to === 'kaff') {
    target = process.env.PROMPTPAY_KAFF_ID;
  } else {
    // 'ngo' (default) — prefer the new var, fall back to the legacy single-account env.
    target = process.env.PROMPTPAY_NGO_ID || process.env.PROMPTPAY_ID;
  }
  const isPlaceholder = !target || target === UNSAFE_PLACEHOLDER;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (isPlaceholder) {
    const envName = to === 'kaff' ? 'PROMPTPAY_KAFF_ID' : 'PROMPTPAY_NGO_ID';
    return res.send(placeholderSvg(amount, !target ? `${envName} unset` : 'sample number blocked'));
  }

  const payload = generatePayload(target, { amount });
  const svg = await QRCode.toString(payload, { type: 'svg', margin: 0, width: 220, color: { dark: '#0E1A14', light: '#FFFFFF' } });
  res.send(svg);
});
