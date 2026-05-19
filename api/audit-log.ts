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
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const rows = await sql`
    SELECT id, user_id AS "userId", action, resource_id AS "resourceId",
           payload, ip, user_agent AS "userAgent",
           to_char(created_at, 'DD Mon YYYY HH24:MI:SS') AS "createdAt"
    FROM audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return res.json(rows);
});
