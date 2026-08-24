# stocks-backlog

AI-powered product backlog with Kanban board for managing user stories. User stories live as GitHub
Issues on the [project board](https://github.com/users/SalmanAlaskar/projects/1); this repo also
contains a working prototype implementation of the app they describe. All 25 stories on the board
are implemented and marked Done.

## What this is

A prototype brokerage web app for trading TASI (Tadawul)-listed stocks, styled after the Derayah
Wallet. It implements the trading rules of the Saudi market (trading hours, +/-10% daily price
limits, T+2 settlement, Shariah-compliance flags) with realistic business logic, but with simulated
integrations where real access requires licensed/government partnerships:

- **Nafath identity verification** and **CMA KYC** are simulated (one click approves).
- **Market data** is a seeded set of real TASI tickers with a deterministic synthetic price feed
  (not a live Tadawul market data license).
- **Derayah Wallet funding** (SARIE/mada bank transfer) is simulated as an instant ledger entry.
- **SMS delivery** for 2FA codes and push notifications are simulated as in-app banners/notifications.
- **AI features** (news summaries, risk insights, portfolio assistant) are rule-based demo logic
  over real portfolio data, not live calls to a language model.

## Stack

Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS + Prisma 7 (PostgreSQL via the
`pg` driver adapter). Deployed on Vercel with a Neon Postgres database provisioned through the
Vercel Marketplace.

**Live**: https://stocks-backlog.vercel.app

## Getting started

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your own Postgres connection string
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000, sign up, and step through Nafath verification and KYC (both simulated)
to reach the dashboard.

## Deployment

`npm run build` runs `prisma migrate deploy && npm run db:seed` before `next build`, so every
Vercel deployment applies pending migrations and reseeds the public stock/company data
automatically. `DATABASE_URL` (and related `PG*`/`POSTGRES_*` vars) are supplied by the Neon
integration connected to the Vercel project across Production, Preview, and Development.

## Features

- **Account**: signup, Nafath verification, CMA KYC, two-factor authentication with backup codes (`src/app/(auth)`, `src/app/verify-nafath`, `src/app/kyc`, `src/app/login/2fa`)
- **Derayah Wallet**: fund/withdraw, transaction history (`src/app/wallet`)
- **Market**: search, Shariah-compliance filter, stock detail with price chart, fundamentals, and news (`src/app/market`)
- **Watchlists**: create/rename/delete, add/remove stocks (`src/app/watchlists`)
- **Trading**: market/limit/stop orders, order confirmation, order history with T+2 settlement (`src/app/trade`, `src/app/orders`)
- **Portfolio**: holdings, gain/loss, sector and Shariah breakdown, AI-style risk insights (`src/app/portfolio`)
- **Price alerts** and an **in-app notification center** for alerts, order fills, and IPO results (`src/app/alerts`, `src/app/notifications`)
- **Portfolio assistant**: rule-based Q&A over your own holdings/wallet data (`src/app/assistant`)
- **IPO subscriptions**: reserve funds, simulate allocation and refund (`src/app/ipo`)
- **Statements**: trade history CSV export and a Zakat certificate (`src/app/statements`)
- Notification preferences and a demo-only "force market open" toggle (`src/app/settings`)

## A note on the seed data

The seeded stock list (tickers, sectors, prices) reflects real TASI-listed companies and is public
market data, safe to keep in source control. If you seed a demo user's actual real holdings for
realism, keep the script that does so **outside this repo or gitignored** (see `*.local.ts` in
`.gitignore`) — exact position sizes are personal financial information and shouldn't be committed
to a public repo's history.
