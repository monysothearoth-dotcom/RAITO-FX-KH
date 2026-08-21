import { useState } from 'react';
import { MarketTicker, MarketCategory } from '../types';
import { formatPrice, formatChange } from '../data/markets';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Star, Coins, Globe, Building2, Droplet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketListProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  onSelectTicker: (symbol: string) => void;
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
}

function Sparkline({ changePercent }: { changePercent: number }) {
  const isPositive = changePercent >= 0;
  // Generate slightly randomized path nodes for aesthetic variety
  const points = isPositive
    ? '0,18 10,14 20,20 30,10 40,15 50,5 60,12 70,3'
    : '0,5 10,12 20,8 30,18 40,12 50,22 60,16 70,24';
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  
  return (
    <svg className="w-14 h-6 overflow-visible opacity-80" viewBox="0 0 70 25">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function MarketList({
  tickers,
  selectedSymbol,
  onSelectTicker,
  watchlistSymbols,
  onToggleWatchlist,
}: MarketListProps) {
  const [activeTab, setActiveTab] = useState<MarketCategory | 'watchlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { formatVal } = useCurrency();

  const tabs: { id: MarketCategory | 'watchlist'; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Activity },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'forex', label: 'Forex', icon: Globe },
    { id: 'stocks', label: 'Stocks', icon: Building2 },
    { id: 'oils', label: 'Oils/Gas', icon: Droplet },
  ];

  const filteredTickers = tickers.filter((ticker) => {
    // 1. Tab filtering
    if (activeTab === 'watchlist') {
      if (!watchlistSymbols.includes(ticker.symbol)) return false;
    } else if (activeTab !== 'all' && ticker.category !== activeTab) {
      return false;
    }

    // 2. Search query filtering
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      ticker.symbol.toLowerCase().includes(query) ||
      ticker.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full flex flex-col bg-slate-950/90 rounded-2xl border border-slate-900/60 shadow-xl overflow-hidden h-full max-h-[700px] lg:max-h-none" id="market-list-card">
      {/* Header and Search */}
      <div className="p-4 border-b border-slate-900 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Markets</h2>
          <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Live Stream
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickers (e.g. AAPL, BTC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
            id="market-search-input"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900/40 overflow-x-auto no-scrollbar scroll-smooth px-2 py-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-slate-100 border border-slate-800 shadow-md'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
              id={`tab-btn-${tab.id}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive && tab.id === 'watchlist' ? 'text-amber-500 fill-amber-500' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px] lg:h-[450px]">
        {filteredTickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Activity className="h-8 w-8 mb-2 opacity-30 text-slate-400" />
            <p className="text-sm">No assets found</p>
            {activeTab === 'watchlist' && (
              <p className="text-xs text-slate-600 mt-1">Star tickers to add them to your watchlist</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-900/40">
            {filteredTickers.map((ticker) => {
              const isSelected = selectedSymbol === ticker.symbol;
              const isPositive = ticker.changePercent >= 0;
              const isStarred = watchlistSymbols.includes(ticker.symbol);

              return (
                <div
                  key={ticker.symbol}
                  onClick={() => onSelectTicker(ticker.symbol)}
                  className={`flex items-center justify-between p-3.5 hover:bg-slate-900/30 transition-all duration-150 cursor-pointer ${
                    isSelected ? 'bg-slate-900/50 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
                  }`}
                  id={`ticker-row-${ticker.symbol.replace(':', '_')}`}
                >
                  {/* Left Column: Symbol & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(ticker.symbol);
                      }}
                      className="text-slate-600 hover:text-amber-500 transition-colors p-1 rounded-md hover:bg-slate-900"
                      id={`star-${ticker.symbol}`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-200 tracking-wide">
                          {(typeof ticker?.symbol === 'string' ? ticker.symbol : String(ticker?.symbol || '')).split(':').pop()}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded">
                          {ticker.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{ticker.name}</p>
                    </div>
                  </div>

                  {/* Middle Column: Sparkline */}
                  <div className="hidden sm:block px-2">
                    <Sparkline changePercent={ticker.changePercent} />
                  </div>

                  {/* Right Column: Price & Change */}
                  <div className="text-right pl-3">
                    <p className="font-mono text-xs font-semibold text-slate-200 tracking-tight">
                      {formatVal(ticker.price, ticker.category)}
                    </p>
                    <div
                      className={`flex items-center justify-end gap-1 font-mono text-[11px] font-medium mt-0.5 ${
                        isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span>{isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
