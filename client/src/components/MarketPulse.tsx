import React, { useState, useEffect, useMemo } from 'react';
import { MarketTicker } from '../types';
import { formatPrice, formatChange } from '../data/markets';
import { useCurrency } from '../context/CurrencyContext';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Clock, 
  BarChart2, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  PieChart,
  Download
} from 'lucide-react';

interface MarketPulseProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRefreshTickers?: () => void;
}

export default function MarketPulse({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  onRefreshTickers
}: MarketPulseProps) {
  const { formatVal } = useCurrency();
  const [pulseCategory, setPulseCategory] = useState<'all' | 'crypto' | 'forex' | 'stocks' | 'oils'>('all');
  const [pulseTab, setPulseTab] = useState<'active' | 'gainers' | 'losers'>('active');
  const [countdown, setCountdown] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastPulseTime, setLastPulseTime] = useState<string>('');

  // Local state for tickers to allow micro-fluctuations every 60s
  const [localTickers, setLocalTickers] = useState<MarketTicker[]>(tickers);
  const [tickerFlashes, setTickerFlashes] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    setLocalTickers(tickers);
  }, [tickers]);

  useEffect(() => {
    setLastPulseTime(new Date().toLocaleTimeString());
  }, []);

  // 60-Second Auto Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerPulseUpdate();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [localTickers]);

  const triggerPulseUpdate = () => {
    setIsRefreshing(true);

    if (onRefreshTickers) {
      onRefreshTickers();
    }

    // Apply realistic micro-ticks to local tickers to reflect live market movement
    setLocalTickers((prevTickers) => {
      const newFlashes: Record<string, 'up' | 'down'> = {};
      const updated = prevTickers.map((t) => {
        // Random small shift between -0.3% and +0.3%
        const deltaPct = (Math.random() - 0.49) * 0.6;
        const oldPrice = t.price;
        const newPrice = Math.max(0.0001, oldPrice * (1 + deltaPct / 100));
        const priceDiff = newPrice - oldPrice;
        const newChange = t.change + priceDiff;
        const newChangePct = Number((t.changePercent + deltaPct).toFixed(2));

        if (priceDiff > 0) newFlashes[t.symbol] = 'up';
        else if (priceDiff < 0) newFlashes[t.symbol] = 'down';

        return {
          ...t,
          price: Number(newPrice.toFixed(t.category === 'forex' ? 4 : 2)),
          change: Number(newChange.toFixed(t.category === 'forex' ? 4 : 2)),
          changePercent: newChangePct,
          high: Math.max(t.high, newPrice),
          low: Math.min(t.low, newPrice)
        };
      });

      setTickerFlashes(newFlashes);
      setTimeout(() => setTickerFlashes({}), 2000); // Clear flash highlight after 2s
      return updated;
    });

    setLastPulseTime(new Date().toLocaleTimeString());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Export current pulse list as CSV
  const exportPulseToCSV = () => {
    const headers = ['Symbol', 'Name', 'Category', 'Price', '24h Change', '24h Change %', '24h High', '24h Low'];
    const exportList = currentDisplayList;

    const rows = exportList.map((t) => [
      `"${t.symbol}"`,
      `"${t.name}"`,
      `"${t.category}"`,
      t.price,
      t.change,
      `${t.changePercent}%`,
      t.high,
      t.low
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `market_pulse_${pulseTab}_${pulseCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter tickers by category
  const categoryFiltered = useMemo(() => {
    if (pulseCategory === 'all') return localTickers;
    return localTickers.filter((t) => t.category === pulseCategory);
  }, [localTickers, pulseCategory]);

  // Compute Active / Gainers / Losers lists
  const sortedActive = useMemo(() => {
    // Sort by volume intensity / price range magnitude
    return [...categoryFiltered].sort((a, b) => {
      const rangeA = (a.high - a.low) / (a.price || 1);
      const rangeB = (b.high - b.low) / (b.price || 1);
      return rangeB - rangeA;
    });
  }, [categoryFiltered]);

  const sortedGainers = useMemo(() => {
    return [...categoryFiltered].sort((a, b) => b.changePercent - a.changePercent);
  }, [categoryFiltered]);

  const sortedLosers = useMemo(() => {
    return [...categoryFiltered].sort((a, b) => a.changePercent - b.changePercent);
  }, [categoryFiltered]);

  const currentDisplayList = useMemo(() => {
    if (pulseTab === 'gainers') return sortedGainers;
    if (pulseTab === 'losers') return sortedLosers;
    return sortedActive;
  }, [pulseTab, sortedActive, sortedGainers, sortedLosers]);

  // Overall Market Breadth Statistics
  const marketBreadth = useMemo(() => {
    const gainersCount = localTickers.filter((t) => t.changePercent > 0).length;
    const losersCount = localTickers.filter((t) => t.changePercent < 0).length;
    const neutralCount = localTickers.length - gainersCount - losersCount;
    const bullishRatio = Math.round((gainersCount / (localTickers.length || 1)) * 100);

    return {
      gainersCount,
      losersCount,
      neutralCount,
      bullishRatio
    };
  }, [localTickers]);

  return (
    <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden" id="market-pulse-panel">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* 1. TOP HEADER & TIMER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>Real-Time Market Pulse</span>
              </h3>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Auto 60s
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live gainers, losers &amp; market activity pulse • Updated {lastPulseTime || 'Just now'}
            </p>
          </div>
        </div>

        {/* 60s Countdown Ring / Timer Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Pulse In:</span>
            <span className="text-amber-400 font-black w-6 text-right">{countdown}s</span>
          </div>

          <button
            onClick={triggerPulseUpdate}
            disabled={isRefreshing}
            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Refresh Market Pulse Now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportPulseToCSV}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold shadow-sm"
            title="Export Current Gainers/Losers/Active Snapshot to CSV"
            id="market-pulse-export-csv-btn"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 60-Second Auto Progress Bar */}
      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-850 -mt-2">
        <div 
          className="bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${(countdown / 60) * 100}%` }}
        />
      </div>

      {/* 2. MARKET BREADTH SENTIMENT BANNER */}
      <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        {/* Sentiment Gauge */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <PieChart className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400 font-bold text-[11px] uppercase">Market Sentiment:</span>
          </div>
          <div className="flex items-center gap-2 font-black">
            <span className={marketBreadth.bullishRatio >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
              {marketBreadth.bullishRatio >= 50 ? '🐂 BULLISH' : '🐻 BEARISH'} ({marketBreadth.bullishRatio}%)
            </span>
          </div>
        </div>

        {/* Ratio Stats */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <TrendingUp className="h-3 w-3" /> {marketBreadth.gainersCount} Gainers
          </span>
          <span className="text-rose-400 font-extrabold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <TrendingDown className="h-3 w-3" /> {marketBreadth.losersCount} Losers
          </span>
        </div>
      </div>

      {/* 3. TABS SWITCHER: MOST ACTIVE / GAINERS / LOSERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-2xl border border-slate-850 w-full sm:w-auto font-mono text-xs">
          <button
            onClick={() => setPulseTab('active')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pulseTab === 'active'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Most Active</span>
          </button>

          <button
            onClick={() => setPulseTab('gainers')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pulseTab === 'gainers'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Top Gainers</span>
          </button>

          <button
            onClick={() => setPulseTab('losers')}
            className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pulseTab === 'losers'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Top Losers</span>
          </button>
        </div>

        {/* Category Filters Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'forex', label: 'Forex' },
            { id: 'stocks', label: 'Stocks' },
            { id: 'oils', label: 'Oils' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setPulseCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                pulseCategory === cat.id
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MARKET PULSE TICKERS LIST */}
      <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
        {currentDisplayList.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs font-mono">
            No active markets in selected category.
          </div>
        ) : (
          currentDisplayList.map((ticker, index) => {
            const isSelected = selectedSymbol === ticker.symbol;
            const isPositive = ticker.changePercent >= 0;
            const flashState = tickerFlashes[ticker.symbol];

            // Calculate current price position within 24h High/Low range
            const range = ticker.high - ticker.low || 1;
            const posPercent = Math.min(100, Math.max(0, ((ticker.price - ticker.low) / range) * 100));

            return (
              <div
                key={ticker.symbol}
                onClick={() => onSelectSymbol(ticker.symbol)}
                className={`group flex flex-col p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  flashState === 'up' ? 'bg-emerald-950/40 border-emerald-500/50 scale-[1.01]' :
                  flashState === 'down' ? 'bg-rose-950/40 border-rose-500/50 scale-[1.01]' :
                  isSelected
                    ? 'bg-slate-850 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Rank & Symbol Info */}
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-[10px] font-mono font-black flex items-center justify-center ${
                      index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      index === 1 ? 'bg-slate-700 text-slate-200' :
                      index === 2 ? 'bg-amber-800/30 text-amber-300' :
                      'bg-slate-900 text-slate-500'
                    }`}>
                      #{index + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white group-hover:text-amber-400 transition-colors font-mono">
                          {(typeof ticker?.symbol === 'string' ? ticker.symbol : String(ticker?.symbol || '')).split(':').pop()}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-400 border border-slate-850">
                          {ticker.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[130px] sm:max-w-[180px]">
                        {ticker.name}
                      </span>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right font-mono">
                    <div className="text-xs font-black text-white flex items-center justify-end gap-1">
                      <span>{formatVal(ticker.price, ticker.category)}</span>
                      {flashState === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400 animate-bounce" />}
                      {flashState === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-400 animate-bounce" />}
                    </div>

                    <div className={`text-[10px] font-extrabold flex items-center justify-end gap-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* 24h High/Low Mini Visualizer Bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between gap-2 text-[9px] font-mono text-slate-500">
                  <span>L: {formatVal(ticker.low, ticker.category)}</span>

                  <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${posPercent}%` }}
                    />
                  </div>

                  <span>H: {formatVal(ticker.high, ticker.category)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
