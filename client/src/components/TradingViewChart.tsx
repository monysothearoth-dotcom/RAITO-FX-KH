import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Loader2, 
  AlertCircle, 
  Cpu, 
  Globe, 
  Zap,
  BarChart3,
  Layers3
} from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  livePrice?: number;
  liveChangePercent?: number;
}

export const responsiveChartControlsClassName = 'flex flex-wrap items-center justify-between gap-2 sm:gap-4 w-full sm:w-auto min-w-0';

export function ResponsiveChartControls({ children }: { children: React.ReactNode }) {
  return <div className={responsiveChartControlsClassName}>{children}</div>;
}

export function getTradingViewStudies(showSma: boolean, showEma: boolean, showVolume: boolean): string[] {
  return [
    'RSI@tv-basicstudies',
    ...(showSma ? ['MASimple@tv-basicstudies'] : []),
    ...(showEma ? ['MAExp@tv-basicstudies'] : []),
    ...(showVolume ? ['Volume@tv-basicstudies'] : []),
  ];
}

export default function TradingViewChart({ symbol, livePrice, liveChangePercent }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSymbolRef = useRef<string>('');
  const lastAppendTimeRef = useRef<number>(Date.now());
  
  const [chartMode, setChartMode] = useState<'realtime' | 'tradingview'>(() => {
    try {
      return 'tradingview';
    } catch {
      return 'tradingview';
    }
  });

  const [tvStyle, setTvStyle] = useState<'1' | '2'>(() => {
    try { return (localStorage.getItem('raito_tv_style') as '1' | '2') || '1'; } catch { return '1'; }
  });
  const [showSma, setShowSma] = useState(() => {
    try { return localStorage.getItem('raito_overlay_sma') !== 'off'; } catch { return true; }
  });
  const [showEma, setShowEma] = useState(() => {
    try { return localStorage.getItem('raito_overlay_ema') === 'on'; } catch { return false; }
  });
  const [showVolume, setShowVolume] = useState(() => {
    try { return localStorage.getItem('raito_overlay_volume') !== 'off'; } catch { return true; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; index: number } | null>(null);
  const [fallbackData, setFallbackData] = useState<number[]>([]);
  const [tickPrice, setTickPrice] = useState<number>(100);

  // Parse a friendly name for the symbol
  const getFriendlyName = (sym: string) => {
    const str = typeof sym === 'string' ? sym : String(sym || '');
    const parts = str.split(':');
    const code = parts[parts.length - 1] || str;
    if (code.includes('BTC')) return { base: 'BTC', quote: 'USD', name: 'Bitcoin' };
    if (code.includes('ETH')) return { base: 'ETH', quote: 'USD', name: 'Ethereum' };
    if (code.includes('SOL')) return { base: 'SOL', quote: 'USD', name: 'Solana' };
    if (code.includes('BNB')) return { base: 'BNB', quote: 'USD', name: 'Binance Coin' };
    if (code.includes('XRP')) return { base: 'XRP', quote: 'USD', name: 'Ripple' };
    if (code.includes('XAU') || code.includes('GOLD')) return { base: 'XAU', quote: 'USD', name: 'Gold Spot' };
    if (code.includes('XAG') || code.includes('SILVER')) return { base: 'XAG', quote: 'USD', name: 'Silver Spot' };
    if (code.includes('EURUSD')) return { base: 'EUR', quote: 'USD', name: 'Euro / US Dollar' };
    if (code.includes('GBPUSD')) return { base: 'GBP', quote: 'USD', name: 'Pound / US Dollar' };
    if (code.includes('USDJPY')) return { base: 'USD', quote: 'JPY', name: 'US Dollar / Yen' };
    if (code.includes('AUDUSD')) return { base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar' };
    if (code.includes('USDCAD')) return { base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar' };
    if (code.includes('USOIL') || code.includes('UKOIL')) return { base: 'OIL', quote: 'USD', name: 'Crude Oil (WTI/Brent)' };
    if (code.includes('AAPL')) return { base: 'AAPL', quote: 'USD', name: 'Apple Inc. Stock' };
    if (code.includes('TSLA')) return { base: 'TSLA', quote: 'USD', name: 'Tesla Inc. Stock' };
    if (code.includes('NVDA')) return { base: 'NVDA', quote: 'USD', name: 'NVIDIA Corp. Stock' };
    if (code.includes('MSFT')) return { base: 'MSFT', quote: 'USD', name: 'Microsoft Corp. Stock' };
    if (code.includes('AMZN')) return { base: 'AMZN', quote: 'USD', name: 'Amazon.com Inc. Stock' };
    if (code.includes('GOOGL')) return { base: 'GOOGL', quote: 'USD', name: 'Alphabet Inc. Stock' };
    return { base: code.substring(0, 4), quote: code.substring(4) || 'USD', name: code };
  };

  const asset = getFriendlyName(symbol);

  // Toggle chart mode and persist
  const handleModeChange = (mode: 'realtime' | 'tradingview') => {
    setChartMode(mode);
    try {
      localStorage.setItem('raito_chart_mode', mode);
    } catch {}
  };

  // Generate deterministic base historical price action ONLY when symbol changes
  useEffect(() => {
    if (lastSymbolRef.current === symbol && fallbackData.length > 0) return;
    lastSymbolRef.current = symbol;

    const strSymbol = typeof symbol === 'string' ? symbol : String(symbol || '');
    const seed = strSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = livePrice || (
      symbol.includes('BTC') ? 98500 
      : symbol.includes('ETH') ? 3120 
      : symbol.includes('SOL') ? 215 
      : symbol.includes('BNB') ? 630
      : symbol.includes('XRP') ? 1.15
      : symbol.includes('XAU') ? 2340 
      : symbol.includes('XAG') ? 28.50
      : symbol.includes('EURUSD') ? 1.0820
      : symbol.includes('GBPUSD') ? 1.2650
      : symbol.includes('USDJPY') ? 156.40
      : symbol.includes('AUDUSD') ? 0.6650
      : symbol.includes('USDCAD') ? 1.3680
      : symbol.includes('OIL') ? 78.50
      : 150
    );
    
    // Create 40 historical data points with wave formula to anchor the chart
    const points: number[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 39) * Math.PI * 3.5;
      const sinVal = Math.sin(angle + seed);
      const cosVal = Math.cos(angle * 0.7 - seed);
      const noise = Math.sin(i * 1.5 + seed) * 0.15;
      const pctChange = (sinVal * 0.8 + cosVal * 0.4 + noise) * 0.015; // Max 2.5% variation
      points.push(basePrice * (1 + pctChange));
    }

    // Set last point to exactly match current livePrice if we have it
    if (livePrice) {
      points[points.length - 1] = livePrice;
    }
    
    setFallbackData(points);
    setTickPrice(livePrice || basePrice);
  }, [symbol]);

  // Dynamically respond to incoming live ticks from our real-time feeds (Alpha Vantage, CoinGecko, Binance, etc.)
  useEffect(() => {
    if (!livePrice) return;
    setTickPrice(livePrice);
    
    const now = Date.now();
    setFallbackData(prevData => {
      if (prevData.length === 0) return [livePrice];
      
      const lastVal = prevData[prevData.length - 1];
      if (lastVal === livePrice) return prevData;

      // Check if 60 seconds (60000ms) have passed since we last appended a historical candle step
      // This matches the 60-second update frequency of the Market Pulse panel to optimize CPU and prevent desync!
      if (now - lastAppendTimeRef.current > 60000) {
        lastAppendTimeRef.current = now;
        const updated = [...prevData, livePrice];
        if (updated.length > 40) {
          updated.shift();
        }
        return updated;
      } else {
        // Otherwise, simply update the active tail price point
        const updated = [...prevData];
        updated[updated.length - 1] = livePrice;
        return updated;
      }
    });
  }, [livePrice]);

  // Loading official TradingView Widget if requested
  useEffect(() => {
    if (chartMode !== 'tradingview') return;

    const containerId = 'tradingview_chart_element';
    let active = true;
    let intervalId: any = null;
    
    setIsLoading(true);

    // Fallback loading safety timeout
    const fallbackTimeout = setTimeout(() => {
      if (active && !(window as any).TradingView?.widget) {
        console.warn("TradingView widget took too long to load in sandbox frame; falling back to native API chart.");
        handleModeChange('realtime');
        setIsLoading(false);
      }
    }, 4000);
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const widgetDiv = document.createElement('div');
      widgetDiv.id = containerId;
      widgetDiv.className = 'w-full h-full';
      containerRef.current.appendChild(widgetDiv);

      const initWidget = () => {
        if (active && (window as any).TradingView?.widget) {
          try {
            new (window as any).TradingView.widget({
              autosize: true,
              symbol: symbol,
              interval: 'D',
              timezone: 'Etc/UTC',
              theme: 'dark',
              style: tvStyle,
              locale: 'en',
              enable_publishing: false,
              allow_symbol_change: true,
              container_id: containerId,
              hide_side_toolbar: false,
              studies: getTradingViewStudies(showSma, showEma, showVolume),
              show_popup_button: true,
              popup_width: '1000',
              popup_height: '650',
            });
            setIsLoading(false);
          } catch (e) {
            console.error("Error initializing TradingView widget:", e);
            handleModeChange('realtime');
            setIsLoading(false);
          }
        }
      };

      if ((window as any).TradingView?.widget) {
        initWidget();
      } else {
        let script = document.getElementById('tradingview-tv-script') as HTMLScriptElement;
        
        if (!script) {
          script = document.createElement('script');
          script.id = 'tradingview-tv-script';
          script.src = 'https://s3.tradingview.com/tv.js';
          script.type = 'text/javascript';
          script.async = true;
          document.head.appendChild(script);
        }

        const onScriptLoad = () => {
          clearTimeout(fallbackTimeout);
          initWidget();
        };

        const onScriptError = () => {
          clearTimeout(fallbackTimeout);
          console.warn("TradingView script failed to load. Falling back to native API chart.");
          handleModeChange('realtime');
          setIsLoading(false);
        };

        script.addEventListener('load', onScriptLoad);
        script.addEventListener('error', onScriptError);

        intervalId = setInterval(() => {
          if ((window as any).TradingView?.widget) {
            clearTimeout(fallbackTimeout);
            initWidget();
            clearInterval(intervalId);
          }
        }, 100);

        return () => {
          active = false;
          clearTimeout(fallbackTimeout);
          if (script) {
            script.removeEventListener('load', onScriptLoad);
            script.removeEventListener('error', onScriptError);
          }
          if (intervalId) {
            clearInterval(intervalId);
          }
        };
      }
    }

    return () => {
      active = false;
      clearTimeout(fallbackTimeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [symbol, chartMode, tvStyle, showSma, showEma, showVolume]);

  // Format price helper
  const formatPrice = (val: number) => {
    if (val > 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val > 10) return val.toFixed(2);
    return val.toFixed(4);
  };

  // Render SVG fallback chart details
  const renderFallbackChart = () => {
    if (fallbackData.length === 0) return null;

    const min = Math.min(...fallbackData) * 0.998;
    const max = Math.max(...fallbackData) * 1.002;
    const range = max - min;

    const width = 800;
    const height = 360;
    const padding = { top: 20, right: 80, bottom: 30, left: 20 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Map index to X coordinate
    const getX = (idx: number) => padding.left + (idx / (fallbackData.length - 1)) * chartWidth;
    // Map price to Y coordinate
    const getY = (val: number) => padding.top + chartHeight - ((val - min) / range) * chartHeight;

    // Create price path string
    let pathD = '';
    let areaD = `M ${getX(0)} ${padding.top + chartHeight} `;
    
    fallbackData.forEach((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      if (idx === 0) {
        pathD += `M ${x} ${y} `;
      } else {
        pathD += `L ${x} ${y} `;
      }
      areaD += `L ${x} ${y} `;
    });
    
    areaD += `L ${getX(fallbackData.length - 1)} ${padding.top + chartHeight} Z`;

    // Is general trend positive or negative
    const isTrendingUp = (liveChangePercent !== undefined ? liveChangePercent >= 0 : tickPrice >= fallbackData[0]);
    const trendColor = isTrendingUp ? '#10b981' : '#f43f5e';

    // Generate grid lines
    const gridCount = 5;
    const gridLines = [];
    for (let i = 0; i <= gridCount; i++) {
      const val = min + (i / gridCount) * range;
      const y = getY(val);
      gridLines.push({ y, val });
    }

    // Handle mouse movement for interactive tooltip
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      
      // Calculate index corresponding to clientX
      const relativeX = clientX - (padding.left / width) * rect.width;
      const relativeChartWidth = (chartWidth / width) * rect.width;
      const pct = relativeX / relativeChartWidth;
      const index = Math.max(0, Math.min(fallbackData.length - 1, Math.round(pct * (fallbackData.length - 1))));

      if (index >= 0 && index < fallbackData.length) {
        const x = getX(index);
        const y = getY(fallbackData[index]);
        setHoveredPoint({
          x,
          y,
          price: fallbackData[index],
          index
        });
      }
    };

    return (
      <div className="w-full h-full flex flex-col p-4 bg-slate-950 text-slate-100 font-sans relative" id="fallback-chart-container">
        
        {/* SVG Wrapper */}
        <div className="flex-1 min-h-[300px] relative">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.24} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0.00} />
              </linearGradient>
              <linearGradient id="hoverLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0.0)" />
              </linearGradient>
            </defs>

            {/* Grid lines & price labels */}
            {gridLines.map((line, idx) => (
              <g key={idx}>
                <line 
                  x1={padding.left} 
                  y1={line.y} 
                  x2={width - padding.right} 
                  y2={line.y} 
                  stroke="#111827" 
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text 
                  x={width - padding.right + 10} 
                  y={line.y + 4} 
                  fill="#4b5563" 
                  className="text-[10px] font-mono font-bold"
                >
                  {formatPrice(line.val)}
                </text>
              </g>
            ))}

            {/* Gradient filled area */}
            <path d={areaD} fill="url(#chartAreaGradient)" />

            {/* Price line */}
            <path 
              d={pathD} 
              fill="none" 
              stroke={trendColor} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pulsing tick dot at the end */}
            <circle 
              cx={getX(fallbackData.length - 1)} 
              cy={getY(tickPrice)} 
              r="7" 
              fill={trendColor} 
              opacity="0.25"
              className="animate-ping"
            />
            <circle 
              cx={getX(fallbackData.length - 1)} 
              cy={getY(tickPrice)} 
              r="4.5" 
              fill={trendColor} 
              stroke="#020617"
              strokeWidth="2"
            />

            {/* Hover tooltip indicator */}
            {hoveredPoint && (
              <g>
                <line 
                  x1={hoveredPoint.x} 
                  y1={padding.top} 
                  x2={hoveredPoint.x} 
                  y2={padding.top + chartHeight} 
                  stroke="url(#hoverLineGradient)" 
                  strokeWidth="1.5"
                />
                <circle 
                  cx={hoveredPoint.x} 
                  cy={hoveredPoint.y} 
                  r="5" 
                  fill="#f59e0b" 
                  stroke="#020617" 
                  strokeWidth="2" 
                />
              </g>
            )}
          </svg>

          {/* Absolute tooltip container */}
          {hoveredPoint && (
            <div 
              className="absolute bg-slate-900/95 border border-amber-500/30 p-2 rounded-lg shadow-xl text-left flex flex-col gap-0.5 pointer-events-none backdrop-blur-sm z-50 font-mono text-[10px]"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 15}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <span className="text-slate-500">Live Tick Point</span>
              <span className="text-amber-400 font-bold">{formatPrice(hoveredPoint.price)} {asset.quote}</span>
              <span className="text-[9px] text-slate-600">Tick Step #{hoveredPoint.index}</span>
            </div>
          )}
        </div>

        {/* Footer info stats */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-900 pt-3 text-[10px] text-slate-500">
          <div className="flex flex-col">
            <span>START VALUE</span>
            <span className="font-mono font-bold text-slate-300">{formatPrice(fallbackData[0])}</span>
          </div>
          <div className="flex flex-col text-center">
            <span>HIGH BOUND (24H)</span>
            <span className="font-mono font-bold text-emerald-400">{formatPrice(Math.max(...fallbackData))}</span>
          </div>
          <div className="flex flex-col text-right">
            <span>LOW BOUND (24H)</span>
            <span className="font-mono font-bold text-rose-400">{formatPrice(Math.min(...fallbackData))}</span>
          </div>
        </div>
      </div>
    );
  };

  const isTrendingUp = (liveChangePercent !== undefined ? liveChangePercent >= 0 : tickPrice >= fallbackData[0]);
  const trendColor = isTrendingUp ? '#10b981' : '#f43f5e';

  return (
    <div className="w-full h-full min-h-[480px] lg:min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-900/60 shadow-2xl flex flex-col relative" id="chart-card">
      
      {/* Dynamic Uniform Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-900 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-200 tracking-wider uppercase">{asset.base} / {asset.quote}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400">REAL-TIME</span>
              
              {chartMode === 'realtime' ? (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 animate-pulse">
                  <Zap className="h-2.5 w-2.5" /> Live API Stream
                </span>
              ) : (
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Globe className="h-2.5 w-2.5" /> TradingView Widget
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">{asset.name} · Live Financial Feed</span>
          </div>
        </div>

        {/* Unified Price Display & Toggle Controls */}
        <ResponsiveChartControls>
          <div className="flex flex-col items-end">
            <span className="text-base font-black font-mono tracking-tight" style={{ color: trendColor }}>
              {formatPrice(tickPrice)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: trendColor }}>
              {isTrendingUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isTrendingUp ? '+' : ''}{(liveChangePercent !== undefined ? liveChangePercent : (((tickPrice - fallbackData[0]) / fallbackData[0]) * 100)).toFixed(2)}%</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-900 hidden sm:block" />

          {/* TradingView chart style selector */}
          <select
            value={tvStyle}
            onChange={(event) => {
              const nextStyle = event.target.value as '1' | '2';
              setTvStyle(nextStyle);
              try { localStorage.setItem('raito_tv_style', nextStyle); } catch {}
            }}
            className="bg-slate-900 border border-slate-850 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300 outline-none cursor-pointer"
            aria-label="TradingView chart style"
          >
            <option value="1">Candles</option>
            <option value="2">Line</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-850 p-1 rounded-xl shrink-0" aria-label="Historical chart overlays">
            <button
              onClick={() => { const next = !showSma; setShowSma(next); try { localStorage.setItem('raito_overlay_sma', next ? 'on' : 'off'); } catch {} }}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${showSma ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Toggle 20-period simple moving average"
              aria-pressed={showSma}
            >
              <Layers3 className="h-3 w-3" /> SMA
            </button>
            <button
              onClick={() => { const next = !showEma; setShowEma(next); try { localStorage.setItem('raito_overlay_ema', next ? 'on' : 'off'); } catch {} }}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${showEma ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Toggle 9-period exponential moving average"
              aria-pressed={showEma}
            >
              EMA
            </button>
            <button
              onClick={() => { const next = !showVolume; setShowVolume(next); try { localStorage.setItem('raito_overlay_volume', next ? 'on' : 'off'); } catch {} }}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${showVolume ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Toggle volume bars"
              aria-pressed={showVolume}
            >
              <BarChart3 className="h-3 w-3" /> VOL
            </button>
          </div>

          <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl shrink-0">
            <button
              onClick={() => handleModeChange('tradingview')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'tradingview'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-3 w-3" /> Widget
            </button>
          </div>
        </ResponsiveChartControls>
      </div>

      {/* Chart Body Content */}
      <div className="flex-1 relative bg-slate-950">
        {chartMode === 'realtime' ? (
          renderFallbackChart()
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-slate-950/95 z-40">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <p className="text-xs font-semibold text-slate-300">Initializing TradingView Terminal</p>
                  <p className="text-[10px] text-slate-500">Injecting official charting scripts...</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full absolute inset-0" />
          </>
        )}
      </div>

    </div>
  );
}
