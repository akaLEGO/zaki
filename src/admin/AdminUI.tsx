import type { CSSProperties, ReactNode } from 'react';

export const AZ = {
  forest: '#0D3B2E',
  forestDeep: '#082A21',
  sage: '#2EC27E',
  sageSoft: '#DCF0E5',
  gold: '#C9A94A',
  goldSoft: '#F5EDD3',
  surface: '#F6F8F6',
  paper: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#6B7280',
  mutedLite: '#9CA3AF',
  line: '#E6ECE7',
  rowHover: '#F1F5F1',
  danger: '#C0392B',
  warn: '#D7A03B',
};

export type IconName =
  | 'dashboard' | 'campaign' | 'orgs' | 'rates' | 'shariah' | 'transactions' | 'settings'
  | 'plus' | 'search' | 'edit' | 'trash' | 'check' | 'x' | 'chev' | 'chevR' | 'eye'
  | 'flag' | 'bell' | 'user' | 'flame' | 'arrow' | 'download' | 'refresh' | 'money'
  | 'sparkle' | 'riba' | 'zakat' | 'qurban' | 'sadaqah' | 'moon' | 'book' | 'water'
  | 'bolt' | 'hospital' | 'road' | 'toilet' | 'community';

interface AIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.7 }: AIconProps) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, JSX.Element> = {
    dashboard: <g {...p}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></g>,
    campaign: <g {...p}><path d="M3 11l13-7v16L3 13Z"/><path d="M3 11h4v6H3z"/><path d="M16 7v10"/></g>,
    orgs: <g {...p}><rect x="3" y="9" width="8" height="12" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/><path d="M16 7h2M16 11h2M16 15h2M6 13h2M6 17h2"/></g>,
    rates: <g {...p}><path d="M4 19V5M4 19h16"/><path d="M8 14l3-3 3 3 5-5"/></g>,
    shariah: <g {...p}><path d="M12 3 4 7v6c0 4.5 3.5 7.5 8 8 4.5-.5 8-3.5 8-8V7l-8-4Z"/><path d="m9 12 2 2 4-4"/></g>,
    transactions: <g {...p}><path d="M3 7h14l-3-3M21 17H7l3 3"/></g>,
    settings: <g {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></g>,
    plus: <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    search: <g {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5"/></g>,
    edit: <g {...p}><path d="M3 21h4l11-11-4-4L3 17v4Z"/><path d="m14 6 4 4"/></g>,
    trash: <g {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13c0 1 .5 1.5 1.5 1.5h7c1 0 1.5-.5 1.5-1.5l1-13"/></g>,
    check: <g {...p}><path d="m5 12 5 5 9-11"/></g>,
    x: <g {...p}><path d="M6 6l12 12M18 6l-12 12"/></g>,
    chev: <g {...p}><path d="m6 9 6 6 6-6"/></g>,
    chevR: <g {...p}><path d="m9 6 6 6-6 6"/></g>,
    eye: <g {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></g>,
    flag: <g {...p}><path d="M5 21V4h12l-2 4 2 4H5"/></g>,
    bell: <g {...p}><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2Z"/><path d="M10 21a2 2 0 0 0 4 0"/></g>,
    user: <g {...p}><circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"/></g>,
    flame: <g {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 0 2 1 3 3 4-1-3 0-6 0-8Z"/></g>,
    arrow: <g {...p}><path d="M5 12h14M13 6l6 6-6 6"/></g>,
    download: <g {...p}><path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><path d="m8 11 4 4 4-4M12 4v11"/></g>,
    refresh: <g {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></g>,
    money: <g {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></g>,
    sparkle: <g {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></g>,
    riba: <g {...p}><path d="M5 7c0 2.2 3.1 4 7 4s7-1.8 7-4-3.1-4-7-4-7 1.8-7 4Z"/><path d="M5 7v5c0 2.2 3.1 4 7 4s7-1.8 7-4V7"/><path d="M5 12v5c0 2.2 3.1 4 7 4s7-1.8 7-4v-5"/></g>,
    zakat: <g {...p}><path d="M12 3v18"/><path d="M16.5 6.5C16.5 5 14.5 4 12 4S7.5 5 7.5 6.5 9 9 12 9.5s4.5 1.5 4.5 3-2 2.5-4.5 2.5-4.5-1-4.5-2.5"/></g>,
    qurban: <g {...p}><ellipse cx="12" cy="12" rx="8.5" ry="6.2"/><path d="M10 8.5v7M10 11.5h5"/><circle cx="14" cy="9.5" r=".55" fill={color} stroke="none"/></g>,
    sadaqah: <g {...p}><path d="M5 11h3l3-3c1 0 2 1 2 2l-1 2h4c1 0 2 1 2 2 0 .5-.5 1-1 1l1 1c0 .5-.5 1-1 1l.5 1c0 .5-.5 1-1 1H10c-3 0-5-1-5-3v-5Z"/></g>,
    moon: <g {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></g>,
    book: <g {...p}><path d="M4 4h7c1.5 0 3 1 3 3v13c0-1.5-1.5-3-3-3H4V4Z"/><path d="M20 4h-7c-1.5 0-3 1-3 3v13c0-1.5 1.5-3 3-3h7V4Z"/></g>,
    water: <g {...p}><path d="M12 3s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13Z"/></g>,
    bolt: <g {...p}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></g>,
    hospital: <g {...p}><rect x="4" y="6" width="16" height="14" rx="1.5"/><path d="M4 10h16"/><path d="M12 13v4M10 15h4"/></g>,
    road: <g {...p}><path d="M7 21 9 3M17 21l-2-18"/><path d="M12 5v2M12 11v2M12 17v2"/></g>,
    toilet: <g {...p}><path d="M5 4h6v8H5z"/><path d="M5 12 7 21h2l2-9"/><circle cx="17" cy="6" r="2"/><path d="M14 12h6l-1 8h-4l-1-8Z"/></g>,
    community: <g {...p}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2"/><path d="M3 19c.7-2.6 3-4 6-4s5.3 1.4 6 4"/><path d="M15 19c.5-1.8 2-2.5 4-2.5"/></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{paths[name] || null}</svg>;
}

interface ABtnProps {
  children?: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'gold' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  disabled?: boolean;
  style?: CSSProperties;
}

export function ABtn({ children, onClick, kind = 'primary', size = 'md', icon, disabled, style = {} }: ABtnProps) {
  const sizes = {
    sm: { h: 32, padX: 12, fs: 12.5, iconSize: 14 },
    md: { h: 38, padX: 16, fs: 13.5, iconSize: 16 },
    lg: { h: 44, padX: 20, fs: 15, iconSize: 18 },
  };
  const kinds = {
    primary: { bg: AZ.forest, color: '#fff', border: 'none' },
    gold:    { bg: AZ.gold, color: '#1a1a14', border: 'none' },
    ghost:   { bg: '#fff', color: AZ.forest, border: `1px solid ${AZ.line}` },
    danger:  { bg: '#fff', color: AZ.danger, border: `1px solid #F1C6BF` },
    subtle:  { bg: AZ.surface, color: AZ.forest, border: `1px solid ${AZ.line}` },
  };
  const s = sizes[size];
  const k = kinds[kind];
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      height: s.h, padding: `0 ${s.padX}px`, borderRadius: 10,
      background: disabled ? '#E5E7E5' : k.bg,
      color: disabled ? '#9aa3a0' : k.color,
      border: k.border,
      fontWeight: 600, fontSize: s.fs,
      letterSpacing: '-0.005em',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'transform .12s, box-shadow .15s, opacity .15s',
      ...style,
    }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
    >
      {icon && <AIcon name={icon} size={s.iconSize} />}
      {children}
    </button>
  );
}

export function KPI({ label, value, sub, trend, icon, accent = AZ.forest }: {
  label: string; value: ReactNode; sub?: string; trend?: string; icon?: IconName; accent?: string;
}) {
  const upDown = trend && trend.startsWith('+');
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 18,
      border: `1px solid ${AZ.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: AZ.muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        {icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: AZ.surface, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><AIcon name={icon} size={15} color={accent} /></div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: AZ.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12 }}>
        {trend && (
          <span style={{
            color: upDown ? AZ.sage : AZ.danger,
            fontWeight: 700,
          }}>{trend}</span>
        )}
        <span style={{ color: AZ.muted }}>{sub}</span>
      </div>
    </div>
  );
}

export type PillColor = 'sage' | 'gold' | 'forest' | 'grey' | 'warn' | 'danger';

export function Pill({ children, color = 'sage', size = 'sm' }: { children: ReactNode; color?: PillColor; size?: 'sm' | 'md' }) {
  const palette: Record<PillColor, { bg: string; fg: string }> = {
    sage:    { bg: AZ.sageSoft, fg: '#0a6e44' },
    gold:    { bg: AZ.goldSoft, fg: '#7a5e10' },
    forest:  { bg: 'rgba(13,59,46,0.08)', fg: AZ.forest },
    grey:    { bg: '#EEF1EE', fg: AZ.muted },
    warn:    { bg: '#FFF1D6', fg: '#8a5a00' },
    danger:  { bg: '#FBE4DF', fg: '#7a2a1a' },
  };
  const c = palette[color] || palette.grey;
  const sz = size === 'sm' ? { fs: 11, padY: 3, padX: 8 } : { fs: 12, padY: 4, padX: 10 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.fg,
      padding: `${sz.padY}px ${sz.padX}px`, borderRadius: 999,
      fontSize: sz.fs, fontWeight: 700, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

export function ACard({ children, title, action, padding = 18, style = {} }: {
  children?: ReactNode; title?: ReactNode; action?: ReactNode; padding?: number; style?: CSSProperties;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: `1px solid ${AZ.line}`,
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${AZ.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: AZ.ink, letterSpacing: '-0.005em' }}>{title}</div>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, color: AZ.muted, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: AZ.mutedLite, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value?: string | number; onChange?: (v: string | number) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value ?? ''} placeholder={placeholder}
      onChange={e => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
      style={{
        width: '100%', height: 38, padding: '0 12px',
        background: '#fff', border: `1px solid ${AZ.line}`, borderRadius: 10,
        fontSize: 14, color: AZ.ink, outline: 'none',
        fontVariantNumeric: type === 'number' ? 'tabular-nums' : undefined,
      }}
      onFocus={e => { e.target.style.borderColor = AZ.forest; }}
      onBlur={e => { e.target.style.borderColor = AZ.line; }}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value || ''} placeholder={placeholder} rows={rows}
      onChange={e => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px',
        background: '#fff', border: `1px solid ${AZ.line}`, borderRadius: 10,
        fontSize: 13.5, color: AZ.ink, outline: 'none', resize: 'vertical',
        fontFamily: 'inherit', lineHeight: 1.5,
      }}
      onFocus={e => { e.target.style.borderColor = AZ.forest; }}
      onBlur={e => { e.target.style.borderColor = AZ.line; }}
    />
  );
}

export function Toggle({ value, onChange, label }: { value?: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange?.(!value)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 36, height: 22, borderRadius: 999,
        background: value ? AZ.forest : '#DAE1DC',
        position: 'relative', transition: 'background .15s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: 2,
          width: 18, height: 18, borderRadius: 999,
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transform: value ? 'translateX(14px)' : 'none',
          transition: 'transform .18s',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: AZ.ink, fontWeight: 500 }}>{label}</span>}
    </button>
  );
}

export function Drawer({ open, onClose, title, footer, width = 460, children }: {
  open: boolean; onClose?: () => void; title?: ReactNode; footer?: ReactNode; width?: number; children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(8,32,24,0.32)',
        backdropFilter: 'blur(2px)',
        zIndex: 50, animation: 'aFadeIn .18s ease-out',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width,
        background: AZ.surface,
        boxShadow: '-12px 0 32px rgba(8,42,33,0.22)',
        display: 'flex', flexDirection: 'column',
        zIndex: 51, animation: 'aSlideIn .22s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: `1px solid ${AZ.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: AZ.ink }}>{title}</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: AZ.surface, color: AZ.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><AIcon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: `1px solid ${AZ.line}`,
            background: '#fff',
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>{footer}</div>
        )}
      </div>
      <style>{`
        @keyframes aFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes aSlideIn { from { transform: translateX(20px); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>
    </>
  );
}

export function fmtTHB(n?: number) { return '฿' + (n || 0).toLocaleString('en-US'); }
export function fmtNumber(n?: number) { return (n || 0).toLocaleString('en-US'); }
export function pct(raised: number, target: number) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / target) * 100)));
}

export function Spark({ values, color = AZ.sage, width = 100, height = 32 }: {
  values: number[]; color?: string; width?: number; height?: number;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity="0.10" />
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PBar({ value, color = AZ.sage, track = '#EEF2EF', height = 6 }: {
  value: number; color?: string; track?: string; height?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}
