import { verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

export interface AuthedUser {
  userId: string;
  sessionId: string;
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthedUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  const rows = await sql`SELECT 1 FROM admin_users WHERE user_id = ${user.userId} LIMIT 1`;
  if (rows.length === 0) {
    res.status(403).json({ error: 'admin access required' });
    return null;
  }
  return user;
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return null;
  }
  const token = header.slice('Bearer '.length);
  try {
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return { userId: claims.sub, sessionId: claims.sid as string };
  } catch (e) {
    res.status(401).json({ error: 'invalid token', detail: String(e) });
    return null;
  }
}

// Optional auth — returns null if no/invalid token, but doesn't 401.
// Used by /api/donations to attach user_id when signed in, allow anonymous otherwise.
export async function optionalAuth(req: VercelRequest): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return { userId: claims.sub, sessionId: claims.sid as string };
  } catch {
    return null;
  }
}
