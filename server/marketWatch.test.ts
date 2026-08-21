import { describe, expect, it } from "vitest";
import { buildMarketWatchConsensus, buildMarketWatchPrompt, buildMarketWatchValidationPrompt, selectMarketResearchContext } from "./marketWatch";

describe("market watch consensus", () => {
  it("chooses the majority BUY signal and reports agreement", () => {
    const result = buildMarketWatchConsensus([
      { provider: "gemini", text: "", payload: { recommendation: "BUY", confidence: 82, entryPrice: 100, stopLoss: 95, takeProfit: 112, rationale: "Trend is constructive." } },
      { provider: "openai", text: "", payload: { recommendation: "BUY", confidence: 74, entryPrice: 100, stopLoss: 96, takeProfit: 110, rationale: "Momentum supports continuation." } },
      { provider: "platform", text: "", payload: { recommendation: "SELL", confidence: 68, entryPrice: 100, stopLoss: 105, takeProfit: 92, rationale: "Resistance remains overhead." } },
    ], 100);

    expect(result.recommendation).toBe("BUY");
    expect(result.agreementPercent).toBe(67);
    expect(result.providerVotes).toEqual({ BUY: 2, SELL: 1 });
    expect(result.providersAnalyzed).toEqual(["gemini", "openai", "platform"]);
    expect(result.watchMode).toBe("unified");
  });

  it("selects one strongest risk-adjusted setup instead of returning competing signals", () => {
    const result = buildMarketWatchConsensus([
      { provider: "low-confidence", text: "", payload: { recommendation: "BUY", confidence: 55, entryPrice: 100, stopLoss: 98, takeProfit: 104, rationale: "Weak setup." } },
      { provider: "best-setup", text: "", payload: { recommendation: "SELL", confidence: 92, entryPrice: 100, stopLoss: 102, takeProfit: 110, rationale: "Strong resistance rejection with defined downside." } },
    ], 100);

    expect(result.bestSetupOnly).toBe(true);
    expect(result.selectedProvider).toBe("best-setup");
    expect(result.recommendation).toBe("SELL");
    expect(result.setupScore).toBeGreaterThan(80);
    expect(result.riskReward).toBe(5);
    expect(result.selectionReason).toContain("best-setup");
  });

  it("grounds Forex and Crypto prompt construction in the research library", () => {
    const forexPrompt = buildMarketWatchPrompt({ symbol: "OANDA:EURUSD", chartContext: { live: { price: 1.08 } } });
    const cryptoPrompt = buildMarketWatchPrompt({ symbol: "BINANCE:BTCUSDT", chartContext: { live: { price: 100000 } }, marketContext: { derivatives: { fundingRate: "0.01" } } });
    expect(forexPrompt).toContain("central-bank reaction functions");
    expect(forexPrompt).toContain("Never invent values");
    expect(cryptoPrompt).toContain("token supply/unlocks");
    expect(cryptoPrompt).toContain("Never invent values");
    expect(cryptoPrompt).toContain("fundingRate");
  });

  it("routes macro context to Forex and crypto context to Crypto validation", () => {
    const macro = { indicators: { payrolls: { value: 100 }, policyRate: { value: 4.5 }, yieldDifferential: 0.5 } };
    const crypto = { derivatives: { fundingRate: "0.01", openInterest: "123" } };
    expect(selectMarketResearchContext("OANDA:EURUSD", { macro, crypto })).toEqual(macro);
    expect(selectMarketResearchContext("BINANCE:BTCUSDT", { macro, crypto })).toEqual(crypto);
    expect(buildMarketWatchPrompt({ symbol: "OANDA:EURUSD", chartContext: {}, marketContext: macro })).toContain("payrolls");
    expect(buildMarketWatchPrompt({ symbol: "BINANCE:BTCUSDT", chartContext: {}, marketContext: crypto })).toContain("fundingRate");
    expect(buildMarketWatchValidationPrompt({ symbol: "OANDA:EURUSD", chartContext: {}, macroContext: macro, cryptoContext: crypto })).toContain("yieldDifferential");
    expect(buildMarketWatchValidationPrompt({ symbol: "BINANCE:BTCUSDT", chartContext: {}, macroContext: macro, cryptoContext: crypto })).toContain("openInterest");
  });

  it("coerces malformed or HOLD-like output into BUY or SELL only", () => {
    const result = buildMarketWatchConsensus([
      { provider: "gemini", text: "unclear", payload: { recommendation: "HOLD", confidence: 10 } },
    ], 250);

    expect(["BUY", "SELL"]).toContain(result.recommendation);
    expect(result.entryPrice).toBe(250);
    expect(result.providerStatuses[0]).toMatchObject({ provider: "gemini", status: "ok" });
  });
});
