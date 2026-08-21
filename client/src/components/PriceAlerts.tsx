import { useState, FormEvent, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Smartphone,
  X
} from 'lucide-react';
import { MarketTicker, PriceAlert } from '../types';

interface PriceAlertsProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  alerts: PriceAlert[];
  onAddAlert: (symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => void;
  onRemoveAlert: (id: string) => void;
}

export default function PriceAlerts({
  tickers,
  selectedSymbol,
  alerts,
  onAddAlert,
  onRemoveAlert
}: PriceAlertsProps) {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [symbol, setSymbol] = useState<string>(selectedSymbol);
  
  // Notification Permission state
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  // Update target price and symbol when the selected asset changes
  useEffect(() => {
    if (currentTicker) {
      setSymbol(currentTicker.symbol);
      setTargetPrice(currentTicker.price.toString());
    }
  }, [selectedSymbol, currentTicker]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    try {
      const status = await Notification.requestPermission();
      setNotificationStatus(status);
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return;
    }

    onAddAlert(symbol, priceNum, condition);
    
    // Smooth toast feedback
    const activeTicker = tickers.find(t => t.symbol === symbol);
    if (activeTicker) {
      // Small feedback alert
    }
  };

  const getTickerBySymbol = (sym: string) => {
    return tickers.find((t) => t.symbol === sym);
  };

  const formatPrice = (price: number, sym: string) => {
    const isForex = sym.toLowerCase().startsWith('fx:');
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: isForex ? 4 : 2, 
      maximumFractionDigits: isForex ? 4 : 2 
    });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Bell className="h-4 w-4 animate-swing" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-300">
              Custom Price Alerts
            </h2>
            <p className="text-[10px] text-slate-500">HTML5 Notification thresholds &amp; alarms</p>
          </div>
        </div>

        {/* Permission Badge */}
        {notificationStatus === 'granted' ? (
          <div className="flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/15 text-[10px] font-bold text-emerald-400">
            <Check className="h-3 w-3" /> Notifications On
          </div>
        ) : (
          <button
            onClick={requestPermission}
            className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[10px] font-black text-amber-500 cursor-pointer transition-colors"
          >
            <BellOff className="h-3 w-3" /> Enable Browser Push
          </button>
        )}
      </div>

      {/* Permission Explainer if denied */}
      {notificationStatus === 'denied' && (
        <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-[11px] text-rose-400 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            <strong>Browser Notifications are blocked:</strong> Please enable notifications in your browser's address bar settings to receive desktop push alerts. Raito-Fx will also show in-app dashboard alerts.
          </div>
        </div>
      )}

      {/* Create Alert Form */}
      <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Plus className="h-3 w-3 text-amber-500" /> Define New Threshold
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Asset select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Asset</label>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                const t = tickers.find((x) => x.symbol === e.target.value);
                if (t) setTargetPrice(t.price.toString());
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              {tickers.map((t) => {
                const sym = typeof t?.symbol === 'string' ? t.symbol : String(t?.symbol || '');
                return (
                  <option key={sym} value={sym}>
                    {sym.includes(':') ? sym.split(':')[1] : sym} ({t.name})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Condition Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Trigger Condition</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TrendingUp className="h-3 w-3" /> Price Goes Above
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TrendingDown className="h-3 w-3" /> Price Goes Below
              </button>
            </div>
          </div>
        </div>

        {/* Threshold price and submit */}
        <div className="flex flex-col md:flex-row items-end gap-3.5">
          <div className="w-full md:flex-1 flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span>Target Trigger Price (USD)</span>
              {currentTicker && (
                <span className="text-slate-600 font-mono font-medium lowercase">
                  Current: {formatPrice(currentTicker.price, symbol)}
                </span>
              )}
            </label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-lg shadow-amber-500/5 transition-all"
          >
            <Bell className="h-3.5 w-3.5" />
            Set Alert Alarm
          </button>
        </div>
      </form>

      {/* Alerts List */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Your Setup Thresholds ({alerts.length})
        </label>

        {alerts.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
            <Bell className="h-5 w-5 text-slate-600 animate-pulse" />
            <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
              No custom price alerts active. Set a target value above to receive browser notifications instantly when a market threshold is crossed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {alerts.map((alertItem) => {
              const ticker = getTickerBySymbol(alertItem.symbol);
              const isAbove = alertItem.condition === 'ABOVE';
              return (
                <div
                  key={alertItem.id}
                  className={`bg-slate-950/80 border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${
                    alertItem.isTriggered 
                      ? 'border-emerald-500/20 bg-emerald-500/[0.01]' 
                      : 'border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Direction Icon */}
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      alertItem.isTriggered
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : isAbove
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                    }`}>
                      {alertItem.isTriggered ? (
                        <Check className="h-4 w-4" />
                      ) : isAbove ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white leading-none">
                          {(() => {
                            const s = typeof alertItem?.symbol === 'string' ? alertItem.symbol : String(alertItem?.symbol || '');
                            return s.includes(':') ? s.split(':')[1] : s;
                          })()}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[8px] rounded font-mono font-bold uppercase tracking-wider ${
                          alertItem.isTriggered
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isAbove
                            ? 'bg-emerald-500/5 text-emerald-400/80'
                            : 'bg-rose-500/5 text-rose-400/80'
                        }`}>
                          {isAbove ? '≥' : '≤'} {formatPrice(alertItem.targetPrice, alertItem.symbol)}
                        </span>
                      </div>

                      {/* Info / Trigger status description */}
                      <span className="text-[10px] text-slate-500 mt-1">
                        {alertItem.isTriggered ? (
                          <span className="text-emerald-400 font-semibold">
                            Triggered at {new Date(alertItem.triggeredAt || alertItem.createdAt).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span>
                            Set on {new Date(alertItem.createdAt).toLocaleDateString()} · Active
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ticker && !alertItem.isTriggered && (
                      <div className="hidden sm:flex flex-col items-end text-[10px] font-mono leading-tight pr-1">
                        <span className="text-slate-600 font-bold uppercase">Current</span>
                        <span className="text-slate-400 font-semibold">{formatPrice(ticker.price, alertItem.symbol)}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => onRemoveAlert(alertItem.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Delete Alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
