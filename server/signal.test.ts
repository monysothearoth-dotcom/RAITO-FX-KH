import { describe, expect, it } from "vitest";
import { normalizeSignalPayload } from "./signal";

describe("normalizeSignalPayload", () => {
  it("normalizes confidence to a percentage and supplies required risk fields", () => {
    expect(normalizeSignalPayload({ recommendation: "BUY", confidence: 0.65, entryPrice: 100, stopLoss: 95, takeProfit: 110 }, 100, "fallback")).toMatchObject({
      recommendation: "BUY",
      confidence: 65,
      entryPrice: 100,
      stopLoss: 95,
      takeProfit: 110,
    });
    const fallback = normalizeSignalPayload({}, 100, "fallback");
    expect(["BUY", "SELL"]).toContain(fallback.recommendation);
    expect(fallback.warning).toContain("probabilistic");
    expect(normalizeSignalPayload({ recommendation: "HOLD", confidence: 40 }, 100, "bearish downtrend").recommendation).toBe("SELL");
  });
});
