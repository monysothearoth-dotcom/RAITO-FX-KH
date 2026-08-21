import { useEffect, useState, useRef } from 'react';
import { MarketTicker } from '../types';
import { formatPrice, formatChange } from '../data/markets';
import { useCurrency } from '../context/CurrencyContext';
import { TrendingUp, TrendingDown, Clock, Activity, Award, Radio } from 'lucide-react';

interface TickerHeaderProps {
  ticker: MarketTicker;
  isLoading?: boolean;
  currentSource?: string;
  wsConnected?: boolean;
  wsSyncStatus?: 'SYNCED' | 'LAGGING' | 'DISCONNECTED';
  wsLatency?: number;
}

export default function TickerHeader({ 
  ticker, 
  isLoading = false, 
  currentSource,
  wsConnected = true,
  wsSyncStatus = 'SYNCED',
  wsLatency = 14
}: TickerHeaderProps) {
  const { formatVal, convertVal } = useCurrency();
  const [prevPrice, setPrevPrice] = useState(ticker.price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ticker.price > prevPrice) {
      setFlash('up');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlash(null), 600);
    } else if (ticker.price < prevPrice) {
      setFlash('down');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlash(null), 600);
    }
    setPrevPrice(ticker.price);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ticker.price, prevPrice]);

  const isPositive = ticker.changePercent >= 0;

  // Set up the dynamic flash styling classes
  const flashClass = flash === 'up'
    ? 'text-emerald-400 scale-[1.01] transition-all bg-emerald-500/10 rounded-lg px-2 -mx-2'
    : flash === 'down'
    ? 'text-rose-400 scale-[1.01] transition-all bg-rose-500/10 rounded-lg px-2 -mx-2'
    : 'text-slate-100 px-2 -mx-2 transition-all';

  // Render sleek animated skeleton loaders if initially fetching or loading
  if (isLoading) {
    return (
      <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-900/60 shadow-xl p-5 md:p-6" id="ticker-header-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left Side: Symbol Icon, Name and Price Skeleton */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 w-14 h-14 flex items-center justify-center shrink-0">
              <div className="h-6 w-10 skeleton-shimmer rounded-md" />
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-6 w-44 sm:w-56 skeleton-shimmer rounded-lg" />
                <div className="h-4.5 w-24 skeleton-shimmer rounded-md" />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 md:h-9 w-36 sm:w-48 skeleton-shimmer rounded-lg" />
                <div className="h-5 w-28 skeleton-shimmer rounded-md" />
              </div>
            </div>
          </div>

          {/* Right Side: Key Market Metrics Grid Skeletons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-slate-900/80 pt-4 md:pt-0 md:pl-8">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-14 skeleton-shimmer rounded" />
              <div className="h-4 w-20 skeleton-shimmer rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-14 skeleton-shimmer rounded" />
              <div className="h-4 w-20 skeleton-shimmer rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-16 skeleton-shimmer rounded" />
              <div className="h-4 w-22 skeleton-shimmer rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-20 skeleton-shimmer rounded" />
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <div className="h-3.5 w-20 skeleton-shimmer rounded" />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-900/60 shadow-xl p-5 md:p-6" id="ticker-header-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Symbol, Name and Price */}
        <div className="flex items-start md:items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="font-mono text-lg font-black text-emerald-500 tracking-wider">
              {(typeof ticker?.symbol === 'string' ? ticker.symbol : String(ticker?.symbol || '')).split(':').pop()?.substring(0, 4)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight font-sans">{ticker.name}</h1>
              <span className="font-mono text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {ticker.symbol}
              </span>
              {currentSource && (
                <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                  {currentSource}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`font-mono text-2xl md:text-3xl font-bold tracking-tight ${flashClass}`}>
                {formatVal(ticker.price, ticker.category)}
              </span>
              <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{formatChange(convertVal(ticker.change), ticker.category)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)</span>
              </div>

              {/* WebSocket Live Sync Status Indicator */}
              <div className="flex items-center" id="ws-sync-status-indicator">
                {wsConnected && wsSyncStatus === 'SYNCED' ? (
                  <span className="font-mono text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm animate-pulse" title={`WebSocket Stream Active & Chart Synchronized (${wsLatency}ms)`}>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    WS LIVE &amp; SYNCED
                  </span>
                ) : wsConnected && wsSyncStatus === 'LAGGING' ? (
                  <span className="font-mono text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm animate-pulse" title={`Latency or Sync Delay Detected (${wsLatency}ms)`}>
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    SYNC LAG ({wsLatency}ms)
                  </span>
                ) : (
                  <span className="font-mono text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    RECONNECTING / POLLING
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Key Market Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6 border-t md:border-t-0 md:border-l border-slate-900 pt-4 md:pt-0 md:pl-8">
          <div>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">24h High</p>
            <p className="font-mono text-xs font-semibold text-slate-300 mt-0.5">
              {formatVal(ticker.high, ticker.category)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">24h Low</p>
            <p className="font-mono text-xs font-semibold text-slate-300 mt-0.5">
              {formatVal(ticker.low, ticker.category)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Volume</p>
            <p className="font-mono text-xs font-semibold text-slate-300 mt-0.5">
              {ticker.volume}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Market Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Open</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

