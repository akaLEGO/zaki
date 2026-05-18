import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';
import { withErrors } from '../_lib/handler.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
  const user = await requireAuth(req, res);
  if (!user) return;

  const rows = await sql`
    SELECT id, ref, flow, amount, fee_amount AS "feeAmount",
           destination, pay_method AS "payMethod", status, niyyah,
           to_char(created_at, 'DD Mon YYYY') AS "createdAt",
           created_at AS "createdAtRaw"
    FROM donations
    WHERE user_id = ${user.userId} AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 200
  `;

  // Sum YTD
  const [{ ytd }] = await sql`
    SELECT COALESCE(SUM(amount), 0)::int AS ytd
    FROM donations
    WHERE user_id = ${user.userId}
      AND status = 'completed'
      AND created_at >= date_trunc('year', NOW())
  ` as { ytd: number }[];

  res.json({ items: rows, ytd });
});
