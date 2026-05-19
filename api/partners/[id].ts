import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { requireAdmin } from '../_lib/auth.js';
import { audit } from '../_lib/audit.js';
import { validate } from '../_lib/validate.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

const FLOWS = ['riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah'] as const;

function normalizeFlows(input: unknown): string[] | null {
  if (input === undefined || input === null) return null;
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const f of input) {
    if (typeof f !== 'string') continue;
    if (!(FLOWS as readonly string[]).includes(f)) continue;
    if (!out.includes(f)) out.push(f);
  }
  return out;
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  const id = String(req.query.id);
  if (req.method === 'PATCH') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      name:         { type: 'string', max: 200 },
      contactEmail: { type: 'string', max: 200 },
      contactLine:  { type: 'string', max: 100 },
      webhookUrl:   { type: 'string', max: 500 },
      active:       { type: 'bool' },
      notes:        { type: 'string', max: 2000 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const flows = normalizeFlows((req.body as Record<string, unknown> | undefined)?.flows);
    const [row] = await sql`
      UPDATE partners SET
        name          = COALESCE(${b.name ?? null}, name),
        contact_email = COALESCE(${b.contactEmail ?? null}, contact_email),
        contact_line  = COALESCE(${b.contactLine ?? null}, contact_line),
        webhook_url   = COALESCE(${b.webhookUrl ?? null}, webhook_url),
        flows         = COALESCE(${flows}::text[], flows),
        active        = COALESCE(${b.active ?? null}, active),
        notes         = COALESCE(${b.notes ?? null}, notes),
        updated_at    = NOW()
      WHERE id = ${id}
      RETURNING id, name, contact_email AS "contactEmail", contact_line AS "contactLine",
                webhook_url AS "webhookUrl", flows, active, notes,
                to_char(created_at, 'DD Mon YYYY') AS "createdAt"
    `;
    if (!row) return res.status(404).json({ error: 'not found' });
    await audit(req, 'partners.update', id, admin.userId, { ...b, flows });
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const result = await sql`DELETE FROM partners WHERE id = ${id}`;
    if (result.length === 0) return res.status(404).json({ error: 'not found' });
    await audit(req, 'partners.delete', id, admin.userId, null);
    return res.status(204).end();
  }
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
});
