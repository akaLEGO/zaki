import type { CSSProperties, ReactNode } from 'react';

export const Z = {
  forest: '#0D3B2E',
  forestDeep: '#082A21',
  sage: '#2EC27E',
  sageSoft: '#DCF0E5',
  gold: '#C9A94A',
  goldSoft: '#F5EDD3',
  surface: '#F5F8F5',
  paper: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#6B7280',
  line: '#E6ECE7',
};

export type ZIconName =
  | 'riba' | 'zakat' | 'compulsory' | 'qurban' | 'faq' | 'sadaqah'
  | 'hospital' | 'road' | 'toilet' | 'community'
  | 'arrowRight' | 'arrowLeft' | 'check' | 'plus' | 'minus' | 'chevDown' | 'chevUp'
  | 'info' | 'home' | 'history' | 'profile' | 'lock' | 'flame' | 'copy'
  | 'qr' | 'bank' | 'coin' | 'share' | 'download' | 'line' | 'sparkle' | 'plant' | 'privacy';

interface IconProps {
  name: ZIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<ZIconName, JSX.Element> = {
    riba: <g {...p}><path d="M5 7c0 2.2 3.1 4 7 4s7-1.8 7-4-3.1-4-7-4-7 1.8-7 4Z"/><path d="M5 7v5c0 2.2 3.1 4 7 4s7-1.8 7-4V7"/><path d="M5 12v5c0 2.2 3.1 4 7 4s7-1.8 7-4v-5"/></g>,
    zakat: <g {...p}><path d="M12 3v18"/><path d="M16.5 6.5C16.5 5 14.5 4 12 4S7.5 5 7.5 6.5 9 9 12 9.5s4.5 1.5 4.5 3-2 2.5-4.5 2.5-4.5-1-4.5-2.5"/></g>,
    compulsory: <g {...p}><path d="M12 3 3 7v6c0 4.5 3.5 7.5 9 8 5.5-.5 9-3.5 9-8V7l-9-4Z"/><path d="m9 12 2 2 4-4"/></g>,
    qurban: <g {...p}><ellipse cx="12" cy="12" rx="8.5" ry="6.2"/><path d="M10 8.5v7M10 11.5h5"/><circle cx="14" cy="9.5" r=".55" fill={color} stroke="none"/><circle cx="15.5" cy="13.5" r=".55" fill={color} stroke="none"/><circle cx="13" cy="14.5" r=".4" fill={color} stroke="none"/></g>,
    faq: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M9.2 9.4c0-1.5 1.3-2.6 2.9-2.6 1.7 0 2.9 1.1 2.9 2.5 0 1.7-2.9 2-2.9 3.7"/><circle cx="12" cy="16.4" r=".8" fill={color} stroke="none"/></g>,
    sadaqah: <g {...p}><path d="M5 11h3l3-3c1 0 2 1 2 2l-1 2h4c1 0 2 1 2 2 0 .5-.5 1-1 1l1 1c0 .5-.5 1-1 1l.5 1c0 .5-.5 1-1 1H10c-3 0-5-1-5-3v-5Z"/></g>,
    hospital: <g {...p}><rect x="4" y="6" width="16" height="14" rx="1.5"/><path d="M4 10h16"/><path d="M12 13v4M10 15h4"/></g>,
    road: <g {...p}><path d="M7 21 9 3M17 21l-2-18"/><path d="M12 5v2M12 11v2M12 17v2"/></g>,
    toilet: <g {...p}><path d="M5 4h6v8H5z"/><path d="M5 12 7 21h2l2-9"/><circle cx="17" cy="6" r="2"/><path d="M14 12h6l-1 8h-4l-1-8Z"/></g>,
    community: <g {...p}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2"/><path d="M3 19c.7-2.6 3-4 6-4s5.3 1.4 6 4"/><path d="M15 19c.5-1.8 2-2.5 4-2.5"/></g>,
    arrowRight: <g {...p}><path d="M5 12h14M13 6l6 6-6 6"/></g>,
    arrowLeft: <g {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></g>,
    check: <g {...p}><path d="m5 12 5 5 9-11"/></g>,
    plus: <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    minus: <g {...p}><path d="M5 12h14"/></g>,
    chevDown: <g {...p}><path d="m6 9 6 6 6-6"/></g>,
    chevUp: <g {...p}><path d="m6 15 6-6 6 6"/></g>,
    info: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8.5v.01M11 12h1v5h1"/></g>,
    home: <g {...p}><path d="M4 12 12 4l8 8"/><path d="M6 10v10h12V10"/></g>,
    history: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
    profile: <g {...p}><circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"/></g>,
    lock: <g {...p}><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></g>,
    flame: <g {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 0 2 1 3 3 4-1-3 0-6 0-8Z"/></g>,
    copy: <g {...p}><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3"/></g>,
    qr: <g {...p}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2M20 14v2M18 16v2M14 18v2M16 20h4"/></g>,
    bank: <g {...p}><path d="M3 10 12 4l9 6"/><path d="M5 10v8M19 10v8M9 10v8M15 10v8"/><path d="M3 20h18"/></g>,
    coin: <g {...p}><circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a2 2 0 0 1 0 4H9m0 0h5"/></g>,
    share: <g {...p}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 7l-4-4-4 4M12 3v13"/></g>,
    download: <g {...p}><path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><path d="m8 11 4 4 4-4M12 4v11"/></g>,
    line: <g {...p}><path d="M4 11c0-4 3.6-7 8-7s8 3 8 7c0 5-6 8-8 8-.7 0-1.4-.1-2-.2L5 21l1.5-4C5 15.5 4 13.4 4 11Z"/></g>,
    sparkle: <g {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></g>,
    plant: <g {...p}><path d="M12 21v-9"/><path d="M12 12c0-4-3-7-7-7 0 5 3 8 7 8Z"/><path d="M12 12c0-3 2.5-5 5.5-5 0 4-2.5 6-5.5 6Z"/></g>,
    privacy: <g {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M8 14c0-3 2-5 4-5"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}

export function GoldButton({ children, onClick, disabled, full = true, style = {} }: {
  children?: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean; style?: CSSProperties;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? '#D5D5CB' : Z.gold,
        color: disabled ? '#8a8a82' : '#1a1a14',
        height: 56, width: full ? '100%' : 'auto',
        padding: '0 22px',
        borderRadius: 16, fontWeight: 700, fontSize: 16,
        letterSpacing: '0.01em',
        boxShadow: disabled ? 'none' : '0 6px 18px rgba(201,169,74,0.30), 0 1px 0 rgba(255,255,255,0.5) inset',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform .12s ease, box-shadow .12s',
        ...style,
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style = {} }: { children?: ReactNode; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      height: 48, padding: '0 18px',
      borderRadius: 14, fontWeight: 600, fontSize: 15,
      background: 'transparent', color: Z.forest,
      border: `1.5px solid ${Z.line}`,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

export function BackButton({ onClick, dark = false }: { onClick?: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 999,
      background: dark ? 'rgba(255,255,255,0.10)' : '#fff',
      border: dark ? '1px solid rgba(255,255,255,0.16)' : `1px solid ${Z.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: dark ? '#fff' : Z.forest,
    }}>
      <Icon name="arrowLeft" size={18} />
    </button>
  );
}

export function Screen({ children, bg = Z.surface, scroll = true }: { children?: ReactNode; bg?: string; scroll?: boolean }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      overflowY: scroll ? 'auto' : 'hidden',
      position: 'relative',
    }}>{children}</div>
  );
}

export function ForestHeader({ title, sub, onBack, right, children, compact = false }: {
  title?: ReactNode; sub?: ReactNode; onBack?: () => void; right?: ReactNode; children?: ReactNode; compact?: boolean;
}) {
  return (
    <div style={{
      background: Z.forest, color: '#fff', position: 'relative',
      paddingTop: 58,
      padding: `58px 20px ${compact ? 20 : 24}px`,
      borderRadius: '0 0 28px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
        {onBack ? <BackButton onClick={onBack} dark /> : <div style={{ width: 40 }} />}
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {title && (
        <div style={{ marginTop: compact ? 10 : 14 }}>
          <div style={{
            fontSize: compact ? 22 : 26, fontWeight: 700, lineHeight: 1.18,
            letterSpacing: '-0.01em', textWrap: 'pretty',
          }}>{title}</div>
          {sub && <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StickyBottom({ children, height = 110 }: { children?: ReactNode; height?: number }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 10,
      height,
      padding: '14px 20px 30px',
      background: 'linear-gradient(180deg, rgba(245,248,245,0) 0%, rgba(245,248,245,0.95) 30%, #F5F8F5 60%)',
    }}>
      {children}
    </div>
  );
}

export function Card({ children, onClick, style = {}, padding = 18, selected = false }: {
  children?: ReactNode; onClick?: () => void; style?: CSSProperties; padding?: number; selected?: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      background: Z.paper,
      borderRadius: 20,
      padding,
      border: `1.5px solid ${selected ? Z.forest : Z.line}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .15s, transform .12s',
      ...style,
    }}>{children}</div>
  );
}

export function ProgressBar({ value, color = Z.sage, track = '#EEF2EF', height = 8, animated = true }: {
  value: number; color?: string; track?: string; height?: number; animated?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{
      height, background: track, borderRadius: 999, overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color,
        borderRadius: 999,
        transition: animated ? 'width .8s cubic-bezier(.2,.8,.2,1)' : 'none',
      }} />
    </div>
  );
}

export function MoneyField({ value, onChange, label, autoFocus = false, placeholder = '0' }: {
  value: number; onChange: (n: number) => void; label?: string; autoFocus?: boolean; placeholder?: string;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '14px 16px',
      border: `1.5px solid ${Z.line}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {label && <div style={{ fontSize: 12, color: Z.muted, fontWeight: 500 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, color: Z.muted, fontWeight: 600 }}>฿</span>
        <input
          autoFocus={autoFocus}
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('en-US')}
          placeholder={placeholder}
          onChange={e => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            onChange(raw === '' ? 0 : Number(raw));
          }}
          style={{
            flex: 1, minWidth: 0,
            border: 'none', outline: 'none',
            background: 'transparent',
            fontSize: 28, fontWeight: 700, color: Z.ink,
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
          }}
        />
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const btn: CSSProperties = {
    width: 48, height: 48, borderRadius: 14,
    background: '#fff', border: `1.5px solid ${Z.line}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: Z.forest,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
      <button onClick={dec} style={btn}><Icon name="minus" size={20} /></button>
      <div style={{
        minWidth: 80, textAlign: 'center',
        fontSize: 36, fontWeight: 700, color: Z.forest, letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <button onClick={inc} style={btn}><Icon name="plus" size={20} /></button>
    </div>
  );
}

export function NiyyahBox({ text, confirmed, onConfirm }: { text: ReactNode; confirmed: boolean; onConfirm: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #fff 0%, #FBFAF3 100%)',
      borderRadius: 20, padding: 18,
      border: `1.5px dashed ${Z.gold}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 11, letterSpacing: '0.12em',
        fontWeight: 600, color: Z.gold, textTransform: 'uppercase', marginBottom: 8,
      }}>Niyyah · เนียต</div>
      <div style={{
        fontSize: 15.5, lineHeight: 1.55, color: Z.ink, fontWeight: 500,
        marginBottom: 14, textWrap: 'pretty',
      }}>{text}</div>
      <button onClick={onConfirm} style={{
        height: 44, padding: '0 18px', borderRadius: 12,
        background: confirmed ? Z.forest : '#fff',
        color: confirmed ? Z.gold : Z.forest,
        border: `1.5px solid ${Z.forest}`,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontWeight: 600, fontSize: 14,
      }}>
        {confirmed ? <><Icon name="check" size={18} /> ยืนยันแล้ว</> : 'ยืนยัน ✓'}
      </button>
    </div>
  );
}

export function Chip({ children, active, onClick, color, style = {} }: {
  children?: ReactNode; active?: boolean; onClick?: () => void; color?: string; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick} style={{
      height: 36, padding: '0 14px', borderRadius: 999,
      background: active ? (color || Z.forest) : '#fff',
      color: active ? '#fff' : Z.forest,
      border: `1.5px solid ${active ? (color || Z.forest) : Z.line}`,
      fontSize: 13.5, fontWeight: 600,
      whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'all .12s',
      ...style,
    }}>{children}</button>
  );
}

export function fmtTHB(n?: number) { return '฿' + (n || 0).toLocaleString('en-US'); }
export function fmtPct(n: number) { return Math.round(n) + '%'; }

export function TrustBadge({ children }: { children?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', background: Z.sageSoft, borderRadius: 12,
      fontSize: 13, color: Z.forest, fontWeight: 500, lineHeight: 1.4,
    }}>
      <div style={{
        width: 22, height: 22, flexShrink: 0, borderRadius: 999,
        background: Z.sage, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={14} strokeWidth={2.5} />
      </div>
      <span style={{ textWrap: 'pretty' } as CSSProperties}>{children}</span>
    </div>
  );
}

export type Tab = 'home' | 'faq' | 'profile';

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const items: { id: Tab; icon: ZIconName; label: string }[] = [
    { id: 'home', icon: 'home', label: 'หน้าหลัก' },
    { id: 'faq', icon: 'faq', label: 'คำถาม' },
    { id: 'profile', icon: 'profile', label: 'โปรไฟล์' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 18, left: 16, right: 16,
      height: 64, borderRadius: 22,
      background: 'rgba(13,59,46,0.96)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      boxShadow: '0 14px 32px rgba(13,59,46,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onTab(it.id)} style={{
            flex: 1, height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: active ? Z.gold : 'rgba(255,255,255,0.55)',
            gap: 2,
          }}>
            <Icon name={it.icon} size={22} strokeWidth={active ? 2 : 1.7} />
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.01em' }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ZakiMark({ size = 30, light = false }: { size?: number; light?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: light ? '#fff' : Z.forest,
      color: light ? Z.forest : Z.gold,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.5,
      fontFamily: 'Sarabun, system-ui',
      letterSpacing: '-0.04em',
    }}>ك</div>
  );
}
