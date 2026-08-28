# Raito-FX Pro Launch Guidance

Raito-FX Pro is a full-stack Node.js service with a MySQL-compatible database, OAuth authentication, server-side AI access, market-data adapters, and optional Telegram delivery. A compatible deployment should install dependencies, build the application, and start the generated server:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
node dist/index.js
```

The service must bind to the host-provided `PORT`; do not configure a fixed deployment port.

## Core Configuration

| Area | Required practice |
|---|---|
| Database | Configure `DATABASE_URL` and apply every SQL migration in `drizzle/` in numeric order to a new MySQL-compatible database. For an existing database, apply only migrations not already recorded. |
| Identity | Configure the OAuth variables and register the final HTTPS callback URL with the chosen identity provider before testing sign-in. Keep session and OAuth secrets private. |
| AI features | Configure server-side provider credentials through an encrypted secret manager. Never send provider keys to the browser or store them in application tables. |
| Telegram delivery | Configure separate backend-only bot and destination values for News Alert and Auto Signal. Enable delivery only after a manual owner-authorized test succeeds. |
| Runtime hygiene | Do not commit `.env` files, credentials, runtime logs, generated dependencies, build output, local storage, or database exports. |

## Scheduled Delivery

The scheduled Telegram handlers are protected application routes. An external scheduler must authenticate each request using a mechanism that cannot be reproduced by an unauthenticated visitor. Do not expose a Telegram-sending endpoint publicly simply to make cron configuration easier.

Before enabling recurring delivery, test authentication, user-scoped database writes, market-data fallbacks, news filtering, analysis output, account controls, and a manual owner-authorized Telegram send. After enabling a schedule, monitor successful runs, deduplicated skips, provider failures, delivery failures, and recovery behavior.

## Auto Signal Analyze

Auto Signal Analyze is designed as a selective research monitor for XAU/USD and BTC/USD. It combines deterministic technical, strategy, market-context, and risk/reward checks with a secondary server-side AI review. A qualifying setup is persisted before delivery; dispatch claims and active-signal guards prevent duplicate notifications, while stale setups are expired rather than reused indefinitely.

A deployment should expose the owner dashboard with the latest monitor heartbeat, measured worker interval, delivery-health counts, and current thresholds. Signals are analytical scenarios, not trade execution or a guarantee of return. Keep thresholds selective and verify that a missing market-data source is reported as unavailable instead of treated as a valid signal.

## Khmer News Translation

News Alert translation should validate the complete translated batch before delivery. If the primary translation provider is unavailable or returns unusable output, use the configured server-side fallback. Retain the original language only when all configured translation providers fail, and label that fallback clearly for operators.

## Market-Data Providers

Market-data credentials are server-managed. Alpha Vantage and CoinGecko may be used as backend fallbacks where their coverage and rate limits fit the deployment. Optional providers must be reviewed for endpoint coverage, delay characteristics, usage limits, and commercial licensing before activation. Do not use public or demo credentials for production traffic.

## Operational Principles

Use a new database for an independent launch, keep backups and migrations under your own change-control process, and monitor provider latency and error rates. Treat stale, partial, or contradictory market evidence as uncertainty. Keep a documented rollback plan and test the application after every schema, provider, scheduler, or authentication change.

> Raito-FX Pro is intended for research and educational use. Market data may be delayed or incomplete, and the application does not provide personalised financial advice or execute trades.
