import { describe, expect, it } from "vitest";
import { resolveMarketWatchHeadlineEvidence } from "./_core/index";

describe("market-watch route headline evidence contract", () => {
  it("returns truthful no-relevant and unavailable states after active-symbol filtering", () => {
    const cryptoOnly = {
      items: [{ title: "Bitcoin update", source: "Example", category: "crypto" as const, relatedCurrency: "BTC", timestamp: 1, url: "", effectAnalysis: { affectedInstruments: ["BTCUSDT"], direction: "BUY" as const, expectedEffect: "Conditional", impact: "low" as const, risk: "Risk" } }],
      sourceFailures: [],
    };
    const unavailable = { items: [], sourceFailures: ["Yahoo:EURUSD"] };
    expect(resolveMarketWatchHeadlineEvidence("OANDA:EURUSD", cryptoOnly)).toMatchObject({ status: "no_relevant_headlines", headlines: [] });
    expect(resolveMarketWatchHeadlineEvidence("OANDA:EURUSD", unavailable)).toMatchObject({ status: "unavailable", headlines: [] });
    expect(resolveMarketWatchHeadlineEvidence("OANDA:EURUSD", null)).toMatchObject({ status: "not_requested", headlines: [] });
  });
});
