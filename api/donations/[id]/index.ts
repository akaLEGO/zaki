import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_lib/db.js';
import { withErrors } from '../../_lib/handler.js';
import { requireAdmin } from '../../_lib/auth.js';
import { cors } from '../../_lib/cors.js';
import { rateLimit } from '../../_lib/ratelimit.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [donation] = await sql`
    SELECT id, ref, user_id AS "userId", flow, amount,
           fee_amount AS "feeAmount", destination,
           pay_method AS "payMethod", status, niyyah,
           partner_id AS "partnerId", partner_ref AS "partnerRef", partner_note AS "partnerNote",
           donor_first_name AS "donorFirstName",
           donor_last_name  AS "donorLastName",
           donor_email      AS "donorEmail",
           donor_phone      AS "donorPhone",
           donor_line_id    AS "donorLineId",
           is_test AS "isTest",
           risk_tier AS "riskTier",
           donor_ip   AS "donorIp",
           donor_ua   AS "donorUa",
           slip_image AS "slipImage",
           to_char(slip_uploaded_at, 'DD Mon YYYY HH24:MI') AS "slipUploadedAt",
           dedication,
           to_char(partner_notified_at,   'DD Mon YYYY HH24:MI') AS "partnerNotifiedAt",
           to_char(partner_confirmed_at,  'DD Mon YYYY HH24:MI') AS "partnerConfirmedAt",
           to_char(customer_confirmed_at, 'DD Mon YYYY HH24:MI') AS "customerConfirmedAt",
           to_char(refunded_at,           'DD Mon YYYY HH24:MI') AS "refundedAt",
           refund_ref AS "refundRef",
           to_char(created_at, 'DD Mon YYYY HH24:MI') AS "createdAt"
    FROM donations WHERE id = ${id}
  `;
  if (!donation) return res.status(404).json({ error: 'not found' });

  const events = await sql`
    SELECT id, from_status AS "fromStatus", to_status AS "toStatus",
           actor, note,
           to_char(created_at, 'DD Mon YYYY HH24:MI:SS') AS "createdAt"
    FROM donation_events
    WHERE donation_id = ${id}
    ORDER BY created_at ASC, id ASC
  `;

  return res.json({ donation, events });
});
