# Raito-FX Pro — Self-Launch Package

**Prepared for:** Project owner  
**Purpose:** Launch and operate Raito-FX Pro yourself without exposing credentials or weakening the current alert and analysis controls.

Raito-FX Pro is a full-stack market-analysis application with user authentication, a MySQL-compatible database, server-managed AI and market-data providers, owner-controlled Telegram delivery, and two protected recurring monitor routes. The current production deployment is available at [raitofxpro-2xch6zhg.manus.space](https://raitofxpro-2xch6zhg.manus.space). The project has passed **47 test files / 124 tests** and a production build at the latest release checkpoint.

> **Important:** The application provides market research and risk-aware scenarios. It does not execute trades, guarantee returns, or provide personalised financial advice.

## Choose Your Launch Path

| Path | When to use it | What you manage | Recommended next action |
|---|---|---|---|
| **Managed project launch** | You want to keep the current integrated deployment, owner authentication, database, and protected scheduled routes. | Domain, visibility, owner activation, provider account readiness, and launch monitoring. | Use `SELF_LAUNCH_CHECKLIST.md` and `SELF_LAUNCH_OPERATIONS.md`. |
| **Independent external launch** | You want full infrastructure ownership outside the managed deployment. | Node hosting, database, OAuth, every secret, migrations, a protected scheduler, and monitoring. | Use `LAUNCH_CHECKLIST.md`, `GITHUB_DEPLOYMENT.md`, and `SELF_LAUNCH_ENVIRONMENT.md`. |

The managed path is the lower-risk way to launch because the current 60-second Auto Signal and News Alert jobs already use protected callbacks. An external host must reproduce that security boundary; never make a Telegram-sending route public just to simplify a cron job.

## Package Contents

| File | What it gives you |
|---|---|
| `SELF_LAUNCH_CHECKLIST.md` | A practical go/no-go launch sequence and post-launch checks. |
| `SELF_LAUNCH_ENVIRONMENT.md` | Credential inventory, ownership rules, and a value-free environment template. |
| `SELF_LAUNCH_OPERATIONS.md` | Daily operations for Auto Signal, News Alert, Telegram, providers, and incident triage. |
| `MANUS_LAUNCH_GUIDANCE.md` | Technical configuration history and the verified production callback record. |
| `LAUNCH_CHECKLIST.md` | Independent GitHub/Node-host deployment instructions. |
| `GITHUB_DEPLOYMENT.md` | Source-control and external-host setup notes. |

## Current Launch Readiness

| Area | Current position | Owner action before public launch |
|---|---|---|
| Application build | Production build and regression suite have passed. | Review the live domain while signed out and signed in. |
| Database and authentication | The managed deployment uses the project database and owner authentication. | Confirm your owner sign-in works on the final domain. |
| Market data | CoinGecko and Alpha Vantage are backend-only fallbacks; no browser provider-key fields exist. | Check that required market cards load for your target audience. |
| Telegram News Alert | Published protected route and recurring job have returned HTTP 200; verified deliveries are recorded. | Confirm the intended bot, chat, and News Alert owner toggle are enabled. |
| Auto Signal Analyze | Published protected monitor has returned HTTP 200. It sends only qualifying persisted signals. | Enable it only if you accept the configured selective thresholds and alert scope. |
| Anthropic Claude | The key authenticates, but provider completions are currently blocked by the Anthropic API account’s available credit. | Add API account credit, then rerun the completion validation. Fallback paths remain available. |
| EODHD | Not active. | Leave deferred unless you obtain an EODHD token and appropriate license. |

## Launch Sequence

Start with `SELF_LAUNCH_CHECKLIST.md`. Do not enable Telegram schedules before you have verified sign-in, live market data, owner controls, and the intended Telegram destinations. Keep every key in a deployment secret manager; none of these files contains a secret value.

## Owner-Approved Deferred Prerequisites

The owner has explicitly approved the following items as **deferred**, not launch blockers. Anthropic direct completions remain deferred until the provider API account has available credit; the installed backend fallback paths remain active. EODHD integration remains deferred until an `EODHD_API_TOKEN` and the appropriate license are available. Keep the current Alpha Vantage and CoinGecko backend-only provider configuration unchanged until those conditions are met.

## Support Boundaries

Use the relevant provider’s own console for API-key, billing, or service-account issues. For managed platform hosting or account-level availability support, use [Manus Help](https://help.manus.im). This package gives you the technical launch steps but does not expose or reproduce any existing secret.
