# Raito-FX Pro

Raito-FX Pro is a full-stack market-analysis workspace for traders who want structured market context, technical signal research, economic-event awareness, paper trading, and optional Telegram notifications in one application.

> **Important:** Raito-FX Pro provides market research and risk-aware analytical scenarios. It does not execute trades, guarantee returns, or provide personalised financial advice.

## What It Includes

| Capability | Description |
|---|---|
| Market workspace | Unified asset watchlists, live market context, charts, and grouped market views. |
| Auto Signal Analyze | Selective XAU/USD-only monitoring with Gold-specific technical, momentum, volatility, session, and risk gates, persistent signal lifecycle tracking, and duplicate-safe Telegram delivery. |
| Signal Analyze | Server-managed AI-assisted market review with explicit evidence, uncertainty, invalidation, and risk boundaries. |
| RAITO Agent | A conversational analysis workspace for structured market questions and decision context. |
| News and economic events | Verified headline and calendar context with market-impact analysis and Khmer translation support. |
| Paper trading | Localized paper-trade records and portfolio-oriented workflows without broker execution. |
| Owner controls | Protected settings for thresholds, alert delivery, provider status, and operational health. |

## Architecture

Raito-FX Pro uses a React and TypeScript client, Vite for frontend development, an Express and tRPC server, Drizzle ORM with a MySQL-compatible database, and server-side provider adapters. AI and market-data credentials are consumed on the server and are never intended for browser storage.

The application is organized into these primary areas:

```text
client/       React interface, pages, components, and shared client utilities
server/       tRPC procedures, market analysis, providers, Telegram, and persistence helpers
drizzle/      Database schema and ordered SQL migrations
shared/       Shared types and constants
```

## Local Development

Use Node.js 22 or a compatible current Node.js runtime and pnpm. Install dependencies, configure the required environment variables through a secret manager or a local untracked environment file, then start the development server:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

For validation and a production-style build:

```bash
pnpm check
pnpm test
pnpm build
node dist/index.js
```

The server must bind to the host-provided `PORT`. Do not hardcode a deployment port.

## Database Setup

Create a new MySQL-compatible database for each independent deployment. Apply the SQL files in `drizzle/` in numeric order, or use the migration workflow supported by your deployment environment. Keep the Drizzle schema and applied database migrations synchronized. Never use production data as test fixtures.

## Configuration and Security

Review `SELF_LAUNCH_ENVIRONMENT.md` for the value-free configuration inventory. Store secrets only in an encrypted deployment secret manager or an untracked local environment file. Never commit `.env` files, provider keys, bot tokens, database credentials, OAuth client secrets, runtime logs, generated dependencies, or local storage.

Telegram delivery uses separate server-side configuration for News Alert and Auto Signal. Any recurring scheduler must call protected routes with an authenticated mechanism; never expose a Telegram-sending endpoint publicly for convenience.

## Independent Deployment

For a self-managed deployment, review the following documents in order:

1. `SELF_LAUNCH_ENVIRONMENT.md` for configuration names and secret-handling rules.
2. `LAUNCH_CHECKLIST.md` for database, OAuth, deployment, and smoke-test sequencing.
3. `GITHUB_DEPLOYMENT.md` for source-control and Node-host setup notes.
4. `SELF_LAUNCH_OPERATIONS.md` for ongoing monitoring and incident response.

GitHub Pages is not an appropriate host for this application because Raito-FX Pro requires a server, database, authentication, protected provider access, and recurring background delivery.

## Testing

The repository includes server and client Vitest coverage for authentication, market data, signal qualification, delivery safeguards, translation fallback, news analysis, and responsive application behavior. Run the full suite before deployment:

```bash
pnpm test
```

## Data and Provider Notes

Provider availability, latency, rate limits, licensing, and market-session coverage vary by service and account. The application should surface unavailable or delayed evidence rather than presenting missing data as zero or certainty. Review provider documentation and licensing terms before enabling optional integrations in a commercial deployment.

## License

Raito-FX Pro is released under the [MIT License](LICENSE). The license covers this application source and does not grant rights to third-party trademarks, market-data feeds, AI providers, API services, or provider content referenced by the application.

## Continuous integration

GitHub Actions runs the public-safe type check, deterministic test suite, and production build on pushes to `main` and on pull requests. Credential-dependent integration tests are intentionally excluded because they require private runtime secrets.

## Disclaimer

This software is provided for research and educational use. Market information can be delayed, incomplete, or incorrect. Users remain responsible for their own decisions, risk controls, legal obligations, and provider agreements.
