import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { withErrors } from './_lib/handler.js';
import { optionalAuth, requireAdmin } from './_lib/auth.js';
import { audit } from './_lib/audit.js';
import { validate } from './_lib/validate.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';
import { amilFee } from './_lib/fee.js';
import { sendDonationReceipt } from './_lib/email.js';

const FLOWS = ['riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah'] as const;
const METHODS = ['qr','bank','usdc'] as const;
const STATUSES = ['pending','completed','failed'] as const;

// AML Phase A — beta caps. Anything over these requires enhanced KYC which
// hasn't been built yet, so we hard-block at the API. Numbers come straight
// from project_compliance_roadmap.md.
const BETA_MAX_PER_DONATION = 5_000;      // ฿5,000
const BETA_MAX_PER_MONTH    = 20_000;     // ฿20,000 cumulative per donor email

function riskTier(amount: number): 'low' | 'medium' | 'high' | 'enhanced' {
  if (amount <  10_000) return 'low';
  if (amount < 100_000) return 'medium';
  if (amount < 2_000_000) return 'high';
  return 'enhanced';
}

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0]!.trim();
  }
  return req.socket?.remoteAddress ?? null;
}

function newRef() {
  return 'KF-' + Math.floor(Math.random() * 900000 + 100000);
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method === 'GET') {
    if (!(await rateLimit(req, res, { scope: 'read', max: 60, windowSeconds: 60 }))) return;
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const rows = await sql`
      SELECT id, ref, user_id AS "userId", flow, amount,
             fee_amount AS "feeAmount", destination,
             pay_method AS "payMethod", status, niyyah,
             partner_id AS "partnerId", partner_ref AS "partnerRef",
             donor_first_name AS "donorFirstName",
             donor_last_name  AS "donorLastName",
             donor_email      AS "donorEmail",
             donor_phone      AS "donorPhone",
             donor_line_id    AS "donorLineId",
             is_test AS "isTest",
             risk_tier AS "riskTier",
             (slip_image IS NOT NULL) AS "hasSlip",
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
      flow:           { type: 'string', required: true, oneOf: FLOWS },
      amount:         { type: 'int', required: true, min: 1, max: 10_000_000 },
      destination:    { type: 'string', max: 300 },
      payMethod:      { type: 'string', oneOf: METHODS },
      status:         { type: 'string', oneOf: STATUSES },
      niyyah:         { type: 'string', max: 500 },
      donorFirstName: { type: 'string', required: true, max: 100 },
      donorLastName:  { type: 'string', required: true, max: 100 },
      donorEmail:     { type: 'string', required: true, max: 200, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
      donorPhone:     { type: 'string', required: true, min: 6, max: 30 },
      donorLineId:    { type: 'string', max: 100 },
      isTest:         { type: 'bool' },
      // Client-compressed base64 data URL of the transfer slip (~50-100KB).
      // Cap at ~800k chars (~600KB image) as a guardrail.
      slipImage:      { type: 'string', max: 800_000 },
    });
    if (!v.ok) return res.status(400).json({ error: v.error });
    const b = v.value as Record<string, unknown>;
    const flow = b.flow as string;
    const amount = b.amount as number;
    const fee = amilFee(flow, amount);
    const isTest = !!b.isTest;
    const donorEmail = (b.donorEmail as string).trim().toLowerCase();

    // AML Phase A — per-donation cap. Applies to real donations only; tests
    // are exempt so beta UX still flows even with placeholder caps.
    if (!isTest && amount > BETA_MAX_PER_DONATION) {
      return res.status(400).json({
        error: `ระหว่าง beta ยอดต่อรายการสูงสุดคือ ฿${BETA_MAX_PER_DONATION.toLocaleString()} — ขออภัย ระบบยังเปิดรับยอดใหญ่ไม่ได้ในตอนนี้`,
        code: 'amount_cap_per_donation',
      });
    }

    // AML Phase A — rolling 30-day cap per donor email. Same exemption for
    // tests. Looks at real donations only (is_test = false) so test floods
    // don't lock real donors out.
    if (!isTest) {
      const [usage] = await sql`
        SELECT COALESCE(SUM(amount), 0)::int AS used
        FROM donations
        WHERE LOWER(donor_email) = ${donorEmail}
          AND is_test = FALSE
          AND created_at > NOW() - INTERVAL '30 days'
      `;
      const used = Number((usage as { used: number }).used) || 0;
      if (used + amount > BETA_MAX_PER_MONTH) {
        return res.status(400).json({
          error: `ระหว่าง beta ยอดสะสมต่อผู้บริจาคใน 30 วันสูงสุดคือ ฿${BETA_MAX_PER_MONTH.toLocaleString()} — ของคุณใช้ไปแล้ว ฿${used.toLocaleString()}`,
          code: 'amount_cap_per_month',
        });
      }
    }

    // If an active partner handles this flow, assign it and start the donation
    // in 'paid' (not 'completed') so the admin workflow can route it through
    // partner confirmation. Flows with no partner stay in 'completed'.
    const partnerRows = await sql`
      SELECT id FROM partners
      WHERE active = TRUE AND ${flow} = ANY(flows)
      ORDER BY name ASC
      LIMIT 1
    `;
    const partnerId = partnerRows[0]?.id as string | undefined;

    // Payment verification: if the payer attached a transfer slip (real
    // bank/QR payment), the donation lands in 'pending' so an admin can
    // verify the slip before it counts. Approving later moves it to
    // 'paid' (partner flow) or 'completed' (no partner). Tests + slipless
    // flows (e.g. USDC, testing mode) keep the old auto-status.
    const slipImage = (typeof b.slipImage === 'string' && (b.slipImage as string).length > 0)
      ? (b.slipImage as string) : null;
    const initialStatus = (b.status as string)
      || (slipImage ? 'pending' : (partnerId ? 'paid' : 'completed'));

    const ip = clientIp(req);
    const ua = (req.headers['user-agent'] as string | undefined) ?? null;
    const tier = riskTier(amount);
    const phase = process.env.KAFF_PHASE || 'closed_beta';

    const [row] = await sql`
      INSERT INTO donations (
        ref, user_id, flow, amount, fee_amount, destination, pay_method,
        status, niyyah, partner_id,
        donor_first_name, donor_last_name, donor_email, donor_phone, donor_line_id,
        is_test, donor_ip, donor_ua, risk_tier, phase,
        slip_image, slip_uploaded_at
      )
      VALUES (
        ${newRef()}, ${auth?.userId || null}, ${flow}, ${amount}, ${fee},
        ${(b.destination as string) ?? null}, ${(b.payMethod as string) ?? null},
        ${initialStatus}, ${(b.niyyah as string) ?? null},
        ${partnerId ?? null},
        ${b.donorFirstName as string}, ${b.donorLastName as string},
        ${b.donorEmail as string}, ${b.donorPhone as string},
        ${(b.donorLineId as string) ?? null},
        ${isTest}, ${ip}, ${ua}, ${tier}, ${phase},
        ${slipImage}, ${slipImage ? new Date().toISOString() : null}
      )
      RETURNING id, ref, flow, amount, fee_amount AS "feeAmount", destination,
                pay_method AS "payMethod", status, niyyah,
                partner_id AS "partnerId",
                donor_first_name AS "donorFirstName",
                donor_last_name  AS "donorLastName",
                donor_email      AS "donorEmail",
                donor_phone      AS "donorPhone",
                donor_line_id    AS "donorLineId",
                is_test AS "isTest",
                risk_tier AS "riskTier",
                to_char(created_at, 'DD Mon YYYY HH24:MI') AS "createdAt"
    `;
    // Seed donation_events with the initial state so the admin timeline starts
    // from "system created this in <status>" with the partner already linked.
    await sql`
      INSERT INTO donation_events (donation_id, from_status, to_status, actor, note)
      VALUES (${(row as { id: number }).id}, NULL, ${initialStatus},
              ${'system'},
              ${partnerId ? `auto-assigned to partner ${partnerId}` : null})
    `;
    await audit(req, 'donations.create', String((row as { ref: string }).ref), auth?.userId ?? null, { ...b, partnerId, initialStatus });

    // Fire-and-forget the receipt email. Errors here MUST NOT bubble up — the
    // donation is already committed, the donor's flow shouldn't fail just
    // because Resend hiccuped or env vars are missing.
    const r = row as Record<string, unknown>;
    void sendDonationReceipt({
      ref: String(r.ref),
      amount: Number(r.amount),
      flow: String(r.flow),
      destination: (r.destination as string | null) ?? null,
      niyyah: (r.niyyah as string | null) ?? null,
      donorFirstName: String(r.donorFirstName ?? ''),
      donorLastName:  String(r.donorLastName ?? ''),
      donorEmail:     String(r.donorEmail ?? ''),
      payMethod:      (r.payMethod as string | null) ?? null,
      isTest:         Boolean(r.isTest),
      createdAt:      String(r.createdAt ?? ''),
    }).then(result => {
      if (!result.sent) console.warn('receipt email skipped:', result.reason);
    }).catch(e => console.error('receipt email failed:', e));

    return res.status(201).json(row);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
});
