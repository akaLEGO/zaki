import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAdmin } from '../_lib/auth';
import { audit } from '../_lib/audit';
import { validate } from '../_lib/validate';
import { cors } from '../_lib/cors';
import { rateLimit } from '../_lib/ratelimit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
    const rows = await sql`
      SELECT id, icon, name, goal, raised, target, pitch, hot
      FROM orgs
      ORDER BY hot DESC, (raised::float / NULLIF(target,0)) DESC NULLS LAST
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      id:     { type: 'string', required: true, max: 64, pattern: /^[a-z0-9-]+$/ },
      icon:   { type: 'string', required: true, oneOf: ['hospital','road','toilet','community'] as const },
      name:   { type: 'string', required: true, max: 200 },
      goal:   { type: 'string', max: 500 },
      raised: { type: 'int', min: 0, max: 1_000_000_000 },
      target: { type: 'int', min: 0, max: 1_000_000_000 },
      pitch:  { type: 'string', max: 2000 },
      hot:    { type: 'bool' },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as { id: string; icon: string; name: string; goal?: string; raised?: number; target?: number; pitch?: string; hot?: boolean };
    const [row] = await sql`
      INSERT INTO orgs (id, icon, name, goal, raised, target, pitch, hot)
      VALUES (${b.id}, ${b.icon}, ${b.name}, ${b.goal || ''}, ${b.raised || 0}, ${b.target || 0}, ${b.pitch || ''}, ${!!b.hot})
      RETURNING id, icon, name, goal, raised, target, pitch, hot
    `;
    await audit(req, 'orgs.create', b.id, admin.userId, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
