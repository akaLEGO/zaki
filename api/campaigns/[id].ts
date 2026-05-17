import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.id);
  if (req.method === 'PATCH') {
    if (!(await requireAuth(req, res))) return;
    const b = req.body || {};
    const [row] = await sql`
      UPDATE campaigns SET
        tag      = COALESCE(${b.tag ?? null}, tag),
        emoji    = COALESCE(${b.emoji ?? null}, emoji),
        title    = COALESCE(${b.title ?? null}, title),
        sub      = COALESCE(${b.sub ?? null}, sub),
        raised   = COALESCE(${b.raised ?? null}, raised),
        target   = COALESCE(${b.target ?? null}, target),
        unit     = COALESCE(${b.unit ?? null}, unit),
        color    = COALESCE(${b.color ?? null}, color),
        pitch    = COALESCE(${b.pitch ?? null}, pitch),
        featured = COALESCE(${b.featured ?? null}, featured),
        per_unit = COALESCE(${b.perUnit ?? null}, per_unit),
        status   = COALESCE(${b.status ?? null}, status),
        shariah  = COALESCE(${b.shariah ?? null}, shariah),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, tag, emoji, title, sub, raised, target, unit, color, pitch,
                featured, per_unit AS "perUnit", status, shariah,
                to_char(updated_at, 'DD Mon') AS "updatedAt"
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await requireAuth(req, res))) return;
    const result = await sql`DELETE FROM campaigns WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
}
