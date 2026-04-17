<div align="center">

```
 ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗███████╗
██╔═══██╗██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝
██║   ██║██║   ██║███████║██╔██╗ ██║   ██║   ██║███████╗
██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██║╚════██║
╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║   ██║   ██║███████║
 ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝
```

### Your trading strategy. Proven by data.

Write Python. Backtest on real Binance data. Dominate the leaderboard.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## What is Quantis?

Quantis is a **browser-based crypto algorithmic trading simulator**. You write a Python strategy, hit run, and it backtests against real historical Binance candlestick data — all inside a secure sandbox. No setup, no API keys, no risk.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Write Python  ──▶  Backtest on Binance Data  ──▶  Leaderboard│
│                                                                 │
│   [ Monaco Editor ]   [ Sandboxed Engine ]   [ Global Ranking ]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

```
╔══════════════════╦══════════════════════════════════════════════╗
║  Monaco Editor   ║  Full Python IDE — syntax highlighting,      ║
║                  ║  auto-complete, error markers                 ║
╠══════════════════╬══════════════════════════════════════════════╣
║  Real Market     ║  Live Binance candles synced directly from   ║
║  Data            ║  verified exchange endpoints                  ║
╠══════════════════╬══════════════════════════════════════════════╣
║  Sandboxed       ║  RestrictedPython runtime — no network,      ║
║  Execution       ║  no file access, deterministic limits        ║
╠══════════════════╬══════════════════════════════════════════════╣
║  Leaderboard     ║  Compete globally on verified backtest       ║
║                  ║  performance, not paper trades               ║
╚══════════════════╩══════════════════════════════════════════════╝
```

---

## Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---:|:---|
| 🖼️ Framework | Next.js 16 (App Router) | Full-stack React framework |
| ⚛️ UI | React 19 + Tailwind CSS 4 | Component rendering & styling |
| ✨ Animations | GSAP 3 + ScrollTrigger | Scroll-driven UI animations |
| 📝 Editor | Monaco Editor | In-browser Python code editor |
| 📈 Charts | Lightweight Charts | Candlestick & portfolio charts |
| 🔐 Auth & DB | Supabase | Authentication + data persistence |
| 🐍 Engine | Python + RestrictedPython | Sandboxed strategy execution |
| ☁️ Deployment | Cloudflare Workers + OpenNext | Edge-deployed Next.js |

</div>

---

## App Structure

```
src/
├── app/
│   ├── (marketing)/            ← Public pages
│   │   ├── page.tsx            ← Landing page
│   │   ├── login/              ← Sign in
│   │   └── signup/             ← Create account
│   │
│   └── (app)/                  ← Authenticated app
│       ├── dashboard/          ← Portfolio overview & P&L
│       ├── editor/             ← Strategy code editor + runner
│       ├── discover/           ← Browse community strategies
│       ├── strategies/         ← Manage your strategies
│       └── leaderboard/        ← Global rankings
│
├── components/
│   ├── landing/                ← Marketing sections (Hero, Features…)
│   └── ui/                     ← Shared primitives (Button, Card…)
│
├── lib/
│   └── supabase/               ← Auth & DB client helpers
│
└── worker/                     ← Python simulation engine
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudflare](https://cloudflare.com) account *(for deployment only)*

### 1 — Install

```bash
npm install
```

### 2 — Environment variables

```bash
cp .env.local.example .env.local
```

Then fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_WORKER_URL=your_cloudflare_worker_url
```

### 3 — Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Scripts

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run start        # Start production server
npm run preview      # Build + preview on Cloudflare locally
npm run deploy       # Build + deploy to Cloudflare Workers
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
npm run cf-typegen   # Generate Cloudflare env types
```

---

## Deployment

Quantis runs on **Cloudflare Workers** via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare).

```
┌──────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  next build  │───▶│  opennextjs build   │───▶│  wrangler deploy     │
│              │    │  (edge adapter)     │    │  (Cloudflare Workers)│
└──────────────┘    └─────────────────────┘    └──────────────────────┘
```

```bash
npm run deploy
```

---

## How Strategies Work

Every strategy is a single Python function. The engine calls it once per candle with the latest market data and your current portfolio state.

```python
def on_data(historical_data, portfolio, symbol):
    """
    historical_data : list[float]  — last 100 close prices
    portfolio       : dict         — { cash, holdings, total_value }
    symbol          : str          — e.g. "BTCUSDT"
    
    Returns: tuple[str, float]     — (action, capital_fraction)
    """
    current_price = historical_data[-1]
    sma_20 = sum(historical_data[-20:]) / 20

    if current_price > sma_20 * 1.02:
        return ('BUY', 0.5)    # deploy 50% of available cash

    elif current_price < sma_20:
        return ('SELL', 1.0)   # liquidate full position

    return ('HOLD', 0)
```

> Strategies run inside a `RestrictedPython` sandbox — no network access, no file I/O, no side effects. Pure, deterministic, safe.

---

## License

Private — all rights reserved.
