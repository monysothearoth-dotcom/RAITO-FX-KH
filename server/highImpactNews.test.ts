import { describe, expect, it } from "vitest";
import { analyzeNewsEffect, buildPreReleaseSignals, buildVerifiedEventEvidence, filterPreReleaseSignals, formatPreReleaseSignalMessage, highImpactSignalFingerprint, isWithinPreReleaseWindow, marketEffectLabel, selectUndeliveredPreReleaseSignals } from "./highImpactNews";

const now = Date.parse("2026-08-19T10:00:00.000Z");
const event = { time: "2026-08-19T10:15:00.000Z", timestamp: now + 15 * 60_000, currency: "USD", event: "CPI release", impact: "high" as const, forecast: "3.1", previous: "3.0" };

describe("high-impact news analysis", () => {
  it("maps internal directions to simple Market Effect labels", () => {
    expect(marketEffectLabel("BUY")).toBe("🟢Buy (Bullish 📈)⬆️");
    expect(marketEffectLabel("SELL")).toBe("🔴Sell (Bearish 📉)⬇️");
    expect(marketEffectLabel("MIXED")).toBe("⚪Normal (No Effect🚫)🔄");
  });
  it("maps USD high-impact events to Gold and major Forex pairs", () => {
    const signals = buildPreReleaseSignals(event, now, 15);
    expect(signals.map((signal) => signal.instrument)).toContain("XAUUSD");
    expect(signals.map((signal) => signal.instrument)).toContain("EURUSD");
    expect(signals.find((signal) => signal.instrument === "XAUUSD")?.direction).toBe("BUY");
    expect(signals[0].confidence).toBeGreaterThan(0);
  });

  it("only activates inside the configured pre-release window", () => {
    expect(isWithinPreReleaseWindow(event, now, 15)).toBe(true);
    expect(isWithinPreReleaseWindow(event, now - 60_000, 15)).toBe(false);
    expect(isWithinPreReleaseWindow(event, now + 16 * 60_000, 15)).toBe(false);
  });

  it("reports upcoming, absent, and unavailable high-impact-event states without inventing a release", () => {
    const upcoming = buildVerifiedEventEvidence([event], { now, horizonHours: 24, sourceAvailable: true });
    const absent = buildVerifiedEventEvidence([{ ...event, timestamp: now + 30 * 60 * 60_000 }], { now, horizonHours: 24, sourceAvailable: true });
    const unavailable = buildVerifiedEventEvidence([], { now, sourceAvailable: false });
    expect(upcoming.status).toBe("upcoming_high_impact");
    expect(upcoming.highImpactEvents[0]).toMatchObject({ event: "CPI release", currency: "USD", minutesUntil: 15 });
    expect(absent.status).toBe("no_upcoming_high_impact");
    expect(absent.highImpactEvents).toEqual([]);
    expect(unavailable.status).toBe("unavailable");
  });

  it("filters signals to monitored instruments and formats a clear alert", () => {
    const signals = filterPreReleaseSignals(buildPreReleaseSignals(event, now, 15), ["XAUUSD"]);
    expect(signals).toHaveLength(1);
    const message = formatPreReleaseSignalMessage(signals);
    expect(message).toContain("HIGH IMPACT · XAUUSD");
    expect(message).toContain("NEWS SIGNAL: BUY");
    expect(message).toContain("Invalidation:");
    expect(message).toContain("Risk:");
  });

  it("suppresses duplicate pre-release signals after the first delivery", () => {
    const signal = buildPreReleaseSignals(event, now, 15).find((item) => item.instrument === "XAUUSD");
    expect(signal).toBeDefined();
    const fingerprint = highImpactSignalFingerprint(signal!);
    expect(selectUndeliveredPreReleaseSignals([signal!, signal!], new Set([fingerprint]))).toEqual([]);
    expect(selectUndeliveredPreReleaseSignals([signal!], new Set())).toHaveLength(1);
  });

  it("provides a per-headline effect summary without inventing prices", () => {
    const result = analyzeNewsEffect({ title: "Fed guidance strengthens the dollar", category: "forex", relatedCurrency: "USD", impact: "high", sentiment: "positive" });
    expect(result.affectedInstruments).toContain("XAUUSD");
    expect(result.direction).toBe("BUY");
    expect(result.expectedEffect).toContain("🟢Buy (Bullish 📈)⬆️");
    expect(result.risk).toContain("High-impact");
  });
});
