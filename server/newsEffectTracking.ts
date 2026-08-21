export type TrackedEffect = "BUY" | "SELL" | "NORMAL";
export type TrackingOutcome = "PENDING" | "CORRECT" | "INCORRECT" | "NEUTRAL" | "UNAVAILABLE";

export function newsEffectFingerprint(input: { title: string; url?: string; symbol: string }): string {
  return `news-effect|${input.title}|${input.url || ""}|${input.symbol}`.toLowerCase().replace(/\s+/g, " ").slice(0, 191);
}

export function classifyActualEffect(movementPercent: number, thresholdPercent = 0.05): TrackedEffect {
  if (!Number.isFinite(movementPercent) || Math.abs(movementPercent) < thresholdPercent) return "NORMAL";
  return movementPercent > 0 ? "BUY" : "SELL";
}

export function comparePredictedEffect(predicted: TrackedEffect, actual: TrackedEffect): Exclude<TrackingOutcome, "PENDING" | "UNAVAILABLE"> {
  if (actual === "NORMAL") return predicted === "NORMAL" ? "CORRECT" : "NEUTRAL";
  return predicted === actual ? "CORRECT" : "INCORRECT";
}

export function movementPercent(baselinePrice: number, currentPrice: number): number {
  if (!Number.isFinite(baselinePrice) || baselinePrice <= 0 || !Number.isFinite(currentPrice)) return Number.NaN;
  return ((currentPrice - baselinePrice) / baselinePrice) * 100;
}

export function trackingSummary(rows: Array<{ outcome: TrackingOutcome }>) {
  const resolved = rows.filter((row) => row.outcome !== "PENDING" && row.outcome !== "UNAVAILABLE");
  const correct = rows.filter((row) => row.outcome === "CORRECT").length;
  const incorrect = rows.filter((row) => row.outcome === "INCORRECT").length;
  const neutral = rows.filter((row) => row.outcome === "NEUTRAL").length;
  return {
    total: rows.length,
    pending: rows.filter((row) => row.outcome === "PENDING").length,
    unavailable: rows.filter((row) => row.outcome === "UNAVAILABLE").length,
    correct,
    incorrect,
    neutral,
    accuracy: resolved.length ? Number(((correct / resolved.length) * 100).toFixed(1)) : 0,
  };
}

export async function fetchTrackingPrice(symbol: string): Promise<number> {
  const clean = symbol.split(":").pop()?.toUpperCase() || symbol.toUpperCase();
  if (clean.endsWith("USDT")) {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(clean)}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Crypto price unavailable (${response.status})`);
    const data = await response.json() as { price?: string };
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Crypto price unavailable");
    return price;
  }
  if (clean === "XAUUSD") {
    const response = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Gold price unavailable (${response.status})`);
    const data = await response.json() as { price?: number };
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Gold price unavailable");
    return price;
  }
  const response = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Forex price unavailable (${response.status})`);
  const data = await response.json() as { rates?: Record<string, number> };
  const rates = data.rates || {};
  const quote = clean.slice(3);
  const base = clean.slice(0, 3);
  const price = base === "USD" ? Number(rates[quote]) : rates[base] ? 1 / Number(rates[base]) : Number.NaN;
  if (!Number.isFinite(price) || price <= 0) throw new Error("Forex price unavailable");
  return price;
}
