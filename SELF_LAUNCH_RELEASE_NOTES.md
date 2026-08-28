# Raito-FX Pro — Release Notes

## Release Summary

Raito-FX Pro is a full-stack market-analysis application with persistent market workflows, protected Telegram delivery, server-side provider configuration, and a responsive trading-research dashboard. These notes summarize the application capabilities and deployment considerations without including private deployment history or account-specific operational status.

## Included Capabilities

| Area | Included capability |
|---|---|
| Workspace hierarchy | **All Assets** is first; **RAITO Agent** is the current agent label; analysis workspaces present clearer context and controls. |
| Market Pulse | Pair lists are organized by market group with stable ordering and responsive presentation. |
| News Analyze | Uses verified high-impact calendar evidence and symbol-relevant headlines. It distinguishes an available event, no qualifying event, no relevant headline, and source unavailability instead of inventing catalysts. |
| Trading research | RAITO Agent, Signal Analyze, All-In-One, and Auto Signal review use evidence, uncertainty, invalidation, and risk-boundary requirements. |
| Auto Signal Analyze | Monitors selected instruments such as XAU/USD and BTC/USD through protected recurring or always-on monitoring, persists eligible signals before delivery, and records diagnostics for skipped setup conditions. |
| Telegram delivery | News Alert and Auto Signal use separate backend-only Telegram credential pairs, durable delivery claims, and protected sending routes. |
| Khmer translation | Uses a server-side primary translation path with a validated fallback chain. Complete translated batches are required before translated delivery. |
| Market providers | Backend-only market-data fallbacks can be configured according to provider coverage, rate limits, and licensing. Browser API-key overrides are not used. |
| Security | Provider credentials remain server-side. User-facing workflows do not display or store provider API keys. |

## Deployment Considerations

A production deployment requires a Node.js runtime, a MySQL-compatible database, an OAuth configuration, encrypted secret management, and a protected recurring scheduler or always-on worker. Apply the numbered migrations before enabling application traffic, run the test suite and production build, and validate sign-in, market data, analysis, owner controls, and Telegram delivery in a non-production environment first.

Auto Signal is selective by design. A monitor cycle may complete without creating or delivering a signal when market data is unavailable, historical context is insufficient, evidence is conflicting, event risk is active, or the configured thresholds are not met. This behavior is intentional and should not be bypassed merely to generate more messages.

Optional AI and market-data capabilities depend on provider account readiness, API limits, coverage, delay characteristics, and licensing. Keep fallback paths available and label unavailable evidence instead of treating it as zero or certainty. Do not enable an optional provider until its credentials and usage rights are confirmed.

## Documentation Map

Start with `README.md` for the public overview. Use `SELF_LAUNCH_ENVIRONMENT.md` for the value-free configuration inventory, `SELF_LAUNCH_CHECKLIST.md` for deployment sequencing, `SELF_LAUNCH_OPERATIONS.md` for ongoing monitoring, and `INDEPENDENT_LAUNCH_MANIFEST.md` for the portable source contents and exclusions.

## Security Reminder

Never commit `.env` files, bot tokens, provider keys, OAuth secrets, database credentials, runtime logs, generated dependencies, build output, local storage, or database exports. Keep recurring delivery routes authenticated and review public documentation before exposing a repository or accepting external contributions.

> Raito-FX Pro provides market research and analytical scenarios. It does not execute orders, provide personalised investment advice, or guarantee outcomes.
