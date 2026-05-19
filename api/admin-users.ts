import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { withErrors } from './_lib/handler.js';
import { requireAdmin } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'read', max: 60, windowSeconds: 60 }))) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const rows = await sql`
    SELECT user_id AS "userId", email, role,
           to_char(created_at, 'DD Mon YYYY') AS "createdAt"
    FROM admin_users
    ORDER BY created_at ASC
  `;
  return res.json(rows);
});
