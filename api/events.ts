import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { withErrors } from './_lib/handler.js';
import { optionalAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';

// POST /api/events
// Body: { events: [{ sessionId, event, flow?, step?, meta? }, ...] }
//
// Public, batched, fire-and-forget from the client. The session_id is a
// client-generated UUID kept in localStorage so we can stitch a user's
// journey together without storing PII at the visitor level.

const ALLOWED_EVENTS = [
  'page_view',
  'service_picked',
  'flow_step',
  'checkout_viewed',
  'donor_info_completed',
  'payment_method_chosen',
  'donation_started',
  'donation_completed',
  'policy_viewed',
  'sign_in_started',
] as const;

interface InEvent {
  sessionId?: unknown;
  event?: unknown;
  flow?: unknown;
  step?: unknown;
  meta?: unknown;
}

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? null;
}

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  // Burst-friendly: a typical session may send 10–30 events. The client
  // batches so per-IP we shouldn't see more than ~50 hits/minute even at
  // heavy usage.
  if (!(await rateLimit(req, res, { scope: 'events', max: 120, windowSeconds: 60 }))) return;

  const body = req.body as { events?: unknown } | undefined;
  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    return res.status(400).json({ error: 'events[] required' });
  }
  if (body.events.length > 50) {
    return res.status(400).json({ error: 'max 50 events per batch' });
  }

  const auth = await optionalAuth(req);
  const userId = auth?.userId ?? null;
  const ip = clientIp(req);
  const ua = (req.headers['user-agent'] as string | undefined) ?? null;
  const phase = process.env.KAFF_PHASE || 'closed_beta';

  // Best-effort insert. Failures here MUST NOT block the client — analytics
  // is advisory, not transactional.
  let accepted = 0;
  for (const raw of body.events as InEvent[]) {
    const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId.slice(0, 80) : null;
    const event = typeof raw.event === 'string' ? raw.event : null;
    if (!sessionId || !event) continue;
    if (!(ALLOWED_EVENTS as readonly string[]).includes(event)) continue;

    const flow = typeof raw.flow === 'string' ? raw.flow.slice(0, 32) : null;
    const step = typeof raw.step === 'string' ? raw.step.slice(0, 64) : null;
    const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null;

    try {
      await sql`
        INSERT INTO funnel_events (session_id, user_id, event, flow, step, meta, phase, ip, ua)
        VALUES (${sessionId}, ${userId}, ${event}, ${flow}, ${step},
                ${meta ? JSON.stringify(meta) : null}::jsonb,
                ${phase}, ${ip}, ${ua})
      `;
      accepted++;
    } catch (e) {
      console.error('funnel_events insert failed', e);
    }
  }
  return res.status(202).json({ accepted });
});
