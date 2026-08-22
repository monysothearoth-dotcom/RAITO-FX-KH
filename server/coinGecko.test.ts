import { describe, expect, it } from "vitest";
import { mapCoinGeckoPrices } from "./coinGecko";

describe("CoinGecko market-data mapper", () => {
  it("converts secure-provider crypto quotes into the live-price contract", () => {
    expect(mapCoinGeckoPrices({ bitcoin: { usd: 100_000, usd_24h_change: 2.5, usd_24h_high: 101_000, usd_24h_low: 98_000 } })["BINANCE:BTCUSDT"]).toEqual({
      price: 100_000,
      change: 2_500,
      changePercent: 2.5,
      high: 101_000,
      low: 98_000,
    });
  });
});
