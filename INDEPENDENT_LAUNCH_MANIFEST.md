# Raito-FX Pro — Independent Launch Manifest

This manifest describes the portable Raito-FX Pro source handoff for launching the application on infrastructure you control. The repository includes the application source, database schema and migrations, tests, lockfile, configuration templates, and deployment guidance. It excludes real secrets, generated dependencies, build output, runtime logs, local storage, and repository-specific deployment metadata.

## Included Application Contents

| Path or file | Included content | Why it is needed |
|---|---|---|
| `client/` | React dashboard, workspace UI, styles, client tests, and public configuration. | Browser application. |
| `server/` | Express/tRPC API, market providers, AI routing, Telegram delivery, protected callbacks, and server tests. | Node.js backend and protected services. |
| `drizzle/` | Database schema, relations, and numbered SQL migrations. | MySQL-compatible persistence setup. |
| `shared/` | Shared server/client types and constants. | Typed application contracts. |
| `package.json` and `pnpm-lock.yaml` | Dependency declarations and lockfile. | Reproducible installation. |
| `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `drizzle.config.ts` | Build, type-check, test, and migration configuration. | Local and production tooling. |
| `README.md` | Public overview, architecture, security, development, and deployment orientation. | Public project entry point. |
| `SELF_LAUNCH_*.md` | Configuration, checklist, operations, and release guidance. | Self-managed launch procedure. |
| `LAUNCH_CHECKLIST.md`, `GITHUB_DEPLOYMENT.md`, `MANUS_LAUNCH_GUIDANCE.md` | Generic deployment and operating references. | External-host setup and secure scheduling. |

## Deliberately Excluded From Portable Source

| Excluded item | Reason |
|---|---|
| Managed deployment metadata | Host-specific configuration can contain deployment credentials and is not portable. |
| `.env` and `.env.*` | Runtime secret files must never be transferred in source archives. |
| `node_modules/` | Generated dependencies; recreate from `pnpm-lock.yaml`. |
| `dist/` | Generated production output; recreate with `pnpm build`. |
| `.git/` | Local repository history and remotes; create or connect your own repository. |
| Runtime logs, local storage, and database exports | May contain private operational data, sessions, identifiers, or user records. |

## Independent Launch Prerequisites

An independent launch requires a Node.js-compatible runtime, pnpm, a MySQL-compatible database, an OAuth configuration compatible with the application, encrypted environment-secret management, and a protected recurring scheduler or always-on worker. Scheduled callbacks must be authenticated; do not substitute a public unauthenticated Telegram send route.

The source uses backend-only provider keys. Configure them through the target host’s encrypted secret manager using `SELF_LAUNCH_ENVIRONMENT.md`. The portable source intentionally contains no secret values, Telegram destinations, database connection strings, or provider tokens.

## Bootstrap Sequence

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
node dist/index.js
```

Before starting production traffic, apply the reviewed migrations in `drizzle/` to a new database, register the final HTTPS OAuth callback URI, configure the required environment variables, and verify sign-in and owner controls. Complete the checks in `SELF_LAUNCH_CHECKLIST.md` before enabling Telegram delivery.

## Feature Dependencies

| Feature | Independent-launch requirement |
|---|---|
| Owner authentication | An OAuth application aligned with runtime URLs and the authorized owner identity. |
| Persistent data | A MySQL-compatible database with the supplied migrations applied. |
| News Alert | A dedicated bot/destination configuration, protected scheduler, and translation-provider configuration. |
| Auto Signal Analyze | A dedicated bot/destination configuration, protected recurring or always-on monitoring, AI-review providers, and market-data access. |
| Server AI | Valid backend provider accounts and a configured fallback path. |
| Optional market data | Valid credentials, appropriate symbol coverage, acceptable delay, rate limits, and licensing. |

> This is a portable application source handoff. It does not include third-party account credentials, paid-service entitlements, provider billing, hosted database data, or user records. Those remain under the deployment operator’s control.
