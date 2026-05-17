import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, tag, emoji, title, sub, raised, target, unit, color, pitch,
             featured, per_unit AS "perUnit", status, shariah,
             to_char(updated_at, 'DD Mon') AS "updatedAt"
      FROM campaigns
      ORDER BY featured DESC, updated_at DESC
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await requireAuth(req, res))) return;
    const b = req.body || {};
    if (!b.id || !b.title) return res.status(400).json({ error: 'id, title required' });
    const [row] = await sql`
      INSERT INTO campaigns (id, tag, emoji, title, sub, raised, target, unit, color, pitch, featured, per_unit, status, shariah)
      VALUES (
        ${b.id}, ${b.tag || ''}, ${b.emoji || '🌟'}, ${b.title}, ${b.sub || ''},
        ${b.raised || 0}, ${b.target || 0}, ${b.unit || 'บาท'}, ${b.color || '#0D3B2E'},
        ${b.pitch || ''}, ${!!b.featured}, ${b.perUnit ?? null},
        ${b.status || 'draft'}, ${b.shariah || 'pending'}
      )
      RETURNING id, tag, emoji, title, sub, raised, target, unit, color, pitch,
                featured, per_unit AS "perUnit", status, shariah,
                to_char(updated_at, 'DD Mon') AS "updatedAt"
    `;
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
