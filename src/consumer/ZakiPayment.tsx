import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Z, Icon, GoldButton, ForestHeader, StickyBottom, NiyyahBox, ZakiMark, fmtTHB,
} from './ZakiUI';
import type { ZIconName } from './ZakiUI';

export type PayMethod = 'qr' | 'bank' | 'usdc';

export interface Summary {
  amount: number;
  type: string;
  dest: string;
  niyyah: string;
  shortImpact?: string;
  impactText?: string;
  payMethod?: PayMethod;
}

export function CheckoutScreen({ summary, payMethod, setPayMethod, niyyahConfirmed, setNiyyahConfirmed, onBack, onNext }: {
  summary: Summary; payMethod: PayMethod; setPayMethod: (m: PayMethod) => void;
  niyyahConfirmed: boolean; setNiyyahConfirmed: (b: boolean) => void;
  onBack: () => void; onNext: () => void;
}) {
  const methods: { id: PayMethod; label: string; sub: string; icon: ZIconName }[] = [
    { id: 'qr', label: 'Thai QR (PromptPay)', sub: 'สแกนผ่านแอปธนาคาร', icon: 'qr' },
    { id: 'bank', label: 'โอนผ่านธนาคาร', sub: 'คัดลอกเลขบัญชี · แนบสลิป', icon: 'bank' },
    { id: 'usdc', label: 'USDC (Crypto)', sub: 'Polygon · Solana', icon: 'coin' },
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
            <Row label="ค่าธรรมเนียม" value="฿0" sub="(เก็บจากองค์กร 5%)" valueColor={Z.sage} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <NiyyahBox
            text={summary.niyyah}
            confirmed={niyyahConfirmed}
            onConfirm={() => setNiyyahConfirmed(!niyyahConfirmed)}
          />
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

        <div style={{ marginTop: 14, fontSize: 11, color: Z.muted, textAlign: 'center', lineHeight: 1.5 }}>
          🔒 ปลอดภัย · ตรวจสอบโดยที่ปรึกษาชะรีอะฮ์<br />ใบเสร็จออนไลน์ลดหย่อนภาษีได้
        </div>
      </div>

      <StickyBottom>
        <GoldButton
          disabled={!niyyahConfirmed}
          onClick={onNext}
        >
          {!niyyahConfirmed ? 'กรุณายืนยัน Niyyah ก่อน' : <>ดำเนินการชำระเงิน <Icon name="arrowRight" size={20} /></>}
        </GoldButton>
      </StickyBottom>
    </div>
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

export function QRPayment({ amount, onBack, onConfirm }: { amount: number; onBack: () => void; onConfirm: () => void }) {
  const [secs, setSecs] = useState(600);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="สแกนเพื่อชำระ" sub="Thai QR · PromptPay · รองรับทุกธนาคาร" compact />
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
          <FakeQR size={200} style={{ marginTop: 14 }} />
          <div style={{ marginTop: 14, fontSize: 12, color: Z.muted, textAlign: 'center' }}>
            ผู้รับ: <b style={{ color: Z.ink }}>Zaki Trust Account</b><br />
            อ้างอิง: <span style={{ fontVariantNumeric: 'tabular-nums', color: Z.ink }}>ZK-{Math.floor(Math.random() * 9000 + 1000)}-58</span>
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
      </div>

      <StickyBottom>
        <GoldButton onClick={onConfirm}>โอนแล้ว ยืนยัน <Icon name="check" size={20} /></GoldButton>
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
              fontSize="18" fontWeight="800" fontFamily="Sarabun, system-ui">ز</text>
      </svg>
    </div>
  );
}

export function BankTransfer({ amount, onBack, onConfirm }: { amount: number; onBack: () => void; onConfirm: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };
  const fields: { key: string; label: string; value: string; big?: boolean }[] = [
    { key: 'bank', label: 'ธนาคาร', value: 'SCB · ไทยพาณิชย์' },
    { key: 'name', label: 'ชื่อบัญชี', value: 'มูลนิธิ Zaki Foundation' },
    { key: 'no', label: 'เลขที่บัญชี', value: '407-298-8472' },
    { key: 'amt', label: 'จำนวนเงิน', value: '฿' + amount.toLocaleString(), big: true },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: Z.surface }}>
      <ForestHeader onBack={onBack} title="โอนผ่านธนาคาร" sub="คัดลอกแล้วเปิดแอปธนาคารของคุณ" compact />
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
          กรุณาส่งสลิปมาที่ <b style={{ color: '#3d2c08' }}>donate@zaki.app</b> หรือแคปกดปุ่มยืนยันด้านล่าง — ระบบจะตรวจสอบและออกใบเสร็จภายใน 1 ชั่วโมง
        </div>
      </div>

      <StickyBottom>
        <GoldButton onClick={onConfirm}>โอนแล้ว ยืนยัน <Icon name="check" size={20} /></GoldButton>
      </StickyBottom>
    </div>
  );
}

export function SuccessScreen({ summary, onHome }: { summary: Summary; onHome: () => void }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const refNo = useMemo(() => 'ZK-' + Math.floor(Math.random() * 900000 + 100000), []);
  const dateStr = useMemo(() => {
    const d = new Date();
    return `${d.getDate()} พ.ค. 2569 · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }, []);

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
        <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>บริจาคสำเร็จแล้ว</div>
        <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{impact}</div>
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
            <ZakiMark size={32} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
            <Row label="วันที่" value={dateStr} />
            <Row label="จำนวน" value={fmtTHB(summary.amount)} />
            <Row label="ปลายทาง" value={summary.dest} />
            <Row label="ประเภท" value={summary.type} />
            <Row label="วิธีชำระ" value={summary.payMethod === 'qr' ? 'Thai QR' : summary.payMethod === 'bank' ? 'โอนผ่านธนาคาร' : 'USDC'} />
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
            <span>คุณกัสมา {summary.shortImpact || 'เคลียร์ดอกเบี้ย'} {fmtTHB(summary.amount)}</span>
            {summary.impactText && (
              <div style={{ fontWeight: 500, marginTop: 4 }}>{summary.impactText}</div>
            )}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, opacity: 0.65 }}>via Zaki — Give Pure · ให้บริสุทธิ์</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              background: '#06C755', color: '#fff', fontWeight: 700, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="line" size={16} color="#fff" /> Share to LINE
            </button>
            <button style={{
              padding: '11px 14px', borderRadius: 12,
              background: Z.forest, color: '#fff', fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="download" size={16} color="#fff" />
            </button>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 14, textAlign: 'center',
          fontSize: 13, color: Z.muted, fontStyle: 'italic', lineHeight: 1.55,
        }}>
          "الحمد لله — ขอบคุณอัลลอฮ์ที่ให้โอกาส"
        </div>
      </div>

      <StickyBottom>
        <GoldButton onClick={onHome}>กลับหน้าหลัก <Icon name="home" size={20} /></GoldButton>
      </StickyBottom>
    </div>
  );
}
