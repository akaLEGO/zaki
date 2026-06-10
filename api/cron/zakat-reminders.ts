// Daily cron (see vercel.json) — emails everyone whose Zakat hawl
// anniversary arrives today, then advances their next_due_date by one
// lunar year so the reminder recurs annually.
//
// Vercel attaches `Authorization: Bearer ${CRON_SECRET}` to cron requests
// when the env var is set — we require it so randoms can't trigger sends.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { withErrors } from '../_lib/handler.js';
import { sendZakatReminderEmail } from '../_lib/email.js';

const HIJRI_YEAR_DAYS = 354;

export default withErrors(async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const due = await sql`
    SELECT id, email, name
    FROM zakat_reminders
    WHERE next_due_date <= CURRENT_DATE
      AND (last_sent_at IS NULL OR last_sent_at::date < next_due_date)
    LIMIT 100
  `;

  let sent = 0;
  const failures: string[] = [];
  for (const r of due as { id: number; email: string; name: string | null }[]) {
    const result = await sendZakatReminderEmail(r.email, r.name);
    if (result.sent) {
      sent++;
      await sql`
        UPDATE zakat_reminders
        SET last_sent_at = NOW(),
            next_due_date = next_due_date + ${HIJRI_YEAR_DAYS} * INTERVAL '1 day'
        WHERE id = ${r.id}
      `;
    } else {
      failures.push(`${r.email}: ${result.reason}`);
    }
  }
  if (failures.length) console.warn('zakat reminder failures', failures);
  return res.json({ due: due.length, sent, failed: failures.length });
});
