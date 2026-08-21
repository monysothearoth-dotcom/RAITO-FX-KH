import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  PlusCircle, 
  Camera, 
  HelpCircle, 
  Award, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  X,
  Sparkles,
  ExternalLink,
  PieChart as PieChartIcon,
  BarChart2,
  Zap,
  Target,
  ShieldCheck,
  RefreshCw,
  Activity,
  Crosshair
} from 'lucide-react';
import { JournalEntry, SignalLogEntry, MarketTicker } from '../types';
import PortfolioAnalytics from './PortfolioAnalytics';
import { useCurrency } from '../context/CurrencyContext';

interface TradeJournalProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  watchlistSymbols?: string[];
  onToggleWatchlist?: (symbol: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

const DEFAULT_STRATEGIES = [
  'SMC', 'ICT', 'Price Action', 'Order Flow', 'Fibonacci', 
  'Supply and Demand', 'Trendlines', 'MSNR', 'SMT'
];

export default function TradeJournal({ 
  tickers, 
  selectedSymbol, 
  watchlistSymbols = [], 
  onToggleWatchlist,
  onSelectSymbol 
}: TradeJournalProps) {
  const { formatVal, convertVal, currencyInfo } = useCurrency();
  const [journalViewTab, setJournalViewTab] = useState<'ledger' | 'signal_history' | 'allocation'>('ledger');
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('raito_trade_journal');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Set some default beautiful sample entries so the user doesn't see a blank state!
    return [
      {
        id: 'journal-1',
        symbol: 'BINANCE:BTCUSDT',
        direction: 'BUY',
        strategy: 'SMC',
        entryPrice: 94250.00,
        exitPrice: 96800.00,
        size: 0.15,
        pnl: 382.50,
        status: 'WIN',
        notes: 'Premium unmitigated 15m order block. Stop Loss placed below swing low. Precise reaction at 0.5 discount level.',
        screenshotUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=500&auto=format&fit=crop&q=60',
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'journal-2',
        symbol: 'OANDA:EURUSD',
        direction: 'SELL',
        strategy: 'ICT',
        entryPrice: 1.0850,
        exitPrice: 1.0820,
        size: 1.0,
        pnl: 300.00,
        status: 'WIN',
        notes: 'London session silver bullet setup. Retracement to fair value gap at premium range limit.',
        screenshotUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'journal-3',
        symbol: 'OANDA:XAUUSD',
        direction: 'BUY',
        strategy: 'Trendlines',
        entryPrice: 2320.50,
        exitPrice: 2315.00,
        size: 0.5,
        pnl: -275.00,
        status: 'LOSS',
        notes: 'Attempted support bounce of the descending trendline. Swept and stopped out before final bounce occurred.',
        screenshotUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];
  });

  // Save journal entries
  useEffect(() => {
    try {
      localStorage.setItem('raito_trade_journal', JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  }, [entries]);

  // Historical Signal Log Entries State
  const [signalLogs, setSignalLogs] = useState<SignalLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('raito_signal_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial sample signal history items tracking entry, exit target, & actual performance vs projected outcome
    return [
      {
        id: 'sig-log-1',
        symbol: 'OANDA:XAUUSD',
        direction: 'BUY',
        strategy: 'SMC 9-Concept Framework',
        entryPrice: 4050.00,
        exitTargetPrice: 4085.00,
        stopLossPrice: 4038.00,
        projectedWinRate: 88.5,
        projectedRrRatio: '1:2.9',
        actualExitPrice: 4086.70,
        actualStatus: 'TARGET_HIT',
        actualPerformancePercent: +0.90,
        notes: 'M15 Order Block & Bullish SMT Divergence. Full Take Profit 2 Target Hit!',
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        evaluatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sig-log-2',
        symbol: 'BINANCE:BTCUSDT',
        direction: 'BUY',
        strategy: 'ICT Silver Bullet',
        entryPrice: 94500.00,
        exitTargetPrice: 96800.00,
        stopLossPrice: 93800.00,
        projectedWinRate: 85.0,
        projectedRrRatio: '1:3.2',
        actualExitPrice: 96800.00,
        actualStatus: 'TARGET_HIT',
        actualPerformancePercent: +2.43,
        notes: 'NY AM Killzone FVG retest. Reached full exit target with 85% confidence accuracy.',
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
        evaluatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sig-log-3',
        symbol: 'OANDA:EURUSD',
        direction: 'SELL',
        strategy: 'Order Flow Delta',
        entryPrice: 1.0880,
        exitTargetPrice: 1.0820,
        stopLossPrice: 1.0905,
        projectedWinRate: 82.0,
        projectedRrRatio: '1:2.4',
        actualExitPrice: 1.0905,
        actualStatus: 'STOPPED_OUT',
        actualPerformancePercent: -0.23,
        notes: 'Asia high liquidity sweep before ECB high impact news reversal.',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        evaluatedAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString()
      }
    ];
  });

  // Save signal logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('raito_signal_logs', JSON.stringify(signalLogs));
    } catch (e) {
      console.error(e);
    }
  }, [signalLogs]);

  // Function to auto-log 'Signal' results into historical table
  const autoLogSignalResult = (signal: {
    symbol: string;
    strategy: string;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    entryPrice: number;
    exitTargetPrice: number;
    stopLossPrice: number;
    projectedWinRate?: number;
    projectedRrRatio?: string;
    notes?: string;
  }) => {
    if (!signal.symbol || !signal.entryPrice) return;

    // Calculate initial live evaluation if ticker price is available
    const currentTicker = tickers.find(t => t.symbol === signal.symbol);
    const curPrice = currentTicker ? currentTicker.price : signal.entryPrice;

    let actualStatus: 'TARGET_HIT' | 'STOPPED_OUT' | 'IN_PROGRESS' = 'IN_PROGRESS';
    let actualExitPrice: number | undefined = undefined;

    if (signal.recommendation === 'BUY') {
      if (curPrice >= signal.exitTargetPrice) {
        actualStatus = 'TARGET_HIT';
        actualExitPrice = signal.exitTargetPrice;
      } else if (curPrice <= signal.stopLossPrice) {
        actualStatus = 'STOPPED_OUT';
        actualExitPrice = signal.stopLossPrice;
      }
    } else if (signal.recommendation === 'SELL') {
      if (curPrice <= signal.exitTargetPrice) {
        actualStatus = 'TARGET_HIT';
        actualExitPrice = signal.exitTargetPrice;
      } else if (curPrice >= signal.stopLossPrice) {
        actualStatus = 'STOPPED_OUT';
        actualExitPrice = signal.stopLossPrice;
      }
    }

    const priceDiff = (actualExitPrice || curPrice) - signal.entryPrice;
    const direction = signal.recommendation === 'SELL' ? 'SELL' : 'BUY';
    const directionMult = direction === 'BUY' ? 1 : -1;
    const actualPerformancePercent = Number(((priceDiff * directionMult / signal.entryPrice) * 100).toFixed(2));

    const newSignalLog: SignalLogEntry = {
      id: `sig-log-${Math.random().toString(36).substring(2, 9)}`,
      symbol: signal.symbol,
      direction,
      strategy: signal.strategy,
      entryPrice: signal.entryPrice,
      exitTargetPrice: signal.exitTargetPrice,
      stopLossPrice: signal.stopLossPrice,
      projectedWinRate: signal.projectedWinRate,
      projectedRrRatio: signal.projectedRrRatio,
      actualExitPrice,
      actualStatus,
      actualPerformancePercent,
      notes: signal.notes || `Auto-logged AI Signal Setup for ${signal.symbol}`,
      createdAt: new Date().toISOString(),
      evaluatedAt: actualStatus !== 'IN_PROGRESS' ? new Date().toISOString() : undefined
    };

    setSignalLogs(prev => [newSignalLog, ...prev]);
  };

  // Event listener for auto-logging signals from SignalAnalyzer or other components
  useEffect(() => {
    const handleAutoLogSignal = (e: CustomEvent) => {
      if (e.detail) {
        autoLogSignalResult(e.detail);
      }
    };
    window.addEventListener('raito_auto_log_signal' as any, handleAutoLogSignal as EventListener);
    return () => {
      window.removeEventListener('raito_auto_log_signal' as any, handleAutoLogSignal as EventListener);
    };
  }, [tickers]);

  // Real-time auto-evaluator: continuously evaluate active IN_PROGRESS signal entries against live tickers
  useEffect(() => {
    if (!tickers || tickers.length === 0) return;
    setSignalLogs(prevLogs => {
      let updated = false;
      const nextLogs = prevLogs.map(log => {
        if (log.actualStatus !== 'IN_PROGRESS') return log;
        const matchedTicker = tickers.find(t => t.symbol === log.symbol);
        if (!matchedTicker) return log;

        const curPrice = matchedTicker.price;
        let newStatus: SignalLogEntry['actualStatus'] = log.actualStatus;
        let exitPrice = log.actualExitPrice;

        if (log.direction === 'BUY') {
          if (curPrice >= log.exitTargetPrice) {
            newStatus = 'TARGET_HIT';
            exitPrice = log.exitTargetPrice;
          } else if (curPrice <= log.stopLossPrice) {
            newStatus = 'STOPPED_OUT';
            exitPrice = log.stopLossPrice;
          }
        } else if (log.direction === 'SELL') {
          if (curPrice <= log.exitTargetPrice) {
            newStatus = 'TARGET_HIT';
            exitPrice = log.exitTargetPrice;
          } else if (curPrice >= log.stopLossPrice) {
            newStatus = 'STOPPED_OUT';
            exitPrice = log.stopLossPrice;
          }
        }

        const effectiveExit = exitPrice || curPrice;
        const priceDiff = effectiveExit - log.entryPrice;
        const dirMult = log.direction === 'BUY' ? 1 : log.direction === 'SELL' ? -1 : 0;
        const newPerformance = Number(((priceDiff * dirMult / log.entryPrice) * 100).toFixed(2));

        if (newStatus !== log.actualStatus || newPerformance !== log.actualPerformancePercent) {
          updated = true;
          return {
            ...log,
            actualStatus: newStatus,
            actualExitPrice: exitPrice,
            actualPerformancePercent: newPerformance,
            evaluatedAt: newStatus !== 'IN_PROGRESS' ? new Date().toISOString() : log.evaluatedAt
          };
        }
        return log;
      });
      return updated ? nextLogs : prevLogs;
    });
  }, [tickers]);

  const handleDeleteSignalLog = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this historical signal result entry?')) {
      setSignalLogs(prev => prev.filter(s => s.id !== id));
    }
  };

  // Signal stats calculations
  const completedSignals = signalLogs.filter(s => s.actualStatus !== 'IN_PROGRESS');
  const targetHitSignals = completedSignals.filter(s => s.actualStatus === 'TARGET_HIT');
  const signalHitRate = completedSignals.length > 0 
    ? Math.round((targetHitSignals.length / completedSignals.length) * 100) 
    : 100;

  const avgActualPerformance = signalLogs.length > 0
    ? (signalLogs.reduce((acc, s) => acc + (s.actualPerformancePercent || 0), 0) / signalLogs.length).toFixed(2)
    : '0.00';

  // Manual Signal Add Form State
  const [showSignalForm, setShowSignalForm] = useState(false);
  const [sigSymbol, setSigSymbol] = useState(selectedSymbol);
  const [sigDirection, setSigDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [sigStrategy, setSigStrategy] = useState('SMC 9-Concept');
  const [sigEntry, setSigEntry] = useState('');
  const [sigTarget, setSigTarget] = useState('');
  const [sigSL, setSigSL] = useState('');
  const [sigWinRate, setSigWinRate] = useState('88.5');

  const handleManualSignalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigSymbol || !sigEntry || !sigTarget || !sigSL) return;

    autoLogSignalResult({
      symbol: sigSymbol,
      strategy: sigStrategy,
      recommendation: sigDirection,
      entryPrice: parseFloat(sigEntry),
      exitTargetPrice: parseFloat(sigTarget),
      stopLossPrice: parseFloat(sigSL),
      projectedWinRate: parseFloat(sigWinRate) || 85,
      projectedRrRatio: '1:3.0',
      notes: 'Manually logged Signal Setup result tracking'
    });

    setShowSignalForm(false);
    setSigEntry('');
    setSigTarget('');
    setSigSL('');
  };

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [symbol, setSymbol] = useState(selectedSymbol);
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [strategy, setStrategy] = useState('SMC');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [size, setSize] = useState('1');
  const [status, setStatus] = useState<'WIN' | 'LOSS' | 'ACTIVE'>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  // Handle selected symbol shifts
  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol);
      setSigSymbol(selectedSymbol);
      const matchedTicker = tickers.find(t => t.symbol === selectedSymbol);
      if (matchedTicker) {
        setEntryPrice(matchedTicker.price.toString());
        setSigEntry(matchedTicker.price.toString());
        setSigTarget((matchedTicker.price * 1.01).toFixed(2));
        setSigSL((matchedTicker.price * 0.995).toFixed(2));
      }
    }
  }, [selectedSymbol, tickers]);


  // Submit Journal entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !size) return;

    const entryPriceNum = parseFloat(entryPrice);
    const exitPriceNum = exitPrice ? parseFloat(exitPrice) : undefined;
    const sizeNum = parseFloat(size);

    let finalPnl: number | undefined = undefined;
    let finalStatus = status;

    if (exitPriceNum) {
      // Calculate P/L
      // Standardize size sizing multiplier for Crypto vs Forex vs Gold vs stocks
      const isForex = symbol.startsWith('OANDA:') || symbol.startsWith('FX:') || symbol.includes('EURUSD') || symbol.includes('GBPUSD') || symbol.includes('USDJPY');
      const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
      
      let multiplier = 1;
      if (isForex) {
        multiplier = 100000; // Standard 1 lot Forex is 100k units
      } else if (isGold) {
        multiplier = 100; // 1 standard gold contract is 100oz
      } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
        multiplier = 1; // Crypto is direct multiplier
      } else {
        multiplier = 100; // Stock options or typical shares leverage
      }

      const diff = exitPriceNum - entryPriceNum;
      const directionMult = direction === 'BUY' ? 1 : -1;
      finalPnl = Number((diff * directionMult * sizeNum * multiplier).toFixed(2));
      finalStatus = finalPnl >= 0 ? 'WIN' : 'LOSS';
    }

    const newEntry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      direction,
      strategy,
      entryPrice: entryPriceNum,
      exitPrice: exitPriceNum,
      size: sizeNum,
      pnl: finalPnl,
      status: finalStatus,
      notes: notes.trim(),
      screenshotUrl: screenshotUrl.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setEntries(prev => [newEntry, ...prev]);
    resetForm();
  };

  const resetForm = () => {
    setShowAddForm(false);
    setNotes('');
    setScreenshotUrl('');
    setExitPrice('');
    setStatus('ACTIVE');
    const matchedTicker = tickers.find(t => t.symbol === symbol);
    if (matchedTicker) {
      setEntryPrice(matchedTicker.price.toString());
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently erase this trade journal log?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Stats Calculations
  const closedEntries = entries.filter(e => e.status !== 'ACTIVE');
  const winTrades = closedEntries.filter(e => e.status === 'WIN');
  const winRate = closedEntries.length > 0 
    ? Math.round((winTrades.length / closedEntries.length) * 100) 
    : 0;

  const totalPnl = entries.reduce((sum, e) => sum + (e.pnl || 0), 0);
  
  const totalWinsVolume = winTrades.reduce((sum, e) => sum + (e.pnl || 0), 0);
  const lossTrades = closedEntries.filter(e => e.status === 'LOSS');
  const totalLossesVolume = Math.abs(lossTrades.reduce((sum, e) => sum + (e.pnl || 0), 0));
  
  const profitFactor = totalLossesVolume > 0 
    ? Number((totalWinsVolume / totalLossesVolume).toFixed(2)) 
    : totalWinsVolume > 0 ? 9.9 : 0;

  // Custom high-contrast line chart generator (SVG)
  const renderEquityCurve = () => {
    if (entries.length === 0) return null;
    
    // Reverse elements to trace chronologically
    const sortedChronological = [...entries]
      .filter(e => e.pnl !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let runningSum = 0;
    const curvePoints = sortedChronological.map((entry) => {
      runningSum += (entry.pnl || 0);
      return runningSum;
    });

    // Add baseline zero
    const points = [0, ...curvePoints];
    const maxVal = Math.max(...points, 200);
    const minVal = Math.min(...points, -200);
    const range = maxVal - minVal || 100;

    const width = 500;
    const height = 110;
    const padding = 10;

    // Build SVG path
    const svgPoints = points.map((val, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - 2 * padding);
      // Flip coordinate since SVG y=0 is at top
      const y = padding + (1 - (val - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const pathD = svgPoints.length > 0 ? `M ${svgPoints.join(' L ')}` : '';
    
    // Create glowing area fill path
    const areaD = svgPoints.length > 0 
      ? `${pathD} L ${padding + (points.length - 1) / (points.length - 1) * (width - 2 * padding)},${height - padding} L ${padding},${height - padding} Z`
      : '';

    return (
      <div className="w-full h-[120px] relative bg-slate-950/40 rounded-xl border border-slate-900 p-2 overflow-hidden">
        <div className="absolute top-2 left-3 flex justify-between w-[95%] text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest z-10">
          <span>Performance Equity Curve ({currencyInfo.code})</span>
          <span className={runningSum >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
            Net: {runningSum >= 0 ? '+' : ''}{formatVal(runningSum, 'default')}
          </span>
        </div>
        
        {/* Zero baseline */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-slate-800/60 pointer-events-none" 
          style={{ 
            top: `${padding + (1 - (0 - minVal) / range) * (height - 2 * padding)}px` 
          }}
        />

        {svgPoints.length > 1 ? (
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={runningSum >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.18" />
                <stop offset="100%" stopColor={runningSum >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#equityGrad)" />
            <path d={pathD} fill="none" stroke={runningSum >= 0 ? '#10b981' : '#f43f5e'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Draw nodes */}
            {svgPoints.map((pt, index) => {
              const [x, y] = pt.split(',');
              return (
                <circle 
                  key={index} 
                  cx={x} 
                  cy={y} 
                  r="3.5" 
                  fill="#020617" 
                  stroke={runningSum >= 0 ? '#34d399' : '#f43f5e'} 
                  strokeWidth="1.5" 
                />
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-slate-600 font-mono">
            Log closed trades with P/L to plot performance history
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col gap-5 relative overflow-hidden" id="workspace-trade-journal-container">
      {/* Visual background lighting */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Trade Journal &amp; Portfolio</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                Analytics Active
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">Log entries, performance equity &amp; portfolio pie allocation distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setJournalViewTab('ledger')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                journalViewTab === 'ledger'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-3 w-3" /> Ledger
            </button>
            <button
              type="button"
              onClick={() => setJournalViewTab('signal_history')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                journalViewTab === 'signal_history'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="trade-journal-signal-history-tab-btn"
            >
              <Zap className="h-3 w-3" /> Signal Results
            </button>
            <button
              type="button"
              onClick={() => setJournalViewTab('allocation')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                journalViewTab === 'allocation'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="trade-journal-allocation-tab-btn"
            >
              <PieChartIcon className="h-3 w-3" /> Allocation
            </button>
          </div>

          {journalViewTab === 'ledger' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/5 transition-all cursor-pointer active:scale-[0.97]"
            >
              {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showAddForm ? 'Close Form' : 'Log Trade'}
            </button>
          )}

          {journalViewTab === 'signal_history' && (
            <button
              onClick={() => setShowSignalForm(!showSignalForm)}
              className="px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/5 transition-all cursor-pointer active:scale-[0.97]"
            >
              {showSignalForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showSignalForm ? 'Close Form' : 'Log Signal'}
            </button>
          )}
        </div>
      </div>

      {journalViewTab === 'allocation' ? (
        <PortfolioAnalytics
          tickers={tickers}
          watchlistSymbols={watchlistSymbols}
          onToggleWatchlist={onToggleWatchlist || (() => {})}
          onSelectSymbol={onSelectSymbol}
        />
      ) : journalViewTab === 'signal_history' ? (
        /* Signal Historical Results Matrix View */
        <div className="flex flex-col gap-4" id="signal-historical-performance-matrix">
          
          {/* Signal Performance Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Target Hit Accuracy */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Target Hit Rate</span>
                <div className="p-1 bg-emerald-500/10 rounded-md text-emerald-400 border border-emerald-500/20">
                  <Target className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xl font-mono font-black text-emerald-400">{signalHitRate}%</span>
              <span className="text-[8px] text-slate-500 font-medium">
                {targetHitSignals.length} Hit / {completedSignals.length} Evaluated
              </span>
            </div>

            {/* Average Performance Return */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Avg Actual Return</span>
                <div className={`p-1 rounded-md border ${parseFloat(avgActualPerformance) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  <TrendingUp className="h-3 w-3" />
                </div>
              </div>
              <span className={`text-xl font-mono font-black ${parseFloat(avgActualPerformance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {parseFloat(avgActualPerformance) >= 0 ? '+' : ''}{avgActualPerformance}%
              </span>
              <span className="text-[8px] text-slate-500 font-medium">Realized vs Projected Target</span>
            </div>

            {/* Active Monitored Signals */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Monitored</span>
                <div className="p-1 bg-amber-500/10 rounded-md text-amber-500 border border-amber-500/20">
                  <Activity className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xl font-mono font-black text-amber-400">
                {signalLogs.filter(s => s.actualStatus === 'IN_PROGRESS').length}
              </span>
              <span className="text-[8px] text-slate-500 font-medium">Live Ticker Tracking</span>
            </div>

            {/* Total Signals Audited */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Audited Signals</span>
                <div className="p-1 bg-indigo-500/10 rounded-md text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xl font-mono font-black text-white">{signalLogs.length}</span>
              <span className="text-[8px] text-slate-500 font-medium">Auto-Logged &amp; Verified</span>
            </div>
          </div>

          {/* Manual Log Signal Form */}
          {showSignalForm && (
            <form onSubmit={handleManualSignalSubmit} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="text-[11px] font-black uppercase text-amber-500 font-mono tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Log Custom Signal Target Result
                </span>
                <button type="button" onClick={() => setShowSignalForm(false)} className="text-[10px] text-slate-500 hover:text-white">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase">Symbol</label>
                  <select
                    value={sigSymbol}
                    onChange={(e) => setSigSymbol(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {tickers.map(t => {
                      const sym = typeof t?.symbol === 'string' ? t.symbol : String(t?.symbol || '');
                      return (
                        <option key={sym} value={sym}>{sym.split(':').pop()} - {t.name}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase">Direction</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSigDirection('BUY')}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${sigDirection === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigDirection('SELL')}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${sigDirection === 'SELL' ? 'bg-rose-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase">Strategy Concept</label>
                  <select
                    value={sigStrategy}
                    onChange={(e) => setSigStrategy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {DEFAULT_STRATEGIES.map(s => <option key={s} value={`${s} 9-Concept`}>{s} 9-Concept</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase">Entry Price</label>
                  <input
                    type="number" step="any" required value={sigEntry} onChange={(e) => setSigEntry(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-emerald-400 font-black uppercase">Exit Target (TP)</label>
                  <input
                    type="number" step="any" required value={sigTarget} onChange={(e) => setSigTarget(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-emerald-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-rose-400 font-black uppercase">Stop Loss (SL)</label>
                  <input
                    type="number" step="any" required value={sigSL} onChange={(e) => setSigSL(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-rose-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase">Projected Winrate %</label>
                  <input
                    type="number" step="any" value={sigWinRate} onChange={(e) => setSigWinRate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <PlusCircle className="h-4 w-4" /> Add Signal Performance Log
              </button>
            </form>
          )}

          {/* Historical Signal Table / Cards List */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-1.5">
              <span>Auto-Logged Signal Historical Results ({signalLogs.length})</span>
              <span>Entry vs Exit Target &amp; Actual Outcome</span>
            </div>

            {signalLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 bg-slate-950/20 rounded-2xl text-center">
                <Zap className="h-6 w-6 text-slate-600 mb-2" />
                <span className="text-xs font-bold text-slate-400">No Auto-Logged Signals Found</span>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Run a signal analysis in the Signal Analyzer panel or click "Log Signal" above to automatically track AI setup results.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {signalLogs.map((log) => {
                  const rawLogSym = typeof log?.symbol === 'string' ? log.symbol : String(log?.symbol || '');
                  const symbolCode = rawLogSym.includes(':') ? rawLogSym.split(':')[1] : rawLogSym;
                  const matchedTicker = tickers.find(t => t.symbol === log.symbol);
                  const currentPrice = matchedTicker ? matchedTicker.price : log.entryPrice;
                  
                  const isTargetHit = log.actualStatus === 'TARGET_HIT';
                  const isStoppedOut = log.actualStatus === 'STOPPED_OUT';
                  const isInProgress = log.actualStatus === 'IN_PROGRESS';

                  // Calculate projected % gain
                  const projectedDiff = Math.abs(log.exitTargetPrice - log.entryPrice);
                  const projectedGainPercent = ((projectedDiff / log.entryPrice) * 100).toFixed(2);

                  // Progress calculation towards TP/SL
                  const totalSpan = Math.abs(log.exitTargetPrice - log.stopLossPrice);
                  const currentPos = Math.abs(currentPrice - log.stopLossPrice);
                  const progressPct = totalSpan > 0 ? Math.min(100, Math.max(0, (currentPos / totalSpan) * 100)) : 50;

                  return (
                    <div
                      key={log.id}
                      className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all hover:border-slate-700 ${
                        isTargetHit ? 'border-l-4 border-l-emerald-500/80 border-slate-850' :
                        isStoppedOut ? 'border-l-4 border-l-rose-500/80 border-slate-850' :
                        'border-l-4 border-l-amber-500/80 border-slate-850'
                      }`}
                    >
                      {/* Top Bar: Symbol, Direction, Status */}
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2.5 items-center">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            log.direction === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {log.direction}
                          </span>
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-2">
                              <span>{symbolCode}</span>
                              <span className="text-[9px] text-amber-400 font-bold font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                {log.strategy}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              Logged {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-[9px] font-mono font-black border uppercase tracking-wider flex items-center gap-1 ${
                            isTargetHit ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            isStoppedOut ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                          }`}>
                            {isTargetHit && <Target className="h-3 w-3" />}
                            {isStoppedOut && <ShieldCheck className="h-3 w-3" />}
                            {isInProgress && <Activity className="h-3 w-3" />}
                            {isTargetHit ? 'TARGET HIT' : isStoppedOut ? 'STOPPED OUT' : 'IN PROGRESS'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteSignalLog(log.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-all cursor-pointer"
                            title="Delete signal log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Performance Comparison Numbers Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/80 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Entry Price</span>
                          <div className="font-mono text-white font-bold mt-0.5">{formatVal(log.entryPrice, 'default')}</div>
                        </div>

                        <div>
                          <span className="text-[8px] text-emerald-500/80 uppercase font-black">Exit Target (TP)</span>
                          <div className="font-mono text-emerald-400 font-bold mt-0.5">{formatVal(log.exitTargetPrice, 'default')}</div>
                          <span className="text-[8px] text-slate-500 font-mono">Proj. +{projectedGainPercent}%</span>
                        </div>

                        <div>
                          <span className="text-[8px] text-rose-500/80 uppercase font-black">Stop Loss (SL)</span>
                          <div className="font-mono text-rose-400 font-bold mt-0.5">{formatVal(log.stopLossPrice, 'default')}</div>
                        </div>

                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Actual / Live Price</span>
                          <div className="font-mono text-slate-200 font-bold mt-0.5">
                            {formatVal(log.actualExitPrice || currentPrice, 'default')}
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-1 sm:pt-0 sm:pl-2 flex flex-col justify-center">
                          <span className="text-[8px] text-amber-500 uppercase font-black">Actual vs Projected</span>
                          <div className={`font-mono font-black text-xs mt-0.5 ${
                            (log.actualPerformancePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(log.actualPerformancePercent || 0) >= 0 ? '+' : ''}{log.actualPerformancePercent}% Actual
                          </div>
                          {log.projectedWinRate && (
                            <span className="text-[8px] text-slate-500 font-mono">
                              ({log.projectedWinRate}% Projected Winrate)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Target Progress Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-500">
                          <span>SL ({formatVal(log.stopLossPrice, 'default')})</span>
                          <span className="text-amber-400 font-bold">
                            Live Gauge: {Math.round(progressPct)}% Distance to Target
                          </span>
                          <span>TP ({formatVal(log.exitTargetPrice, 'default')})</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80 relative">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isTargetHit ? 'bg-emerald-400' : isStoppedOut ? 'bg-rose-500' : 'bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Analysis Notes */}
                      {log.notes && (
                        <div className="p-2 bg-slate-900/20 rounded-xl border border-slate-900/60 text-[9px] text-slate-400 leading-relaxed font-medium">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-500 text-center font-mono border-t border-slate-850/60 pt-3 flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
            <span>Auto-logs AI generated signals and tracks actual real-time market performance vs projected targets</span>
          </div>
        </div>
      ) : (
        <>


      {/* Interactive Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Win Rate */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Win Rate</span>
            <div className="p-1 bg-emerald-500/10 rounded-md text-emerald-400 border border-emerald-500/20">
              <Percent className="h-3 w-3" />
            </div>
          </div>
          <span className="text-xl font-mono font-black text-white">{winRate}%</span>
          <span className="text-[8px] text-slate-500 font-medium">
            {winTrades.length} W / {closedEntries.length} Total Closed
          </span>
        </div>

        {/* Total Net Profit */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Net P/L ({currencyInfo.code})</span>
            <div className={`p-1 rounded-md border ${totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <DollarSign className="h-3 w-3" />
            </div>
          </div>
          <span className={`text-xl font-mono font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {totalPnl >= 0 ? '+' : ''}{formatVal(totalPnl, 'default')}
          </span>
          <span className="text-[8px] text-slate-500 font-medium">Accumulated Terminal Equity</span>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Profit Factor</span>
            <div className="p-1 bg-indigo-500/10 rounded-md text-indigo-400 border border-indigo-500/20">
              <Award className="h-3 w-3" />
            </div>
          </div>
          <span className="text-xl font-mono font-black text-white">{profitFactor}</span>
          <span className="text-[8px] text-slate-500 font-medium">Wins Vol / Losses Vol</span>
        </div>

        {/* Total Positions logged */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Logged Trades</span>
            <div className="p-1 bg-amber-500/10 rounded-md text-amber-500 border border-amber-500/20">
              <Briefcase className="h-3 w-3" />
            </div>
          </div>
          <span className="text-xl font-mono font-black text-white">{entries.length}</span>
          <span className="text-[8px] text-slate-500 font-medium">
            {entries.filter(e => e.status === 'ACTIVE').length} Active Position(s)
          </span>
        </div>

      </div>

      {/* SVG Equity Chart Section */}
      {renderEquityCurve()}

      {/* Add Entry Form Section */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-4" id="journal-add-entry-form">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="text-[11px] font-black uppercase text-amber-500 font-mono tracking-wider flex items-center gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" /> Log Custom Terminal Position
            </span>
            <button 
              type="button" 
              onClick={resetForm}
              className="text-[10px] text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Symbol Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Symbol / Asset</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {tickers.map(t => {
                  const sym = typeof t?.symbol === 'string' ? t.symbol : String(t?.symbol || '');
                  return (
                    <option key={sym} value={sym}>
                      {sym.split(':').pop()} - {t.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Direction */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Direction</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-1 text-xs font-bold rounded-lg transition-all ${
                    direction === 'BUY'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-1 text-xs font-bold rounded-lg transition-all ${
                    direction === 'SELL'
                      ? 'bg-rose-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Strategy */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Used Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {DEFAULT_STRATEGIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Entry Price */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Entry Price (USD)</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 96250"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Exit Price */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Exit Price (Blank if active)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 96800"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Volume / Contract size */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Lot / Position Size</label>
              <input
                type="number"
                step="any"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Status (Only applicable if Exit price is empty) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-black uppercase">Setup Status</label>
              <select
                disabled={!!exitPrice}
                value={exitPrice ? 'WIN' : status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                <option value="ACTIVE">ACTIVE (Open Trade)</option>
                <option value="WIN">WIN (Manual)</option>
                <option value="LOSS">LOSS (Manual)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Attachment Screenshot */}
            <div className="flex flex-col gap-1 sm:col-span-5">
              <label className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1">
                <Camera className="h-3 w-3 text-slate-500" /> Chart Screenshot URL
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or raw image link"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              {/* Simulator Auto Mock Link */}
              <button
                type="button"
                onClick={() => setScreenshotUrl('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60')}
                className="text-[9px] text-amber-500/80 hover:text-amber-400 text-left font-semibold uppercase tracking-wider mt-0.5"
              >
                ✨ Attach Simulated Chart Capture
              </button>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1 sm:col-span-7">
              <label className="text-[10px] text-slate-400 font-black uppercase">Analysis Notes &amp; Edge</label>
              <textarea
                rows={2}
                placeholder="Explain the setup rationale, price triggers, behavioral errors or strict confirmation criteria achieved..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition-all active:scale-[0.99]"
          >
            <PlusCircle className="h-4 w-4" />
            Append Entry to Edge Ledger
          </button>
        </form>
      )}

      {/* Main Journal Logs List */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-1.5">
          <span>Logged Setups Journal ({entries.length})</span>
          <span>Order Chronological</span>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 bg-slate-950/20 rounded-2xl text-center">
            <BookOpen className="h-6 w-6 text-slate-600 mb-2" />
            <span className="text-xs font-bold text-slate-400">Journal Is Empty</span>
            <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
              Start logging your live analyses or clicks inside the strategy panel to build an uncompromised trading performance history.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {entries.map((entry) => {
              const rawEntrySym = typeof entry?.symbol === 'string' ? entry.symbol : String(entry?.symbol || '');
              const symbolCode = rawEntrySym.includes(':') ? rawEntrySym.split(':')[1] : rawEntrySym;
              const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              const isWin = entry.status === 'WIN';
              const isLoss = entry.status === 'LOSS';
              const isActive = entry.status === 'ACTIVE';

              return (
                <div 
                  key={entry.id} 
                  className={`bg-slate-950/75 border rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all hover:border-slate-700 ${
                    isWin ? 'border-l-4 border-l-emerald-500/60 border-slate-850' : 
                    isLoss ? 'border-l-4 border-l-rose-500/60 border-slate-850' : 
                    'border-l-4 border-l-amber-500/60 border-slate-850'
                  }`}
                >
                  {/* Top metadata row */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2.5">
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        entry.direction === 'BUY' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {entry.direction}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span>{symbolCode}</span>
                          <span className="text-[9px] text-slate-500 font-bold font-mono">@{entry.strategy}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{dateStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border uppercase tracking-wider ${
                        isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        isLoss ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {entry.status}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-all cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantitative numbers grid */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/60">
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase font-black">Entry</span>
                      <div className="font-mono text-white mt-0.5">{formatVal(entry.entryPrice, 'default')}</div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase font-black">Exit</span>
                      <div className="font-mono text-slate-400 mt-0.5">{entry.exitPrice ? formatVal(entry.exitPrice, 'default') : 'Open'}</div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase font-black">Size</span>
                      <div className="font-mono text-white mt-0.5">{entry.size} Lot</div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 uppercase font-black">P/L</span>
                      <div className={`font-mono font-bold mt-0.5 ${entry.pnl !== undefined ? (entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-amber-500'}`}>
                        {entry.pnl !== undefined ? `${entry.pnl >= 0 ? '+' : ''}${formatVal(entry.pnl, 'default')}` : 'Floating'}
                      </div>
                    </div>
                  </div>

                  {/* Optional screenshot visual thumbnail */}
                  {entry.screenshotUrl && (
                    <div className="relative rounded-xl overflow-hidden max-h-[140px] border border-slate-900 bg-slate-950">
                      <img 
                        src={entry.screenshotUrl} 
                        alt="Trade execution chart screenshot" 
                        className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-slate-950/80 rounded border border-slate-800 text-[8px] text-slate-400 font-mono flex items-center gap-1">
                        <Camera className="h-2.5 w-2.5" />
                        <span>Chart Captured</span>
                      </div>
                    </div>
                  )}

                  {/* Analysis Notes */}
                  {entry.notes && (
                    <div className="p-2.5 bg-slate-900/20 rounded-xl border border-slate-900/60 text-[10px] text-slate-500 leading-relaxed font-medium">
                      {entry.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sync tip */}
      <div className="text-[9px] text-slate-500 text-center font-mono border-t border-slate-850/60 pt-3 flex items-center justify-center gap-1">
        <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
        <span>Raito Edge Ledger synchronizes with browser sandboxed localStorage cache</span>
      </div>
        </>
      )}
    </div>
  );
}
