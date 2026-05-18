import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AZ, AIcon, ABtn, KPI, Pill, ACard, Field, TextInput, TextArea, Toggle, Drawer,
  PBar, fmtTHB, fmtNumber, pct,
} from './AdminUI';
import type { IconName } from './AdminUI';
import type { Org, Campaign as CampaignT, OrgIcon, AsnafId, Recipient } from '../shared/types';
import { useData } from '../lib/data-context';
import { apiFetch } from '../lib/api';

type ScreenId = 'dashboard' | 'campaigns' | 'orgs' | 'rates' | 'transactions' | 'shariah' | 'settings';

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

function RecipientsTable() {
  const { asnaf: ASNAF, recipients } = useData();
  const list: (Recipient & { asnaf: AsnafId; id: number })[] = [];
  for (const [asnafId, rs] of Object.entries(recipients)) {
    if (!rs) continue;
    for (const r of rs) list.push({ ...(r as Recipient & { id: number }), asnaf: asnafId as AsnafId });
  }
  const [filter, setFilter] = useState<'all' | AsnafId>('all');
  const filtered = filter === 'all' ? list : list.filter(r => r.asnaf === filter);

  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: `1px solid ${AZ.line}` }}>
          <button onClick={() => setFilter('all')} style={chipBtn(filter === 'all')}>ทั้งหมด</button>
          {ASNAF.map(a => (
            <button key={a.id} onClick={() => setFilter(a.id)} style={chipBtn(filter === a.id)}>{a.label}</button>
          ))}
        </div>
        <ABtn kind="primary" icon="plus">เพิ่มผู้รับ</ABtn>
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
                  <Td><ABtn kind="ghost" size="sm" icon="edit">แก้</ABtn></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ACard>
    </>
  );
}

function QurbanTable() {
  const { qurbanOptions: QURBAN_OPTIONS, qurbanLocations: QURBAN_LOCATIONS } = useData();
  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: AZ.muted, alignSelf: 'center' }}>
          ราคาตามประเทศ + พื้นที่แจกจ่ายเนื้อกุรบ่าน
        </div>
        <ABtn kind="primary" icon="plus">เพิ่มพื้นที่</ABtn>
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
              {QURBAN_OPTIONS.map((q, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${AZ.line}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{q.flag}</span>
                      <div style={{ fontWeight: 600 }}>{q.country}</div>
                    </div>
                  </Td>
                  <Td><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{q.currency}{fmtNumber(q.price)}</span></Td>
                  <Td><span style={{ fontSize: 12, color: AZ.muted }}>{q.sub}</span></Td>
                  <Td><ABtn kind="ghost" size="sm" icon="edit">แก้</ABtn></Td>
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
              <ABtn kind="ghost" size="sm" icon="edit">แก้</ABtn>
            </div>
          ))}
        </ACard>
      </div>
    </>
  );
}
