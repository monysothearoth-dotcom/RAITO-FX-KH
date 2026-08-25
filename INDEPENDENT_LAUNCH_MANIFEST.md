# Raito-FX Pro — Complete Independent Launch Manifest

**Purpose:** This manifest describes the complete portable source handoff for launching Raito-FX Pro on infrastructure you control. The archive includes the complete application source, database schema and migrations, test suite, lockfile, configuration templates, and owner operating documents. It excludes managed deployment metadata, real secrets, generated dependencies, and logs.

## Included Application Contents

| Path or file | Included content | Why it is needed |
|---|---|---|
| `client/` | React 19 dashboard, workspace UI, styles, client tests, and public configuration. | Browser application. |
| `server/` | Express/tRPC API, market providers, AI routing, Telegram delivery, scheduling callbacks, and server tests. | Node.js backend and protected services. |
| `drizzle/` | Database schema, relations, and numbered SQL migrations. | MySQL/TiDB persistence setup. |
| `shared/` | Shared server/client types and constants. | Typed application contracts. |
| `package.json` and `pnpm-lock.yaml` | Exact Node dependency declarations and lockfile. | Reproducible installation. |
| `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `drizzle.config.ts` | Build, type-check, test, and migration configuration. | Local and production tooling. |
| `SELF_LAUNCH_*.md` | Owner launch, secret, operations, checklist, and release-note documents. | Self-managed launch procedure. |
| `LAUNCH_CHECKLIST.md`, `GITHUB_DEPLOYMENT.md`, `MANUS_LAUNCH_GUIDANCE.md` | Existing deployment and operating reference material. | External-host and managed-operation context. |

## Deliberately Excluded From the Archive

| Excluded item | Reason |
|---|---|
| `.project-config.json` | Managed deployment metadata; it can contain deployment credential material and is not portable. |
| `.env` and `.env.*` | Runtime secret files must never be transferred in source archives. |
| `node_modules/` | Generated dependencies; recreate from `pnpm-lock.yaml`. |
| `dist/` | Generated production output; recreate with `pnpm build`. |
| `.git/` | Local version history and repository metadata; create your own repository. |
| `.manus-logs/` and `storage/` | Local runtime logs and deployment-specific files. |

## Independent Launch Prerequisites

An independent launch requires a Node.js 22-compatible runtime, pnpm, a MySQL/TiDB-compatible database, an OAuth configuration compatible with the supplied application, encrypted environment-secret management, and a protected recurring scheduler. The scheduler must call the current protected Auto Signal and News Alert callback contracts securely; do not substitute a public unauthenticated Telegram send route.

The source uses backend-only provider keys. Configure them through your host secret manager following `SELF_LAUNCH_ENVIRONMENT.md`. The portable archive intentionally contains no secret values, Telegram destinations, database connection strings, or provider tokens.

## Independent Bootstrap Sequence

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
node dist/index.js
```

Before starting production traffic, apply the reviewed migrations in `drizzle/` to a new database, register the final HTTPS OAuth callback URI, configure the required environment variables, and verify sign-in and owner controls. Complete the detailed operational checks in `SELF_LAUNCH_CHECKLIST.md` before enabling either Telegram schedule.

## Important Feature Dependencies

| Feature | What an independent launch needs |
|---|---|
| Owner authentication | An OAuth application aligned with the runtime URLs and owner identity settings. |
| Persistent data | A MySQL/TiDB-compatible database with the supplied migrations applied. |
| News Alert | News bot/chat credentials, a protected scheduler, and the translation provider configuration. |
| Auto Signal Analyze | Dedicated Auto Signal bot/chat credentials, protected 60-second scheduling, AI-review providers, and market-data access. |
| Server AI | Valid backend provider accounts. Anthropic direct completions are intentionally deferred until account credit is available; safe fallbacks remain configured. |
| EODHD | Not included as an active provider; it is deferred until the owner provides a token and the appropriate license. |

> This package is the complete portable application handoff. It does not include third-party account credentials, paid-service entitlements, provider billing, or hosted database data. Those remain under the owner’s control and must be configured in the target environment.
