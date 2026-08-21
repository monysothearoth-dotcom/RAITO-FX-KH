import { describe, expect, it } from "vitest";
import { buildGoldPreNewsCandidates, evaluateHighConfidenceSetup, evaluateSignalOutcome, runAutoSignalMonitor, type AutoSignalCandidate, type AutoSignalPrice, type PersistedAutoSignal } from "./autoSignal";

const thresholds = { minConfidence: 78, minScore: 82, minRiskReward: 1.8 };
const qualifiedPrice: AutoSignalPrice = { price: 109, change: 1, changePercent: 1, high: 110, low: 100 };
const bullishHistory = Array.from({ length: 60 }, (_value, index) => 90 + index * 0.3);

function persisted(candidate: AutoSignalCandidate, id = 1): PersistedAutoSignal {
  return { ...candidate, id, userId: 7, openedAt: new Date("2026-08-21T00:00:00.000Z"), resolvedAt: null, outcomePrice: null, outcomeDetails: null };
}

describe("Auto Signal Analyze engine", () => {
  it("publishes only a high-confluence technical setup", () => {
    const qualified = evaluateHighConfidenceSetup({ symbol: "XAUUSD", price: qualifiedPrice, historicalCloses: bullishHistory, thresholds, now: Date.UTC(2026, 7, 21, 12) });
    const suppressed = evaluateHighConfidenceSetup({ symbol: "BTCUSD", price: { price: 100, change: 0.1, changePercent: 0.1, high: 101, low: 99 }, historicalCloses: bullishHistory, thresholds, now: Date.UTC(2026, 7, 21, 12) });
    expect(qualified).toMatchObject({ source: "TECHNICAL", symbol: "XAUUSD", direction: "BUY", status: "OPEN" });
    expect(qualified?.intelligenceScore).toBeGreaterThanOrEqual(82);
    expect(suppressed).toBeNull();
  });

  it("resolves an open signal when either its take-profit or stop-loss is reached", () => {
    const candidate = evaluateHighConfidenceSetup({ symbol: "XAUUSD", price: qualifiedPrice, historicalCloses: bullishHistory, thresholds })!;
    const signal = persisted(candidate);
    expect(evaluateSignalOutcome(signal, candidate.takeProfit + 0.5)).toMatchObject({ status: "TP_HIT" });
    expect(evaluateSignalOutcome({ ...signal, direction: "SELL", stopLoss: 112, takeProfit: 104 }, 112.5)).toMatchObject({ status: "SL_HIT" });
  });

  it("creates a Gold pre-news candidate exactly fifteen minutes before a high-impact USD event", () => {
    const now = Date.UTC(2026, 7, 21, 12, 0, 0);
    const candidates = buildGoldPreNewsCandidates([{ time: new Date(now + 15 * 60_000).toISOString(), timestamp: now + 15 * 60_000, currency: "USD", event: "CPI", impact: "high", forecast: "3.0", previous: "2.8" }], qualifiedPrice, now);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ source: "PRE_NEWS", symbol: "XAUUSD", newsEvent: "CPI" });
    expect(buildGoldPreNewsCandidates([{ time: new Date(now + 14 * 60_000).toISOString(), timestamp: now + 14 * 60_000, currency: "USD", event: "CPI", impact: "high" }], qualifiedPrice, now)).toHaveLength(0);
  });

  it("persists one canonical signal before sending the identical update to Telegram", async () => {
    const websiteSignals: PersistedAutoSignal[] = [];
    const telegramMessages: string[] = [];
    const recordedDeliveries: string[] = [];
    const result = await runAutoSignalMonitor({
      settings: { userId: 7, isEnabled: 1, ...thresholds },
      fetchPrices: async () => ({ "OANDA:XAUUSD": qualifiedPrice, "BINANCE:BTCUSDT": { price: 100, change: 0.1, changePercent: 0.1, high: 101, low: 99 } }),
      fetchHistorical: async () => bullishHistory,
      fetchCalendar: async () => [],
      review: async () => ({ approved: true, provider: "test-reviewer", note: "Confluence is internally consistent." }),
      listOpen: async () => websiteSignals.filter((signal) => signal.status === "OPEN"),
      create: async (_userId, candidate) => {
        const signal = persisted(candidate, websiteSignals.length + 1);
        websiteSignals.push(signal);
        return { signal, created: true };
      },
      resolve: async () => undefined,
      touch: async () => undefined,
      listDeliveryQueue: async () => websiteSignals.filter((signal) => !recordedDeliveries.includes(`${signal.id}:SIGNAL`)).map((signal) => ({ signal, deliveryType: "SIGNAL" as const })),
      send: async (text) => { telegramMessages.push(text); },
      recordDelivery: async (_userId, signalId, deliveryType) => { recordedDeliveries.push(`${signalId}:${deliveryType}`); },
      markRun: async () => undefined,
      now: Date.UTC(2026, 7, 21, 12),
    });
    expect(result.created).toBe(1);
    expect(websiteSignals).toHaveLength(1);
    expect(telegramMessages).toHaveLength(1);
    expect(telegramMessages[0]).toContain(websiteSignals[0].symbol);
    expect(recordedDeliveries).toEqual(["1:SIGNAL"]);
  });

  it("suppresses publication when the backend AI reviewer rejects a deterministic candidate", async () => {
    const created: PersistedAutoSignal[] = [];
    const result = await runAutoSignalMonitor({
      settings: { userId: 7, isEnabled: 1, ...thresholds },
      fetchPrices: async () => ({ "OANDA:XAUUSD": qualifiedPrice }),
      fetchHistorical: async () => bullishHistory,
      fetchCalendar: async () => [],
      review: async () => ({ approved: false, provider: "grok", note: "The supplied context is not sufficiently consistent." }),
      listOpen: async () => [],
      create: async (_userId, candidate) => {
        const signal = persisted(candidate);
        created.push(signal);
        return { signal, created: true };
      },
      resolve: async () => undefined,
      touch: async () => undefined,
      listDeliveryQueue: async () => [],
      send: async () => undefined,
      recordDelivery: async () => undefined,
      markRun: async () => undefined,
      now: Date.UTC(2026, 7, 21, 12),
    });
    expect(result.created).toBe(0);
    expect(created).toHaveLength(0);
  });
});
