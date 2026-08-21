function safeNumber(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export type SignalPayload = {
  recommendation: "BUY" | "SELL";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rationale: string;
  warning: string;
};

export function normalizeSignalPayload(input: unknown, fallbackPrice: number, fallbackRationale: string): SignalPayload {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const rawRecommendation = String(value.recommendation || "").toUpperCase();
  const context = `${JSON.stringify(value)} ${fallbackRationale}`.toLowerCase();
  const recommendation: SignalPayload["recommendation"] = rawRecommendation === "SELL" || (rawRecommendation !== "BUY" && /(bearish|downtrend|short|sell|resistance|negative)/.test(context)) ? "SELL" : "BUY";
  const rawConfidence = safeNumber(value.confidence, 0);
  const confidence = rawConfidence > 0 && rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  return {
    recommendation,
    confidence: Math.max(0, Math.min(100, confidence)),
    entryPrice: safeNumber(value.entryPrice, fallbackPrice),
    stopLoss: safeNumber(value.stopLoss, fallbackPrice),
    takeProfit: safeNumber(value.takeProfit, fallbackPrice),
    rationale: String(value.rationale || fallbackRationale),
    warning: String(value.warning || "Market analysis is probabilistic; use position sizing and independent risk controls."),
  };
}
