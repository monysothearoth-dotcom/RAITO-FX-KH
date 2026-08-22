import { normalizeSignalPayload, type SignalPayload } from "./signal";

export const MARKET_WATCH_RESEARCH_CONTEXT = `RAITO trading-research framework: start with the supplied market regime, higher-timeframe structure, and live price context; then reconcile technical structure, volatility, liquidity, macro or crypto-specific context, and verified event evidence. Every claim must be traceable to supplied context. Separate observations from scenario assumptions, define the structural invalidation and risk boundary, and reject contradictory, stale, thin-liquidity, or event-distorted setups. Never invent values, prices, calendar events, news sources, indicators, win rates, or profit certainty. A directional scenario is analytical research only, not trade execution or personalized financial advice.`;

export function inferWatchDomain(symbol: string): "forex" | "crypto" {
  const value = String(symbol || "").toUpperCase();
  return value.includes("USDT") || value.includes("BTC") || value.includes("ETH") || value.includes("SOL") || value.includes("XRP") ? "crypto" : "forex";
}

export function filterHeadlineEvidenceForSymbol<T extends { category?: string; relatedCurrency?: string; title?: string }>(symbol: string, headlines: T[]): T[] {
  const domain = inferWatchDomain(symbol);
  const target = String(symbol || "").toUpperCase().replace(/^[A-Z]+:/, "").replace(/[^A-Z0-9]/g, "");
  const asset = domain === "crypto" ? target.replace(/USDT$/, "") : target;
  const cryptoAliases: Record<string, string> = { BTC: "BITCOIN", ETH: "ETHEREUM", SOL: "SOLANA", XRP: "RIPPLE", BNB: "BINANCECOIN" };
  return headlines.filter((headline) => {
    if (String(headline.category || "").toLowerCase() !== domain) return false;
    const related = String(headline.relatedCurrency || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const text = `${headline.title || ""} ${headline.relatedCurrency || ""}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (domain === "forex") return related === asset || text.includes(asset);
    return related === asset || related === `${asset}USDT` || text.includes(asset) || Boolean(cryptoAliases[asset] && text.includes(cryptoAliases[asset]));
  });
}

export function buildHeadlineEvidenceForSymbol<T extends { category: string; relatedCurrency: string; title: string; source: string; timestamp: number }>(symbol: string, source: { items: T[]; sourceFailures: string[] }) {
  const headlines = filterHeadlineEvidenceForSymbol(symbol, source.items).slice(0, 8).map((item) => ({ title: item.title, source: item.source, timestamp: item.timestamp, category: item.category, relatedCurrency: item.relatedCurrency }));
  return {
    status: headlines.length ? "available" as const : source.sourceFailures.length && !source.items.length ? "unavailable" as const : "no_relevant_headlines" as const,
    sourceFailures: source.sourceFailures,
    headlines,
  };
}

export function selectMarketResearchContext(symbol: string, contexts: { macro: unknown; crypto: unknown }): unknown {
  return inferWatchDomain(symbol) === "crypto" ? contexts.crypto : contexts.macro;
}

export function buildMarketWatchValidationPrompt(input: { symbol: string; strategy?: string; timeframe?: string; customPrompt?: string; chartContext: unknown; macroContext: unknown; cryptoContext: unknown; eventEvidence?: unknown; headlineEvidence?: unknown }): string {
  return buildMarketWatchPrompt({ ...input, marketContext: selectMarketResearchContext(input.symbol, { macro: input.macroContext, crypto: input.cryptoContext }) });
}

export function buildMarketWatchPrompt(input: { symbol: string; strategy?: string; timeframe?: string; customPrompt?: string; chartContext: unknown; marketContext?: unknown; eventEvidence?: unknown; headlineEvidence?: unknown }): string {
  const domain = inferWatchDomain(input.symbol);
  const domainContext = domain === "crypto" ? "For Crypto, evaluate token supply/unlocks, liquidity, funding/open interest, spot-versus-derivatives participation, protocol/event risk, and on-chain context when supplied." : "For Forex, evaluate central-bank reaction functions, rate/yield differentials, inflation, employment, growth, risk sentiment, and the event calendar when supplied.";
  return `You are one member of a unified market-watch panel. Analyze ${input.symbol} using only the supplied evidence. Strategy: ${input.strategy || "technical analysis"}. Timeframe: ${input.timeframe || "1h"}. User instruction: ${input.customPrompt || "Find the most defensible trade direction."}\n\n${MARKET_WATCH_RESEARCH_CONTEXT}\n${domainContext}\n\nLIVE MACRO / CRYPTO RESEARCH SNAPSHOT (use only as supplied context): ${JSON.stringify(input.marketContext || {})}\n\nVERIFIED ECONOMIC EVENT EVIDENCE: ${JSON.stringify(input.eventEvidence || { status: "unavailable", instruction: "Do not claim any high-impact event." })}\n\nVERIFIED MARKET NEWS HEADLINES: ${JSON.stringify(input.headlineEvidence || { status: "not_requested", headlines: [] })}\n\nLIVE CHART CONTEXT (do not invent values): ${JSON.stringify(input.chartContext)}\n\nEvent rules: if verified event status is no_upcoming_high_impact, explicitly state that no high-impact calendar event is verified within the supplied horizon and do not name FOMC, CPI, NFP, payrolls, central-bank decisions, or other high-impact releases as current catalysts. If status is unavailable, say the calendar could not be verified; never replace that with a claim of no events. Only describe an event listed in VERIFIED ECONOMIC EVENT EVIDENCE.\n\nHeadline rules: only reference a headline title, source, timestamp, or claimed catalyst when it appears in VERIFIED MARKET NEWS HEADLINES. If the headline status is no_relevant_headlines or unavailable, state that no verified relevant headline was supplied or that headline retrieval was unavailable; do not invent a news item or source. Do not attribute information to Bloomberg, Reuters, or any source not supplied.\n\nReturn strict JSON only with recommendation (BUY or SELL), confidence (0-100), entryPrice, stopLoss, takeProfit, rationale, indicators, and warning. Treat confidence as scenario confidence, never as win probability. When evidence is mixed, keep the direction as a conditional scenario and make the warning explain the missing confirmation, invalidation, and risk boundary. Never guarantee profit.`;
}

export type WatchCandidate = {
  provider: string;
  text: string;
  payload: unknown;
};

export type RankedWatchCandidate = WatchCandidate & {
  signal: SignalPayload;
  setupScore: number;
  riskReward: number;
};

export type MarketWatchConsensus = SignalPayload & {
  watchMode: "unified";
  bestSetupOnly: true;
  selectedProvider: string;
  setupScore: number;
  riskReward: number;
  providerVotes: Record<"BUY" | "SELL", number>;
  agreementPercent: number;
  providersAnalyzed: string[];
  providerStatuses: Array<{ provider: string; status: "ok" | "failed"; recommendation?: "BUY" | "SELL"; error?: string }>;
  consensusRationale: string;
  selectionReason: string;
};

function calculateRiskReward(signal: SignalPayload): number {
  const risk = Math.abs(signal.entryPrice - signal.stopLoss);
  const reward = Math.abs(signal.takeProfit - signal.entryPrice);
  if (!risk || !Number.isFinite(risk) || !Number.isFinite(reward)) return 0;
  return Math.max(0, reward / risk);
}

export function rankMarketWatchCandidate(candidate: WatchCandidate, fallbackPrice: number, alignmentPercent: number): RankedWatchCandidate {
  const signal = normalizeSignalPayload(candidate.payload, fallbackPrice, candidate.text);
  const riskReward = calculateRiskReward(signal);
  const confidenceScore = Math.min(100, Math.max(0, signal.confidence));
  const riskRewardScore = Math.min(25, (riskReward / 3) * 25);
  const alignmentScore = Math.min(15, (alignmentPercent / 100) * 15);
  const warningPenalty = /uncertain|incomplete|conflict|limitation|high risk/i.test(signal.warning) ? 8 : 0;
  const setupScore = Math.round(Math.max(0, confidenceScore * 0.6 + riskRewardScore + alignmentScore - warningPenalty));
  return { ...candidate, signal, riskReward, setupScore };
}

export function buildMarketWatchConsensus(candidates: WatchCandidate[], fallbackPrice: number): MarketWatchConsensus {
  const initial = candidates.map((candidate) => ({
    candidate,
    signal: normalizeSignalPayload(candidate.payload, fallbackPrice, candidate.text),
  }));
  const providerVotes = {
    BUY: initial.filter((candidate) => candidate.signal.recommendation === "BUY").length,
    SELL: initial.filter((candidate) => candidate.signal.recommendation === "SELL").length,
  } as Record<"BUY" | "SELL", number>;
  const total = initial.length || 1;
  const majorityDirection = providerVotes.SELL > providerVotes.BUY ? "SELL" : "BUY";
  const agreementPercent = Math.round((Math.max(providerVotes.BUY, providerVotes.SELL) / total) * 100);
  const ranked = initial.map(({ candidate }) => rankMarketWatchCandidate(candidate, fallbackPrice, agreementPercent));
  ranked.sort((a, b) => {
    const aAligned = a.signal.recommendation === majorityDirection ? 1 : 0;
    const bAligned = b.signal.recommendation === majorityDirection ? 1 : 0;
    return (b.setupScore + bAligned * 4) - (a.setupScore + aAligned * 4);
  });
  const best = ranked[0] || {
    provider: "market-watch",
    text: "",
    payload: {},
    signal: normalizeSignalPayload({}, fallbackPrice, "No provider returned a structured signal."),
    setupScore: 0,
    riskReward: 0,
  };
  const providerStatuses = ranked.map((candidate) => ({
    provider: candidate.provider,
    status: "ok" as const,
    recommendation: candidate.signal.recommendation,
  }));
  const selectionReason = `Selected ${best.provider} as the strongest setup using ${best.setupScore}/100 setup quality: ${Math.round(best.signal.confidence)}% confidence, ${best.riskReward.toFixed(2)}R risk-to-reward, and ${best.signal.recommendation === majorityDirection ? "alignment with the panel direction" : "the strongest individual risk-adjusted setup despite a split panel"}.`;
  return {
    ...best.signal,
    watchMode: "unified",
    bestSetupOnly: true,
    selectedProvider: best.provider,
    setupScore: best.setupScore,
    riskReward: Number(best.riskReward.toFixed(2)),
    providerVotes,
    agreementPercent,
    providersAnalyzed: ranked.map((candidate) => candidate.provider),
    providerStatuses,
    consensusRationale: `Unified Market Watch compared ${ranked.length} live-chart analyses and returned one strongest setup only.`,
    selectionReason,
  };
}
