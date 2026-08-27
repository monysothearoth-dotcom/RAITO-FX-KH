import { describe, expect, it, vi } from "vitest";
import { canManageTelegramNewsAlerts, deliverTelegramNewsBatch, formatTelegramNewsMessage, getTelegramHealthStatus, getTelegramHealthTransition, getTelegramNotificationPlan, runScheduledTelegramDelivery, selectUndeliveredTelegramNews, telegramNewsFingerprint, type TelegramNewsItem } from "./telegramNews";

const crypto: TelegramNewsItem = { title: "Bitcoin funding changes", url: "https://example.test/btc", source: "Source A", category: "crypto", timestamp: 2, relatedCurrency: "BTC" };
const forex: TelegramNewsItem = { title: "EUR/USD reacts to inflation", url: "https://example.test/eur", source: "Source B", category: "forex", timestamp: 1, relatedCurrency: "EURUSD" };

describe("Telegram news delivery helpers", () => {
  it("selects only unseen Forex and Crypto headlines", () => {
    const selected = selectUndeliveredTelegramNews([crypto, forex], new Set([telegramNewsFingerprint(crypto)]));
    expect(selected).toEqual([forex]);
  });

  it("formats a compact aggressive market-impact message without secrets", () => {
    const effectAnalysis = { affectedInstruments: ["BTCUSD", "XAUUSD"], direction: "BUY" as const, expectedEffect: "Risk appetite may support crypto while safe-haven demand remains conditional", impact: "high" as const, risk: "High-impact headline risk", confidence: 72, invalidation: "Invalid if price rejects the first reaction" };
    const message = formatTelegramNewsMessage([{ ...crypto, khmerTitle: "ការផ្លាស់ប្តូរថ្លៃផ្តល់មូលនិធិ Bitcoin", effectAnalysis }, forex]);
    expect(message).toContain("RAITO-FX PRO  |  MARKET IMPACT FEED");
    expect(message).toContain("⚡ HIGH CRYPTO · BTC");
    expect(message).toContain("⚡ MARKET FOREX · EURUSD");
    expect(message).toContain("🇰🇭 ការផ្លាស់ប្តូរថ្លៃផ្តល់មូលនិធិ Bitcoin");
    expect(message).toContain("EN: Bitcoin funding changes");
    expect(message).toContain("MARKET BIAS: 🟢 BULLISH BIAS");
    expect(message).toContain("PLAN: Risk appetite may support crypto while safe-haven demand remains conditional");
    expect(message).toContain("RISK: High-impact headline risk");
    expect(message).not.toContain("Confidence 72%");
    expect(message).toContain("SOURCE: Source A");
    expect(message).toContain("DETAIL: https://example.test/btc");
    expect(message.length).toBeGreaterThan(0);
    expect(message.length).toBeLessThanOrEqual(4000);
    expect(message).not.toContain("TELEGRAM_BOT_TOKEN");
  });

  it("limits the global Telegram destination controls to the project owner", () => {
    expect(canManageTelegramNewsAlerts("owner", "owner")).toBe(true);
    expect(canManageTelegramNewsAlerts("other-user", "owner")).toBe(false);
  });

  it("records a safe failure state when Telegram delivery rejects", async () => {
    const markRun = vi.fn(async () => undefined);
    await expect(deliverTelegramNewsBatch({ items: [crypto], deliveredFingerprints: new Set(), send: async () => { throw new Error("Telegram unavailable"); }, record: async () => undefined, markRun })).rejects.toThrow("Telegram unavailable");
    expect(markRun).toHaveBeenCalledWith({ success: false, error: "Telegram unavailable" });
  });

  it("renders bilingual hot news safely when direction analysis is unavailable or mixed", async () => {
    const mixed = { ...crypto, khmerTitle: "ព័ត៌មានគ្រីបតូ", effectAnalysis: { affectedInstruments: ["BTCUSD"], direction: "MIXED" as const, expectedEffect: "Conflicting signals require confirmation", impact: "high" as const, risk: "Headline volatility can reverse quickly" } };
    const missing = { ...forex, khmerTitle: "ព័ត៌មាន Forex" };
    const message = formatTelegramNewsMessage([mixed, missing]);
    expect(message).toContain("🇰🇭 ព័ត៌មានគ្រីបតូ");
    expect(message).toContain("MARKET BIAS: ⚪ NO CLEAR BIAS");
    expect(message).toContain("PLAN: Conflicting signals require confirmation");
    expect(message).toContain("EN: EUR/USD reacts to inflation");
    expect(message).toContain("SOURCE: Source B");
    expect(message).toContain("DETAIL: https://example.test/eur");

    const send = vi.fn(async () => undefined);
    const result = await runScheduledTelegramDelivery({ settings: { userId: 42, isEnabled: 1 }, fetchNews: async () => [missing], listDelivered: async () => [], send, record: async () => undefined, markRun: async () => undefined });
    expect(result).toMatchObject({ status: 200, body: { sent: 1 } });
    expect(send.mock.calls[0][0]).toContain("EN: EUR/USD reacts to inflation");
  });

  it("keeps direction analysis when Khmer translation fails", async () => {
    const send = vi.fn(async () => undefined);
    const item = { ...forex, effectAnalysis: { affectedInstruments: ["EURUSD"], direction: "SELL" as const, expectedEffect: "EUR weakness may pressure EURUSD", impact: "high" as const, risk: "Volatility can reverse the first move", confidence: 64 } };
    const result = await runScheduledTelegramDelivery({ settings: { userId: 42, isEnabled: 1 }, fetchNews: async () => [item], listDelivered: async () => [], send, record: async () => undefined, markRun: async () => undefined, translate: async () => { throw new Error("translation unavailable"); } });
    expect(result).toMatchObject({ status: 200, body: { sent: 1 } });
    expect(send.mock.calls[0][0]).toContain("MARKET BIAS: 🔴 BEARISH BIAS");
    expect(send.mock.calls[0][0]).toContain("PLAN: EUR weakness may pressure EURUSD");
    expect(send.mock.calls[0][0]).toContain("EN: EUR/USD reacts to inflation");
  });

  it("falls back to English when Khmer translation fails", async () => {
    const send = vi.fn(async () => undefined);
    const result = await runScheduledTelegramDelivery({ settings: { userId: 42, isEnabled: 1 }, fetchNews: async () => [forex], listDelivered: async () => [], send, record: async () => undefined, markRun: async () => undefined, translate: async () => { throw new Error("translation unavailable"); } });
    expect(result).toMatchObject({ status: 200, body: { sent: 1 } });
    expect(send.mock.calls[0][0]).toContain("⚡ MARKET FOREX · EURUSD");
    expect(send.mock.calls[0][0]).toContain("EN: EUR/USD reacts to inflation");
    expect(send.mock.calls[0][0]).not.toContain("🇰🇭");
  });

  it("returns the scheduled callback’s HTTP 500 result and records lastError when send fails", async () => {
    const markRun = vi.fn(async () => undefined);
    const result = await runScheduledTelegramDelivery({ settings: { userId: 42, isEnabled: 1 }, fetchNews: async () => [forex], listDelivered: async () => [], send: async () => { throw new Error("rate limited"); }, record: async () => undefined, markRun });
    expect(result.status).toBe(500);
    expect(result.body.error).toBe("rate limited");
    expect(markRun).toHaveBeenCalledWith(42, { success: false, error: "rate limited" });
  });

  it("marks partial source availability as degraded while still delivering available headlines", async () => {
    const markRun = vi.fn(async () => undefined);
    const result = await runScheduledTelegramDelivery({ settings: { userId: 42, isEnabled: 1 }, fetchNews: async () => ({ items: [forex], sourceFailures: ["CoinDesk RSS"] }), listDelivered: async () => [], send: async () => undefined, record: async () => undefined, markRun });
    expect(result).toMatchObject({ status: 200, body: { ok: true, sent: 1, degraded: true } });
    expect(markRun).toHaveBeenCalledWith(42, expect.objectContaining({ success: false, sourceFailures: ["CoinDesk RSS"] }));
  });

  it("maps settings to visible health states", () => {
    expect(getTelegramHealthStatus({ isEnabled: 0 })).toBe("disabled");
    expect(getTelegramHealthStatus({ isEnabled: 1 })).toBe("healthy");
    expect(getTelegramHealthStatus({ isEnabled: 1, sourceFailures: "Yahoo:BTCUSDT" })).toBe("degraded");
    expect(getTelegramHealthStatus({ isEnabled: 1, consecutiveFailureCount: 3 })).toBe("outage");
  });

  it("starts an outage once at the third failure and emits one recovery transition", () => {
    expect(getTelegramHealthTransition({ consecutiveFailureCount: 1, outageActive: 0 }, { success: false, error: "timeout" })).toMatchObject({ consecutiveFailureCount: 2, outageStarted: false, recovered: false });
    expect(getTelegramHealthTransition({ consecutiveFailureCount: 2, outageActive: 0 }, { success: false, error: "timeout" })).toMatchObject({ consecutiveFailureCount: 3, outageStarted: true, recovered: false });
    expect(getTelegramHealthTransition({ consecutiveFailureCount: 4, outageActive: 1 }, { success: false, error: "timeout" })).toMatchObject({ consecutiveFailureCount: 5, outageStarted: false, recovered: false });
    expect(getTelegramHealthTransition({ consecutiveFailureCount: 5, outageActive: 1 }, { success: true })).toMatchObject({ consecutiveFailureCount: 0, outageStarted: false, recovered: true });
  });

  it("plans one outage notification, one recovery notification, and retries a pending notification", () => {
    const outage = getTelegramNotificationPlan(undefined, { outageStarted: true, recovered: false, consecutiveFailureCount: 3, error: "Yahoo unavailable" });
    expect(outage).toMatchObject({ type: "outage" });
    const recovery = getTelegramNotificationPlan({ pendingNotificationType: "outage", pendingNotificationContent: "old outage" }, { outageStarted: false, recovered: true, consecutiveFailureCount: 0, error: null });
    expect(recovery).toMatchObject({ type: "recovery" });
    const retry = getTelegramNotificationPlan({ pendingNotificationType: "outage", pendingNotificationContent: "retry me" }, { outageStarted: false, recovered: false, consecutiveFailureCount: 4, error: "still unavailable" });
    expect(retry).toMatchObject({ type: "outage", content: "retry me" });
  });
});
