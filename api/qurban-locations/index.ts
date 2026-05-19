import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { requireAdmin } from '../_lib/auth.js';
import { audit } from '../_lib/audit.js';
import { validate } from '../_lib/validate.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method === 'POST') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      id:     { type: 'string', required: true, max: 64, pattern: /^[a-z0-9-]+$/ },
      flag:   { type: 'string', required: true, max: 8 },
      name:   { type: 'string', required: true, max: 200 },
      impact: { type: 'string', required: true, max: 500 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      INSERT INTO qurban_locations (id, flag, name, impact)
      VALUES (${b.id}, ${b.flag}, ${b.name}, ${b.impact})
      RETURNING id, flag, name, impact
    `;
    await audit(req, 'qurban_locations.create', String(b.id), admin.userId, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'POST');
  return res.status(405).end();
});
