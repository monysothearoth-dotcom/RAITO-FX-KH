# Raito-FX Pro Launch Guidance

The imported application is a full-stack Node.js service with a MySQL-compatible database, OAuth, server-side AI access, and optional Telegram delivery. The validated production commands are `pnpm install --frozen-lockfile`, `pnpm build`, and `node dist/index.js`. The service must bind to the host-provided `PORT`; no fixed port should be configured.

| Launch area | Required configuration |
|---|---|
| Database | Configure `DATABASE_URL` and apply `drizzle/0000_perfect_havok.sql` through `drizzle/0008_chemical_starfox.sql` in numeric order to a new database. For an existing database, apply only migrations not yet recorded. |
| Identity | Keep `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `VITE_OAUTH_PORTAL_URL` private. Register the final HTTPS domain and exact callback URL with the OAuth provider before first sign-in testing. |
| AI features | `USER_GEMINI_API_KEY` is used for server-side Gemini analysis and translation fallback. It has been validated in this workspace without exposing its value. |
| Telegram delivery | `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are validated. Delivery remains disabled until the owner enables it in the application. |
| General platform settings | Retain the configured owner identity and platform API variables; do not commit any `.env` file, credentials, runtime logs, build output, or dependency folders. |

## Scheduled Telegram Delivery

The supplied `/api/scheduled/telegram-news` handler accepts authenticated platform cron calls and enforces the cron identity. It is not safe to expose as an unauthenticated external endpoint. Choose the operating model that matches where the application will run.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---|
| Publish this managed project and enable the owner-controlled Telegram schedule after publishing | Preserves the integrated authentication contract and recurring job management. The project must be published before any schedule is enabled. | Included with the managed project, subject to the account’s hosting terms. | Lower |
| Run the source independently on a persistent Node host with a MySQL-compatible database | Provides full infrastructure ownership, but requires separate secrets, OAuth registration, migration operations, and a secure scheduler integration. The current cron route must be adapted to authenticate the external scheduler before it is invoked. | Varies by host and database provider. | Higher |

For either approach, first test sign-in, user-scoped database writes, the Buy/Sell/Normal news filter, market analysis, account export/delete controls, and a manual owner-authorized Telegram test. Then enable recurring delivery and confirm successful sends, deduplicated skips, and recovery from a simulated source failure.

## Ready-to-Publish Status

The workspace passed TypeScript checking, **94 regression tests**, the production build, credential validation, and responsive desktop/mobile preview smoke tests. The production build emitted a chunk-size advisory for the JavaScript bundle; it does not prevent startup, but future work can use route-level lazy loading if initial-load performance needs improvement.
