import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { filterAndSortNews, getNewsDecisionContext, newsEffectCardClass, newsEffectDisplayLabel, responsiveNewsBannerClassName, responsiveNewsMarqueeClassName, ResponsiveNewsBanner, TelegramAlertAction, TelegramHealthPanel, telegramAlertActionLabel, telegramHealthLabel, type NewsItem } from "./MarketNews";

const items: NewsItem[] = [
  { title: "AAPL rallies", source: "Yahoo", time: "2026-08-14T10:00:00Z", timestamp: Date.parse("2026-08-14T10:00:00Z"), summary: "Positive earnings", sentiment: "positive", impact: "high", relatedCurrency: "AAPL", category: "forex", assetTags: ["Forex", "USD"], effectAnalysis: { affectedInstruments: ["EURUSD"], direction: "BUY", expectedEffect: "Bullish", impact: "high", risk: "Risk" } },
  { title: "TSLA slips", source: "Yahoo", time: "2026-08-14T11:00:00Z", timestamp: Date.parse("2026-08-14T11:00:00Z"), summary: "Delivery concerns", sentiment: "negative", impact: "medium", relatedCurrency: "TSLA", category: "crypto", assetTags: ["Crypto", "BTC"], effectAnalysis: { affectedInstruments: ["BTCUSDT"], direction: "SELL", expectedEffect: "Bearish", impact: "medium", risk: "Risk" } },
  { title: "AAPL holds steady", source: "Yahoo", time: "2026-08-14T09:00:00Z", timestamp: Date.parse("2026-08-14T09:00:00Z"), summary: "Neutral outlook", sentiment: "neutral", impact: "low", relatedCurrency: "AAPL", category: "forex", assetTags: ["Forex", "USD"], effectAnalysis: { affectedInstruments: ["EURUSD"], direction: "MIXED", expectedEffect: "No clear edge", impact: "low", risk: "Risk" } },
];

describe("filterAndSortNews", () => {
  it("filters by ticker and sentiment", () => {
    const result = filterAndSortNews(items, { ticker: "AAPL", sentiment: "positive", effect: "all", impact: "all", search: "", sort: "newest" });
    expect(result.map((item) => item.title)).toEqual(["AAPL rallies"]);
  });

  it("renders exact effect labels and distinct card styles", () => {
    expect(newsEffectDisplayLabel("BUY")).toBe("🟢Buy (Bullish 📈)⬆️");
    expect(newsEffectDisplayLabel("SELL")).toBe("🔴Sell (Bearish 📉)⬇️");
    expect(newsEffectDisplayLabel("MIXED")).toBe("⚪Normal (No Effect🚫)🔄");
    expect(newsEffectCardClass("BUY")).toContain("emerald");
    expect(newsEffectCardClass("SELL")).toContain("rose");
    expect(newsEffectCardClass("MIXED")).toContain("slate");
  });

  it("filters by Buy, Sell, and Normal market effects", () => {
    expect(filterAndSortNews(items, { ticker: "ALL", sentiment: "all", effect: "BUY", impact: "all", search: "", sort: "newest" }).map((item) => item.title)).toEqual(["AAPL rallies"]);
    expect(filterAndSortNews(items, { ticker: "ALL", sentiment: "all", effect: "SELL", impact: "all", search: "", sort: "newest" }).map((item) => item.title)).toEqual(["TSLA slips"]);
    expect(filterAndSortNews(items, { ticker: "ALL", sentiment: "all", effect: "MIXED", impact: "all", search: "", sort: "newest" }).map((item) => item.title)).toEqual(["AAPL holds steady"]);
  });

  it("sorts by impact and then newest timestamp", () => {
    const result = filterAndSortNews(items, { ticker: "ALL", sentiment: "all", effect: "all", impact: "all", search: "", sort: "impact" });
    expect(result.map((item) => item.title)).toEqual(["AAPL rallies", "TSLA slips", "AAPL holds steady"]);
  });

  it("preserves Forex/Crypto metadata and uses server timestamps for newest sorting", () => {
    const result = filterAndSortNews([{ ...items[0], effectAnalysis: { affectedInstruments: ["XAUUSD", "EURUSD"], direction: "SELL", expectedEffect: "Dollar strength may pressure gold", impact: "high", risk: "High-impact headline risk" } }, ...items.slice(1)], { ticker: "ALL", sentiment: "all", effect: "all", impact: "all", search: "", sort: "newest" });
    expect(result[0].category).toBe("crypto");
    expect(result[0].assetTags).toContain("BTC");
    expect(result.find((item) => item.title === "AAPL rallies")?.effectAnalysis?.affectedInstruments).toContain("XAUUSD");
    expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp || 0);
  });

  it("renders the pause action when the persisted Telegram schedule is active", () => {
    expect(telegramAlertActionLabel(true)).toBe("Pause Telegram alerts");
    expect(telegramAlertActionLabel(false)).toBe("Enable 60s Telegram alerts");
  });

  it("gives the user a concise decision context before dense calendar and news controls", () => {
    const calendar = getNewsDecisionContext({ activeTab: "calendar", calendarCount: 4, newsCount: 7, alertsEnabled: true });
    const breaking = getNewsDecisionContext({ activeTab: "news", calendarCount: 0, newsCount: 2, alertsEnabled: false });
    expect(calendar.map((item) => item.value)).toContain("Review event risk first");
    expect(calendar.map((item) => item.value)).toContain("4 events · 7 headlines");
    expect(calendar.map((item) => item.value)).toContain("Delivery monitor active");
    expect(breaking.map((item) => item.value)).toContain("Review headline impact");
    expect(breaking.map((item) => item.value)).toContain("Alerts on standby");
  });

  it("renders the actual live-news banner wrapper with mobile wrapping classes", () => {
    const html = renderToStaticMarkup(createElement(ResponsiveNewsBanner, null, createElement("span", null, "LIVE HOT STREAM")));
    expect(html).toContain("flex-wrap");
    expect(html).toContain("LIVE HOT STREAM");
    expect(responsiveNewsBannerClassName).toContain("flex-wrap");
    expect(responsiveNewsMarqueeClassName).toContain("basis-full");
  });

  it("maps delivery health states to clear dashboard labels", () => {
    expect(telegramHealthLabel("healthy")).toBe("HEALTHY");
    expect(telegramHealthLabel("degraded")).toBe("DEGRADED");
    expect(telegramHealthLabel("outage")).toBe("OUTAGE");
    expect(telegramHealthLabel("disabled")).toBe("DISABLED");
  });

  it("renders the real health panel for healthy, degraded, and outage payloads", () => {
    const healthy = renderToStaticMarkup(createElement(TelegramHealthPanel, { status: { healthStatus: "healthy", runCount: 12, totalSent: 8, totalSkipped: 4, failedRunCount: 0, consecutiveFailureCount: 0 } }));
    const degraded = renderToStaticMarkup(createElement(TelegramHealthPanel, { status: { healthStatus: "degraded", runCount: 12, totalSent: 8, totalSkipped: 4, failedRunCount: 1, consecutiveFailureCount: 1, sourceFailures: "CoinDesk RSS" } }));
    const outage = renderToStaticMarkup(createElement(TelegramHealthPanel, { status: { healthStatus: "outage", runCount: 12, totalSent: 8, totalSkipped: 4, failedRunCount: 3, consecutiveFailureCount: 3, lastError: "Telegram unavailable" } }));
    expect(healthy).toContain("HEALTHY");
    expect(healthy).toContain("Runs 12");
    expect(degraded).toContain("DEGRADED");
    expect(degraded).toContain("CoinDesk RSS");
    expect(outage).toContain("OUTAGE");
    expect(outage).toContain("Telegram unavailable");
  });

  it("renders the owner pause control from authenticated enabled Telegram status data", () => {
    const html = renderToStaticMarkup(createElement(TelegramAlertAction, { isStatusError: false, isEnabled: 1, isEnabling: false, isDisabling: false, onEnable: () => undefined, onDisable: () => undefined }));
    expect(html).toContain("Pause Telegram alerts");
    expect(html).not.toContain("Enable 60s Telegram alerts");
  });
});
