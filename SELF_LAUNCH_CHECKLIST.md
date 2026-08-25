# Raito-FX Pro — Final Self-Launch Checklist

Use this checklist in order. Record the date, owner, and result in your own launch log; do not paste secret values into the log.

## 1. Ownership and Domain

- [ ] Confirm the final production domain is assigned and resolves over HTTPS.
- [ ] Confirm the site title, legal contact details, and visibility setting are correct.
- [ ] Confirm an owner account can sign in and a non-owner account cannot access owner controls.
- [ ] Add the final HTTPS domain, callback path, and origin to the OAuth provider configuration.

## 2. Security and Configuration

- [ ] Review `SELF_LAUNCH_ENVIRONMENT.md` and enter required values only in encrypted secret settings.
- [ ] Confirm no `.env`, token, chat ID, database URL, `dist/`, `node_modules/`, or logs are committed to source control.
- [ ] Confirm the News Alert Telegram bot/chat pair and Auto Signal Telegram bot/chat pair are intentionally separate.
- [ ] Rotate any credential that has ever been pasted into an insecure location.

## 3. Product Smoke Test

- [ ] Visit the live site signed out; confirm the landing screen and market list load.
- [ ] Sign in as owner; confirm All Assets, Markets & Chart, Auto Signal Analyze, Signal Analyze, All-In-One AI Engine, RAITO Agent, Economic Calendar & News, and Market Pulse load.
- [ ] Verify All Assets is first in navigation and RAITO Agent branding is visible.
- [ ] Verify Market Pulse pairs are grouped and readable on desktop and mobile.
- [ ] Run a News Analyze request; confirm it distinguishes verified high-impact events, relevant headlines, no relevant headlines, and unavailable evidence.

## 4. AI and Market Providers

- [ ] Confirm Alpha Vantage and CoinGecko remain server-only; no browser provider-key input is visible.
- [ ] Confirm Gemini/platform fallback remains usable.
- [ ] If Claude is expected to answer directly, confirm the Anthropic API account has available completion credit and rerun the Claude workflow validation.
- [ ] Leave EODHD disabled unless its token and commercial-use requirements are satisfied.

## 5. News Alert and Auto Signal

- [ ] Enable News Alert as owner only after confirming its Telegram destination.
- [ ] Verify the next protected News Alert schedule callback returns HTTP 200.
- [ ] Confirm a successful News Alert health record and deduplicated delivery behavior.
- [ ] Enable Auto Signal only after reviewing its 78 confidence, 82 confluence, and 1.8 risk/reward thresholds.
- [ ] Verify the next Auto Signal monitor returns HTTP 200 and `lastRunAt` updates.
- [ ] Treat `created: 0` and `delivered: 0` as a selective skip unless diagnostics identify a system error.
- [ ] For any qualifying signal, confirm the saved signal record exists before its Telegram delivery is expected.

## 6. Final Go/No-Go

- [ ] Confirm the current production build and regression suite have passed.
- [ ] Confirm no active application, authentication, schedule, or delivery errors are present.
- [ ] Review `SELF_LAUNCH_OPERATIONS.md` and record the owner responsible for daily monitoring.
- [ ] Keep a rollback point before enabling public visibility or changing core secrets.

> **Go decision:** Launch only when all required items above are checked and the owner can independently confirm sign-in, live data, protected schedule execution, and intended Telegram destinations.
