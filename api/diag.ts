// Diagnostic — tries each problematic dep in isolation so we see WHICH one is
// failing module load.
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function tryLoad<T>(label: string, loader: () => Promise<T>) {
  try {
    const mod = await loader();
    return { label, ok: true, keys: Object.keys(mod as object).slice(0, 8) };
  } catch (e) {
    return { label, ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results = await Promise.all([
    tryLoad('@neondatabase/serverless', () => import('@neondatabase/serverless')),
    tryLoad('@clerk/backend',           () => import('@clerk/backend')),
  ]);
  res.json({ node: process.version, results });
}
