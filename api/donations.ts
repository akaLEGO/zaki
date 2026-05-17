import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db';
import { withErrors } from './_lib/handler';
import { optionalAuth, requireAdmin } from './_lib/auth';
import { audit } from './_lib/audit';
import { validate } from './_lib/validate';
import { cors } from './_lib/cors';
import { rateLimit } from './_lib/ratelimit';

const FLOWS = ['riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah'] as const;
const METHODS = ['qr','bank','usdc'] as const;
const STATUSES = ['pending','completed','failed'] as const;

function newRef() {
  return 'ZK-' + Math.floor(Math.random() * 900000 + 100000);
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 60, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const rows = await sql`
      SELECT id, ref, user_id AS "userId", flow, amount, destination,
             pay_method AS "payMethod", status, niyyah,
             to_char(created_at, 'DD Mon YYYY HH24:MI') AS "createdAt"
      FROM donations
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    // Donations from public — tighter limit to deter spam writes.
    if (!(await rateLimit(req, res, { scope: 'donate', max: 10, windowSeconds: 60 }))) return;
    const auth = await optionalAuth(req);
    const v = validate(req.body, {
      flow:        { type: 'string', required: true, oneOf: FLOWS },
      amount:      { type: 'int', required: true, min: 1, max: 10_000_000 },
      destination: { type: 'string', max: 300 },
      payMethod:   { type: 'string', oneOf: METHODS },
      status:      { type: 'string', oneOf: STATUSES },
      niyyah:      { type: 'string', max: 500 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const [row] = await sql`
      INSERT INTO donations (ref, user_id, flow, amount, destination, pay_method, status, niyyah)
      VALUES (${newRef()}, ${auth?.userId || null}, ${b.flow as string}, ${b.amount as number},
              ${(b.destination as string) ?? null}, ${(b.payMethod as string) ?? null},
              ${(b.status as string) || 'completed'}, ${(b.niyyah as string) ?? null})
      RETURNING id, ref, flow, amount, destination,
                pay_method AS "payMethod", status, niyyah,
                to_char(created_at, 'DD Mon YYYY HH24:MI') AS "createdAt"
    `;
    await audit(req, 'donations.create', String((row as { ref: string }).ref), auth?.userId ?? null, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
});
