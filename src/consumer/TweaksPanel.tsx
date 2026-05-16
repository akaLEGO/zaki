import { useState } from 'react';
import type { ReactNode } from 'react';

export function useTweaks<T extends object>(defaults: T): [T, <K extends keyof T>(k: K, v: T[K]) => void] {
  const [state, setState] = useState<T>(defaults);
  const set = <K extends keyof T>(k: K, v: T[K]) => setState(prev => ({ ...prev, [k]: v }));
  return [state, set];
}

export function TweaksPanel({ title = 'Tweaks', children }: { title?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 2147483646,
      width: open ? 260 : 'auto',
      background: 'rgba(250,249,247,0.85)',
      color: '#29261b',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: '0.5px solid rgba(255,255,255,0.6)',
      borderRadius: 14,
      boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18)',
      font: '11.5px/1.4 ui-sans-serif, system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 600, color: 'inherit', cursor: 'pointer',
      }}>
        <span>{title}</span>
        <span style={{ opacity: 0.5 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function TweakSection({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: 'rgba(41,38,27,0.45)', padding: '10px 0 0',
    }}>{label}</div>
  );
}

export function TweakRadio<V extends string>({ label, value, options, onChange }: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(41,38,27,0.72)', fontWeight: 500 }}>
        <span>{label}</span>
      </div>
      <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }}>
        {options.map(o => {
          const active = o.value === value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)} style={{
              flex: 1, padding: '5px 8px', borderRadius: 6,
              background: active ? 'rgba(255,255,255,0.95)' : 'transparent',
              color: 'inherit', fontWeight: active ? 600 : 500,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer', fontSize: 11.5,
            }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}
