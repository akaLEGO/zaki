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
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }
  if (req.method === 'PATCH') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      country:  { type: 'string', max: 100 },
      flag:     { type: 'string', max: 8 },
      price:    { type: 'int', min: 0, max: 1_000_000 },
      currency: { type: 'string', max: 8 },
      sub:      { type: 'string', max: 200 },
      animal:   { type: 'string', max: 100 },
      popular:  { type: 'bool' },
      special:  { type: 'bool' },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      UPDATE qurban_options SET
        country  = COALESCE(${b.country ?? null}, country),
        flag     = COALESCE(${b.flag ?? null}, flag),
        price    = COALESCE(${b.price ?? null}, price),
        currency = COALESCE(${b.currency ?? null}, currency),
        sub      = COALESCE(${b.sub ?? null}, sub),
        animal   = COALESCE(${b.animal ?? null}, animal),
        popular  = COALESCE(${b.popular ?? null}, popular),
        special  = COALESCE(${b.special ?? null}, special)
      WHERE id = ${id}
      RETURNING id, country, flag, price, currency, sub, animal, popular, special
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    await audit(req, 'qurban_options.update', String(id), admin.userId, b);
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM qurban_options WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'qurban_options.delete', String(id), admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
});
