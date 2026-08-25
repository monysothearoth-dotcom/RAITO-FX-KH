# Raito-FX Pro — Secure Environment and Provider Template

This document is a **name-only** configuration inventory. Enter values only in your hosting provider’s encrypted secret manager or the project’s secret settings. Never commit a `.env` file, paste a key into browser code, or save a credential in the application database.

## Core Runtime and Identity

| Variable | Required for | External launch notes |
|---|---|---|
| `DATABASE_URL` | Persistent users, preferences, signals, alerts, and deliveries. | Use a managed MySQL/TiDB connection with TLS if your provider supports it. |
| `JWT_SECRET` | Session signing. | Generate a long, random value unique to this launch. |
| `VITE_APP_ID` | OAuth client application identity. | Match the OAuth configuration for the final domain. |
| `OAUTH_SERVER_URL` | OAuth backend base URL. | Required by the existing login flow. |
| `VITE_OAUTH_PORTAL_URL` | Browser OAuth portal URL. | Must match the configured authentication experience. |
| `OWNER_OPEN_ID` | Owner-only control authorization. | Set to the intended owner account identifier. |
| `OWNER_NAME` | Owner display identity. | Use a non-sensitive display name. |
| `BUILT_IN_FORGE_API_URL` | Server-side managed platform services. | Needed when retaining platform-backed functions. |
| `BUILT_IN_FORGE_API_KEY` | Server-side platform access. | Never send to the browser. |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend platform service URL. | Keep aligned with the deployment environment. |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend-scoped platform access. | Use only the supplied frontend-scoped value. |

## Telegram Delivery

| Variable | Used by | Required state |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | News Alert delivery. | Keep server-only; verify the bot can message the intended chat. |
| `TELEGRAM_CHAT_ID` | News Alert destination. | Must be the approved human/group destination. |
| `AUTO_SIGNAL_TELEGRAM_BOT_TOKEN` | Auto Signal Analyze delivery. | Dedicated from the News Alert bot. |
| `AUTO_SIGNAL_TELEGRAM_CHAT_ID` | Auto Signal Analyze destination. | Dedicated from the News Alert chat destination. |

## AI Provider Credentials

| Variable | Server-side role | Current readiness |
|---|---|---|
| `GEMINI_API_KEY` | Analysis and Khmer translation fallback. | Configured; retain for fallback resilience. |
| `USER_GEMINI_API_KEY` | Server-managed Gemini analysis option. | Keep secret; validate after any replacement. |
| `OPENAI_API_KEY` | Auto Signal reviewer fallback. | Optional but recommended for provider diversity. |
| `ANTHROPIC_API_KEY` | Claude analysis selection and primary Khmer translation attempt. | Valid key configured; API account needs available completion credit before Claude responses can run. |
| `OPENROUTER_API_KEY` | Grok 4.6 review through OpenRouter. | Optional reviewer fallback; server-only. |

## Market-Data Credentials

| Variable | Role | Policy |
|---|---|---|
| `ALPHA_VANTAGE_API_KEY` | Backend-only stock-price fallback. | No UI field or browser exposure. |
| `COINGECKO_API_KEY` | Backend-only crypto-price fallback. | No UI field or browser exposure. |
| `EODHD_API_TOKEN` | Optional future provider. | Do not add until you have a valid token and the appropriate license. |

## Value-Free `.env.example`

Use this only as a local name template. Do **not** fill it into a repository or share populated values.

```dotenv
# Runtime and identity
DATABASE_URL=
JWT_SECRET=
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
OWNER_OPEN_ID=
OWNER_NAME=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
AUTO_SIGNAL_TELEGRAM_BOT_TOKEN=
AUTO_SIGNAL_TELEGRAM_CHAT_ID=

# AI providers
GEMINI_API_KEY=
USER_GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=

# Market data
ALPHA_VANTAGE_API_KEY=
COINGECKO_API_KEY=
# EODHD_API_TOKEN=  # Optional; do not enable without the required account and license.
```

## Secret Rotation Procedure

Replace one provider credential at a time, then run its lightweight server-side validation. Re-test the affected workflow, check server logs without printing secret values, and rotate the old key at the provider. If a credential was ever pasted into a public repository, revoke it immediately and review deployment history.
