import type { LivePrice } from "./alphaVantage";

const CRYPTO_ID_BY_SYMBOL: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
  XRPUSDT: "ripple",
};

type CoinGeckoPrices = Record<string, { usd?: number; usd_24h_change?: number; usd_24h_high?: number; usd_24h_low?: number }>;

export function mapCoinGeckoPrices(payload: CoinGeckoPrices): Record<string, LivePrice> {
  return Object.entries(CRYPTO_ID_BY_SYMBOL).reduce<Record<string, LivePrice>>((prices, [symbol, id]) => {
    const quote = payload[id];
    const price = Number(quote?.usd ?? 0);
    if (!Number.isFinite(price) || price <= 0) return prices;
    const changePercent = Number(quote?.usd_24h_change ?? 0);
    prices[`BINANCE:${symbol}`] = {
      price,
      change: price * (changePercent / 100),
      changePercent,
      high: Number(quote?.usd_24h_high ?? price) || price,
      low: Number(quote?.usd_24h_low ?? price) || price,
    };
    return prices;
  }, {});
}

export async function fetchCoinGeckoCryptoPrices(apiKey: string): Promise<Record<string, LivePrice>> {
  if (!apiKey) return {};
  const ids = Object.values(CRYPTO_ID_BY_SYMBOL).join(",");
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true`, {
    headers: { "x-cg-demo-api-key": apiKey },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return {};
  return mapCoinGeckoPrices(await response.json() as CoinGeckoPrices);
}
