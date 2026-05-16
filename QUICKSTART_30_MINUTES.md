# Precise GovCon — Best Next 30 Minutes Quickstart

This quickstart is optimized for a first successful local run on **Saturday, May 16, 2026**.

## 0) Prerequisites (2 minutes)

- Node.js 20+ and npm
- A Postgres database (Neon/local/docker)
- (Optional for full features) API keys for SAM.gov, Anthropic, Resend, Stripe

## 1) Install dependencies (2 minutes)

```bash
npm install
```

## 2) Create local env file (5 minutes)

Create `.env.local` in the repo root with the following values.

> Tip: start with the **Minimum to boot** block, then add feature keys.

### Minimum to boot

```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

### Core app/data/search

```bash
SAM_GOV_API_KEY=your-sam-gov-key
SAM_API_KEY=your-sam-gov-key
SAMGOVAPIKEY=your-sam-gov-key
NEXT_PUBLIC_SAM_API_KEY=your-sam-gov-key
```

### AI features (optional)

```bash
ANTHROPIC_API_KEY=your-anthropic-key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

### Email/notifications (optional)

```bash
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=Precise GovCon <noreply@yourdomain.com>
EMAIL_FROM=Precise GovCon <noreply@yourdomain.com>
SUPPORT_EMAIL=support@yourdomain.com
SALES_EMAIL=sales@yourdomain.com
```

### Billing/Stripe (optional)

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...
```

### Scheduled jobs / admin / security (optional but useful)

```bash
CRON_SECRET=replace-with-random-secret
ADMIN_SECRET=replace-with-random-secret
DEBUG_SECRET=replace-with-random-secret
MARKETING_UNSUBSCRIBE_SECRET=replace-with-random-secret
```

## 3) Initialize database (5 minutes)

```bash
npx prisma generate
npx prisma migrate deploy
```

If you are creating a brand-new local DB, you can use:

```bash
npx prisma migrate dev
```

## 4) Run the app (1 minute)

```bash
npm run dev
```

Open: `http://localhost:3000`

## 5) Pages to open first (10 minutes guided tour)

### Marketing and product overview
- `/` (landing)
- `/features` (feature catalog)
- `/pricing` and `/pricing/trial`
- `/docs` (placeholder docs area)

### Core platform workflows
- `/signup` then `/login`
- `/search` (main opportunity discovery)
- `/alerts`, `/alerts/manage-searches`, `/alerts/manage-alerts`
- `/dashboard`, `/dashboard/saved-opportunities`, `/dashboard/deadlines`
- `/account`, `/account/profile`, `/account/settings`, `/account/billing`

### Useful API smoke checks in browser/curl
- `/api/ticker`
- `/api/sam/live-ticker`
- `/api/search`
- `/api/saved-searches`
- `/api/insights`

## 6) Validate before committing/deploying (5 minutes)

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Or run the all-in-one check:

```bash
npm run verify
```

## Troubleshooting quick notes

- If login/session flows fail, verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
- If search/SAM feeds are empty, verify your SAM API key vars (`SAM_GOV_API_KEY`/`SAM_API_KEY`/`SAMGOVAPIKEY`).
- If DB errors occur at startup, verify `DATABASE_URL` and run Prisma migration commands again.
- If billing pages fail, verify Stripe secret/publishable keys + price IDs.
- If email endpoints fail, set `RESEND_API_KEY` and a valid sender address.

---

## Handy command sequence (copy/paste)

```bash
npm install
cp .env.local .env.local.bak 2>/dev/null || true
# edit .env.local with values above
npx prisma generate
npx prisma migrate deploy
npm run dev
```
