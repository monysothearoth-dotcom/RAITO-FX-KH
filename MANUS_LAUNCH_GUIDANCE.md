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

## Operating Auto Signal Analyze

Auto Signal Analyze is an owner-controlled feature. After publishing the current checkpoint, sign in using the configured project-owner account, open **Auto Signal Analyze** beside **Markets & Chart**, adjust the inspectable confidence, confluence, and risk/reward thresholds if needed, and select **Enable monitoring**. The feature uses the existing Telegram bot and destination settings; it cannot be enabled when either Telegram credential is unavailable.

| Operational control | Behavior |
|---|---|
| Enable monitoring | Creates or resumes a protected recurring monitor that calls `/api/scheduled/auto-signal-monitor` every 60 seconds. It watches XAU/USD and BTC/USD, fetches historical context for indicator alignment, suppresses setups below the configured thresholds, and separately evaluates Gold high-impact events exactly 15 minutes before release. |
| Persistent lifecycle | A qualifying signal is stored once, shown in the website ledger, sent to Telegram from that same record, and tracked until its TP or SL is reached. The resolved outcome uses the same record and is sent as a separate Telegram update. |
| Delivery health | The owner control panel shows signal deliveries, outcome deliveries, and any pending delivery records. A non-zero pending count means the next successful monitor pass will retry that record. |
| Pause monitoring | Pauses the protected recurring job without deleting saved signals, outcomes, or delivery history. |

The monitor is intentionally disabled by default. Enable it only after publishing, then verify the owner dashboard reports an active monitor and inspect the delivery-health panel after the first successful run. Signals are analytical scenarios, not trade execution or a guarantee of return.

### Dedicated Auto Signal Backend Credentials

Auto Signal Analyze now uses a separate backend-only Telegram pair, `AUTO_SIGNAL_TELEGRAM_BOT_TOKEN` and `AUTO_SIGNAL_TELEGRAM_CHAT_ID`. These do not replace or share the Telegram values used by the existing news-alert feature. Its AI review chain is server-only and tries Gemini, OpenAI, Claude, then `x-ai/grok-4.6` through OpenRouter. The required project secrets are `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENROUTER_API_KEY`.

The automatic monitor retains the deterministic technical, strategy, fundamental, and risk/reward gate as its first safeguard. AI review is a secondary consistency check; if all configured providers are temporarily unavailable, it records that fact in the saved rationale and continues to apply the deterministic threshold rather than presenting an AI result as certain.
