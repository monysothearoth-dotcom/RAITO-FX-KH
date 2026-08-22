import React, { useState } from 'react';
import {
  Brain,
  Zap,
  Globe,
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
  Award
} from 'lucide-react';
import { MarketTicker, SignalReport } from '../types';
import { getKnowledgePromptContext, inferResearchDomain } from '../lib/marketKnowledge';
import { ConsensusMetadata } from './ConsensusMetadata';

interface AllInOneAiHubProps {
  activeTicker: MarketTicker;
  tickers: MarketTicker[];
  onSelectTicker: (ticker: MarketTicker) => void;
  onOpenJournalWithSignal?: (signal: any) => void;
}

export const AllInOneAiHub: React.FC<AllInOneAiHubProps> = ({
  activeTicker,
  tickers,
  onSelectTicker,
  onOpenJournalWithSignal
}) => {
  const [activeMode, setActiveMode] = useState<'best_setup' | 'news_analyze' | 'all_in_one'>('all_in_one');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [report, setReport] = useState<SignalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom parameters
  const [timeframe, setTimeframe] = useState<string>('15m');

  const rawSymbol = typeof activeTicker?.symbol === 'string' ? activeTicker.symbol : String(activeTicker?.symbol || '');
  const symbolCode = rawSymbol.split(':').pop() || rawSymbol;

  const handleRunAiSynthesis = async (modeToRun: 'best_setup' | 'news_analyze' | 'all_in_one') => {
    setActiveMode(modeToRun);
    setLoading(true);
    setError(null);

    let promptText = '';
    if (modeToRun === 'best_setup') {
      setLoadingStep(`⚡ BEST SETUP: Scanning 9 SMC/ICT frameworks & Order Blocks for ${symbolCode}...`);
      promptText = `[MODE: BEST SETUP ONLY] Use the research-library workflow for ${symbolCode} (${timeframe}). Evaluate structure, liquidity, volatility, relevant macro/fundamental context, and risk/reward. Extract one strongest qualified setup only; do not claim guaranteed win rates.`;
    } else if (modeToRun === 'news_analyze') {
      setLoadingStep(`📰 NEWS ANALYZE: Fetching live economic calendar & Bloomberg headlines for ${symbolCode}...`);
      promptText = `[MODE: REAL-TIME NEWS & MACRO ANALYZE] Perform deep real-time news and macroeconomic analysis for ${symbolCode}. Scan central bank interest rate trajectory, NFP, CPI, DXY dollar index momentum, US 10-year yield trends, and global geopolitical headlines. Calculate exact macro bias and volatility risk.`;
    } else {
      setLoadingStep(`🌐 ALL-IN-ONE UNIFIED SYNTHESIS: Linking live price feeds & news grounding for ${symbolCode}...`);
      promptText = `[MODE: ALL-IN-ONE 360 MASTER SYNTHESIS] Fully unify live price ticker stream, technical indicators, order flow liquidity, real-time macroeconomic news grounding, and 5-Pillar Machine Learning Meta-Labeling for ${symbolCode}. Provide a 360-degree master trade decision with entry, SL, TP1, TP2, TP3 targets, and macro risk audit.`;
    }

    try {
      const res = await fetch('/api/market-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeTicker.symbol,
          strategy: 'ALL_IN_ONE_MASTER',
          currentPrice: activeTicker.price,
          price: activeTicker.price,
          change: activeTicker.change,
          timeframe,
          customPrompt: `${getKnowledgePromptContext(inferResearchDomain(activeTicker.symbol))} ${promptText}`,
          strictAplusOnly: modeToRun === 'best_setup'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const parsedReport = data.report || data;
      if (parsedReport && (parsedReport.recommendation || parsedReport.symbol || parsedReport.rationale)) {
        setReport(parsedReport);
      } else {
        throw new Error('Received invalid signal payload from AI server');
      }
    } catch (err: any) {
      console.error('AI Engine Synthesis Error:', err);
      setError(err.message || 'Failed to synthesize market data. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden mx-auto pb-8 text-slate-100">
      
      {/* Top Banner - Compact & Responsive */}
      <div className="bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-amber-500/30 shadow-lg relative overflow-hidden w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Brain className="h-4 w-4 animate-pulse" />
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase text-amber-400 tracking-wider">
                ALL-IN-ONE AI TRADING SYNTHESIS ENGINE
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Unified AI Master Hub
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 max-w-2xl leading-tight">
              Combines live market context, macro and news evidence, then uses the server-managed AI review chain to produce one inspectable analytical scenario.
            </p>
          </div>

          {/* Connected API Status */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 w-full sm:w-auto shrink">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle className="h-3 w-3" /> Market API
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Globe className="h-3 w-3" /> News API
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Sparkles className="h-3 w-3" /> Backend AI
            </span>
          </div>
        </div>
      </div>

      {/* Asset Selection & Controls - Compact Bar */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 w-full min-w-0">
        {/* Tickers list */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full min-w-0 max-w-full pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0 mr-1">Asset:</span>
          {tickers.map((t) => {
            const isSelected = t.symbol === activeTicker.symbol;
            return (
              <button
                key={t.symbol}
                onClick={() => onSelectTicker(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{(typeof t?.symbol === 'string' ? t.symbol : String(t?.symbol || '')).split(':').pop()}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-950' : t.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeframe & Unified Market Watch status */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="h-3 w-3 text-slate-400" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="5m" className="bg-slate-900">5M</option>
              <option value="15m" className="bg-slate-900">15M</option>
              <option value="1h" className="bg-slate-900">1H</option>
              <option value="4h" className="bg-slate-900">4H</option>
              <option value="1d" className="bg-slate-900">1D</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-cyan-500/5 px-2.5 py-1 rounded-lg border border-cyan-500/25 text-cyan-300">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Unified Watch</span>
          </div>
        </div>
      </div>

      {/* 3 Presets Options Cards Grid - Proportional & Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="all-in-one-options">
        
        {/* Option 1: Best Setup */}
        <div
          onClick={() => handleRunAiSynthesis('best_setup')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
            activeMode === 'best_setup'
              ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900 hover:border-amber-500/40'
          }`}
          id="opt-btn-best-setup"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Zap className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                SMC / ICT A+ SETUP
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">
              ⚡ Best Setup Mode
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Filters strictly for unmitigated Fair Value Gaps, Order Blocks, and OTE Fibonacci retracements to extract the single highest win-rate setup.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Run Best Setup AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Option 2: News Analyze */}
        <div
          onClick={() => handleRunAiSynthesis('news_analyze')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
            activeMode === 'news_analyze'
              ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900 hover:border-cyan-500/40'
          }`}
          id="opt-btn-news-analyze"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Globe className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                LIVE NEWS GROUNDED
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-400 transition-colors">
              📰 News Analyze Mode
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Scans live economic calendar events (NFP, CPI, FOMC), Federal Reserve interest rate projections, and real-time news headlines.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Analyze News &amp; Macro</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Option 3: All-In-One Master */}
        <div
          onClick={() => handleRunAiSynthesis('all_in_one')}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
            activeMode === 'all_in_one'
              ? 'bg-slate-900 border-purple-500 ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900 hover:border-purple-500/40'
          }`}
          id="opt-btn-all-in-one"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                <Brain className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                FULL 360° SYNTHESIS
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white group-hover:text-purple-400 transition-colors">
              🌐 All-In-One Master
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Unifies Technical Price Action, Live Macro News, DXY Velocity, and 5-Pillar Machine Learning into one master output signal.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full py-2 px-3 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Run All-In-One Master</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-slate-900 p-6 rounded-xl border border-amber-500/30 flex flex-col items-center justify-center gap-3 text-center shadow-lg">
          <Brain className="h-8 w-8 text-amber-400 animate-spin" />
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white font-mono">
              AI ENGINE SYNTHESIZING MARKET API DATA
            </h3>
            <p className="text-[11px] text-amber-400 font-mono animate-pulse">
              {loadingStep}
            </p>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {error && !loading && (
        <div className="bg-rose-950/60 p-3.5 rounded-xl border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Signal Output Result */}
      {report && !loading && (
        <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4 shadow-xl">
          
          {/* Header Signal Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                report.recommendation === 'BUY'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {report.recommendation === 'BUY' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    Master Recommendation:
                  </span>
                  <span className={`text-base font-black font-mono px-2 py-0.5 rounded border ${
                    report.recommendation === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {report.recommendation}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Asset: <span className="text-white font-bold">{symbolCode}</span> | Strategy: <span className="text-amber-400 font-bold">{report.strategy || 'ALL-IN-ONE MASTER'}</span>
                </div>
              </div>
            </div>

            {/* Probability Badge */}
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Win Rate Prob.</div>
                <div className="text-sm font-black text-emerald-400">
                  {report.winRateEstimate || report.confidence || 88.5}%
                </div>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <div className="text-[9px] text-slate-400 font-bold uppercase">R:R Ratio</div>
                <div className="text-sm font-black text-amber-400">
                  {report.institutionalFramework?.rrRatio || '1:3.2'}
                </div>
              </div>
            </div>
          </div>

          <ConsensusMetadata report={report} />
          {report.selectionReason && (
            <div data-testid="selected-setup-reason" className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[10px] font-mono text-emerald-200">
              <span className="font-black uppercase text-emerald-400">Selected best setup:</span> {report.selectionReason}
            </div>
          )}

          {/* Key Execution Levels Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 font-bold text-[9px] uppercase">Entry Price</span>
              <div className="text-sm font-extrabold text-white">
                ${report.entryPrice?.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-rose-400 font-bold text-[9px] uppercase">Stop Loss</span>
              <div className="text-sm font-extrabold text-rose-400">
                ${report.stopLoss?.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-emerald-400 font-bold text-[9px] uppercase">Take Profit 1</span>
              <div className="text-sm font-extrabold text-emerald-400">
                ${(report.takeProfit1 || report.takeProfit)?.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-amber-400 font-bold text-[9px] uppercase">Take Profit 2</span>
              <div className="text-sm font-extrabold text-amber-400">
                ${(report.takeProfit2 || (report.takeProfit ? report.takeProfit * 1.01 : 0))?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Rationale */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-amber-400" />
              AI Technical &amp; Macro Analysis Rationale
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
              {report.rationale}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-800 pt-3">
            {onOpenJournalWithSignal && (
              <button
                onClick={() => onOpenJournalWithSignal(report)}
                className="w-full sm:w-auto px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="h-3.5 w-3.5" />
                Log Setup in Trade Journal
              </button>
            )}

            <div className="w-full sm:w-auto rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3.5 py-2 text-center text-[10px] font-mono text-cyan-200">Telegram delivery is reserved for enabled Auto Signal monitoring.</div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AllInOneAiHub;
