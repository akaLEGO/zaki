// Minimal serverless endpoint to isolate runtime issues.
// No npm deps. If this 200s but other routes still fail, the problem is in our
// dependencies / imports, not the Vercel function runtime.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    ok: true,
    node: process.version,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    time: new Date().toISOString(),
  });
}
