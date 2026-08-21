---
name: market-analysis-platform-builder
description: Build or extend professional Forex and Cryptocurrency market-analysis dashboards with free/public data, unified AI research grounding, paper-trading validation, macro indicators, crypto derivatives/on-chain panels, and responsive UX. Use for live trading dashboards, Signal Analyze/Market Watch systems, research libraries, paper-trade tracking, and related validation workflows.
---

# Market Analysis Platform Builder

Use this skill to implement market-analysis features as an evidence-grounded workflow rather than a collection of disconnected widgets. Keep all outputs risk-aware: never promise returns, never invent unavailable values, and distinguish live, delayed, estimated, and unavailable data.

## Standard workflow

1. Inspect the existing project before coding. Locate the dashboard shell, chart context, news routes, AI prompt builders, database schema, tRPC procedures, tests, and navigation. Reuse existing components and contracts.
2. Record requested features in the project TODO before implementation. Separate persistence, server aggregation, UI, AI grounding, and test work.
3. Choose the smallest reliable public source set. Prefer structured APIs or documented CSV endpoints. Add per-source timeouts, graceful partial responses, freshness timestamps, source labels, and refresh recommendations. Never make the UI depend on every source succeeding.
4. Define data contracts before UI. For live panels, include `data`, `sourceStatus`, `lastUpdated`, `refreshRecommendedSeconds`, and explicit unavailable values. Normalize external response shapes at the server boundary.
5. For AI market analysis, provide one shared live context and a server-enforced research prompt. Classify the symbol as Forex or Crypto; apply technical structure, relevant macro/fundamental factors, volatility/liquidity, invalidation, and risk/reward. Normalize signals to BUY/SELL only. If selecting one setup, rank candidates deterministically by confidence, risk/reward, alignment, and warning penalties, and expose the selection reason.
6. For paper trading, capture the selected setup—not a competing provider list—with symbol, direction, strategy, provider, setup score, entry, stop, target, size, rationale, status, open/close timestamps, close price, and P&L. Keep it explicitly simulation-only. Scope database queries by authenticated user.
7. Build panels for macro indicators, crypto market structure, and validation. Macro should cover CPI, employment/unemployment, policy rate, 2Y/10Y yields, and the 10Y–2Y differential. Crypto should cover funding rate, open interest, mark/index price, token unlocks, and on-chain activity. Validation should cover open setups, target/stop/manual close actions, win rate, wins/losses, total and average modeled P&L, and a clear sign-in/persistence state.
8. Integrate navigation and AI context without breaking chart, news, journal, or alert flows. Use mobile-first responsive cards, compact metric grids, loading/error/empty states, keyboard-accessible controls, and visible source/disclaimer text.
9. Test contracts and behavior. Add unit tests for parsers, domain classification, ranking/P&L calculations, and source fallbacks; add render/source-contract tests for panels; run typecheck, all Vitest tests, production build, endpoint smoke tests, and desktop/mobile screenshots.
10. Read the complete TODO, mark finished items, save a checkpoint, and deliver the checkpoint plus the skill file when reusable workflow packaging is requested.

## Source patterns

Use free/public endpoints only when that is the product constraint. Suitable patterns include FRED public `fredgraph.csv` for CPI, unemployment, FEDFUNDS, DGS2, and DGS10; Binance Futures public market endpoints for funding and open interest; Blockchain.com public stats for Bitcoin network context; DefiLlama public endpoints for unlock/DeFi context; and Yahoo Finance chart/news endpoints for current market context. Confirm endpoint availability and response shape before relying on a source. Document rate limits and expected delay in the UI.

## Paper-trade rules

Treat a paper trade as a measured hypothesis. Calculate directional P&L as `(close - entry) / entry * 100` for BUY and the inverse for SELL. Do not close records automatically from a guessed price; when automated evaluation is requested, require a trustworthy live price and record the evaluation timestamp. Never use sample trades or fabricated outcomes as real user history. Keep open, target hit, stopped out, closed, and cancelled states distinct.

## Database rules

Edit the Drizzle schema first, run `pnpm drizzle-kit generate`, review the generated SQL, and apply it with the database migration tool. Add user-scoped helpers and protected tRPC procedures. Avoid destructive SQL. Add authorization tests for list, create, close, and summary operations.

## Quality guardrails

Do not call an AI provider directly from the browser with a secret. Keep runtime keys server-side or in the existing runtime-key flow, sanitize provider metadata, and never return raw keys. Do not describe a signal as perfect, guaranteed, or certain. Use “paper trade,” “modeled return,” “confidence,” and “risk warning” accurately. When data is unavailable, say so and preserve the rest of the panel.

## Deliverables checklist

Before delivery, confirm that the dashboard has the requested navigation, source/freshness metadata, graceful fallbacks, persistent paper records when authenticated, a measurable performance summary, AI prompt grounding at the server layer, regression tests, a production build, responsive screenshots, a saved project checkpoint, and a validated `/home/ubuntu/skills/market-analysis-platform-builder/SKILL.md`.

## News-effect filtering and outcome tracking

When adding news analysis, normalize each headline to one display effect: `BUY`, `SELL`, or `MIXED`; render these as a user-facing Buy/Bullish, Sell/Bearish, or Normal/No Effect label. Add a dashboard filter with `All`, `Buy`, `Sell`, and `Normal` options, and apply consistent effect-based card borders/backgrounds without relying on color alone.

For measurable validation, let authenticated users track a headline against a server-captured baseline price for an affected instrument. Store the stable headline fingerprint, predicted effect, baseline timestamp and price, evaluation window, current price, movement percentage, actual effect, outcome, and evaluation timestamp. Classify actual movement with a documented neutral threshold; treat flat movement as `NORMAL`, compare it separately from directional misses, and expose pending, correct, incorrect, neutral, unavailable, and accuracy metrics. Never fabricate outcomes or use a client-supplied price as the authoritative baseline. Use public quote endpoints with timeouts and mark unavailable data explicitly.

Add protected list, track, and evaluate procedures scoped by authenticated `userId`. Include tracking records in privacy export and transactional account deletion. Test the fingerprint, movement classification, neutral threshold, ownership boundary, duplicate suppression, and summary metrics. Keep the workflow simulation/measurement-only and avoid presenting historical accuracy as a guarantee.
