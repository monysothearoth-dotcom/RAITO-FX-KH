# Raito-FX Pro — Owner Operations Guide

## Daily Operating Checks

Open the production domain as both a signed-out visitor and the project owner. Confirm that the application loads over HTTPS, market cards populate, sign-in completes, and owner-only controls are not visible to ordinary visitors. Review the latest schedule result after any deployment that changes a callback route.

| Surface | Healthy result | Investigate when |
|---|---|---|
| Market data | Primary prices and fallback labels load without browser key prompts. | Repeated blank prices or a provider error persists. |
| News Alert | The latest schedule callback is HTTP 200; settings show no active source outage. | `lastError` is populated, no run time advances, or delivery count stops unexpectedly. |
| Auto Signal | The monitor callback is HTTP 200 and `lastRunAt` advances. | The schedule reports an error or the control panel shows pending deliveries. |
| Telegram | News/signal deliveries record successfully when an eligible item exists. | A persisted eligible item exists but no delivery record follows. |
| AI | The selected analysis returns a cautious, grounded response or visibly uses an allowed fallback. | A provider error is returned without a fallback or credentials were recently replaced. |

## Auto Signal Analyze

Auto Signal is selective by design. The current owner settings use a minimum confidence of **78**, confluence score of **82**, and risk/reward of **1.8**. An HTTP 200 monitor response with `created: 0` and `delivered: 0` is normally an eligibility skip, not a Telegram failure.

Each monitor response includes per-symbol diagnostic information for: live-price availability, historical sample coverage, SMA/EMA directional alignment, high-impact event risk, confidence, confluence, and risk/reward thresholds. Only a qualifying candidate is persisted and placed in the Telegram delivery queue. Do not lower thresholds merely to force messages during a quiet or conflicting market.

| Action | Owner procedure |
|---|---|
| Enable monitoring | Sign in as owner, open **Auto Signal Analyze**, review thresholds and the dedicated Telegram destination, then enable monitoring. |
| Confirm a signal send | Check that a signal record was created first, then confirm its matching delivery record. |
| No message received | Inspect the monitor diagnostic before checking Telegram. `created: 0` means there was nothing eligible to deliver. |
| Pause safely | Disable monitoring in the owner control. Existing signals and outcome history remain preserved. |

## News Alert and Khmer Translation

News Alert uses its own Telegram credential pair. It delivers deduplicated market news and uses a Khmer-first Claude translation attempt. If Claude is unavailable or returns unusable Khmer, the backend retries with Gemini. English is kept only if neither translation path returns valid Khmer.

The published News Alert callback is `/api/scheduled/telegram-news`; the current protected Heartbeat is scheduled every 60 seconds. Keep the route protected. For an external host, reproduce the authentication mechanism for the scheduler rather than exposing an unauthenticated endpoint.

## Provider Status and Decision Rules

| Provider | Use | Decision rule |
|---|---|---|
| Alpha Vantage | Server stock fallback | Keep enabled as a backend-only fallback. |
| CoinGecko | Server crypto fallback | Keep enabled as a backend-only fallback. |
| Anthropic Claude | Analysis selection and Khmer primary path | The key authenticates, but completions need available API-account credit. Retain Gemini/platform fallback until then. |
| EODHD | Optional future source | Leave disabled until a token and required license are available. |

## Deployment and Schedule Change Procedure

Publish the application before validating any changed scheduled route. Then inspect the next scheduled execution. A fresh HTTP 200 confirms the current route, while an older HTTP 404 is historical evidence from a previous deployment. If a pre-existing schedule retains a stale path, refresh that schedule and inspect the following run before creating a second task.

## Incident Triage

1. **Homepage unavailable:** check hosting health, DNS/domain settings, and current deployment logs.
2. **Owner cannot sign in:** confirm final OAuth redirect URI, origin, and owner identity configuration.
3. **No Telegram message:** determine whether a persisted signal/news item exists; then check the relevant delivery record, bot credential, and chat identifier.
4. **Claude error:** verify the API-account completion credit. The application should continue via safe fallback paths.
5. **External host scheduler failure:** pause the scheduler, verify route authentication, perform a controlled owner-authorized run, then resume.

Do not remove or disclose logs containing identifiers, tokens, chat IDs, session information, or provider response bodies without review.
