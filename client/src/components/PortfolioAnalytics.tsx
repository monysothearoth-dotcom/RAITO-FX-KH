import React, { useState, useMemo } from 'react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  PieChart, 
  BarChart3, 
  Star, 
  Coins, 
  Globe, 
  Building2, 
  Droplet, 
  ShieldAlert, 
  Sparkles, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Plus, 
  RotateCcw 
} from 'lucide-react';
import { MarketTicker } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface PortfolioAnalyticsProps {
  tickers: MarketTicker[];
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

// Category palette mapping for consistent visual hierarchy
const CATEGORY_COLORS: Record<string, string> = {
  crypto: '#f59e0b',  // Amber
  forex: '#3b82f6',   // Blue
  stocks: '#10b981',  // Emerald
  oils: '#8b5cf6',    // Purple
};

const ASSET_SLICE_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308'  // Yellow
];

export default function PortfolioAnalytics({
  tickers,
  watchlistSymbols,
  onToggleWatchlist,
  onSelectSymbol
}: PortfolioAnalyticsProps) {
  const { formatVal, currencyInfo } = useCurrency();
  const [allocationType, setAllocationType] = useState<'asset' | 'category'>('asset');
  const [weightingMode, setWeightingMode] = useState<'equal' | 'price' | 'custom'>('equal');
  const [portfolioBalance, setPortfolioBalance] = useState<number>(25000);
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  // Resolve active watchlist items from tickers list
  const watchlistTickers = useMemo(() => {
    const list = tickers.filter(t => watchlistSymbols.includes(t.symbol));
    // If watchlist is empty, fall back to top default assets so pie chart always shows rich visualization!
    if (list.length === 0) {
      return tickers.slice(0, 6);
    }
    return list;
  }, [tickers, watchlistSymbols]);

  // Handle custom quantity edit
  const handleQuantityChange = (symbol: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomQuantities(prev => ({
      ...prev,
      [symbol]: num
    }));
  };

  // Reset custom weights
  const handleResetQuantities = () => {
    setCustomQuantities({});
  };

  // Calculate Asset Weights and Allocation Values
  const assetAllocations = useMemo(() => {
    if (watchlistTickers.length === 0) return [];

    let totalWeightScore = 0;
    
    // First pass: Calculate weight factors
    const items = watchlistTickers.map((ticker, idx) => {
      let weight = 1;
      if (weightingMode === 'price') {
        weight = Math.log10(ticker.price + 1) + 1; // Log scale to avoid single heavy stocks dominating
      } else if (weightingMode === 'custom') {
        weight = customQuantities[ticker.symbol] !== undefined ? customQuantities[ticker.symbol] : 1;
      } else {
        weight = 1; // Equal weight
      }
      totalWeightScore += weight;

      return {
        symbol: ticker?.symbol || '',
        cleanSymbol: (() => {
          const s = typeof ticker?.symbol === 'string' ? ticker.symbol : String(ticker?.symbol || '');
          return s.includes(':') ? s.split(':')[1] : s;
        })(),
        name: ticker.name,
        category: ticker.category,
        price: ticker.price,
        changePercent: ticker.changePercent,
        rawWeight: weight,
        color: ASSET_SLICE_COLORS[idx % ASSET_SLICE_COLORS.length]
      };
    });

    if (totalWeightScore === 0) totalWeightScore = 1;

    // Second pass: Compute exact percentage & allocated $ amount
    return items.map(item => {
      const percentage = (item.rawWeight / totalWeightScore) * 100;
      const allocatedValue = (portfolioBalance * percentage) / 100;
      return {
        ...item,
        percentage: Number(percentage.toFixed(1)),
        allocatedValue: Number(allocatedValue.toFixed(2))
      };
    });
  }, [watchlistTickers, weightingMode, portfolioBalance, customQuantities]);

  // Aggregate Category Allocation (Crypto, Forex, Stocks, Oils)
  const categoryAllocations = useMemo(() => {
    const groups: Record<string, { name: string; value: number; count: number; color: string; tickers: string[] }> = {};

    assetAllocations.forEach(item => {
      const cat = item.category || 'other';
      if (!groups[cat]) {
        groups[cat] = {
          name: cat.toUpperCase(),
          value: 0,
          count: 0,
          color: CATEGORY_COLORS[cat] || '#64748b',
          tickers: []
        };
      }
      groups[cat].value += item.allocatedValue;
      groups[cat].count += 1;
      groups[cat].tickers.push(item.cleanSymbol);
    });

    return Object.entries(groups).map(([catKey, data]) => {
      const percentage = (data.value / portfolioBalance) * 100;
      return {
        categoryKey: catKey,
        name: data.name,
        value: Number(data.value.toFixed(2)),
        percentage: Number(percentage.toFixed(1)),
        count: data.count,
        color: data.color,
        tickersStr: data.tickers.join(', ')
      };
    });
  }, [assetAllocations, portfolioBalance]);

  // Calculate Portfolio Performance Metrics & Diversification Score
  const metrics = useMemo(() => {
    if (assetAllocations.length === 0) {
      return { weightedPl: 0, weightedPlPercent: 0, divScore: 0, divLabel: 'N/A' };
    }

    let totalWeightedPlDollar = 0;
    let sumWeights = 0;

    assetAllocations.forEach(a => {
      const plDollar = (a.allocatedValue * a.changePercent) / 100;
      totalWeightedPlDollar += plDollar;
      sumWeights += a.percentage;
    });

    const weightedPlPercent = sumWeights > 0 ? (totalWeightedPlDollar / portfolioBalance) * 100 : 0;

    // Herfindahl-Hirschman Index (HHI) for market concentration
    const hhi = assetAllocations.reduce((sum, a) => sum + Math.pow(a.percentage, 2), 0);
    // HHI range: 10000 / N (equal) to 10000 (single asset)
    // Convert to a 0 - 100 diversification score
    const numAssets = assetAllocations.length;
    const minHhi = 10000 / Math.max(numAssets, 1);
    const divScore = Math.min(100, Math.max(10, Math.round(100 - ((hhi - minHhi) / (10000 - minHhi || 1)) * 90)));

    let divLabel = 'Well Balanced';
    if (divScore > 80) divLabel = 'Highly Diversified';
    else if (divScore < 45) divLabel = 'High Asset Concentration';

    return {
      weightedPlDollar: Number(totalWeightedPlDollar.toFixed(2)),
      weightedPlPercent: Number(weightedPlPercent.toFixed(2)),
      divScore,
      divLabel
    };
  }, [assetAllocations, portfolioBalance]);

  // Pie chart active dataset based on toggle
  const pieData = allocationType === 'asset'
    ? assetAllocations.map(a => ({
        name: a.cleanSymbol,
        value: a.allocatedValue,
        percentage: a.percentage,
        color: a.color,
        category: a.category,
        subtext: a.name
      }))
    : categoryAllocations.map(c => ({
        name: c.name,
        value: c.value,
        percentage: c.percentage,
        color: c.color,
        category: c.categoryKey,
        subtext: `${c.count} asset(s) (${c.tickersStr})`
      }));

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl font-mono flex flex-col gap-1 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-xs font-black text-white">{data.name}</span>
            <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
              {data.category}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{data.subtext}</div>
          <div className="border-t border-slate-800 my-1 pt-1 flex justify-between gap-4 text-xs font-bold">
            <span className="text-slate-400">Allocation Weight:</span>
            <span className="text-amber-400">{data.percentage}%</span>
          </div>
          <div className="flex justify-between gap-4 text-xs font-bold">
            <span className="text-slate-400">Nominal Value:</span>
            <span className="text-emerald-400">{formatVal(data.value, 'default')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col gap-6 relative overflow-hidden shadow-2xl" id="portfolio-analytics-card">
      {/* Visual background ambient lighting */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-md">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                Portfolio Asset Allocation
              </h3>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                Watchlist Insights
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live quantitative distribution pie chart &amp; concentration risk metrics
            </p>
          </div>
        </div>

        {/* Portfolio Balance Input */}
        <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 p-1.5 rounded-2xl">
          <span className="text-[10px] font-black uppercase text-slate-400 pl-2 font-mono flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-400" /> Total ({currencyInfo.code})
          </span>
          <input 
            type="number" 
            value={portfolioBalance} 
            onChange={(e) => setPortfolioBalance(Math.max(100, parseFloat(e.target.value) || 0))}
            className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Control Switcher Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Slice Group Switcher */}
        <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-2xl border border-slate-850">
          <span className="text-[10px] font-black uppercase text-slate-400 font-mono flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-amber-500" /> Group By
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setAllocationType('asset')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                allocationType === 'asset'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              By Asset ({assetAllocations.length})
            </button>
            <button
              onClick={() => setAllocationType('category')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                allocationType === 'category'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              By Category ({categoryAllocations.length})
            </button>
          </div>
        </div>

        {/* Weighting Strategy Switcher */}
        <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-2xl border border-slate-850">
          <span className="text-[10px] font-black uppercase text-slate-400 font-mono flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Weighting Model
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setWeightingMode('equal')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                weightingMode === 'equal'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Equal Weight
            </button>
            <button
              onClick={() => setWeightingMode('price')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                weightingMode === 'price'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Asset Price
            </button>
            <button
              onClick={() => setWeightingMode('custom')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                weightingMode === 'custom'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Top Portfolio Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Portfolio Balance */}
        <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-850 flex flex-col gap-1">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated Total Value</span>
          <div className="text-xl font-mono font-black text-emerald-400">
            ${portfolioBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Watchlist Allocation Basis</span>
        </div>

        {/* 24h Weighted P/L Projection */}
        <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-850 flex flex-col gap-1">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">24h Weighted Return</span>
          <div className={`text-xl font-mono font-black flex items-center gap-1 ${metrics.weightedPlPercent >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {metrics.weightedPlPercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {metrics.weightedPlPercent >= 0 ? '+' : ''}{metrics.weightedPlPercent}%
          </div>
          <span className={`text-[9px] font-mono font-bold ${(metrics.weightedPlDollar ?? 0) >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
            {(metrics.weightedPlDollar ?? 0) >= 0 ? '+' : ''}${(metrics.weightedPlDollar ?? 0).toLocaleString()} est. 24h P/L
          </span>
        </div>

        {/* Diversification Score */}
        <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-850 flex flex-col gap-1">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Diversification Index</span>
          <div className="text-xl font-mono font-black text-amber-400 flex items-center gap-1.5">
            <span>{metrics.divScore}</span>
            <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
          </div>
          <span className="text-[9px] text-amber-400/90 font-mono font-bold">{metrics.divLabel}</span>
        </div>

        {/* Total Assets Included */}
        <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-850 flex flex-col gap-1">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Watchlist Assets</span>
          <div className="text-xl font-mono font-black text-white flex items-center gap-1.5">
            <span>{assetAllocations.length}</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">{categoryAllocations.length} Category Sectors</span>
        </div>
      </div>

      {/* Main Grid: Recharts Pie Chart Visual + Allocation Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Recharts Pie Chart Component */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-850 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] relative">
          <div className="w-full h-[280px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#020617"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Inner Ring Center Metrics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-extrabold uppercase font-mono text-slate-400 tracking-wider">Portfolio</span>
              <span className="text-base font-mono font-black text-white">100%</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">{pieData.length} Slices</span>
            </div>
          </div>

          {/* Quick Legend Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full max-h-[80px] overflow-y-auto custom-scrollbar">
            {pieData.map((slice) => (
              <div 
                key={slice.name} 
                className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="font-bold text-slate-200">{slice.name}</span>
                <span className="text-amber-400 font-extrabold">{slice.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Asset Allocation Breakdown Table & Bar Visualizer */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
              {allocationType === 'asset' ? 'Individual Asset Weights' : 'Sector Category Distribution'}
            </span>
            {weightingMode === 'custom' && (
              <button
                onClick={handleResetQuantities}
                className="text-[9px] font-mono text-slate-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset Custom Weights
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[310px] overflow-y-auto pr-1 custom-scrollbar">
            {allocationType === 'asset' ? (
              assetAllocations.map((item) => (
                <div 
                  key={item.symbol}
                  onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
                  className="bg-slate-950/60 hover:bg-slate-850/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5 font-mono">
                          {item.cleanSymbol}
                          <span className="text-[8px] text-slate-500 font-sans font-normal">({item.category})</span>
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-1">{item.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Optional Custom Weight Input */}
                      {weightingMode === 'custom' && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[8px] text-slate-500 uppercase font-mono">Units:</span>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={customQuantities[item.symbol] !== undefined ? customQuantities[item.symbol] : 1}
                            onChange={(e) => handleQuantityChange(item.symbol, e.target.value)}
                            className="w-14 bg-slate-900 border border-slate-800 text-xs text-white text-center font-mono rounded px-1 py-0.5 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="text-right font-mono">
                        <div className="text-xs font-extrabold text-amber-400">${item.allocatedValue.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-400 font-bold">{item.percentage}% share</div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${Math.max(item.percentage, 2)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              categoryAllocations.map((cat) => (
                <div 
                  key={cat.categoryKey}
                  className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <div>
                        <span className="text-xs font-black text-white font-mono uppercase">{cat.name} SECTOR</span>
                        <div className="text-[9px] text-slate-400">{cat.count} Asset(s): {cat.tickersStr}</div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs font-black text-amber-400">${cat.value.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{cat.percentage}% allocation</div>
                    </div>
                  </div>

                  {/* Category Progress Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Watchlist Quick Selection Strip */}
      <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Toggle Asset Inclusion in Allocation
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {watchlistSymbols.length} active starred asset(s)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tickers.map((ticker) => {
            const sym = typeof ticker?.symbol === 'string' ? ticker.symbol : String(ticker?.symbol || '');
            const isWatchlisted = watchlistSymbols.includes(sym);
            const clean = sym.includes(':') ? sym.split(':')[1] : sym;
            return (
              <button
                key={ticker.symbol}
                onClick={() => onToggleWatchlist(ticker.symbol)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isWatchlisted
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-950 text-slate-500 border border-slate-850 hover:text-slate-300'
                }`}
              >
                <Star className={`h-3 w-3 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                <span>{clean}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
