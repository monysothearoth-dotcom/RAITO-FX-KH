# Raito-FX Pro — Self-Launch Guide

Raito-FX Pro is a full-stack market-analysis application with user authentication, a MySQL-compatible database, server-managed AI and market-data providers, owner-controlled Telegram delivery, and protected recurring monitor routes. This guide explains how to launch the application on infrastructure you control without exposing credentials or weakening the application’s delivery safeguards.

> **Important:** The application provides market research and risk-aware analytical scenarios. It does not execute trades, guarantee returns, or provide personalised financial advice.

## Choose a Launch Path

| Path | When to use it | What you manage |
|---|---|---|
| Managed hosting | You want integrated hosting, authentication, database services, and recurring-job management. | Domain, owner activation, provider readiness, and monitoring. |
| Independent hosting | You want full infrastructure ownership. | Node hosting, database, OAuth, secrets, migrations, protected scheduling, backups, and monitoring. |

The managed path may require fewer infrastructure tasks. An independent host must reproduce the security boundary around authentication, provider credentials, and Telegram delivery. Never make a Telegram-sending route public just to simplify scheduling.

## Package Contents

| File | Purpose |
|---|---|
| `README.md` | Public overview, architecture, security, development, and deployment orientation. |
| `SELF_LAUNCH_ENVIRONMENT.md` | Credential inventory and value-free environment template. |
| `SELF_LAUNCH_CHECKLIST.md` | Go/no-go launch sequence and smoke tests. |
| `SELF_LAUNCH_OPERATIONS.md` | Ongoing monitoring and incident-response guidance. |
| `MANUS_LAUNCH_GUIDANCE.md` | Generic technical configuration and security guidance. |
| `LAUNCH_CHECKLIST.md` | Independent deployment instructions. |
| `GITHUB_DEPLOYMENT.md` | Source-control and external-host setup notes. |

## Launch Readiness Checklist

Before a public launch, confirm that the production build and tests pass, database migrations are applied to the intended database, OAuth uses the final HTTPS callback URL, required market-data sources are available, owner controls are protected, and every secret is stored in an encrypted secret manager.

For Telegram delivery, configure separate backend-only credentials for News Alert and Auto Signal. Test each destination deliberately before enabling recurring delivery. Auto Signal sends only qualifying persisted signals; no message should be sent merely to prove that the monitor is running.

AI and market-data provider availability can vary by account, rate limit, region, and license. Keep fallback providers configured where appropriate, and label unavailable or delayed evidence instead of treating it as zero or certainty. Optional providers should remain disabled until their credentials, coverage, and licensing are confirmed.

## Recommended Sequence

Start with `SELF_LAUNCH_ENVIRONMENT.md`, then follow `SELF_LAUNCH_CHECKLIST.md`. Apply database migrations before enabling application traffic. Complete sign-in, market-data, analysis, owner-control, Telegram, and scheduler smoke tests in a non-production environment first. Use `SELF_LAUNCH_OPERATIONS.md` for ongoing review after launch.

## Security Boundaries

Keep session secrets, OAuth credentials, AI provider keys, market-data keys, Telegram bot tokens, and database credentials server-side. Do not put them in browser code, application tables, source control, screenshots, logs, or populated environment files committed to the repository. Protect recurring routes with authenticated scheduler requests and retain an auditable change and rollback process.

## Disclaimer

This software is provided for research and educational use. Market information can be delayed, incomplete, or incorrect. Users remain responsible for their own decisions, risk controls, legal obligations, and provider agreements.
