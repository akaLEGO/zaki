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
  const id = String(req.query.id);
  if (req.method === 'PATCH') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      flag:   { type: 'string', max: 8 },
      name:   { type: 'string', max: 200 },
      impact: { type: 'string', max: 500 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      UPDATE qurban_locations SET
        flag   = COALESCE(${b.flag ?? null}, flag),
        name   = COALESCE(${b.name ?? null}, name),
        impact = COALESCE(${b.impact ?? null}, impact)
      WHERE id = ${id}
      RETURNING id, flag, name, impact
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    await audit(req, 'qurban_locations.update', id, admin.userId, b);
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM qurban_locations WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'qurban_locations.delete', id, admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
});
