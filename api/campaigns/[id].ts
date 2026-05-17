import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { withErrors } from '../_lib/handler';
import { requireAdmin } from '../_lib/auth';
import { audit } from '../_lib/audit';
import { validate } from '../_lib/validate';
import { cors } from '../_lib/cors';
import { rateLimit } from '../_lib/ratelimit';

const STATUSES = ['draft','live','live-featured','archived'] as const;
const SHARIAH = ['approved','pending'] as const;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  const id = String(req.query.id);
  if (req.method === 'PATCH') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      tag:      { type: 'string', max: 32 },
      emoji:    { type: 'string', max: 8 },
      title:    { type: 'string', max: 200 },
      sub:      { type: 'string', max: 300 },
      raised:   { type: 'int', min: 0, max: 1_000_000_000 },
      target:   { type: 'int', min: 0, max: 1_000_000_000 },
      unit:     { type: 'string', max: 16 },
      color:    { type: 'string', max: 16, pattern: /^#?[0-9a-fA-F]{3,8}$/ },
      pitch:    { type: 'string', max: 2000 },
      featured: { type: 'bool' },
      perUnit:  { type: 'int', min: 0, max: 1_000_000 },
      status:   { type: 'string', oneOf: STATUSES },
      shariah:  { type: 'string', oneOf: SHARIAH },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
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
    await audit(req, 'campaigns.update', id, admin.userId, b);
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM campaigns WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'campaigns.delete', id, admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
});
