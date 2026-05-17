import { verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthedUser {
  userId: string;
  sessionId: string;
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
