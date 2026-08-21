import { describe, expect, it } from "vitest";
import { classifyActualEffect, comparePredictedEffect, movementPercent, newsEffectFingerprint, trackingSummary } from "./newsEffectTracking";

describe("news effect tracking", () => {
  it("creates a stable fingerprint for the same headline and symbol", () => {
    expect(newsEffectFingerprint({ title: "Fed holds rates", url: "https://example.test/fed", symbol: "EURUSD" })).toBe(newsEffectFingerprint({ title: "Fed holds rates", url: "https://example.test/fed", symbol: "EURUSD" }));
  });

  it("classifies subsequent movement with a neutral threshold", () => {
    expect(movementPercent(100, 101)).toBe(1);
    expect(classifyActualEffect(1)).toBe("BUY");
    expect(classifyActualEffect(-1)).toBe("SELL");
    expect(classifyActualEffect(0.02)).toBe("NORMAL");
  });

  it("compares predicted and actual effects without treating flat movement as a loss", () => {
    expect(comparePredictedEffect("BUY", "BUY")).toBe("CORRECT");
    expect(comparePredictedEffect("BUY", "SELL")).toBe("INCORRECT");
    expect(comparePredictedEffect("BUY", "NORMAL")).toBe("NEUTRAL");
    expect(comparePredictedEffect("NORMAL", "NORMAL")).toBe("CORRECT");
  });

  it("summarizes resolved and pending tracking records", () => {
    expect(trackingSummary([{ outcome: "CORRECT" }, { outcome: "INCORRECT" }, { outcome: "NEUTRAL" }, { outcome: "PENDING" }])).toMatchObject({ total: 4, correct: 1, incorrect: 1, neutral: 1, pending: 1, accuracy: 33.3 });
  });
});
