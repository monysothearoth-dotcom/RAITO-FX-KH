export type LivePrice = { price: number; change: number; changePercent: number; high: number; low: number };

type AlphaVantageGlobalQuote = Record<string, unknown>;

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseAlphaVantageGlobalQuote(payload: AlphaVantageGlobalQuote): LivePrice | null {
  const quote = payload["Global Quote"] as Record<string, unknown> | undefined;
  if (!quote) return null;

  const price = asNumber(quote["05. price"]);
  const previousClose = asNumber(quote["08. previous close"]);
  if (price <= 0) return null;

  const change = asNumber(quote["09. change"]) || price - previousClose;
  const changePercentText = String(quote["10. change percent"] ?? "").replace("%", "");
  const changePercent = asNumber(changePercentText) || (previousClose > 0 ? (change / previousClose) * 100 : 0);

  return {
    price,
    change,
    changePercent,
    high: asNumber(quote["03. high"]) || price,
    low: asNumber(quote["04. low"]) || price,
  };
}

export async function fetchAlphaVantageStockQuote(symbol: string, apiKey: string): Promise<LivePrice | null> {
  if (!apiKey) return null;

  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`,
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) return null;

  return parseAlphaVantageGlobalQuote(await response.json() as AlphaVantageGlobalQuote);
}
