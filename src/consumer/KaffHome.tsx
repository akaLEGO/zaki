import { useEffect, useState } from 'react';
import { useUser, useClerk, SignInButton } from '@clerk/clerk-react';
import {
  Z, K, G, NUM, glass, Icon, ForestHeader, BottomNav, KaffMark, GoldButton, Amount, Eyebrow,
  Skeleton, EmptyState,
} from './KaffUI';
import type { Tab, ZIconName } from './KaffUI';
import { apiFetch } from '../lib/api';
import { DISPLAY_VERSION } from '../lib/version';

export type ServiceId = 'riba' | 'zakat' | 'compulsory' | 'qurban' | 'sadaqah';

interface ServiceDeckItem {
  id: ServiceId;
  /** Capsule fill — the per-service gradient from the 2026 handoff. */
  bg: string;
  /** Body text colour on that fill. */
  fg: string;
  /** Eyebrow + icon-chip colour. */
  accent: string;
  ribbon: string;
  /** Card title — 16px/600. */
  hook: string;
  /** Meta line under the title — 11px. */
  sub: string;
  icon: ZIconName;
  /** Featured = the one card that gets the round accent arrow button. */
  featured?: boolean;
  /** Optional seasonal badge text shown on featured cards. */
  featuredBadge?: string;
}

// Order in this array = display order in the pillar stack (top → bottom),
// which matches the handoff: Riba · Zakat · Sadaqah · Wajib · Qurban.
//
// SEASONAL FEATURE: `featured` promotes one service with the accent arrow
// button. Swap it when the season turns (Ramadan → Fitrah, Dhul-Hijjah →
// Qurban, year-end → Zakat). Only ONE item should be featured at a time.
//
// FUTURE — admin control: this hardcoded list is the fallback. Once
// /api/reference returns a `services` override (display_order + featured
// + emphasis), HomeScreen will merge it on top of these defaults so the
// admin can re-prioritize without a code push.
//
// Meta lines describe what the service *does*. They must not quote figures
// Kaff has not actually measured for this user — there is no bank-statement
// scan behind Riba yet, so it does not claim a detected amount.
export const SERVICE_DECK: ServiceDeckItem[] = [
  // Post-Eid season: Riba (Kaff's flagship differentiator) leads; Qurban
  // moves to the bottom until next Dhul-Hijjah.
  { id: 'riba',       bg: 'linear-gradient(120deg,#08231B,#0D3B2E 70%)',        fg: K.onDark,   accent: K.gold500, ribbon: 'RIBA',    hook: 'แยกดอกเบี้ยออกจากบัญชี',       sub: 'ส่งต่อสาธารณประโยชน์ · 100% ถึงผู้รับ', icon: 'riba', featured: true },
  { id: 'zakat',      bg: 'linear-gradient(120deg,#D8B54A,#C9A227 75%)',        fg: K.inkGold,  accent: '#5a4a10', ribbon: 'ZAKAT',   hook: 'คำนวณและจ่ายซะกาต',           sub: 'คำนวณ 2.5% · เลือกผู้รับ 8 อัศนาฟ',   icon: 'zakat' },
  { id: 'sadaqah',    bg: 'linear-gradient(120deg,#5FB47C,#3E9A63 78%)',        fg: '#123322',  accent: '#0D3B2E', ribbon: 'SADAQAH', hook: 'บริจาคตามศรัทธา',             sub: 'แคมเปญที่ทีม Kaff คัดมาแล้ว',        icon: 'sadaqah' },
  { id: 'compulsory', bg: 'linear-gradient(120deg,#2C7D53,#1F6544 80%)',        fg: K.onDark,   accent: K.lime,    ribbon: 'WAJIB',   hook: 'ฟิดยะห์ · ฟิฏร · กัฟฟารอฮ์',   sub: 'ระบบช่วยคำนวณให้',                  icon: 'compulsory' },
  { id: 'qurban',     bg: 'linear-gradient(120deg,#8A7538,#6E5A2A 80%)',        fg: K.onDark,   accent: K.gold300, ribbon: 'QURBAN',  hook: 'เลือกทำกุรบานทั่วโลก',         sub: 'เปรียบเทียบราคา · ร่วมกับ Ummatee',   icon: 'qurban' },
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

// ─── Transparency / social proof ────────────────────────────────────────────
// Strip under the header: verified totals + the latest donor (first name
// only). Tapping opens a sheet with the per-flow breakdown. Data is public
// /api/stats — completed + non-test donations only.

interface StatsResponse {
  totals: { count: number; amount: number; donors: number };
  byFlow: { flow: string; count: number; amount: number }[];
  recent: { firstName: string | null; flow: string; at: string }[];
}

const FLOW_TH: Record<string, string> = {
  riba: 'เคลียร์ดอกเบี้ย', zakat: 'ซะกาต', fitrah: 'ฟิฏร', fidyah: 'ฟิดยะห์',
  kaffarah: 'กัฟฟารอฮ์', qurban: 'กุรบ่าน', sadaqah: 'ศ่อดะเกาะฮ์',
};

function thaiTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

/** Current Hijri year, e.g. "1448 H" — drives the hero's giving-period label. */
function hijriYear(): string {
  try {
    const y = new Intl.DateTimeFormat('en-u-ca-islamic', { year: 'numeric' }).format(new Date());
    return `${y.replace(/[^\d]/g, '')} H`;
  } catch {
    return '';
  }
}

function TransparencySheet({ stats, onClose }: { stats: StatsResponse; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(6,26,20,0.5)', zIndex: 80,
        backdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81,
        maxWidth: 480, margin: '0 auto',
        background: G.paperGreen, borderRadius: '28px 28px 0 0',
        boxShadow: '0 -18px 50px rgba(0,0,0,0.18)',
        padding: '20px 20px 32px', maxHeight: '75vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(13,59,46,0.16)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: Z.forest, letterSpacing: '-0.015em' }}>ความโปร่งใส · ตัวเลขจริง</div>
        <div style={{ marginTop: 4, fontSize: 12.5, color: Z.muted }}>
          เฉพาะรายการที่ยืนยันแล้ว · อัปเดตเรียลไทม์ · ไม่รวมรายการทดสอบ
        </div>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <div style={{ ...glass('light', true), borderRadius: 18, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: Z.muted, fontWeight: 600 }}>ส่งถึงผู้รับแล้ว</div>
            <div style={{ ...NUM, fontSize: 23, fontWeight: 700, color: Z.forest, letterSpacing: '-0.03em' }}>฿{stats.totals.amount.toLocaleString()}</div>
          </div>
          <div style={{ ...glass('light', true), borderRadius: 18, padding: 14 }}>
            <div style={{ fontSize: 11.5, color: Z.muted, fontWeight: 600 }}>ผู้ให้ทั้งหมด</div>
            <div style={{ ...NUM, fontSize: 23, fontWeight: 700, color: Z.forest, letterSpacing: '-0.03em' }}>{stats.totals.donors.toLocaleString()} คน</div>
          </div>
        </div>

        {stats.byFlow.length > 0 && (
          <div style={{ marginTop: 12, ...glass('light', true), borderRadius: 20, overflow: 'hidden' }}>
            {stats.byFlow.map((f, i) => (
              <div key={f.flow} style={{
                padding: '11px 15px', display: 'flex', justifyContent: 'space-between',
                borderTop: i ? '1px solid rgba(13,59,46,0.07)' : 'none', fontSize: 13,
              }}>
                <span style={{ color: Z.ink, fontWeight: 600 }}>{FLOW_TH[f.flow] || f.flow}</span>
                <span style={{ ...NUM, color: Z.forest, fontWeight: 700 }}>฿{f.amount.toLocaleString()} · {f.count} ครั้ง</span>
              </div>
            ))}
          </div>
        )}

        {stats.recent.length > 0 && (
          <>
            <Eyebrow color={Z.muted} style={{ marginTop: 16, marginBottom: 7 }}>การให้ล่าสุด</Eyebrow>
            <div style={{ ...glass('light', true), borderRadius: 20, overflow: 'hidden' }}>
              {stats.recent.map((r, i) => (
                <div key={i} style={{
                  padding: '11px 15px', display: 'flex', justifyContent: 'space-between', gap: 8,
                  borderTop: i ? '1px solid rgba(13,59,46,0.07)' : 'none', fontSize: 12.5,
                }}>
                  <span style={{ color: Z.ink }}>🤲 {r.firstName || 'ผู้ให้ท่านหนึ่ง'} · {FLOW_TH[r.flow] || r.flow}</span>
                  <span style={{ color: Z.muted, whiteSpace: 'nowrap' }}>{thaiTimeAgo(r.at)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 16, fontSize: 11.5, color: Z.muted, textAlign: 'center', lineHeight: 1.55 }}>
          ✓ 100% ของเงินบริจาคถึงผู้รับ — Kaff อยู่ได้ด้วยความเมตตาจากผู้ใช้
        </div>
      </div>
    </>
  );
}

/**
 * One capsule in the pillar stack. In `stacked` mode the cards overlap by
 * 16px with ascending z-index, and the upward shadow makes each card look
 * tucked under the one below it.
 */
function PillarCard({ s, onClick, pressed, onPress, onRelease }: {
  s: ServiceDeckItem; onClick: () => void;
  pressed: boolean; onPress: () => void; onRelease: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onPress} onMouseLeave={onRelease}
      onTouchStart={onPress} onTouchEnd={onRelease}
      style={{
        position: 'relative', display: 'block', width: '100%',
        background: s.bg, color: s.fg,
        borderRadius: 26,
        padding: '13px 16px 15px',
        textAlign: 'left',
        boxShadow: pressed
          ? '0 -8px 26px rgba(0,0,0,.20), 0 18px 34px rgba(0,0,0,.26)'
          : '0 -8px 26px rgba(0,0,0,.20)',
        transform: pressed ? 'translateY(-4px)' : 'none',
        transition: 'transform .12s ease-out, box-shadow .12s ease-out',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eyebrow color={s.accent}>{s.ribbon}</Eyebrow>
            {s.featured && s.featuredBadge && (
              <span style={{
                padding: '2px 8px', borderRadius: 999,
                background: s.accent, color: '#08231B',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
              }}>{s.featuredBadge}</span>
            )}
          </div>
          <div style={{
            marginTop: 5, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
            letterSpacing: '-0.005em', color: s.fg,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.hook}</div>
          {/* Ink-on-light fills (Zakat, Sadaqah) need a higher meta opacity
              than white-on-dark to hold the same apparent contrast. */}
          <div style={{
            marginTop: 3, fontSize: 11, lineHeight: 1.45, color: s.fg,
            opacity: s.fg === K.onDark ? 0.66 : 0.78,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.sub}</div>
        </div>

        {s.featured ? (
          <div style={{
            width: 38, height: 38, borderRadius: 999, flexShrink: 0,
            background: s.accent, color: '#08231B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .2s',
            transform: pressed ? 'translateX(2px)' : 'none',
          }}>
            <Icon name="arrowRight" size={18} strokeWidth={2.2} color="#08231B" />
          </div>
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 13, flexShrink: 0,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: s.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={s.icon} size={19} color={s.accent} strokeWidth={1.6} />
          </div>
        )}
      </div>
    </button>
  );
}

export function HomeScreen({ onService, tab, onTab, compulsoryWording = 'wajib', homeLayout = 'stacked' }: HomeScreenProps) {
  const { user, isSignedIn } = useUser();
  const [focused, setFocused] = useState<ServiceId | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [sheet, setSheet] = useState(false);
  const [myYtd, setMyYtd] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<StatsResponse>('/api/stats').then(setStats).catch(() => { /* hero falls back to the empty state */ });
  }, []);

  // Signed-in users see their own year-to-date giving in the hero; everyone
  // else sees the verified community total. Never a blended or invented figure.
  useEffect(() => {
    if (!isSignedIn) { setMyYtd(null); return; }
    apiFetch<{ items: unknown[]; ytd: number }>('/api/donations/mine')
      .then(d => setMyYtd(d.ytd))
      .catch(() => { /* falls back to the community total */ });
  }, [isSignedIn]);

  const deck = SERVICE_DECK.map(s => {
    if (s.id !== 'compulsory') return s;
    const w = COMPULSORY_WORDINGS[compulsoryWording] || COMPULSORY_WORDINGS.wajib;
    return { ...s, ribbon: w.ribbon, hook: w.hook };
  });

  const personal = myYtd !== null;
  const heroAmount = personal ? myYtd : (stats?.totals.amount ?? 0);
  const heroLabel = personal ? `ให้แล้วปี ${hijriYear()}` : 'ชุมชน Kaff ส่งถึงผู้รับแล้ว';
  const name = user?.firstName || user?.username || '';
  const latest = stats?.recent[0];

  const glassBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 13,
    ...glass('dark'),
    color: K.onDark,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: G.home,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Two lime glows over the vertical gradient — the home frame's signature. */}
      <div style={{ position: 'absolute', inset: 0, background: G.homeGlowA, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: G.homeGlowB, pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', inset: 0, bottom: 84,
        overflowY: 'auto', overflowX: 'hidden',
        padding: '56px 18px 22px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Header — avatar tile, greeting, two glass actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 15, flexShrink: 0,
            ...glass('dark', true),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: K.lime, fontSize: 18, fontWeight: 700,
          }}>
            {name ? name.charAt(0).toUpperCase() : <KaffMark size={28} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: K.onDarkFaint, lineHeight: 1.3 }}>อัสสลามุอะลัยกุม</div>
            <div style={{
              fontSize: 16, fontWeight: 600, color: K.onDark, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{name || 'ยินดีต้อนรับ'}</div>
          </div>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button style={{
                height: 38, padding: '0 15px', borderRadius: 999,
                ...glass('dark', true), color: K.lime,
                fontSize: 12.5, fontWeight: 700, letterSpacing: '0.02em',
              }}>เข้าสู่ระบบ</button>
            </SignInButton>
          ) : (
            <button onClick={() => onTab('profile')} style={glassBtn} aria-label="โปรไฟล์">
              <Icon name="profile" size={19} />
            </button>
          )}
          <button onClick={() => onTab('faq')} style={glassBtn} aria-label="คำถามที่พบบ่อย">
            <Icon name="faq" size={19} />
          </button>
        </div>

        {/* Hero — giving total for the current Hijri year. With nothing
            verified yet a "฿0" would read as a failure, so the zero state
            leads with the invitation instead of the number. */}
        <div style={{
          marginTop: 30, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 11,
        }}>
          {heroAmount > 0 ? (
            <>
              <button
                onClick={() => stats && setSheet(true)}
                style={{
                  height: 30, padding: '0 13px', borderRadius: 999,
                  ...glass('dark'), color: K.onDarkSoft,
                  fontSize: 12, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
              >
                {heroLabel}
                <Icon name="chevDown" size={13} />
              </button>
              <Amount value={heroAmount} size={52} color={K.onDark} />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4px 10px 2px' }}>
              <div style={{
                fontSize: 30, fontWeight: 700, lineHeight: 1.26,
                letterSpacing: '-0.02em', color: K.onDark, textWrap: 'balance',
              } as React.CSSProperties}>
                {personal ? 'เริ่มการให้ของคุณ' : 'เป็นมือที่พร้อมให้'}
              </div>
              <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.6, color: K.onDarkSoft }}>
                {personal
                  ? `ปี ${hijriYear()} นี้ยังไม่มีรายการ — เลือกบริการด้านล่างเพื่อเริ่ม`
                  : 'ริบา · ซะกาต · ศ่อดะเกาะฮ์ · วาญิบ · กุรบาน ในที่เดียว'}
              </div>
            </div>
          )}

          <div style={{
            height: 32, padding: '0 12px 0 6px', borderRadius: 999,
            ...glass('dark'), color: K.onDark,
            fontSize: 12, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 999, flexShrink: 0,
              background: K.lime, color: '#123322',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="check" size={11} strokeWidth={3} /></span>
            100% ถึงผู้รับ · ตรวจสอบได้
          </div>
        </div>

        {/* The 5-pillar stack */}
        <div style={{ marginTop: 28, paddingBottom: 4 }}>
          {deck.map((s, i) => (
            <div key={s.id} style={{
              position: 'relative',
              zIndex: i + 1,
              marginTop: homeLayout === 'flat' ? (i ? 12 : 0) : (i ? -16 : 0),
            }}>
              <PillarCard
                s={s}
                onClick={() => onService(s.id)}
                pressed={focused === s.id}
                onPress={() => setFocused(s.id)}
                onRelease={() => setFocused(null)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* White sheet — latest giving + tab bar with the give FAB */}
      <BottomNav tab={tab} onTab={onTab} onFab={() => onService('sadaqah')}>
        {latest && (
          <button
            onClick={() => setSheet(true)}
            style={{
              width: '100%', textAlign: 'left', marginBottom: 8,
              padding: '8px 10px', borderRadius: 14,
              background: 'rgba(13,59,46,0.05)',
              display: 'flex', alignItems: 'center', gap: 9,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: 999, background: Z.sage, flexShrink: 0,
              boxShadow: `0 0 0 3px ${Z.sageSoft}`,
            }} />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 11.5, color: Z.muted,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              ล่าสุด <b style={{ color: Z.forest }}>{latest.firstName || 'ผู้ให้ท่านหนึ่ง'}</b> {FLOW_TH[latest.flow] || latest.flow} · {thaiTimeAgo(latest.at)}
            </span>
            <Icon name="chevUp" size={13} color={Z.muted} />
          </button>
        )}
      </BottomNav>

      {sheet && stats && <TransparencySheet stats={stats} onClose={() => setSheet(false)} />}
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
      <div style={{ width: '100%', height: '100%', background: G.paperGreen, position: 'relative' }}>
        <ForestHeader onBack={onBack} title="ประวัติการบริจาค" compact />
        {/* Skeleton mirrors the loaded layout: YTD block, then rows. */}
        <div style={{ padding: '20px 16px 40px' }}>
          <div style={{ ...glass('light', true), borderRadius: 22, padding: 18 }}>
            <Skeleton width="42%" height={11} />
            <Skeleton width="66%" height={34} line={false} style={{ marginTop: 10 }} />
          </div>
          <div style={{ ...glass('light', true), borderRadius: 22, marginTop: 22, overflow: 'hidden' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderTop: i ? '1px solid rgba(13,59,46,0.07)' : 'none',
              }}>
                <Skeleton width={40} height={40} line={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Skeleton width="58%" height={12} />
                  <Skeleton width="38%" height={10} style={{ marginTop: 7 }} />
                </div>
                <Skeleton width={62} height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ width: '100%', height: '100%', background: G.paperGreen, position: 'relative' }}>
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
      <div style={{ width: '100%', height: '100%', background: G.paperGreen, position: 'relative' }}>
        <ForestHeader onBack={onBack} title="ประวัติการบริจาค" compact />
        <div style={{ padding: 40, color: '#c0392b', fontSize: 13 }}>โหลดไม่สำเร็จ: {err}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: G.paperGreen, overflowY: 'auto', position: 'relative' }}>
      <ForestHeader onBack={onBack} title="ประวัติการบริจาค" sub="ทุกอย่างเป็นความลับ · ดาวน์โหลดใบเสร็จได้ทุกเมื่อ" compact />
      <div style={{ padding: '20px 16px 40px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.72)', borderRadius: 22, padding: 18,
          border: `1px solid rgba(255,255,255,0.9)`,
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
          <div style={{ padding: '18px 4px' }}>
            <EmptyState
              icon={<Icon name="plant" size={32} strokeWidth={1.8} color={Z.forest} />}
              title="ยังไม่มีรายการ"
              body="เมื่อคุณให้ครั้งแรก รายการและใบเสร็จจะมาอยู่ที่นี่ ดาวน์โหลดได้ทุกเมื่อ"
              primary={{ label: 'เริ่มให้ครั้งแรก', onClick: onBack }}
            />
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.72)', borderRadius: 20, border: `1px solid rgba(255,255,255,0.9)` }}>
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
      <div style={{ width: '100%', height: '100%', background: G.paperGreen, position: 'relative' }}>
        <ForestHeader compact>
          <div style={{ marginTop: 14, fontSize: 26, fontWeight: 700, color: Z.forest, letterSpacing: '-0.015em' }}>ยินดีต้อนรับ</div>
          <div style={{ fontSize: 13.5, color: Z.muted, marginTop: 6, lineHeight: 1.55 }}>
            เข้าสู่ระบบเพื่อเก็บประวัติการบริจาคและใบเสร็จออนไลน์
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

  // V1: only rows that actually do something. Unbuilt items (follow orgs,
  // privacy prefs, tax-receipt PDF, language) are hidden until implemented
  // so the menu has no dead taps. Re-add them as they ship.
  const rows = [
    { label: 'ประวัติการบริจาค', sub: 'ดูรายการ + ใบเสร็จย้อนหลัง', onClick: onHistory },
    { label: 'ออกจากระบบ', sub: '', onClick: () => signOut() },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: G.paperGreen, overflowY: 'auto', position: 'relative' }}>
      <ForestHeader compact>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 22, flexShrink: 0,
            background: G.darkCTA, color: K.lime,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700,
            boxShadow: '0 12px 26px rgba(13,59,46,0.22)',
          }}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 700, color: Z.forest, letterSpacing: '-0.015em' }}>{name}</div>
            <div style={{ fontSize: 13, color: Z.muted, marginTop: 2 }}>สมาชิก Kaff{memberSince ? ` · ตั้งแต่ ${memberSince}` : ''}</div>
          </div>
        </div>
      </ForestHeader>

      <div style={{ padding: '20px 16px 120px' }}>
        <button
          onClick={onHistory}
          style={{
            width: '100%', textAlign: 'left',
            background: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 16,
            border: `1px solid rgba(255,255,255,0.9)`,
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
          padding: 16, background: 'rgba(255,255,255,0.72)', borderRadius: 20, border: `1px solid rgba(255,255,255,0.9)`,
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

        <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.72)', borderRadius: 20, border: `1px solid rgba(255,255,255,0.9)` }}>
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

        <div style={{
          marginTop: 20, marginBottom: 80, textAlign: 'center',
          fontSize: 11, color: Z.muted, letterSpacing: '0.04em',
        }}>
          Kaff · {DISPLAY_VERSION}
        </div>
      </div>

      <BottomNav tab={tab} onTab={onTab} />
    </div>
  );
}
