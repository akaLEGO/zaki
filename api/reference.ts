// Aggregate reference data the consumer needs on app load.
// Replaces individual /api/asnaf, /api/recipients, /api/qurban-* fetches with a single round-trip.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';
import { withErrors } from './_lib/handler.js';

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (!(await rateLimit(req, res, { scope: 'read', max: 120, windowSeconds: 60 }))) return;
  const [asnaf, recipients, qurbanOptions, qurbanLocations, kaffarahTypes] = await Promise.all([
    sql`SELECT id, label, sub FROM asnaf ORDER BY display_order ASC`,
    sql`SELECT id, asnaf, name, received, area, fair FROM recipients ORDER BY id ASC`,
    sql`SELECT id, country, flag, price, currency, sub, animal, popular, special FROM qurban_options ORDER BY id ASC`,
    sql`SELECT id, flag, name, impact FROM qurban_locations ORDER BY id ASC`,
    sql`SELECT id, label, amount, sub FROM kaffarah_types`,
  ]);

  // Group recipients by asnaf for the existing AsnafRecipients map shape
  const recipientsByAsnaf: Record<string, typeof recipients> = {};
  for (const r of recipients) {
    const key = (r as { asnaf: string }).asnaf;
    (recipientsByAsnaf[key] ||= []).push(r);
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.json({
    asnaf,
    recipients: recipientsByAsnaf,
    qurbanOptions,
    qurbanLocations,
    kaffarahTypes,
  });
});
