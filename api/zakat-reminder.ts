// Save (upsert) an annual Zakat hawl reminder. Public endpoint — donors
// register right from the success screen with one tap. The daily cron at
// /api/cron/zakat-reminders sends the email when next_due_date arrives.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db.js';
import { cors } from './_lib/cors.js';
import { rateLimit } from './_lib/ratelimit.js';
import { withErrors } from './_lib/handler.js';
import { validate } from './_lib/validate.js';

// One lunar (hijri) year ≈ 354 days — the hawl interval for Zakat.
const HIJRI_YEAR_DAYS = 354;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!(await rateLimit(req, res, { scope: 'write', max: 10, windowSeconds: 60 }))) return;

  const v = validate(req.body, {
    email: { type: 'string', required: true, max: 200, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
    name:  { type: 'string', max: 120 },
  });
  if (!v.ok) return res.status(400).json({ error: v.error });
  const b = v.value as { email: string; name?: string };
  const email = b.email.trim().toLowerCase();

  const due = new Date(Date.now() + HIJRI_YEAR_DAYS * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  const [row] = await sql`
    INSERT INTO zakat_reminders (email, name, next_due_date)
    VALUES (${email}, ${b.name ?? null}, ${due})
    ON CONFLICT (LOWER(email)) DO UPDATE SET
      next_due_date = EXCLUDED.next_due_date,
      name = COALESCE(EXCLUDED.name, zakat_reminders.name),
      last_sent_at = NULL
    RETURNING id, email, to_char(next_due_date, 'DD Mon YYYY') AS "nextDueDate"
  `;
  return res.status(201).json(row);
});
