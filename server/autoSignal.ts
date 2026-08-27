import { buildPreReleaseSignals, type EconomicCalendarEvent } from "./highImpactNews";
import { exponentialMovingAverage, simpleMovingAverage } from "./marketData";

export type AutoSignalDirection = "BUY" | "SELL";
export type AutoSignalStatus = "OPEN" | "TP_HIT" | "SL_HIT" | "EXPIRED" | "CANCELLED";
export type AutoSignalSource = "TECHNICAL" | "PRE_NEWS";
export type AutoSignalDeliveryType = "SIGNAL" | "OUTCOME";
export type AutoSignalReview = { approved: boolean; provider: string; note: string };

export type AutoSignalPrice = {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
};

export type AutoSignalThresholds = {
  minConfidence: number;
  minScore: number;
  minRiskReward: number;
};

export type AutoSignalEligibilityDiagnostic = {
  symbol: "XAUUSD" | "BTCUSD";
  eligible: boolean;
  reason: string;
  confidence?: number;
  intelligenceScore?: number;
  riskReward?: number;
};

export type AutoSignalCandidate = {
  fingerprint: string;
  source: AutoSignalSource;
  symbol: "XAUUSD" | "BTCUSD";
  direction: AutoSignalDirection;
  status: "OPEN";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  technicalScore: number;
  strategyScore: number;
  fundamentalScore: number;
  intelligenceScore: number;
  riskReward: number;
  rationale: string;
  warning: string;
  newsEvent?: string;
  newsScheduledAt?: Date;
};

export type PersistedAutoSignal = Omit<AutoSignalCandidate, "symbol" | "status" | "warning" | "newsEvent" | "newsScheduledAt"> & {
  id: number;
  userId: number;
  symbol: string;
  status: AutoSignalStatus;
  warning?: string | null;
  newsEvent?: string | null;
  newsScheduledAt?: Date | null;
  outcomePrice?: number | null;
  outcomeDetails?: string | null;
  openedAt: Date;
  resolvedAt?: Date | null;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function instrumentRiskFraction(symbol: "XAUUSD" | "BTCUSD") {
  return symbol === "XAUUSD" ? 0.0025 : 0.006;
}

function resolveSymbolPrice(prices: Record<string, AutoSignalPrice>, symbol: "XAUUSD" | "BTCUSD") {
  return symbol === "XAUUSD" ? prices["OANDA:XAUUSD"] : prices["BINANCE:BTCUSDT"];
}

export async function fetchAutoSignalHistoricalCloses(symbol: "XAUUSD" | "BTCUSD"): Promise<number[]> {
  const yahooSymbol = symbol === "XAUUSD" ? "GC=F" : "BTC-USD";
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1h&range=1mo`, {
    headers: { "User-Agent": "RaitoFXPro/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Historical ${symbol} data unavailable (${response.status})`);
  const payload = await response.json() as { chart?: { result?: Array<{ indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
  const closes = payload.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
  return closes.map(Number).filter((value) => Number.isFinite(value) && value > 0).slice(-120);
}

function percentageChange(from: number, to: number) {
  return from ? ((to - from) / from) * 100 : 0;
}

export function indicatorSnapshot(currentPrice: number, closes: number[]) {
  const series = [...closes, currentPrice].filter((value) => Number.isFinite(value) && value > 0);
  const last = series.at(-1) || currentPrice;
  const prior = series.at(-2) || last;
  const sma20 = simpleMovingAverage(series, 20);
  const sma50 = simpleMovingAverage(series, 50);
  const ema20 = exponentialMovingAverage(series, 20);
  const recent = series.slice(-13, -1);
  const recentHigh = recent.length ? Math.max(...recent) : last;
  const recentLow = recent.length ? Math.min(...recent) : last;
  const returns = series.slice(-21).slice(1).map((value, index) => percentageChange(series.slice(-21)[index], value));
  const average = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
  const variance = returns.length ? returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length : 0;
  const volatility = Math.sqrt(variance);
  const bullish = last > sma20 && sma20 >= sma50 && last >= ema20;
  const bearish = last < sma20 && sma20 <= sma50 && last <= ema20;
  const direction: AutoSignalDirection | null = bullish ? "BUY" : bearish ? "SELL" : null;
  return { sampleSize: series.length, last, prior, sma20, sma50, ema20, recentHigh, recentLow, volatility, momentum: percentageChange(prior, last), direction };
}

export function autoSignalFingerprint(source: AutoSignalSource, symbol: string, direction: AutoSignalDirection, now = Date.now()) {
  const bucket = source === "PRE_NEWS" ? Math.floor(now / 60_000) : Math.floor(now / (4 * 60 * 60_000));
  return `auto-signal|${source}|${symbol}|${direction}|${bucket}`.toLowerCase().slice(0, 191);
}

export function evaluateHighConfidenceSetup(input: { symbol: "XAUUSD" | "BTCUSD"; price: AutoSignalPrice; historicalCloses: number[]; thresholds: AutoSignalThresholds; eventRisk?: boolean; now?: number }): AutoSignalCandidate | null {
  const { symbol, price, thresholds } = input;
  if (!Number.isFinite(price.price) || price.price <= 0) return null;
  const indicators = indicatorSnapshot(price.price, input.historicalCloses);
  if (!indicators.direction || indicators.sampleSize < 50) return null;
  const direction = indicators.direction;
  const momentum = direction === "BUY" ? indicators.momentum : -indicators.momentum;
  const structuralRange = Math.max(Math.abs(indicators.recentHigh - indicators.recentLow), price.price * instrumentRiskFraction(symbol));
  const breakoutDistance = direction === "BUY" ? (price.price - indicators.recentHigh) / structuralRange : (indicators.recentLow - price.price) / structuralRange;
  const technicalScore = clamp(48 + (momentum >= 0.12 ? 22 : momentum > 0 ? 10 : -20) + (indicators.volatility > 0 && indicators.volatility <= 1.8 ? 18 : 7));
  const strategyScore = clamp(42 + (breakoutDistance >= -0.1 ? 28 : 0) + (Math.abs(price.changePercent) >= 0.35 ? 16 : 5) + (indicators.volatility <= 2.5 ? 8 : -8));
  const fundamentalScore = input.eventRisk ? 10 : symbol === "XAUUSD" ? 76 : 64;
  const intelligenceScore = clamp(technicalScore * 0.45 + strategyScore * 0.35 + fundamentalScore * 0.2);
  const confidence = clamp(intelligenceScore * 0.8 + (momentum >= 0.2 ? 12 : 3) + (breakoutDistance >= -0.1 ? 5 : 0));
  const risk = Math.max(price.price * instrumentRiskFraction(symbol), structuralRange * 0.24);
  const entryPrice = price.price;
  const stopLoss = direction === "BUY" ? entryPrice - risk : entryPrice + risk;
  const takeProfit = direction === "BUY" ? entryPrice + risk * 2 : entryPrice - risk * 2;
  const riskReward = 2;
  const qualifies = !input.eventRisk && confidence >= thresholds.minConfidence && intelligenceScore >= thresholds.minScore && riskReward >= thresholds.minRiskReward;
  if (!qualifies) return null;
  const rationale = `${symbol} ${direction} setup passed the configurable confluence gate: technical ${technicalScore}/100 from SMA20/SMA50/EMA20 alignment and ${indicators.momentum.toFixed(2)}% hourly momentum; strategy ${strategyScore}/100 from ${breakoutDistance >= -0.1 ? "recent range breakout/retest structure" : "price-action structure"}; and fundamental context ${fundamentalScore}/100 from the high-impact USD event calendar. The signal is selective by design and is not a forecast or guarantee.`;
  return {
    fingerprint: autoSignalFingerprint("TECHNICAL", symbol, direction, input.now),
    source: "TECHNICAL",
    symbol,
    direction,
    status: "OPEN",
    entryPrice,
    stopLoss,
    takeProfit,
    confidence,
    technicalScore,
    strategyScore,
    fundamentalScore,
    intelligenceScore,
    riskReward,
    rationale,
    warning: "High-confidence threshold passed, but market conditions can change rapidly. Use independent risk controls and do not treat this as investment advice.",
  };
}

export function diagnoseHighConfidenceSetup(input: { symbol: "XAUUSD" | "BTCUSD"; price?: AutoSignalPrice; historicalCloses: number[]; thresholds: AutoSignalThresholds; eventRisk?: boolean }): AutoSignalEligibilityDiagnostic {
  const { symbol, price, thresholds } = input;
  if (!price || !Number.isFinite(price.price) || price.price <= 0) return { symbol, eligible: false, reason: "live_price_unavailable" };
  const indicators = indicatorSnapshot(price.price, input.historicalCloses);
  if (indicators.sampleSize < 50) return { symbol, eligible: false, reason: `insufficient_historical_data:${indicators.sampleSize}/50` };
  if (!indicators.direction) return { symbol, eligible: false, reason: "no_sma_ema_directional_alignment" };
  const direction = indicators.direction;
  const momentum = direction === "BUY" ? indicators.momentum : -indicators.momentum;
  const structuralRange = Math.max(Math.abs(indicators.recentHigh - indicators.recentLow), price.price * instrumentRiskFraction(symbol));
  const breakoutDistance = direction === "BUY" ? (price.price - indicators.recentHigh) / structuralRange : (indicators.recentLow - price.price) / structuralRange;
  const technicalScore = clamp(48 + (momentum >= 0.12 ? 22 : momentum > 0 ? 10 : -20) + (indicators.volatility > 0 && indicators.volatility <= 1.8 ? 18 : 7));
  const strategyScore = clamp(42 + (breakoutDistance >= -0.1 ? 28 : 0) + (Math.abs(price.changePercent) >= 0.35 ? 16 : 5) + (indicators.volatility <= 2.5 ? 8 : -8));
  const fundamentalScore = input.eventRisk ? 10 : symbol === "XAUUSD" ? 76 : 64;
  const intelligenceScore = clamp(technicalScore * 0.45 + strategyScore * 0.35 + fundamentalScore * 0.2);
  const confidence = clamp(intelligenceScore * 0.8 + (momentum >= 0.2 ? 12 : 3) + (breakoutDistance >= -0.1 ? 5 : 0));
  const riskReward = 2;
  const reasons = [
    input.eventRisk ? "upcoming_high_impact_usd_event" : null,
    confidence < thresholds.minConfidence ? `confidence_${confidence}_below_${thresholds.minConfidence}` : null,
    intelligenceScore < thresholds.minScore ? `confluence_${intelligenceScore}_below_${thresholds.minScore}` : null,
    riskReward < thresholds.minRiskReward ? `risk_reward_${riskReward.toFixed(2)}_below_${thresholds.minRiskReward}` : null,
  ].filter(Boolean);
  return { symbol, eligible: reasons.length === 0, reason: reasons.length ? reasons.join(";") : "eligible", confidence, intelligenceScore, riskReward };
}

export function evaluateSignalOutcome(signal: Pick<PersistedAutoSignal, "direction" | "status" | "takeProfit" | "stopLoss" | "symbol">, currentPrice: number) {
  if (signal.status !== "OPEN" || !Number.isFinite(currentPrice)) return null;
  const targetHit = signal.direction === "BUY" ? currentPrice >= signal.takeProfit : currentPrice <= signal.takeProfit;
  if (targetHit) return { status: "TP_HIT" as const, outcomePrice: currentPrice, outcomeDetails: `${signal.symbol} reached the defined take-profit level. The outcome is recorded from the monitored market price.` };
  const stopHit = signal.direction === "BUY" ? currentPrice <= signal.stopLoss : currentPrice >= signal.stopLoss;
  if (stopHit) return { status: "SL_HIT" as const, outcomePrice: currentPrice, outcomeDetails: `${signal.symbol} reached the defined stop-loss level. The outcome is recorded from the monitored market price.` };
  return null;
}

export function shouldExpireAutoSignal(signal: Pick<PersistedAutoSignal, "source" | "openedAt" | "status">, now = Date.now()) {
  if (signal.status !== "OPEN") return false;
  const maximumAgeMs = signal.source === "PRE_NEWS" ? 75 * 60_000 : 6 * 60 * 60_000;
  return now - new Date(signal.openedAt).getTime() >= maximumAgeMs;
}

export function buildGoldPreNewsCandidates(events: EconomicCalendarEvent[], price: AutoSignalPrice | undefined, now = Date.now()): AutoSignalCandidate[] {
  if (!price?.price) return [];
  return events.flatMap((event) => buildPreReleaseSignals(event, now, 15))
    .filter((signal) => signal.instrument === "XAUUSD" && signal.minutesUntil === 15)
    .map((signal) => {
      const risk = Math.max(price.price * instrumentRiskFraction("XAUUSD"), Math.abs(price.high - price.low) * 0.18);
      return {
        fingerprint: `auto-signal|pre-news|xauusd|${signal.event}|${signal.scheduledAt}`.toLowerCase().slice(0, 191),
        source: "PRE_NEWS" as const,
        symbol: "XAUUSD" as const,
        direction: signal.direction,
        status: "OPEN" as const,
        entryPrice: price.price,
        stopLoss: signal.direction === "BUY" ? price.price - risk : price.price + risk,
        takeProfit: signal.direction === "BUY" ? price.price + risk * 1.5 : price.price - risk * 1.5,
        confidence: signal.confidence,
        technicalScore: 0,
        strategyScore: 0,
        fundamentalScore: 100,
        intelligenceScore: signal.confidence,
        riskReward: 1.5,
        rationale: signal.rationale,
        warning: signal.riskWarning,
        newsEvent: signal.event,
        newsScheduledAt: new Date(signal.scheduledAt),
      };
    });
}

export function formatAutoSignalTelegramMessage(signal: PersistedAutoSignal, deliveryType: AutoSignalDeliveryType) {
  if (deliveryType === "OUTCOME") {
    const targetHit = signal.status === "TP_HIT";
    return [
      "RAITO-FX PRO  |  AUTO SIGNAL",
      "━━━━━━━━━━━━━━━━━━━━",
      `${targetHit ? "🎯 TARGET HIT" : "🛑 STOP HIT"}  |  ${signal.symbol} ${signal.direction}`,
      `Entry: ${signal.entryPrice}  →  Exit: ${signal.outcomePrice ?? "—"}`,
      `TP: ${signal.takeProfit}  |  SL: ${signal.stopLoss}`,
      "━━━━━━━━━━━━━━━━━━━━",
      `STATUS: ${targetHit ? "POSITION TARGET RECORDED" : "POSITION STOP RECORDED"}`,
      `R:R Plan: 1:${signal.riskReward.toFixed(2)}  |  Quality: ${signal.confidence}%`,
      signal.outcomeDetails || "The monitored price reached the defined risk level.",
      "Monitor record updated. This is not an execution confirmation.",
    ].join("\n").slice(0, 4000);
  }
  const directionLabel = signal.direction === "BUY" ? "🟢 BUY" : "🔴 SELL";
  return [
    "RAITO-FX PRO  |  AUTO SIGNAL",
    "━━━━━━━━━━━━━━━━━━━━",
    `${directionLabel} SETUP  |  ${signal.symbol}`,
    `MODE: ${signal.source === "PRE_NEWS" ? "HIGH-IMPACT PRE-NEWS" : "TECHNICAL CONFLUENCE"}`,
    "━━━━━━━━━━━━━━━━━━━━",
    "ENTRY PLAN",
    `Entry: ${signal.entryPrice}`,
    `Stop:  ${signal.stopLoss}`,
    `Target: ${signal.takeProfit}`,
    `R:R 1:${signal.riskReward.toFixed(2)}  |  Confidence ${signal.confidence}%  |  Confluence ${signal.intelligenceScore}/100`,
    signal.newsEvent ? `EVENT RISK: ${signal.newsEvent}` : undefined,
    "━━━━━━━━━━━━━━━━━━━━",
    "STATUS: SETUP ACTIVE — WAIT FOR PRICE CONFIRMATION",
    signal.warning || "Risk control is mandatory. This is analysis, not a trade execution instruction.",
  ].filter(Boolean).join("\n").slice(0, 4000);
}

export async function runAutoSignalMonitor(input: {
  settings?: { userId: number; isEnabled: number; minConfidence: number; minScore: number; minRiskReward: number };
  fetchPrices: () => Promise<Record<string, AutoSignalPrice>>;
  fetchHistorical: (symbol: "XAUUSD" | "BTCUSD") => Promise<number[]>;
  fetchCalendar: () => Promise<EconomicCalendarEvent[]>;
  listOpen: (userId: number) => Promise<PersistedAutoSignal[]>;
  create: (userId: number, candidate: AutoSignalCandidate) => Promise<{ signal: PersistedAutoSignal; created: boolean }>;
  resolve: (userId: number, signalId: number, outcome: { status: "TP_HIT" | "SL_HIT" | "EXPIRED"; outcomePrice: number; outcomeDetails: string }) => Promise<PersistedAutoSignal | undefined>;
  touch: (userId: number, signalId: number) => Promise<void>;
  listDeliveryQueue: (userId: number) => Promise<Array<{ signal: PersistedAutoSignal; deliveryType: AutoSignalDeliveryType }>>;
  claimDelivery: (userId: number, signalId: number, deliveryType: AutoSignalDeliveryType) => Promise<boolean>;
  review?: (candidate: AutoSignalCandidate) => Promise<AutoSignalReview>;
  send: (text: string) => Promise<void>;
  markDeliverySent: (userId: number, signalId: number, deliveryType: AutoSignalDeliveryType) => Promise<void>;
  markDeliveryFailed: (userId: number, signalId: number, deliveryType: AutoSignalDeliveryType, error: string, status?: "FAILED" | "UNKNOWN") => Promise<void>;
  markRun: (userId: number, error?: string | null) => Promise<void>;
  now?: number;
}) {
  if (!input.settings?.isEnabled) return { ok: true, skipped: "disabled-or-orphan", created: 0, resolved: 0, delivered: 0 };
  const now = input.now ?? Date.now();
  try {
    const prices = await input.fetchPrices();
    const xau = resolveSymbolPrice(prices, "XAUUSD");
    const btc = resolveSymbolPrice(prices, "BTCUSD");
    if (!xau && !btc) throw new Error("Live XAU/USD and BTC/USD prices are unavailable");
    const [xauHistory, btcHistory] = await Promise.all([
      xau ? input.fetchHistorical("XAUUSD").catch(() => [] as number[]) : Promise.resolve([] as number[]),
      btc ? input.fetchHistorical("BTCUSD").catch(() => [] as number[]) : Promise.resolve([] as number[]),
    ]);
    const events = await input.fetchCalendar().catch(() => [] as EconomicCalendarEvent[]);
    const eventRisk = events.some((event) => event.impact === "high" && event.currency === "USD" && typeof event.timestamp === "number" && event.timestamp > now && event.timestamp - now <= 60 * 60_000);
    let resolved = 0;
    for (const signal of await input.listOpen(input.settings.userId)) {
      const live = signal.symbol === "XAUUSD" ? xau : btc;
      if (!live) continue;
      const outcome = evaluateSignalOutcome(signal, live.price);
      if (outcome) {
        await input.resolve(input.settings.userId, signal.id, outcome);
        resolved += 1;
      } else if (shouldExpireAutoSignal(signal, now)) {
        await input.resolve(input.settings.userId, signal.id, { status: "EXPIRED", outcomePrice: live.price, outcomeDetails: "Signal window expired without reaching the defined target or stop. No new entry notification was sent for this closed setup." });
        resolved += 1;
      } else {
        await input.touch(input.settings.userId, signal.id);
      }
    }
    const thresholds: AutoSignalThresholds = { minConfidence: input.settings.minConfidence, minScore: input.settings.minScore, minRiskReward: input.settings.minRiskReward };
    const technicalInputs = [
      { symbol: "XAUUSD" as const, price: xau, historicalCloses: xauHistory, thresholds, eventRisk, now },
      { symbol: "BTCUSD" as const, price: btc, historicalCloses: btcHistory, thresholds, now },
    ];
    const technicalAssessments = technicalInputs.map((assessment) => ({
      diagnostic: diagnoseHighConfidenceSetup(assessment),
      candidate: assessment.price ? evaluateHighConfidenceSetup(assessment as { symbol: "XAUUSD" | "BTCUSD"; price: AutoSignalPrice; historicalCloses: number[]; thresholds: AutoSignalThresholds; eventRisk?: boolean; now?: number }) : null,
    }));
    const technicalCandidates = technicalAssessments.map((assessment) => assessment.candidate).filter((candidate): candidate is AutoSignalCandidate => Boolean(candidate));
    const preNewsCandidates = buildGoldPreNewsCandidates(events, xau, now);
    let created = 0;
    for (const deterministicCandidate of [...technicalCandidates, ...preNewsCandidates]) {
      const review = input.review ? await input.review(deterministicCandidate) : { approved: true, provider: "deterministic", note: "No external AI review configured." };
      if (!review.approved) continue;
      const candidate = { ...deterministicCandidate, rationale: `${deterministicCandidate.rationale} Reviewer: ${review.provider}. ${review.note}`.slice(0, 2000) };
      const result = await input.create(input.settings.userId, candidate);
      if (result.created) created += 1;
    }
    let delivered = 0;
    let deliveryFailures = 0;
    for (const pending of await input.listDeliveryQueue(input.settings.userId)) {
      if (!await input.claimDelivery(input.settings.userId, pending.signal.id, pending.deliveryType)) continue;
      try {
        await input.send(formatAutoSignalTelegramMessage(pending.signal, pending.deliveryType));
        await input.markDeliverySent(input.settings.userId, pending.signal.id, pending.deliveryType);
        delivered += 1;
      } catch (error) {
        deliveryFailures += 1;
        const message = error instanceof Error ? error.message : "Telegram delivery failed";
        const uncertain = Boolean((error as { deliveryMayHaveOccurred?: boolean }).deliveryMayHaveOccurred);
        await input.markDeliveryFailed(input.settings.userId, pending.signal.id, pending.deliveryType, message, uncertain ? "UNKNOWN" : "FAILED");
      }
    }
    await input.markRun(input.settings.userId, deliveryFailures ? `${deliveryFailures} Telegram delivery attempt(s) require attention.` : null);
    return { ok: true, created, resolved, delivered, deliveryFailures, diagnostics: technicalAssessments.map((assessment) => assessment.diagnostic), preNewsCandidateCount: preNewsCandidates.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auto Signal Analyze monitor failed";
    await input.markRun(input.settings.userId, message);
    throw error;
  }
}
