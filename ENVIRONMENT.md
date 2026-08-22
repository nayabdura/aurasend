# AuraSend — Environment Variables Reference

Below is the complete reference of all environment variables required for **AuraSend (ColdMail.os)** in production.

---

## Secret Server-Only Variables (NEVER expose to client)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pooler URI | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | PostgreSQL direct connection URI for migrations | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key used to sign JWT auth cookies | `openssl rand -base64 64` |
| `ENCRYPTION_SECRET` | Key used for AES-256-GCM OAuth token encryption | `openssl rand -hex 16` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |
| `STRIPE_SECRET_KEY` | Stripe Secret API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | `whsec_...` |
| `CRON_SECRET` | Secret key authorizing Vercel Cron endpoints | `random_cron_secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for Gmail integration | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` |

---

## Client Public Variables (Next.js `NEXT_PUBLIC_`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public production domain URL | `https://aurasend.com` |

---

> [!CAUTION]
> NEVER expose `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`, or `JWT_SECRET` via `NEXT_PUBLIC_` variables. Doing so will leak API credentials to the browser.
