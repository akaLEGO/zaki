import { useState, useMemo } from 'react';
import { Z, Icon, ForestHeader, BottomNav } from './ZakiUI';
import type { Tab, ZIconName } from './ZakiUI';

interface FaqItem { q: string; a: string }
interface FaqGroup { id: string; title: string; icon: ZIconName; color: string; qs: FaqItem[] }

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'about', title: 'เกี่ยวกับ Kaff', icon: 'sparkle', color: '#0D3B2E',
    qs: [
      { q: 'ทำไมต้องชื่อ Kaff?', a: 'Kaff (كفّ) เป็นภาษาอาหรับ แปลว่า "มือ / ฝ่ามือ" — มาจากฮะดีษของท่านนบีมุฮัมมัด ﷺ ว่า "มือบน ดีกว่ามือล่าง" (อัลบุคอรียฺ 1429, มุสลิม 1033) หมายความว่า มือผู้ให้นั้นประเสริฐกว่ามือผู้รับ Kaff คือเครื่องเตือนใจว่าทุกครั้งที่คุณบริจาค คุณกำลังยกระดับตัวเองและผู้อื่นไปพร้อมกัน' },
      { q: 'Kaff คืออะไร?', a: 'แอป Islamic Finance OS สำหรับมุสลิมไทย — รวมการชำระดอกเบี้ย ซะกาต ฟิฏร ฟิดยะห์ กัฟฟารอฮ์ กุรบ่าน และศ่อดะเกาะฮ์ไว้ในที่เดียว ใช้ง่ายไม่เกิน 3 ปุ่ม' },
      { q: 'เก็บค่าธรรมเนียมยังไง?', a: 'แบ่ง 2 แบบตามประเภทบริจาค:\n\n• Riba (ดอกเบี้ย): องค์กรปลายทางเป็นผู้รับผิดชอบค่าใช้จ่าย 5% เอง — ดอกเบี้ยที่คุณส่งไปคือยอดเต็ม Kaff ไม่หักอะไร\n\n• Zakat, Fitrah, Fidyah, Kaffarah, Qurban, Sadaqah: ค่าใช้จ่าย Amil 5% ของยอดบริจาคจะมาที่ Kaff ในฐานะ "อามิลีน" (Amil — 1 ใน 8 อัศนาฟตามอัล-กุรอาน 9:60) เพื่อค่าดำเนินการ ตรวจสอบ และอบรมทีม · ผู้รับได้รับ 95% ที่เหลือ' },
      { q: 'ทำไม Amil ได้ส่วนแบ่ง?', a: 'ตามอัล-กุรอาน บทอัตเตาบะฮ์ ข้อ 60 (9:60) ระบุผู้รับซะกาตไว้ 8 ประเภท หนึ่งในนั้นคือ "อามิลีน" — ผู้ที่ได้รับการแต่งตั้งให้รวบรวมและจัดการซะกาต Kaff เป็นองค์กรในฐานะนั้น ส่วนแบ่ง 5% ครอบคลุมค่าดำเนินการ ตรวจสอบสลิป อบรมทีมและที่ปรึกษาชะรีอะฮ์ ซึ่งทั้งหมดถือเป็นการกระจายซะกาตที่ถูกต้องตามหลักศาสนา' },
      { q: 'ใครรับรองความถูกต้อง?', a: 'คณะกรรมการชะรีอะฮ์อิสระ ร่วมกับองค์กรพันธมิตรในประเทศไทยและต่างประเทศ ทุกสูตรคำนวณและทุกประเภทการบริจาคได้รับการตรวจสอบ' },
      { q: 'ฉันต้องลงทะเบียนไหม?', a: 'ลงทะเบียนเพื่อเก็บประวัติและออกใบเสร็จลดหย่อนภาษีได้ แต่บริจาคแบบไม่ระบุชื่อก็ทำได้ในทุกฟีเจอร์' },
    ],
  },
  {
    id: 'riba', title: 'Riba · ดอกเบี้ย', icon: 'riba', color: '#0D3B2E',
    qs: [
      { q: 'ทำไมต้องเคลียร์ดอกเบี้ย?', a: 'ดอกเบี้ยจากบัญชีธนาคารไม่ใช่เงินที่นำมาใช้เองได้ในอิสลาม — แต่ทิ้งไปก็ไม่ใช่ทาง Kaff ช่วยส่งต่อเพื่อสาธารณประโยชน์ โดยไม่นับเป็นบุญส่วนตัว' },
      { q: 'ส่งต่อให้ใครได้บ้าง?', a: 'องค์กรสาธารณประโยชน์เท่านั้น — โรงพยาบาล / ถนน / ห้องน้ำสาธารณะ / กองทุนชุมชน ไม่ใช่มัสยิด ไม่ใช่กิจกรรมศาสนา (เพราะดอกเบี้ยไม่นับเป็นบุญ)' },
      { q: 'จะนับเป็นบุญหรือซะกาตได้ไหม?', a: 'ไม่ได้ — การเคลียร์ดอกเบี้ยเป็นเพียงการทำให้เงินสะอาด ไม่ใช่ทาน ไม่ใช่ซะกาต ตามคำชี้ขาดของนักวิชาการชะรีอะฮ์' },
    ],
  },
  {
    id: 'zakat', title: 'Zakat · ซะกาต', icon: 'zakat', color: '#C9A94A',
    qs: [
      { q: 'ซะกาตคำนวณยังไง?', a: '2.5% ของทรัพย์สิน (เงินสด เงินฝาก ทอง หุ้น) ที่ครอบครองครบ 1 ปีจันทรคติ (เฮาล์) และถึงเกณฑ์นิศ็อบ' },
      { q: 'นิศอบคืออะไร?', a: 'เกณฑ์ทรัพย์สินขั้นต่ำที่ต้องจ่ายซะกาต ≈ 85 กรัมของทองคำ ปัจจุบันประมาณ ฿195,500 (ปรับตามราคาทองรายวัน)' },
      { q: '8 อัศนาฟคือใคร?', a: 'ผู้รับซะกาต 8 กลุ่มตามอัล-กุรอาน: คนยากจน (ฟุกอรออ์) · ผู้ขัดสน (มะซากีน) · ผู้มีหนี้สิน · มุอัลลัฟ · ผู้เดินทาง · ทาส · อาสาสมัครเก็บซะกาต · ในทางของอัลลอฮ์' },
      { q: 'Fairness Engine ทำงานยังไง?', a: 'ระบบเรียงลำดับผู้รับให้ก่อน ผู้ที่ได้รับเงินช่วยเหลือในเดือนนี้น้อยกว่า เพื่อให้การกระจายเป็นธรรมและถึงผู้ที่ต้องการจริง' },
    ],
  },
  {
    id: 'wajib', title: 'Wajib · Fitrah · Fidyah · Kaffarah', icon: 'compulsory', color: '#3B5E48',
    qs: [
      { q: 'Fitrah จ่ายเมื่อไหร่?', a: 'ก่อนละหมาดอีดิลฟิตริ ภาคบังคับสำหรับมุสลิมทุกคนในครัวเรือน · 1 คน = ฿30 (เทียบเท่า 2.5 กก. ข้าว)' },
      { q: 'Fidyah คืออะไร?', a: 'การชดเชยสำหรับผู้ที่ไม่สามารถถือศีลอดได้ (สูงอายุ · ป่วยเรื้อรัง · ตั้งครรภ์) · 1 วัน = ฿15 เทียบเท่า 1 มื้ออาหารผู้ขัดสน' },
      { q: 'Kaffarah ใช้เมื่อไหร่?', a: 'การชดเชยเฉพาะ เช่น ผิดคำสาบาน หรือขาดศีลอดโดยเจตนา ระบบช่วยคำนวณ และให้ทุกธุรกรรมเป็นส่วนตัวโดยค่าเริ่มต้น' },
      { q: 'Kaffarah เป็นส่วนตัวจริงไหม?', a: 'จริง — ค่าเริ่มต้นไม่ระบุชื่อ ไม่ปรากฏในประวัติแชร์ ไม่มีการตั้งคำถามใดๆ จากเรา' },
    ],
  },
  {
    id: 'qurban', title: 'Qurban · กุรบ่าน', icon: 'qurban', color: '#7B5E2C',
    qs: [
      { q: 'ทำไมราคาต่างกันในแต่ละประเทศ?', a: 'ราคาเนื้อสด ค่าขนส่ง ภาษีในแต่ละประเทศต่างกันมาก เช่น ในบังกลาเทศหรือพื้นที่ยากไร้ ราคาแพะ/วัวต่ำกว่าในไทยหลายเท่า' },
      { q: 'วัว 1 ตัว แบ่ง 7 คน คืออะไร?', a: 'ตามคำสอน วัวหรืออูฐ 1 ตัวสามารถแบ่งทำกุรบ่านได้ 7 คน (Group Qurban) ทำให้ราคาต่อคนเข้าถึงได้มากขึ้น' },
      { q: 'เลือกพื้นที่แจกเนื้อได้ไหม?', a: 'ได้ — ไทย / บังกลาเทศ / แอฟริกาตะวันออก / กาซา-เลบานอน / ค่ายผู้ลี้ภัยโรฮิงญา ระบบจะส่งคลิปวิดีโอการแจกเนื้อกลับมาให้' },
    ],
  },
  {
    id: 'sadaqah', title: 'Sadaqah · ศ่อดะเกาะฮ์', icon: 'sadaqah', color: '#4A8B6A',
    qs: [
      { q: 'ต่างจาก Zakat ยังไง?', a: 'ซะกาตคือภาคบังคับ (2.5% ของทรัพย์ครบเกณฑ์) · ศ่อดะเกาะฮ์คือการให้ตามศรัทธา เป็นการสมัครใจ ไม่มีกฎเกณฑ์ตายตัว' },
      { q: 'แคมเปญตรวจสอบยังไง?', a: 'ทีม Kaff ลงพื้นที่ตรวจสอบทุกแคมเปญก่อนเปิดให้บริจาค และทำงานเฉพาะกับองค์กรพันธมิตรที่ผ่านการรับรอง' },
    ],
  },
  {
    id: 'payment', title: 'การชำระเงิน · ความปลอดภัย', icon: 'lock', color: '#0D3B2E',
    qs: [
      { q: 'ปลอดภัยไหม?', a: 'ใช้ Thai QR/PromptPay/โอนผ่านธนาคารโดยตรง ไม่เก็บข้อมูลบัตรเครดิตในระบบ ทุกธุรกรรมมีเลขอ้างอิงและตรวจสอบย้อนกลับได้' },
      { q: 'ขอใบเสร็จลดหย่อนภาษีได้ไหม?', a: 'ได้ — ดาวน์โหลดใบเสร็จ PDF รายเดือนหรือรายปีผ่านเมนู "ใบเสร็จลดหย่อนภาษี" ในโปรไฟล์ (เฉพาะองค์กรที่ลดหย่อนได้)' },
      { q: 'รับ USDC/Crypto ไหม?', a: 'รับ — USDC บน Polygon และ Solana สำหรับผู้บริจาคต่างประเทศ ระบบแปลงเป็นเงินบาทอัตโนมัติก่อนส่งต่อ' },
    ],
  },
];

export function FAQScreen({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    if (!query.trim()) return FAQ_GROUPS;
    const q = query.trim().toLowerCase();
    return FAQ_GROUPS.map(g => ({
      ...g,
      qs: g.qs.filter(item =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter(g => g.qs.length > 0);
  }, [query]);

  return (
    <div style={{ width: '100%', height: '100%', background: Z.surface, overflowY: 'auto', position: 'relative' }}>
      <ForestHeader title="คำถามที่พบบ่อย" sub="ทุกฟีเจอร์ของ Kaff · อธิบายให้เข้าใจง่าย" compact />

      <div style={{ padding: '18px 16px 120px' }}>
        <div style={{
          background: '#fff', borderRadius: 16, border: `1.5px solid ${Z.line}`,
          padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Z.muted} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m20 20-4.5-4.5" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาคำถาม เช่น ซะกาต, ค่าธรรมเนียม"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 14, padding: '12px 0', color: Z.ink,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ fontSize: 13, color: Z.muted, padding: 4 }}>ล้าง</button>
          )}
        </div>

        {groups.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: Z.muted, fontSize: 14 }}>
            ไม่พบคำถามที่ตรงกับ "{query}"<br />
            <span style={{ fontSize: 12 }}>ลองใช้คำอื่น หรือถามทีม Kaff โดยตรง</span>
          </div>
        )}

        {groups.map((g, gi) => (
          <div key={g.id} style={{ marginTop: gi === 0 ? 22 : 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 10px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: g.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={g.icon} size={16} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: Z.forest, letterSpacing: '-0.005em' }}>{g.title}</div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: Z.muted }}>{g.qs.length} คำถาม</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${Z.line}`, overflow: 'hidden' }}>
              {g.qs.map((item, qi) => {
                const id = `${g.id}-${qi}`;
                const isOpen = open === id;
                return (
                  <div key={qi} style={{ borderTop: qi ? `1px solid ${Z.line}` : 'none' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: Z.ink, fontWeight: 600, lineHeight: 1.4 } as React.CSSProperties}>
                        {item.q}
                      </div>
                      <div style={{
                        color: g.color, paddingTop: 2,
                        transition: 'transform .25s',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        flexShrink: 0,
                      }}>
                        <Icon name="chevDown" size={18} strokeWidth={2} />
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 16px 16px',
                        fontSize: 13.5, color: '#3b4842', lineHeight: 1.6,
                        animation: 'faqExpand .25s ease-out',
                      }}>
                        <div style={{
                          padding: 14, background: Z.surface, borderRadius: 12,
                          borderLeft: `3px solid ${g.color}`,
                        }}>{item.a}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 24, padding: 18,
          background: `linear-gradient(135deg, ${Z.forest} 0%, ${Z.forestDeep} 100%)`,
          color: '#fff', borderRadius: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -40, top: -40,
            width: 130, height: 130, borderRadius: 999,
            border: '1px solid rgba(201,169,74,0.18)',
          }} />
          <div style={{ fontSize: 11, color: Z.gold, fontWeight: 700, letterSpacing: '0.12em' }}>ไม่เจอคำตอบ?</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>ถามทีม Kaff โดยตรง</div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>ตอบใน 1 ชั่วโมงระหว่างเวลาทำการ</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              background: '#06C755', color: '#fff', fontWeight: 700, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="line" size={16} color="#fff" /> LINE @kaff
            </button>
            <button style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              background: Z.gold, color: '#3d2c08', fontWeight: 700, fontSize: 13.5,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              ถามชะรีอะฮ์
            </button>
          </div>
        </div>
      </div>

      <BottomNav tab={tab} onTab={onTab} />
      <style>{`
        @keyframes faqExpand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 300px; }
        }
      `}</style>
    </div>
  );
}
