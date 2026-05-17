import type { VercelRequest } from '@vercel/node';
import { sql } from './db.js';

export async function audit(
  req: VercelRequest,
  action: string,
  resourceId: string | null,
  userId: string | null,
  payload?: unknown,
): Promise<void> {
  try {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
      || (req.socket?.remoteAddress ?? null);
    const ua = (req.headers['user-agent'] as string | undefined) ?? null;
    await sql`
      INSERT INTO audit_log (user_id, action, resource_id, payload, ip, user_agent)
      VALUES (${userId}, ${action}, ${resourceId}, ${JSON.stringify(payload ?? null)}::jsonb, ${ip}, ${ua})
    `;
  } catch (e) {
    console.error('audit log failed', e);
  }
}
