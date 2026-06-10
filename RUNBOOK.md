# Kaff — Deploy / Go-Live RUNBOOK

Single source of truth for taking Kaff from code-complete to live. Work
top to bottom. Steps are grouped: **DB → Env → Admin access → Go-live →
Verify**. Nothing here is code — the app is code-complete; this is config
+ legal.

> Live URLs: consumer `https://kaff.me/` · admin `https://kaff.me/admin.html`
> · design preview `https://kaff.me/?preview`

---

## 0. Prerequisites (one-time)

- [ ] Neon project connected to the Vercel project (DATABASE_URL auto-injected)
- [ ] Clerk app created; `VITE_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` set on Vercel
- [ ] Domain `kaff.me` verified on Vercel

---

## 1. Database migrations (Neon SQL Editor)

Run **in order**, top to bottom. All are idempotent (safe to re-run). If a
fresh DB, run `schema.sql` then `seed.sql` first.

```
db/schema.sql            (fresh DB only — base tables)
db/seed.sql              (fresh DB only — orgs/asnaf/campaigns/qurban/kaffarah)
db/002_security.sql      admin_users, audit_log, rate_buckets
db/003_amil_fee.sql      fee_amount column (legacy; fee now 0)
db/004_partners.sql      partners, donation_events, donation status state machine
db/005_donor_info.sql    donor_first_name/last_name/email/phone/line_id
db/006_is_test_flag.sql  is_test + backfill existing rows TRUE
db/007_aml_phase_a.sql   donor_ip, donor_ua, risk_tier
db/008_funnel_events.sql funnel_events table + donations.phase
db/009_tipping_model.sql flow='tip' + parent_donation_id
db/010_slip_verification.sql  slip_image + slip_uploaded_at
db/011_donation_targets.sql   campaign_id + org_id + counted_in_raised
db/012_dedication_zakat_reminders.sql  dedication column + zakat_reminders table
```

How: Neon → SQL Editor → paste each file's contents → Run. A green
"success" or "already exists, skipping" notices = good. Red ERROR = stop
and report.

- [ ] Ran 002 → 011 (in order)
- [ ] No red errors

---

## 2. Vercel environment variables

Project Settings → Environment Variables. Set for **Production** (and
Preview if you test there).

### Required to function
| Var | Value | Notes |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | Clerk → API Keys |
| `CLERK_SECRET_KEY` | `sk_live_…` | Clerk → API Keys |
| `DATABASE_URL` | (auto) | Neon integration injects this |

### Payments — required before accepting real money
| Var | Value | Notes |
|---|---|---|
| `PROMPTPAY_NGO_ID` | phone or 13-digit Thai ID | donations land here (100%) |
| `PROMPTPAY_KAFF_ID` | phone or 13-digit Thai ID | tips land here |
| `KAFF_BASE_WALLET` | `0x…` 40-hex | USDC on Base; optional — unset = "DO NOT SEND" placeholder |

> `PROMPTPAY_ID` (legacy single var) is honored as a fallback for the NGO
> target if `PROMPTPAY_NGO_ID` is unset.

### Email receipts (optional but recommended)
| Var | Value | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_…` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | `Kaff <hello@kaff.me>` | domain must be verified at resend.com |

### Campaign / safety flags
| Var | Value | Notes |
|---|---|---|
| `KAFF_PHASE` | `closed_beta` | stamps donations + funnel rows; bump to `soft_launch` / `public` as you roll out |
| `VITE_KAFF_TESTING_MODE` | `true` | **keep `true` until ready for real money** (see §4) |
| `VITE_LIFF_ID` | `1234567890-AbCdEfGh` | only needed for `/liff.html` (LINE) — leave unset if not using LIFF yet |
| `CRON_SECRET` | any random string | guards the daily zakat-reminder cron (vercel.json schedules it 08:00 ICT) |

- [ ] Clerk keys set
- [ ] PromptPay NGO + Kaff set (real accounts)
- [ ] Resend set (or accept: no receipt emails)
- [ ] `KAFF_PHASE` set

---

## 3. Grant yourself admin access

Without a row in `admin_users`, the admin API returns 403 even after Clerk
sign-in.

1. Sign in once at `https://kaff.me/admin.html` (creates your Clerk user)
2. Find your Clerk user id: clerk.com → Users → your user → copy `user_…`
3. Neon SQL Editor:
   ```sql
   INSERT INTO admin_users (user_id, email, role)
   VALUES ('user_REPLACE_ME', 'you@example.com', 'super')
   ON CONFLICT (user_id) DO NOTHING;
   ```

- [ ] My Clerk user is in admin_users

---

## 4. Go-live switch (when §1–3 done + legal cleared)

⚠️ Do NOT flip until: real PromptPay accounts set, bank-transfer account
number updated in code (ask dev — `src/consumer/KaffPayment.tsx` BankTransfer
fields), and the money-routing legal question is resolved (registered
foundation or licensed partner).

1. Vercel env: `VITE_KAFF_TESTING_MODE=false`
2. Redeploy (Deployments → ⋯ → Redeploy, or push any commit)
3. Verify the red "DO NOT PAY" banner is **gone** and the QR is a real
   scannable code (§5)

- [ ] Bank account number updated in code
- [ ] Money-routing legal resolved
- [ ] `VITE_KAFF_TESTING_MODE=false` + redeployed

---

## 5. Post-deploy verification

```
☐ curl https://kaff.me/api/health → {"ok":true,...}
☐ kaff.me loads full-screen (no iPhone frame, no EN button)
☐ Home shows featured Qurban card on top
☐ Donate flow → Checkout → donor form required → pay screen
☐ (live) QR scans to the REAL account in a bank app
☐ (live) slip upload required before "ยืนยันการโอน"
☐ Success screen → tip section appears (no "tip" wording)
☐ admin.html → sign in → see real name in sidebar (not "เนตร W.")
☐ admin Transactions → pending donation shows slip + approve/reject
☐ approve a pending → campaign/org progress bar moves
☐ Roles & Audit → audit log shows the actions
```

---

## 6. Rolling out beyond closed beta

Before widening past friends & family:
- [ ] Consult a Thai AML lawyer (~฿15-30k) — see `memory/project_compliance_roadmap.md`
- [ ] AML Phase B (Thai ID + occupation on donations > ฿10k) when raising caps
- [ ] Tax-deductible receipt: requires a Revenue-Department-approved entity
- [ ] Bump `KAFF_PHASE` → `soft_launch` then `public`
- [ ] Bump app version in `package.json` (`0.5.0-beta.1` → `1.0.0-rc.1` → `1.0.0`)

---

## Quick reference — what's deferred to V1.1+

LIFF shareTargetPicker (#55) · Quota system ("โอกาส") · EN/TH i18n ·
Slip2Go auto-verify · automated refunds · tax-receipt PDF generation ·
"follow orgs" · in-app Shariah Q&A.
