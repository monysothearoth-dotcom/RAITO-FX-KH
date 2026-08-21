export type HistoricalPoint = { timestamp: number; close: number };

export function classifyNewsSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const value = text.toLowerCase();
  const positive = ['surge', 'rally', 'gain', 'beat', 'growth', 'upgrade', 'bullish', 'record', 'rise', 'strong'];
  const negative = ['fall', 'drop', 'loss', 'miss', 'downgrade', 'bearish', 'risk', 'weak', 'slump', 'cut'];
  const positiveScore = positive.filter((word) => value.includes(word)).length;
  const negativeScore = negative.filter((word) => value.includes(word)).length;
  return positiveScore > negativeScore ? 'positive' : negativeScore > positiveScore ? 'negative' : 'neutral';
}

export function classifyNewsImpact(text: string): 'high' | 'medium' | 'low' {
  const value = text.toLowerCase();
  if (['fed', 'fomc', 'cpi', 'jobs report', 'earnings', 'bankruptcy', 'acquisition', 'guidance'].some((word) => value.includes(word))) return 'high';
  if (['forecast', 'target', 'revenue', 'profit', 'dividend', 'launch'].some((word) => value.includes(word))) return 'medium';
  return 'low';
}

export function normalizeHistoricalSeries(timestamps: unknown, closes: unknown): HistoricalPoint[] {
  const times = Array.isArray(timestamps) ? timestamps : [];
  const values = Array.isArray(closes) ? closes : [];
  return times.map((timestamp, index) => ({
    timestamp: Number(timestamp),
    close: values[index] == null ? Number.NaN : Number(values[index]),
  })).filter(point => Number.isFinite(point.timestamp) && Number.isFinite(point.close));
}

export function simpleMovingAverage(values: number[], period: number): number {
  const slice = values.slice(-period);
  return slice.length ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0;
}

export function exponentialMovingAverage(values: number[], period: number): number {
  if (!values.length) return 0;
  const alpha = 2 / (period + 1);
  return values.reduce((ema, value, index) => index === 0 ? value : alpha * value + (1 - alpha) * ema, values[0]);
}

export function summarizePriceSeries(series: HistoricalPoint[]) {
  const closes = series.map((point) => point.close);
  const last = closes.at(-1) || 0;
  const previous = closes.at(-2) || last;
  const sma20 = simpleMovingAverage(closes, 20);
  const sma50 = simpleMovingAverage(closes, 50);
  const ema20 = exponentialMovingAverage(closes, 20);
  const returns = closes.slice(1).map((value, index) => previous && closes[index] ? (value - closes[index]) / closes[index] : 0);
  const mean = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
  const variance = returns.length ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length : 0;
  return {
    sampleSize: closes.length,
    last,
    previous,
    changePercent: previous ? ((last - previous) / previous) * 100 : 0,
    sma20,
    sma50,
    ema20,
    volatilityPercent: Math.sqrt(variance) * 100,
    trend: last > sma20 && sma20 >= sma50 ? 'bullish' : last < sma20 && sma20 <= sma50 ? 'bearish' : 'mixed',
  } as const;
}
