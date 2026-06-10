// Public transparency stats — fuels the home social-proof strip and the
// transparency sheet. Only verified money (status='completed') and only
// real donations (is_test=false). Donor names are reduced to first name
// for the recent-activity list; no contact data ever leaves this endpoint.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';
import { withErrors } from './_lib/handler.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'read', max: 60, windowSeconds: 60 }))) return;

  const [totalsRows, byFlow, recent] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS count,
             COALESCE(SUM(amount), 0)::int AS amount,
             COUNT(DISTINCT LOWER(donor_email))::int AS donors
      FROM donations
      WHERE is_test = FALSE AND status = 'completed' AND flow <> 'tip'
    `,
    sql`
      SELECT flow, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::int AS amount
      FROM donations
      WHERE is_test = FALSE AND status = 'completed' AND flow <> 'tip'
      GROUP BY flow
      ORDER BY amount DESC
    `,
    sql`
      SELECT donor_first_name AS "firstName", flow,
             to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at
      FROM donations
      WHERE is_test = FALSE AND status = 'completed' AND flow <> 'tip'
      ORDER BY created_at DESC
      LIMIT 6
    `,
  ]);

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.json({ totals: totalsRows[0], byFlow, recent });
});
