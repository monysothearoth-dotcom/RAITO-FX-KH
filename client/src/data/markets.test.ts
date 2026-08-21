import { describe, expect, it } from "vitest";
import { INITIAL_MARKETS } from "./markets";

describe("market catalog", () => {
  it("covers the required market families with TradingView symbols", () => {
    const categories = new Set(INITIAL_MARKETS.map(market => market.category));
    expect(categories).toEqual(new Set(["crypto", "forex", "stocks", "oils"]));
    expect(INITIAL_MARKETS.some(market => market.symbol === "BINANCE:BTCUSDT")).toBe(true);
    expect(INITIAL_MARKETS.some(market => market.symbol === "OANDA:EURUSD")).toBe(true);
    expect(INITIAL_MARKETS.some(market => market.symbol === "NASDAQ:AAPL")).toBe(true);
    expect(INITIAL_MARKETS.some(market => market.symbol === "OANDA:XAUUSD")).toBe(true);
    expect(INITIAL_MARKETS.every(market => market.symbol.includes(":"))).toBe(true);
  });
});
