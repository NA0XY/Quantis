<div align="center">

<img src="src/app/icon.svg" width="72" height="72" alt="Quantis Logo" />

# QUANTIS

**Crypto Algorithmic Trading Simulator**

*Write Python. Scan 41 markets. Dominate the leaderboard.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Python](https://img.shields.io/badge/Python_3-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)

<br/>

```
  Write Strategy  ──▶  Scan 41 Markets  ──▶  Auto-Execute  ──▶  Leaderboard
  [ Monaco IDE  ]      [ Binance Data  ]      [ Live Bot   ]      [ Rankings ]
```

</div>

---

## Overview

Quantis is a **browser-based crypto algorithmic trading simulator** built on Next.js and deployed to Cloudflare Workers. Users write Python trading strategies in a Monaco-powered IDE, backtest them against real Binance candlestick data across 41 markets simultaneously, and optionally deploy them as live bots that auto-execute every 5 minutes via a scheduled cron worker.

Every account starts with a simulated **$10,000 USD** portfolio. Performance is tracked, persisted to Supabase, and ranked on a global leaderboard with 24H / 7D / All-Time timeframes.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [How Strategies Work](#how-strategies-work)
- [Market Scanner](#market-scanner)
- [Cron Bot Engine](#cron-bot-engine)
- [Deployment](#deployment)
- [Routes Reference](#routes-reference)

---

## Features

### Strategy Editor
- Full **Monaco Editor** (VS Code engine) with Python syntax highlighting
- Inline strategy name editing with live status indicator
- **Scan Markets** — backtests your strategy across all 41 supported pairs in parallel batches of 6
- **Go Live** — deploys your strategy as an active bot, picked up by the cron engine every 5 minutes
- Save and share strategies via URL

### Market Scanner
- Runs your strategy against **41 Binance USDT pairs** simultaneously
- Batched execution (6 markets per batch) with real-time progress feedback
- Automatically selects the **best-performing market** based on net profit and trade activity
- Returns full equity curve, trade log, and performance metrics per symbol

### Dashboard
- Live portfolio snapshot: current USD value, assets held, P&L vs $10k baseline
- Real-time asset prices pulled from Binance Ticker API
- Active bot count
- Trade history feed (last 20 trades)

### Leaderboard
- Global rankings sorted by ROI against fixed $10k base
- Timeframe filters: **All Time**, **7 Days**, **24 Hours**
- Shows active bot status per trader
- Your rank banner with percentile position

### Discover
- Browse community strategies sorted by active status and ROI
- View strategy stats: trade count, buy/sell ratio, success rate, P&L
- Inspect any public strategy's trade history

### Live Bot (Cron Engine)
- Scheduled Cloudflare Worker runs every **5 minutes**
- Picks up to 3 active algorithms per cycle
- Scans all 41 markets, selects the best, persists new trades and updates portfolio
- Manual trigger endpoint (`POST /run`) protected by `CRON_RUN_SECRET`
- Health check endpoint (`GET /health`)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js App)                        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Editor   │  │Dashboard │  │Leaderboard│  │    Discover      │  │
│  │ Monaco   │  │Portfolio │  │  Rankings │  │  Community Strats│  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│       │              │              │                  │            │
└───────┼──────────────┼──────────────┼──────────────────┼────────────┘
        │              │              │                  │
        ▼              ▼              └──────────────────┘
┌───────────────┐  ┌──────────────────────────────────────┐
│  Sim Worker   │  │              Supabase                 │
│  (Python CF)  │  │  users · algorithms · trade_history  │
│               │  │  portfolio_snapshots                  │
│  on_candle()  │  └──────────────────────────────────────┘
│  + Binance    │              ▲
│  klines API   │              │
└───────────────┘  ┌───────────┴──────────────────────────┐
                   │         Cron Worker (CF)              │
                   │  Runs every 5 min · scans 41 markets  │
                   │  Persists trades · updates portfolio  │
                   └──────────────────────────────────────┘
```

**Request flow for a manual backtest:**
1. User clicks "Scan Markets" in the editor
2. Frontend calls `marketScanner.scanMarkets()` — batches 41 symbols, 6 at a time
3. Each batch POSTs `{ code, symbol, interval, limit }` to the Python Simulation Worker
4. Worker fetches live Binance klines, runs `on_candle()` per candle, returns metrics + trades
5. Best result is surfaced in the editor terminal and chart pane

**Request flow for a live bot cycle:**
1. Cloudflare Cron triggers `scheduled()` every 5 minutes
2. Fetches up to 3 active algorithms from Supabase
3. For each: scans all 41 markets via the Sim Worker, picks the best
4. Persists new trades to `trade_history`, updates `users.portfolio_usd`

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---:|:---|
| Framework | Next.js (App Router) | 16.2.4 | Full-stack React, SSR, routing |
| UI Library | React | 19.2.4 | Component rendering |
| Language | TypeScript | ^5 | Type safety across the codebase |
| Styling | Tailwind CSS | ^4 | Utility-first CSS, neobrutalist design |
| Animations | GSAP + ScrollTrigger | ^3.15 | Scroll-driven landing animations |
| Code Editor | Monaco Editor | ^4.7 | VS Code engine in the browser |
| Charts | Lightweight Charts | ^5.1 | Candlestick & equity curve charts |
| Auth & DB | Supabase | ^2.103 | Auth, Postgres, Row Level Security |
| Strategy Engine | Python + RestrictedPython | ≥7.1 | Sandboxed strategy execution |
| Deployment | Cloudflare Workers + OpenNext | ^1.8 | Edge-deployed Next.js |
| Wrangler | Cloudflare Wrangler | ^4.83 | CF Workers CLI & local dev |

---

## Project Structure

```
quantis/
├── src/
│   ├── app/
│   │   ├── (marketing)/            ← Public-facing pages
│   │   │   ├── page.tsx            ← Landing page
│   │   │   ├── login/              ← Sign in
│   │   │   └── signup/             ← Create account
│   │   │
│   │   ├── (app)/                  ← Auth-protected app shell
│   │   │   ├── layout.tsx          ← App layout with sidebar
│   │   │   ├── dashboard/          ← Portfolio overview
│   │   │   ├── editor/             ← Strategy IDE
│   │   │   ├── markets/            ← Market browser
│   │   │   ├── discover/           ← Community strategies
│   │   │   ├── strategies/         ← Your strategies + detail view
│   │   │   └── leaderboard/        ← Global rankings
│   │   │
│   │   ├── auth/callback/          ← Supabase OAuth callback
│   │   ├── layout.tsx              ← Root layout (fonts, metadata)
│   │   ├── manifest.ts             ← PWA manifest
│   │   ├── robots.ts               ← robots.txt
│   │   └── sitemap.ts              ← sitemap.xml
│   │
│   ├── components/
│   │   ├── app/
│   │   │   └── AppSidebar.tsx      ← Main navigation sidebar
│   │   ├── brand/
│   │   │   ├── QuantisLogo.tsx     ← Logo component
│   │   │   └── MarketingBrandStamp.tsx
│   │   ├── dashboard/
│   │   │   ├── PortfolioSnapshot.tsx
│   │   │   ├── AssetsTable.tsx
│   │   │   ├── StrategyCard.tsx
│   │   │   ├── StrategyList.tsx
│   │   │   └── TradeHistoryFeed.tsx
│   │   ├── editor/
│   │   │   ├── CodeEditorPane.tsx  ← Monaco wrapper
│   │   │   ├── ChartPane.tsx       ← Lightweight Charts integration
│   │   │   ├── EditorToolbar.tsx   ← Run / Save / Go Live controls
│   │   │   └── Terminal.tsx        ← Strategy output / logs
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── SocialProof.tsx
│   │   │   ├── FloatingNav.tsx
│   │   │   └── CTAFooter.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Badge.tsx
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   └── redirect.ts         ← Post-auth redirect helpers
│   │   ├── services/
│   │   │   ├── dashboard.ts        ← Portfolio, trade history, prices
│   │   │   ├── strategy.ts         ← CRUD + stats for algorithms
│   │   │   ├── leaderboard.ts      ← Rankings with timeframe support
│   │   │   └── discover.ts         ← Public strategy feed
│   │   ├── supabase/
│   │   │   ├── client.ts           ← Browser Supabase client
│   │   │   └── server.ts           ← Server-side Supabase client
│   │   └── trading/
│   │       ├── markets.ts          ← 41 supported MARKET_SYMBOLS
│   │       └── marketScanner.ts    ← Parallel backtest runner
│   │
│   ├── cron/
│   │   └── index.ts                ← Scheduled bot engine (CF Worker)
│   │
│   ├── worker/
│   │   ├── index.py                ← Python simulation engine (CF Worker)
│   │   └── requirements.txt        ← RestrictedPython>=7.1
│   │
│   └── middleware.ts               ← Auth guard + redirect logic
│
├── next.config.ts
├── open-next.config.ts             ← OpenNext Cloudflare adapter config
├── wrangler.jsonc                  ← Cloudflare Workers config
├── tailwind.config.ts
└── package.json
```

---

## Database Schema

Quantis uses Supabase (Postgres) with the following tables:

### `users`
| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Matches Supabase Auth user ID |
| `username` | `text` | Display name (auto-generated from email if not set) |
| `portfolio_usd` | `numeric` | Current simulated USD balance |
| `portfolio_assets` | `jsonb` | Holdings map e.g. `{ "BTCUSDT": 0.023 }` |
| `starting_balance` | `numeric` | Always `10000` — used for ROI calculation |

### `algorithms`
| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Strategy ID |
| `user_id` | `uuid` | Owner (FK → users) |
| `name` | `text` | Strategy display name |
| `code` | `text` | Python source code |
| `is_active` | `boolean` | Whether the cron bot should run this strategy |
| `last_run_at` | `timestamptz` | Last cron execution timestamp |

### `trade_history`
| Column | Type | Description |
|:---|:---|:---|
| `id` | `uuid` | Trade ID |
| `user_id` | `uuid` | FK → users |
| `algorithm_id` | `uuid` | FK → algorithms (nullable) |
| `symbol` | `text` | e.g. `"BTCUSDT"` |
| `action` | `text` | `"BUY"` or `"SELL"` |
| `price` | `numeric` | Execution price |
| `amount` | `numeric` | Quantity traded |
| `timestamp` | `timestamptz` | Trade time |

### `portfolio_snapshots`
| Column | Type | Description |
|:---|:---|:---|
| `user_id` | `uuid` | FK → users |
| `equity` | `numeric` | Portfolio value at snapshot time |
| `timestamp` | `timestamptz` | Snapshot time (used for 24H / 7D leaderboard) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+ *(for local worker development)*
- A [Supabase](https://supabase.com) project with the schema above
- A [Cloudflare](https://cloudflare.com) account *(for deployment and the Python worker)*

### 1. Clone & Install

```bash
git clone https://github.com/your-org/quantis.git
cd quantis
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your values — see [Environment Variables](#environment-variables) below.

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The Python simulation worker runs separately on Cloudflare Workers. For local development, point `NEXT_PUBLIC_WORKER_URL` at a deployed worker or run it locally with `wrangler dev` from the worker directory.

---

## Docker

Run the full stack locally with Docker Compose:

```bash
cp .env.local.example .env.local
# fill in your Supabase and Groq credentials in .env.local

docker compose up --build
```

The app will be available at http://localhost:3000.

To run only the Next.js frontend:

```bash
docker build -t quantis .
docker run -p 3000:3000 --env-file .env.local quantis
```

---

## Environment Variables

### Next.js App (`.env.local`)

| Variable | Required | Description |
|:---|:---:|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_URL` | ✅ | Supabase project URL for worker-style local services |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key for trusted backend/worker operations |
| `GROQ_API_KEY` | ✅ | Groq API key for the AI Strategy Coach |
| `NEXT_PUBLIC_WORKER_URL` | ✅ | URL of the deployed Python simulation worker |

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_WORKER_URL=https://quantis-sim-engine.your-subdomain.workers.dev
```

### Cron Worker (Cloudflare Worker Secrets)

Set these via `wrangler secret put` or the Cloudflare dashboard:

| Secret | Required | Description |
|:---|:---:|:---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (bypasses RLS) |
| `SIM_WORKER_URL` | ✅ | URL of the Python simulation worker |
| `CRON_RUN_SECRET` | ✅ | Bearer token for the manual `/run` endpoint |

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put CRON_RUN_SECRET
```

---

## Scripts

```bash
# Development
npm run dev           # Start Next.js dev server on localhost:3000
npm run build         # Production build

# Cloudflare
npm run preview       # Build + preview locally via Wrangler
npm run deploy        # Build + deploy to Cloudflare Workers
npm run upload        # Build + upload assets only (no deploy)
npm run cf-typegen    # Generate TypeScript types for CF env bindings

# Quality
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit (no output, type errors only)
```

---

## How Strategies Work

Every strategy is a single Python function called `on_candle`. The simulation engine calls it once per candle (1-minute interval by default) with the current candle data and a mutable portfolio object.

### Function Signature

```python
def on_candle(candle, portfolio):
    """
    candle    : list  — [timestamp, open, high, low, close, volume]
    portfolio : dict  — { cash, position, buy(amount), sell(amount) }
    """
```

### Portfolio API

| Property / Method | Type | Description |
|:---|:---|:---|
| `portfolio["cash"]` | `float` | Available USD cash |
| `portfolio["position"]` | `float` | Current asset quantity held |
| `portfolio.buy(amount)` | `function` | Buy `amount` fraction of available cash (0.0–1.0) |
| `portfolio.sell(amount)` | `function` | Sell `amount` fraction of current position (0.0–1.0) |

### Example Strategy — SMA Crossover

```python
def on_candle(candle, portfolio):
    # candle = [timestamp, open, high, low, close, volume]
    close = candle[4]

    # Maintain a rolling window using a global list
    if "prices" not in globals():
        global prices
        prices = []

    prices.append(close)
    if len(prices) > 50:
        prices.pop(0)

    if len(prices) < 20:
        return  # Not enough data yet

    sma_20 = sum(prices[-20:]) / 20
    sma_50 = sum(prices) / len(prices)

    # Golden cross — buy signal
    if sma_20 > sma_50 * 1.01 and portfolio["cash"] > 0:
        portfolio.buy(0.5)   # Deploy 50% of available cash

    # Death cross — sell signal
    elif sma_20 < sma_50 and portfolio["position"] > 0:
        portfolio.sell(1.0)  # Liquidate full position
```

### Simulation Output

After each run the engine returns:

```json
{
  "success": true,
  "trades": [ { "action": "BUY", "price": 67420.5, "amount": 0.074, "timestamp": "..." } ],
  "equity": [ 10000, 10043, 10091, ... ],
  "metrics": {
    "final_balance": 11240.33,
    "net_profit": 1240.33,
    "max_drawdown": 0.043,
    "win_rate": 0.61,
    "total_trades": 18,
    "final_assets": { "BTCUSDT": 0.0 }
  },
  "logs": [ "Strategy output from print() calls" ]
}
```

### Sandbox Constraints

Strategies run inside a **RestrictedPython** sandbox:

- No network access (`fetch`, `requests`, `urllib` are blocked)
- No file system access
- No `import` of arbitrary modules (only `math` is injected)
- Deterministic execution — same candles always produce the same result
- `print()` is captured and surfaced in the editor terminal

---

## Market Scanner

The market scanner runs your strategy against all **41 supported Binance USDT pairs** and returns the best-performing market.

### Supported Markets

```
BTC  ETH  SOL  BNB  XRP  ADA  DOGE  MATIC  DOT  TRX
LTC  SHIB AVAX LINK ATOM UNI  BCH   XLM    NEAR FIL
ICP  APT  LDO  HBAR ETC  KAS  ARB   OP     MKR  AAVE
RNDR INJ  STX  SUI  SEI  TIA  FET   AGIX   WLD  ORDI PEPE
```
*(all paired with USDT)*

### Scan Process

```
Start Scan
    │
    ├── Batch 1: BTC ETH SOL BNB XRP ADA  ──▶  6 parallel simulations
    ├── Batch 2: DOGE MATIC DOT TRX LTC SHIB
    ├── ...
    └── Batch 7: FET AGIX WLD ORDI PEPE
                                              │
                                              ▼
                                    Rank by net_profit
                                    (trade activity tiebreaker)
                                              │
                                              ▼
                                    Return best market + full results
```

### Ranking Logic

Markets are ranked by:
1. Has at least 1 trade (strategies with no signals are ranked last)
2. Highest `net_profit`
3. Highest `total_trades` as tiebreaker

---

## Cron Bot Engine

The cron worker (`src/cron/index.ts`) is a standalone Cloudflare Worker that runs on a **`*/5 * * * *`** schedule.

### Cycle Steps

```
Every 5 minutes
      │
      ▼
Fetch up to 3 active algorithms from Supabase
      │
      ▼  (for each algorithm)
Scan all 41 markets via Sim Worker
      │
      ▼
Select best market (highest net profit)
      │
      ▼
Filter trades newer than last_run_at
      │
      ▼
Insert new trades → trade_history
Update portfolio_usd + portfolio_assets → users
Update last_run_at → algorithms
      │
      ▼
Log cycle summary to console
```

### Manual Trigger

```bash
curl -X POST https://your-cron-worker.workers.dev/run \
  -H "Authorization: Bearer YOUR_CRON_RUN_SECRET"
```

### Health Check

```bash
curl https://your-cron-worker.workers.dev/health
```

```json
{
  "ok": true,
  "worker": "quantis-bot-cron",
  "schedule": "*/5 * * * *",
  "bindings": {
    "has_supabase_service_role_key": true,
    "has_cron_run_secret": true
  }
}
```

---

## Deployment

Quantis deploys to **Cloudflare Workers** via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare).

### Deploy the Next.js App

```bash
npm run deploy
```

This runs:
1. `opennextjs-cloudflare build` — adapts the Next.js build for the CF Workers runtime
2. `opennextjs-cloudflare deploy` — pushes via Wrangler using `wrangler.jsonc`

### Deploy the Python Simulation Worker

The Python worker lives in `src/worker/index.py` and is deployed separately as a Cloudflare Python Worker.

```bash
# From the worker directory or with a separate wrangler config
wrangler deploy
```

### Deploy the Cron Worker

```bash
# From the cron directory or with a separate wrangler config
wrangler deploy
```

### Generate Cloudflare Env Types

```bash
npm run cf-typegen
```

This writes `cloudflare-env.d.ts` with typed bindings from `wrangler.jsonc`.

---

## Routes Reference

### Public Routes

| Route | Description |
|:---|:---|
| `/` | Landing page |
| `/login` | Sign in with email/password |
| `/signup` | Create a new account |
| `/auth/callback` | Supabase OAuth callback handler |

### Protected Routes (require auth)

| Route | Description |
|:---|:---|
| `/dashboard` | Portfolio overview, P&L, trade history |
| `/editor` | Strategy IDE — write, scan, go live |
| `/markets` | Market browser |
| `/strategies` | List of your saved strategies |
| `/strategies/[id]` | Strategy detail — stats, trades, performance |
| `/discover` | Browse community strategies |
| `/leaderboard` | Global rankings with timeframe filters |

> Unauthenticated requests to protected routes are redirected to `/login?redirectTo=<path>`. Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`.

---

## License

Private — all rights reserved.
