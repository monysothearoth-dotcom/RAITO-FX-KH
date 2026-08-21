import { MarketTicker } from '../types';

export const INITIAL_MARKETS: MarketTicker[] = [
  // CRYPTO
  {
    symbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin / US Dollar',
    category: 'crypto',
    price: 102450.00,
    change: 1210.50,
    changePercent: 1.20,
    high: 103120.00,
    low: 101400.00,
    volume: '45.1K BTC',
  },
  {
    symbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum / US Dollar',
    category: 'crypto',
    price: 3482.12,
    change: -14.20,
    changePercent: -0.40,
    high: 3550.00,
    low: 3420.00,
    volume: '215.4K ETH',
  },
  {
    symbol: 'BINANCE:SOLUSDT',
    name: 'Solana / US Dollar',
    category: 'crypto',
    price: 145.22,
    change: 6.25,
    changePercent: 4.50,
    high: 148.50,
    low: 139.10,
    volume: '2.4M SOL',
  },
  {
    symbol: 'BINANCE:BNBUSDT',
    name: 'BNB / US Dollar',
    category: 'crypto',
    price: 585.20,
    change: -1.88,
    changePercent: -0.32,
    high: 594.10,
    low: 579.50,
    volume: '85.6K BNB',
  },
  {
    symbol: 'BINANCE:XRPUSDT',
    name: 'Ripple / US Dollar',
    category: 'crypto',
    price: 0.5840,
    change: -0.0068,
    changePercent: -1.15,
    high: 0.5980,
    low: 0.5790,
    volume: '42.3M XRP',
  },

  // FOREX
  {
    symbol: 'OANDA:EURUSD',
    name: 'EUR / USD',
    category: 'forex',
    price: 1.0824,
    change: -0.0016,
    changePercent: -0.15,
    high: 1.0850,
    low: 1.0810,
    volume: '185.2K',
  },
  {
    symbol: 'OANDA:GBPUSD',
    name: 'GBP / USD',
    category: 'forex',
    price: 1.2674,
    change: -0.0006,
    changePercent: -0.05,
    high: 1.2710,
    low: 1.2652,
    volume: '142.9K',
  },
  {
    symbol: 'OANDA:USDJPY',
    name: 'USD / JPY',
    category: 'forex',
    price: 151.42,
    change: 0.47,
    changePercent: 0.31,
    high: 151.78,
    low: 150.92,
    volume: '204.1K',
  },
  {
    symbol: 'OANDA:AUDUSD',
    name: 'AUD / USD',
    category: 'forex',
    price: 0.6542,
    change: -0.0012,
    changePercent: -0.18,
    high: 0.6580,
    low: 0.6531,
    volume: '98.5K',
  },
  {
    symbol: 'OANDA:USDCAD',
    name: 'USD / CAD',
    category: 'forex',
    price: 1.3567,
    change: 0.0011,
    changePercent: 0.08,
    high: 1.3595,
    low: 1.3540,
    volume: '88.3K',
  },

  // STOCKS
  {
    symbol: 'NASDAQ:AAPL',
    name: 'Apple Inc.',
    category: 'stocks',
    price: 189.43,
    change: 1.50,
    changePercent: 0.80,
    high: 191.10,
    low: 188.05,
    volume: '52.4M',
  },
  {
    symbol: 'NASDAQ:TSLA',
    name: 'Tesla, Inc.',
    category: 'stocks',
    price: 168.47,
    change: -3.70,
    changePercent: -2.15,
    high: 173.15,
    low: 166.80,
    volume: '84.1M',
  },
  {
    symbol: 'NASDAQ:NVDA',
    name: 'NVIDIA Corporation',
    category: 'stocks',
    price: 132.15,
    change: 4.88,
    changePercent: 3.85,
    high: 135.00,
    low: 130.10,
    volume: '168.9M',
  },
  {
    symbol: 'NASDAQ:MSFT',
    name: 'Microsoft Corporation',
    category: 'stocks',
    price: 421.90,
    change: 2.60,
    changePercent: 0.62,
    high: 424.15,
    low: 418.90,
    volume: '22.8M',
  },
  {
    symbol: 'NASDAQ:AMZN',
    name: 'Amazon.com, Inc.',
    category: 'stocks',
    price: 185.07,
    change: 2.05,
    changePercent: 1.12,
    high: 186.40,
    low: 183.12,
    volume: '34.5M',
  },
  {
    symbol: 'NASDAQ:GOOGL',
    name: 'Alphabet Inc.',
    category: 'stocks',
    price: 154.20,
    change: 1.45,
    changePercent: 0.95,
    high: 155.10,
    low: 152.80,
    volume: '26.1M',
  },

  // OILS & COMMODITIES
  {
    symbol: 'TVC:UKOIL',
    name: 'Brent Crude Oil',
    category: 'oils',
    price: 78.12,
    change: 1.83,
    changePercent: 2.40,
    high: 79.50,
    low: 77.20,
    volume: '154.6K',
  },
  {
    symbol: 'TVC:USOIL',
    name: 'WTI Crude Oil',
    category: 'oils',
    price: 74.50,
    change: 1.04,
    changePercent: 1.42,
    high: 75.80,
    low: 73.80,
    volume: '188.2K',
  },
  {
    symbol: 'NYMEX:NG1!',
    name: 'Natural Gas',
    category: 'oils',
    price: 1.785,
    change: -0.038,
    changePercent: -2.12,
    high: 1.835,
    low: 1.760,
    volume: '124.5K',
  },
  {
    symbol: 'OANDA:XAUUSD',
    name: 'Gold / US Dollar',
    category: 'oils',
    price: 4054.50,
    change: 4.50,
    changePercent: 0.11,
    high: 4090.00,
    low: 4045.00,
    volume: '82.4K',
  },
  {
    symbol: 'OANDA:XAGUSD',
    name: 'Silver / US Dollar',
    category: 'oils',
    price: 58.25,
    change: +0.45,
    changePercent: +0.78,
    high: 59.10,
    low: 57.80,
    volume: '44.8K',
  }
];

export function formatPrice(price: number, category: string): string {
  if (category === 'forex') {
    return price.toFixed(4);
  }
  if (price >= 1000) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price < 1) {
    return price.toFixed(4);
  }
  return price.toFixed(2);
}

export function formatChange(change: number, category: string): string {
  const sign = change >= 0 ? '+' : '';
  if (category === 'forex') {
    return `${sign}${change.toFixed(4)}`;
  }
  if (Math.abs(change) < 0.01) {
    return `${sign}${change.toFixed(4)}`;
  }
  return `${sign}${change.toFixed(2)}`;
}
