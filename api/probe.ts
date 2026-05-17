// Probe each of my _lib modules individually to find which one crashes on import.
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function tryLoad(label: string, loader: () => Promise<unknown>) {
  try {
    const mod = await loader();
    return { label, ok: true, keys: Object.keys(mod as object) };
  } catch (e) {
    return {
      label,
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}\n${e.stack?.split('\n').slice(0, 5).join('\n')}` : String(e),
    };
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results = [];
  results.push(await tryLoad('./_lib/db', () => import('./_lib/db')));
  results.push(await tryLoad('./_lib/auth', () => import('./_lib/auth')));
  results.push(await tryLoad('./_lib/audit', () => import('./_lib/audit')));
  results.push(await tryLoad('./_lib/validate', () => import('./_lib/validate')));
  results.push(await tryLoad('./_lib/cors', () => import('./_lib/cors')));
  results.push(await tryLoad('./_lib/ratelimit', () => import('./_lib/ratelimit')));
  results.push(await tryLoad('./_lib/handler', () => import('./_lib/handler')));
  res.json({ node: process.version, results });
}
