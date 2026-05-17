import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, icon, name, goal, raised, target, pitch, hot
      FROM orgs
      ORDER BY hot DESC, (raised::float / NULLIF(target,0)) DESC NULLS LAST
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await requireAuth(req, res))) return;
    const { id, icon, name, goal, raised, target, pitch, hot } = req.body || {};
    if (!id || !icon || !name) return res.status(400).json({ error: 'id, icon, name required' });
    const [row] = await sql`
      INSERT INTO orgs (id, icon, name, goal, raised, target, pitch, hot)
      VALUES (${id}, ${icon}, ${name}, ${goal || ''}, ${raised || 0}, ${target || 0}, ${pitch || ''}, ${!!hot})
      RETURNING id, icon, name, goal, raised, target, pitch, hot
    `;
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
