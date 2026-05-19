import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_lib/db.js';
import { withErrors } from '../../_lib/handler.js';
import { requireAdmin } from '../../_lib/auth.js';
import { audit } from '../../_lib/audit.js';
import { validate } from '../../_lib/validate.js';
import { cors } from '../../_lib/cors.js';
import { rateLimit } from '../../_lib/ratelimit.js';

type Status =
  | 'pending' | 'paid' | 'awaiting_partner' | 'partner_confirmed'
  | 'completed' | 'partner_rejected' | 'refunded' | 'failed';

const STATUSES: readonly Status[] = [
  'pending', 'paid', 'awaiting_partner', 'partner_confirmed',
  'completed', 'partner_rejected', 'refunded', 'failed',
];

// Legal transitions: from → allowed to
const ALLOWED: Record<Status, Status[]> = {
  pending:           ['paid', 'completed', 'failed'],
  paid:              ['awaiting_partner', 'completed', 'failed'],
  awaiting_partner:  ['partner_confirmed', 'partner_rejected', 'failed'],
  partner_confirmed: ['completed', 'failed'],
  partner_rejected:  ['refunded', 'failed'],
  completed:         [],
  refunded:          [],
  failed:            [],
};

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'write', max: 60, windowSeconds: 60 }))) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const v = validate(req.body, {
    to:         { type: 'string', required: true, oneOf: STATUSES },
    note:       { type: 'string', max: 2000 },
    partnerId:  { type: 'string', max: 64, pattern: /^[a-z0-9-]+$/ },
    partnerRef: { type: 'string', max: 200 },
    refundRef:  { type: 'string', max: 200 },
  });
  if (!v.ok) return res.status(400).json({ error: v.error });
  const b = v.value as Record<string, unknown>;
  const to = b.to as Status;
  const note = (b.note as string | undefined) ?? null;

  const [current] = await sql`SELECT status, partner_id AS "partnerId" FROM donations WHERE id = ${id}`;
  if (!current) return res.status(404).json({ error: 'donation not found' });
  const from = current.status as Status;

  if (from === to) return res.status(400).json({ error: `already in state ${to}` });
  if (!ALLOWED[from].includes(to)) {
    return res.status(400).json({ error: `transition ${from} → ${to} not allowed` });
  }

  // Gate: awaiting_partner must have a partner attached (either pre-existing or provided now).
  const partnerId = (b.partnerId as string | undefined) ?? current.partnerId ?? null;
  if (to === 'awaiting_partner' && !partnerId) {
    return res.status(400).json({ error: 'partnerId required when moving to awaiting_partner' });
  }
  // Gate: refunded requires a refund ref so we have a paper trail.
  if (to === 'refunded' && !b.refundRef) {
    return res.status(400).json({ error: 'refundRef required when moving to refunded' });
  }
  // Partner ref is meaningful only when partner is confirming.
  const partnerRef = (b.partnerRef as string | undefined) ?? null;
  const refundRef  = (b.refundRef as string | undefined)  ?? null;

  // Single update with conditional timestamp setters.
  const [row] = await sql`
    UPDATE donations SET
      status     = ${to},
      partner_id = COALESCE(${partnerId}, partner_id),
      partner_ref  = COALESCE(${partnerRef},  partner_ref),
      partner_note = COALESCE(${note},        partner_note),
      refund_ref   = COALESCE(${refundRef},   refund_ref),
      partner_notified_at   = CASE WHEN ${to} = 'awaiting_partner'
                                   THEN COALESCE(partner_notified_at, NOW()) ELSE partner_notified_at END,
      partner_confirmed_at  = CASE WHEN ${to} = 'partner_confirmed'
                                   THEN COALESCE(partner_confirmed_at, NOW()) ELSE partner_confirmed_at END,
      customer_confirmed_at = CASE WHEN ${to} = 'completed'
                                   THEN COALESCE(customer_confirmed_at, NOW()) ELSE customer_confirmed_at END,
      refunded_at           = CASE WHEN ${to} = 'refunded'
                                   THEN COALESCE(refunded_at, NOW()) ELSE refunded_at END
    WHERE id = ${id}
    RETURNING id, ref, status, partner_id AS "partnerId", partner_ref AS "partnerRef",
              partner_note AS "partnerNote", refund_ref AS "refundRef"
  `;

  await sql`
    INSERT INTO donation_events (donation_id, from_status, to_status, actor, note)
    VALUES (${id}, ${from}, ${to}, ${'admin:' + admin.userId}, ${note})
  `;

  await audit(req, 'donations.transition', String(id), admin.userId, { from, to, ...b });
  return res.json(row);
});
