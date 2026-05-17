import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id);
  if (req.method === 'GET') {
    const [row] = await sql`
      SELECT id, icon, name, goal, raised, target, pitch, hot FROM orgs WHERE id = ${id}
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.json(row);
  }
  if (req.method === 'PATCH') {
    if (!(await requireAuth(req, res))) return;
    const b = req.body || {};
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
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await requireAuth(req, res))) return;
    const result = await sql`DELETE FROM orgs WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  }
  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).end();
}
