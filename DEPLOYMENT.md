# AuraSend (ColdMail.os) — Production Deployment Guide (Vercel)

This guide walks you through deploying **AuraSend** directly to Vercel with a PostgreSQL database (Supabase / Neon), Google Gemini AI, Stripe Billing, and Vercel Cron jobs — completely without requiring a VPS.

---

## 1. Prerequisites

- **Vercel Account**: [https://vercel.com](https://vercel.com)
- **Managed PostgreSQL Database**:
  - Supabase: [https://supabase.com](https://supabase.com)
  - OR Neon PostgreSQL: [https://neon.tech](https://neon.tech)
- **Stripe Developer Account**: [https://stripe.com](https://stripe.com)
- **Google Cloud Console (Gemini API & OAuth)**: [https://console.cloud.google.com](https://console.cloud.google.com)

---

## 2. Environment Variables Setup

Configure the following environment variables in your Vercel Project Settings (`Settings -> Environment Variables`):

```env
# Core Security
JWT_SECRET=your_long_random_64_char_secret_key
ENCRYPTION_SECRET=your_32_char_secret_key_for_oauth_token_encryption

# Database Connections
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgboiler=true&connection_limit=10"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# App & Domain Configuration
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com

# Stripe Payments & Subscriptions
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...

# Google Gemini AI API Key
GEMINI_API_KEY=AIzaSy...

# Google OAuth (Gmail Account Integration)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Transactional Email (Nodemailer fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@yourdomain.com
SMTP_PASS=your-app-password

# Vercel Cron Security Secret
CRON_SECRET=your_long_random_cron_secret
```

---

## 3. Safe Database Migration to PostgreSQL

1. Export local SQLite data to PostgreSQL:
   ```bash
   npx prisma db push
   npx tsx scripts/migrate-sqlite-to-pg.ts
   ```
2. Verify row count reconciliation report in console.

---

## 4. Stripe Webhook Configuration

1. Log into your Stripe Dashboard -> Developers -> Webhooks.
2. Add Endpoint URL: `https://your-custom-domain.com/api/billing/webhook`.
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy `Signing Secret` (`whsec_...`) into your Vercel `STRIPE_WEBHOOK_SECRET` environment variable.

---

## 5. Custom Domain & Vercel Deploy

1. Link project to Vercel:
   ```bash
   vercel --prod
   ```
2. In Vercel Project Settings -> Domains, add your custom production domain (e.g. `app.yourdomain.com`).
3. Configure DNS CNAME/A records as directed by Vercel.
4. Verify HTTPS certificate auto-issuance.
