import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { classifyNewsImpact, classifyNewsSentiment, normalizeHistoricalSeries, summarizePriceSeries } from "../marketData";
import { callWithProviderFallback, parseStructuredAiJson } from "../aiFallback";
import { GEMINI_GENERATE_URL, GEMINI_MODEL } from "../aiConfig";
import { normalizeSignalPayload } from "../signal";
import { buildHeadlineEvidenceForSymbol, buildMarketWatchConsensus, buildMarketWatchValidationPrompt, inferWatchDomain, type WatchCandidate } from "../marketWatch";
import { claimAutoSignalDelivery, createAutoSignal, findAutoSignalSettingsByTaskUid, findTelegramSettingsByTaskUid, listEnabledAutoSignalSettings, listOpenAutoSignals, listPendingAutoSignalDeliveries, listTelegramNewsDeliveries, markAutoSignalDeliveryFailed, markAutoSignalDeliverySent, markAutoSignalRun, markTelegramNewsRun, recordTelegramNewsDeliveries, resolveAutoSignal, touchAutoSignal } from "../db";
import { fetchAutoSignalHistoricalCloses, runAutoSignalMonitor } from "../autoSignal";
import { createSingleFlightPoller, runEnabledAutoSignalMonitors } from "../continuousAutoSignal";
import { runScheduledTelegramDelivery, sendTelegramNewsMessage, telegramNewsFingerprint, type TelegramNewsFetchResult, type TelegramNewsItem } from "../telegramNews";
import { translateTelegramNewsItemsToKhmer } from "../telegramTranslation";
import { analyzeNewsEffect, buildPreReleaseSignals, buildVerifiedEventEvidence, fetchPublicEconomicCalendar, filterPreReleaseSignals, formatPreReleaseSignalMessage, highImpactSignalFingerprint, selectUndeliveredPreReleaseSignals } from "../highImpactNews";
import { ENV } from "./env";
import { invokeLLM } from "./llm";
import { callAnthropicMessagesWithKey } from "../anthropic";
import { sdk } from "./sdk";
import { fetchAlphaVantageStockQuote } from "../alphaVantage";
import { fetchCoinGeckoCryptoPrices } from "../coinGecko";

type LivePrice = { price: number; change: number; changePercent: number; high: number; low: number };

const MARKET_SYMBOLS = {
  crypto: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", "BINANCE:BNBUSDT", "BINANCE:XRPUSDT"],
  forex: ["OANDA:EURUSD", "OANDA:GBPUSD", "OANDA:USDJPY", "OANDA:AUDUSD", "OANDA:USDCAD"],
  stocks: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA", "NASDAQ:AMZN", "NASDAQ:TSLA"],
  metals: ["OANDA:XAUUSD", "OANDA:XAGUSD"],
} as const;

function safeNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function resolveMarketWatchHeadlineEvidence(symbol: string, headlineResult: TelegramNewsFetchResult | null) {
  return headlineResult ? buildHeadlineEvidenceForSymbol(symbol, headlineResult) : { status: "not_requested" as const, sourceFailures: [], headlines: [] };
}

async function fetchLiveMarketPrices(): Promise<Record<string, LivePrice>> {
  const prices: Record<string, LivePrice> = {};
  const cryptoSymbols = MARKET_SYMBOLS.crypto.map(symbol => symbol.split(":")[1].replace("USDT", "USDT"));
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (response.ok) {
      const rows = await response.json() as Array<Record<string, unknown>>;
      for (const row of rows) {
        const symbol = String(row.symbol || "");
        if (!cryptoSymbols.includes(symbol)) continue;
        prices[`BINANCE:${symbol}`] = {
          price: safeNumber(row.lastPrice),
          change: safeNumber(row.priceChange),
          changePercent: safeNumber(row.priceChangePercent),
          high: safeNumber(row.highPrice),
          low: safeNumber(row.lowPrice),
        };
      }
    }
  } catch (error) {
    console.warn("Binance market feed unavailable", error);
  }

  try {
    const fallback = await fetchCoinGeckoCryptoPrices(ENV.coinGeckoApiKey);
    for (const [symbol, quote] of Object.entries(fallback)) {
      if (!prices[symbol]) prices[symbol] = quote;
    }
  } catch {
    console.warn("CoinGecko market feed unavailable");
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (response.ok) {
      const data = await response.json() as { rates?: Record<string, number> };
      const rates = data.rates || {};
      const forex: Record<string, number> = {
        "OANDA:EURUSD": rates.EUR ? 1 / rates.EUR : 0,
        "OANDA:GBPUSD": rates.GBP ? 1 / rates.GBP : 0,
        "OANDA:USDJPY": safeNumber(rates.JPY),
        "OANDA:AUDUSD": rates.AUD ? 1 / rates.AUD : 0,
        "OANDA:USDCAD": safeNumber(rates.CAD),
      };
      for (const [symbol, price] of Object.entries(forex)) {
        if (price > 0) prices[symbol] = { price, change: 0, changePercent: 0, high: price, low: price };
      }
    }
  } catch (error) {
    console.warn("Forex market feed unavailable", error);
  }

  await Promise.all(MARKET_SYMBOLS.stocks.map(async symbol => {
    const ticker = symbol.split(":")[1];
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`, {
        headers: { "User-Agent": "MarketLiveCharts/1.0" },
      });
      if (response.ok) {
        const data = await response.json() as any;
        const result = data?.chart?.result?.[0];
        const meta = result?.meta;
        const price = safeNumber(meta?.regularMarketPrice);
        const previous = safeNumber(meta?.chartPreviousClose || meta?.previousClose, price);
        if (price > 0) {
          const change = price - previous;
          prices[symbol] = { price, change, changePercent: previous ? (change / previous) * 100 : 0, high: price, low: price };
          return;
        }
      }
    } catch (error) {
      console.warn(`Yahoo Finance feed unavailable for ${ticker}`);
    }
    try {
      const quote = await fetchAlphaVantageStockQuote(ticker, ENV.alphaVantageApiKey);
      if (quote) prices[symbol] = quote;
    } catch {
      console.warn(`Alpha Vantage fallback unavailable for ${ticker}`);
    }
  }));

  for (const [code, symbol] of [["XAU", "OANDA:XAUUSD"], ["XAG", "OANDA:XAGUSD"]] as const) {
    try {
      const response = await fetch(`https://api.gold-api.com/price/${code}`);
      if (!response.ok) continue;
      const data = await response.json() as { price?: number };
      const price = safeNumber(data.price);
      if (price > 0) prices[symbol] = { price, change: 0, changePercent: 0, high: price, low: price };
    } catch (error) {
      console.warn(`Gold API feed unavailable for ${code}`);
    }
  }
  return prices;
}

const autoSignalCalendarCache: { expiresAt: number; events: Awaited<ReturnType<typeof fetchPublicEconomicCalendar>> } = { expiresAt: 0, events: [] };

async function fetchAutoSignalMarketPrices(): Promise<Record<string, LivePrice>> {
  const prices: Record<string, LivePrice> = {};
  await Promise.all([
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", { signal: AbortSignal.timeout(8_000) }).then(async (response) => {
      if (!response.ok) throw new Error(`Binance BTCUSDT unavailable (${response.status})`);
      const row = await response.json() as { lastPrice?: string; priceChange?: string; priceChangePercent?: string; highPrice?: string; lowPrice?: string };
      const price = safeNumber(row.lastPrice);
      if (price > 0) prices["BINANCE:BTCUSDT"] = { price, change: safeNumber(row.priceChange), changePercent: safeNumber(row.priceChangePercent), high: safeNumber(row.highPrice, price), low: safeNumber(row.lowPrice, price) };
    }).catch(async () => {
      const fallback: Record<string, LivePrice> = await fetchCoinGeckoCryptoPrices(ENV.coinGeckoApiKey).catch(() => ({} as Record<string, LivePrice>));
      const quote = fallback["BINANCE:BTCUSDT"];
      if (quote) prices["BINANCE:BTCUSDT"] = quote;
    }),
    fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(8_000) }).then(async (response) => {
      if (!response.ok) throw new Error(`Gold XAU unavailable (${response.status})`);
      const row = await response.json() as { price?: number };
      const price = safeNumber(row.price);
      if (price > 0) prices["OANDA:XAUUSD"] = { price, change: 0, changePercent: 0, high: price, low: price };
    }).catch(() => undefined),
  ]);
  return prices;
}

async function fetchAutoSignalCalendar() {
  if (autoSignalCalendarCache.expiresAt > Date.now()) return autoSignalCalendarCache.events;
  const events = await fetchPublicEconomicCalendar();
  autoSignalCalendarCache.events = events;
  autoSignalCalendarCache.expiresAt = Date.now() + 60_000;
  return events;
}

function yahooSymbolForTradingView(symbol: string): string {
  const clean = symbol.split(':').pop()?.toUpperCase() || symbol.toUpperCase();
  if (clean === 'XAUUSD') return 'GC=F';
  if (clean === 'XAGUSD') return 'SI=F';
  if (clean.endsWith('USDT')) return `${clean.slice(0, -4)}-USD`;
  if (/^[A-Z]{6}$/.test(clean)) return `${clean}=X`;
  return clean;
}

type ChartContext = {
  symbol: string;
  yahooSymbol: string;
  live: LivePrice | null;
  historical: ReturnType<typeof summarizePriceSeries>;
  chartDataPoints: Array<{ timestamp: number; close: number }>;
};

const chartContextCache = new Map<string, { expiresAt: number; context: ChartContext }>();

async function fetchLiveChartContext(symbol: string): Promise<ChartContext> {
  const cacheKey = symbol.toUpperCase();
  const cached = chartContextCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.context;
  const cleanSymbol = symbol.split(':').pop()?.toUpperCase() || symbol.toUpperCase();
  const yahooSymbol = yahooSymbolForTradingView(symbol);
  const pricesPromise = Promise.race([
    fetchLiveMarketPrices(),
    new Promise<Record<string, LivePrice>>((resolve) => setTimeout(() => resolve({}), 18000)),
  ]);
  const yahooPromise = fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1y`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(18000) })
    .then((response) => response.json() as Promise<any>)
    .catch(() => null);
  const [prices, yahooData] = await Promise.all([pricesPromise, yahooPromise]);
  const live = prices[symbol] || prices[`BINANCE:${cleanSymbol}`] || prices[`OANDA:${cleanSymbol}`] || prices[`NASDAQ:${cleanSymbol}`];
  const result = yahooData?.chart?.result?.[0];
  const series = normalizeHistoricalSeries(result?.timestamp || [], result?.indicators?.quote?.[0]?.close || []);
  const groundedSeries = series.length || !live ? series : [{ timestamp: Math.floor(Date.now() / 1000), close: live.price }];
  const context = { symbol, yahooSymbol, live: live || null, historical: summarizePriceSeries(groundedSeries), chartDataPoints: groundedSeries.slice(-10) };
  chartContextCache.set(cacheKey, { expiresAt: Date.now() + 15000, context });
  return context;
}

const AI_ENDPOINTS: Record<string, { url: string; model: string; kind: "openai" | "anthropic" | "gemini" }> = {
  openrouter: { url: "https://openrouter.ai/api/v1/chat/completions", model: "google/gemini-2.5-flash", kind: "openai" },
  grok: { url: "https://openrouter.ai/api/v1/chat/completions", model: "x-ai/grok-4.6", kind: "openai" },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", kind: "openai" },
  anthropic: { url: "https://api.anthropic.com/v1/messages", model: "claude-haiku-4-5-20251001", kind: "anthropic" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", kind: "openai" },
  deepseek: { url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat", kind: "openai" },
  nvidia: { url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "meta/llama-3.1-70b-instruct", kind: "openai" },
  gemini: { url: GEMINI_GENERATE_URL, model: GEMINI_MODEL, kind: "gemini" },
};

async function callPlatformAI(messages: Array<{ role: string; content: string }>) {
  const response = await invokeLLM({
    messages: messages.map((message) => ({ role: message.role as "system" | "user" | "assistant", content: message.content })),
    maxTokens: 2000,
  });
  const content = response.choices?.[0]?.message?.content;
  return Array.isArray(content) ? content.map((part: any) => part.text || "").join("") : String(content || "");
}

export async function callUserSuppliedAI(provider: string, apiKey: string, messages: Array<{ role: string; content: string }>) {
  const config = AI_ENDPOINTS[provider.toLowerCase()];
  if (!config) throw new Error("Unsupported AI provider");
  if (!apiKey?.trim()) throw new Error("A provider API key is required at runtime");
  if (config.kind === "gemini") {
    const response = await fetch(`${config.url}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: messages.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.role === "system" ? `[SYSTEM INSTRUCTIONS]\n${message.content}` : message.content }] })) }),
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Gemini request failed");
    return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join("") || "";
  }
  if (config.kind === "anthropic") return callAnthropicMessagesWithKey(apiKey, messages as Array<{ role: "system" | "user" | "assistant"; content: string }>, { model: config.model, maxTokens: 2000 });
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  const response = await fetch(config.url, {
    method: "POST", headers,
    body: JSON.stringify({ model: config.model, messages, temperature: 0.2, max_tokens: 2000 }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || data?.error || "AI request failed");
  return data?.choices?.[0]?.message?.content || "";
}

async function reviewAutoSignalWithBackendProviders(candidate: { symbol: string; direction: string; entryPrice: number; stopLoss: number; takeProfit: number; confidence: number; technicalScore: number; strategyScore: number; fundamentalScore: number; intelligenceScore: number; rationale: string }) {
  const messages = [
    { role: "system", content: "You are a cautious market-analysis reviewer. Do not give financial advice, infer unsupplied news, or claim certainty. Review only the supplied deterministic setup. Return strict JSON: {\"approve\":boolean,\"note\":string}. Approve only when the stated technical, strategy, fundamental, and intelligence scores are internally consistent; the risk/reward is valid; the rationale states a conditional scenario and invalidation; and no claim exceeds the supplied evidence. Reject vague, contradictory, or unsupported setups." },
    { role: "user", content: JSON.stringify(candidate) },
  ];
  const providers = [["gemini", ENV.geminiApiKey], ["openai", ENV.openAiApiKey], ["anthropic", ENV.anthropicApiKey], ["grok", ENV.openRouterApiKey]] as const;
  const failures: string[] = [];
  for (const [provider, apiKey] of providers) {
    if (!apiKey) { failures.push(`${provider}:not-configured`); continue; }
    try {
      const parsed = parseStructuredAiJson(await callUserSuppliedAI(provider, apiKey, messages));
      if (!parsed || typeof parsed.approve !== "boolean") throw new Error("invalid-review");
      return { approved: parsed.approve, provider, note: typeof parsed.note === "string" ? parsed.note.slice(0, 280) : "Backend AI review completed." };
    } catch (error) {
      failures.push(`${provider}:${error instanceof Error ? error.message : "request-failed"}`);
    }
  }
  return { approved: true, provider: "deterministic-fallback", note: `AI review unavailable; retained deterministic confluence gate (${failures.map((failure) => failure.split(":")[0]).join(", ") || "no-provider"}).` };
}

async function runConfiguredAutoSignalMonitor(settings: { userId: number; isEnabled: number; minConfidence: number; minScore: number; minRiskReward: number } | undefined, fetchPrices = fetchAutoSignalMarketPrices) {
  return runAutoSignalMonitor({
    settings,
    fetchPrices,
    fetchHistorical: fetchAutoSignalHistoricalCloses,
    fetchCalendar: fetchAutoSignalCalendar,
    listOpen: listOpenAutoSignals,
    create: createAutoSignal,
    resolve: resolveAutoSignal,
    touch: touchAutoSignal,
    listDeliveryQueue: listPendingAutoSignalDeliveries,
    claimDelivery: claimAutoSignalDelivery,
    review: reviewAutoSignalWithBackendProviders,
    send: (text) => sendTelegramNewsMessage(ENV.autoSignalTelegramBotToken, ENV.autoSignalTelegramChatId, text),
    markDeliverySent: markAutoSignalDeliverySent,
    markDeliveryFailed: markAutoSignalDeliveryFailed,
    markRun: markAutoSignalRun,
  });
}

type NewsCategory = "forex" | "crypto";

function cleanXml(value: string): string {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function extractXmlTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? cleanXml(match[1]) : "";
}

function classifyNewsCategory(text: string, symbol = ""): NewsCategory | null {
  const value = `${symbol} ${text}`.toUpperCase();
  const crypto = /\b(BTC|BITCOIN|ETH|ETHEREUM|SOL|SOLANA|XRP|RIPPLE|BNB|DOGE|CRYPTO|BLOCKCHAIN|STABLECOIN|DEFI|EXCHANGE|BINANCE|COINBASE)\b/.test(value);
  const forex = /\b(EURUSD|GBPUSD|USDJPY|AUDUSD|USDCAD|USDCHF|NZDUSD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|DOLLAR|EURO|POUND|YEN|FOREX|CURRENCY|FED|FOMC|ECB|BOE|BOJ|RBA|RBNZ|SNB)\b/.test(value);
  if (crypto && !forex) return "crypto";
  if (forex) return "forex";
  return null;
}

function parseRssItems(xml: string, source: string, category: NewsCategory): Array<Record<string, unknown>> {
  return Array.from(xml.matchAll(/<item[\s\S]*?<\/item>/gi)).map((match) => {
    const block = match[0];
    const title = extractXmlTag(block, "title");
    const summary = extractXmlTag(block, "description") || title;
    const link = extractXmlTag(block, "link");
    const published = extractXmlTag(block, "pubDate") || extractXmlTag(block, "published");
    const timestamp = Date.parse(published) || Date.now();
    const text = `${title} ${summary}`;
    return {
      title,
      source,
      time: new Date(timestamp).toLocaleString(),
      timestamp,
      summary,
      sentiment: classifyNewsSentiment(text),
      impact: classifyNewsImpact(text),
      relatedCurrency: category === "crypto" ? "CRYPTO" : "FOREX",
      category,
      assetTags: category === "crypto" ? ["Crypto"] : ["Forex"],
      url: link,
    };
  }).filter((item) => Boolean(item.title));
}

function isTrackedMarketSymbol(value: string): NewsCategory | null {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return classifyNewsCategory(`${clean} ${value}`, value);
}

function isRelevantNewsItem(item: Record<string, unknown>, category: string): boolean {
  const text = `${item.title || ""} ${item.summary || ""} ${item.relatedCurrency || ""}`;
  const inferred = classifyNewsCategory(text, String(item.relatedCurrency || ""));
  return (category === "all" || category === inferred) && Boolean(inferred);
}

async function fetchTelegramNewsItems(options: { symbols?: string[]; includeCryptoRss?: boolean } = {}): Promise<TelegramNewsFetchResult> {
  const sourceFailures: string[] = [];
  const trackedSymbols = options.symbols || ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"];
  const yahoo = await Promise.all(trackedSymbols.map(async (querySymbol) => {
    const category = isTrackedMarketSymbol(querySymbol);
    if (!category) return [] as TelegramNewsItem[];
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(querySymbol)}&newsCount=8`, { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) { sourceFailures.push(`Yahoo:${querySymbol}:${response.status}`); return [] as TelegramNewsItem[]; }
      const data = await response.json() as any;
      return (data?.news || []).map((item: any): TelegramNewsItem => {
        const title = String(item.title || "Market headline");
        const relatedCurrency = category === "crypto" ? querySymbol.replace(/USDT$/i, "").toUpperCase() : querySymbol;
        const impact = classifyNewsImpact(title);
        const sentiment = classifyNewsSentiment(title);
        return {
          title, url: String(item.link || ""), source: String(item.publisher || "Yahoo Finance"), category,
          timestamp: item.providerPublishTime ? Number(item.providerPublishTime) * 1000 : Date.now(), relatedCurrency,
          effectAnalysis: analyzeNewsEffect({ title, category, relatedCurrency, impact, sentiment }),
        };
      }).filter((item: TelegramNewsItem) => isRelevantNewsItem(item as unknown as Record<string, unknown>, "all"));
    } catch { sourceFailures.push(`Yahoo:${querySymbol}`); return [] as TelegramNewsItem[]; }
  }));
  const rssSources = [
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk RSS" },
    { url: "https://cointelegraph.com/rss", name: "Cointelegraph RSS" },
  ];
  const rss = options.includeCryptoRss === false ? [] : await Promise.all(rssSources.map(async (source) => {
    try {
      const response = await fetch(source.url, { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) { sourceFailures.push(`${source.name}:${response.status}`); return [] as TelegramNewsItem[]; }
      return parseRssItems(await response.text(), source.name, "crypto").map((item): TelegramNewsItem => {
        const title = String(item.title || "Market headline");
        const relatedCurrency = String(item.relatedCurrency || "CRYPTO");
        const impact = classifyNewsImpact(title);
        const sentiment = classifyNewsSentiment(title);
        return { title, url: String(item.url || ""), source: String(item.source || source.name), category: "crypto", timestamp: Number(item.timestamp || Date.now()), relatedCurrency, effectAnalysis: analyzeNewsEffect({ title, category: "crypto", relatedCurrency, impact, sentiment }) };
      }).filter((item) => isRelevantNewsItem(item as unknown as Record<string, unknown>, "all"));
    } catch { sourceFailures.push(source.name); return [] as TelegramNewsItem[]; }
  }));
  const deduped = new Map<string, TelegramNewsItem>();
  for (const item of [...yahoo.flat(), ...rss.flat()]) deduped.set(telegramNewsFingerprint(item), item);
  return { items: Array.from(deduped.values()).sort((a, b) => b.timestamp - a.timestamp), sourceFailures };
}

type MacroObservation = { date: string; value: number | null };

function parseFredCsv(csv: string): MacroObservation[] {
  return csv.split(/\r?\n/).slice(1).map((line) => {
    const [date, rawValue] = line.split(",");
    const value = rawValue === undefined || rawValue === ".." ? null : Number(rawValue);
    return { date, value: Number.isFinite(value) ? value : null };
  }).filter((row) => Boolean(row.date));
}

async function fetchMacroIndicators() {
  const series = ["CPIAUCSL", "UNRATE", "PAYEMS", "FEDFUNDS", "DGS2", "DGS10"];
  const sourceStatus: Record<string, "ok" | "failed"> = {};
  const observations: Record<string, MacroObservation[]> = {};
  await Promise.all(series.map(async (id) => {
    try {
      const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`FRED ${id} ${response.status}`);
      observations[id] = parseFredCsv(await response.text());
      sourceStatus[id] = "ok";
    } catch {
      observations[id] = [];
      sourceStatus[id] = "failed";
    }
  }));
  const latest = (id: string) => [...(observations[id] || [])].reverse().find((row) => row.value !== null) || null;
  const cpi = latest("CPIAUCSL");
  const unemployment = latest("UNRATE");
  const policyRate = latest("FEDFUNDS");
  const payrolls = latest("PAYEMS");
  const twoYear = latest("DGS2");
  const tenYear = latest("DGS10");
  return {
    indicators: { cpi, unemployment, payrolls, policyRate, twoYear, tenYear, yieldDifferential: tenYear?.value !== null && twoYear?.value !== null ? Number((Number(tenYear?.value || 0) - Number(twoYear?.value || 0)).toFixed(3)) : null },
    series: observations,
    source: "FRED public CSV",
    sourceStatus,
    lastUpdated: Date.now(),
    refreshRecommendedSeconds: 900,
  };
}

async function fetchCryptoMetrics(symbol = "BTCUSDT") {
  const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/USDT$/, "") + "USDT";
  const sourceStatus: Record<string, "ok" | "failed"> = {};
  const [premium, openInterest, funding, chainStats, unlocks] = await Promise.all([
    fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(clean)}`, { signal: AbortSignal.timeout(10000) }).then(async (r) => { if (!r.ok) throw new Error("premium"); return r.json() as Promise<any>; }).catch(() => null),
    fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${encodeURIComponent(clean)}`, { signal: AbortSignal.timeout(10000) }).then(async (r) => { if (!r.ok) throw new Error("oi"); return r.json() as Promise<any>; }).catch(() => null),
    fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${encodeURIComponent(clean)}&limit=1`, { signal: AbortSignal.timeout(10000) }).then(async (r) => { if (!r.ok) throw new Error("funding"); return r.json() as Promise<any[]>; }).catch(() => null),
    fetch("https://api.blockchain.info/stats", { signal: AbortSignal.timeout(10000) }).then(async (r) => { if (!r.ok) throw new Error("chain"); return r.json() as Promise<any>; }).catch(() => null),
    fetch("https://api.llama.fi/unlocks", { signal: AbortSignal.timeout(10000) }).then(async (r) => { if (!r.ok) throw new Error("unlocks"); return r.json() as Promise<any>; }).catch(() => null),
  ]);
  sourceStatus.binance = premium || openInterest || funding ? "ok" : "failed";
  sourceStatus.blockchain = chainStats ? "ok" : "failed";
  sourceStatus.defiLlama = unlocks ? "ok" : "failed";
  const fundingRow = Array.isArray(funding) ? funding[0] : null;
  const unlockList = Array.isArray(unlocks) ? unlocks : Array.isArray(unlocks?.data) ? unlocks.data : Array.isArray(unlocks?.events) ? unlocks.events : [];
  return {
    symbol: clean,
    derivatives: { fundingRate: premium?.lastFundingRate ?? fundingRow?.fundingRate ?? null, markPrice: premium?.markPrice ?? null, indexPrice: premium?.indexPrice ?? null, openInterest: openInterest?.openInterest ?? null, fundingTime: premium?.nextFundingTime ?? fundingRow?.fundingTime ?? null },
    onChain: clean === "BTCUSDT" && chainStats ? { network: "Bitcoin", marketPriceUsd: chainStats.market_price_usd ?? null, hashRate: chainStats.hash_rate ?? null, transactionsPerSecond: chainStats.n_tx_per_sec ?? null, totalTransactions: chainStats.n_tx ?? null } : null,
    unlocks: unlockList.slice(0, 8).map((item: any) => ({ token: item.token || item.symbol || item.name || "Unknown", date: item.date || item.unlockDate || item.timestamp || null, amountUsd: item.amount || item.amountUsd || item.usdValue || null })).filter((item: any) => item.token !== "Unknown"),
    sourceStatus,
    sources: { derivatives: "Binance Futures public API", onChain: "Blockchain.com public stats", unlocks: "DefiLlama public API" },
    lastUpdated: Date.now(),
    refreshRecommendedSeconds: 60,
  };
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/scheduled/telegram-news", async (req, res) => {
    try {
      const cronUser = await sdk.authenticateRequest(req);
      if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
      const settings = await findTelegramSettingsByTaskUid(cronUser.taskUid);
      let highImpactError: string | null = null;
      if (settings?.isEnabled && Number(settings.highImpactAlertsEnabled ?? 1)) {
        try {
          const events = await fetchPublicEconomicCalendar();
          const signals = events.flatMap((event) => buildPreReleaseSignals(event, Date.now(), Number(settings.highImpactLeadMinutes || 15)));
          const allowed = String(settings.highImpactInstruments || "XAUUSD,EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD").split(",").map((value) => value.trim()).filter(Boolean);
          const delivered = await listTelegramNewsDeliveries(settings.userId);
          const pending = selectUndeliveredPreReleaseSignals(filterPreReleaseSignals(signals, allowed), new Set(delivered.map((item) => item.fingerprint)));
          if (pending.length) {
            await sendTelegramNewsMessage(ENV.telegramBotToken, ENV.telegramChatId, formatPreReleaseSignalMessage(pending));
            await recordTelegramNewsDeliveries(settings.userId, pending.map((signal) => ({ fingerprint: highImpactSignalFingerprint(signal), title: `[HIGH IMPACT] ${signal.direction} ${signal.instrument} · ${signal.event}`, category: signal.instrument === "XAUUSD" ? "forex" : "forex", source: "Public Forex Calendar" })));
          }
        } catch (error) {
          highImpactError = error instanceof Error ? error.message : "High-impact pre-release analysis unavailable";
          console.warn("[TelegramNews] High-impact pre-release analysis unavailable", highImpactError);
        }
      }
      const result = await runScheduledTelegramDelivery({
        settings,
        fetchNews: fetchTelegramNewsItems,
        listDelivered: listTelegramNewsDeliveries,
        send: (text) => sendTelegramNewsMessage(ENV.telegramBotToken, ENV.telegramChatId, text),
        record: (userId, items) => recordTelegramNewsDeliveries(userId, items.map((item) => ({ fingerprint: telegramNewsFingerprint(item), title: item.title, url: item.url, category: item.category, source: item.source }))),
        markRun: markTelegramNewsRun,
        translate: translateTelegramNewsItemsToKhmer,
      });
      if (highImpactError && settings) {
        await markTelegramNewsRun(settings.userId, { success: false, error: `High-impact pre-release alert: ${highImpactError}`, sourceFailures: ["Public Forex Calendar"] });
      }
      return res.status(result.status).json(result.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Telegram news delivery failed";
      console.error("[TelegramNews] scheduled delivery failed", message);
      return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
    }
  });

  app.post("/api/scheduled/auto-signal-monitor", async (req, res) => {
    try {
      const cronUser = await sdk.authenticateRequest(req);
      if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
      const settings = await findAutoSignalSettingsByTaskUid(cronUser.taskUid);
      const result = await runConfiguredAutoSignalMonitor(settings, fetchAutoSignalMarketPrices);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auto Signal Analyze monitor failed";
      console.error("[AutoSignal] scheduled monitor failed", message);
      return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
    }
  });

  app.get("/api/live-prices", async (_req, res) => {
    const prices = await fetchLiveMarketPrices();
    res.json({ prices, source: "Binance · CoinGecko fallback · open.er-api · Yahoo Finance · Alpha Vantage fallback · gold-api.com", timestamp: Date.now() });
  });

  app.get("/api/macro-indicators", async (_req, res) => {
    res.json(await fetchMacroIndicators());
  });

  app.get("/api/crypto-metrics", async (req, res) => {
    res.json(await fetchCryptoMetrics(String(req.query.symbol || "BTCUSDT")));
  });

  app.get("/api/historical", async (req, res) => {
    const rawSymbol = String(req.query.symbol || "NASDAQ:AAPL").split(":").pop() || "AAPL";
    const range = String(req.query.range || "1y");
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(rawSymbol)}?interval=1d&range=${encodeURIComponent(range)}`, { headers: { "User-Agent": "MarketLiveCharts/1.0" } });
      const data = await response.json() as any;
      const result = data?.chart?.result?.[0];
      const timestamps = result?.timestamp || [];
      const closes = result?.indicators?.quote?.[0]?.close || [];
      const series = normalizeHistoricalSeries(timestamps, closes);
      res.json({ symbol: rawSymbol, series, source: "Yahoo Finance" });
    } catch (error) {
      res.status(200).json({ symbol: rawSymbol, series: [], source: "Yahoo Finance", error: "Historical data temporarily unavailable" });
    }
  });

  app.get("/api/news", async (req, res) => {
    const rawSymbol = String(req.query.symbol || "BINANCE:BTCUSDT").split(":").pop() || "BTCUSDT";
    const requestedSymbols = String(req.query.symbols || rawSymbol).split(',').map((value) => value.trim().split(':').pop()).filter(Boolean).slice(0, 24) as string[];
    const requestedCategory = String(req.query.category || "all").toLowerCase();
    const category = requestedCategory === "forex" || requestedCategory === "crypto" ? requestedCategory : "all";
    const fallbackSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"];
    const trackedSymbols = Array.from(new Set([...requestedSymbols, ...fallbackSymbols].filter((value) => Boolean(isTrackedMarketSymbol(value))))).slice(0, 12);
    const sourceStatus: Record<string, "ok" | "unavailable"> = {};
    try {
      const yahooResponses = await Promise.all(trackedSymbols.map(async (querySymbol) => {
        const sourceCategory = isTrackedMarketSymbol(querySymbol);
        if (!sourceCategory || (category !== "all" && sourceCategory !== category)) return [];
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(querySymbol)}&newsCount=8`, { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error(`Yahoo ${response.status}`);
          sourceStatus.yahoo = "ok";
          const data = await response.json() as any;
          return (data?.news || []).map((item: any) => {
            const title = String(item.title || "Market headline");
            const summary = String(item.summary || item.title || "Latest market coverage");
            const text = `${title} ${summary}`;
            const related = sourceCategory === "crypto" ? querySymbol.replace(/USDT$/i, "").toUpperCase() : querySymbol.toUpperCase();
            const timestamp = item.providerPublishTime ? Number(item.providerPublishTime) * 1000 : Date.now();
            const impact = classifyNewsImpact(text);
            const sentiment = classifyNewsSentiment(text);
            const effectAnalysis = analyzeNewsEffect({ title, category: sourceCategory, relatedCurrency: related, impact, sentiment });
            return {
              title,
              source: String(item.publisher || "Yahoo Finance"),
              time: new Date(timestamp).toLocaleString(),
              timestamp,
              summary,
              sentiment,
              impact,
              effectAnalysis,
              relatedCurrency: related,
              category: sourceCategory,
              assetTags: [sourceCategory === "crypto" ? "Crypto" : "Forex", related],
              url: item.link,
            };
          });
        } catch {
          sourceStatus.yahoo = "unavailable";
          return [];
        }
      }));

      const rssSources: Array<{ url: string; name: string }> = category === "forex" ? [] : [
        { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk RSS" },
        { url: "https://cointelegraph.com/rss", name: "Cointelegraph RSS" },
      ];
      const rssResponses = await Promise.all(rssSources.map(async (source) => {
        try {
          const response = await fetch(source.url, { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error(`RSS ${response.status}`);
          sourceStatus[source.name] = "ok";
          return parseRssItems(await response.text(), source.name, "crypto");
        } catch {
          sourceStatus[source.name] = "unavailable";
          return [];
        }
      }));

      const merged = [...yahooResponses.flat(), ...rssResponses.flat()].filter((item) => isRelevantNewsItem(item, category));
      const deduped = Array.from(new Map(merged.map((item) => [`${item.url || item.title}|${item.relatedCurrency}`, item])).values());
      const news = deduped.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)).slice(0, 50).map((item: any) => item.effectAnalysis ? item : { ...item, effectAnalysis: analyzeNewsEffect({ title: String(item.title || ""), category: item.category === "crypto" ? "crypto" : "forex", relatedCurrency: String(item.relatedCurrency || ""), impact: item.impact, sentiment: item.sentiment }) });
      let calendar: Array<Record<string, unknown>> = [];
      if (category !== "crypto") {
        try {
          const calendarResponse = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { headers: { "User-Agent": "MarketLiveCharts/1.0" }, signal: AbortSignal.timeout(8000) });
          if (!calendarResponse.ok) throw new Error(`Calendar ${calendarResponse.status}`);
          sourceStatus["Public Forex Calendar"] = "ok";
          const rows = await calendarResponse.json() as Array<Record<string, unknown>>;
          calendar = rows.filter((row) => Boolean(row.title || row.event)).slice(0, 40).map((row) => {
            const impact = String(row.impact || "low").toLowerCase();
            return { time: String(row.date || row.time || ""), currency: String(row.country || row.currency || "USD").toUpperCase(), event: String(row.title || row.event || "Economic release"), impact: impact === "high" ? "high" : impact === "medium" ? "medium" : "low", actual: String(row.actual || ""), forecast: String(row.forecast || ""), previous: String(row.previous || ""), sentiment: "neutral", analysis: "Public economic-calendar event; compare actual, forecast, and previous values." };
          });
        } catch {
          sourceStatus["Public Forex Calendar"] = "unavailable";
        }
      }
      const categoryLabel = category === "all" ? "Forex and Cryptocurrency" : category === "crypto" ? "Cryptocurrency" : "Forex";
      res.json({ news, calendar, category, categories: ["forex", "crypto"], macroSummary: `${categoryLabel} headlines from free public market sources.`, sourceStatus, apiKeySource: "Yahoo Finance + public RSS + public economic calendar", lastUpdated: new Date().toLocaleTimeString(), refreshRecommendedSeconds: 60 });
    } catch (error) {
      res.status(200).json({ news: [], calendar: [], category, categories: ["forex", "crypto"], macroSummary: "Free public market-news sources are temporarily unavailable.", sourceStatus, apiKeySource: "Free public sources", lastUpdated: new Date().toLocaleTimeString(), refreshRecommendedSeconds: 60 });
    }
  });

  app.post("/api/market-watch", async (req, res) => {
    try {
      const { symbol, strategy, timeframe, currentPrice, customPrompt } = req.body || {};
      const chartContext = await fetchLiveChartContext(String(symbol || ""));
      const needsHeadlineEvidence = /news|macro/i.test(`${strategy || ""} ${customPrompt || ""}`);
      const marketDomain = inferWatchDomain(String(symbol || ""));
      const headlineSymbol = String(symbol || "").split(":").pop()?.toUpperCase() || "";
      const [macroSnapshot, cryptoSnapshot, calendarResult, headlineResult] = await Promise.all([
        fetchMacroIndicators(),
        marketDomain === "crypto" ? fetchCryptoMetrics(headlineSymbol || "BTCUSDT") : Promise.resolve(null),
        fetchPublicEconomicCalendar().then((events) => ({ events, sourceAvailable: true })).catch(() => ({ events: [], sourceAvailable: false })),
        needsHeadlineEvidence ? fetchTelegramNewsItems({ symbols: headlineSymbol ? [headlineSymbol] : undefined, includeCryptoRss: marketDomain === "crypto" }) : Promise.resolve(null),
      ]);
      const eventEvidence = buildVerifiedEventEvidence(calendarResult.events, { sourceAvailable: calendarResult.sourceAvailable, horizonHours: 24 });
      const headlineEvidence = resolveMarketWatchHeadlineEvidence(String(symbol || ""), headlineResult);
      const providers = ["gemini", "platform"] as const;
      const prompt = buildMarketWatchValidationPrompt({ symbol: String(symbol || ""), strategy, timeframe, customPrompt, chartContext, macroContext: macroSnapshot, cryptoContext: cryptoSnapshot, eventEvidence, headlineEvidence });
      const messages = [{ role: "system", content: "You are a careful market analysis provider. Return valid JSON only, grounded in live data, with BUY or SELL only." }, { role: "user", content: prompt }];
      const candidates: WatchCandidate[] = [];
      const statuses: Array<{ provider: string; status: "ok" | "failed"; recommendation?: "BUY" | "SELL"; error?: string }> = [];
      await Promise.all(providers.map(async (provider) => {
        const key = provider === "gemini" ? ENV.geminiApiKey || process.env.USER_GEMINI_API_KEY || "" : "";
        try {
          const text = provider === "platform" ? await callPlatformAI(messages) : await callUserSuppliedAI(provider, key, messages);
          candidates.push({ provider, text, payload: parseStructuredAiJson(text) || { rationale: text } });
          statuses.push({ provider, status: "ok" });
        } catch (error) {
          statuses.push({ provider, status: "failed", error: error instanceof Error ? error.message : "provider request failed" });
        }
      }));
      if (!candidates.length) throw new Error("No configured AI provider returned an analysis.");
      const fallbackPrice = safeNumber(chartContext.live?.price, safeNumber(currentPrice));
      const consensus = buildMarketWatchConsensus(candidates, fallbackPrice);
      const resolvedStatuses = statuses.map((status) => {
        const candidate = candidates.find((item) => item.provider === status.provider);
        return candidate ? { ...status, recommendation: normalizeSignalPayload(candidate.payload, fallbackPrice, candidate.text).recommendation } : status;
      });
      res.json({ ...consensus, symbol, strategy, timeframe, modelUsed: "unified-market-watch", providerStatuses: resolvedStatuses, eventEvidence, headlineEvidence, chartContext: { symbol: chartContext.symbol, yahooSymbol: chartContext.yahooSymbol, historical: chartContext.historical } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Unified market watch failed" });
    }
  });

  app.post("/api/chat-agent", async (req, res) => {
    try {
      const { provider, apiKey, customApiKey, fallbackProviders = [], apiKeys = {}, messages = [], prompt, message, history = [], model = "gemini-2.5-flash", selectedSymbol } = req.body || {};
      const inferredProvider = provider || (String(model).includes("openrouter") ? "openrouter" : String(model).includes("groq") ? "groq" : String(model).includes("claude") || String(model).includes("anthropic") ? "anthropic" : String(model).includes("deepseek") ? "deepseek" : String(model).includes("nvidia") || String(model).includes("nemotron") ? "nvidia" : String(model).includes("gpt") || String(model).includes("chatgpt") ? "openai" : "gemini");
      const chartContext = selectedSymbol ? await fetchLiveChartContext(String(selectedSymbol)) : null;
      const systemContext = `You are NEXUS Core, a careful market analysis assistant. Do not promise returns. Use the supplied live chart context as the source of truth; never invent prices. When asked for a signal, provide a cautious BUY or SELL view with confidence, entry, stop loss, take profit, rationale, and risk warning. Return BUY or SELL only. If the user asks for signal analysis, return strict JSON with recommendation, confidence, entryPrice, stopLoss, takeProfit, rationale, and warning. Live chart context: ${JSON.stringify(chartContext)}`;
      const suppliedMessages = Array.isArray(messages) && messages.length
        ? messages.map((item: any) => ({ role: item.role === "model" ? "assistant" : item.role, content: String(item.text || item.content || "") })).filter((item: any) => item.role !== "system")
        : ((Array.isArray(history) ? history : []).map((item: any) => ({ role: item.role === "model" ? "assistant" : item.role, content: String(item.text || item.content || "") }))).filter((item: any) => item.role !== "system");
      const normalizedMessages = [
        { role: "system", content: systemContext },
        ...suppliedMessages,
        ...(prompt || message ? [{ role: "user", content: String(prompt || message) }] : [{ role: "user", content: `Analyze ${selectedSymbol || "the selected market"}.` }]),
      ];
      const primaryKey = apiKey || customApiKey || (inferredProvider === "gemini" ? process.env.USER_GEMINI_API_KEY || "" : inferredProvider === "anthropic" ? ENV.anthropicApiKey : "");
      const result = await callWithProviderFallback(inferredProvider, primaryKey, [...fallbackProviders, "platform"], { ...apiKeys, platform: "internal" }, normalizedMessages, (provider, key, messages) => provider === "platform" ? callPlatformAI(messages) : callUserSuppliedAI(provider, key, messages));
      const signal = normalizeSignalPayload(parseStructuredAiJson(result.text), safeNumber(chartContext?.live?.price, safeNumber(chartContext?.historical.last)), result.text);
      res.json({ reply: result.text, text: result.text, signal, chartContext: chartContext ? { symbol: chartContext.symbol, yahooSymbol: chartContext.yahooSymbol, historical: chartContext.historical } : null, provider: result.provider, attemptedProviders: result.attemptedProviders, fallbackUsed: result.provider !== inferredProvider, apiKeySource: ["gemini", "anthropic"].includes(inferredProvider) && !apiKey && !customApiKey ? "server-secret" : "user-supplied-runtime-key" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "AI request failed" });
    }
  });

  app.post("/api/analyze-strategy", async (req, res) => {
    try {
      const { provider, customApiKey: apiKey, fallbackProviders = [], apiKeys = {}, model, symbol, strategy, currentPrice, timeframe, customPrompt } = req.body || {};
      const inferredProvider = provider || (String(model).includes("openrouter") ? "openrouter" : String(model).includes("groq") ? "groq" : String(model).includes("claude") || String(model).includes("anthropic") ? "anthropic" : String(model).includes("deepseek") ? "deepseek" : String(model).includes("nvidia") || String(model).includes("nemotron") ? "nvidia" : String(model).includes("gpt") || String(model).includes("chatgpt") ? "openai" : "gemini");
      const chartContext = await fetchLiveChartContext(String(symbol || ""));
      const prompt = `Analyze ${symbol} using the selected chart and live market context below. Current UI price: ${currentPrice}. Strategy: ${strategy || "technical analysis"}. Timeframe: ${timeframe || "1h"}. User instruction: ${customPrompt || "Return a balanced market analysis."}

LIVE CHART CONTEXT (do not invent values): ${JSON.stringify(chartContext)}

Return strict JSON with recommendation (BUY or SELL), confidence (0-100), entryPrice, stopLoss, takeProfit, rationale, indicators, and warning. Base the direction on live price versus SMA20, SMA50, EMA20, recent change, and volatility. If context is incomplete or conflicting, choose the more defensible BUY or SELL direction and clearly state the data limitation in warning. Never guarantee profit.`;
      const primaryKey = apiKey || (inferredProvider === "gemini" ? process.env.USER_GEMINI_API_KEY || "" : inferredProvider === "anthropic" ? ENV.anthropicApiKey : "");
      const result = await callWithProviderFallback(inferredProvider, primaryKey, [...fallbackProviders, "platform"], { ...apiKeys, platform: "internal" }, [{ role: "system", content: "You are a careful market analysis assistant. Never claim certainty or guarantee returns. Return valid JSON only." }, { role: "user", content: prompt }], (provider, key, messages) => provider === "platform" ? callPlatformAI(messages) : callUserSuppliedAI(provider, key, messages));
      const raw = result.text;
      let report: any;
      report = parseStructuredAiJson(raw) || { recommendation: "BUY", confidence: 0, entryPrice: currentPrice, stopLoss: currentPrice, takeProfit: currentPrice, rationale: raw, indicators: [], warning: "The model did not return structured JSON; review the analysis carefully." };
      const signal = normalizeSignalPayload(report, safeNumber(chartContext.live?.price, safeNumber(currentPrice)), raw);
      res.json({ ...report, ...signal, symbol, strategy, modelUsed: result.provider, attemptedProviders: result.attemptedProviders, fallbackUsed: result.provider !== inferredProvider, isLiveAI: true, apiKeySource: ["gemini", "anthropic"].includes(inferredProvider) && !apiKey ? "server-secret" : "user-supplied-runtime-key", chartContext: { symbol: chartContext.symbol, yahooSymbol: chartContext.yahooSymbol, historical: chartContext.historical } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Strategy analysis failed" });
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    if (process.env.NODE_ENV === "production") {
      const worker = createSingleFlightPoller({
        intervalMs: 15_000,
        run: async () => {
          const result = await runEnabledAutoSignalMonitors({
            listSettings: listEnabledAutoSignalSettings,
            fetchPrices: fetchAutoSignalMarketPrices,
            runMonitor: (settings, fetchPrices) => runConfiguredAutoSignalMonitor(settings, fetchPrices),
            onMonitorError: (settings, error) => console.error(`[AutoSignal] continuous monitor failed for user ${settings.userId}`, error instanceof Error ? error.message : error),
          });
          if (result.failures) console.warn(`[AutoSignal] continuous monitor cycle completed with ${result.failures} failure(s)`);
        },
        onError: (error) => console.error("[AutoSignal] continuous worker failed", error instanceof Error ? error.message : error),
      });
      worker.start();
      console.log("[AutoSignal] continuous 15-second monitoring worker started");
    }
  });
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) startServer().catch(console.error);
