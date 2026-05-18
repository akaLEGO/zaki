import { useEffect, useState } from 'react';
import { useUser, useClerk, SignInButton } from '@clerk/clerk-react';
import {
  Z, Icon, ForestHeader, BottomNav, ZakiMark, GoldButton,
} from './ZakiUI';
import type { Tab, ZIconName } from './ZakiUI';
import { apiFetch } from '../lib/api';

export type ServiceId = 'riba' | 'zakat' | 'compulsory' | 'qurban' | 'sadaqah';

interface ServiceDeckItem {
  id: ServiceId;
  bg: string; fg: string; accent: string;
  ribbon: string; hook: string; sub: string;
  icon: ZIconName;
}

export const SERVICE_DECK: ServiceDeckItem[] = [
  { id: 'riba',       bg: '#0D3B2E', fg: '#fff',     accent: '#C9A94A', ribbon: 'RIBA',       hook: 'ไม่รู้จะทำยังไงกับดอกเบี้ยที่มี?',          sub: 'เคลียร์ให้เกิดประโยชน์',     icon: 'riba' },
  { id: 'zakat',      bg: '#C9A94A', fg: '#1f1707', accent: '#0D3B2E', ribbon: 'ZAKAT',      hook: 'รู้ได้ไงว่าซะกาตให้ได้ประโยชน์สูงสุด?',     sub: 'คำนวณ 2.5% · เลือกผู้รับ',  icon: 'zakat' },
  { id: 'compulsory', bg: '#3B5E48', fg: '#fff',     accent: '#E8D58A', ribbon: 'WAJIB',      hook: 'ฟิดยะห์ · ฟิฏร · กัฟฟารอฮ์ ครบที่นี่',    sub: 'ระบบช่วยคำนวณให้',          icon: 'compulsory' },
  { id: 'qurban',     bg: '#7B5E2C', fg: '#fff',     accent: '#F0D88E', ribbon: 'QURBAN',     hook: 'อยากทำกุรบ่านแต่ราคาสูงไป?',                sub: 'เปรียบเทียบ 4 ประเทศ',      icon: 'qurban' },
  { id: 'sadaqah',    bg: '#4A8B6A', fg: '#fff',     accent: '#F5EDD3', ribbon: 'SADAQAH',    hook: 'บริจาคตามศรัทธา ถูกที่ถูกเวลา',             sub: 'แคมเปญที่เลือกมาให้คุณ',    icon: 'sadaqah' },
];

export type CompulsoryWording = 'wajib' | 'duty' | 'complete' | 'compulsory';
export type HomeLayout = 'stacked' | 'flat';

export const COMPULSORY_WORDINGS: Record<CompulsoryWording, { ribbon: string; hook: string }> = {
  wajib:      { ribbon: 'WAJIB',      hook: 'ฟิดยะห์ · ฟิฏร · กัฟฟารอฮ์ ครบที่นี่' },
  duty:       { ribbon: 'หน้าที่',     hook: 'สิ่งที่ต้องชำระ ก่อนพ้นเวลา' },
  complete:   { ribbon: 'ครบถ้วน',   hook: 'ทำให้เรียบร้อย ก่อนหมดเวลา' },
  compulsory: { ribbon: 'COMPULSORY', hook: 'ถึงเวลาแล้ว ทำให้ถูกต้อง' },
};

interface HomeScreenProps {
  onService: (id: ServiceId) => void;
  tab: Tab;
  onTab: (t: Tab) => void;
  compulsoryWording?: CompulsoryWording;
  homeLayout?: HomeLayout;
}

export function HomeScreen({ onService, tab, onTab, compulsoryWording = 'wajib', homeLayout = 'stacked' }: HomeScreenProps) {
  const { isSignedIn } = useUser();
  const [focused, setFocused] = useState<ServiceId | null>(null);

  const deck = SERVICE_DECK.map(s => {
    if (s.id !== 'compulsory') return s;
    const w = COMPULSORY_WORDINGS[compulsoryWording] || COMPULSORY_WORDINGS.wajib;
    return { ...s, ribbon: w.ribbon, hook: w.hook };
  });

  const CardInner = ({ s, isFocused, showCTA }: { s: ServiceDeckItem; isFocused: boolean; showCTA: boolean }) => (
    <>
      <svg width="100%" height="100%" viewBox="0 0 360 320" preserveAspectRatio="xMidYMin slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
        {Array.from({ length: 14 }).map((_, k) => (
          <line key={k} x1={-40 + k * 36} y1="400" x2={200 + k * 36} y2="-40"
            stroke={s.accent} strokeWidth="1" />
        ))}
      </svg>
      <div style={{
        position: 'absolute', right: -50, top: -50,
        width: 140, height: 140, borderRadius: 999,
        border: `1px solid ${s.accent}`, opacity: 0.22, pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.14em', color: s.accent,
        }}>{s.ribbon}</div>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.10)',
          color: s.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid rgba(255,255,255,0.10)`,
        }}>
          <Icon name={s.icon} size={19} color={s.accent} strokeWidth={1.7} />
        </div>
      </div>

      <div style={{
        marginTop: 8, fontSize: 18, fontWeight: 700, lineHeight: 1.28,
        letterSpacing: '-0.005em',
        textWrap: 'balance',
        position: 'relative',
        maxWidth: '94%',
      } as React.CSSProperties}>{s.hook}</div>

      {!showCTA && (
        <div style={{
          marginTop: 6, fontSize: 12.5, color: s.fg, opacity: 0.66,
          position: 'relative',
        }}>{s.sub}</div>
      )}

      {showCTA && (
        <div style={{
          position: 'absolute', left: 22, right: 18, bottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 12.5, color: s.fg, opacity: 0.7, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sub}</div>
          <div style={{
            width: 36, height: 36, borderRadius: 999, flexShrink: 0,
            background: s.accent, color: s.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .2s',
            transform: isFocused ? 'translateX(2px)' : 'none',
          }}>
            <Icon name="arrowRight" size={18} strokeWidth={2.2} color={s.bg} />
          </div>
        </div>
      )}
    </>
  );

  const PEEK = 118;
  const FULL = 170;

  return (
    <div style={{
      width: '100%', height: '100%', background: '#F2F5F2',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
        padding: '58px 22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #F2F5F2 65%, rgba(242,245,242,0) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ZakiMark size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: Z.forest, letterSpacing: '-0.01em', lineHeight: 1 }}>Zaki</div>
            <div style={{ fontSize: 10, color: Z.muted, letterSpacing: '0.04em', marginTop: 3, fontWeight: 500 }}>เปลี่ยนทุกการให้ ให้บริสุทธิ์</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!isSignedIn && (
            <SignInButton mode="modal">
              <button style={{
                height: 34, padding: '0 14px', borderRadius: 999,
                background: Z.forest, color: Z.gold,
                border: `1px solid ${Z.forest}`,
                fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
              }}>เข้าสู่ระบบ</button>
            </SignInButton>
          )}
          <button style={{
            height: 34, padding: '0 12px', borderRadius: 999,
            background: '#fff', color: Z.forest,
            border: `1px solid ${Z.line}`,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
          }}>EN</button>
        </div>
      </div>

      {homeLayout === 'stacked' && (
        <div style={{
          position: 'absolute', top: 110, left: 0, right: 0, bottom: 0,
          padding: '0 16px',
        }}>
          {deck.map((s, i) => {
            const top = i * PEEK;
            const isLast = i === deck.length - 1;
            const height = isLast ? FULL : PEEK + 70;
            const isFocused = focused === s.id;
            return (
              <button
                key={s.id}
                onMouseEnter={() => setFocused(s.id)}
                onMouseLeave={() => setFocused(null)}
                onClick={() => onService(s.id)}
                style={{
                  position: 'absolute',
                  left: 16, right: 16,
                  top: top + (isFocused ? -10 : 0),
                  height,
                  background: s.bg, color: s.fg,
                  borderRadius: 26,
                  padding: '16px 22px 20px',
                  textAlign: 'left',
                  boxShadow: isFocused
                    ? `0 -2px 0 rgba(255,255,255,0.04) inset, 0 22px 38px rgba(13,59,46,0.28)`
                    : `0 -2px 0 rgba(255,255,255,0.04) inset, 0 12px 24px rgba(13,59,46,0.16)`,
                  transition: 'top .35s cubic-bezier(.2,.8,.2,1), box-shadow .25s',
                  overflow: 'hidden',
                  zIndex: i + 1,
                  cursor: 'pointer',
                }}
              >
                <CardInner s={s} isFocused={isFocused} showCTA={isLast} />
              </button>
            );
          })}
        </div>
      )}

      {homeLayout === 'flat' && (
        <div style={{
          position: 'absolute', top: 104, left: 0, right: 0, bottom: 100,
          padding: '4px 16px 24px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {deck.map(s => {
            const isFocused = focused === s.id;
            return (
              <button
                key={s.id}
                onMouseEnter={() => setFocused(s.id)}
                onMouseLeave={() => setFocused(null)}
                onClick={() => onService(s.id)}
                style={{
                  position: 'relative',
                  background: s.bg, color: s.fg,
                  borderRadius: 22,
                  padding: '16px 22px 18px',
                  textAlign: 'left',
                  minHeight: 168,
                  border: 'none',
                  boxShadow: isFocused
                    ? '0 16px 28px rgba(13,59,46,0.18)'
                    : '0 6px 14px rgba(13,59,46,0.08)',
                  transition: 'transform .25s, box-shadow .25s',
                  transform: isFocused ? 'translateY(-3px)' : 'none',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <CardInner s={s} isFocused={isFocused} showCTA />
              </button>
            );
          })}
        </div>
      )}

      <BottomNav tab={tab} onTab={onTab} />
    </div>
  );
}

interface DonationRow {
  id: number; ref: string; flow: string; amount: number;
  destination: string | null; payMethod: string | null;
  status: string; niyyah: string | null; createdAt: string;
}

const FLOW_LABEL: Record<string, string> = {
  riba: 'Riba', zakat: 'Zakat', fitrah: 'Fitrah', fidyah: 'Fidyah',
  kaffarah: 'Kaffarah', qurban: 'Qurban', sadaqah: 'Sadaqah',
};

export function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { isSignedIn, isLoaded } = useUser();
  const [items, setItems] = useState<DonationRow[]>([]);
  const [ytd, setYtd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); return; }
    apiFetch<{ items: DonationRow[]; ytd: number }>('/api/donations/mine')
      .then(d => { setItems(d.items); setYtd(d.ytd); })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: Z.surface, position: 'relative' }}>
        <ForestHeader onBack={onBack} title="ประวัติการบริจาค" compact />
        <div style={{ padding: 40, textAlign: 'center', color: Z.muted, fontSize: 13 }}>กำลังโหลด…</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ width: '100%', height: '100%', background: Z.surface, position: 'relative' }}>
        <ForestHeader onBack={onBack} title="ประวัติการบริจาค" sub="เข้าสู่ระบบเพื่อดูประวัติการบริจาคของคุณ" compact />
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: Z.muted, marginBottom: 18, lineHeight: 1.55 }}>
            ทุกอย่างเป็นความลับ — เก็บประวัติไว้ในบัญชีของคุณ ดาวน์โหลดใบเสร็จได้ทุกเมื่อ
          </div>
          <SignInButton mode="modal">
            <GoldButton full={false}>เข้าสู่ระบบ / สมัครใหม่</GoldButton>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ width: '100%', height: '100%', background: Z.surface, position: 'relative' }}>
        <ForestHeader onBack={onBack} title="ประวัติการบริจาค" compact />
        <div style={{ padding: 40, color: '#c0392b', fontSize: 13 }}>โหลดไม่สำเร็จ: {err}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: Z.surface, overflowY: 'auto', position: 'relative' }}>
      <ForestHeader onBack={onBack} title="ประวัติการบริจาค" sub="ทุกอย่างเป็นความลับ · ดาวน์โหลดใบเสร็จได้ทุกเมื่อ" compact />
      <div style={{ padding: '20px 16px 40px' }}>
        <div style={{
          background: '#fff', borderRadius: 22, padding: 18,
          border: `1.5px solid ${Z.line}`,
        }}>
          <div style={{ fontSize: 12, color: Z.muted, letterSpacing: '0.08em', fontWeight: 600 }}>YEAR-TO-DATE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: Z.forest, letterSpacing: '-0.02em' }}>฿{ytd.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600 }}>{items.length} ครั้ง</div>
          </div>
        </div>

        <div style={{ marginTop: 22, marginBottom: 10, padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: Z.forest }}>ธุรกรรมล่าสุด</div>
          <div style={{ fontSize: 12, color: Z.muted }}>{items.length} รายการ</div>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: '40px 20px', background: '#fff', borderRadius: 20, border: `1.5px solid ${Z.line}`, textAlign: 'center', color: Z.muted, fontSize: 13 }}>
            ยังไม่มีรายการ — บริจาคครั้งแรกได้จากหน้าหลัก
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${Z.line}` }}>
            {items.map((it, i) => {
              const type = FLOW_LABEL[it.flow] || it.flow;
              return (
                <div key={it.id} style={{
                  padding: '14px 16px',
                  borderTop: i ? `1px solid ${Z.line}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: it.flow === 'riba' ? Z.forest : it.flow === 'zakat' ? Z.gold : Z.sage,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                  }}>{type.slice(0,3).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: Z.ink, fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{it.destination || '—'}</div>
                    <div style={{ fontSize: 11.5, color: Z.muted, marginTop: 1 }}>{it.createdAt} · {type} · {it.ref}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: Z.ink, fontVariantNumeric: 'tabular-nums' }}>฿{it.amount.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: Z.sage, fontWeight: 600 }}>✓ สำเร็จ</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileScreen({ tab, onTab, onHistory }: { tab: Tab; onTab: (t: Tab) => void; onHistory: () => void }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [ytd, setYtd] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    apiFetch<{ items: unknown[]; ytd: number }>('/api/donations/mine')
      .then(d => { setYtd(d.ytd); setCount(d.items.length); })
      .catch(() => { /* silently fail; stats just stay null */ });
  }, [isSignedIn]);

  if (isLoaded && !isSignedIn) {
    return (
      <div style={{ width: '100%', height: '100%', background: Z.surface, position: 'relative' }}>
        <ForestHeader compact>
          <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700 }}>ยินดีต้อนรับ</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            เข้าสู่ระบบเพื่อเก็บประวัติการบริจาคและใบเสร็จลดหย่อนภาษี
          </div>
        </ForestHeader>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <SignInButton mode="modal">
            <GoldButton full={false}>เข้าสู่ระบบ / สมัครใหม่</GoldButton>
          </SignInButton>
          <div style={{ marginTop: 16, fontSize: 12, color: Z.muted }}>
            หรือบริจาคแบบไม่ระบุชื่อต่อได้จากหน้าหลัก
          </div>
        </div>
        <BottomNav tab={tab} onTab={onTab} />
      </div>
    );
  }

  const name = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'ผู้ใช้';
  const initial = name.charAt(0).toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }) : '';

  const rows = [
    { label: 'ตั้งค่าโปรไฟล์', sub: user?.primaryEmailAddress?.emailAddress || 'ชื่อ · อีเมล · LINE', onClick: () => {} },
    { label: 'ที่ปรึกษาชะรีอะฮ์', sub: 'อ่านคำชี้แจง · ถามคำถาม', onClick: () => {} },
    { label: 'องค์กรที่ติดตาม', sub: 'จัดการรายชื่อ', onClick: () => {} },
    { label: 'ตั้งค่าความเป็นส่วนตัว', sub: 'ค่าเริ่มต้น: ไม่ระบุชื่อ', onClick: () => {} },
    { label: 'ใบเสร็จลดหย่อนภาษี', sub: 'ดาวน์โหลด PDF รวมทั้งปี', onClick: () => {} },
    { label: 'ภาษา · Language', sub: 'ไทย / English', onClick: () => {} },
    { label: 'ออกจากระบบ', sub: '', onClick: () => signOut() },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: Z.surface, overflowY: 'auto', position: 'relative' }}>
      <ForestHeader compact>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 22,
            background: 'linear-gradient(135deg, #2EC27E 0%, #1F8A5B 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, fontFamily: 'Sarabun',
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>สมาชิก Zaki{memberSince ? ` · ตั้งแต่ ${memberSince}` : ''}</div>
          </div>
        </div>
      </ForestHeader>

      <div style={{ padding: '20px 16px 120px' }}>
        <button
          onClick={onHistory}
          style={{
            width: '100%', textAlign: 'left',
            background: '#fff', borderRadius: 20, padding: 16,
            border: `1.5px solid ${Z.line}`,
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 12,
            transition: 'transform .12s, border-color .15s',
            cursor: 'pointer',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.99)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: Z.forest, color: Z.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="history" size={22} color={Z.gold} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: Z.ink, letterSpacing: '-0.005em' }}>ประวัติการบริจาค</div>
            <div style={{ fontSize: 12, color: Z.muted, marginTop: 2 }}>
              {count !== null && ytd !== null ? `${count} รายการ · ยอดรวม ฿${ytd.toLocaleString()} ปีนี้` : 'ดูประวัติทั้งหมด'}
            </div>
          </div>
          <div style={{ color: Z.muted, transform: 'rotate(-90deg)' }}><Icon name="chevDown" size={18} /></div>
        </button>

        <div style={{
          padding: 16, background: '#fff', borderRadius: 20, border: `1.5px solid ${Z.line}`,
          display: 'flex', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: Z.muted, fontWeight: 600 }}>บริจาคทั้งหมดปีนี้</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: Z.forest, fontVariantNumeric: 'tabular-nums' }}>฿{(ytd ?? 0).toLocaleString()}</div>
          </div>
          <div style={{ width: 1, background: Z.line }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: Z.muted, fontWeight: 600 }}>จำนวนครั้ง</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: Z.forest, fontVariantNumeric: 'tabular-nums' }}>{count ?? 0}</div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: '#fff', borderRadius: 20, border: `1.5px solid ${Z.line}` }}>
          {rows.map((r, i) => (
            <button key={i} onClick={r.onClick} style={{
              width: '100%', textAlign: 'left',
              padding: '14px 16px',
              borderTop: i ? `1px solid ${Z.line}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', background: 'transparent',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: i === rows.length - 1 ? '#c0392b' : Z.ink, fontWeight: 600 }}>{r.label}</div>
                {r.sub && <div style={{ fontSize: 12, color: Z.muted, marginTop: 1 }}>{r.sub}</div>}
              </div>
              <div style={{ color: Z.muted, transform: 'rotate(-90deg)' }}><Icon name="chevDown" size={16} /></div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav tab={tab} onTab={onTab} />
    </div>
  );
}
