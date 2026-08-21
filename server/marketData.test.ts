import { describe, expect, it } from "vitest";
import { normalizeHistoricalSeries, summarizePriceSeries } from "./marketData";

describe("normalizeHistoricalSeries", () => {
  it("keeps aligned finite Yahoo timestamp and close pairs", () => {
    expect(normalizeHistoricalSeries([100, 200, 300], [10, "20", null])).toEqual([
      { timestamp: 100, close: 10 },
      { timestamp: 200, close: 20 },
    ]);
  });
});

describe("summarizePriceSeries", () => {
  it("produces grounded trend and moving-average context", () => {
    const series = Array.from({ length: 60 }, (_, index) => ({ timestamp: index, close: 100 + index }));
    const summary = summarizePriceSeries(series);
    expect(summary.last).toBe(159);
    expect(summary.sma20).toBe(149.5);
    expect(summary.sma50).toBe(134.5);
    expect(summary.trend).toBe("bullish");
    expect(summary.sampleSize).toBe(60);
  });
});
