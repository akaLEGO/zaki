import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

// Brand tokens — Kaff 2026 redesign handoff (design_handoff_kaff_2026/README.md).
// The green stays the base everywhere; lime is the only high-energy accent and
// is limited to ONE action per screen. Gold/olive is reserved for Zakat,
// Qurban and Riba-cleanse contexts.
//
// Key names are unchanged from the previous brand pass so every screen picks
// up the new palette without a rename sweep.
export const Z = {
  forest: '#0D3B2E',       // green/800 — primary brand
  forestDeep: '#061A14',   // green/900 — deepest gradient stop
  sage: '#2C7D53',         // green/600 — progress + success fills
  sageSoft: '#E6EFE9',     // paper/green mid — tinted light surfaces
  gold: '#C9A227',         // gold/600 — Zakat pillar, gold CTA
  goldSoft: '#EBD79A',     // gold/300 — gold text on dark, soft fills
  surface: '#F3F7F4',      // paper/green top
  paper: '#FFFFFF',
  ink: '#0D3B2E',          // ink/green — text on light screens
  muted: '#4d7a68',        // ink/muted — secondary text on light
  line: '#DCE8E0',         // hair — green-toned borders
  danger: '#a04b4b',       // red/debt — negative amounts, errors
};

// Extended palette — the stops the gradients and per-service accents are
// built from. Kept separate from `Z` so the core token set stays small.
export const K = {
  green900: '#061A14',
  green850: '#08231B',
  green800: '#0D3B2E',
  green700: '#1F6544',
  green600: '#2C7D53',
  green500: '#3E9A63',
  green450: '#4FA96B',
  green400: '#5FB47C',
  green300: '#8FD97A',
  lime: '#B9F27C',         // the one high-energy accent
  limeTint: '#DCFFB0',
  gold500: '#D8B54A',      // Riba label accent
  gold600: '#C9A227',
  gold300: '#EBD79A',
  olive700: '#8A7538',     // Qurban primary
  olive800: '#6E5A2A',
  inkGold: '#241C02',      // text on gold / olive
  mutedMid: '#6b8b7e',
  mutedSoft: '#8aa79a',
  debt: '#8a3b3b',
  onDark: '#f2fbf5',
  onDarkSoft: 'rgba(255,255,255,0.68)',
  onDarkFaint: 'rgba(255,255,255,0.55)',
};

// Signature gradients — verbatim from the handoff.
export const G = {
  home: 'linear-gradient(180deg,#0D3B2E 0%,#0F4635 34%,#1C6B45 68%,#58A05A 100%)',
  homeGlowA: 'radial-gradient(420px 320px at 85% 8%, rgba(185,242,124,.30), transparent 70%)',
  homeGlowB: 'radial-gradient(500px 400px at 10% 95%, rgba(185,242,124,.22), transparent 70%)',
  darkCTA: 'linear-gradient(120deg,#0D3B2E,#2C7D53)',
  darkDeep: 'linear-gradient(180deg,#061A14 0%,#08231B 45%,#0D3B2E 100%)',
  darkRise: 'linear-gradient(180deg,#08231B 0%,#0D3B2E 42%,#2C7D53 100%)',
  askKaff: 'linear-gradient(180deg,#08231B 0%,#0D3B2E 30%,#2C7D53 72%,#B9F27C 100%)',
  qurban: 'linear-gradient(180deg,#08231B 0%,#123C2C 34%,#4A4020 78%,#8A7538 100%)',
  oliveCTA: 'linear-gradient(140deg,#8A7538,#6E5A2A)',
  goldCTA: 'linear-gradient(130deg, rgba(235,215,154,.95), rgba(212,186,110,.85))',
  limeCTA: 'linear-gradient(90deg,#B9F27C,#6FD08C)',
  paperGreen: 'linear-gradient(200deg,#F3F7F4 0%,#E6EFE9 45%,#CFE3D6 100%)',
  paperGold: 'linear-gradient(200deg,#FBF7EC 0%,#F0E9D6 45%,#DED5B8 100%)',
};

/** Numerals, codes and labels use Space Grotesk; Thai/UI uses IBM Plex Sans Thai. */
export const NUM: CSSProperties = {
  fontFamily: "'Space Grotesk', 'IBM Plex Sans Thai', system-ui, sans-serif",
  fontVariantNumeric: 'tabular-nums',
};

/**
 * Glass surface — the core new element.
 * `tone`: 'dark' for glass over the green gradients, 'light' over paper screens.
 * `raised` swaps the resting flat tint for the gradient + a drop shadow.
 */
export function glass(tone: 'dark' | 'light' = 'dark', raised = false): CSSProperties {
  if (tone === 'light') {
    return {
      background: raised ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.55)',
      border: '1px solid rgba(255,255,255,0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      ...(raised ? { boxShadow: '0 10px 26px rgba(13,59,46,0.07)' } : null),
    };
  }
  return {
    background: raised
      ? 'linear-gradient(150deg, rgba(255,255,255,.20), rgba(255,255,255,.06))'
      : 'rgba(255,255,255,0.10)',
    border: `1px solid rgba(255,255,255,${raised ? 0.28 : 0.18})`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    ...(raised ? { boxShadow: '0 14px 32px rgba(0,0,0,0.24)' } : null),
  };
}

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
    // Standing cow — side-on body with a front-facing horned head, matching
    // the client's reference. Redrawn as strokes (not the raster) so it takes
    // the accent colour and stays crisp from the 18px chip up to the 112px
    // blurred backdrop.
    qurban: <g {...p}>
      {/* Horns */}
      <path d="M4.5 5.5C3.8 4.4 2.9 3.8 2 3.8c.1 1 .8 1.9 1.8 2.4"/>
      <path d="M8.7 5.5c.7-1.1 1.6-1.7 2.5-1.7-.1 1-.8 1.9-1.8 2.4"/>
      {/* Ears */}
      <path d="M4 7.6c-1-.4-2-.4-2.6.1-.6.5-.4 1.3.4 1.7.8.3 1.8.2 2.5-.3"/>
      <path d="M9.2 7.6c1-.4 2-.4 2.6.1.6.5.4 1.3-.4 1.7-.8.3-1.8.2-2.5-.3"/>
      {/* Head */}
      <path d="M4.3 6.2c.4-1.1 1.4-1.8 2.3-1.8s1.9.7 2.3 1.8c.5 1.4.6 3.2.2 4.6H4.1c-.4-1.4-.3-3.2.2-4.6Z"/>
      {/* Muzzle + nostrils */}
      <rect x="4.7" y="9.9" width="3.8" height="2.5" rx="1.25"/>
      <circle cx="5.9" cy="11.1" r=".45" fill={color} stroke="none"/>
      <circle cx="7.3" cy="11.1" r=".45" fill={color} stroke="none"/>
      {/* Body — starts behind the head, rounded rump on the right */}
      <path d="M9 8.4h8.7c1.9 0 3.4 1.5 3.4 3.4v1.9c0 1.2-1 2.2-2.2 2.2H8.8"/>
      {/* Chest line down from the head into the front leg */}
      <path d="M4.4 12.4v3.4"/>
      {/* Legs */}
      <path d="M4.4 15.8v3.9M8.8 15.8v3.9M16.6 15.9v3.8M19.6 15.9v3.8"/>
      {/* Tail */}
      <path d="M20.9 11.4c.8.3 1.3 1.1 1.3 2v3.3"/>
    </g>,
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

/**
 * Primary CTA. `tone` picks the fill:
 *  - 'dark' (default) — the brand gradient, used by most flows
 *  - 'gold'  — reserved for Qurban
 *  - 'olive' — Qurban sub-actions
 *  - 'lime'  — the one high-energy action; never two on a screen
 * Disabled never shows a spinner inside the CTA (handoff rule) — the caller
 * changes the label instead.
 */
export function GoldButton({ children, onClick, disabled, full = true, tone = 'dark', style = {} }: {
  children?: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean;
  tone?: 'dark' | 'gold' | 'olive' | 'lime'; style?: CSSProperties;
}) {
  const fills: Record<string, { bg: string; fg: string; shadow: string }> = {
    dark:  { bg: G.darkCTA,  fg: K.onDark,  shadow: '0 16px 32px rgba(13,59,46,0.30)' },
    gold:  { bg: G.goldCTA,  fg: K.inkGold, shadow: '0 16px 32px rgba(201,162,39,0.28)' },
    olive: { bg: G.oliveCTA, fg: K.gold300, shadow: '0 16px 32px rgba(110,90,42,0.30)' },
    lime:  { bg: G.limeCTA,  fg: '#123322', shadow: '0 16px 32px rgba(185,242,124,0.30)' },
  };
  const f = fills[tone] || fills.dark;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? 'rgba(36,28,2,0.12)' : f.bg,
        color: disabled ? 'rgba(13,59,46,0.45)' : f.fg,
        height: 56, width: full ? '100%' : 'auto',
        padding: '0 22px',
        borderRadius: 18, fontWeight: 700, fontSize: 16,
        letterSpacing: '0.01em',
        boxShadow: disabled ? 'none' : f.shadow,
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

export function GhostButton({ children, onClick, dark = false, style = {} }: {
  children?: ReactNode; onClick?: () => void; dark?: boolean; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick} style={{
      height: 52, padding: '0 18px',
      borderRadius: 16, fontWeight: 600, fontSize: 15,
      ...(dark
        ? { ...glass('dark'), color: K.onDark }
        : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.88)', color: Z.forest }),
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>{children}</button>
  );
}

export function BackButton({ onClick, dark = false }: { onClick?: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 999,
      ...glass(dark ? 'dark' : 'light'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: dark ? K.onDark : Z.forest,
    }}>
      <Icon name="arrowLeft" size={18} />
    </button>
  );
}

/** Uppercase micro-label above a title — 10–11px, wide tracking. */
export function Eyebrow({ children, color = K.gold500, style = {} }: {
  children?: ReactNode; color?: string; style?: CSSProperties;
}) {
  return (
    <div style={{
      ...NUM, fontSize: 10.5, fontWeight: 700,
      letterSpacing: '0.18em', textTransform: 'uppercase', color,
      ...style,
    }}>{children}</div>
  );
}

/** Step dots for flows longer than 2 steps. */
export function StepDots({ step, total, dark = false }: { step: number; total: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < step;
        return (
          <div key={i} style={{
            height: 4, width: done ? 26 : 14, borderRadius: 999,
            background: done
              ? (dark ? K.lime : Z.forest)
              : (dark ? 'rgba(255,255,255,0.22)' : 'rgba(13,59,46,0.14)'),
            transition: 'width .3s cubic-bezier(.2,.8,.2,1), background .3s',
          }} />
        );
      })}
    </div>
  );
}

/** 48×28 pill toggle. On = brand green (or olive in Qurban contexts). */
export function Toggle({ on, onChange, dark = false, accent = Z.forest }: {
  on: boolean; onChange: (v: boolean) => void; dark?: boolean; accent?: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 48, height: 28, borderRadius: 999, flexShrink: 0,
        background: on ? accent : (dark ? 'rgba(255,255,255,0.20)' : 'rgba(13,59,46,0.14)'),
        padding: 3, display: 'flex', alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background .18s',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 999, background: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
        transition: 'transform .18s',
      }} />
    </button>
  );
}

/**
 * Light screen background. `tone` picks the paper gradient — 'gold' is
 * reserved for Zakat / Riba-cleanse / Qurban contexts.
 */
export function Screen({ children, bg, tone = 'green', scroll = true }: {
  children?: ReactNode; bg?: string; tone?: 'green' | 'gold'; scroll?: boolean;
}) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg || (tone === 'gold' ? G.paperGold : G.paperGreen),
      overflowY: scroll ? 'auto' : 'hidden',
      position: 'relative',
    }}>{children}</div>
  );
}

/**
 * Flow header. Sits on the screen's own paper gradient rather than a solid
 * green block — the back chevron and eyebrow are glass, so the gradient reads
 * through. `dark` keeps the old solid-green treatment for screens that need
 * a high-contrast top.
 */
export function ForestHeader({ title, sub, onBack, right, children, compact = false, tone = 'green', dark = false }: {
  title?: ReactNode; sub?: ReactNode; onBack?: () => void; right?: ReactNode;
  children?: ReactNode; compact?: boolean; tone?: 'green' | 'gold'; dark?: boolean;
}) {
  return (
    <div style={{
      background: dark ? G.darkRise : 'transparent',
      color: dark ? K.onDark : Z.ink,
      position: 'relative',
      padding: `58px 20px ${compact ? 16 : 20}px`,
      borderRadius: dark ? '0 0 28px 28px' : 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, gap: 12 }}>
        {onBack ? <BackButton onClick={onBack} dark={dark} /> : <div style={{ width: 40 }} />}
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {title && (
        <div style={{ marginTop: compact ? 12 : 16 }}>
          <div style={{
            fontSize: compact ? 25 : 29, fontWeight: 700, lineHeight: 1.24,
            letterSpacing: '-0.015em', textWrap: 'pretty',
            color: dark ? K.onDark : Z.forest,
          } as CSSProperties}>{title}</div>
          {sub && (
            <div style={{
              fontSize: 13.5, marginTop: 7, lineHeight: 1.55,
              color: dark ? K.onDarkSoft : Z.muted,
            }}>{sub}</div>
          )}
        </div>
      )}
      {children}
      {!dark && tone === 'gold' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(300px 200px at 90% 0%, rgba(216,181,74,.14), transparent 70%)',
        }} />
      )}
    </div>
  );
}

/** Footer CTA dock. The fade matches the paper gradient it sits over. */
export function StickyBottom({ children, height = 110, tone = 'green' }: {
  children?: ReactNode; height?: number; tone?: 'green' | 'gold' | 'dark';
}) {
  const fades = {
    green: 'linear-gradient(180deg, rgba(224,236,229,0) 0%, rgba(224,236,229,0.92) 34%, #DFEBE4 62%)',
    gold:  'linear-gradient(180deg, rgba(232,225,201,0) 0%, rgba(232,225,201,0.92) 34%, #E8E1C9 62%)',
    dark:  'linear-gradient(180deg, rgba(8,35,27,0) 0%, rgba(8,35,27,0.92) 34%, #08231B 62%)',
  };
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 10,
      height,
      padding: '14px 20px 30px',
      background: fades[tone],
    }}>
      {children}
    </div>
  );
}

/**
 * Light-screen card. Defaults to the glass recipe; `solid` opts back into an
 * opaque white surface for dense content (long lists, forms) where the blur
 * would hurt legibility.
 */
export function Card({ children, onClick, style = {}, padding = 18, selected = false, raised = true, solid = false }: {
  children?: ReactNode; onClick?: () => void; style?: CSSProperties;
  padding?: number; selected?: boolean; raised?: boolean; solid?: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      ...(solid
        ? { background: Z.paper, boxShadow: raised ? '0 10px 26px rgba(13,59,46,0.07)' : 'none' }
        : glass('light', raised)),
      borderRadius: 22,
      padding,
      ...(selected ? { border: `1.5px solid ${Z.forest}`, boxShadow: '0 12px 28px rgba(13,59,46,0.14)' } : null),
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .15s, transform .12s, box-shadow .2s',
      ...style,
    }}>{children}</div>
  );
}

// ─── State primitives (handoff section 4A) ──────────────────────────────────
// Built once, reused by every loading / empty / progressive state.

/** 22px spinner ring — 900ms linear spin, accent on the top border only. */
export function Spinner({ size = 22, accent = Z.forest, track = 'rgba(13,59,46,0.22)', thickness = 2 }: {
  size?: number; accent?: string; track?: string; thickness?: number;
}) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      border: `${thickness}px solid ${track}`,
      borderTopColor: accent,
      display: 'inline-block',
      animation: 'kaffSpin .9s linear infinite',
    }} />
  );
}

/** Shimmering placeholder. `line` rounds fully for text runs. */
export function Skeleton({ width = '100%', height = 12, line = true, dark = false, style = {} }: {
  width?: number | string; height?: number; line?: boolean; dark?: boolean; style?: CSSProperties;
}) {
  const tint = dark
    ? 'linear-gradient(90deg, rgba(255,255,255,.10), rgba(255,255,255,.05), rgba(255,255,255,.10))'
    : 'linear-gradient(90deg, rgba(36,28,2,.10), rgba(36,28,2,.05), rgba(36,28,2,.10))';
  return (
    <div style={{
      width, height, borderRadius: line ? 99 : 10,
      background: tint, backgroundSize: '200% 100%',
      animation: 'kaffShimmer 1.2s ease-in-out infinite',
      ...style,
    }} />
  );
}

export type RowStatus = 'done' | 'active' | 'queued';

/**
 * Per-item progress row used by the scan / sync screens.
 * done = filled check · active = accent-tinted card + spinner + inline bar ·
 * queued = hollow ring at .55 opacity.
 */
export function StatusRow({ status, title, meta, right, progress, accent = Z.forest, dark = false }: {
  status: RowStatus; title: ReactNode; meta?: ReactNode; right?: ReactNode;
  progress?: number; accent?: string; dark?: boolean;
}) {
  const active = status === 'active';
  const done = status === 'done';
  const doneFill = dark ? K.lime : Z.forest;
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 18,
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: status === 'queued' ? 0.55 : 1,
      ...(active
        ? {
            background: dark ? 'rgba(216,181,74,0.14)' : 'rgba(216,181,74,0.16)',
            border: `1px solid ${accent}`,
          }
        : dark ? glass('dark') : glass('light')),
      transition: 'opacity .2s',
    }}>
      {done ? (
        <span style={{
          width: 22, height: 22, borderRadius: 999, flexShrink: 0,
          background: doneFill, color: dark ? '#123322' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'kaffPop .2s cubic-bezier(.2,1.4,.4,1)',
        }}><Icon name="check" size={13} strokeWidth={2.6} /></span>
      ) : active ? (
        <Spinner accent={accent} track={dark ? 'rgba(255,255,255,0.20)' : 'rgba(13,59,46,0.20)'} />
      ) : (
        <span style={{
          width: 22, height: 22, borderRadius: 999, flexShrink: 0,
          border: `1.5px solid ${dark ? 'rgba(255,255,255,0.35)' : 'rgba(13,59,46,0.28)'}`,
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, lineHeight: 1.35,
          color: dark ? K.onDark : Z.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</div>
        {meta && (
          <div style={{ fontSize: 11.5, marginTop: 2, color: dark ? K.onDarkFaint : Z.muted }}>{meta}</div>
        )}
        {active && progress !== undefined && (
          <div style={{
            marginTop: 7, height: 5, borderRadius: 999, overflow: 'hidden',
            background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(13,59,46,0.10)',
          }}>
            <div style={{
              height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`,
              background: accent, borderRadius: 999,
              transition: 'width .6s cubic-bezier(.2,.8,.2,1)',
            }} />
          </div>
        )}
      </div>

      {right && (
        <div style={{
          fontSize: 12, fontWeight: 600, flexShrink: 0,
          color: done ? (dark ? K.lime : Z.sage) : (dark ? K.onDarkFaint : Z.muted),
        }}>{right}</div>
      )}
    </div>
  );
}

/**
 * Progress ring. Animates 0 → value on mount (600ms ease-out) per the
 * handoff's motion note.
 */
export function ProgressRing({
  value, size = 230, stroke = 20, color = Z.forest, track = 'rgba(13,59,46,0.10)',
  gradient, children,
}: {
  value: number; size?: number; stroke?: number; color?: string; track?: string;
  gradient?: [string, string, string?]; children?: ReactNode;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), 30);
    return () => window.clearTimeout(t);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, shown));
  const gid = `kaffRing${Math.round(size)}${Math.round(stroke)}`;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {gradient && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset={gradient[2] ? '55%' : '100%'} stopColor={gradient[1]} />
              {gradient[2] && <stop offset="100%" stopColor={gradient[2]} />}
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${gid})` : color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>{children}</div>
    </div>
  );
}

/**
 * Empty state: glass circle icon → title → explanation → optional facts card
 * → optional dashed add-prompt → 1 primary + 1 secondary CTA.
 */
export function EmptyState({
  title, body, icon, dark = false, accent, children,
  primary, secondary, addPrompt,
}: {
  title: ReactNode; body?: ReactNode; icon?: ReactNode; dark?: boolean; accent?: string;
  children?: ReactNode;
  primary?: { label: ReactNode; onClick: () => void; tone?: 'dark' | 'gold' | 'olive' | 'lime' };
  secondary?: { label: ReactNode; onClick: () => void };
  addPrompt?: { label: ReactNode; sub?: ReactNode; onClick: () => void };
}) {
  const ring = accent || (dark ? K.lime : Z.forest);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <div style={{
          width: 110, height: 110, borderRadius: 999,
          ...glass(dark ? 'dark' : 'light', true),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 74, height: 74, borderRadius: 999,
            background: dark ? 'rgba(220,255,176,0.16)' : 'rgba(13,59,46,0.08)',
            color: ring,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'kaffPop .2s cubic-bezier(.2,1.4,.4,1)',
          }}>
            {icon || <Icon name="check" size={32} strokeWidth={2.4} color={ring} />}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 24, fontWeight: 700, lineHeight: 1.26, letterSpacing: '-0.015em',
            color: dark ? K.onDark : Z.forest, textWrap: 'balance',
          } as CSSProperties}>{title}</div>
          {body && (
            <div style={{
              marginTop: 8, fontSize: 13, lineHeight: 1.6,
              color: dark ? K.onDarkSoft : Z.muted, textWrap: 'pretty',
            } as CSSProperties}>{body}</div>
          )}
        </div>
      </div>

      {children}

      {addPrompt && (
        <button onClick={addPrompt.onClick} style={{
          width: '100%', textAlign: 'left',
          padding: '13px 14px', borderRadius: 18,
          border: `1px dashed ${dark ? 'rgba(255,255,255,0.22)' : 'rgba(13,59,46,0.22)'}`,
          background: 'transparent',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 10, flexShrink: 0,
            background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(13,59,46,0.07)',
            color: dark ? K.onDark : Z.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="plus" size={15} strokeWidth={2.2} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: dark ? K.onDark : Z.ink }}>{addPrompt.label}</span>
            {addPrompt.sub && (
              <span style={{ display: 'block', fontSize: 11.5, marginTop: 1, color: dark ? K.onDarkFaint : Z.muted }}>{addPrompt.sub}</span>
            )}
          </span>
        </button>
      )}

      {(primary || secondary) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {primary && (
            <GoldButton tone={primary.tone || (dark ? 'lime' : 'dark')} onClick={primary.onClick}>
              {primary.label}
            </GoldButton>
          )}
          {secondary && (
            <GhostButton dark={dark} onClick={secondary.onClick} style={{ width: '100%' }}>
              {secondary.label}
            </GhostButton>
          )}
        </div>
      )}
    </div>
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
      ...glass('light', true), borderRadius: 20, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {label && <div style={{ fontSize: 12.5, color: Z.muted, fontWeight: 500 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...NUM, fontSize: 28, color: Z.muted, fontWeight: 600 }}>฿</span>
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
            ...NUM,
            fontSize: 30, fontWeight: 700, color: Z.forest,
            letterSpacing: '-0.03em',
          }}
        />
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  // Asymmetric on purpose (handoff): − is a subtle tint, + is brand-filled.
  // It biases the user upward. Both keep a 48px hit area.
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const base: CSSProperties = {
    width: 48, height: 48, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
      <button onClick={dec} style={{
        ...base, background: 'rgba(13,59,46,0.08)', color: Z.forest,
      }}><Icon name="minus" size={20} strokeWidth={2} /></button>
      <div style={{
        minWidth: 80, textAlign: 'center', ...NUM,
        fontSize: 36, fontWeight: 700, color: Z.forest, letterSpacing: '-0.03em',
      }}>{value}</div>
      <button onClick={inc} style={{
        ...base, background: G.darkCTA, color: K.lime,
        boxShadow: '0 8px 18px rgba(13,59,46,0.24)',
      }}><Icon name="plus" size={20} strokeWidth={2.2} /></button>
    </div>
  );
}

export function NiyyahBox({ text, confirmed, onConfirm }: { text: ReactNode; confirmed: boolean; onConfirm: () => void }) {
  return (
    <div style={{
      background: G.darkCTA, color: K.onDark,
      borderRadius: 22, padding: 18,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 14px 32px rgba(13,59,46,0.24)',
    }}>
      <Eyebrow color={K.gold300} style={{ marginBottom: 8 }}>Niyyah · เนียต</Eyebrow>
      <div style={{
        fontSize: 15.5, lineHeight: 1.6, color: K.onDark, fontWeight: 500,
        marginBottom: 14, textWrap: 'pretty',
      } as CSSProperties}>{text}</div>
      <button onClick={onConfirm} style={{
        height: 44, padding: '0 18px', borderRadius: 14,
        ...(confirmed
          ? { background: K.lime, color: '#123322', border: 'none' }
          : { ...glass('dark', true), color: K.onDark }),
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontWeight: 700, fontSize: 14,
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
      background: active ? (color || Z.forest) : 'rgba(255,255,255,0.62)',
      color: active ? '#fff' : Z.forest,
      border: `1px solid ${active ? (color || Z.forest) : 'rgba(255,255,255,0.9)'}`,
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

/**
 * Large amount with the decimals dimmed to 50% — the hero treatment from the
 * handoff. Integers render without a decimal tail.
 */
export function Amount({ value, size = 44, color = Z.forest, style = {} }: {
  value: number; size?: number; color?: string; style?: CSSProperties;
}) {
  const hasDec = Math.round(value * 100) % 100 !== 0;
  const whole = Math.floor(value).toLocaleString('en-US');
  const dec = hasDec ? (value % 1).toFixed(2).slice(1) : '';
  return (
    <span style={{
      ...NUM, fontSize: size, fontWeight: 700, color,
      letterSpacing: size >= 40 ? '-0.04em' : '-0.02em', lineHeight: 1.05,
      ...style,
    }}>
      ฿{whole}{dec && <span style={{ opacity: 0.5 }}>{dec}</span>}
    </span>
  );
}

export function TrustBadge({ children }: { children?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 13px', borderRadius: 16,
      ...glass('light'),
      fontSize: 13, color: Z.forest, fontWeight: 500, lineHeight: 1.45,
    }}>
      <div style={{
        width: 22, height: 22, flexShrink: 0, borderRadius: 999,
        background: Z.forest, color: K.lime,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={14} strokeWidth={2.5} />
      </div>
      <span style={{ textWrap: 'pretty' } as CSSProperties}>{children}</span>
    </div>
  );
}

export type Tab = 'home' | 'faq' | 'history' | 'profile';

/**
 * Bottom tab bar — the white sheet from the handoff, full-bleed with a 28px
 * top radius. When `onFab` is supplied the bar splits around a raised FAB that
 * breaks the bar line (margin-top:-18px).
 */
export function BottomNav({ tab, onTab, onFab, children }: {
  tab: Tab; onTab: (t: Tab) => void; onFab?: () => void; children?: ReactNode;
}) {
  // Four tabs so the FAB sits dead centre with two on each side, matching
  // the handoff's 5-slot bar. Without the FAB they simply spread evenly.
  const items: { id: Tab; icon: ZIconName; label: string }[] = [
    { id: 'home', icon: 'home', label: 'หน้าหลัก' },
    { id: 'faq', icon: 'faq', label: 'คำถาม' },
    { id: 'history', icon: 'history', label: 'ประวัติ' },
    { id: 'profile', icon: 'profile', label: 'โปรไฟล์' },
  ];
  const left = onFab ? items.slice(0, 2) : items;
  const right = onFab ? items.slice(2) : [];

  const item = (it: { id: Tab; icon: ZIconName; label: string }) => {
    const active = tab === it.id;
    return (
      <button key={it.id} onClick={() => onTab(it.id)} style={{
        flex: 1, minWidth: 0, height: 52,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: active ? Z.forest : K.mutedSoft,
        gap: 3,
      }}>
        <Icon name={it.icon} size={21} strokeWidth={active ? 2 : 1.6} />
        <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: '0.01em' }}>{it.label}</span>
      </button>
    );
  };

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.90)',
      backdropFilter: 'blur(18px) saturate(180%)',
      WebkitBackdropFilter: 'blur(18px) saturate(180%)',
      borderRadius: '28px 28px 0 0',
      boxShadow: '0 -18px 50px rgba(0,0,0,0.18)',
      padding: '10px 14px calc(14px + env(safe-area-inset-bottom, 0px))',
      zIndex: 30,
    }}>
      {children}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {left.map(item)}
        {onFab && (
          <button onClick={onFab} aria-label="ให้เลย" style={{
            width: 52, height: 52, borderRadius: 20, flexShrink: 0,
            marginTop: -18, marginLeft: 6, marginRight: 6,
            background: 'linear-gradient(150deg,#0D3B2E,#2C7D53)',
            color: K.lime,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 14px 28px rgba(13,59,46,0.34)',
          }}>
            <Icon name="plus" size={24} strokeWidth={2.4} />
          </button>
        )}
        {right.map(item)}
      </div>
    </div>
  );
}

// Brand mark — inline SVG (matches /public/kaff-icon.svg). Uses currentColor so
// the surrounding tile can recolor it. `light=true` swaps the colorway.
export function KaffMark({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const tileBg = light ? '#fff' : Z.forest;
  const fg = light ? Z.forest : Z.gold;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: tileBg, color: fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 120 120" aria-label="Kaff">
        <g fill="currentColor">
          <rect x="30" y="10" width="7" height="20" rx="3.5" />
          <rect x="44" y="6"  width="7" height="24" rx="3.5" />
          <rect x="58" y="6"  width="7" height="24" rx="3.5" />
          <rect x="72" y="10" width="7" height="20" rx="3.5" />
        </g>
        <text x="55" y="108" textAnchor="middle"
              fontFamily="'IBM Plex Sans Arabic', 'Cairo', 'Sarabun', sans-serif"
              fontSize="92" fontWeight="500" fill="currentColor">ك</text>
      </svg>
    </div>
  );
}
