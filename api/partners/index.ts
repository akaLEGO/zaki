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
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 60, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const rows = await sql`
      SELECT id, name, contact_email AS "contactEmail", contact_line AS "contactLine",
             webhook_url AS "webhookUrl", flows, active, notes,
             to_char(created_at, 'DD Mon YYYY') AS "createdAt"
      FROM partners
      ORDER BY active DESC, name ASC
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      id:           { type: 'string', required: true, max: 64, pattern: /^[a-z0-9-]+$/ },
      name:         { type: 'string', required: true, max: 200 },
      contactEmail: { type: 'string', max: 200 },
      contactLine:  { type: 'string', max: 100 },
      webhookUrl:   { type: 'string', max: 500 },
      active:       { type: 'bool' },
      notes:        { type: 'string', max: 2000 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const flows = normalizeFlows((req.body as Record<string, unknown> | undefined)?.flows) ?? [];
    const [row] = await sql`
      INSERT INTO partners (id, name, contact_email, contact_line, webhook_url, flows, active, notes)
      VALUES (
        ${b.id}, ${b.name},
        ${(b.contactEmail as string) ?? null},
        ${(b.contactLine as string) ?? null},
        ${(b.webhookUrl as string) ?? null},
        ${flows}::text[],
        ${b.active === undefined ? true : !!b.active},
        ${(b.notes as string) ?? null}
      )
      RETURNING id, name, contact_email AS "contactEmail", contact_line AS "contactLine",
                webhook_url AS "webhookUrl", flows, active, notes,
                to_char(created_at, 'DD Mon YYYY') AS "createdAt"
    `;
    await audit(req, 'partners.create', String(b.id), admin.userId, { ...b, flows });
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
});
