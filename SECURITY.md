# AuraSend — Security Architecture & Hardening Guide

AuraSend enforces multi-layered production security designed for commercial SaaS operations.

---

## 1. Authentication & Role-Based Access Control (RBAC)

- **JWT Session Security**: Auth tokens are signed using `jose` with `HS256` and stored in `httpOnly`, `sameSite=lax`, `secure` cookies.
- **Role Enforcement**:
  - `MASTER` / `ADMIN`: Access to `/admin`, `/api/admin/*`, global logs, and user plan overrides.
  - `USER`: Access restricted strictly to own workspace and owned resources.
- **Server-Side Enforcement**: All `/admin` page paths and `/api/admin/*` endpoints reject non-admin requests at the Next.js middleware and API layer.

---

## 2. IDOR Protection

All resource endpoints (`/api/leads/[id]`, `/api/campaigns/[id]`, `/api/gmail/[id]`, etc.) invoke `verifyResourceOwnership(userId, model, resourceId)` server-side. Changing URL parameters or payload IDs returns `HTTP 403 Forbidden` / `404 Not Found`.

---

## 3. Atomic Rate Limiting & Usage Entitlements

- **API Request Rate Limiting**: In-memory and DB window limiter protects against brute-force and credential stuffing attempts on `/api/auth/*` and `/api/ai/*`.
- **Atomic Entitlements**: Usage increments (`consumeUsage()`) use PostgreSQL atomic updates inside database transactions, preventing race-condition quota bypasses when multiple requests arrive simultaneously.

---

## 4. Encryption at Rest

Connected Gmail and SMTP credentials (`accessToken`, `refreshToken`, `appPassword`) are encrypted using **AES-256-GCM** before writing to PostgreSQL. Raw OAuth tokens are never returned in client API responses.

---

## 5. Gemini AI Prompt Injection Defense

- Lead metadata (scraped website text, company notes) is strictly isolated inside XML `<LEAD_DATA>` blocks.
- System instructions direct Gemini to treat lead text strictly as passive data and prohibit fact fabrication.
- Model outputs are validated against strict Zod schemas before persistence.

---

## 6. Stripe Payment Verification

- Subscriptions are updated ONLY after verifying Stripe webhook signatures (`stripe.webhooks.constructEvent`).
- Unique Stripe event IDs are tracked in `PaymentEvent` to prevent duplicate processing.
- Frontend payment success callbacks are never trusted to mark accounts active.
