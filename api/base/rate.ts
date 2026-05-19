import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrors } from '../_lib/handler.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

// GET /api/base/rate
// Returns the current THB price of 1 USDC, sourced from CoinGecko's free API
// and cached at Vercel's edge for 5 minutes (10 minutes stale-while-revalidate).
// CoinGecko free tier allows ~30 calls/min — the CDN cache should keep us well
// under that even at hundreds of concurrent consumers.
//
// Response: { rate: 35.42, source: 'coingecko' }  // 1 USDC = 35.42 THB

const FALLBACK_RATE = 35;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'rate', max: 30, windowSeconds: 60 }))) return;

  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=thb',
      { headers: { Accept: 'application/json' } },
    );
    if (!r.ok) throw new Error(`coingecko status ${r.status}`);
    const data = (await r.json()) as { 'usd-coin'?: { thb?: number } };
    const thb = data['usd-coin']?.thb;
    if (typeof thb !== 'number' || thb <= 0) throw new Error('bad shape');

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.json({ rate: thb, source: 'coingecko', updatedAt: new Date().toISOString() });
  } catch (e) {
    // Don't fail the donation flow if the rate API is down — fall back to a
    // sane approximation and let the client display a "rate unavailable" hint.
    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      rate: FALLBACK_RATE,
      source: 'fallback',
      error: String(e instanceof Error ? e.message : e),
      updatedAt: new Date().toISOString(),
    });
  }
});
