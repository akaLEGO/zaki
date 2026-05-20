// Resend wrapper for donation receipts. Lazy-init so the function can boot
// even when RESEND_API_KEY isn't set (e.g. dev, or before the email channel
// is provisioned). Callers should treat the return value as advisory — a
// failed send must never break the donation flow itself.

import { Resend } from 'resend';

let client: Resend | null | undefined; // undefined = not checked yet
function getClient(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.RESEND_API_KEY;
  client = key ? new Resend(key) : null;
  return client;
}

interface DonationForEmail {
  ref: string;
  amount: number;
  flow: string;            // 'riba' | 'zakat' | ...
  destination: string | null;
  niyyah: string | null;
  donorFirstName: string;
  donorLastName: string;
  donorEmail: string;
  payMethod: string | null;
  isTest: boolean;
  createdAt: string;       // already-formatted "DD Mon YYYY HH24:MI"
}

const FLOW_LABEL_TH: Record<string, string> = {
  riba: 'Riba · ดอกเบี้ย',
  zakat: 'Zakat · ซะกาต',
  fitrah: 'Fitrah · ฟิฏร',
  fidyah: 'Fidyah · ฟิดยะห์',
  kaffarah: 'Kaffarah · กัฟฟารอฮ์',
  qurban: 'Qurban · กุรบ่าน',
  sadaqah: 'Sadaqah · ศ่อดะเกาะฮ์',
};

const METHOD_LABEL: Record<string, string> = {
  qr: 'Thai QR (PromptPay)',
  bank: 'โอนผ่านธนาคาร',
  usdc: 'USDC บน Base',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function receiptHtml(d: DonationForEmail): string {
  const flowLabel = FLOW_LABEL_TH[d.flow] || d.flow;
  const methodLabel = d.payMethod ? METHOD_LABEL[d.payMethod] || d.payMethod : '—';
  const firstName = escapeHtml(d.donorFirstName);
  const amount = d.amount.toLocaleString('en-US');
  const ref = escapeHtml(d.ref);
  const dest = d.destination ? escapeHtml(d.destination) : '—';
  const niyyah = d.niyyah ? escapeHtml(d.niyyah) : '';
  const createdAt = escapeHtml(d.createdAt);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#F5F1E8;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;color:#0E1A14;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(13,59,46,0.08);">
    <div style="background:linear-gradient(180deg,#0D3B2E 0%,#0E1A14 100%);color:#fff;padding:36px 24px 30px;text-align:center;">
      <div style="font-size:13px;color:#D4AF37;font-weight:700;letter-spacing:0.12em;">KAFF</div>
      <div style="margin-top:14px;font-size:24px;font-weight:800;letter-spacing:-0.02em;">${d.isTest ? 'ใบเสร็จทดสอบ' : 'ขอบคุณคุณ ' + firstName}</div>
      <div style="margin-top:6px;font-size:13.5px;color:rgba(255,255,255,0.72);">${d.isTest ? 'ระบบทดสอบ · ไม่มีเงินถูกหัก' : 'คุณคือมือบน · You are the Upper Hand'}</div>
    </div>
    <div style="padding:24px;">
      <div style="background:#F5F1E8;border-radius:14px;padding:18px;">
        <div style="font-size:11px;color:#6B6B6B;font-weight:700;letter-spacing:0.08em;">ใบเสร็จ · RECEIPT</div>
        <div style="margin-top:4px;font-size:18px;font-weight:800;color:#0E1A14;font-family:'Geist Mono',ui-monospace,monospace;">${ref}</div>
        <table style="width:100%;margin-top:18px;border-collapse:collapse;">
          <tr><td style="padding:7px 0;color:#6B6B6B;font-size:13px;">วันที่</td><td style="text-align:right;font-size:13px;font-weight:600;">${createdAt}</td></tr>
          <tr><td style="padding:7px 0;color:#6B6B6B;font-size:13px;border-top:1px solid #E6DFCF;">จำนวน</td><td style="text-align:right;font-size:20px;font-weight:800;color:#0D3B2E;border-top:1px solid #E6DFCF;">฿${amount}</td></tr>
          <tr><td style="padding:7px 0;color:#6B6B6B;font-size:13px;border-top:1px solid #E6DFCF;">ประเภท</td><td style="text-align:right;font-size:13px;font-weight:600;border-top:1px solid #E6DFCF;">${flowLabel}</td></tr>
          <tr><td style="padding:7px 0;color:#6B6B6B;font-size:13px;border-top:1px solid #E6DFCF;">ปลายทาง</td><td style="text-align:right;font-size:13px;font-weight:600;border-top:1px solid #E6DFCF;">${dest}</td></tr>
          <tr><td style="padding:7px 0;color:#6B6B6B;font-size:13px;border-top:1px solid #E6DFCF;">วิธีชำระ</td><td style="text-align:right;font-size:13px;font-weight:600;border-top:1px solid #E6DFCF;">${methodLabel}</td></tr>
        </table>
      </div>
      ${niyyah ? `<div style="margin-top:16px;padding:14px 16px;background:#FBF6E4;border-left:3px solid #D4AF37;border-radius:10px;font-size:13px;color:#5a4400;font-style:italic;line-height:1.5;">"${niyyah}"</div>` : ''}
      ${d.isTest ? '<div style="margin-top:18px;padding:12px;background:#FBE4DF;border:1px solid #f1c6bf;border-radius:10px;font-size:12.5px;color:#7a2a1a;text-align:center;font-weight:700;">⚠️ ใบเสร็จทดสอบ · ไม่มีเงินถูกหัก — เก็บไว้สำหรับ verify flow ของ beta tester</div>' : ''}
      <div style="margin-top:22px;padding:14px;text-align:center;font-size:13px;color:#6B6B6B;font-style:italic;line-height:1.5;">"الحمد لله — ขอบคุณอัลลอฮ์ที่ให้โอกาส"</div>
    </div>
    <div style="padding:18px 24px;background:#F5F1E8;text-align:center;font-size:11.5px;color:#6B6B6B;line-height:1.6;border-top:1px solid #E6DFCF;">
      <strong style="color:#0D3B2E;">Kaff</strong> · Islamic Finance OS for Thai Muslims<br />
      <a href="https://kaff.me" style="color:#2A6041;text-decoration:none;">kaff.me</a> · ใบเสร็จออนไลน์ · เก็บข้อมูลปลอดภัยตาม PDPA
    </div>
  </div>
</body></html>`;
}

export async function sendDonationReceipt(donation: DonationForEmail): Promise<{ sent: boolean; reason?: string }> {
  const c = getClient();
  if (!c) return { sent: false, reason: 'RESEND_API_KEY not configured' };
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) return { sent: false, reason: 'RESEND_FROM_EMAIL not configured' };
  if (!donation.donorEmail) return { sent: false, reason: 'donor has no email' };

  const subjectPrefix = donation.isTest ? '[ทดสอบ] ' : '';
  const subject = `${subjectPrefix}ใบเสร็จ Kaff · ${donation.ref}`;
  try {
    const { error } = await c.emails.send({
      from,
      to: donation.donorEmail,
      subject,
      html: receiptHtml(donation),
    });
    if (error) return { sent: false, reason: String(error) };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e instanceof Error ? e.message : e) };
  }
}
