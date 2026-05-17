import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db';
import { optionalAuth, requireAuth } from './_lib/auth';

function newRef() {
  return 'ZK-' + Math.floor(Math.random() * 900000 + 100000);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // For admin: list all. For signed-in user: their own. Anonymous: 401.
    const auth = await requireAuth(req, res);
    if (!auth) return;
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
    const auth = await optionalAuth(req);
    const b = req.body || {};
    if (!b.flow || !b.amount) {
      return res.status(400).json({ error: 'flow and amount required' });
    }
    const [row] = await sql`
      INSERT INTO donations (ref, user_id, flow, amount, destination, pay_method, status, niyyah)
      VALUES (${newRef()}, ${auth?.userId || null}, ${b.flow}, ${b.amount},
              ${b.destination || null}, ${b.payMethod || null},
              ${b.status || 'completed'}, ${b.niyyah || null})
      RETURNING id, ref, flow, amount, destination,
                pay_method AS "payMethod", status, niyyah,
                to_char(created_at, 'DD Mon YYYY HH24:MI') AS "createdAt"
    `;
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
