# Kaff — Be the Upper Hand

Islamic Finance OS for Thai Muslims. Donate dignified — Riba clearance, Zakat (8 Asnaf), Fitrah/Fidyah/Kaffarah, Qurban, Sadaqah — in one place.

> *"The upper hand is better than the lower hand."* — Prophet Muhammad ﷺ (Sahih al-Bukhari 1429, Sahih Muslim 1033)
>
> **Kaff (كفّ)** is Arabic for "palm / hand." The brand reminds every donor that giving is an act of elevation.

## Stack

- **Vite + React 18 + TypeScript** — multi-page (consumer + admin)
- **Neon Postgres** (HTTP serverless driver) on Vercel
- **Clerk** for auth (admin gated, consumer optional)
- **Vercel Serverless Functions** (`api/`) for the API layer

## Run locally

```bash
npm install
npm run dev   # http://localhost:5173/index.html · /admin.html
```

For local API routes you need `vercel dev` instead of `vite` (so the `api/*.ts` functions execute).

## Env vars

See `.env.example`. On Vercel: Project Settings → Environment Variables.
- `VITE_CLERK_PUBLISHABLE_KEY` (client-side, must have `VITE_` prefix)
- `CLERK_SECRET_KEY` (server-only)
- `DATABASE_URL` (auto-injected by Neon-Vercel integration)

## DB setup

Run these in the Neon SQL Editor in order:
1. `db/schema.sql` — creates tables
2. `db/seed.sql` — seeds the catalog (orgs / asnaf / campaigns / qurban)
3. `db/002_security.sql` — admin allowlist + audit log + rate limiter
4. Manual: insert your own row into `admin_users` (your Clerk `user_id`)

## Deploy

Auto-deploys via Vercel's GitHub integration on push to `main`.
