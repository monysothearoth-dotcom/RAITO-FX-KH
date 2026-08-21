# Raito-FX Pro Independent Launch Checklist

## Source ownership

Extract the supplied ZIP and place its contents directly in the root of your GitHub repository. Confirm that `client/src/App.tsx`, `server/_core/index.ts`, `shared/`, `drizzle/schema.ts`, all numbered migration files, `package.json`, and `pnpm-lock.yaml` exist at the repository root. Do not upload the ZIP as one file or create a second nested wrapper directory.

## GitHub

```bash
cd /path/to/RAITO-FX.KH
git init
git branch -M main
git add .
git commit -m "Launch Raito-FX Pro"
git remote add origin https://github.com/YOUR_USER/RAITO-FX.KH.git
git push -u origin main
```

Keep the repository free of `.env` files, API keys, database credentials, Telegram tokens, `node_modules`, `dist`, local logs, and project metadata. Use GitHub Actions only for build/deploy automation; GitHub Pages cannot run this full-stack application.

## Hosting

Choose a Node.js host that provides a persistent web service. Render Web Service, Railway, or an Ubuntu VPS are suitable. Configure Node.js 22 or a compatible current version, then use:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
node dist/index.js
```

The build command is `corepack enable && pnpm install --frozen-lockfile && pnpm build`. The start command is `node dist/index.js`. The service must listen on the host-provided `PORT`.

## Database

Provision MySQL or TiDB and set `DATABASE_URL`. Apply the numbered SQL files in `drizzle/` in order, only applying migrations that are not already installed. Back up the database before production migrations. The database stores users, account preferences, paper trades, Telegram configuration, and news-effect tracking records.

## Required secrets

Set the following in the host's encrypted environment-variable manager: `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, the configured Gemini API key, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`. Never commit real values to GitHub. Rotate any credential that has been exposed publicly.

## OAuth

Add the final HTTPS domain to the identity provider's allowed redirect URLs and allowed origins. Confirm that the callback path and protocol exactly match the deployed application. Test first-time sign-up, returning sign-in, logout, passwordless recovery guidance, and account settings.

## Telegram delivery

Configure the bot token and recipient chat ID. Validate that the bot can send to the destination and that the destination is not another bot. Enable delivery from the owner-only dashboard control. The application sends bilingual Khmer/English news, market-effect labels, high-impact pre-release alerts, and deduplicated messages.

The Manus deployment used a platform-managed 60-second Heartbeat. On an external host, that scheduler is not automatically transferred. Use a persistent worker, managed cron, or VPS cron to invoke the protected scheduled Telegram endpoint every minute. Preserve the endpoint's authentication requirement and do not expose an unauthenticated send route. Confirm health metrics show successful runs, sent messages, skipped duplicates, and no consecutive failures.

## Verification

```bash
pnpm check
pnpm test
pnpm build
```

After deployment, verify the HTTPS homepage, OAuth session, database read/write, live market data, news feed, Buy/Sell/Normal filter, color-coded news cards, effect tracking, Khmer translation fallback, Telegram delivery, high-impact alerts, account export, and confirmed account deletion. Close the browser and confirm scheduled Telegram delivery continues.

## Recommended launch order

Create the database first, configure secrets second, deploy the Node service third, run migrations fourth, configure OAuth fifth, configure Telegram sixth, and enable the scheduler last. This order prevents the scheduler from sending incomplete or unauthenticated messages.

## Important limitation

The application can be owned and operated independently from the supplied source, but external hosting requires you to provide your own database, secrets, OAuth application configuration, AI credentials, Telegram credentials, and scheduler. GitHub stores the source; the Node host runs the application.
