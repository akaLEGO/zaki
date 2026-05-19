import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { requireAdmin } from '../_lib/auth.js';
import { audit } from '../_lib/audit.js';
import { validate } from '../_lib/validate.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

const IDS = ['oath','fast','dhihar','general'] as const;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  const id = String(req.query.id);
  if (!(IDS as readonly string[]).includes(id)) {
    return res.status(404).json({ error: 'unknown kaffarah id' });
  }
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const v = validate(req.body, {
    label:  { type: 'string', max: 100 },
    amount: { type: 'int', min: 0, max: 10_000_000 },
    sub:    { type: 'string', max: 300 },
  });
  if (!v.ok) return res.status(400).json({ error: v.error });
  const b = v.value as Record<string, unknown>;
  const [row] = await sql`
    UPDATE kaffarah_types SET
      label  = COALESCE(${b.label ?? null}, label),
      amount = COALESCE(${b.amount ?? null}, amount),
      sub    = COALESCE(${b.sub ?? null}, sub)
    WHERE id = ${id}
    RETURNING id, label, amount, sub
  `;
  if (!row) return res.status(404).json({ error: 'not found' });
  await audit(req, 'kaffarah_types.update', id, admin.userId, b);
  return res.json(row);
});
