# Raito-FX Pro — Operations Guide

This guide describes safe day-to-day operation of a self-managed Raito-FX Pro deployment. Keep operational logs and secret-manager records private, and never include credentials, destination identifiers, session data, or raw provider responses in public issues or screenshots.

## Routine Health Checks

Open the deployed application over HTTPS as both a signed-out visitor and an authenticated owner. Confirm that market cards populate, sign-in completes, and protected controls are hidden from ordinary visitors. After changing a scheduled route or provider, inspect the next scheduled execution before enabling normal traffic.

| Surface | Healthy result | Investigate when |
|---|---|---|
| Market data | Prices and source-status labels load without browser key prompts. | Prices remain blank or an upstream error persists. |
| News Alert | The protected callback succeeds and the source-health state is clear. | The last error persists, the run time stops advancing, or delivery counts stop unexpectedly. |
| Auto Signal | The continuous heartbeat advances near its configured interval and delivery health is settled. | The heartbeat becomes stale, pending work accumulates, or the monitor reports an error. |
| Telegram | An eligible item creates one corresponding delivery record and a settled send state. | A persisted eligible item has no matching delivery or a send state remains uncertain. |
| AI analysis | The response is grounded, cautious, and visibly identifies uncertainty or an allowed fallback. | A provider fails without fallback or newly rotated credentials are rejected. |

## Auto Signal Analyze

Auto Signal is selective by design. It combines deterministic technical, strategy, market-context, and risk/reward checks with a secondary server-side AI review. It monitors configured instruments such as XAU/USD and BTC/USD, stores qualifying setups before delivery, and tracks the lifecycle until a defined outcome or expiry.

Each monitor cycle should expose diagnostics for live-price availability, historical sample coverage, directional alignment, event-risk suppression, confidence, confluence, and risk/reward thresholds. A successful cycle that creates no signal is normally an eligibility skip, not a Telegram failure. Do not lower thresholds merely to force messages during a quiet or conflicting market.

| Action | Safe procedure |
|---|---|
| Enable monitoring | Authenticate as an authorized owner, review thresholds and the dedicated Telegram destination, then enable the monitor. |
| Confirm a signal send | Confirm that a signal record was created first, then inspect the single matching delivery state. |
| No message received | Read the cycle diagnostics before changing credentials or thresholds. No created record means there was nothing eligible to deliver. |
| Pause safely | Disable monitoring through the protected owner control. Existing signals and outcomes remain preserved. |

The always-on worker serializes cycles, measures its actual interval, prevents overlapping evaluation, and uses durable active-signal and delivery claims to prevent duplicate sends. A stale setup is expired rather than treated as a fresh entry.

## News Alert and Khmer Translation

News Alert uses a separate Telegram credential pair from Auto Signal. It deduplicates market-news items and validates a complete Khmer translation batch before delivery. If the primary translation provider is unavailable or returns unusable Khmer, the backend uses its configured fallback. Retain the original language only when all translation paths fail, and label that condition clearly.

Scheduled news delivery must use a protected route and an authenticated scheduler. For an independent host, reproduce the authentication boundary; never expose an unauthenticated endpoint that can send Telegram messages.

## Provider Decision Rules

| Provider category | Operating rule |
|---|---|
| Market-data fallback | Keep provider credentials server-side, monitor rate limits, and label delayed or unavailable data. |
| AI provider | Use server-side routing and retain a safe fallback when an optional provider is unavailable or lacks account capacity. |
| Optional data source | Do not enable until credentials, symbol coverage, delay characteristics, usage limits, and licensing are confirmed. |

## Deployment and Schedule Changes

Publish or deploy the application before validating a changed callback route. Inspect the newest execution for the updated route and confirm its response, timing, and error state. If an existing scheduler points to a stale route, update that existing schedule rather than creating duplicate schedules.

Before enabling recurring delivery, run sign-in, market-data, news-filter, analysis, owner-control, database-write, Telegram, and scheduler smoke tests. Keep migrations under change control and maintain a tested rollback plan.

## Incident Triage

For an unavailable homepage, check host health, DNS, and application logs. For sign-in failures, verify the final OAuth redirect URI and origin configuration. For missing Telegram messages, first determine whether an eligible record exists, then inspect the matching delivery state without exposing tokens or destination identifiers. For AI errors, verify the provider account and allow the configured fallback to operate. For scheduler failures, pause recurring delivery, verify route authentication, perform a controlled authorized run, and resume only after the result is understood.

> Raito-FX Pro is intended for research and educational use. Market information may be delayed, incomplete, or incorrect. The application does not execute trades or provide personalised financial advice.
