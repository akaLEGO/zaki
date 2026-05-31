import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AZ, AIcon, ABtn, KPI, Pill, ACard, Field, TextInput, TextArea, Toggle, Drawer,
  PBar, fmtTHB, fmtNumber, pct,
} from './AdminUI';
import type { IconName, PillColor } from './AdminUI';
import type {
  Org, Campaign as CampaignT, OrgIcon, AsnafId, Recipient,
  KaffarahType, QurbanLocation, QurbanOption,
  Partner, DonationFlow, DonationStatus, DonationEvent,
} from '../shared/types';
import { useData } from '../lib/data-context';
import { apiFetch } from '../lib/api';

type ScreenId =
  | 'dashboard' | 'campaigns' | 'orgs' | 'rates'
  | 'partners' | 'transactions' | 'shariah' | 'settings';

function Th({ children }: { children: ReactNode }) {
  return <th style={{
    padding: '10px 16px', textAlign: 'left',
    fontSize: 11, color: AZ.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  }}>{children}</th>;
}
function Td({ children }: { children?: ReactNode }) {
  return <td style={{ padding: '12px 16px', fontSize: 13, color: AZ.ink, verticalAlign: 'middle' }}>{children}</td>;
}

function BigChart({ values }: { values: number[] }) {
  const W = 980, H = 140, PAD = 16;
  const max = Math.max(...values);
  const min = 0;
  const range = max - min;
  const xStep = (W - PAD * 2) / (values.length - 1);
  const pts = values.map((v, i) => [PAD + i * xStep, H - PAD - ((v - min) / range) * (H - PAD * 2)] as const);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`;
  const days = ['4 พ.ค.','5','6','7','8','9','10','11','12','13','14','15','16','17 พ.ค.'];
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" height="auto" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={AZ.sage} stopOpacity="0.22" />
          <stop offset="100%" stopColor={AZ.sage} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1={PAD} y1={H - PAD - g * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - g * (H - PAD * 2)} stroke={AZ.line} strokeDasharray="3,4" />
      ))}
      <path d={area} fill="url(#grad)" />
      <path d={path} stroke={AZ.forest} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 0} fill={AZ.gold} />
      ))}
      <g transform={`translate(${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]})`}>
        <rect x="6" y="-22" width="78" height="22" rx="6" fill={AZ.forest} />
        <text x="45" y="-7" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Inter">฿612k วันนี้</text>
      </g>
      {days.map((d, i) => (
        <text key={i} x={PAD + i * xStep} y={H + 16}
          textAnchor="middle" fill={AZ.muted} fontSize="10" fontFamily="Sarabun">{d}</text>
      ))}
    </svg>
  );
}

export function AdminDashboard({ onNav }: { onNav: (s: ScreenId) => void }) {
  const { campaigns: CAMPAIGNS } = useData();
  const today = '17 พ.ค. 2569 · พฤหัสบดี';

  type ActivityKind = 'donate' | 'edit' | 'approve' | 'rate';
  type Tone = 'gold' | 'sage' | 'forest';
  const activity: { t: string; who: string; kind: ActivityKind; detail: string; tone: Tone }[] = [
    { t: '09:42', who: 'คุณกัสมา W.', kind: 'donate', detail: 'Riba ฿350 → มูลนิธิรามาธิบดี', tone: 'forest' },
    { t: '09:38', who: 'คุณอนัส S.',  kind: 'donate', detail: 'Qurban ฿1,400 → บังกลาเทศ', tone: 'gold' },
    { t: '09:21', who: 'คุณนูร์ A.',  kind: 'donate', detail: 'Sadaqah ฿120 → เลี้ยงละศีลอด 2 มื้อ', tone: 'sage' },
    { t: '09:08', who: 'admin · เนตร', kind: 'edit',   detail: 'แก้ราคา Fitrah → ฿32/คน', tone: 'forest' },
    { t: '08:51', who: 'shariah · อ.ฮัมซะห์', kind: 'approve', detail: 'อนุมัติแคมเปญ "น้ำสะอาด โรฮิงญา"', tone: 'sage' },
    { t: '08:24', who: 'system', kind: 'rate', detail: 'ราคาทอง 24K +0.6% → Nisab ฿196,700', tone: 'forest' },
    { t: '08:02', who: 'คุณยูซุฟ M.', kind: 'donate', detail: 'Zakat ฿2,140 → ครอบครัวอามีนะห์', tone: 'sage' },
  ];

  const shariahQueue = [
    { title: 'แคมเปญ "ค่าไฟมัสยิดบ้านท่าด่าน"', who: 'ส่ง 14 พ.ค.', state: 'pending' },
    { title: 'แก้ Niyyah Kaffarah', who: 'ส่ง 13 พ.ค.', state: 'pending' },
    { title: 'เพิ่มผู้รับ Asnaf "ครอบครัวฮัสซัน"', who: 'ส่ง 12 พ.ค.', state: 'pending' },
  ];

  const slipsPending = [
    { ref: 'KF-748231', amount: 1500, time: '09:34', method: 'Bank Transfer' },
    { ref: 'KF-748229', amount: 350, time: '09:18', method: 'Bank Transfer' },
    { ref: 'KF-748212', amount: 12000, time: '08:51', method: 'USDC' },
  ];

  const lowCampaigns = CAMPAIGNS
    .map(c => ({ ...c, p: pct(c.raised, c.target) }))
    .sort((a, b) => a.p - b.p);

  const spark = [120, 180, 165, 200, 240, 280, 320, 300, 380, 410, 450, 520, 480, 612];

  const kindIcon = (k: ActivityKind): IconName =>
    k === 'donate' ? 'money' : k === 'edit' ? 'edit' : k === 'approve' ? 'check' : 'rates';

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>DASHBOARD · {today}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>
            สลาม Kaff — วันนี้ระบบทำงานราบรื่น
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ABtn kind="ghost" icon="download">Export</ABtn>
          <ABtn kind="ghost" icon="refresh">Refresh</ABtn>
          <ABtn kind="primary" icon="plus" onClick={() => onNav('campaigns')}>สร้างแคมเปญ</ABtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="ยอดบริจาควันนี้" value={fmtTHB(48720)} trend="+24%" sub="vs เมื่อวาน" icon="money" accent={AZ.forest} />
        <KPI label="ธุรกรรม" value="612" trend="+18%" sub="ครั้งวันนี้" icon="riba" accent={AZ.gold} />
        <KPI label="Campaigns active" value="12" trend="+2" sub="open ตอนนี้" icon="campaign" accent={AZ.sage} />
        <KPI label="ต้องตรวจสอบ" value="6" trend="" sub="สลิป + ชะรีอะฮ์ queue" icon="bell" accent={AZ.warn} />
      </div>

      <div style={{ marginTop: 14 }}>
        <ACard title="ยอดบริจาค 14 วันที่ผ่านมา (฿k)" action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Pill color="sage">+312% MoM</Pill>
            <ABtn kind="subtle" size="sm">รายเดือน</ABtn>
            <ABtn kind="subtle" size="sm">รายปี</ABtn>
          </div>
        }>
          <BigChart values={spark} />
        </ACard>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <ACard title="Activity ล่าสุด" padding={0}>
          <div>
            {activity.map((a, i) => (
              <div key={i} style={{
                padding: '12px 18px',
                borderTop: i ? `1px solid ${AZ.line}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: a.tone === 'gold' ? AZ.goldSoft : a.tone === 'sage' ? AZ.sageSoft : 'rgba(13,59,46,0.06)',
                  color: a.tone === 'gold' ? '#7a5e10' : a.tone === 'sage' ? '#0a6e44' : AZ.forest,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AIcon name={kindIcon(a.kind)} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: AZ.ink, fontWeight: 600 }}>{a.detail}</div>
                  <div style={{ fontSize: 11.5, color: AZ.muted, marginTop: 1 }}>{a.who} · {a.t}</div>
                </div>
                <button style={{ color: AZ.muted, padding: 4 }}><AIcon name="eye" size={15} /></button>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 18px', textAlign: 'center', borderTop: `1px solid ${AZ.line}` }}>
            <button style={{ fontSize: 12.5, color: AZ.forest, fontWeight: 600, padding: 6 }}>ดูทั้งหมด · 247 รายการวันนี้ →</button>
          </div>
        </ACard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ACard title="Shariah Review Queue" padding={0} action={<Pill color="warn">{shariahQueue.length} pending</Pill>}>
            {shariahQueue.map((q, i) => (
              <div key={i} style={{
                padding: '12px 18px',
                borderTop: i ? `1px solid ${AZ.line}` : 'none',
              }}>
                <div style={{ fontSize: 13, color: AZ.ink, fontWeight: 600 }}>{q.title}</div>
                <div style={{ fontSize: 11.5, color: AZ.muted, marginTop: 2 }}>{q.who}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <ABtn kind="primary" size="sm" icon="check">อนุมัติ</ABtn>
                  <ABtn kind="ghost" size="sm">comment</ABtn>
                </div>
              </div>
            ))}
          </ACard>

          <ACard title="สลิปรอตรวจสอบ" padding={0} action={<Pill color="danger">{slipsPending.length}</Pill>}>
            {slipsPending.map((s, i) => (
              <div key={i} style={{
                padding: '12px 18px',
                borderTop: i ? `1px solid ${AZ.line}` : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: AZ.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.ref}</div>
                  <div style={{ fontSize: 11.5, color: AZ.muted, marginTop: 1 }}>{s.method} · {s.time}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: AZ.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtTHB(s.amount)}</div>
                <ABtn kind="ghost" size="sm">ดู</ABtn>
              </div>
            ))}
          </ACard>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ACard
          title="Campaigns ที่ต้องผลักดัน (ใกล้หมดเวลา / progress ต่ำ)"
          action={<ABtn kind="ghost" size="sm" icon="arrow" onClick={() => onNav('campaigns')}>จัดการทั้งหมด</ABtn>}
          padding={0}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: AZ.surface }}>
                <Th>แคมเปญ</Th>
                <Th>ประเภท</Th>
                <Th>Progress</Th>
                <Th>ยอดระดม</Th>
                <Th>สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {lowCampaigns.map(c => (
                <tr key={c.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 18 }}>{c.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: AZ.ink }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>{c.tag}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{c.featured ? <Pill color="gold">FEATURED</Pill> : <Pill color="grey">Standard</Pill>}</Td>
                  <Td><div style={{ minWidth: 130 }}><PBar value={c.p} color={c.p < 30 ? '#D7A03B' : AZ.sage} /></div></Td>
                  <Td><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtTHB(c.raised)}</span> <span style={{ color: AZ.muted, fontSize: 11 }}>/ {fmtTHB(c.target)}</span></Td>
                  <Td>{c.p < 30 ? <Pill color="warn">ต้องผลักดัน</Pill> : <Pill color="sage">on track</Pill>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ACard>
      </div>
    </div>
  );
}

type CampaignStatus = 'draft' | 'live' | 'live-featured' | 'archived';
type ShariahStatus = 'approved' | 'pending';

interface CampaignRow extends CampaignT {
  status: CampaignStatus;
  shariah: ShariahStatus;
  updatedAt: string;
}

export function AdminCampaigns() {
  const { campaigns, refresh } = useData();
  const items = campaigns as unknown as CampaignRow[];
  const [drawer, setDrawer] = useState<string | null>(null);
  const [draft, setDraft] = useState<CampaignRow | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | CampaignStatus>('all');

  const openEdit = (id: string) => {
    const c = items.find(x => x.id === id);
    if (!c) return;
    setDraft({ ...c });
    setDrawer(id);
  };
  const openNew = () => {
    setDraft({
      id: '', tag: '', emoji: '🌟',
      title: '', sub: '',
      raised: 0, target: 100000, unit: 'บาท',
      color: AZ.forest,
      pitch: '',
      status: 'draft', shariah: 'pending', updatedAt: 'วันนี้',
    });
    setDrawer('new');
  };
  const save = async () => {
    if (!draft) return;
    try {
      if (drawer === 'new') {
        const id = draft.id || ('c-' + Math.random().toString(36).slice(2, 7));
        await apiFetch('/api/campaigns', { method: 'POST', body: JSON.stringify({ ...draft, id }) });
      } else {
        await apiFetch(`/api/campaigns/${drawer}`, { method: 'PATCH', body: JSON.stringify(draft) });
      }
      await refresh();
      setDrawer(null);
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + e);
    }
  };
  const remove = async () => {
    if (!draft || !drawer || drawer === 'new') return;
    if (!confirm('ลบแคมเปญ ' + draft.title + '?')) return;
    try {
      await apiFetch(`/api/campaigns/${drawer}`, { method: 'DELETE' });
      await refresh();
      setDrawer(null);
    } catch (e) {
      alert('ลบไม่สำเร็จ: ' + e);
    }
  };

  const filtered = items.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (q && !(c.title.includes(q) || c.tag.toLowerCase().includes(q.toLowerCase()) || (c.id || '').includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>CATALOG</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Campaign Manager</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>จัดการแคมเปญ Sadaqah · {items.length} แคมเปญทั้งหมด · {items.filter(c => c.status.startsWith('live')).length} ใช้งาน</div>
        </div>
        <ABtn kind="primary" icon="plus" size="lg" onClick={openNew}>สร้างแคมเปญ</ABtn>
      </div>

      <div style={{
        background: '#fff', borderRadius: 12, padding: 10,
        border: `1px solid ${AZ.line}`,
        display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14,
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: AZ.surface, borderRadius: 8, padding: '0 12px',
        }}>
          <AIcon name="search" size={16} color={AZ.muted} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหา title, tag, id"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', height: 36, fontSize: 13.5, color: AZ.ink }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, background: AZ.surface, padding: 4, borderRadius: 8 }}>
          {([
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'live', label: 'Live' },
            { id: 'live-featured', label: 'Featured' },
            { id: 'draft', label: 'Draft' },
            { id: 'archived', label: 'Archived' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 600,
              color: filter === f.id ? '#fff' : AZ.muted,
              background: filter === f.id ? AZ.forest : 'transparent',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <ACard padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: AZ.surface }}>
              <Th>แคมเปญ</Th>
              <Th>สถานะ</Th>
              <Th>Shariah</Th>
              <Th>Progress</Th>
              <Th>ยอดระดม / เป้า</Th>
              <Th>อัปเดต</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const p = pct(c.raised, c.target);
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${AZ.line}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = AZ.rowHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: c.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20,
                      }}>{c.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: AZ.ink }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>#{c.id} · {c.tag}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {c.status === 'live-featured' ? <Pill color="gold">FEATURED</Pill> :
                     c.status === 'live' ? <Pill color="sage">Live</Pill> :
                     c.status === 'draft' ? <Pill color="grey">Draft</Pill> :
                     <Pill color="grey">Archived</Pill>}
                  </Td>
                  <Td>{c.shariah === 'approved' ? <Pill color="sage">✓ approved</Pill> : <Pill color="warn">pending</Pill>}</Td>
                  <Td><div style={{ minWidth: 110 }}><PBar value={p} color={p > 80 ? AZ.gold : AZ.sage} /></div></Td>
                  <Td>
                    <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtNumber(c.raised)} <span style={{ color: AZ.muted, fontWeight: 400 }}>/ {fmtNumber(c.target)}</span></div>
                    <div style={{ fontSize: 11, color: AZ.muted }}>{c.unit} · {p}%</div>
                  </Td>
                  <Td><span style={{ fontSize: 12, color: AZ.muted }}>{c.updatedAt}</span></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <ABtn kind="ghost" size="sm" icon="edit" onClick={() => openEdit(c.id)}>แก้</ABtn>
                      <button style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: AZ.surface, color: AZ.muted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><AIcon name="eye" size={15} /></button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ไม่พบแคมเปญที่ตรงกับเงื่อนไข</div></Td></tr>
            )}
          </tbody>
        </table>
      </ACard>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer === 'new' ? 'สร้างแคมเปญใหม่' : `แก้ไข: ${draft?.title}`}
        width={520}
        footer={
          <>
            {drawer !== 'new' && <ABtn kind="danger" icon="trash" onClick={remove}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setDrawer(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={save}>บันทึก</ABtn>
          </>
        }
      >
        {draft && <CampaignForm draft={draft} setDraft={setDraft} />}
      </Drawer>
    </div>
  );
}

function CampaignForm({ draft, setDraft }: { draft: CampaignRow; setDraft: (c: CampaignRow) => void }) {
  const u = <K extends keyof CampaignRow>(k: K, v: CampaignRow[K]) => setDraft({ ...draft, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 12 }}>
        <Field label="Emoji">
          <input value={draft.emoji} onChange={e => u('emoji', e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 10px', textAlign: 'center', fontSize: 22, border: `1px solid ${AZ.line}`, borderRadius: 10, background: '#fff' }}
          />
        </Field>
        <Field label="Tag (uppercase, สั้น)" hint="แสดงเป็น chip บนการ์ด เช่น IFTAR, WATER">
          <TextInput value={draft.tag} onChange={v => u('tag', String(v).toUpperCase())} placeholder="IFTAR" />
        </Field>
      </div>

      <Field label="ชื่อแคมเปญ (Thai)">
        <TextInput value={draft.title} onChange={v => u('title', String(v))} placeholder="เลี้ยงอาหารละศีลอด" />
      </Field>

      <Field label="คำอธิบายสั้น (1 บรรทัด)">
        <TextInput value={draft.sub} onChange={v => u('sub', String(v))} placeholder="ร่วมกับร้านอาหารฮาลาลในไทย" />
      </Field>

      <Field label="รายละเอียดเต็ม (pitch)" hint="แสดงในหน้าแคมเปญและในใบเสร็จ">
        <TextArea value={draft.pitch} onChange={v => u('pitch', v)} rows={4} placeholder="ทำงานร่วมกับร้านอาหารฮาลาล 12 ร้าน..." />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="ยอดระดมปัจจุบัน"><TextInput type="number" value={draft.raised} onChange={v => u('raised', Number(v))} /></Field>
        <Field label="เป้าหมาย"><TextInput type="number" value={draft.target} onChange={v => u('target', Number(v))} /></Field>
        <Field label="หน่วย"><TextInput value={draft.unit} onChange={v => u('unit', String(v))} placeholder="บาท · มื้อ" /></Field>
      </div>

      <Field label="ราคาต่อหน่วย (ถ้ามี)" hint="เช่น 60 = ฿60/มื้อ สำหรับ stepper">
        <TextInput type="number" value={draft.perUnit ?? ''} onChange={v => u('perUnit', Number(v))} placeholder="60" />
      </Field>

      <Field label="สีพื้นการ์ด (hex)">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: draft.color, border: `1px solid ${AZ.line}` }} />
          <input value={draft.color} onChange={e => u('color', e.target.value)}
            style={{ flex: 1, height: 38, padding: '0 12px', border: `1px solid ${AZ.line}`, borderRadius: 10, background: '#fff', fontFamily: 'Geist Mono, monospace', fontSize: 13 }}
          />
        </div>
      </Field>

      <Field label="สถานะ">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            { id: 'draft', label: 'Draft' },
            { id: 'live', label: 'Live' },
            { id: 'live-featured', label: 'Featured (hero slot)' },
            { id: 'archived', label: 'Archived' },
          ] as const).map(s => (
            <button key={s.id} onClick={() => u('status', s.id)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: draft.status === s.id ? AZ.forest : '#fff',
              color: draft.status === s.id ? '#fff' : AZ.forest,
              border: `1px solid ${draft.status === s.id ? AZ.forest : AZ.line}`,
              fontSize: 12.5, fontWeight: 600,
            }}>{s.label}</button>
          ))}
        </div>
      </Field>

      <div style={{
        padding: 12, background: AZ.surface, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: AZ.ink }}>Shariah review</div>
          <div style={{ fontSize: 11, color: AZ.muted, marginTop: 2 }}>ต้องผ่าน committee ก่อนเปิด live</div>
        </div>
        <Pill color={draft.shariah === 'approved' ? 'sage' : 'warn'}>
          {draft.shariah === 'approved' ? '✓ approved' : 'pending review'}
        </Pill>
      </div>
    </div>
  );
}

export function AdminOrgs() {
  const { orgs, recipients, qurbanLocations } = useData();
  const [tab, setTab] = useState<'orgs' | 'recipients' | 'qurban'>('orgs');
  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>CATALOG</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Orgs &amp; Recipients</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>องค์กรปลายทาง Riba, ผู้รับ 8 Asnaf, พื้นที่แจก Qurban</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: `1px solid ${AZ.line}`, marginBottom: 14, width: 'fit-content' }}>
        {([
          { id: 'orgs', label: 'Riba Orgs', count: orgs.length },
          { id: 'recipients', label: '8 Asnaf Recipients', count: Object.values(recipients).flat().length },
          { id: 'qurban', label: 'Qurban Locations', count: qurbanLocations.length },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 7,
            background: tab === t.id ? AZ.forest : 'transparent',
            color: tab === t.id ? '#fff' : AZ.muted,
            fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            <span style={{
              padding: '2px 7px', borderRadius: 999,
              background: tab === t.id ? 'rgba(255,255,255,0.15)' : AZ.surface,
              color: tab === t.id ? '#fff' : AZ.muted,
              fontSize: 11, fontWeight: 700,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'orgs' && <OrgsTable />}
      {tab === 'recipients' && <RecipientsTable />}
      {tab === 'qurban' && <QurbanTable />}
    </div>
  );
}

function OrgsTable() {
  const { orgs: list, refresh } = useData();
  const [drawer, setDrawer] = useState<string | null>(null);
  const [draft, setDraft] = useState<Org | null>(null);
  const types: Record<OrgIcon, string> = {
    hospital: 'โรงพยาบาล',
    road: 'ถนน/สาธารณูปโภค',
    toilet: 'สุขอนามัย',
    community: 'กองทุนชุมชน',
  };

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <ABtn kind="primary" icon="plus" onClick={() => {
          setDraft({ id: '', icon: 'community', name: '', goal: '', raised: 0, target: 0, pitch: '', hot: false });
          setDrawer('new');
        }}>เพิ่มองค์กร</ABtn>
      </div>
      <ACard padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: AZ.surface }}>
              <Th>องค์กร</Th><Th>ประเภท</Th><Th>เป้าหมายปัจจุบัน</Th>
              <Th>Progress</Th><Th>ระดมได้/เป้า</Th><Th>Hot</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.map(o => {
              const p = pct(o.raised, o.target);
              return (
                <tr key={o.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: AZ.sageSoft, color: AZ.forest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AIcon name={o.icon} size={18} color={AZ.forest} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: AZ.ink }}>{o.name}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>#{o.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{types[o.icon] || 'อื่นๆ'}</Td>
                  <Td><span style={{ fontStyle: 'italic', color: AZ.ink }}>{o.goal}</span></Td>
                  <Td><div style={{ minWidth: 110 }}><PBar value={p} color={p > 80 ? AZ.gold : AZ.sage} /></div></Td>
                  <Td>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtNumber(o.raised)}</span>
                    <span style={{ color: AZ.muted, fontSize: 11 }}> / {fmtNumber(o.target)} ฿</span>
                  </Td>
                  <Td>{o.hot ? <Pill color="gold">🔥 ใกล้สำเร็จ</Pill> : <span style={{ color: AZ.mutedLite }}>—</span>}</Td>
                  <Td>
                    <ABtn kind="ghost" size="sm" icon="edit" onClick={() => { setDraft({ ...o }); setDrawer(o.id); }}>แก้</ABtn>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ACard>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer === 'new' ? 'เพิ่มองค์กร' : `แก้ไของค์กร: ${draft?.name}`}
        footer={
          <>
            {drawer !== 'new' && <ABtn kind="danger" icon="trash" onClick={async () => {
              if (!confirm('ลบองค์กร?')) return;
              try {
                await apiFetch(`/api/orgs/${drawer}`, { method: 'DELETE' });
                await refresh();
                setDrawer(null);
              } catch (e) { alert('ลบไม่สำเร็จ: ' + e); }
            }}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setDrawer(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={async () => {
              if (!draft) return;
              try {
                if (drawer === 'new') {
                  const id = draft.id || 'o-' + Math.random().toString(36).slice(2, 7);
                  await apiFetch('/api/orgs', { method: 'POST', body: JSON.stringify({ ...draft, id }) });
                } else {
                  await apiFetch(`/api/orgs/${drawer}`, { method: 'PATCH', body: JSON.stringify(draft) });
                }
                await refresh();
                setDrawer(null);
              } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e); }
            }}>บันทึก</ABtn>
          </>
        }
      >
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="ชื่อองค์กร"><TextInput value={draft.name} onChange={v => setDraft({ ...draft, name: String(v) })} placeholder="มูลนิธิ..." /></Field>
            <Field label="เป้าหมาย / Goal"><TextInput value={draft.goal} onChange={v => setDraft({ ...draft, goal: String(v) })} placeholder="ซ่อมถนนเข้าหมู่บ้าน..." /></Field>
            <Field label="ประเภท (icon)">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['hospital', 'road', 'toilet', 'community'] as OrgIcon[]).map(k => (
                  <button key={k} onClick={() => setDraft({ ...draft, icon: k })} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: draft.icon === k ? AZ.forest : '#fff',
                    color: draft.icon === k ? '#fff' : AZ.forest,
                    border: `1px solid ${draft.icon === k ? AZ.forest : AZ.line}`,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12.5, fontWeight: 600,
                  }}>
                    <AIcon name={k} size={15} /> {types[k]}
                  </button>
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="ระดมได้แล้ว (฿)"><TextInput type="number" value={draft.raised} onChange={v => setDraft({ ...draft, raised: Number(v) })} /></Field>
              <Field label="เป้าหมาย (฿)"><TextInput type="number" value={draft.target} onChange={v => setDraft({ ...draft, target: Number(v) })} /></Field>
            </div>
            <Field label="Pitch (รายละเอียดเต็ม)"><TextArea value={draft.pitch} onChange={v => setDraft({ ...draft, pitch: v })} rows={3} /></Field>
            <Toggle value={draft.hot} onChange={v => setDraft({ ...draft, hot: v })} label="🔥 Mark ใกล้สำเร็จ (แสดงแบนเนอร์สีทอง)" />
          </div>
        )}
      </Drawer>
    </>
  );
}

const chipBtn = (active: boolean) => ({
  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  color: active ? '#fff' : AZ.muted,
  background: active ? AZ.forest : 'transparent',
  whiteSpace: 'nowrap' as const,
});

interface RecipientDraft {
  id?: number;
  asnaf: AsnafId;
  name: string;
  received: number;
  area: string;
  fair: string;
}

function RecipientsTable() {
  const { asnaf: ASNAF, recipients, refresh } = useData();
  const list: (Recipient & { asnaf: AsnafId; id: number })[] = [];
  for (const [asnafId, rs] of Object.entries(recipients)) {
    if (!rs) continue;
    for (const r of rs) list.push({ ...(r as Recipient & { id: number }), asnaf: asnafId as AsnafId });
  }
  const [filter, setFilter] = useState<'all' | AsnafId>('all');
  const filtered = filter === 'all' ? list : list.filter(r => r.asnaf === filter);

  const [draft, setDraft] = useState<RecipientDraft | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openNew = () => {
    setMode('new');
    setErr(null);
    setDraft({ asnaf: 'poor', name: '', received: 0, area: '', fair: '' });
  };
  const openEdit = (r: Recipient & { asnaf: AsnafId; id: number }) => {
    setMode('edit');
    setErr(null);
    setDraft({ id: r.id, asnaf: r.asnaf, name: r.name, received: r.received, area: r.area || '', fair: r.fair || '' });
  };
  const save = async () => {
    if (!draft) return;
    setBusy(true); setErr(null);
    try {
      const body = JSON.stringify({
        asnaf: draft.asnaf, name: draft.name, received: draft.received,
        area: draft.area, fair: draft.fair,
      });
      if (mode === 'new') {
        await apiFetch('/api/recipients', { method: 'POST', body });
      } else if (draft.id != null) {
        await apiFetch(`/api/recipients/${draft.id}`, { method: 'PATCH', body });
      }
      await refresh();
      setDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!draft?.id) return;
    if (!confirm('ลบผู้รับ "' + draft.name + '"?')) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/recipients/${draft.id}`, { method: 'DELETE' });
      await refresh();
      setDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: `1px solid ${AZ.line}` }}>
          <button onClick={() => setFilter('all')} style={chipBtn(filter === 'all')}>ทั้งหมด</button>
          {ASNAF.map(a => (
            <button key={a.id} onClick={() => setFilter(a.id)} style={chipBtn(filter === a.id)}>{a.label}</button>
          ))}
        </div>
        <ABtn kind="primary" icon="plus" onClick={openNew}>เพิ่มผู้รับ</ABtn>
      </div>
      <ACard padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: AZ.surface }}>
              <Th>ผู้รับ</Th><Th>กลุ่ม Asnaf</Th><Th>พื้นที่</Th><Th>ได้รับเดือนนี้</Th><Th>Fairness</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const a = ASNAF.find(x => x.id === r.asnaf);
              return (
                <tr key={r.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 999, background: AZ.sageSoft, color: AZ.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                        {r.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: AZ.ink }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>#{r.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Pill color="forest">{a?.label || r.asnaf}</Pill></Td>
                  <Td>{r.area}</Td>
                  <Td><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtTHB(r.received)}</span></Td>
                  <Td>{r.fair ? <Pill color="gold">{r.fair}</Pill> : <span style={{ color: AZ.mutedLite, fontSize: 12 }}>—</span>}</Td>
                  <Td><ABtn kind="ghost" size="sm" icon="edit" onClick={() => openEdit(r)}>แก้</ABtn></Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ไม่มีผู้รับในกลุ่มนี้</div></Td></tr>
            )}
          </tbody>
        </table>
      </ACard>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={mode === 'new' ? 'เพิ่มผู้รับ' : `แก้ไข: ${draft?.name}`}
        footer={
          <>
            {mode === 'edit' && <ABtn kind="danger" icon="trash" onClick={remove} disabled={busy}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setDraft(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={save} disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </ABtn>
          </>
        }
      >
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {err && (
              <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>{err}</div>
            )}
            <Field label="ชื่อ / ครอบครัว">
              <TextInput value={draft.name} onChange={v => setDraft({ ...draft, name: String(v) })} placeholder="ครอบครัวอาดัม (4 คน)" />
            </Field>
            <Field label="กลุ่ม Asnaf">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ASNAF.map(a => (
                  <button key={a.id} onClick={() => setDraft({ ...draft, asnaf: a.id })} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: draft.asnaf === a.id ? AZ.forest : '#fff',
                    color: draft.asnaf === a.id ? '#fff' : AZ.forest,
                    border: `1px solid ${draft.asnaf === a.id ? AZ.forest : AZ.line}`,
                    fontSize: 12, fontWeight: 600,
                  }}>{a.label}</button>
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="พื้นที่"><TextInput value={draft.area} onChange={v => setDraft({ ...draft, area: String(v) })} placeholder="ยะลา" /></Field>
              <Field label="ได้รับแล้ว (฿)"><TextInput type="number" value={draft.received} onChange={v => setDraft({ ...draft, received: Number(v) })} /></Field>
            </div>
            <Field label="Fairness note (option)" hint="เช่น แนะนำให้กระจาย">
              <TextInput value={draft.fair} onChange={v => setDraft({ ...draft, fair: String(v) })} placeholder="แนะนำให้กระจาย" />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}

interface QurbanLocDraft {
  id: string;
  flag: string;
  name: string;
  impact: string;
  isNew: boolean;
}

interface QurbanOptDraft {
  id?: number;
  country: string;
  flag: string;
  price: number;
  currency: string;
  sub: string;
  animal: string;
  popular: boolean;
  special: boolean;
  isNew: boolean;
}

function QurbanTable() {
  const { qurbanOptions: QURBAN_OPTIONS, qurbanLocations: QURBAN_LOCATIONS, refresh } = useData();

  const [locDraft, setLocDraft] = useState<QurbanLocDraft | null>(null);
  const [optDraft, setOptDraft] = useState<QurbanOptDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ── location handlers ──
  const openNewLoc = () => {
    setErr(null);
    setLocDraft({ id: '', flag: '🌍', name: '', impact: '', isNew: true });
  };
  const openEditLoc = (l: QurbanLocation) => {
    setErr(null);
    setLocDraft({ id: l.id, flag: l.flag, name: l.name, impact: l.impact, isNew: false });
  };
  const saveLoc = async () => {
    if (!locDraft) return;
    setBusy(true); setErr(null);
    try {
      if (locDraft.isNew) {
        await apiFetch('/api/qurban-locations', {
          method: 'POST',
          body: JSON.stringify({ id: locDraft.id, flag: locDraft.flag, name: locDraft.name, impact: locDraft.impact }),
        });
      } else {
        await apiFetch(`/api/qurban-locations/${locDraft.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ flag: locDraft.flag, name: locDraft.name, impact: locDraft.impact }),
        });
      }
      await refresh();
      setLocDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };
  const removeLoc = async () => {
    if (!locDraft || locDraft.isNew) return;
    if (!confirm('ลบพื้นที่ "' + locDraft.name + '"?')) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/qurban-locations/${locDraft.id}`, { method: 'DELETE' });
      await refresh();
      setLocDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  // ── option (price) handlers ──
  const openNewOpt = () => {
    setErr(null);
    setOptDraft({
      country: '', flag: '🌍', price: 0, currency: '฿',
      sub: '', animal: 'แพะ 1 ตัว', popular: false, special: false, isNew: true,
    });
  };
  const openEditOpt = (q: QurbanOption) => {
    setErr(null);
    setOptDraft({
      id: q.id, country: q.country, flag: q.flag, price: q.price,
      currency: q.currency, sub: q.sub || '', animal: q.animal,
      popular: !!q.popular, special: !!q.special, isNew: false,
    });
  };
  const saveOpt = async () => {
    if (!optDraft) return;
    setBusy(true); setErr(null);
    try {
      const body = JSON.stringify({
        country: optDraft.country, flag: optDraft.flag, price: optDraft.price,
        currency: optDraft.currency, sub: optDraft.sub, animal: optDraft.animal,
        popular: optDraft.popular, special: optDraft.special,
      });
      if (optDraft.isNew) {
        await apiFetch('/api/qurban-options', { method: 'POST', body });
      } else if (optDraft.id != null) {
        await apiFetch(`/api/qurban-options/${optDraft.id}`, { method: 'PATCH', body });
      }
      await refresh();
      setOptDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };
  const removeOpt = async () => {
    if (!optDraft?.id) return;
    if (!confirm('ลบราคา "' + optDraft.country + '"?')) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/qurban-options/${optDraft.id}`, { method: 'DELETE' });
      await refresh();
      setOptDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: AZ.muted, alignSelf: 'center' }}>
          ราคาตามประเทศ + พื้นที่แจกจ่ายเนื้อกุรบ่าน
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ABtn kind="ghost" icon="plus" onClick={openNewOpt}>เพิ่มประเทศ</ABtn>
          <ABtn kind="primary" icon="plus" onClick={openNewLoc}>เพิ่มพื้นที่</ABtn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <ACard title="ราคากุรบ่าน (ตามประเทศ)" padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: AZ.surface }}>
                <Th>ประเทศ</Th><Th>ราคา</Th><Th>คำอธิบาย</Th><Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {QURBAN_OPTIONS.map(q => (
                <tr key={q.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{q.flag}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{q.country}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>{q.animal}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{q.currency}{fmtNumber(q.price)}</span></Td>
                  <Td><span style={{ fontSize: 12, color: AZ.muted }}>{q.sub}</span></Td>
                  <Td><ABtn kind="ghost" size="sm" icon="edit" onClick={() => openEditOpt(q)}>แก้</ABtn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ACard>
        <ACard title="พื้นที่แจกจ่าย" padding={0}>
          {QURBAN_LOCATIONS.map((l, i) => (
            <div key={l.id} style={{
              padding: '12px 16px',
              borderTop: i ? `1px solid ${AZ.line}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{l.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: AZ.ink }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: AZ.muted, marginTop: 1 }}>{l.impact}</div>
              </div>
              <ABtn kind="ghost" size="sm" icon="edit" onClick={() => openEditLoc(l)}>แก้</ABtn>
            </div>
          ))}
        </ACard>
      </div>

      <Drawer
        open={!!locDraft}
        onClose={() => setLocDraft(null)}
        title={locDraft?.isNew ? 'เพิ่มพื้นที่แจกจ่าย' : `แก้พื้นที่: ${locDraft?.name}`}
        footer={
          <>
            {locDraft && !locDraft.isNew && <ABtn kind="danger" icon="trash" onClick={removeLoc} disabled={busy}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setLocDraft(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={saveLoc} disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </ABtn>
          </>
        }
      >
        {locDraft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {err && (
              <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>{err}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12 }}>
              <Field label="ธง">
                <input value={locDraft.flag} onChange={e => setLocDraft({ ...locDraft, flag: e.target.value })}
                  style={{ width: '100%', height: 38, padding: '0 10px', textAlign: 'center', fontSize: 22, border: `1px solid ${AZ.line}`, borderRadius: 10, background: '#fff' }}
                />
              </Field>
              <Field label="ID (slug)" hint={locDraft.isNew ? 'a-z, 0-9, -' : 'แก้ไขไม่ได้'}>
                <input value={locDraft.id} disabled={!locDraft.isNew}
                  onChange={e => setLocDraft({ ...locDraft, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${AZ.line}`, borderRadius: 10, background: locDraft.isNew ? '#fff' : AZ.surface, fontFamily: 'Geist Mono, monospace', fontSize: 13, color: AZ.ink }}
                />
              </Field>
              <Field label="ชื่อพื้นที่"><TextInput value={locDraft.name} onChange={v => setLocDraft({ ...locDraft, name: String(v) })} placeholder="บังกลาเทศ" /></Field>
            </div>
            <Field label="Impact (1 บรรทัด)">
              <TextArea value={locDraft.impact} onChange={v => setLocDraft({ ...locDraft, impact: v })} rows={2} placeholder="ราคาประหยัด · เนื้อแจกใน 4 เขตห่างไกล" />
            </Field>
          </div>
        )}
      </Drawer>

      <Drawer
        open={!!optDraft}
        onClose={() => setOptDraft(null)}
        title={optDraft?.isNew ? 'เพิ่มราคาประเทศ' : `แก้ราคา: ${optDraft?.country}`}
        footer={
          <>
            {optDraft && !optDraft.isNew && <ABtn kind="danger" icon="trash" onClick={removeOpt} disabled={busy}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setOptDraft(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={saveOpt} disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </ABtn>
          </>
        }
      >
        {optDraft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {err && (
              <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>{err}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
              <Field label="ธง">
                <input value={optDraft.flag} onChange={e => setOptDraft({ ...optDraft, flag: e.target.value })}
                  style={{ width: '100%', height: 38, padding: '0 10px', textAlign: 'center', fontSize: 22, border: `1px solid ${AZ.line}`, borderRadius: 10, background: '#fff' }}
                />
              </Field>
              <Field label="ประเทศ"><TextInput value={optDraft.country} onChange={v => setOptDraft({ ...optDraft, country: String(v) })} placeholder="บังกลาเทศ" /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
              <Field label="ราคา"><TextInput type="number" value={optDraft.price} onChange={v => setOptDraft({ ...optDraft, price: Number(v) })} /></Field>
              <Field label="หน่วยเงิน"><TextInput value={optDraft.currency} onChange={v => setOptDraft({ ...optDraft, currency: String(v) })} placeholder="฿" /></Field>
            </div>
            <Field label="ประเภทสัตว์" hint="ใช้แยก list ฝั่ง consumer ตอน toggle แพะ/วัว">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['แพะ 1 ตัว', 'วัว 1 ส่วน'] as const).map(a => {
                  const on = optDraft.animal === a;
                  return (
                    <button key={a} onClick={() => setOptDraft({ ...optDraft, animal: a })} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10,
                      background: on ? AZ.forest : '#fff',
                      color: on ? '#fff' : AZ.forest,
                      border: `1.5px solid ${on ? AZ.forest : AZ.line}`,
                      fontSize: 13, fontWeight: 600,
                    }}>{a}</button>
                  );
                })}
              </div>
            </Field>
            <Field label="คำอธิบายสั้น"><TextInput value={optDraft.sub} onChange={v => setOptDraft({ ...optDraft, sub: String(v) })} placeholder="ราคาประหยัด" /></Field>
            <div style={{ display: 'flex', gap: 16, padding: 12, background: AZ.surface, borderRadius: 10 }}>
              <Toggle value={optDraft.popular} onChange={v => setOptDraft({ ...optDraft, popular: v })} label="⭐ Popular" />
              <Toggle value={optDraft.special} onChange={v => setOptDraft({ ...optDraft, special: v })} label="✨ Special (pinned)" />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── Transactions ───────────────────────────────────────────────────────────

type DonationMethod = 'qr' | 'bank' | 'usdc';

interface DonationRow {
  id: number;
  ref: string;
  userId: string | null;
  flow: DonationFlow;
  amount: number;
  feeAmount: number;
  destination: string | null;
  payMethod: DonationMethod | null;
  status: DonationStatus;
  niyyah: string | null;
  partnerId: string | null;
  partnerRef: string | null;
  donorFirstName: string | null;
  donorLastName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  donorLineId: string | null;
  isTest: boolean;
  hasSlip?: boolean;
  createdAt: string;
}

const STATUS_LABEL: Record<DonationStatus, string> = {
  pending: 'pending',
  paid: 'paid',
  awaiting_partner: 'awaiting partner',
  partner_confirmed: 'partner confirmed',
  completed: 'completed',
  partner_rejected: 'partner rejected',
  refunded: 'refunded',
  failed: 'failed',
};

const STATUS_PILL: Record<DonationStatus, PillColor> = {
  pending: 'grey',
  paid: 'forest',
  awaiting_partner: 'warn',
  partner_confirmed: 'gold',
  completed: 'sage',
  partner_rejected: 'danger',
  refunded: 'grey',
  failed: 'danger',
};

const FLOW_LABEL: Record<DonationFlow, string> = {
  riba: 'Riba', zakat: 'Zakat', fitrah: 'Fitrah', fidyah: 'Fidyah',
  kaffarah: 'Kaffarah', qurban: 'Qurban', sadaqah: 'Sadaqah',
};

const FLOW_ICON: Record<DonationFlow, IconName> = {
  riba: 'riba', zakat: 'zakat', fitrah: 'moon', fidyah: 'book',
  kaffarah: 'book', qurban: 'qurban', sadaqah: 'sadaqah',
};

export function AdminTransactions() {
  const [rows, setRows] = useState<DonationRow[] | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [flow, setFlow] = useState<'all' | DonationFlow>('all');
  const [status, setStatus] = useState<'all' | DonationStatus>('all');
  const [mode, setMode] = useState<'real' | 'test' | 'all'>('real');
  const [openId, setOpenId] = useState<number | null>(null);

  const load = async () => {
    try {
      setErr(null);
      const [donations, ps] = await Promise.all([
        apiFetch<DonationRow[]>('/api/donations'),
        apiFetch<Partner[]>('/api/partners'),
      ]);
      setRows(donations);
      setPartners(ps);
    } catch (e) { setErr(String(e)); }
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => (rows || []).filter(r => {
    if (mode === 'real' && r.isTest) return false;
    if (mode === 'test' && !r.isTest) return false;
    if (flow !== 'all' && r.flow !== flow) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (q && !r.ref.toLowerCase().includes(q.toLowerCase()) &&
        !(r.destination || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, mode, flow, status, q]);

  const testCount = (rows || []).filter(r => r.isTest).length;
  const realCount = (rows || []).filter(r => !r.isTest).length;

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
  const totalFee = filtered.reduce((s, r) => s + r.feeAmount, 0);
  const todayCount = filtered.length;

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>OPERATIONS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Transactions</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>
            {rows ? `${rows.length} รายการล่าสุด · แสดง ${filtered.length} หลังกรอง` : 'กำลังโหลด…'}
          </div>
        </div>
        <ABtn kind="ghost" icon="refresh" onClick={load}>รีเฟรช</ABtn>
      </div>

      {err && (
        <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
        <KPI label="ยอดรวม" value={fmtTHB(totalAmount)} sub={`${todayCount} ธุรกรรม`} icon="money" accent={AZ.forest} />
        <KPI label="Amil Fee" value={fmtTHB(totalFee)} sub="5% สำหรับ flows ที่ไม่ใช่ Riba" icon="sparkle" accent={AZ.gold} />
        <KPI label="Net to Org" value={fmtTHB(totalAmount - totalFee)} sub="หลังหัก Amil fee" icon="riba" accent={AZ.sage} />
      </div>

      <div style={{
        background: '#fff', borderRadius: 12, padding: 10,
        border: `1px solid ${AZ.line}`,
        display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8,
          background: AZ.surface, borderRadius: 8, padding: '0 12px',
        }}>
          <AIcon name="search" size={16} color={AZ.muted} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหา ref หรือปลายทาง"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', height: 36, fontSize: 13.5, color: AZ.ink }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, background: AZ.surface, padding: 4, borderRadius: 8 }}>
          {([
            { id: 'real' as const, label: 'จริง', count: realCount },
            { id: 'test' as const, label: 'ทดสอบ', count: testCount },
            { id: 'all'  as const, label: 'ทั้งหมด', count: rows?.length ?? 0 },
          ]).map(m => {
            const on = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                color: on ? '#fff' : AZ.muted,
                background: on ? (m.id === 'test' ? AZ.danger : AZ.forest) : 'transparent',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                {m.label}
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 999,
                  background: on ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)',
                }}>{m.count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, background: AZ.surface, padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
          {(['all','riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah'] as const).map(f => (
            <button key={f} onClick={() => setFlow(f)} style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              color: flow === f ? '#fff' : AZ.muted,
              background: flow === f ? AZ.forest : 'transparent',
            }}>{f === 'all' ? 'ทุก flow' : FLOW_LABEL[f]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, background: AZ.surface, padding: 4, borderRadius: 8, flexWrap: 'wrap' }}>
          {(['all','paid','awaiting_partner','partner_confirmed','completed','partner_rejected','refunded','failed'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              color: status === s ? '#fff' : AZ.muted,
              background: status === s ? AZ.forest : 'transparent',
            }}>{s === 'all' ? 'ทุก status' : STATUS_LABEL[s]}</button>
          ))}
        </div>
      </div>

      <ACard padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: AZ.surface }}>
              <Th>Ref</Th><Th>Flow</Th><Th>Amount</Th><Th>Fee</Th>
              <Th>Method</Th><Th>Status</Th><Th>Partner</Th><Th>เวลา</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const partner = r.partnerId ? partners.find(p => p.id === r.partnerId) : null;
              return (
                <tr key={r.id} onClick={() => setOpenId(r.id)} style={{
                  borderTop: `1px solid ${AZ.line}`, cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = AZ.rowHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'Geist Mono, monospace' }}>{r.ref}</div>
                      {r.isTest && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: AZ.danger, color: '#fff',
                          fontWeight: 800, letterSpacing: '0.05em',
                        }}>TEST</span>
                      )}
                    </div>
                    {r.userId && <div style={{ fontSize: 10.5, color: AZ.mutedLite }}>{r.userId.slice(0, 14)}…</div>}
                  </Td>
                  <Td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <AIcon name={FLOW_ICON[r.flow]} size={14} color={AZ.forest} />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{FLOW_LABEL[r.flow]}</span>
                    </div>
                  </Td>
                  <Td><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmtTHB(r.amount)}</span></Td>
                  <Td>{r.feeAmount > 0
                    ? <span style={{ fontVariantNumeric: 'tabular-nums', color: AZ.gold, fontWeight: 600 }}>{fmtTHB(r.feeAmount)}</span>
                    : <span style={{ color: AZ.mutedLite }}>—</span>}</Td>
                  <Td>{r.payMethod ? <Pill color="grey">{r.payMethod.toUpperCase()}</Pill> : <span style={{ color: AZ.mutedLite }}>—</span>}</Td>
                  <Td><Pill color={STATUS_PILL[r.status]}>{STATUS_LABEL[r.status]}</Pill></Td>
                  <Td>{partner
                    ? <span style={{ fontSize: 12.5, fontWeight: 600, color: AZ.forest }}>{partner.name}</span>
                    : <span style={{ color: AZ.mutedLite }}>—</span>}</Td>
                  <Td><span style={{ fontSize: 11.5, color: AZ.muted, whiteSpace: 'nowrap' }}>{r.createdAt}</span></Td>
                </tr>
              );
            })}
            {rows && filtered.length === 0 && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ไม่พบธุรกรรม</div></Td></tr>
            )}
            {!rows && !err && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>กำลังโหลด…</div></Td></tr>
            )}
          </tbody>
        </table>
      </ACard>

      <TransactionDrawer
        id={openId}
        partners={partners}
        onClose={() => setOpenId(null)}
        onChange={() => { void load(); }}
      />
    </div>
  );
}

interface DonationDetail extends DonationRow {
  partnerNote: string | null;
  partnerNotifiedAt: string | null;
  partnerConfirmedAt: string | null;
  customerConfirmedAt: string | null;
  refundedAt: string | null;
  refundRef: string | null;
  slipImage: string | null;
  slipUploadedAt: string | null;
}

function TransactionDrawer({ id, partners, onClose, onChange }: {
  id: number | null;
  partners: Partner[];
  onClose: () => void;
  onChange: () => void;
}) {
  const [detail, setDetail] = useState<{ donation: DonationDetail; events: DonationEvent[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [partnerPick, setPartnerPick] = useState<string>('');
  const [partnerRef, setPartnerRef] = useState('');
  const [refundRef, setRefundRef] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (id == null) { setDetail(null); return; }
    setDetail(null); setErr(null);
    setPartnerPick(''); setPartnerRef(''); setRefundRef(''); setNote('');
    void (async () => {
      try {
        const d = await apiFetch<{ donation: DonationDetail; events: DonationEvent[] }>(`/api/donations/${id}`);
        setDetail(d);
        setPartnerPick(d.donation.partnerId || '');
        setPartnerRef(d.donation.partnerRef || '');
      } catch (e) { setErr(String(e)); }
    })();
  }, [id]);

  const transition = async (to: DonationStatus, extra: Record<string, unknown> = {}) => {
    if (!detail) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/donations/${detail.donation.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ to, note: note || undefined, ...extra }),
      });
      const d = await apiFetch<{ donation: DonationDetail; events: DonationEvent[] }>(`/api/donations/${detail.donation.id}`);
      setDetail(d);
      setNote('');
      onChange();
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  const donation = detail?.donation;
  const availablePartners = partners.filter(p => p.active && (donation ? p.flows.includes(donation.flow) : true));

  return (
    <Drawer
      open={id != null}
      onClose={onClose}
      title={donation ? `${donation.ref} · ${FLOW_LABEL[donation.flow]} ${fmtTHB(donation.amount)}` : 'Loading…'}
      width={560}
      footer={
        <>
          <div style={{ flex: 1 }} />
          <ABtn kind="ghost" onClick={onClose}>ปิด</ABtn>
        </>
      }
    >
      {err && (
        <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '8px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 12 }}>{err}</div>
      )}
      {donation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ACard padding={14}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div><span style={{ color: AZ.muted }}>Status: </span><Pill color={STATUS_PILL[donation.status]}>{STATUS_LABEL[donation.status]}</Pill></div>
              <div><span style={{ color: AZ.muted }}>Method: </span>{donation.payMethod?.toUpperCase() || '—'}</div>
              <div><span style={{ color: AZ.muted }}>User: </span><span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>{donation.userId || 'anon'}</span></div>
              <div><span style={{ color: AZ.muted }}>Fee: </span>{donation.feeAmount ? fmtTHB(donation.feeAmount) : '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: AZ.muted }}>ปลายทาง: </span>{donation.destination || '—'}</div>
              {donation.niyyah && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: AZ.muted }}>เนียต: </span>{donation.niyyah}</div>}
              {donation.partnerId && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: AZ.muted }}>Partner: </span>
                  <strong>{partners.find(p => p.id === donation.partnerId)?.name || donation.partnerId}</strong>
                  {donation.partnerRef && <span style={{ color: AZ.muted }}> · ref {donation.partnerRef}</span>}
                </div>
              )}
              {donation.refundRef && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: AZ.muted }}>Refund ref: </span><span style={{ fontFamily: 'Geist Mono, monospace' }}>{donation.refundRef}</span>
                </div>
              )}
            </div>
          </ACard>

          {(donation.donorFirstName || donation.donorEmail || donation.donorPhone) && (
            <ACard title="ข้อมูลผู้บริจาค" padding={14}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: AZ.muted }}>ชื่อ: </span>
                  <strong>{donation.donorFirstName || '—'} {donation.donorLastName || ''}</strong>
                </div>
                {donation.donorEmail && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: AZ.muted }}>Email: </span>
                    <a href={`mailto:${donation.donorEmail}`} style={{ color: AZ.forest, textDecoration: 'underline' }}>{donation.donorEmail}</a>
                  </div>
                )}
                {donation.donorPhone && (
                  <div>
                    <span style={{ color: AZ.muted }}>โทร: </span>
                    <a href={`tel:${donation.donorPhone}`} style={{ color: AZ.forest, textDecoration: 'underline', fontVariantNumeric: 'tabular-nums' }}>{donation.donorPhone}</a>
                  </div>
                )}
                {donation.donorLineId && (
                  <div>
                    <span style={{ color: AZ.muted }}>LINE: </span>
                    <span style={{ fontFamily: 'Geist Mono, monospace' }}>{donation.donorLineId}</span>
                  </div>
                )}
              </div>
            </ACard>
          )}

          {donation.slipImage && (
            <ACard title="สลิปการโอน" padding={12}>
              <a href={donation.slipImage} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img
                  src={donation.slipImage}
                  alt="สลิปการโอน"
                  style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 420, objectFit: 'contain', background: '#f3f3f3' }}
                />
              </a>
              {donation.slipUploadedAt && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: AZ.muted }}>
                  แนบเมื่อ {donation.slipUploadedAt} · แตะรูปเพื่อดูเต็ม
                </div>
              )}
            </ACard>
          )}

          <div>
            <div style={{ fontSize: 11, color: AZ.muted, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>WORKFLOW</div>
            {donation.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12.5, color: AZ.muted, lineHeight: 1.5, marginBottom: 2 }}>
                  {donation.slipImage
                    ? 'ตรวจสอบสลิปด้านบนให้ตรงกับยอด แล้วอนุมัติ'
                    : 'ไม่มีสลิปแนบ — ตรวจ statement ธนาคารก่อนอนุมัติ'}
                </div>
                <ABtn kind="primary" icon="check"
                  onClick={() => transition(donation.partnerId ? 'paid' : 'completed')}
                  disabled={busy}>
                  {donation.partnerId ? 'อนุมัติ → ส่งต่อ partner' : 'อนุมัติการชำระเงิน'}
                </ABtn>
                <ABtn kind="danger" icon="x" onClick={() => transition('failed')} disabled={busy}>
                  ปฏิเสธ (สลิปไม่ถูกต้อง)
                </ABtn>
              </div>
            )}
            {donation.status === 'paid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {availablePartners.length > 0 && (
                  <>
                    <Field label="Partner">
                      <select value={partnerPick} onChange={e => setPartnerPick(e.target.value)} style={{
                        width: '100%', height: 38, padding: '0 12px',
                        background: '#fff', border: `1px solid ${AZ.line}`, borderRadius: 10,
                        fontSize: 14, color: AZ.ink,
                      }}>
                        <option value="">— เลือก partner —</option>
                        {availablePartners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </Field>
                    <ABtn kind="primary" icon="arrow" onClick={() => transition('awaiting_partner', { partnerId: partnerPick })} disabled={busy || !partnerPick}>
                      ส่งให้ partner
                    </ABtn>
                  </>
                )}
                <ABtn kind="ghost" icon="check" onClick={() => transition('completed')} disabled={busy}>
                  Confirm to customer (ไม่ต้อง partner)
                </ABtn>
              </div>
            )}
            {donation.status === 'awaiting_partner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Partner ref (option)">
                  <TextInput value={partnerRef} onChange={v => setPartnerRef(String(v))} placeholder="UMM-2025-0042" />
                </Field>
                <ABtn kind="primary" icon="check" onClick={() => transition('partner_confirmed', { partnerRef: partnerRef || undefined })} disabled={busy}>
                  Mark partner confirmed
                </ABtn>
                <ABtn kind="danger" icon="x" onClick={() => transition('partner_rejected')} disabled={busy}>
                  Mark partner rejected
                </ABtn>
              </div>
            )}
            {donation.status === 'partner_confirmed' && (
              <ABtn kind="primary" icon="check" onClick={() => transition('completed')} disabled={busy}>
                Confirm to customer → completed
              </ABtn>
            )}
            {donation.status === 'partner_rejected' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Refund ref" hint="เลขอ้างอิงการโอนคืน">
                  <TextInput value={refundRef} onChange={v => setRefundRef(String(v))} placeholder="REF-2025-..." />
                </Field>
                <ABtn kind="primary" icon="arrow" onClick={() => transition('refunded', { refundRef })} disabled={busy || !refundRef}>
                  Refund customer → refunded
                </ABtn>
              </div>
            )}
            {(donation.status === 'completed' || donation.status === 'refunded' || donation.status === 'failed') && (
              <div style={{ padding: 12, background: AZ.surface, borderRadius: 10, fontSize: 12.5, color: AZ.muted }}>
                Donation อยู่ในสถานะปลายทางแล้ว — ไม่มีการเปลี่ยนแปลงเพิ่มเติม
              </div>
            )}
            {donation.status !== 'completed' && donation.status !== 'refunded' && donation.status !== 'failed' && (
              <div style={{ marginTop: 12 }}>
                <Field label="หมายเหตุ (เขียนลง event log)">
                  <TextArea value={note} onChange={setNote} rows={2} placeholder="optional context" />
                </Field>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 11, color: AZ.muted, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>TIMELINE</div>
            <div style={{ background: '#fff', border: `1px solid ${AZ.line}`, borderRadius: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${AZ.line}`, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: AZ.muted }}>Created</span>
                <span style={{ color: AZ.ink, fontWeight: 600 }}>{donation.createdAt}</span>
              </div>
              {detail!.events.map(e => (
                <div key={e.id} style={{ padding: '10px 14px', borderBottom: `1px solid ${AZ.line}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      {e.fromStatus && <Pill color="grey">{STATUS_LABEL[e.fromStatus]}</Pill>}
                      <AIcon name="arrow" size={12} color={AZ.muted} />
                      <Pill color={STATUS_PILL[e.toStatus]}>{STATUS_LABEL[e.toStatus]}</Pill>
                    </div>
                    <span style={{ fontSize: 11, color: AZ.muted, whiteSpace: 'nowrap' }}>{e.createdAt}</span>
                  </div>
                  <div style={{ fontSize: 11, color: AZ.mutedLite, marginTop: 4 }}>by {e.actor}</div>
                  {e.note && <div style={{ fontSize: 12, color: AZ.ink, marginTop: 4, padding: '6px 8px', background: AZ.surface, borderRadius: 6 }}>{e.note}</div>}
                </div>
              ))}
              {detail!.events.length === 0 && (
                <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: AZ.muted }}>ยังไม่มี event</div>
              )}
            </div>
          </div>
        </div>
      )}
      {id != null && !detail && !err && (
        <div style={{ padding: 32, textAlign: 'center', color: AZ.muted }}>กำลังโหลด…</div>
      )}
    </Drawer>
  );
}

// ─── Shariah Board ──────────────────────────────────────────────────────────

interface ShariahRow extends CampaignT {
  shariah: 'approved' | 'pending';
  status: 'draft' | 'live' | 'live-featured' | 'archived';
  updatedAt: string;
}

export function AdminShariah() {
  const { campaigns, refresh } = useData();
  const items = campaigns as unknown as ShariahRow[];
  const pending = items.filter(c => c.shariah === 'pending');
  const approved = items.filter(c => c.shariah === 'approved');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const approve = async (id: string) => {
    setBusy(id); setErr(null);
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ shariah: 'approved' }) });
      await refresh();
    } catch (e) { setErr(String(e)); }
    finally { setBusy(null); }
  };
  const revoke = async (id: string) => {
    if (!confirm('ถอนการอนุมัติ campaign นี้?')) return;
    setBusy(id); setErr(null);
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ shariah: 'pending' }) });
      await refresh();
    } catch (e) { setErr(String(e)); }
    finally { setBusy(null); }
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>OPERATIONS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Shariah Board</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>
            พิจารณาแคมเปญตามหลักชะรีอะฮ์ · {pending.length} pending · {approved.length} approved
          </div>
        </div>
        <ABtn kind="ghost" icon="refresh" onClick={() => void refresh()}>รีเฟรช</ABtn>
      </div>

      {err && (
        <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <ACard title={`รอพิจารณา (${pending.length})`} padding={0} action={<Pill color="warn">{pending.length} pending</Pill>}>
        {pending.length === 0 && (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: AZ.muted, fontSize: 13 }}>
            ไม่มีแคมเปญรอการพิจารณา · ทุกอย่างเป็นไปตามชะรีอะฮ์
          </div>
        )}
        {pending.map((c, i) => (
          <div key={c.id} style={{
            padding: '14px 18px', borderTop: i ? `1px solid ${AZ.line}` : 'none',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: AZ.ink }}>{c.title}</div>
              <div style={{ fontSize: 12, color: AZ.muted, marginTop: 2 }}>#{c.id} · {c.tag} · เป้า {fmtTHB(c.target)}</div>
              <div style={{ fontSize: 12.5, color: AZ.ink, marginTop: 6, lineHeight: 1.5 }}>{c.pitch || c.sub}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <ABtn kind="primary" size="sm" icon="check" onClick={() => approve(c.id)} disabled={busy === c.id}>
                {busy === c.id ? '...' : 'อนุมัติ'}
              </ABtn>
              <ABtn kind="ghost" size="sm">comment</ABtn>
            </div>
          </div>
        ))}
      </ACard>

      <div style={{ marginTop: 14 }}>
        <ACard title={`อนุมัติแล้ว (${approved.length})`} padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: AZ.surface }}>
                <Th>แคมเปญ</Th><Th>สถานะ</Th><Th>เป้า</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {approved.map(c => (
                <tr key={c.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 18 }}>{c.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: AZ.muted }}>#{c.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Pill color="sage">✓ approved</Pill></Td>
                  <Td><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtTHB(c.target)}</span></Td>
                  <Td>
                    <ABtn kind="ghost" size="sm" onClick={() => revoke(c.id)} disabled={busy === c.id}>ถอนอนุมัติ</ABtn>
                  </Td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr><Td><div style={{ padding: '24px 0', textAlign: 'center', color: AZ.muted }}>ยังไม่มี campaign ที่อนุมัติ</div></Td></tr>
              )}
            </tbody>
          </table>
        </ACard>
      </div>
    </div>
  );
}

// ─── Rates & Prices ─────────────────────────────────────────────────────────

const STATIC_RATES = [
  { label: 'ราคาทอง 24K (บาททอง)', value: '฿55,200', note: 'อัปเดต 17 พ.ค. 2569 · จาก ราคาทองคำสมาคมค้าทองคำ' },
  { label: 'Nisab (เกณฑ์ Zakat)', value: '฿196,700', note: '85g ทอง 24K · ต่ำกว่านี้ไม่ต้องจ่าย Zakat' },
  { label: 'Fitrah · ต่อคน', value: '฿32', note: 'เทียบราคาข้าวสาร 2.5 กก. ในไทย' },
  { label: 'Fidyah · ต่อวันที่ขาด', value: '฿30', note: 'อาหาร 1 มื้อ ให้ผู้ขัดสน' },
];

export function AdminRates() {
  const { kaffarahTypes, refresh } = useData();
  const [draft, setDraft] = useState<KaffarahType | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const open = (k: KaffarahType) => { setDraft({ ...k }); setErr(null); };
  const save = async () => {
    if (!draft) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/kaffarah-types/${draft.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: draft.label, amount: draft.amount, sub: draft.sub }),
      });
      await refresh();
      setDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>CATALOG</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Rates &amp; Prices</div>
        <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>
          ราคาและเกณฑ์ที่ใช้คำนวณในระบบ — Nisab, Fitrah, Fidyah, Kaffarah, Qurban
        </div>
      </div>

      <ACard title="เกณฑ์ปัจจุบัน (read-only · sync อัตโนมัติทุกวัน)" padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {STATIC_RATES.map((r, i) => (
            <div key={r.label} style={{
              padding: '14px 18px',
              borderTop: i >= 2 ? `1px solid ${AZ.line}` : 'none',
              borderRight: i % 2 === 0 ? `1px solid ${AZ.line}` : 'none',
            }}>
              <div style={{ fontSize: 11, color: AZ.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: AZ.ink, marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{r.value}</div>
              <div style={{ fontSize: 11.5, color: AZ.mutedLite, marginTop: 4 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </ACard>

      <div style={{ marginTop: 14 }}>
        <ACard title="Kaffarah · ราคาต่อกรณี" padding={0} action={<Pill color="forest">{kaffarahTypes.length} types</Pill>}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: AZ.surface }}>
                <Th>กรณี</Th><Th>คำอธิบาย</Th><Th>ราคา</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {kaffarahTypes.map(k => (
                <tr key={k.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: AZ.ink }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: AZ.muted }}>#{k.id}</div>
                  </Td>
                  <Td><span style={{ fontSize: 12.5, color: AZ.muted }}>{k.sub}</span></Td>
                  <Td><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtTHB(k.amount)}</span></Td>
                  <Td><ABtn kind="ghost" size="sm" icon="edit" onClick={() => open(k)}>แก้</ABtn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ACard>
      </div>

      <div style={{ marginTop: 14 }}>
        <ACard title="Qurban · ราคาตามประเทศ (จัดการในแท็บ Orgs & Recipients)" padding={0}>
          <QurbanPriceReadOnly />
        </ACard>
      </div>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft ? `แก้ราคา Kaffarah: ${draft.label}` : ''}
        footer={
          <>
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setDraft(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={save} disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </ABtn>
          </>
        }
      >
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {err && (
              <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>{err}</div>
            )}
            <Field label="ชื่อกรณี"><TextInput value={draft.label} onChange={v => setDraft({ ...draft, label: String(v) })} /></Field>
            <Field label="ราคา (฿)"><TextInput type="number" value={draft.amount} onChange={v => setDraft({ ...draft, amount: Number(v) })} /></Field>
            <Field label="คำอธิบาย"><TextArea value={draft.sub} onChange={v => setDraft({ ...draft, sub: v })} rows={2} /></Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function QurbanPriceReadOnly() {
  const { qurbanOptions } = useData();
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: AZ.surface }}>
          <Th>ประเทศ</Th><Th>ราคา</Th><Th>สัตว์</Th><Th>คำอธิบาย</Th>
        </tr>
      </thead>
      <tbody>
        {qurbanOptions.map((q, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${AZ.line}` }}>
            <Td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{q.flag}</span>
                <span style={{ fontWeight: 600 }}>{q.country}</span>
              </div>
            </Td>
            <Td><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{q.currency}{fmtNumber(q.price)}</span></Td>
            <Td><span style={{ fontSize: 12.5 }}>{q.animal}</span></Td>
            <Td><span style={{ fontSize: 12, color: AZ.muted }}>{q.sub}</span></Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Roles & Audit ──────────────────────────────────────────────────────────

interface AdminUserRow {
  userId: string;
  email: string | null;
  role: 'admin' | 'super';
  createdAt: string;
}

interface AuditRow {
  id: number;
  userId: string | null;
  action: string;
  resourceId: string | null;
  payload: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AdminAudit() {
  const [tab, setTab] = useState<'users' | 'log'>('users');
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [logs, setLogs] = useState<AuditRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  const load = async () => {
    setErr(null);
    try {
      const [u, l] = await Promise.all([
        apiFetch<AdminUserRow[]>('/api/admin-users'),
        apiFetch<AuditRow[]>('/api/audit-log?limit=200'),
      ]);
      setUsers(u); setLogs(l);
    } catch (e) { setErr(String(e)); }
  };
  useEffect(() => { void load(); }, []);

  const filteredLogs = (logs || []).filter(r =>
    !actionFilter || r.action.toLowerCase().includes(actionFilter.toLowerCase())
  );

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>SETTINGS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Roles &amp; Audit</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>
            สิทธิ์ผู้ดูแลและบันทึกการกระทำของ admin ทุกครั้ง · ดูเฉพาะ
          </div>
        </div>
        <ABtn kind="ghost" icon="refresh" onClick={load}>รีเฟรช</ABtn>
      </div>

      {err && (
        <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: `1px solid ${AZ.line}`, marginBottom: 14, width: 'fit-content' }}>
        {([
          { id: 'users', label: 'Admin Users', count: users?.length ?? 0 },
          { id: 'log', label: 'Audit Log', count: logs?.length ?? 0 },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 7,
            background: tab === t.id ? AZ.forest : 'transparent',
            color: tab === t.id ? '#fff' : AZ.muted,
            fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            <span style={{
              padding: '2px 7px', borderRadius: 999,
              background: tab === t.id ? 'rgba(255,255,255,0.15)' : AZ.surface,
              color: tab === t.id ? '#fff' : AZ.muted,
              fontSize: 11, fontWeight: 700,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <ACard padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: AZ.surface }}>
                <Th>User ID</Th><Th>Email</Th><Th>Role</Th><Th>เพิ่มเมื่อ</Th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.userId} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td><span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{u.userId}</span></Td>
                  <Td>{u.email || <span style={{ color: AZ.mutedLite }}>—</span>}</Td>
                  <Td>{u.role === 'super' ? <Pill color="gold">super</Pill> : <Pill color="forest">admin</Pill>}</Td>
                  <Td><span style={{ fontSize: 12, color: AZ.muted }}>{u.createdAt}</span></Td>
                </tr>
              ))}
              {!users && !err && (
                <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>กำลังโหลด…</div></Td></tr>
              )}
              {users && users.length === 0 && (
                <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ยังไม่มีผู้ดูแล</div></Td></tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${AZ.line}`, fontSize: 12, color: AZ.muted, background: AZ.surface }}>
            เพิ่ม/ลบ admin ผ่าน SQL บน Neon เท่านั้น (ดู <code>db/002_security.sql</code>) — เพื่อความปลอดภัย ยังไม่เปิดให้สร้างผ่านหน้าเว็บ
          </div>
        </ACard>
      )}

      {tab === 'log' && (
        <>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 10, border: `1px solid ${AZ.line}`,
            display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14,
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: AZ.surface, borderRadius: 8, padding: '0 12px',
            }}>
              <AIcon name="search" size={16} color={AZ.muted} />
              <input value={actionFilter} onChange={e => setActionFilter(e.target.value)}
                placeholder="กรอง action เช่น campaigns.update, donations.create"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', height: 36, fontSize: 13.5, color: AZ.ink }}
              />
            </div>
          </div>
          <ACard padding={0}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: AZ.surface }}>
                  <Th>เวลา</Th><Th>User</Th><Th>Action</Th><Th>Resource</Th><Th>IP</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                    <Td><span style={{ fontSize: 11.5, color: AZ.muted, whiteSpace: 'nowrap' }}>{r.createdAt}</span></Td>
                    <Td>
                      {r.userId
                        ? <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11.5 }}>{r.userId.slice(0, 18)}…</span>
                        : <span style={{ color: AZ.mutedLite }}>anon</span>}
                    </Td>
                    <Td><Pill color={r.action.endsWith('.delete') ? 'danger' : r.action.endsWith('.create') ? 'sage' : 'forest'}>{r.action}</Pill></Td>
                    <Td>
                      {r.resourceId
                        ? <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>{r.resourceId}</span>
                        : <span style={{ color: AZ.mutedLite }}>—</span>}
                    </Td>
                    <Td><span style={{ fontSize: 11.5, color: AZ.muted, fontFamily: 'Geist Mono, monospace' }}>{r.ip || '—'}</span></Td>
                  </tr>
                ))}
                {logs && filteredLogs.length === 0 && (
                  <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ไม่พบ log</div></Td></tr>
                )}
                {!logs && !err && (
                  <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>กำลังโหลด…</div></Td></tr>
                )}
              </tbody>
            </table>
          </ACard>
        </>
      )}
    </div>
  );
}

// ─── Partners ────────────────────────────────────────────────────────────────

const ALL_FLOWS: DonationFlow[] = ['riba','zakat','fitrah','fidyah','kaffarah','qurban','sadaqah'];

interface PartnerDraft {
  id: string;
  name: string;
  contactEmail: string;
  contactLine: string;
  webhookUrl: string;
  flows: DonationFlow[];
  active: boolean;
  notes: string;
  isNew: boolean;
}

export function AdminPartners() {
  const [rows, setRows] = useState<Partner[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartnerDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setErr(null);
      const r = await apiFetch<Partner[]>('/api/partners');
      setRows(r);
    } catch (e) { setErr(String(e)); }
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => setDraft({
    id: '', name: '', contactEmail: '', contactLine: '', webhookUrl: '',
    flows: [], active: true, notes: '', isNew: true,
  });
  const openEdit = (p: Partner) => setDraft({
    id: p.id, name: p.name,
    contactEmail: p.contactEmail || '', contactLine: p.contactLine || '',
    webhookUrl: p.webhookUrl || '',
    flows: p.flows, active: p.active, notes: p.notes || '', isNew: false,
  });
  const save = async () => {
    if (!draft) return;
    setBusy(true); setErr(null);
    try {
      const body = JSON.stringify({
        id: draft.id, name: draft.name,
        contactEmail: draft.contactEmail, contactLine: draft.contactLine,
        webhookUrl: draft.webhookUrl, flows: draft.flows,
        active: draft.active, notes: draft.notes,
      });
      if (draft.isNew) {
        await apiFetch('/api/partners', { method: 'POST', body });
      } else {
        await apiFetch(`/api/partners/${draft.id}`, { method: 'PATCH', body });
      }
      await load();
      setDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!draft || draft.isNew) return;
    if (!confirm('ลบ partner "' + draft.name + '"? donations ที่เคย link จะถูกตั้ง partner_id = NULL')) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/api/partners/${draft.id}`, { method: 'DELETE' });
      await load();
      setDraft(null);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  const toggleFlow = (f: DonationFlow) => {
    if (!draft) return;
    setDraft({
      ...draft,
      flows: draft.flows.includes(f) ? draft.flows.filter(x => x !== f) : [...draft.flows, f],
    });
  };

  return (
    <div style={{ padding: '22px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: AZ.muted, letterSpacing: '0.08em', fontWeight: 600 }}>OPERATIONS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', marginTop: 2 }}>Partners</div>
          <div style={{ fontSize: 12.5, color: AZ.muted, marginTop: 4 }}>
            องค์กรพันธมิตรที่ทำงานเชิง fulfillment ให้ Kaff — เช่น Ummatee สำหรับ Qurban
          </div>
        </div>
        <ABtn kind="primary" icon="plus" onClick={openNew}>เพิ่ม Partner</ABtn>
      </div>

      {err && (
        <div style={{ background: '#FBE4DF', color: '#7a2a1a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <ACard padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: AZ.surface }}>
              <Th>Partner</Th><Th>Flows</Th><Th>Contact</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows?.map(p => (
              <tr key={p.id} style={{ borderTop: `1px solid ${AZ.line}` }}>
                <Td>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: AZ.ink }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: AZ.muted, fontFamily: 'Geist Mono, monospace' }}>#{p.id}</div>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.flows.length === 0 ? <span style={{ color: AZ.mutedLite, fontSize: 12 }}>—</span> :
                      p.flows.map(f => <Pill key={f} color="forest">{FLOW_LABEL[f]}</Pill>)}
                  </div>
                </Td>
                <Td>
                  {p.contactEmail && <div style={{ fontSize: 12 }}>{p.contactEmail}</div>}
                  {p.contactLine && <div style={{ fontSize: 11.5, color: AZ.muted }}>LINE: {p.contactLine}</div>}
                  {!p.contactEmail && !p.contactLine && <span style={{ color: AZ.mutedLite, fontSize: 12 }}>—</span>}
                </Td>
                <Td>{p.active ? <Pill color="sage">active</Pill> : <Pill color="grey">inactive</Pill>}</Td>
                <Td><ABtn kind="ghost" size="sm" icon="edit" onClick={() => openEdit(p)}>แก้</ABtn></Td>
              </tr>
            ))}
            {rows && rows.length === 0 && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>ยังไม่มี partner</div></Td></tr>
            )}
            {!rows && !err && (
              <tr><Td><div style={{ padding: '40px 0', textAlign: 'center', color: AZ.muted }}>กำลังโหลด…</div></Td></tr>
            )}
          </tbody>
        </table>
      </ACard>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.isNew ? 'เพิ่ม Partner' : `แก้ไข: ${draft?.name}`}
        footer={
          <>
            {draft && !draft.isNew && <ABtn kind="danger" icon="trash" onClick={remove} disabled={busy}>ลบ</ABtn>}
            <div style={{ flex: 1 }} />
            <ABtn kind="ghost" onClick={() => setDraft(null)}>ยกเลิก</ABtn>
            <ABtn kind="primary" icon="check" onClick={save} disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </ABtn>
          </>
        }
      >
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <Field label="ID (slug)" hint={draft.isNew ? 'a-z, 0-9, -' : 'แก้ไม่ได้'}>
                <input value={draft.id} disabled={!draft.isNew}
                  onChange={e => setDraft({ ...draft, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="ummatee"
                  style={{ width: '100%', height: 38, padding: '0 12px', border: `1px solid ${AZ.line}`, borderRadius: 10, background: draft.isNew ? '#fff' : AZ.surface, fontFamily: 'Geist Mono, monospace', fontSize: 13, color: AZ.ink }}
                />
              </Field>
              <Field label="ชื่อ Partner">
                <TextInput value={draft.name} onChange={v => setDraft({ ...draft, name: String(v) })} placeholder="Ummatee" />
              </Field>
            </div>
            <Field label="Flows ที่ partner นี้รับผิดชอบ" hint="เลือกหลายได้">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_FLOWS.map(f => {
                  const on = draft.flows.includes(f);
                  return (
                    <button key={f} onClick={() => toggleFlow(f)} style={{
                      padding: '6px 14px', borderRadius: 999,
                      background: on ? AZ.forest : '#fff',
                      color: on ? '#fff' : AZ.forest,
                      border: `1px solid ${on ? AZ.forest : AZ.line}`,
                      fontSize: 12.5, fontWeight: 600,
                    }}>{FLOW_LABEL[f]}</button>
                  );
                })}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Email"><TextInput value={draft.contactEmail} onChange={v => setDraft({ ...draft, contactEmail: String(v) })} placeholder="ops@ummatee.com" /></Field>
              <Field label="LINE ID"><TextInput value={draft.contactLine} onChange={v => setDraft({ ...draft, contactLine: String(v) })} placeholder="@ummatee" /></Field>
            </div>
            <Field label="Webhook URL (option)" hint="เผื่ออนาคต partner callback เข้ามาเอง">
              <TextInput value={draft.webhookUrl} onChange={v => setDraft({ ...draft, webhookUrl: String(v) })} placeholder="https://ummatee.com/webhooks/kaff" />
            </Field>
            <Field label="หมายเหตุ"><TextArea value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} rows={3} placeholder="ที่อยู่สำนักงาน · MOU · ข้อตกลง" /></Field>
            <div style={{ padding: 12, background: AZ.surface, borderRadius: 10 }}>
              <Toggle value={draft.active} onChange={v => setDraft({ ...draft, active: v })} label="Active (เปิดให้ assign donation ได้)" />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
