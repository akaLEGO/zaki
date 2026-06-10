import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Z, Icon, GoldButton, ForestHeader, StickyBottom, NiyyahBox, KaffMark, fmtTHB,
} from './KaffUI';
import type { ZIconName } from './KaffUI';
// Fee imports kept commented for future re-introduction if policy changes.
// Tipping model = 100% to recipient, no Kaff fee.
import { PolicySheet } from './KaffPolicy';
import type { PolicyKind } from './KaffPolicy';
import { apiFetch } from '../lib/api';
import { track } from '../lib/funnel';

// Safety guard for beta/testing. VITE_KAFF_TESTING_MODE must be explicitly set
// to "false" on Vercel to enable real payment flows. Anything else (including
// missing env) keeps the app in testing mode — UI shows a big "DO NOT PAY"
// banner on the QR + bank screens so beta testers don't accidentally send
// money to the placeholder PromptPay number (which is not ours).
export const IS_TESTING_MODE =
  (import.meta.env.VITE_KAFF_TESTING_MODE as string | undefined) !== 'false';

function TestingBanner() {
  if (!IS_TESTING_MODE) return null;
  return (
    <div style={{
      background: '#C0392B', color: '#fff',
      padding: '12px 14px',
      borderRadius: 12, margin: '8px 16px 0',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      boxShadow: '0 4px 14px rgba(192,57,43,0.25)',
    }}>
      <div style={{ fontSize: 20 }}>⚠️</div>
      <div style={{ flex: 1, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: '0.02em' }}>
          ระบบทดสอบ · ห้ามโอนเงินจริง
        </div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.95 }}>
          QR และเลขบัญชีที่เห็นเป็นแค่ตัวอย่าง — บัญชีของ Kaff ยังไม่เปิด<br />
          กดปุ่ม <strong style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4 }}>ดูใบเสร็จทดสอบ →</strong> ด้านล่างได้เลย เพื่อดู flow ต่อ
        </div>
      </div>
    </div>
  );
}

// Compress an image File to a small JPEG data URL entirely in the browser,
// so the slip we upload is ~50-100KB instead of multi-MB. Caps the longest
// edge at 1100px and re-encodes at quality 0.7.
function compressImageToDataUrl(file: File, maxEdge = 1100, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no canvas ctx')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Slip upload zone — used on QR + bank screens. Lets the payer attach a
// transfer-confirmation image; the donation then lands in 'pending' for
// admin verification.
function SlipUpload({ slip, onSlip }: { slip: string | null; onSlip: (dataUrl: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null); setBusy(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onSlip(dataUrl);
    } catch {
      setErr('อ่านรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: 16 }}>
      <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>
        แนบสลิปการโอน <span style={{ color: Z.danger }}>*</span>
      </div>
      {slip ? (
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          border: `1.5px solid ${Z.line}`, background: '#fff',
        }}>
          <img src={slip} alt="สลิปการโอน" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'contain', background: '#f3f3f3' }} />
          <button onClick={() => onSlip(null)} style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: 999,
            background: 'rgba(14,26,20,0.72)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', fontSize: 16, fontWeight: 700, lineHeight: 1,
          }}>✕</button>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '8px 12px', background: 'linear-gradient(0deg, rgba(14,26,20,0.7), transparent)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}><Icon name="check" size={14} color="#fff" /> แนบสลิปแล้ว · แตะ ✕ เพื่อเปลี่ยน</div>
        </div>
      ) : (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '28px 16px', borderRadius: 16,
          border: `1.5px dashed ${Z.line}`, background: '#fff',
          cursor: 'pointer', textAlign: 'center',
        }}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => { void handleFile(e.target.files?.[0]); e.currentTarget.value = ''; }}
          />
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: Z.sageSoft,
            color: Z.forest, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="download" size={22} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: Z.ink }}>
            {busy ? 'กำลังเตรียมรูป…' : 'แตะเพื่อแนบสลิป'}
          </div>
          <div style={{ fontSize: 12, color: Z.muted }}>ถ่ายรูปหรือเลือกจากคลัง · เจ้าหน้าที่จะตรวจสอบก่อนยืนยัน</div>
        </label>
      )}
      {err && <div style={{ marginTop: 6, fontSize: 12, color: Z.danger }}>{err}</div>}
    </div>
  );
}

export type PayMethod = 'qr' | 'bank' | 'usdc';

export interface Summary {
  flow: string;            // 'riba' | 'zakat' | 'fitrah' | … — drives the fee policy
  amount: number;          // gross — what the donor pays
  type: string;
  dest: string;
  niyyah: string;
  shortImpact?: string;
  impactText?: string;
  payMethod?: PayMethod;
}

export interface Donor {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lineId: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function donorComplete(d: Donor) {
  return d.firstName.trim() !== '' &&
         d.lastName.trim() !== '' &&
         EMAIL_RE.test(d.email.trim()) &&
         d.phone.trim().length >= 6;
}

export function CheckoutScreen({ summary, payMethod, setPayMethod, niyyahConfirmed, setNiyyahConfirmed, donor, setDonor, dedication, setDedication, onBack, onNext }: {
  summary: Summary; payMethod: PayMethod; setPayMethod: (m: PayMethod) => void;
  niyyahConfirmed: boolean; setNiyyahConfirmed: (b: boolean) => void;
  donor: Donor; setDonor: (d: Donor) => void;
  dedication: string; setDedication: (s: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const isDonorComplete = donorComplete(donor);
  const update = (k: keyof Donor, v: string) => setDonor({ ...donor, [k]: v });
  // Dedication is collapsed behind a checkbox to keep checkout clean; the
  // name field only appears when ticked. Unticking clears it.
  const [dedicating, setDedicating] = useState(dedication.trim() !== '');
  const [policy, setPolicy] = useState<PolicyKind | null>(null);
  const methods: { id: PayMethod; label: string; sub: string; icon: ZIconName }[] = [
    { id: 'qr', label: 'Thai QR (PromptPay)', sub: 'สแกนผ่านแอปธนาคาร', icon: 'qr' },
    { id: 'bank', label: 'โอนผ่านธนาคาร', sub: 'คัดลอกเลขบัญชี · แนบสลิป', icon: 'bank' },
    { id: 'usdc', label: 'USDC บน Base', sub: 'low gas · ~1 นาที', icon: 'coin' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="ตรวจสอบและยืนยัน" sub="โอนเงินตามจิตเจตนา · ยืนยันก่อนชำระ" compact />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>

        <div style={{
          background: '#fff', borderRadius: 22, padding: 18,
          border: `1.5px solid ${Z.line}`,
        }}>
          <div style={{ fontSize: 11, color: Z.muted, letterSpacing: '0.08em', fontWeight: 600 }}>คุณกำลังบริจาค</div>
          <div style={{
            fontSize: 42, fontWeight: 800, color: Z.forest,
            letterSpacing: '-0.025em', marginTop: 2, lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
          }}>{fmtTHB(summary.amount)}</div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${Z.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="ประเภท" value={summary.type} />
            <Row label="ไปที่" value={summary.dest} />
            <FeeRows flow={summary.flow} amount={summary.amount} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <NiyyahBox
            text={summary.niyyah}
            confirmed={niyyahConfirmed}
            onConfirm={() => setNiyyahConfirmed(!niyyahConfirmed)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              const next = !dedicating;
              setDedicating(next);
              if (!next) setDedication('');
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', background: '#fff',
              border: `1.5px solid ${dedicating ? Z.gold : Z.line}`,
              borderRadius: dedicating ? '14px 14px 0 0' : 14,
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${dedicating ? Z.forest : Z.line}`,
              background: dedicating ? Z.forest : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dedicating && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: Z.ink }}>🤲 ทำในนามของผู้อื่น / อุทิศแด่ผู้ล่วงลับ</div>
              {!dedicating && <div style={{ fontSize: 11.5, color: Z.muted, marginTop: 1 }}>เช่น กุรบ่านแทนมารดา · ศ่อดะเกาะฮ์ญาริยะฮ์</div>}
            </div>
          </button>
          {dedicating && (
            <div style={{
              padding: '12px 14px 14px', background: '#FBF6E4',
              border: `1.5px solid ${Z.gold}`, borderTop: 'none',
              borderRadius: '0 0 14px 14px',
            }}>
              <input
                value={dedication}
                onChange={e => setDedication(e.target.value)}
                placeholder="ชื่อผู้ที่อุทิศให้ เช่น มารดา ฮัสนะห์"
                autoFocus
                style={{
                  width: '100%', height: 40, padding: '0 12px',
                  background: '#fff', border: `1.5px solid ${Z.goldSoft}`,
                  borderRadius: 10, fontSize: 14, color: Z.ink, outline: 'none',
                }}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: '#7a5e10' }}>
                ชื่อนี้จะปรากฏบนใบเสร็จและการ์ดแชร์
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>ข้อมูลผู้บริจาค</div>
          <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${Z.line}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <DonorField label="ชื่อ" value={donor.firstName} onChange={v => update('firstName', v)} placeholder="ชื่อจริง" required />
              <DonorField label="นามสกุล" value={donor.lastName} onChange={v => update('lastName', v)} placeholder="นามสกุล" required />
            </div>
            <DonorField
              label="อีเมล"
              value={donor.email}
              onChange={v => update('email', v)}
              placeholder="you@example.com"
              type="email"
              required
              error={donor.email.trim() !== '' && !EMAIL_RE.test(donor.email.trim()) ? 'รูปแบบอีเมลไม่ถูกต้อง' : undefined}
            />
            <DonorField
              label="เบอร์โทรศัพท์"
              value={donor.phone}
              onChange={v => update('phone', v)}
              placeholder="081-234-5678"
              type="tel"
              required
            />
            <DonorField
              label="LINE ID (option)"
              value={donor.lineId}
              onChange={v => update('lineId', v)}
              placeholder="@kaff หรือ kaff_team"
            />
            <div style={{ fontSize: 11, color: Z.muted, lineHeight: 1.5, marginTop: 2 }}>
              🔒 ข้อมูลนี้ใช้สำหรับติดตามการบริจาคและส่งใบเสร็จ · เก็บปลอดภัยตาม{' '}
              <button onClick={() => setPolicy('privacy')} style={{ color: Z.forest, textDecoration: 'underline', fontWeight: 600 }}>
                PDPA
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>วิธีชำระเงิน</div>
          <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${Z.line}`, overflow: 'hidden' }}>
            {methods.map((m, i) => {
              const isSel = payMethod === m.id;
              return (
                <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', textAlign: 'left',
                  borderTop: i ? `1px solid ${Z.line}` : 'none',
                  background: isSel ? Z.sageSoft : 'transparent',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isSel ? Z.forest : Z.surface,
                    color: isSel ? Z.gold : Z.forest,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}><Icon name={m.icon} size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: Z.ink }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: Z.muted, marginTop: 1 }}>{m.sub}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: `2px solid ${isSel ? Z.forest : Z.line}`,
                    background: '#fff', position: 'relative',
                  }}>
                    {isSel && <div style={{
                      position: 'absolute', inset: 3, borderRadius: 999, background: Z.forest,
                    }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: '#FBF6E4', border: `1px solid ${Z.goldSoft}`,
          borderRadius: 12, fontSize: 11.5, color: '#5a4400', lineHeight: 1.55,
        }}>
          ⚖️ <b>การปฏิบัติตามกฎหมาย</b> — Kaff ปฏิบัติตามพระราชบัญญัติป้องกันและปราบปรามการฟอกเงิน (AMLA) ข้อมูลที่ท่านกรอกอาจถูกตรวจสอบหรือส่งต่อหน่วยงานราชการ (ปปง./สรรพากร) ตามกฎหมายกำหนด · ระหว่าง beta จำกัด ฿5,000/รายการ และ ฿20,000/30วัน/ผู้บริจาค
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: Z.muted, textAlign: 'center', lineHeight: 1.55 }}>
          🔒 ปลอดภัย · ตรวจสอบโดยที่ปรึกษาชะรีอะฮ์ · ใบเสร็จออนไลน์<br />
          การดำเนินการชำระเงินถือว่าคุณยอมรับ{' '}
          <button onClick={() => setPolicy('terms')} style={{ color: Z.forest, textDecoration: 'underline', fontWeight: 600 }}>ข้อกำหนด</button>
          {' '}และ{' '}
          <button onClick={() => setPolicy('privacy')} style={{ color: Z.forest, textDecoration: 'underline', fontWeight: 600 }}>นโยบายความเป็นส่วนตัว</button>
        </div>
      </div>

      <StickyBottom>
        <GoldButton
          disabled={!niyyahConfirmed || !isDonorComplete}
          onClick={onNext}
        >
          {!niyyahConfirmed
            ? 'กรุณายืนยัน Niyyah ก่อน'
            : !isDonorComplete
              ? 'กรุณากรอกข้อมูลผู้บริจาคให้ครบ'
              : <>ดำเนินการชำระเงิน <Icon name="arrowRight" size={20} /></>}
        </GoldButton>
      </StickyBottom>

      <PolicySheet kind={policy} onClose={() => setPolicy(null)} />
    </div>
  );
}

function DonorField({ label, value, onChange, placeholder, type = 'text', required, error }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  error?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11.5, color: Z.muted, fontWeight: 600, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}{required && <span style={{ color: Z.danger, marginLeft: 4 }}>*</span>}</span>
        {error && <span style={{ color: Z.danger, fontWeight: 500 }}>{error}</span>}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', height: 40, padding: '0 12px',
          background: '#fff', border: `1.5px solid ${error ? Z.danger : Z.line}`,
          borderRadius: 10, fontSize: 14, color: Z.ink, outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = Z.forest; }}
        onBlur={e => { if (!error) e.target.style.borderColor = Z.line; }}
      />
    </label>
  );
}

function Row({ label, value, sub, valueColor }: { label: string; value: ReactNode; sub?: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: Z.muted, paddingTop: 1 }}>{label}</div>
      <div style={{ textAlign: 'right', maxWidth: '60%' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: valueColor || Z.ink, lineHeight: 1.35 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: Z.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// Tipping-model fee breakdown: 100% always goes to the recipient. Kaff
// takes nothing; it's sustained by voluntary tips on the success screen.
function FeeRows({ flow: _flow, amount }: { flow: string; amount: number }) {
  return (
    <Row
      label="ผู้รับ"
      value={fmtTHB(amount)}
      sub="100% ของยอดบริจาค"
      valueColor={Z.sage}
    />
  );
}

export function QRPayment({ amount, onBack, onConfirm }: { amount: number; onBack: () => void; onConfirm: (slip: string | null) => void }) {
  const [secs, setSecs] = useState(600);
  const [slip, setSlip] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="สแกนเพื่อชำระ" sub="Thai QR · PromptPay · รองรับทุกธนาคาร" compact />
      <TestingBanner />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          padding: '10px 22px', background: Z.forest, color: '#fff',
          borderRadius: 999, fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}>{fmtTHB(amount)}</div>

        <div style={{
          marginTop: 20, padding: 18, background: '#fff', borderRadius: 24,
          border: `1.5px solid ${Z.line}`,
          width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            background: '#1a3d8e', color: '#fff', padding: '6px 14px',
            borderRadius: 8, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
            display: 'inline-flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{ color: '#fff' }}>■ THAI QR PAYMENT</span>
          </div>
          <img
            src={`/api/promptpay/qr?amount=${encodeURIComponent(amount)}`}
            alt={`PromptPay QR ฿${amount}`}
            width={220} height={220}
            style={{ marginTop: 14, borderRadius: 6 }}
          />
          <div style={{ marginTop: 14, fontSize: 12, color: Z.muted, textAlign: 'center' }}>
            ผู้รับ: <b style={{ color: Z.ink }}>Kaff Trust Account</b><br />
            อ้างอิง: <span style={{ fontVariantNumeric: 'tabular-nums', color: Z.ink }}>KF-{Math.floor(Math.random() * 9000 + 1000)}-58</span>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: '8px 14px', borderRadius: 999,
          background: 'rgba(201,169,74,0.12)', color: '#7a5e10',
          fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="history" size={14} /> QR หมดอายุใน <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span> นาที
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { n: 'SCB', c: '#4e2c8a' },
            { n: 'KBANK', c: '#1f8e3d' },
            { n: 'BBL', c: '#0a4ea6' },
            { n: 'KTB', c: '#27a3df' },
            { n: 'TTB', c: '#1a4ba0' },
            { n: 'BAY', c: '#f9c116' },
          ].map((b, i) => (
            <div key={i} style={{
              padding: '5px 9px', borderRadius: 6, background: b.c,
              color: b.n === 'BAY' ? '#3a2400' : '#fff',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
            }}>{b.n}</div>
          ))}
        </div>

        {!IS_TESTING_MODE && <SlipUpload slip={slip} onSlip={setSlip} />}
      </div>

      <StickyBottom>
        <GoldButton
          disabled={!IS_TESTING_MODE && !slip}
          onClick={() => onConfirm(slip)}
        >
          {IS_TESTING_MODE
            ? <>ดูใบเสร็จทดสอบ <Icon name="arrowRight" size={20} /></>
            : !slip
              ? 'แนบสลิปก่อนยืนยัน'
              : <>ยืนยันการโอน <Icon name="check" size={20} /></>}
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

function FakeQR({ size = 200, style = {} }: { size?: number; style?: CSSProperties }) {
  const N = 25;
  const cells = useMemo(() => {
    const seed = 42;
    const rng = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: N * N }, (_, i) => rng(i + seed) > 0.5 ? 1 : 0);
  }, []);
  const isFinder = (x: number, y: number) => {
    const inBox = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
    return inBox(0, 0) || inBox(N - 7, 0) || inBox(0, N - 7);
  };
  const finderCell = (x: number, y: number, cx: number, cy: number) => {
    const lx = x - cx, ly = y - cy;
    if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return 1;
    if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return 1;
    return 0;
  };

  const cell = size / N;
  return (
    <div style={{
      width: size, height: size, background: '#fff', position: 'relative',
      ...style,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: N }).map((_, y) =>
          Array.from({ length: N }).map((_, x) => {
            let v = cells[y * N + x];
            if (isFinder(x, y)) {
              const cx = x < 7 ? 0 : x >= N - 7 ? N - 7 : 0;
              const cy = y < 7 ? 0 : y >= N - 7 ? N - 7 : 0;
              v = finderCell(x, y, cx, cy);
            }
            if (!v) return null;
            return (
              <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0A0A0A" />
            );
          })
        )}
        <rect x={size/2 - 18} y={size/2 - 18} width={36} height={36} fill="#fff" rx="6" />
        <rect x={size/2 - 14} y={size/2 - 14} width={28} height={28} fill={Z.forest} rx="5" />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={Z.gold}
              fontSize="18" fontWeight="800" fontFamily="Sarabun, system-ui">ك</text>
      </svg>
    </div>
  );
}

export function BankTransfer({ amount, onBack, onConfirm }: { amount: number; onBack: () => void; onConfirm: (slip: string | null) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [slip, setSlip] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };
  const fields: { key: string; label: string; value: string; big?: boolean }[] = IS_TESTING_MODE
    ? [
        { key: 'bank', label: 'ธนาคาร',     value: '—' },
        { key: 'name', label: 'ชื่อบัญชี',   value: 'ระบบทดสอบ — ห้ามโอน' },
        { key: 'no',   label: 'เลขที่บัญชี', value: 'XXX-XXX-XXXX (ทดสอบ)' },
        { key: 'amt',  label: 'จำนวนเงิน',   value: '฿' + amount.toLocaleString(), big: true },
      ]
    : [
        { key: 'bank', label: 'ธนาคาร',     value: 'SCB · ไทยพาณิชย์' },
        { key: 'name', label: 'ชื่อบัญชี',   value: 'มูลนิธิ Kaff Foundation' },
        { key: 'no',   label: 'เลขที่บัญชี', value: '407-298-8472' },
        { key: 'amt',  label: 'จำนวนเงิน',   value: '฿' + amount.toLocaleString(), big: true },
      ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="โอนผ่านธนาคาร" sub="คัดลอกแล้วเปิดแอปธนาคารของคุณ" compact />
      <TestingBanner />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${Z.line}`, overflow: 'hidden' }}>
          {fields.map((f, i) => (
            <div key={f.key} style={{
              padding: '14px 16px',
              borderTop: i ? `1px solid ${Z.line}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: Z.muted, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                <div style={{
                  fontSize: f.big ? 22 : 15, fontWeight: f.big ? 800 : 600, color: Z.ink,
                  letterSpacing: '-0.005em',
                  fontVariantNumeric: f.big ? 'tabular-nums' : undefined,
                }}>{f.value}</div>
              </div>
              <button onClick={() => copy(f.key, f.value)} style={{
                padding: '8px 12px', borderRadius: 10,
                background: copied === f.key ? Z.sage : Z.surface,
                color: copied === f.key ? '#fff' : Z.forest,
                fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
                border: `1px solid ${copied === f.key ? Z.sage : Z.line}`,
              }}>
                {copied === f.key ? <><Icon name="check" size={14} strokeWidth={2.5} /> คัดลอกแล้ว</> : <><Icon name="copy" size={14} /> คัดลอก</>}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, padding: 14,
          background: '#FBF6E4', borderRadius: 14,
          border: `1px solid ${Z.goldSoft}`,
          fontSize: 12.5, color: '#5a4400', lineHeight: 1.5,
        }}>
          <b>📩 หลังโอนเสร็จ</b><br />
          แนบสลิปการโอนด้านล่าง แล้วกดยืนยัน — เจ้าหน้าที่จะตรวจสอบและออกใบเสร็จให้ภายใน 24 ชั่วโมง
        </div>

        {!IS_TESTING_MODE && <SlipUpload slip={slip} onSlip={setSlip} />}
      </div>

      <StickyBottom>
        <GoldButton
          disabled={!IS_TESTING_MODE && !slip}
          onClick={() => onConfirm(slip)}
        >
          {IS_TESTING_MODE
            ? <>ดูใบเสร็จทดสอบ <Icon name="arrowRight" size={20} /></>
            : !slip
              ? 'แนบสลิปก่อนยืนยัน'
              : <>ยืนยันการโอน <Icon name="check" size={20} /></>}
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

// ─── Base USDC ──────────────────────────────────────────────────────────────

interface RateResponse {
  rate: number;        // 1 USDC = N THB
  source: 'coingecko' | 'fallback';
  updatedAt: string;
  error?: string;
}

export function BaseUSDCPayment({ amount, onBack, onConfirm }: { amount: number; onBack: () => void; onConfirm: (slip: string | null) => void }) {
  const [rateInfo, setRateInfo] = useState<RateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/base/rate')
      .then(r => r.json())
      .then((d: RateResponse) => setRateInfo(d))
      .catch(() => setRateInfo({ rate: 35, source: 'fallback', updatedAt: new Date().toISOString() }));
  }, []);

  const rate = rateInfo?.rate ?? 35;
  const usdcAmount = amount / rate;
  const usdcDisplay = usdcAmount.toFixed(2);

  // Wallet shown to the user — purely informational; the QR encodes the real
  // recipient via the EIP-681 URI. If the server has no wallet configured
  // (placeholder mode), this stays as the dashed placeholder so testers can't
  // copy a bogus address either.
  const placeholderWallet = '0x0000…000000  (ระบบทดสอบ)';

  const copyAddress = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(placeholderWallet);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="USDC บน Base" sub="โอน USDC บน Base mainnet · low gas · ~1 นาที" compact />
      <TestingBanner />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          padding: '10px 22px', background: Z.forest, color: '#fff',
          borderRadius: 999, fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <span>{usdcDisplay}</span>
          <span style={{ fontSize: 13, opacity: 0.75, fontWeight: 600 }}>USDC</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12.5, color: Z.muted }}>
          ≈ {fmtTHB(amount)} · 1 USDC = ฿{rate.toFixed(2)}
          {rateInfo?.source === 'fallback' && <span style={{ color: '#c0392b', marginLeft: 6 }}>(ใช้อัตราสำรอง)</span>}
        </div>

        <div style={{
          marginTop: 20, padding: 18, background: '#fff', borderRadius: 24,
          border: `1.5px solid ${Z.line}`,
          width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            background: '#0052FF', color: '#fff', padding: '6px 14px',
            borderRadius: 8, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
            display: 'inline-flex', gap: 6, alignItems: 'center',
          }}>
            <span>◆ BASE NETWORK · USDC</span>
          </div>
          <img
            src={`/api/base/qr?amount=${encodeURIComponent(usdcDisplay)}`}
            alt={`Base USDC QR ${usdcDisplay}`}
            width={220} height={220}
            style={{ marginTop: 14, borderRadius: 6 }}
          />
          <div style={{ marginTop: 14, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: Z.muted, marginBottom: 4 }}>โอนไปที่ wallet</div>
            <button onClick={copyAddress} style={{
              fontFamily: 'Geist Mono, ui-monospace, monospace',
              fontSize: 13, color: Z.ink, fontWeight: 600,
              padding: '8px 12px', borderRadius: 10,
              background: Z.surface, border: `1px solid ${Z.line}`,
              width: '100%', textAlign: 'center',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {placeholderWallet}
              <Icon name="copy" size={14} />
            </button>
            {copied && <div style={{ marginTop: 6, fontSize: 11.5, color: Z.sage, fontWeight: 600 }}>คัดลอกแล้ว</div>}
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12,
          background: '#fff', border: `1.5px solid ${Z.line}`,
          width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: 20 }}>📱</div>
          <div style={{ flex: 1, fontSize: 12.5, color: Z.muted, lineHeight: 1.5 }}>
            <b style={{ color: Z.ink }}>วิธีโอน</b><br />
            สแกน QR ด้วย Coinbase Wallet / MetaMask Mobile / Rainbow → app จะ pre-fill จำนวน + wallet ปลายทาง → ยืนยัน
          </div>
        </div>

        <div style={{
          marginTop: 12, padding: '8px 14px', borderRadius: 999,
          background: 'rgba(0,82,255,0.1)', color: '#0052FF',
          fontSize: 12, fontWeight: 600,
        }}>
          ⛽ Gas บน Base ~$0.01 · เร็วกว่า Ethereum mainnet ~10 เท่า
        </div>
      </div>

      <StickyBottom>
        <GoldButton onClick={() => onConfirm(null)}>
          {IS_TESTING_MODE
            ? <>ดูใบเสร็จทดสอบ <Icon name="arrowRight" size={20} /></>
            : <>โอนแล้ว ยืนยัน <Icon name="check" size={20} /></>}
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export function SuccessScreen({ summary, donor, dedication, pending, onHome }: { summary: Summary; donor?: Donor; dedication?: string; pending?: boolean; onHome: () => void }) {
  const [animated, setAnimated] = useState(false);
  const [policy, setPolicy] = useState<PolicyKind | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const refNo = useMemo(() => 'KF-' + Math.floor(Math.random() * 900000 + 100000), []);
  const dateStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate()} พ.ค. 2569 · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }, []);

  const donorFullName = [donor?.firstName?.trim(), donor?.lastName?.trim()]
    .filter(Boolean)
    .join(' ');
  const donorDisplay = donorFullName ? `คุณ${donorFullName}` : 'ผู้บริจาค';

  const dedicationName = dedication?.trim() || '';
  const shareText = [
    `${donorDisplay} ${summary.shortImpact || 'บริจาค'} ${fmtTHB(summary.amount)}`,
    dedicationName ? `🤲 อุทิศแด่ ${dedicationName}` : '',
    summary.dest && summary.dest !== '—' ? `ส่งต่อให้ ${summary.dest}` : '',
    summary.impactText || '',
    '',
    'via Kaff — Be the Upper Hand',
    'https://kaff.me',
  ].filter(Boolean).join('\n');

  const shareToLine = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  };

  const shareGeneric = async () => {
    // Web Share API on mobile (opens native share sheet). Falls back to clipboard copy.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Kaff — Be the Upper Hand',
          text: shareText,
          url: 'https://kaff.me',
        });
        return;
      } catch {
        // user cancelled — fall through
        return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('คัดลอกข้อความแล้ว — paste ที่ไหนก็ได้');
      } catch {
        alert('แชร์ไม่ได้บนเบราว์เซอร์นี้');
      }
    }
  };

  const impactLines: Record<string, string> = {
    'Riba · ดอกเบี้ย': 'ส่งต่อสาธารณประโยชน์',
    'Zakat · ซะกาต': 'ช่วยครอบครัวขัดสน',
    'Fitrah · ฟิฏร': 'แจกข้าวก่อนอีด',
    'Fidyah · ฟิดยะห์': 'เลี้ยงอาหารผู้ขัดสน',
    'Kaffarah · กัฟฟารอฮ์': 'ช่วยเลี้ยงผู้ขัดสน',
    'Qurban · กุรบ่าน': 'แจกจ่ายเนื้อสดในวันอีด',
    'Sadaqah · ศ่อดะเกาะฮ์': 'ช่วยเหลือทันทีในชุมชน',
  };
  const impact = impactLines[summary.type] || 'สร้างผลกระทบจริงในชุมชน';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <div style={{
        background: `linear-gradient(180deg, ${Z.forest} 0%, ${Z.forestDeep} 100%)`,
        color: '#fff', padding: '60px 20px 36px',
        borderRadius: '0 0 28px 28px',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          width: 84, height: 84, margin: '0 auto', borderRadius: 999,
          background: Z.sage,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: animated
            ? '0 0 0 12px rgba(46,194,126,0.18), 0 0 0 28px rgba(46,194,126,0.08)'
            : '0 0 0 0 rgba(46,194,126,0.18), 0 0 0 0 rgba(46,194,126,0)',
          transform: animated ? 'scale(1)' : 'scale(0.5)',
          transitionProperty: 'box-shadow, transform',
          transitionDuration: '1.2s, .5s',
          transitionTimingFunction: 'ease, cubic-bezier(.34, 1.56, .64, 1)',
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path d="M10 22 19 31 35 14"
              fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: animated ? 0 : 60,
                transition: 'stroke-dashoffset .7s .2s ease',
              }}
            />
          </svg>
        </div>
        <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
          {IS_TESTING_MODE ? 'ใบเสร็จทดสอบ' : pending ? 'ได้รับแจ้งการโอนแล้ว' : 'บริจาคสำเร็จแล้ว'}
        </div>
        <div style={{ marginTop: 6, fontSize: 13.5, color: Z.gold, fontWeight: 600 }}>
          {IS_TESTING_MODE ? 'ระบบทดสอบ · ไม่มีเงินถูกหัก'
            : pending ? 'รอเจ้าหน้าที่ตรวจสอบสลิป'
            : 'คุณคือมือบน · You are the Upper Hand'}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {pending ? 'เราจะยืนยันและออกใบเสร็จให้ภายใน 24 ชม.' : impact}
        </div>
        {IS_TESTING_MODE && (
          <div style={{
            marginTop: 14, padding: '6px 12px',
            display: 'inline-block', borderRadius: 999,
            background: 'rgba(192,57,43,0.85)', color: '#fff',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
          }}>TEST RUN</div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, border: `1.5px solid ${Z.line}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 14, borderBottom: `1px dashed ${Z.line}`,
          }}>
            <div>
              <div style={{ fontSize: 10, color: Z.muted, fontWeight: 700, letterSpacing: '0.08em' }}>ใบเสร็จ · RECEIPT</div>
              <div style={{ fontSize: 13, color: Z.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{refNo}</div>
            </div>
            <KaffMark size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
            <Row label="วันที่" value={dateStr} />
            <Row label="จำนวน" value={fmtTHB(summary.amount)} />
            <Row label="ปลายทาง" value={summary.dest} />
            <Row label="ประเภท" value={summary.type} />
            <Row label="วิธีชำระ" value={summary.payMethod === 'qr' ? 'Thai QR' : summary.payMethod === 'bank' ? 'โอนผ่านธนาคาร' : 'USDC บน Base'} />
            {dedicationName && <Row label="อุทิศแด่" value={`🤲 ${dedicationName}`} valueColor="#7a5e10" />}
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 18, borderRadius: 20,
          background: `linear-gradient(135deg, ${Z.gold} 0%, #B89438 100%)`,
          color: '#3d2c08', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 140, height: 140, borderRadius: 999,
            border: '1px solid rgba(13,59,46,0.16)',
          }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', opacity: 0.7 }}>SHAREABLE IMPACT</div>
          <div style={{
            marginTop: 8, fontSize: 17, fontWeight: 700, lineHeight: 1.45,
            whiteSpace: 'pre-line',
          }}>
            <span>{donorDisplay} {summary.shortImpact || 'เคลียร์ดอกเบี้ย'} {fmtTHB(summary.amount)}</span>
            {dedicationName && (
              <div style={{ fontWeight: 700, marginTop: 4, fontSize: 15 }}>🤲 อุทิศแด่ {dedicationName}</div>
            )}
            {summary.impactText && (
              <div style={{ fontWeight: 500, marginTop: 4 }}>{summary.impactText}</div>
            )}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, opacity: 0.65 }}>via Kaff — Be the Upper Hand</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={shareToLine} style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              background: '#06C755', color: '#fff', fontWeight: 700, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="line" size={16} color="#fff" /> Share to LINE
            </button>
            <button onClick={shareGeneric} title="แชร์ / คัดลอก" style={{
              padding: '11px 14px', borderRadius: 12,
              background: Z.forest, color: '#fff', fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="share" size={16} color="#fff" />
            </button>
          </div>
        </div>

        {summary.flow === 'zakat' && donor?.email && <ZakatReminderCard donor={donor} />}

        <TipSection donor={donor} isTest={IS_TESTING_MODE} parentFlow={summary.flow} />

        <div style={{
          marginTop: 16, padding: 14, textAlign: 'center',
          fontSize: 13, color: Z.muted, fontStyle: 'italic', lineHeight: 1.55,
        }}>
          "الحمد لله — ขอบคุณอัลลอฮ์ที่ให้โอกาส"
        </div>

        <div style={{
          marginTop: 8, textAlign: 'center', fontSize: 11.5, color: Z.muted,
        }}>
          <button onClick={() => setPolicy('privacy')} style={{ color: Z.muted, textDecoration: 'underline' }}>นโยบายความเป็นส่วนตัว</button>
          {' · '}
          <button onClick={() => setPolicy('terms')} style={{ color: Z.muted, textDecoration: 'underline' }}>ข้อกำหนด</button>
        </div>
      </div>

      <StickyBottom>
        <GoldButton onClick={onHome}>กลับหน้าหลัก <Icon name="home" size={20} /></GoldButton>
      </StickyBottom>

      <PolicySheet kind={policy} onClose={() => setPolicy(null)} />
    </div>
  );
}

// ─── TipSection (voluntary support for Kaff) ────────────────────────────────
// Shown on the success screen, AFTER the share buttons, BEFORE the home CTA.
// 100% of the donation already went to the NGO/partner; this is the donor's
// optional way to keep Kaff running. Hard rules from product spec:
//   - no "tip" in the copy (use "สนับสนุน Kaff" / "ขอบคุณ Kaff")
//   - no default selection
//   - no forced popup
//   - skip ("ครั้งหน้า") always visible
//
// Stages:
//   pick → user chooses amount or skips
//   pay  → inline QR scanned by donor in their bank app
//   done → thank-you state (replaces the section)

const TIP_PRESETS = [20, 50, 100] as const;

function TipSection({ donor, isTest, parentFlow }: {
  donor?: Donor;
  isTest: boolean;
  parentFlow: string;
}) {
  const [stage, setStage] = useState<'pick' | 'pay' | 'done'>('pick');
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fire tip_shown once when the section mounts.
  useEffect(() => {
    track('tip_shown', { flow: parentFlow });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAmount = (a: number) => {
    setAmount(a);
    setShowCustom(false);
    setStage('pay');
    track('tip_selected', { flow: parentFlow, meta: { amount: a, source: 'preset' } });
  };

  const confirmCustom = () => {
    const n = Math.round(Number(custom));
    if (!Number.isFinite(n) || n < 1 || n > 100_000) return;
    setAmount(n);
    setShowCustom(false);
    setStage('pay');
    track('tip_selected', { flow: parentFlow, meta: { amount: n, source: 'custom' } });
  };

  const skip = () => {
    track('tip_skipped', { flow: parentFlow });
    setStage('done');
  };

  const recordTip = async () => {
    if (!amount) return;
    setBusy(true);
    try {
      await apiFetch('/api/donations', {
        method: 'POST',
        body: JSON.stringify({
          flow: 'tip',
          amount,
          destination: 'Kaff Foundation (สนับสนุนระบบ)',
          payMethod: 'qr',
          niyyah: 'สนับสนุนการดำเนินงานของ Kaff',
          donorFirstName: donor?.firstName?.trim() || '',
          donorLastName:  donor?.lastName?.trim()  || '',
          donorEmail:     donor?.email?.trim()     || '',
          donorPhone:     donor?.phone?.trim()     || '',
          donorLineId:    donor?.lineId?.trim()    || undefined,
          isTest,
        }),
      });
      track('tip_completed', { flow: parentFlow, meta: { amount } });
      setStage('done');
    } catch (e) {
      console.error('tip save failed', e);
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'done') {
    return (
      <div style={{
        marginTop: 16, padding: '20px 16px',
        background: '#FBF6E4', border: `1.5px solid ${Z.goldSoft}`,
        borderRadius: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 22 }}>🙏</div>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#3d2c08' }}>
          ขอบคุณที่สนับสนุน Kaff
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#5a4400' }}>
          ความเมตตาของคุณช่วยให้ Kaff ฟรี 100% สำหรับทุกคน
        </div>
      </div>
    );
  }

  if (stage === 'pay' && amount !== null) {
    return (
      <div style={{
        marginTop: 16, padding: 18,
        background: '#fff', border: `1.5px solid ${Z.line}`,
        borderRadius: 18,
      }}>
        <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600 }}>สนับสนุน Kaff</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: Z.forest, letterSpacing: '-0.01em', marginTop: 2 }}>
          {fmtTHB(amount)}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: Z.muted, lineHeight: 1.5 }}>
          สแกน QR ด้วยแอปธนาคารใดก็ได้ — เงินไปบัญชี Kaff Foundation โดยตรง (แยกจากบัญชี NGO ปลายทาง)
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <img
            src={`/api/promptpay/qr?to=kaff&amount=${encodeURIComponent(amount)}`}
            alt={`Tip ${amount} QR`}
            width={180} height={180}
            style={{ borderRadius: 6 }}
          />
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={() => { setStage('pick'); setAmount(null); }} style={{
            flex: 1, padding: '11px 14px', borderRadius: 12,
            background: 'transparent', color: Z.muted, fontWeight: 600, fontSize: 13,
            border: `1px solid ${Z.line}`,
          }}>ยกเลิก</button>
          <button onClick={recordTip} disabled={busy} style={{
            flex: 2, padding: '11px 14px', borderRadius: 12,
            background: busy ? '#9aa39e' : Z.forest, color: '#fff',
            fontWeight: 700, fontSize: 13.5,
          }}>
            {busy ? 'กำลังบันทึก…' : isTest ? 'ทดสอบ flow' : 'ฉันสนับสนุนแล้ว'}
          </button>
        </div>
      </div>
    );
  }

  // stage === 'pick'
  return (
    <div style={{
      marginTop: 16, padding: '18px 16px',
      background: '#fff', border: `1.5px solid ${Z.line}`,
      borderRadius: 16,
    }}>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: Z.ink }}>
        ขอบคุณที่ใช้ Kaff ❤️
      </div>
      <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12.5, color: Z.muted, lineHeight: 1.55 }}>
        Kaff ฟรี 100% สำหรับคุณเสมอ<br />
        ค่าใช้จ่ายของเรามาจากความเมตตาของผู้ใช้
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {TIP_PRESETS.map(a => (
          <button key={a} onClick={() => pickAmount(a)} style={{
            padding: '12px 8px', borderRadius: 12,
            background: '#fff', border: `1.5px solid ${Z.line}`,
            color: Z.forest, fontWeight: 700, fontSize: 15,
            fontVariantNumeric: 'tabular-nums',
            transition: 'background .12s, border .12s',
          }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.background = Z.sageSoft; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          >฿{a}</button>
        ))}
      </div>

      {!showCustom ? (
        <button onClick={() => setShowCustom(true)} style={{
          width: '100%', marginTop: 8, padding: '10px',
          borderRadius: 10, background: 'transparent',
          color: Z.muted, fontSize: 13, fontWeight: 500,
          border: `1px dashed ${Z.line}`,
        }}>กำหนดเอง…</button>
      ) : (
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <input
            type="number"
            autoFocus
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="ระบุจำนวน (บาท)"
            style={{
              flex: 1, height: 40, padding: '0 12px',
              border: `1.5px solid ${Z.line}`, borderRadius: 10,
              fontSize: 14, color: Z.ink, outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <button onClick={confirmCustom} disabled={!Number(custom)} style={{
            padding: '0 14px', borderRadius: 10,
            background: Number(custom) ? Z.forest : '#E0E0E0',
            color: Number(custom) ? '#fff' : '#9aa3a0',
            fontWeight: 700, fontSize: 13,
          }}>ต่อไป</button>
        </div>
      )}

      <button onClick={skip} style={{
        width: '100%', marginTop: 12, padding: '8px',
        background: 'transparent', color: Z.muted,
        fontSize: 12.5, textDecoration: 'underline',
      }}>ครั้งหน้า</button>
    </div>
  );
}

// ─── ZakatReminderCard (hawl anniversary) ───────────────────────────────────
// One-tap opt-in shown right after a Zakat payment. We already have the
// donor's email from the form, so a single tap registers an annual lunar-
// year reminder — no extra typing. Cron at /api/cron/zakat-reminders sends
// the email and re-schedules next year automatically.

function ZakatReminderCard({ donor }: { donor: Donor }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const optIn = async () => {
    setState('busy');
    try {
      await apiFetch('/api/zakat-reminder', {
        method: 'POST',
        body: JSON.stringify({
          email: donor.email.trim(),
          name: donor.firstName.trim() || undefined,
        }),
      });
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: Z.sageSoft, border: `1.5px solid ${Z.sage}`,
        borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Icon name="check" size={18} color={Z.forest} strokeWidth={2.5} />
        <div style={{ fontSize: 12.5, color: Z.forest, lineHeight: 1.5 }}>
          <b>ตั้งเตือนแล้ว</b> — เราจะส่งอีเมลเตือนเมื่อครบรอบเฮาวล์ปีหน้า (~1 ปีจันทรคติ)
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16, padding: '14px 16px',
      background: '#fff', border: `1.5px solid ${Z.line}`,
      borderRadius: 14,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 20 }}>📿</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: Z.ink }}>เตือนซะกาตปีหน้าอัตโนมัติ</div>
          <div style={{ marginTop: 2, fontSize: 12, color: Z.muted, lineHeight: 1.5 }}>
            ซะกาตครบกำหนดทุก 1 ปีจันทรคติ (เฮาวล์) — ให้เราส่งอีเมลเตือนเมื่อถึงรอบ จะได้ไม่พลาด
          </div>
        </div>
      </div>
      <button onClick={optIn} disabled={state === 'busy'} style={{
        width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 10,
        background: state === 'busy' ? '#9aa39e' : Z.forest, color: '#fff',
        fontWeight: 700, fontSize: 13,
      }}>
        {state === 'busy' ? 'กำลังตั้งเตือน…' : `เตือนฉันที่ ${donor.email.trim()}`}
      </button>
      {state === 'error' && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: Z.danger }}>ตั้งเตือนไม่สำเร็จ ลองใหม่อีกครั้ง</div>
      )}
    </div>
  );
}
