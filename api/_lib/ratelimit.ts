import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db.js';

interface Opts {
  // Identifier scope (e.g. 'donations'). Combined with caller IP into the bucket key.
  scope: string;
  // Max requests per window.
  max: number;
  // Window length in seconds.
  windowSeconds: number;
}

export function callerIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

// Returns true if the request is allowed; sends a 429 and returns false otherwise.
export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  { scope, max, windowSeconds }: Opts,
): Promise<boolean> {
  const ip = callerIp(req);
  const key = `${scope}:${ip}`;

  // Sliding window: if the bucket's window started > windowSeconds ago, reset it.
  // Increment counter; if it exceeds max, deny.
  const [row] = await sql`
    INSERT INTO rate_buckets (key, count, window_start)
    VALUES (${key}, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN NOW() - rate_buckets.window_start > make_interval(secs => ${windowSeconds})
          THEN 1
          ELSE rate_buckets.count + 1
      END,
      window_start = CASE
        WHEN NOW() - rate_buckets.window_start > make_interval(secs => ${windowSeconds})
          THEN NOW()
          ELSE rate_buckets.window_start
      END
    RETURNING count, window_start
  ` as { count: number; window_start: string }[];

  if (row.count > max) {
    res.setHeader('Retry-After', String(windowSeconds));
    res.status(429).json({ error: 'rate limit exceeded', retryAfterSeconds: windowSeconds });
    return false;
  }
  return true;
}
