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
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
    const rows = await sql`
      SELECT id, asnaf, name, received, area, fair FROM recipients ORDER BY id ASC
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      asnaf:    { type: 'string', required: true, oneOf: ASNAF_IDS },
      name:     { type: 'string', required: true, max: 200 },
      received: { type: 'int', min: 0, max: 1_000_000_000 },
      area:     { type: 'string', max: 120 },
      fair:     { type: 'string', max: 200 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      INSERT INTO recipients (asnaf, name, received, area, fair)
      VALUES (${b.asnaf}, ${b.name}, ${b.received ?? 0},
              ${(b.area as string) ?? null}, ${(b.fair as string) ?? null})
      RETURNING id, asnaf, name, received, area, fair
    `;
    await audit(req, 'recipients.create', String((row as { id: number }).id), admin.userId, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
});
