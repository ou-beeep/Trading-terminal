# Trading Terminal — Rise/Fall, Digits & Accumulators

A self-hosted manual trading terminal built on the Deriv WebSocket API, merged from three
single-market apps into one. A market switcher in the header lets you flip between:

- **Rise/Fall** — CALL/PUT contracts with an interactive SmartCharts chart and tick streaming.
- **Digits** — Matches/Differs, Over/Under, and Even/Odd, with live last-digit distribution stats (no chart).
- **Accumulators** — ACCU contracts with growth rate, take-profit, and a barrier-aware chart.

Each market keeps its own trading hook, its own no-code app-builder config
(`public/app-config-<market>.json`), and its own brand accent color — only the header, auth,
WebSocket connection, and footer are shared. Switching tabs mounts only the active market's
component, so it correctly tears down the previous market's subscriptions instead of running
three at once.

This pairs with `winindex-main` (the Deriv bot builder) as a companion app — see the top-level
README in the combined delivery for how the two link to each other.

## Prerequisites

- Node.js 18.18 or later

## Step 1: Register Your App ID

1. Log in to your Deriv account and go to the [API Token page](https://app.deriv.com/account/api-token) to create a token with the required scopes.
2. Navigate to [App Registration](https://developers.deriv.com/dashboard/) and register a new application.
3. Set the **Redirect URI** to the URL where you will host this app (e.g. `http://localhost:3000` for local development).
4. Copy the **App ID** shown after registration.

## Step 2: Configure `.env.production`

```bash
cp .env.example .env.production
```

Fill in `NEXT_PUBLIC_DERIV_APP_ID`, `NEXT_PUBLIC_DERIV_REDIRECT_URI`, and the rest — see the
comments in `.env.example`. **Never commit this file**; `.gitignore` already excludes it because
it carries the affiliate referral token and other build-time secrets.

## Step 3: Install & run

```bash
npm install   # also copies SmartCharts runtime assets into public/ (postinstall)
npm run dev   # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

## Project structure

```
app/
  page.tsx              — market switcher + the three Live* components
  reports/page.tsx      — positions (open/closed), market-aware via ?market=
components/
  live-{rise-fall,digits,accumulator}.tsx   — per-market data wiring (WS + trading hook)
  {rise-fall,digits,accumulator}-view.tsx   — per-market UI
  trade-controls-{rise-fall,digits,accumulators}.tsx
  custom/                — shared header, auth, symbol selector, positions table, etc.
  ui/                    — shadcn/ui primitives
hooks/
  use-{rise-fall,digits,accumulator}-trading.ts   — per-market trading state
  use-*                  — shared (auth, positions, balance sync, etc.)
lib/
  app-config-{rise-fall,digits,accumulators}.ts   — per-market no-code config schema
  types.ts               — shared + all three markets' types (no naming collisions)
  digit-stats.ts         — digits-only
packages/core/            — WS client, OAuth, and shared trading types (byte-identical
                             across all three source apps — the real shared engine)
```

## A note on translations

The four language files (`lib/i18n/{en,es,fr,pt}.json`) were merged from all three source apps.
A small number of strings (mostly Spanish/French/Portuguese) had slightly different wording
between apps for the same English source text (e.g. "Symbol" vs "Símbolo") — these are cosmetic
inconsistencies from independent generation passes, not translation errors, and don't affect
functionality. Worth a proofread pass if translation consistency matters for your deployment.
