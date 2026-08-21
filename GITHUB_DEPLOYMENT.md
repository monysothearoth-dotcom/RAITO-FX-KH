# Raito-FX Pro: GitHub and Deployment Guide

This archive contains the complete Raito-FX Pro source code, database schema and migrations, tests, scripts, and reusable market-analysis skill guidance. Do not commit real credentials, local logs, generated dependencies, or build output.

## Push to GitHub

Create an empty repository on GitHub, then from the project root run:

```bash
git init
git add .
git commit -m "Initial Raito-FX Pro source"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPOSITORY.git
git push -u origin main
```

The repository should contain the source tree and `pnpm-lock.yaml`. Do not commit `.env`, database credentials, OAuth secrets, Gemini keys, Telegram bot tokens, or generated `dist/` and `node_modules/` directories.

## Required runtime configuration

Set these values in the deployment provider's secret manager rather than committing them:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Browser OAuth portal URL |
| `OWNER_OPEN_ID` and `OWNER_NAME` | Project-owner identity |
| `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` | Server-side platform APIs |
| `VITE_FRONTEND_FORGE_API_URL` and `VITE_FRONTEND_FORGE_API_KEY` | Frontend platform API access |
| `GEMINI_API_KEY` | Gemini-powered analysis and translation |
| `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` | Unattended Telegram news delivery |

Use the exact values already configured in the Manus project when deploying there. Never paste them into GitHub.

## Install, migrate, test, and build

```bash
pnpm install --frozen-lockfile
pnpm drizzle-kit generate
pnpm check
pnpm test
pnpm build
```

Apply the reviewed SQL files in `drizzle/` to the target database in migration order. The project requires a persistent MySQL/TiDB database for accounts, preferences, Telegram settings, paper trades, and news-effect tracking. Database migrations are non-destructive additions in the included release history.

## Run locally

```bash
pnpm dev
```

The server must receive its port from the hosting environment; do not hardcode a deployment port. The production server is built from `server/_core/index.ts` and the Vite client output.

## Hosting note

The validated published deployment is already live at `https://marketdash-tsbnfxxs.manus.space`. GitHub stores the source; it does not host the running application by itself. If using an external Node host, configure Node 22+, pnpm, the environment variables above, the database, OAuth callback URL, and the persistent scheduler/Heartbeat equivalent required for 60-second Telegram delivery. Manus hosting remains the compatibility-tested deployment target.
