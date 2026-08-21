/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MarketTicker, PriceAlert } from './types';
import { INITIAL_MARKETS } from './data/markets';
import TickerTape from './components/TickerTape';
import TradingViewChart from './components/TradingViewChart';
import TechnicalAnalysisWidget from './components/TechnicalAnalysisWidget';
import MarketList from './components/MarketList';
import TickerHeader from './components/TickerHeader';
import MarketConverter from './components/MarketConverter';
import MarketNews from './components/MarketNews';
import MarketPulse from './components/MarketPulse';
import SignalAnalyzer from './components/SignalAnalyzer';
import AllInOneAiHub from './components/AllInOneAiHub';
import AIAgent from './components/AIAgent';
import AuthModal from './components/AuthModal';
import PriceAlerts from './components/PriceAlerts';
import TradeJournal from './components/TradeJournal';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import ApiFeedSettings from './components/ApiFeedSettings';
import ResearchLibrary from './components/ResearchLibrary';
import PaperTradingPanel from './components/PaperTradingPanel';
import AccountSettings, { formatAccountClock } from './components/AccountSettings';
import { MacroIndicatorsPanel, CryptoMetricsPanel } from './components/MarketDataPanels';
import { useCurrency, SUPPORTED_CURRENCIES } from './context/CurrencyContext';
import { useAuth } from './_core/hooks/useAuth';
import { trpc } from './lib/trpc';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Info, 
  Shield, 
  Activity, 
  Flame,
  Globe,
  LineChart, 
  Cpu, 
  Newspaper, 
  Compass, 
  Calendar,
  SlidersHorizontal,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  Bell,
  X,
  BookOpen,
  PieChart as PieChartIcon,
  Settings
} from 'lucide-react';

export const responsiveHeaderClassName = 'max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 w-full min-w-0';
export const responsiveHeaderNavClassName = 'flex items-center gap-1.5 overflow-x-auto pb-1 w-full max-w-full min-w-0 text-[11px] sm:text-xs font-semibold whitespace-nowrap scrollbar-none touch-pan-x overscroll-x-contain';

export type DashboardTab = 'markets' | 'pulse' | 'signals' | 'all_in_one' | 'agent' | 'news' | 'research' | 'list' | 'alerts' | 'journal' | 'analytics' | 'account';

export function ResponsiveHeaderNav({ children }: { children: React.ReactNode }) {
  return <nav className={responsiveHeaderNavClassName}>{children}</nav>;
}

export function getInitialDashboardTab(requestedView: string | null): DashboardTab {
  if (requestedView && ['markets', 'pulse', 'signals', 'all_in_one', 'agent', 'news', 'research', 'list', 'alerts', 'journal', 'analytics', 'account'].includes(requestedView)) return requestedView as DashboardTab;
  return 'all_in_one';
}

export function getAccountPreferredTab(requestedView: string | null, persistedView: string | null | undefined): DashboardTab {
  return getInitialDashboardTab(requestedView || persistedView || null);
}

export function resolveAccountTheme(theme: 'dark' | 'light' | 'system' | null | undefined, prefersDark: boolean): 'dark' | 'light' {
  if (theme === 'light') return 'light';
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return 'dark';
}

export function AccountPreferenceRuntime({ requestedView, persistedView, persistedTheme, activeTab, setActiveTab }: { requestedView: string | null; persistedView?: string | null; persistedTheme?: 'dark' | 'light' | 'system' | null; activeTab: DashboardTab; setActiveTab: React.Dispatch<React.SetStateAction<DashboardTab>> }) {
  useEffect(() => {
    if (!requestedView && persistedView && activeTab === 'all_in_one') setActiveTab(getAccountPreferredTab(requestedView, persistedView));
  }, [persistedView, activeTab, requestedView, setActiveTab]);

  useEffect(() => {
    if (!persistedTheme) return;
    const isDark = resolveAccountTheme(persistedTheme, window.matchMedia('(prefers-color-scheme: dark)').matches) === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [persistedTheme]);

  return null;
}

export function AccountPreferenceStartup({ requestedView, activeTab, setActiveTab, onTimezoneChange }: { requestedView: string | null; activeTab: DashboardTab; setActiveTab: React.Dispatch<React.SetStateAction<DashboardTab>>; onTimezoneChange: (timezone: string) => void }) {
  const { user } = useAuth();
  const profileQuery = trpc.account.profile.useQuery(undefined, { enabled: Boolean(user) });
  useEffect(() => { onTimezoneChange(profileQuery.data?.timezone || 'UTC'); }, [profileQuery.data?.timezone, onTimezoneChange]);
  return <AccountPreferenceRuntime requestedView={requestedView} persistedView={profileQuery.data?.defaultView} persistedTheme={profileQuery.data?.theme} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

export function AuthStatus({ loading, error, user, logoutError, onLogin, onSignup, onLogout, onSettings }: { loading: boolean; error?: unknown; user: string | null; logoutError?: string | null; onLogin: () => void; onSignup: () => void; onLogout: () => void; onSettings?: () => void }) {
  if (loading) {
    return <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-850 px-3 text-xs font-mono text-slate-400" aria-live="polite"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-amber-400" /> Checking account…</div>;
  }

  if (error && !user) {
    return <div className="flex min-h-10 items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-[11px] font-mono text-rose-300" role="alert"><span>Account check unavailable</span><button onClick={onLogin} className="font-bold text-amber-300 underline">Retry</button></div>;
  }

  if (user) {
    return <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-850 px-3.5 py-1.5 shadow-md" title={logoutError || undefined}>
      <div className="flex flex-col items-end">
        <span className="flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> TRADER ONLINE</span>
        <span className="text-xs font-mono font-black text-white">@{user}</span>
        {logoutError && <span className="max-w-36 truncate text-[9px] text-rose-300" role="alert">{logoutError}</span>}
      </div>
      <div className="h-6 w-px bg-slate-800" />
      {onSettings && <button onClick={onSettings} className="cursor-pointer p-2 text-slate-400 transition-colors hover:text-amber-400" title="Account settings" aria-label="Account settings"><Settings className="h-4 w-4" /></button>}
      <button onClick={onLogout} className="cursor-pointer p-2 text-slate-400 transition-colors hover:text-rose-400" title="Sign Out of Terminal" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
    </div>;
  }

  return <div className="flex items-center gap-1.5 sm:gap-2">
    <button onClick={onLogin} className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-xs font-black text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-850 hover:text-white active:scale-[0.97] sm:px-3.5"> <LogIn className="inline h-3.5 w-3.5" /> Log In</button>
    <button onClick={onSignup} className="shrink-0 rounded-xl bg-amber-500 px-2.5 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-500/10 transition-all hover:bg-amber-400 active:scale-[0.97] sm:px-3.5"><UserPlus className="inline h-3.5 w-3.5" /> Sign Up</button>
  </div>;
}

export default function App() {
  const { currency, setCurrency } = useCurrency();
  const { user: sessionUser, loading: authLoading, error: authSessionError, logout } = useAuth();
  const user = sessionUser?.name || sessionUser?.email?.split('@')[0] || sessionUser?.openId || null;
  const [accountTimezone, setAccountTimezone] = useState('UTC');
  const requestedView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
  const [tickers, setTickers] = useState<MarketTicker[]>(INITIAL_MARKETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('SMC');
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => getInitialDashboardTab(requestedView));
  const [sidebarTab, setSidebarTab] = useState<'markets' | 'pulse'>('markets');
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  
  // Lifted Global Gemini API Key State for unmetered live intelligence
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_custom_api_key') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      if (customApiKey) {
        localStorage.setItem('raito_custom_api_key', customApiKey);
      }
    } catch {}
  }, [customApiKey]);

  const handleApiKeyChange = (val: string) => {
    setCustomApiKey(val);
    try {
      localStorage.setItem('raito_custom_api_key', val);
    } catch {}
  };

  // Real-Time Reliable Market Data Feeds States
  const [apiProvider, setApiProvider] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_api_provider') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const [alphaVantageKey, setAlphaVantageKey] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_av_key') || '';
    } catch {
      return '';
    }
  });

  const [coingeckoKey, setCoingeckoKey] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_cg_key') || '';
    } catch {
      return '';
    }
  });

  const [iexCloudKey, setIexCloudKey] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_iex_key') || '';
    } catch {
      return '';
    }
  });

  const [simulatedTicksEnabled, setSimulatedTicksEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('raito_simulated_ticks');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [currentSource, setCurrentSource] = useState<string>('Auto (Institutional)');
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState<boolean>(false);

  const handleProviderChange = (val: string) => {
    setApiProvider(val);
    try {
      localStorage.setItem('raito_api_provider', val);
    } catch {}
  };

  const handleAlphaVantageKeyChange = (val: string) => {
    setAlphaVantageKey(val);
    try {
      localStorage.setItem('raito_av_key', val);
    } catch {}
  };

  const handleCoingeckoKeyChange = (val: string) => {
    setCoingeckoKey(val);
    try {
      localStorage.setItem('raito_cg_key', val);
    } catch {}
  };

  const handleIexCloudKeyChange = (val: string) => {
    setIexCloudKey(val);
    try {
      localStorage.setItem('raito_iex_key', val);
    } catch {}
  };

  const handleSimulatedTicksToggle = (val: boolean) => {
    setSimulatedTicksEnabled(val);
    try {
      localStorage.setItem('raito_simulated_ticks', String(val));
    } catch {}
  };
  
  // Price Alerts State Management
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('raito_fx_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Real-Time On-Screen Alert Toasts
  interface AlertToast {
    id: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    currentPrice: number;
    timestamp: string;
  }
  const [toasts, setToasts] = useState<AlertToast[]>([]);

  // Sync Price Alerts to local persistence
  useEffect(() => {
    localStorage.setItem('raito_fx_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const triggerToast = (symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW', currentPrice: number) => {
    const newToast: AlertToast = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      targetPrice,
      condition,
      currentPrice,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts((prev) => [newToast, ...prev]);
    // Auto-dismiss toast in 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 8000);
  };

  const triggerBrowserNotification = (symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW', currentPrice: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const strSym = typeof symbol === 'string' ? symbol : String(symbol || '');
      const assetName = strSym.includes(':') ? strSym.split(':')[1] : strSym;
      const body = `${assetName} price is now ${currentPrice} USD, crossing your threshold target of ${targetPrice} USD.`;
      try {
        new Notification(`Raito-Fx Alarm: ${assetName} Triggered!`, { body });
      } catch (err) {
        console.warn('Notification failed inside sandbox environment:', err);
      }
    }
  };

  // Real-time threshold monitoring agent
  useEffect(() => {
    let changed = false;
    const updatedAlerts = alerts.map((alert) => {
      if (alert.isTriggered) return alert;

      const ticker = tickers.find((t) => t.symbol === alert.symbol);
      if (!ticker) return alert;

      let isTriggered = false;
      if (alert.condition === 'ABOVE' && ticker.price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'BELOW' && ticker.price <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        changed = true;
        triggerToast(alert.symbol, alert.targetPrice, alert.condition, ticker.price);
        triggerBrowserNotification(alert.symbol, alert.targetPrice, alert.condition, ticker.price);
        return {
          ...alert,
          isTriggered: true,
          triggeredAt: new Date().toISOString()
        };
      }
      return alert;
    });

    if (changed) {
      setAlerts(updatedAlerts);
    }
  }, [tickers, alerts]);

  const handleAddAlert = (symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => {
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      targetPrice,
      condition,
      isTriggered: false,
      createdAt: new Date().toISOString()
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Real OAuth-backed account controls. Sign-in and sign-up both use the secure account portal.
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'signup'>('login');
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLoginClick = () => {
    setAuthDefaultMode('login');
    setAuthModalOpen(true);
  };

  const handleSignupClick = () => {
    setAuthDefaultMode('signup');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
    } catch {
      setLogoutError('Sign out failed. Try again.');
    }
  };
  
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('watchlist_symbols');
      return saved ? JSON.parse(saved) : ['BINANCE:BTCUSDT', 'OANDA:EURUSD', 'NASDAQ:AAPL', 'TVC:UKOIL'];
    } catch {
      return ['BINANCE:BTCUSDT', 'OANDA:EURUSD', 'NASDAQ:AAPL', 'TVC:UKOIL'];
    }
  });

  // Watchlist updates persistence
  useEffect(() => {
    localStorage.setItem('watchlist_symbols', JSON.stringify(watchlistSymbols));
  }, [watchlistSymbols]);

  // Real-time WebSocket Stream Manager State
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsSyncStatus, setWsSyncStatus] = useState<'SYNCED' | 'LAGGING' | 'DISCONNECTED'>('DISCONNECTED');
  const [wsLatency, setWsLatency] = useState<number>(14);
  const wsRef = useRef<WebSocket | null>(null);

  // Real-Time WebSocket Manager to synchronize TickerHeader & TradingViewChart
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const connectWS = () => {
      // The hosted runtime uses resilient HTTP polling for live prices; no unmatched /ws endpoint.
      return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          setWsSyncStatus('SYNCED');

          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
            }
          }, 4000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TICK_UPDATE' || data.type === 'SNAPSHOT') {
              if (data.prices) {
                setTickers((prevTickers) =>
                  prevTickers.map((ticker) => {
                    const liveData = data.prices[ticker.symbol];
                    if (liveData) {
                      return {
                        ...ticker,
                        price: liveData.price,
                        change: liveData.change,
                        changePercent: liveData.changePercent,
                        high: liveData.high,
                        low: liveData.low
                      };
                    }
                    return ticker;
                  })
                );
              }
              const calcLatency = Math.max(6, Date.now() - (data.timestamp || Date.now()));
              setWsLatency(calcLatency);
              setWsSyncStatus(calcLatency > 600 ? 'LAGGING' : 'SYNCED');
            } else if (data.type === 'PONG') {
              const rtt = Math.max(6, Date.now() - data.clientTimestamp);
              setWsLatency(rtt);
              setWsSyncStatus(rtt > 600 ? 'LAGGING' : 'SYNCED');
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          setWsSyncStatus('DISCONNECTED');
          if (pingInterval) clearInterval(pingInterval);
          reconnectTimer = setTimeout(connectWS, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          setWsSyncStatus('DISCONNECTED');
        };
      } catch (e) {
        setWsConnected(false);
        setWsSyncStatus('DISCONNECTED');
        reconnectTimer = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Real-Time live pricing data feed from search grounding backend
  const fetchLivePrices = async () => {
    setIsRefreshingFeed(true);
    try {
      const params = new URLSearchParams({
        provider: apiProvider,
        coingeckoKey,
        alphaVantageKey,
        iexCloudKey
      });
      const res = await fetch(`/api/live-prices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch real-time multi-market feed');
      const data = await res.json();
      if (data && data.prices) {
        if (data.source) {
          setCurrentSource(data.source);
        }
        setTickers((prevTickers) =>
          prevTickers.map((ticker) => {
            const liveData = data.prices[ticker.symbol];
            if (liveData) {
              return {
                ...ticker,
                price: liveData.price,
                change: liveData.change,
                changePercent: liveData.changePercent,
                high: liveData.high,
                low: liveData.low
              };
            }
            return ticker;
          })
        );
      }
    } catch (err) {
      console.warn("Failed to fetch real-time multi-market feed:", err);
    } finally {
      setIsRefreshingFeed(false);
      setIsInitialLoading(false);
    }
  };

  // Dynamic Polling Strategy: 30s interval when browser tab hidden, 3s when focused
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = (ms: number) => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(fetchLivePrices, ms);
    };

    fetchLivePrices();
    startPolling(document.hidden ? 30000 : 3000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: switch polling interval to 30s to conserve bandwidth
        startPolling(30000);
      } else {
        // Tab focused: immediately refresh feed & reset interval to 3s
        fetchLivePrices();
        startPolling(3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [apiProvider, coingeckoKey, alphaVantageKey, iexCloudKey]);

  // Micro-fluctuation engine (every 3s) for organic live-ticking visual interface (conditional)
  useEffect(() => {
    if (!simulatedTicksEnabled) return;

    const interval = setInterval(() => {
      setTickers((prevTickers) =>
        prevTickers.map((ticker) => {
          // Organically update price ~35% of the time per ticker to simulate realistic market ticks
          if (Math.random() > 0.35) return ticker;

          const pct = (Math.random() * 0.12 - 0.06) / 100; // small tick
          const currentPrice = ticker.price;
          const newPrice = currentPrice * (1 + pct);
          const diff = newPrice - currentPrice;
          
          const newChange = ticker.change + diff;
          const basePrice = currentPrice - ticker.change;
          const newChangePercent = basePrice > 0 ? (newChange / basePrice) * 100 : ticker.changePercent;

          return {
            ...ticker,
            price: Number(newPrice.toFixed(ticker.category === 'forex' ? 4 : 2)),
            change: Number(newChange.toFixed(ticker.category === 'forex' ? 4 : 2)),
            changePercent: Number(newChangePercent.toFixed(2)),
            high: Number(Math.max(ticker.high, newPrice).toFixed(ticker.category === 'forex' ? 4 : 2)),
            low: Number(Math.min(ticker.low, newPrice).toFixed(ticker.category === 'forex' ? 4 : 2)),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [simulatedTicksEnabled]);

  const activeTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];

  const handleToggleWatchlist = (symbol: string) => {
    setWatchlistSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Smooth workspace state controllers triggered by AI Agent or direct interaction
  const handleSwitchAsset = (asset: string | MarketTicker) => {
    const symbol = typeof asset === 'string' ? asset : asset.symbol;
    setSelectedSymbol(symbol);
    // Only auto-switch to markets tab if user is NOT currently chatting in the AI Agent tab
    if (activeTab !== 'agent') {
      setActiveTab('markets');
    }
  };

  const handleSwitchStrategy = (strategy: string) => {
    setSelectedStrategy(strategy);
    // Only auto-switch to signals tab if user is NOT currently chatting in the AI Agent tab
    if (activeTab !== 'agent') {
      setActiveTab('signals');
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <AccountPreferenceStartup requestedView={requestedView} activeTab={activeTab} setActiveTab={setActiveTab} onTimezoneChange={setAccountTimezone} />
      
      {/* Ticker Tape Widget */}
      <TickerTape />

      {/* Main Header / Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-3 sticky top-0 z-50 w-full max-w-full overflow-hidden">
        <div className={responsiveHeaderClassName}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full min-w-0 overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950">
                ★
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  RAITO<span className="text-amber-500">-FX</span>
                </span>
                <span className="text-[9px] ml-2 bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  PRO
                </span>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <ResponsiveHeaderNav>
              <button
                onClick={() => setActiveTab('markets')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'markets'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LineChart className="h-3.5 w-3.5" />
                Markets &amp; Chart
              </button>
              <button
                onClick={() => setActiveTab('pulse')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pulse'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-market-pulse"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Market Pulse
              </button>
              <button
                onClick={() => setActiveTab('signals')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'signals'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Signal Analyze
              </button>
              <button
                onClick={() => setActiveTab('all_in_one')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all_in_one'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-extrabold shadow-md'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
                id="tab-all-in-one-engine"
              >
                <Cpu className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                ⚡ All-In-One AI Engine
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'agent'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                AI Agent
              </button>
              <button
                onClick={() => setActiveTab('research')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'research'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-market-research"
              >
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                Research Library
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'news'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-economic-calendar"
              >
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                Economic Calendar &amp; News
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'alerts'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-price-alerts"
              >
                <Bell className="h-3.5 w-3.5" />
                Price Alerts
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'journal'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-trade-journal"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Trade Journal
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="tab-portfolio-analytics"
              >
                <PieChartIcon className="h-3.5 w-3.5" />
                Analytics
              </button>
              {/* Assets list Tab visible only on mobile screens (hidden on desktop) */}
              <button
                onClick={() => setActiveTab('list')}
                className={`lg:hidden px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'list'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                All Assets
              </button>
            </ResponsiveHeaderNav>
          </div>

          {/* Account & Status Indicators */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-5 w-full lg:w-auto min-w-0">
            {/* Global Currency Converter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-850 border border-slate-800 rounded-xl px-2 py-1 text-xs font-mono shadow-md hover:border-slate-700 transition-colors min-w-0 flex-1 sm:flex-none max-w-[170px] sm:max-w-none">
              <Globe className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-slate-200 font-extrabold focus:outline-none cursor-pointer text-xs min-w-0 max-w-[132px] sm:max-w-none truncate"
                title="Global Preferred Display Currency"
                id="global-currency-toggle-select"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => {
                  const cName = typeof c?.name === 'string' ? c.name : String(c?.name || '');
                  return (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200 font-mono">
                      {c.symbol} {c.code} ({cName.split('-')[1]?.trim() || cName})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase">Fear/Greed:</span>
                <span className="text-emerald-500 font-bold">64 (Greed)</span>
              </div>
              <div className="h-3 w-px bg-slate-800"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase">DXY:</span>
                <span className="text-rose-500 font-bold">104.12</span>
              </div>
            </div>

            <AuthStatus
              loading={authLoading}
              error={authSessionError}
              user={user}
              logoutError={logoutError}
              onLogin={handleLoginClick}
              onSignup={handleSignupClick}
              onLogout={handleLogout}
              onSettings={() => setActiveTab('account')}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full min-w-0 max-w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 overflow-x-hidden">
        
        {/* Active Ticker Metrics Panel */}
        <TickerHeader 
          ticker={activeTicker} 
          isLoading={isInitialLoading} 
          currentSource={currentSource}
          wsConnected={wsConnected}
          wsSyncStatus={wsSyncStatus}
          wsLatency={wsLatency}
        />

        {/* Clean Separate Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PERSISTENT LEFT SIDEBAR FOR DESKTOP (Always visible on large screens) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6 w-full">
            <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs font-bold gap-1 w-full">
              <button
                onClick={() => setSidebarTab('markets')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'markets'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Market Assets</span>
              </button>
              <button
                onClick={() => setSidebarTab('pulse')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'pulse'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Market Pulse</span>
              </button>
            </div>

            {sidebarTab === 'markets' ? (
              <MarketList
                tickers={tickers}
                selectedSymbol={selectedSymbol}
                onSelectTicker={handleSwitchAsset}
                watchlistSymbols={watchlistSymbols}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ) : (
              <MarketPulse
                tickers={tickers}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={handleSwitchAsset}
                onRefreshTickers={fetchLivePrices}
              />
            )}
            <TechnicalAnalysisWidget symbol={selectedSymbol} />
          </aside>

          {/* DYNAMIC TAB CONTENT AREA WITH SMOOTH MOTION ANIMATIONS */}
          <section className="lg:col-span-8 flex flex-col gap-6 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full flex flex-col gap-6"
              >
                {/* 1. Markets & Live Chart Tab */}
                {activeTab === 'markets' && (
                  <>
                    <div className="w-full">
                      <TradingViewChart 
                        symbol={selectedSymbol} 
                        livePrice={activeTicker?.price} 
                        liveChangePercent={activeTicker?.changePercent}
                      />
                    </div>
                    <MarketConverter activeTicker={activeTicker} />
                    <ApiFeedSettings
                      apiProvider={apiProvider}
                      onProviderChange={handleProviderChange}
                      alphaVantageKey={alphaVantageKey}
                      onAlphaVantageKeyChange={handleAlphaVantageKeyChange}
                      coingeckoKey={coingeckoKey}
                      onCoingeckoKeyChange={handleCoingeckoKeyChange}
                      iexCloudKey={iexCloudKey}
                      onIexCloudKeyChange={handleIexCloudKeyChange}
                      onForceRefresh={fetchLivePrices}
                      currentSource={currentSource}
                      isRefreshing={isRefreshingFeed}
                      simulatedTicksEnabled={simulatedTicksEnabled}
                      onSimulatedTicksToggle={handleSimulatedTicksToggle}
                    />
                  </>
                )}

                {/* 2. Real-Time Market Pulse Tab */}
                {activeTab === 'pulse' && (
                  <MarketPulse
                    tickers={tickers}
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={handleSwitchAsset}
                    onRefreshTickers={fetchLivePrices}
                  />
                )}

                {/* 2. Algorithmic Signals Tab */}
                {activeTab === 'signals' && (
                  <>
                    <SignalAnalyzer 
                      activeTicker={activeTicker}
                      tickers={tickers}
                      onSymbolChange={setSelectedSymbol}
                      selectedStrategy={selectedStrategy}
                      onStrategyChange={setSelectedStrategy}
                      customApiKey={customApiKey}
                      onApiKeyChange={handleApiKeyChange}
                    />
                    <div className="lg:hidden">
                      <TechnicalAnalysisWidget symbol={selectedSymbol} />
                    </div>
                  </>
                )}

                {/* All-In-One Dedicated AI Engine Hub */}
                {activeTab === 'all_in_one' && (
                  <AllInOneAiHub
                    activeTicker={activeTicker}
                    tickers={tickers}
                    onSelectTicker={handleSwitchAsset}
                    customApiKey={customApiKey}
                    onOpenJournalWithSignal={(signal) => {
                      setActiveTab('journal');
                    }}
                  />
                )}

                {/* 3. AI Agent Copilot Tab */}
                {activeTab === 'agent' && (
                  <AIAgent
                    activeTicker={activeTicker}
                    availableMarkets={tickers}
                    selectedStrategy={selectedStrategy}
                    onSwitchAsset={handleSwitchAsset}
                    onSwitchStrategy={handleSwitchStrategy}
                    customApiKey={customApiKey}
                  />
                )}

                {/* 4. Hot News Intel Tab */}
                {activeTab === 'news' && (
                  <MarketNews symbol={selectedSymbol} symbols={tickers.map((ticker) => ticker.symbol)} customApiKey={customApiKey} />
                )}

                {/* 5. Research Library, macro, crypto, and paper validation workspace */}
                {activeTab === 'research' && (
                  <div className="flex flex-col gap-6">
                    <ResearchLibrary />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <MacroIndicatorsPanel />
                      <CryptoMetricsPanel symbol={activeTicker.category === 'crypto' ? activeTicker.symbol.split(':').pop() : 'BTCUSDT'} />
                    </div>
                    <PaperTradingPanel activeTicker={activeTicker} />
                  </div>
                )}

                {/* 6. Mobile-Only Assets List View Tab */}
                {activeTab === 'list' && (
                  <div className="flex flex-col gap-6">
                    <MarketList
                      tickers={tickers}
                      selectedSymbol={selectedSymbol}
                      onSelectTicker={handleSwitchAsset}
                      watchlistSymbols={watchlistSymbols}
                      onToggleWatchlist={handleToggleWatchlist}
                    />
                    <TechnicalAnalysisWidget symbol={selectedSymbol} />
                  </div>
                )}

                {/* 6. Custom Price Alerts Tab */}
                {activeTab === 'alerts' && (
                  <PriceAlerts
                    tickers={tickers}
                    selectedSymbol={selectedSymbol}
                    alerts={alerts}
                    onAddAlert={handleAddAlert}
                    onRemoveAlert={handleRemoveAlert}
                  />
                )}

                {/* 7. Advanced Trade Journal Tab */}
                {activeTab === 'journal' && (
                  <TradeJournal
                    tickers={tickers}
                    selectedSymbol={selectedSymbol}
                    watchlistSymbols={watchlistSymbols}
                    onToggleWatchlist={handleToggleWatchlist}
                    onSelectSymbol={handleSwitchAsset}
                  />
                )}

                {/* 8. Portfolio Asset Allocation Analytics Tab */}
                {activeTab === 'analytics' && (
                  <PortfolioAnalytics
                    tickers={tickers}
                    watchlistSymbols={watchlistSymbols}
                    onToggleWatchlist={handleToggleWatchlist}
                    onSelectSymbol={handleSwitchAsset}
                  />
                )}

                {/* Protected account, recovery, export, and privacy controls */}
                {activeTab === 'account' && <AccountSettings />}
              </motion.div>
            </AnimatePresence>

            {/* Trading tips and educational block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl h-fit border border-indigo-500/20 text-indigo-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Trading Security</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Always cross-reference market entry targets and configure precise stop-losses. This terminal is for real-time visual analysis and indicators benchmarking only.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl h-fit border border-amber-500/20 text-amber-500">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Market Liquidity</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Crypto markets run 24/7/365. Stocks and Forex observe standard country hours. Gold, Oil, and other major commodities follow specific NYMEX/COMEX session rosters.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Status Bar Footer */}
      <footer className="h-9 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-4 text-[10px] text-slate-500 mt-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Connected: London (LD4)
          </div>
          <span>Latency: 14ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{formatAccountClock(clockNow, accountTimezone)}</span>
          <span className="text-white font-bold tracking-wider uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">PRO PLAN</span>
        </div>
      </footer>

      {/* Raito-Fx Pro Auth Overlay Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authDefaultMode}
      />

      {/* Dynamic Floating Toast Alarms Container */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const rawToastSym = typeof toast?.symbol === 'string' ? toast.symbol : String(toast?.symbol || '');
            const assetName = rawToastSym.includes(':') ? rawToastSym.split(':')[1] : rawToastSym;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className="pointer-events-auto bg-slate-900 border-l-4 border-l-emerald-500 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 relative overflow-hidden"
              >
                {/* Background flare */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Bell className="h-4 w-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Price Threshold Crossed
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {toast.timestamp} · Raito Alarm
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="p-1 hover:bg-slate-850 rounded text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal">
                  <span className="font-extrabold text-white">{assetName}</span> has crossed your target limit of <span className="font-mono font-bold text-amber-400">${toast.targetPrice}</span>. Current market price is <span className="font-mono font-bold text-emerald-400">${toast.currentPrice.toLocaleString()}</span>.
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

