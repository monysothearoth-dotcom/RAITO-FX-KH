export type HighImpactLevel = "high" | "medium" | "low";
export type NewsDirection = "BUY" | "SELL";
export type MarketEffectLabel = "🟢Buy (Bullish 📈)⬆️" | "🔴Sell (Bearish 📉)⬇️" | "⚪Normal (No Effect🚫)🔄";

export function marketEffectLabel(direction: NewsDirection | "MIXED"): MarketEffectLabel {
  if (direction === "BUY") return "🟢Buy (Bullish 📈)⬆️";
  if (direction === "SELL") return "🔴Sell (Bearish 📉)⬇️";
  return "⚪Normal (No Effect🚫)🔄";
}

export type EconomicCalendarEvent = {
  time: string;
  currency: string;
  event: string;
  impact: HighImpactLevel;
  actual?: string;
  forecast?: string;
  previous?: string;
  timestamp?: number;
};

export type VerifiedEventEvidence = {
  status: "upcoming_high_impact" | "no_upcoming_high_impact" | "unavailable";
  checkedAt: number;
  horizonHours: number;
  source: string;
  highImpactEvents: Array<{ event: string; currency: string; scheduledAt: number; minutesUntil: number }>;
};

export type NewsEffectAnalysis = {
  affectedInstruments: string[];
  direction: NewsDirection | "MIXED";
  expectedEffect: string;
  impact: HighImpactLevel;
  risk: string;
};

export type PreReleaseSignal = {
  event: string;
  currency: string;
  instrument: string;
  direction: NewsDirection;
  confidence: number;
  impact: "high";
  scheduledAt: number;
  minutesUntil: number;
  rationale: string;
  invalidation: string;
  riskWarning: string;
};

const MAJOR_PAIRS: Record<string, string[]> = {
  USD: ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD"],
  EUR: ["EURUSD"],
  GBP: ["GBPUSD"],
  JPY: ["USDJPY"],
  AUD: ["AUDUSD"],
  CAD: ["USDCAD"],
  CHF: ["USDCHF"],
  NZD: ["NZDUSD"],
};

function numeric(value?: string): number | null {
  if (!value || value === "-" || value === "N/A") return null;
  const parsed = Number(String(value).replace(/[%,$]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function analyzeNewsEffect(input: { title: string; category: "forex" | "crypto"; relatedCurrency?: string; impact?: HighImpactLevel; sentiment?: "positive" | "negative" | "neutral" }): NewsEffectAnalysis {
  const text = `${input.title} ${input.relatedCurrency || ""}`.toLowerCase();
  const impact = input.impact || (/(fed|fomc|cpi|jobs|payroll|rate|central bank|bankruptcy|guidance)/.test(text) ? "high" : /(forecast|revenue|profit|target|launch)/.test(text) ? "medium" : "low");
  const currency = String(input.relatedCurrency || (input.category === "crypto" ? "BTC" : "USD")).toUpperCase();
  const instruments = input.category === "crypto" ? [`${currency.replace(/USDT$/, "")}USDT`] : affectedInstruments(currency);
  const negative = input.sentiment === "negative" || /(fall|drop|loss|weak|cut|miss|risk|slump|downgrade)/.test(text);
  const positive = input.sentiment === "positive" || /(rise|rally|gain|strong|beat|growth|upgrade|surge)/.test(text);
  const direction = positive === negative ? "MIXED" : positive ? "BUY" : "SELL";
  const expectedEffect = direction === "MIXED" ? "No clear directional edge; wait for confirmation." : `${marketEffectLabel(direction)} for ${instruments.join(", ")} if price confirms the headline reaction.`;
  return { affectedInstruments: instruments, direction, expectedEffect, impact, risk: impact === "high" ? "High-impact headline risk: spreads, slippage, and reversals may increase." : "Monitor follow-through and avoid treating a headline alone as confirmation." };
}

function currencyDirection(event: EconomicCalendarEvent): NewsDirection {
  const title = event.event.toLowerCase();
  const forecast = numeric(event.forecast);
  const previous = numeric(event.previous);
  const positiveCurrencyTerms = /(rate hike|interest rate|payroll|employment|jobs|gdp|retail sales|pmi|manufacturing|consumer confidence)/;
  const negativeCurrencyTerms = /(rate cut|unemployment|jobless|claims|inflation|cpi|ppi|deflation|recession)/;
  const improvesCurrency = positiveCurrencyTerms.test(title);
  const harmsCurrency = negativeCurrencyTerms.test(title);
  const forecastImproves = forecast !== null && previous !== null ? forecast > previous : null;
  if (improvesCurrency) return forecastImproves === false ? "SELL" : "BUY";
  if (harmsCurrency) return forecastImproves === false ? "BUY" : "SELL";
  return forecastImproves === false ? "SELL" : "BUY";
}

export function affectedInstruments(currency: string): string[] {
  return MAJOR_PAIRS[String(currency || "USD").toUpperCase()] || ["XAUUSD"];
}

export function isWithinPreReleaseWindow(event: EconomicCalendarEvent, now = Date.now(), leadMinutes = 15): boolean {
  const scheduledAt = event.timestamp || Date.parse(event.time);
  if (!Number.isFinite(scheduledAt)) return false;
  const delta = scheduledAt - now;
  return delta > 0 && delta <= leadMinutes * 60_000;
}

export function buildVerifiedEventEvidence(events: EconomicCalendarEvent[], options: { now?: number; horizonHours?: number; sourceAvailable?: boolean } = {}): VerifiedEventEvidence {
  const now = options.now ?? Date.now();
  const horizonHours = options.horizonHours ?? 24;
  const sourceAvailable = options.sourceAvailable ?? true;
  if (!sourceAvailable) return { status: "unavailable", checkedAt: now, horizonHours, source: "Public economic calendar unavailable", highImpactEvents: [] };
  const cutoff = now + horizonHours * 60 * 60_000;
  const highImpactEvents = events
    .filter((event) => event.impact === "high")
    .map((event) => ({ event, scheduledAt: event.timestamp || Date.parse(event.time) }))
    .filter((item) => Number.isFinite(item.scheduledAt) && item.scheduledAt >= now && item.scheduledAt <= cutoff)
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .map(({ event, scheduledAt }) => ({ event: event.event, currency: event.currency, scheduledAt, minutesUntil: Math.max(0, Math.round((scheduledAt - now) / 60_000)) }));
  return { status: highImpactEvents.length ? "upcoming_high_impact" : "no_upcoming_high_impact", checkedAt: now, horizonHours, source: "Public economic calendar", highImpactEvents };
}

export function buildPreReleaseSignals(event: EconomicCalendarEvent, now = Date.now(), leadMinutes = 15): PreReleaseSignal[] {
  if (event.impact !== "high" || !isWithinPreReleaseWindow(event, now, leadMinutes)) return [];
  const scheduledAt = event.timestamp || Date.parse(event.time);
  const minutesUntil = Math.max(0, Math.round((scheduledAt - now) / 60_000));
  const baseDirection = currencyDirection(event);
  const numericContext = numeric(event.forecast) !== null && numeric(event.previous) !== null ? `Forecast ${event.forecast} versus previous ${event.previous}.` : "No reliable forecast-versus-previous comparison was supplied.";
  return affectedInstruments(event.currency).map((instrument) => {
    const direction: NewsDirection = instrument === "XAUUSD" && event.currency === "USD" ? (baseDirection === "BUY" ? "SELL" : "BUY") : baseDirection;
    const confidence = numericContext.startsWith("Forecast") ? 62 : 46;
    return {
      event: event.event,
      currency: event.currency,
      instrument,
      direction,
      confidence,
      impact: "high",
      scheduledAt,
      minutesUntil,
      rationale: `${event.currency} pre-release bias for ${event.event}. ${numericContext} This is a consensus-based scenario, not a guaranteed reaction; the first move can reverse after the release.`,
      invalidation: `Invalidate ${direction} if the actual release contradicts the consensus scenario or price breaks the pre-event structure in the opposite direction.`,
      riskWarning: "High-volatility event: spreads, slippage, and whipsaws can increase. Use reduced risk and wait for confirmation if liquidity is unstable.",
    };
  });
}

export function highImpactSignalFingerprint(signal: PreReleaseSignal): string {
  return `pre-release|${signal.event}|${signal.instrument}|${signal.scheduledAt}`.toLowerCase().slice(0, 191);
}

export async function fetchPublicEconomicCalendar(): Promise<EconomicCalendarEvent[]> {
  const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Economic calendar unavailable (${response.status})`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const time = String(row.date || row.time || "");
    return {
      time,
      timestamp: Date.parse(time),
      currency: String(row.country || row.currency || "USD").toUpperCase(),
      event: String(row.title || row.event || "Economic release"),
      impact: String(row.impact || "low").toLowerCase() === "high" ? "high" : String(row.impact || "low").toLowerCase() === "medium" ? "medium" : "low",
      actual: String(row.actual || ""),
      forecast: String(row.forecast || ""),
      previous: String(row.previous || ""),
    } as EconomicCalendarEvent;
  }).filter((event) => Boolean(event.event) && Number.isFinite(event.timestamp));
}

export function filterPreReleaseSignals(signals: PreReleaseSignal[], instruments: string[]): PreReleaseSignal[] {
  const allowed = new Set(instruments.map((value) => value.toUpperCase()));
  return signals.filter((signal) => allowed.has(signal.instrument));
}

export function selectUndeliveredPreReleaseSignals(signals: PreReleaseSignal[], deliveredFingerprints: Set<string>): PreReleaseSignal[] {
  return signals.filter((signal) => !deliveredFingerprints.has(highImpactSignalFingerprint(signal)));
}

export function formatPreReleaseSignalMessage(signals: PreReleaseSignal[]): string {
  const blocks = signals.map((signal) => [
    `[HIGH IMPACT · ${signal.instrument}]`,
    `⏱ ${signal.minutesUntil} min before ${signal.event} (${signal.currency})`,
    `📣 NEWS SIGNAL: ${signal.direction} · Confidence ${signal.confidence}%`,
    signal.rationale,
    `Invalidation: ${signal.invalidation}`,
    `Risk: ${signal.riskWarning}`,
  ].join("\n"));
  return ["Raito-FX Pro", "High-Impact News Alert", "━━━━━━━━━━━━━━━━━━━━", blocks.join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n")].join("\n\n").slice(0, 4000);
}
