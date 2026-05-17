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
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
    const [row] = await sql`
      SELECT id, icon, name, goal, raised, target, pitch, hot FROM orgs WHERE id = ${id}
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.json(row);
  }
  if (req.method === 'PATCH') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      icon:   { type: 'string', oneOf: ['hospital','road','toilet','community'] as const },
      name:   { type: 'string', max: 200 },
      goal:   { type: 'string', max: 500 },
      raised: { type: 'int', min: 0, max: 1_000_000_000 },
      target: { type: 'int', min: 0, max: 1_000_000_000 },
      pitch:  { type: 'string', max: 2000 },
      hot:    { type: 'bool' },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      UPDATE orgs SET
        icon   = COALESCE(${b.icon ?? null}, icon),
        name   = COALESCE(${b.name ?? null}, name),
        goal   = COALESCE(${b.goal ?? null}, goal),
        raised = COALESCE(${b.raised ?? null}, raised),
        target = COALESCE(${b.target ?? null}, target),
        pitch  = COALESCE(${b.pitch ?? null}, pitch),
        hot    = COALESCE(${b.hot ?? null}, hot),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, icon, name, goal, raised, target, pitch, hot
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    await audit(req, 'orgs.update', id, admin.userId, b);
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM orgs WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'orgs.delete', id, admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).end();
});
