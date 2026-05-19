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
      country:  { type: 'string', required: true, max: 100 },
      flag:     { type: 'string', required: true, max: 8 },
      price:    { type: 'int', required: true, min: 0, max: 1_000_000 },
      currency: { type: 'string', required: true, max: 8 },
      sub:      { type: 'string', max: 200 },
      animal:   { type: 'string', required: true, max: 100 },
      popular:  { type: 'bool' },
      special:  { type: 'bool' },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      INSERT INTO qurban_options (country, flag, price, currency, sub, animal, popular, special)
      VALUES (${b.country}, ${b.flag}, ${b.price}, ${b.currency},
              ${(b.sub as string) ?? null}, ${b.animal},
              ${!!b.popular}, ${!!b.special})
      RETURNING id, country, flag, price, currency, sub, animal, popular, special
    `;
    await audit(req, 'qurban_options.create', String((row as { id: number }).id), admin.userId, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'POST');
  return res.status(405).end();
});
