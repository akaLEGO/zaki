// Aggregate reference data the consumer needs on app load.
// Replaces individual /api/asnaf, /api/recipients, /api/qurban-* fetches with a single round-trip.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [asnaf, recipients, qurbanOptions, qurbanLocations, kaffarahTypes] = await Promise.all([
    sql`SELECT id, label, sub FROM asnaf ORDER BY display_order ASC`,
    sql`SELECT id, asnaf, name, received, area, fair FROM recipients ORDER BY id ASC`,
    sql`SELECT country, flag, price, currency, sub, animal, popular, special FROM qurban_options ORDER BY id ASC`,
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
}
