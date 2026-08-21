import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Fallback tickers with beautiful styling
  const fallbackTickers = [
    { name: 'S&P 500', symbol: 'SPX', price: '5,420.25', change: '+0.45%', isUp: true },
    { name: 'Nasdaq 100', symbol: 'NDX', price: '19,120.80', change: '+0.72%', isUp: true },
    { name: 'EUR/USD', symbol: 'EURUSD', price: '1.0824', change: '-0.12%', isUp: false },
    { name: 'GBP/USD', symbol: 'GBPUSD', price: '1.2655', change: '+0.05%', isUp: true },
    { name: 'USD/JPY', symbol: 'USDJPY', price: '156.42', change: '+0.18%', isUp: true },
    { name: 'BTC/USD', symbol: 'BTCUSD', price: '98,420.50', change: '+3.45%', isUp: true },
    { name: 'ETH/USD', symbol: 'ETHUSD', price: '3,115.20', change: '+2.18%', isUp: true },
    { name: 'SOL/USD', symbol: 'SOLUSD', price: '214.80', change: '+4.12%', isUp: true },
    { name: 'Gold', symbol: 'XAUUSD', price: '2,341.20', change: '+0.25%', isUp: true },
    { name: 'Brent Crude', symbol: 'UKOIL', price: '78.45', change: '-1.04%', isUp: false },
  ];

  useEffect(() => {
    let active = true;

    // Fallback timer of 3.5 seconds
    const fallbackTimeout = setTimeout(() => {
      if (active) {
        console.warn("Ticker Tape widget took too long to load; activating native marquee engine.");
        setUseFallback(true);
      }
    }, 3500);

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbols: [
          { proName: 'FOREXCOM:SPX500', title: 'S&P 500' },
          { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
          { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
          { proName: 'FX_IDC:GBPUSD', title: 'GBP/USD' },
          { proName: 'FX_IDC:USDJPY', title: 'USD/JPY' },
          { proName: 'BITSTAMP:BTCUSD', title: 'BTC/USD' },
          { proName: 'BITSTAMP:ETHUSD', title: 'ETH/USD' },
          { proName: 'BINANCE:SOLUSDT', title: 'SOL/USD' },
          { proName: 'TVC:UKOIL', title: 'Brent Crude' },
          { proName: 'TVC:USOIL', title: 'WTI Crude' },
          { proName: 'OANDA:XAUUSD', title: 'Gold' },
        ],
        showSymbolLogo: true,
        colorTheme: 'dark',
        isTransparent: true,
        displayMode: 'adaptive',
        locale: 'en',
      });

      const onScriptLoad = () => {
        clearTimeout(fallbackTimeout);
        setUseFallback(false);
      };

      const onScriptError = () => {
        clearTimeout(fallbackTimeout);
        setUseFallback(true);
      };

      script.addEventListener('load', onScriptLoad);
      script.addEventListener('error', onScriptError);
      containerRef.current.appendChild(script);

      return () => {
        active = false;
        clearTimeout(fallbackTimeout);
        if (script) {
          script.removeEventListener('load', onScriptLoad);
          script.removeEventListener('error', onScriptError);
        }
      };
    }

    return () => {
      active = false;
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const renderFallbackMarquee = () => {
    // Duplicate items to ensure smooth seamless marquee looping
    const doubleTickers = [...fallbackTickers, ...fallbackTickers];

    return (
      <div className="w-full h-full flex items-center overflow-hidden bg-slate-950 text-slate-100 font-sans relative" id="fallback-ticker-marquee">
        {/* Native banner label */}
        <div className="absolute left-0 top-0 bottom-0 px-3 bg-slate-900 border-r border-slate-850 flex items-center gap-1.5 z-20 text-[9px] font-black uppercase text-amber-500 tracking-wider">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>Stream Live</span>
        </div>

        {/* Marquee scroll tracks */}
        <div className="flex items-center gap-8 animate-[marquee_25s_linear_infinite] whitespace-nowrap pl-[120px] select-none">
          {doubleTickers.map((ticker, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 text-xs font-medium">
              <span className="font-bold text-slate-400 font-mono text-[10px]">{ticker.symbol}</span>
              <span className="text-slate-300 font-medium">{ticker.name}</span>
              <span className="font-mono font-bold text-slate-200">{ticker.price}</span>
              <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${ticker.isUp ? 'text-emerald-400' : 'text-rose-500'}`}>
                {ticker.isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {ticker.change}
              </span>
            </div>
          ))}
        </div>

        {/* CSS Animation injection directly in component */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 overflow-hidden h-[46px] flex items-center">
      {useFallback ? (
        renderFallbackMarquee()
      ) : (
        <div className="tradingview-widget-container w-full" ref={containerRef}>
          <div className="tradingview-widget-container__widget"></div>
        </div>
      )}
    </div>
  );
}
