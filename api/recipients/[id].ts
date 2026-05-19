import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { requireAdmin } from '../_lib/auth.js';
import { audit } from '../_lib/audit.js';
import { validate } from '../_lib/validate.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

const ASNAF_IDS = ['poor','masakin','needy','muallaf','fisabil','traveller','slave','amil'] as const;

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
      asnaf:    { type: 'string', oneOf: ASNAF_IDS },
      name:     { type: 'string', max: 200 },
      received: { type: 'int', min: 0, max: 1_000_000_000 },
      area:     { type: 'string', max: 120 },
      fair:     { type: 'string', max: 200 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      UPDATE recipients SET
        asnaf    = COALESCE(${b.asnaf ?? null}, asnaf),
        name     = COALESCE(${b.name ?? null}, name),
        received = COALESCE(${b.received ?? null}, received),
        area     = COALESCE(${b.area ?? null}, area),
        fair     = COALESCE(${b.fair ?? null}, fair)
      WHERE id = ${id}
      RETURNING id, asnaf, name, received, area, fair
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    await audit(req, 'recipients.update', String(id), admin.userId, b);
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM recipients WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'recipients.delete', String(id), admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
});
