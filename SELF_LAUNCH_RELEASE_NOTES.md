# Raito-FX Pro — Self-Launch Release Notes

**Release checkpoint:** `2a4f2cdc`  
**Validation baseline:** 47 test files / 124 tests passed; production build passed.  
**Prepared:** 25 August 2026

## Release Summary

This self-launch package prepares the current Raito-FX Pro application for owner-led operation. It includes the complete full-stack source, persistent market-analysis workflows, protected Telegram schedules, backend-only provider configuration, and the owner documentation needed to operate the application without placing credentials in the browser or source repository.

## Shipped Capabilities

| Area | Included in this release |
|---|---|
| Workspace hierarchy | **All Assets** is first; **RAITO Agent** replaces the previous AI Agent label; analysis workspaces have clearer context and controls. |
| Market Pulse | Pair lists are organized by market group with stable ordering and responsive presentation. |
| News Analyze | Uses verified high-impact calendar evidence and symbol-relevant headlines. It distinguishes an available event, no qualifying event, no relevant headline, and source unavailability instead of inventing catalysts. |
| Trading research | RAITO Agent, Signal Analyze, All-In-One, and Auto Signal review use evidence, uncertainty, invalidation, and risk-boundary requirements. |
| Auto Signal Analyze | Monitors XAU/USD and BTC/USD through protected recurring calls, persists eligible signals before delivery, and records diagnostics for skipped setup conditions. |
| Telegram delivery | News Alert and Auto Signal use separate backend-only Telegram credential pairs, deduplicated delivery records, and protected scheduled routes. |
| Khmer translation | Uses Claude as the primary backend translation attempt and Gemini as the safe fallback. |
| Market providers | CoinGecko and Alpha Vantage are backend-only fallbacks; browser API-key overrides and IEX Cloud have been removed. |
| Security | Provider credentials are server-only. User-facing workflows do not display or store provider API keys. |

## Verified Operating State

The published Auto Signal and News Alert callbacks previously returned HTTP 200 after route publication. The Auto Signal monitor can correctly complete a run with `created: 0` and `delivered: 0` when no setup passes the active deterministic gate; this is a selective skip, not a Telegram failure. News Alert has recorded successful deduplicated deliveries after its protected schedule refresh.

## Known Prerequisites and Limitations

| Item | Current state | Owner action |
|---|---|---|
| Anthropic Claude completions | The configured API key authenticates, but the Anthropic API account currently reports insufficient credit for completion requests. | Add available credit to the Anthropic API account, then re-run Claude analysis and Khmer translation validation. Safe fallbacks remain active. |
| EODHD | Not enabled. | Add only after obtaining `EODHD_API_TOKEN` and confirming the appropriate EODHD license. |
| Telegram messages | Selective by design. | Expect Auto Signal delivery only after a qualifying signal is persisted. |
| External deployment | Requires independent infrastructure. | Supply your own database, OAuth configuration, secrets, and a protected scheduler. Do not use GitHub Pages for this server application. |

Both the Anthropic direct-completion check and EODHD integration have been explicitly accepted by the owner as **deferred launch prerequisites**. They do not change the active provider configuration or the safe fallback behavior documented in this package.

## Owner Handoff Files

Start with `SELF_LAUNCH_README.md`, complete `SELF_LAUNCH_CHECKLIST.md`, configure secrets through `SELF_LAUNCH_ENVIRONMENT.md`, and use `SELF_LAUNCH_OPERATIONS.md` for day-to-day monitoring. The archive excludes `.env` files, build output, dependency folders, logs, and storage artifacts.

> Raito-FX Pro provides market research and analytical scenarios. It does not execute orders, provide personalised investment advice, or guarantee outcomes.
