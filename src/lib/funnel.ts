// Lightweight client-side funnel tracker. Persists a session id in
// localStorage, batches events with a 2-second debounce, and posts to
// /api/events. Everything is fire-and-forget — analytics must never break
// the donation flow.

type EventName =
  | 'page_view'
  | 'service_picked'
  | 'flow_step'
  | 'checkout_viewed'
  | 'donor_info_completed'
  | 'payment_method_chosen'
  | 'donation_started'
  | 'donation_completed'
  | 'policy_viewed'
  | 'sign_in_started'
  | 'tip_shown'
  | 'tip_selected'
  | 'tip_skipped'
  | 'tip_completed';

interface FunnelEvent {
  sessionId: string;
  event: EventName;
  flow?: string;
  step?: string;
  meta?: Record<string, unknown>;
}

const SESSION_KEY = 'kaff:session_id';
const QUEUE: Omit<FunnelEvent, 'sessionId'>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
      + '-' + Date.now().toString(36);
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // private mode / quota — fall back to in-memory id for this tab
    return 'mem-' + Math.random().toString(36).slice(2);
  }
}

async function flush() {
  flushTimer = null;
  if (QUEUE.length === 0) return;
  const sessionId = getSessionId();
  const batch = QUEUE.splice(0, QUEUE.length).map(e => ({ ...e, sessionId }));
  try {
    // Use sendBeacon when leaving the page is plausible — it survives a
    // navigation. fetch with keepalive is the close-enough fallback.
    const body = JSON.stringify({ events: batch });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/events', blob);
      if (ok) return;
    }
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Swallow — analytics failures must never surface to the user.
  }
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => { void flush(); }, 2000);
}

export function track(event: EventName, opts: { flow?: string; step?: string; meta?: Record<string, unknown> } = {}) {
  if (typeof window === 'undefined') return;
  QUEUE.push({ event, flow: opts.flow, step: opts.step, meta: opts.meta });
  scheduleFlush();
}

// Force flush — useful on unmount / page hide.
export function flushNow() {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  void flush();
}

// Hook up the page-hide flush once at module load.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushNow);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushNow();
  });
}
