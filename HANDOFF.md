# Kaff — Dev machine handoff

Everything you need to pick up on a new machine.

## 1 · Clone the repo

```bash
# Install gh first if you don't have it: brew install gh
gh auth login                     # one-time, web browser
gh repo clone akaLEGO/zaki kaff   # repo is still named 'zaki' on GitHub
cd kaff
```

(If `gh` isn't an option, use `git clone https://github.com/akaLEGO/zaki.git kaff` and authenticate with a personal access token when prompted.)

## 2 · Node + deps

```bash
# Need Node 20.x (matches Vercel's runtime). With nvm:
nvm install 20
nvm use 20

npm install
```

## 3 · Local env vars (`.env.local`)

Create `.env.local` in the project root with:

```ini
# Clerk — clerk.com → your "kaff" app → API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…

# Neon Postgres — neon.tech → your DB → Connection Details → .env.local tab
DATABASE_URL=postgresql://…

# PromptPay receiver. Optional locally — defaults to 0812345678 placeholder
# if unset. Set on Vercel for real money.
PROMPTPAY_ID=

# Base (Ethereum L2) wallet for USDC payments. Optional locally — defaults
# to a non-scannable placeholder if unset. Must be a 0x… 40-hex address.
KAFF_BASE_WALLET=

# Resend — sends a branded receipt email after every donation. Both must be
# set or no email goes out. From-address domain must be verified at resend.com.
RESEND_API_KEY=
RESEND_FROM_EMAIL=Kaff <hello@kaff.me>

# Testing mode banner — set to "false" ONLY when ready to accept real
# payments (real PROMPTPAY_ID + real bank account number in BankTransfer
# screen). Anything else keeps the red "DO NOT PAY" banner visible.
VITE_KAFF_TESTING_MODE=true
```

`.env.local` is in `.gitignore` so it never reaches the repo. The same three variables also need to be set on Vercel (already done — Settings → Environment Variables).

## 4 · Run locally

```bash
# Frontend only (no API routes work — just Vite serving HTML/JSX)
npm run dev

# Full stack (Vite + the api/ serverless functions)
npm i -g vercel
vercel link            # one-time, links the local repo to the zaki Vercel project
vercel dev             # http://localhost:3000
```

Production build sanity check:

```bash
npm run build          # tsc -b && vite build
```

## 5 · Push = deploy

Vercel watches `main` on the `akaLEGO/zaki` repo. Any `git push origin main` triggers a deploy automatically.

```bash
git add -A
git commit -m "your change"
git push origin main
```

## 6 · External services in play

| Service | What | Where |
|---|---|---|
| **GitHub** | source of truth · `akaLEGO/zaki` | github.com/akaLEGO/zaki |
| **Vercel** | hosting + serverless API + deploys | vercel.com → thesleeper's projects → zaki |
| **Neon** | Postgres DB (via Vercel Marketplace) | neon.tech (or Vercel → Storage → neon-citron-village) |
| **Clerk** | auth (admin gated, consumer optional) | clerk.com → kaff |
| **GoDaddy** | domain registrar for `kaff.me` | godaddy.com (DNS records there) |

## 7 · Database migrations

Run these in order in the Neon SQL Editor. Idempotent — safe to re-run.

1. `db/schema.sql`
2. `db/seed.sql`
3. `db/002_security.sql`
4. After signing in to Clerk on `/admin.html` once, run this with your real `user_…` id (find at clerk.com → Users → click yourself):

   ```sql
   INSERT INTO admin_users (user_id, role) VALUES ('user_YOURS', 'super');
   ```

5. `db/003_amil_fee.sql` — adds the `fee_amount` column
6. `db/004_partners.sql` — partners table, donation_events table, expanded donations.status state machine
7. `db/005_donor_info.sql` — donor contact columns
8. `db/006_is_test_flag.sql` — `is_test` column + backfill existing rows as test
9. `db/007_aml_phase_a.sql` — `donor_ip`, `donor_ua`, `risk_tier` columns + backfill tier by amount

## 8 · Project layout

```
.
├── admin.html              ← admin entry point (Vite)
├── index.html              ← consumer entry point (Vite)
├── package.json            ← deps, scripts; Node 20.x pinned
├── vite.config.ts          ← multi-page Vite config
├── tsconfig.json
├── .env.example            ← template; copy to .env.local
│
├── public/                 ← static assets served as-is
│   ├── kaff-icon.svg
│   ├── kaff-favicon.svg
│   ├── kaff-app-icon.svg
│   ├── kaff-wordmark.svg
│   ├── kaff-lockup-{horizontal,stacked}.svg
│   └── kaff-icon-currentColor.svg
│
├── src/
│   ├── admin/              ← admin app
│   │   ├── AdminApp.tsx    ← root + sidebar
│   │   ├── AdminScreens.tsx ← Dashboard / Campaigns / Orgs+Recipients
│   │   ├── AdminUI.tsx     ← admin design system (AZ palette)
│   │   ├── BrowserWindow.tsx ← Chrome chrome around the admin
│   │   └── main.tsx        ← Clerk gate + bootstrap
│   ├── consumer/           ← iPhone-frame consumer app
│   │   ├── KaffApp.tsx     ← root + screen router
│   │   ├── KaffHome.tsx    ← home / history / profile
│   │   ├── KaffServices.tsx ← Riba / Zakat / Wajib / Qurban / Sadaqah flows
│   │   ├── KaffPayment.tsx ← Checkout / QR / Bank / Success
│   │   ├── KaffFaq.tsx
│   │   ├── KaffUI.tsx      ← consumer design system (Z palette) + KaffMark
│   │   ├── IosFrame.tsx    ← iPhone chrome
│   │   ├── TweaksPanel.tsx ← design-time controls (Home layout, Wajib wording)
│   │   └── main.tsx
│   ├── lib/                ← shared by both apps
│   │   ├── api.ts          ← fetch wrapper + Clerk token attach
│   │   ├── brand.tsx       ← <KaffGlyph /> SVG mark
│   │   ├── clerk-token-bridge.tsx
│   │   ├── data-context.tsx ← <DataProvider> + useData()
│   │   └── fee.ts          ← AMIL_FEE_RATE policy (client mirror)
│   ├── shared/
│   │   └── types.ts        ← Org, Asnaf, Campaign, … interfaces
│   └── vite-env.d.ts
│
├── api/                    ← Vercel serverless functions
│   ├── _lib/               ← shared helpers
│   │   ├── auth.ts         ← requireAuth / requireAdmin / optionalAuth
│   │   ├── audit.ts        ← writes to audit_log
│   │   ├── cors.ts         ← allowlist: kaff.me + *.vercel.app
│   │   ├── db.ts           ← lazy Neon HTTP client
│   │   ├── fee.ts          ← AMIL_FEE_RATE (server mirror)
│   │   ├── handler.ts      ← withErrors() wrapper
│   │   ├── ratelimit.ts    ← Postgres-backed sliding-window limiter
│   │   └── validate.ts     ← zero-dep input validator
│   ├── campaigns/
│   │   ├── index.ts        ← GET list / POST create
│   │   └── [id].ts         ← PATCH / DELETE
│   ├── donations/
│   │   └── mine.ts         ← GET donations for the signed-in user
│   ├── kaffarah-types/
│   │   └── [id].ts         ← PATCH (admin only)
│   ├── orgs/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── partners/
│   │   ├── index.ts        ← GET list / POST create (admin only)
│   │   └── [id].ts         ← PATCH / DELETE (admin only)
│   ├── promptpay/
│   │   └── qr.ts           ← GET ?amount=N → SVG QR
│   ├── qurban-locations/
│   │   ├── index.ts        ← POST (admin only)
│   │   └── [id].ts         ← PATCH / DELETE (admin only)
│   ├── qurban-options/
│   │   ├── index.ts        ← POST (admin only)
│   │   └── [id].ts         ← PATCH / DELETE (admin only)
│   ├── recipients/
│   │   ├── index.ts        ← GET list / POST (admin only)
│   │   └── [id].ts         ← PATCH / DELETE (admin only)
│   ├── donations/
│   │   ├── [id].ts         ← GET donation + events (admin only)
│   │   ├── [id]/transition.ts ← POST state transition (admin only)
│   │   └── mine.ts         ← GET donations for the signed-in user
│   ├── admin-users.ts      ← GET (admin only)
│   ├── audit-log.ts        ← GET (admin only) ?limit=N
│   ├── donations.ts        ← GET (admin only) / POST (anon ok)
│   ├── health.ts           ← diagnostic
│   └── reference.ts        ← bundled asnaf / recipients / qurban-* / kaffarah-types
│
└── db/                     ← run these in Neon SQL Editor
    ├── schema.sql
    ├── seed.sql
    ├── 002_security.sql
    └── 003_amil_fee.sql
```

## 9 · Where we left off (state)

- **Phase 1 (backend + auth + persistence):** DONE. Verified live.
- **Brand:** Zaki → Kaff fully applied. New palette, fonts (Manrope + Sarabun + IBM Plex Sans Arabic), SVG mark, favicon, OG meta.
- **Amil fee policy:** Live. Riba = 0%, others = 5% to Kaff as Amil. Server-computed in `/api/donations`, displayed in CheckoutScreen.
- **PromptPay QR:** Real EMVCo generation via `promptpay-qr` + `qrcode`. Set `PROMPTPAY_ID` on Vercel to receive real money.
- **Custom domain `kaff.me`:** In progress. DNS configured at GoDaddy → cleaning up old A records + adding `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`. After it propagates, add `https://kaff.me` to Clerk's allowed origins.
- **History/Profile:** Reads real `/api/donations/mine`. Sign-in prompts inline.

## 10 · Open items

- **Rotate secrets** that ended up in chat transcripts: Clerk secret key (`sk_test_…`), all GitHub PATs.
- **Finish kaff.me DNS** at GoDaddy → wait → Clerk allowed-origins update.
- **Before accepting real money — switch off testing mode:**
  1. Decide where the money goes (foundation partner, registered Kaff Foundation, or Social Enterprise — see compliance memo)
  2. Set Vercel env: `PROMPTPAY_ID=<real phone/tax-id>` of the receiving account
  3. Update bank account constants in `src/consumer/KaffPayment.tsx` (BankTransfer fields `bank`, `name`, `no`)
  4. Set Vercel env: `VITE_KAFF_TESTING_MODE=false`
  5. Redeploy → red "DO NOT PAY" banner disappears
- **AML Phase A — DONE.** /api/donations enforces ฿5,000/donation + ฿20,000/30days/donor caps on real donations (test rows exempt so beta flow still works). Logs donor_ip + donor_ua + auto-tags risk_tier (low/medium/high/enhanced) by amount. Checkout shows an AML disclaimer card with the cap thresholds. **Run `db/007_aml_phase_a.sql` on Neon before deploying.** Phase B-D (Thai ID + occupation + ID-photo upload + source-of-funds + AMLO reporting) still pending — consult Thai AML lawyer first (~฿15-30k retainer).
- **Phase 2c:** Slip2Go (or alternative) auto-verification of bank slips.
- **Phase 3 — admin screens:** DONE. All four wired (Rates, Transactions, Shariah Board, Roles & Audit). New endpoints: `/api/audit-log`, `/api/admin-users`, `/api/kaffarah-types/[id]` (PATCH).
- **Phase 4 — partner fulfillment:** DONE (UI/API). State machine `pending → paid → awaiting_partner → partner_confirmed → completed` (or `partner_rejected → refunded`). Admin Transactions row → drawer with workflow buttons + timeline. Partners managed at OPERATIONS → Partners. **Run `db/004_partners.sql` on Neon before deploying.**
- **Phase 4 — remaining:** auto-notify partners (email/LINE), payment refund integration (today refund is manual + recorded), consumer-side state transitions on payment confirmation.
- **Phase 3 — remaining:** LINE share deeplink · EN/TH toggle.
- **Update bank-transfer screen** with your real Foundation account once you have one.

---

If something breaks on the new machine, the fastest diagnostic is:

```bash
curl https://zaki-git-main-thesleepers-projects.vercel.app/api/health
```

If that returns JSON with `hasDatabaseUrl: true` and `hasClerkSecret: true`, the deploy is healthy and the issue is local to your machine.
