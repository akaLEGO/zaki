import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { requireAdmin } from '../_lib/auth.js';
import { audit } from '../_lib/audit.js';
import { validate } from '../_lib/validate.js';
import { cors } from '../_lib/cors.js';
import { rateLimit } from '../_lib/ratelimit.js';

const STATUSES = ['draft','live','live-featured','archived'] as const;
const SHARIAH = ['approved','pending'] as const;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
    const rows = await sql`
      SELECT id, tag, emoji, title, sub, raised, target, unit, color, pitch,
             featured, per_unit AS "perUnit", status, shariah,
             to_char(updated_at, 'DD Mon') AS "updatedAt"
      FROM campaigns
      ORDER BY featured DESC, updated_at DESC
    `;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    if (!(await rateLimit(req, res, { scope: 'write', max: 30, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const v = validate(req.body, {
      id:       { type: 'string', required: true, max: 64, pattern: /^[a-z0-9-]+$/ },
      tag:      { type: 'string', max: 32 },
      emoji:    { type: 'string', max: 8 },
      title:    { type: 'string', required: true, max: 200 },
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
      INSERT INTO campaigns (id, tag, emoji, title, sub, raised, target, unit, color, pitch, featured, per_unit, status, shariah)
      VALUES (
        ${b.id}, ${b.tag || ''}, ${b.emoji || '🌟'}, ${b.title}, ${b.sub || ''},
        ${b.raised || 0}, ${b.target || 0}, ${b.unit || 'บาท'}, ${b.color || '#0D3B2E'},
        ${b.pitch || ''}, ${!!b.featured}, ${(b.perUnit as number | undefined) ?? null},
        ${(b.status as string) || 'draft'}, ${(b.shariah as string) || 'pending'}
      )
      RETURNING id, tag, emoji, title, sub, raised, target, unit, color, pitch,
                featured, per_unit AS "perUnit", status, shariah,
                to_char(updated_at, 'DD Mon') AS "updatedAt"
    `;
    await audit(req, 'campaigns.create', String(b.id), admin.userId, b);
    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
});
