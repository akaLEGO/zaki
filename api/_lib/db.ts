import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Lazy singleton so module load never crashes — even if DATABASE_URL is missing
// on a fresh deploy. Each function call resolves at request time and surfaces a
// readable error instead of FUNCTION_INVOCATION_FAILED.
let cached: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. On Vercel: Storage → your Neon DB → Connect to Project → zaki, then Redeploy.',
    );
  }
  cached = neon(url);
  return cached;
}

// Proxy that forwards every tagged-template / function call to the lazy client.
// Lets us keep the existing `sql\`SELECT ...\`` ergonomics.
export const sql = ((...args: unknown[]) => {
  const c = getClient() as unknown as (...a: unknown[]) => unknown;
  return c(...args);
}) as NeonQueryFunction<false, false>;
