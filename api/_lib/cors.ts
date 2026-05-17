import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowlist of origins that may call the API from a browser.
// `*.vercel.app` for the zaki deploys + the prod custom domain if you add one.
const STATIC_ALLOW = new Set<string>([
  // Add your custom domain here when you set one up:
  // 'https://zaki.app',
]);

const VERCEL_SUFFIX = '.vercel.app';

function isAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (STATIC_ALLOW.has(origin)) return true;
  try {
    const u = new URL(origin);
    return u.hostname.endsWith(VERCEL_SUFFIX);
  } catch {
    return false;
  }
}

// Apply CORS headers. Returns true if the request should continue, false if we already sent a response (preflight).
export function cors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  if (isAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}
