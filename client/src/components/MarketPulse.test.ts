import { describe, expect, it } from "vitest";
import { groupPulsePairs } from "./MarketPulse";

describe("Market Pulse grouping", () => {
  it("keeps pairs in a stable, readable market order", () => {
    const groups = groupPulsePairs([
      { symbol: "NASDAQ:AAPL", name: "Apple", category: "stocks" },
      { symbol: "OANDA:EURUSD", name: "EUR / USD", category: "forex" },
      { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", category: "crypto" },
      { symbol: "OANDA:XAUUSD", name: "Gold", category: "oils" },
    ] as any);

    expect(groups.map((group) => group.category)).toEqual(["forex", "crypto", "stocks", "oils"]);
    expect(groups[0].label).toBe("Major FX pairs");
    expect(groups[3].label).toBe("Energy & metals");
  });
});
