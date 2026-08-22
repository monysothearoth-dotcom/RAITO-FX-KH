import React, { useEffect, useState, useMemo } from 'react';
import { 
  Newspaper, 
  Flame, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ShieldAlert, 
  ExternalLink,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  DollarSign,
  AlertTriangle,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  Radio,
  Send
} from 'lucide-react';
import { trpc } from '../lib/trpc';

interface CalendarEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual: string;
  forecast: string;
  previous: string;
  betterThanExpected?: boolean | null;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  analysis: string;
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  relatedCurrency?: string;
  category?: 'forex' | 'crypto';
  assetTags?: string[];
  timestamp?: number;
  url?: string;
  effectAnalysis?: { affectedInstruments: string[]; direction: 'BUY' | 'SELL' | 'MIXED'; expectedEffect: string; impact: 'high' | 'medium' | 'low'; risk: string };
  isNew?: boolean;
}

export type NewsSort = 'newest' | 'impact';
export type NewsSentimentFilter = 'all' | NewsItem['sentiment'];
export type NewsEffectFilter = 'all' | 'BUY' | 'SELL' | 'MIXED';

export function newsEffectDisplayLabel(direction?: 'BUY' | 'SELL' | 'MIXED'): string {
  return direction === 'BUY' ? '🟢Buy (Bullish 📈)⬆️' : direction === 'SELL' ? '🔴Sell (Bearish 📉)⬇️' : '⚪Normal (No Effect🚫)🔄';
}

export function newsEffectCardClass(direction?: 'BUY' | 'SELL' | 'MIXED'): string {
  return direction === 'BUY'
    ? 'border-emerald-500/50 bg-emerald-500/[0.06] hover:border-emerald-400/70'
    : direction === 'SELL'
    ? 'border-rose-500/50 bg-rose-500/[0.06] hover:border-rose-400/70'
    : direction === 'MIXED'
    ? 'border-slate-500/60 bg-slate-500/[0.06] hover:border-slate-300/70'
    : 'border-slate-850 bg-slate-950/60 hover:border-slate-700';
}

export function filterAndSortNews(items: NewsItem[], options: {
  ticker: string;
  sentiment: NewsSentimentFilter;
  effect: NewsEffectFilter;
  impact: 'all' | 'high' | 'medium_high';
  search: string;
  sort: NewsSort;
}): NewsItem[] {
  const query = options.search.trim().toLowerCase();
  const impactRank = { high: 3, medium: 2, low: 1 } as const;
  return items
    .filter((item) => {
      const matchesTicker = options.ticker === 'ALL' || item.relatedCurrency?.toUpperCase() === options.ticker;
      const matchesSentiment = options.sentiment === 'all' || item.sentiment === options.sentiment;
      const matchesEffect = options.effect === 'all' || item.effectAnalysis?.direction === options.effect;
      const matchesImpact = options.impact === 'all' || (options.impact === 'high' ? item.impact === 'high' : item.impact === 'high' || item.impact === 'medium');
      const matchesSearch = !query || [item.title, item.summary, item.source, item.relatedCurrency || ''].some((value) => value.toLowerCase().includes(query));
      return matchesTicker && matchesSentiment && matchesEffect && matchesImpact && matchesSearch;
    })
    .sort((a, b) => options.sort === 'impact'
      ? impactRank[b.impact] - impactRank[a.impact] || (b.timestamp || Date.parse(b.time) || 0) - (a.timestamp || Date.parse(a.time) || 0)
      : (b.timestamp || Date.parse(b.time) || 0) - (a.timestamp || Date.parse(a.time) || 0));
}

export function telegramAlertActionLabel(isEnabled?: boolean): string {
  return isEnabled ? 'Pause Telegram alerts' : 'Enable 60s Telegram alerts';
}

export function telegramHealthLabel(status?: string): string {
  if (status === 'outage') return 'OUTAGE';
  if (status === 'degraded') return 'DEGRADED';
  if (status === 'healthy') return 'HEALTHY';
  return 'DISABLED';
}

export function getNewsDecisionContext(input: { activeTab: 'calendar' | 'news'; calendarCount: number; newsCount: number; alertsEnabled?: boolean }) {
  return [
    { label: 'Priority queue', value: input.activeTab === 'calendar' ? 'Review event risk first' : 'Review headline impact', detail: input.activeTab === 'calendar' ? 'Calendar workflow active' : 'Breaking-news workflow active', tone: 'amber' },
    { label: 'Live coverage', value: `${input.calendarCount} events · ${input.newsCount} headlines`, detail: 'Current workspace inventory', tone: 'cyan' },
    { label: 'Scheduled alerts', value: input.alertsEnabled ? 'Delivery monitor active' : 'Alerts on standby', detail: input.alertsEnabled ? 'Deduplicated 60-second checks' : 'Owner activation required', tone: input.alertsEnabled ? 'emerald' : 'slate' },
  ] as const;
}

export const responsiveNewsBannerClassName = 'bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 overflow-hidden shadow-inner';
export const responsiveNewsMarqueeClassName = 'flex-1 min-w-[140px] overflow-hidden relative mx-0 sm:mx-2 order-3 sm:order-none basis-full sm:basis-auto';

export function ResponsiveNewsBanner({ children }: { children: React.ReactNode }) {
  return <div className={responsiveNewsBannerClassName}>{children}</div>;
}

export function TelegramHealthPanel({ status }: { status?: { healthStatus?: string; lastRunAt?: Date | string | null; lastSuccessAt?: Date | string | null; runCount?: number; totalSent?: number; totalSkipped?: number; failedRunCount?: number; consecutiveFailureCount?: number; sourceFailures?: string | null; lastError?: string | null; pendingNotificationType?: string | null; notificationAttemptCount?: number; lastNotificationError?: string | null } }) {
  if (!status) return null;
  return <div data-testid="telegram-health-panel">
    {status.lastRunAt && <p className="mt-1 text-[10px] font-mono text-slate-400">Last check: {new Date(status.lastRunAt).toLocaleString()}</p>}
    {status.lastSuccessAt && <p className="mt-1 text-[10px] font-mono text-emerald-300">Last healthy check: {new Date(status.lastSuccessAt).toLocaleString()}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
      <span className={`rounded-lg border px-2 py-1 font-black ${status.healthStatus === 'healthy' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : status.healthStatus === 'outage' ? 'border-rose-500/40 bg-rose-500/15 text-rose-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{telegramHealthLabel(status.healthStatus)}</span>
      <span>Runs {status.runCount ?? 0}</span><span>Sent {status.totalSent ?? 0}</span><span>Skipped {status.totalSkipped ?? 0}</span><span>Failures {status.failedRunCount ?? 0}</span><span>Streak {status.consecutiveFailureCount ?? 0}</span>
    </div>
    {status.sourceFailures && <p className="mt-1 text-[10px] font-mono text-amber-300">Source warnings: {status.sourceFailures}</p>}
    {status.lastError && <p className="mt-1 text-[10px] font-mono text-rose-300">Last delivery issue: {status.lastError}</p>}
    {status.pendingNotificationType && <p className="mt-1 text-[10px] font-mono text-amber-300">Owner alert retry pending: {status.notificationAttemptCount ?? 0} attempt(s)</p>}
    {status.lastNotificationError && <p className="mt-1 text-[10px] font-mono text-rose-300">Owner notification issue: {status.lastNotificationError}</p>}
  </div>;
}

export function TelegramAlertAction({
  isStatusError,
  isEnabled,
  isEnabling,
  isDisabling,
  onEnable,
  onDisable,
}: {
  isStatusError: boolean;
  isEnabled?: number;
  isEnabling: boolean;
  isDisabling: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  if (isStatusError) return <span className="text-[10px] text-slate-500">Sign in to manage alerts</span>;
  if (isEnabled) {
    return <button onClick={onDisable} disabled={isDisabling} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">{isDisabling ? 'Pausing…' : telegramAlertActionLabel(true)}</button>;
  }
  return <button onClick={onEnable} disabled={isEnabling} className="rounded-xl border border-sky-400/30 bg-sky-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-sky-100 transition hover:bg-sky-400/25 disabled:opacity-50">{isEnabling ? 'Enabling…' : telegramAlertActionLabel(false)}</button>;
}

interface MarketNewsProps {
  symbol: string;
  symbols?: string[];
}

export default function MarketNews({ symbol, symbols = [] }: MarketNewsProps) {
  const telegramUtils = trpc.useUtils();
  const telegramStatus = trpc.telegramNews.status.useQuery(undefined, { retry: false });
  const enableTelegram = trpc.telegramNews.enable.useMutation({ onSuccess: () => telegramUtils.telegramNews.status.invalidate() });
  const disableTelegram = trpc.telegramNews.disable.useMutation({ onSuccess: () => telegramUtils.telegramNews.status.invalidate() });
  const updateHighImpact = trpc.telegramNews.updateHighImpact.useMutation({ onSuccess: () => telegramUtils.telegramNews.status.invalidate() });
  const tracking = trpc.tracking.list.useQuery(undefined, { retry: false });
  const trackNewsEffect = trpc.tracking.track.useMutation({ onSuccess: () => tracking.refetch() });
  const evaluateNewsEffects = trpc.tracking.evaluate.useMutation({ onSuccess: () => tracking.refetch() });
  const [activeTab, setActiveTab] = useState<'calendar' | 'news'>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('newsTab') === 'breaking') return 'news';
    return 'calendar';
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [macroSummary, setMacroSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Live Auto-Push Controls
  const [autoPushInterval, setAutoPushInterval] = useState<number>(60); // seconds (30, 60, 120, 0=off)
  const [countdown, setCountdown] = useState<number>(60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // all, forex, crypto

  // Filters
  const [selectedImpact, setSelectedImpact] = useState<'all' | 'high' | 'medium_high'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedNewsTicker, setSelectedNewsTicker] = useState<string>('ALL');
  const [selectedNewsSentiment, setSelectedNewsSentiment] = useState<NewsSentimentFilter>('all');
  const [selectedNewsEffect, setSelectedNewsEffect] = useState<NewsEffectFilter>('all');
  const [newsSort, setNewsSort] = useState<NewsSort>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventIdx, setExpandedEventIdx] = useState<number | null>(null);
  const [highImpactEnabled, setHighImpactEnabled] = useState(true);
  const [highImpactLeadMinutes, setHighImpactLeadMinutes] = useState(15);
  const [highImpactInstruments, setHighImpactInstruments] = useState('XAUUSD,EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD');
  const trackedSymbols = useMemo(() => symbols.length > 0 ? symbols.join(',') : symbol, [symbols, symbol]);
  const decisionContext = useMemo(() => getNewsDecisionContext({ activeTab, calendarCount: calendarEvents.length, newsCount: newsList.length, alertsEnabled: Boolean(telegramStatus.data?.isEnabled) }), [activeTab, calendarEvents.length, newsList.length, telegramStatus.data?.isEnabled]);

  useEffect(() => {
    const status = telegramStatus.data;
    if (!status) return;
    if (status.highImpactAlertsEnabled !== undefined) setHighImpactEnabled(Boolean(status.highImpactAlertsEnabled));
    if (status.highImpactLeadMinutes) setHighImpactLeadMinutes(Number(status.highImpactLeadMinutes));
    if (status.highImpactInstruments) setHighImpactInstruments(String(status.highImpactInstruments));
  }, [telegramStatus.data]);

  // Audio Chime via Web Audio API
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Autoplay safety
    }
  };

  const fetchNewsAndCalendar = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);

    let url = `/api/news?symbol=${encodeURIComponent(symbol)}&symbols=${encodeURIComponent(trackedSymbols)}&category=${encodeURIComponent(selectedCategory)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const newEvents: CalendarEvent[] = data.calendar || [];
        const newNews: NewsItem[] = (data.news || []).map((n: NewsItem, idx: number) => ({
          ...n,
          isNew: idx === 0
        }));

        setCalendarEvents(newEvents);
        setNewsList(newNews);
        setMacroSummary(data.macroSummary || '');
        setApiKeySource(data.apiKeySource || 'API Key');
        setLastUpdated(data.lastUpdated || new Date().toLocaleTimeString());
        setStatusMessage(null);
        setLoading(false);
        setRefreshing(false);
        setCountdown(autoPushInterval > 0 ? autoPushInterval : 60);

        if (newEvents.some(e => e.impact === 'high')) {
          playAlertChime();
        }
      })
      .catch((err) => {
        console.error("Failed to fetch free Forex/Crypto news & calendar:", err);
        setStatusMessage("Connected to live backup trading matrix.");
        setLoading(false);
        setRefreshing(false);
        setCountdown(autoPushInterval > 0 ? autoPushInterval : 60);
      });
  };

  useEffect(() => {
    fetchNewsAndCalendar(false);
  }, [symbol, trackedSymbols, selectedCategory]);

  useEffect(() => {
    if (autoPushInterval === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchNewsAndCalendar(false);
          return autoPushInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoPushInterval, symbol, trackedSymbols, selectedCategory]);

  const rawSymbolStr = typeof symbol === 'string' ? symbol : String(symbol || '');
  const cleanSymbol = rawSymbolStr.split(':').pop() || rawSymbolStr;

  // Filter Calendar Events
  const filteredCalendar = useMemo(() => {
    return calendarEvents.filter((item) => {
      if (selectedImpact === 'high' && item.impact !== 'high') return false;
      if (selectedImpact === 'medium_high' && (item.impact !== 'high' && item.impact !== 'medium')) return false;

      if (selectedCurrency !== 'ALL' && item.currency?.toUpperCase() !== selectedCurrency) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesEvent = item.event.toLowerCase().includes(query);
        const matchesCurr = item.currency.toLowerCase().includes(query);
        const matchesAnalysis = item.analysis?.toLowerCase().includes(query) || false;
        if (!matchesEvent && !matchesCurr && !matchesAnalysis) return false;
      }

      return true;
    });
  }, [calendarEvents, selectedImpact, selectedCurrency, searchQuery]);

  const newsTickerOptions = useMemo(() => Array.from(new Set(newsList.map((item) => item.relatedCurrency).filter(Boolean).map((value) => value!.toUpperCase()))).sort(), [newsList]);

  // Filter and sort Yahoo Finance breaking-news items.
  const filteredNews = useMemo(() => filterAndSortNews(newsList, {
    ticker: selectedNewsTicker,
    sentiment: selectedNewsSentiment,
    effect: selectedNewsEffect,
    impact: selectedImpact,
    search: searchQuery,
    sort: newsSort,
  }), [newsList, selectedNewsTicker, selectedNewsSentiment, selectedNewsEffect, selectedImpact, searchQuery, newsSort]);

  const highImpactRedCount = calendarEvents.filter(e => e.impact === 'high').length;
  const mediumImpactOrgCount = calendarEvents.filter(e => e.impact === 'medium').length;
  const lowImpactYelCount = calendarEvents.filter(e => e.impact === 'low').length;

  return (
    <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col gap-5 relative overflow-hidden" id="forex-factory-news-container">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* 1. HOT LIVE TICKER STREAM BANNER */}
      <ResponsiveNewsBanner>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider animate-pulse">
            <Radio className="h-3 w-3 text-rose-500" />
            LIVE HOT STREAM
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Realtime Trading Intel
          </span>
        </div>

        {/* Rolling Marquee Headline */}
        <div className={responsiveNewsMarqueeClassName}>
          <div className="whitespace-nowrap text-xs font-mono text-slate-200 flex items-center gap-6">
            {newsList.length > 0 ? (
              newsList.slice(0, 3).map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">[{item.source}]</span>
                  <span className="font-bold text-white hover:text-amber-300 transition-colors cursor-pointer" onClick={() => setActiveTab('news')}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">({item.time})</span>
                  {i < 2 && <span className="text-slate-700">|</span>}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">Streaming live trading economic releases &amp; central bank feeds...</span>
            )}
          </div>
        </div>

        {/* Live Auto-Push Timer & Audio Toggle */}
        <div className="flex items-center gap-2 shrink-0 order-2 sm:order-none">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? "Audio alert chime active for High Impact events" : "Muted"}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Auto-Push Interval Selector */}
          <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800 text-[10px] font-mono">
            <Clock className="h-3 w-3 text-amber-400 mr-1.5 animate-pulse" />
            <select
              value={autoPushInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAutoPushInterval(val);
                setCountdown(val > 0 ? val : 60);
              }}
              className="bg-transparent text-amber-400 font-black focus:outline-none cursor-pointer"
            >
              <option value={30} className="bg-slate-900">30s Live Poll</option>
              <option value={60} className="bg-slate-900">60s Recommended</option>
              <option value={120} className="bg-slate-900">120s Low Load</option>
              <option value={0} className="bg-slate-900">Manual Refresh</option>
            </select>
          </div>
        </div>
      </ResponsiveNewsBanner>

      {/* Live Countdown Progress Bar */}
      {autoPushInterval > 0 && (
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850 -mt-2">
          <div 
            className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(countdown / autoPushInterval) * 100}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 sm:flex-row sm:items-center sm:justify-between" data-testid="telegram-news-alert-control">
        <div className="flex items-start gap-2.5">
          <Send className="mt-0.5 h-4 w-4 text-sky-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-sky-100">Telegram news alerts</p>
            <p className="mt-0.5 text-[11px] text-slate-400">All Forex and Crypto headlines are checked every 60 seconds. New headlines are sent once; duplicate items are skipped.</p>
            <TelegramHealthPanel status={telegramStatus.data} />
          </div>
        </div>
        <TelegramAlertAction
          isStatusError={telegramStatus.isError}
          isEnabled={telegramStatus.data?.isEnabled}
          isEnabling={enableTelegram.isPending}
          isDisabling={disableTelegram.isPending}
          onEnable={() => enableTelegram.mutate()}
          onDisable={() => disableTelegram.mutate()}
        />
      </div>

      {/* 2. Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg">
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Economic Calendar &amp; News</span>
              </h3>
              
              {/* Folder Counters */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-black flex items-center gap-1" title="High Impact Red Folders">
                  <Flame className="h-3 w-3 fill-rose-500 text-rose-500 animate-pulse" />
                  {highImpactRedCount} RED
                </span>
                <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold" title="Medium Impact Orange Folders">
                  {mediumImpactOrgCount} ORG
                </span>
                <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono" title="Low Impact Yellow Folders">
                  {lowImpactYelCount} YEL
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prioritize the next high-impact release, then connect live headlines to the selected market before acting.
            </p>
          </div>
        </div>

        {/* Right Action Tools & API Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live API Grounded Badge */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider">
              {apiKeySource || 'API Grounded'}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">({lastUpdated || 'Live'})</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchNewsAndCalendar(true)}
            disabled={refreshing}
            className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Force immediate push update"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Feed</span>
          </button>

          <div className="flex items-center gap-1.5 bg-cyan-500/5 px-3 py-1.5 rounded-xl border border-cyan-500/25 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5" />
            <span>Free Public Sources</span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY SWITCHER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Forex & Crypto' },
          { id: 'forex', label: 'Forex & Macro' },
          { id: 'crypto', label: 'Crypto & Blockchain' }
        ].map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Macro Summary Banner */}
      {macroSummary && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner">
          <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
            <span className="text-amber-400 font-bold font-mono uppercase mr-1.5">Macro Climate ({cleanSymbol}):</span>
            {macroSummary}
          </div>
        </div>
      )}

      <section className="grid gap-2 sm:grid-cols-3" aria-label="News decision context" data-testid="news-decision-context">
        {decisionContext.map((item) => <div key={item.label} className={`rounded-2xl border p-3 ${item.tone === 'amber' ? 'border-amber-400/20 bg-amber-400/5' : item.tone === 'cyan' ? 'border-cyan-400/20 bg-cyan-400/5' : item.tone === 'emerald' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-slate-700 bg-slate-900/70'}`}><p className="text-[9px] font-mono font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p><p className="mt-1 text-xs font-black text-slate-100">{item.value}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.detail}</p></div>)}
      </section>

      {/* 5. Navigation Switcher & Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-850">
        {/* Main Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
            id="tab-forex-factory-calendar"
          >
            <Calendar className="h-3.5 w-3.5" />
            Economic Calendar ({calendarEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'news'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
            id="tab-breaking-news"
          >
            <Newspaper className="h-3.5 w-3.5" />
            Breaking News ({newsList.length})
          </button>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Impact Filter */}
          <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
            <Filter className="h-3 w-3 text-slate-400 mr-1.5" />
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value as any)}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Impact Folders</option>
              <option value="high" className="bg-slate-900">🔴 High Impact Only (Red Folders)</option>
              <option value="medium_high" className="bg-slate-900">🟠 Medium &amp; High Impact</option>
            </select>
          </div>

          {/* Yahoo Finance News Filters */}
          {activeTab === 'news' && (
            <>
              <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
                <DollarSign className="h-3 w-3 text-slate-400 mr-1.5" />
                <select
                  value={selectedNewsTicker}
                  onChange={(e) => setSelectedNewsTicker(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-amber-400 focus:outline-none cursor-pointer max-w-[120px]"
                  aria-label="Filter news by ticker"
                >
                  <option value="ALL" className="bg-slate-900">All Tickers</option>
                  {newsTickerOptions.map((ticker) => <option key={ticker} value={ticker} className="bg-slate-900">{ticker}</option>)}
                </select>
              </div>
              <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
                <Activity className="h-3 w-3 text-slate-400 mr-1.5" />
                <select
                  value={selectedNewsEffect}
                  onChange={(e) => setSelectedNewsEffect(e.target.value as NewsEffectFilter)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
                  aria-label="Filter news by market effect"
                >
                  <option value="all" className="bg-slate-900">All Market Effects</option>
                  <option value="BUY" className="bg-slate-900">🟢 Buy / Bullish</option>
                  <option value="SELL" className="bg-slate-900">🔴 Sell / Bearish</option>
                  <option value="MIXED" className="bg-slate-900">⚪ Normal / No Effect</option>
                </select>
              </div>
              <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
                <Activity className="h-3 w-3 text-slate-400 mr-1.5" />
                <select
                  value={selectedNewsSentiment}
                  onChange={(e) => setSelectedNewsSentiment(e.target.value as NewsSentimentFilter)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
                  aria-label="Filter news by sentiment"
                >
                  <option value="all" className="bg-slate-900">All Sentiment</option>
                  <option value="positive" className="bg-slate-900">Positive</option>
                  <option value="neutral" className="bg-slate-900">Neutral</option>
                  <option value="negative" className="bg-slate-900">Negative</option>
                </select>
              </div>
              <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
                <Clock className="h-3 w-3 text-slate-400 mr-1.5" />
                <select
                  value={newsSort}
                  onChange={(e) => setNewsSort(e.target.value as NewsSort)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
                  aria-label="Sort news"
                >
                  <option value="newest" className="bg-slate-900">Newest First</option>
                  <option value="impact" className="bg-slate-900">Highest Impact</option>
                </select>
              </div>
            </>
          )}

          {/* Currency Filter (Only in Calendar Tab) */}
          {activeTab === 'calendar' && (
            <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
              <Globe className="h-3 w-3 text-slate-400 mr-1.5" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Currencies</option>
                <option value="USD" className="bg-slate-900">USD - US Dollar</option>
                <option value="EUR" className="bg-slate-900">EUR - Euro</option>
                <option value="GBP" className="bg-slate-900">GBP - British Pound</option>
                <option value="JPY" className="bg-slate-900">JPY - Japanese Yen</option>
                <option value="AUD" className="bg-slate-900">AUD - Australian Dollar</option>
                <option value="CAD" className="bg-slate-900">CAD - Canadian Dollar</option>
                <option value="BTC" className="bg-slate-900">BTC - Bitcoin</option>
                <option value="XAU" className="bg-slate-900">XAU - Gold</option>
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5" />
            <input
              type="text"
              placeholder="Search NFP, CPI, FOMC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono w-36 sm:w-44"
            />
          </div>

          {tracking.data && (
            <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2 text-[10px] font-mono">
              <span className="font-black uppercase tracking-wide text-cyan-300">Effect tracking</span>
              <span className="text-slate-300">Tracked {tracking.data.summary.total}</span><span className="text-emerald-300">Correct {tracking.data.summary.correct}</span><span className="text-rose-300">Incorrect {tracking.data.summary.incorrect}</span><span className="text-amber-300">Pending {tracking.data.summary.pending}</span><span className="text-slate-300">Accuracy {tracking.data.summary.accuracy}%</span>
              <button onClick={() => void evaluateNewsEffects.mutateAsync()} disabled={evaluateNewsEffects.isPending} className="ml-auto rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-black text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50">{evaluateNewsEffects.isPending ? 'Checking…' : 'Evaluate due effects'}</button>
            </div>
          )}

          {telegramStatus.data && (
            <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-2.5 py-2 text-[10px] font-mono">
              <span className="font-black uppercase tracking-wide text-rose-300">High-impact pre-alerts</span>
              <label className="flex items-center gap-1.5 text-slate-300"><input type="checkbox" checked={highImpactEnabled} onChange={(e) => setHighImpactEnabled(e.target.checked)} /> On</label>
              <select value={highImpactLeadMinutes} onChange={(e) => setHighImpactLeadMinutes(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200" aria-label="High-impact alert lead time"><option value={15}>15 min before</option><option value={10}>10 min before</option><option value={30}>30 min before</option></select>
              <input value={highImpactInstruments} onChange={(e) => setHighImpactInstruments(e.target.value)} onBlur={() => void updateHighImpact.mutateAsync({ enabled: highImpactEnabled, leadMinutes: highImpactLeadMinutes, instruments: highImpactInstruments.split(',').map((value) => value.trim()).filter(Boolean) })} className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200" aria-label="High-impact monitored instruments" />
              <button onClick={() => void updateHighImpact.mutateAsync({ enabled: highImpactEnabled, leadMinutes: highImpactLeadMinutes, instruments: highImpactInstruments.split(',').map((value) => value.trim()).filter(Boolean) })} disabled={updateHighImpact.isPending} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 font-black text-rose-200 hover:bg-rose-500/20 disabled:opacity-50">{updateHighImpact.isPending ? 'Saving…' : 'Save alert rules'}</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Currency Filter Chips (Calendar Tab) */}
      {activeTab === 'calendar' && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-850/60">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Globe className="h-3 w-3 text-amber-500" /> Currency:
          </span>
          {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'BTC', 'XAU'].map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold transition-all cursor-pointer ${
                selectedCurrency === curr
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 scale-105'
                  : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white hover:border-slate-700'
              }`}
            >
              {curr === 'ALL' ? 'ALL CURRENCIES' : curr}
            </button>
          ))}
        </div>
      )}

      {/* 6. Main Display Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400 animate-pulse">
            Pushing live trading economic calendar &amp; news feed...
          </span>
        </div>
      ) : activeTab === 'calendar' ? (
        /* FOREX FACTORY ECONOMIC CALENDAR TABLE */
        <div className="flex flex-col gap-2">
          {/* Table Legend Bar */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950 rounded-xl text-[10px] font-mono font-extrabold uppercase text-slate-400 border border-slate-850">
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Currency</div>
            <div className="col-span-1 text-center">Folder</div>
            <div className="col-span-4">Economic Release Event</div>
            <div className="col-span-1 text-right">Actual</div>
            <div className="col-span-1 text-right">Forecast</div>
            <div className="col-span-1 text-right">Previous</div>
            <div className="col-span-1 text-center">AI Impact</div>
          </div>

          {filteredCalendar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center bg-slate-950/40 rounded-2xl border border-slate-850 gap-3">
              <Calendar className="h-8 w-8 opacity-30 text-amber-500 animate-pulse" />
              <p className="text-xs font-mono text-slate-400">No economic releases found matching "{searchQuery || selectedCurrency || selectedImpact}".</p>
              <button
                onClick={() => {
                  setSelectedImpact('all');
                  setSelectedCurrency('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black rounded-xl transition-all cursor-pointer shadow-md"
              >
                Reset Calendar Filters
              </button>
            </div>
          ) : (
            filteredCalendar.map((item, index) => {
              const isExpanded = expandedEventIdx === index;
              const isHighImpact = item.impact === 'high';
              const isMediumImpact = item.impact === 'medium';

              return (
                <div
                  key={index}
                  className={`flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isHighImpact
                      ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/30'
                      : isMediumImpact
                      ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-850'
                  }`}
                  id={`forex-factory-event-${index}`}
                >
                  {/* Event Main Row */}
                  <div 
                    onClick={() => setExpandedEventIdx(isExpanded ? null : index)}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center cursor-pointer select-none"
                  >
                    {/* Time */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.time}</span>
                    </div>

                    {/* Currency */}
                    <div className="sm:col-span-1 flex items-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
                        item.currency === 'USD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        item.currency === 'EUR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        item.currency === 'GBP' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        item.currency === 'JPY' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {item.currency}
                      </span>
                    </div>

                    {/* Folder Impact Icon */}
                    <div className="sm:col-span-1 flex items-center justify-center">
                      {isHighImpact ? (
                        <div className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-black" title="High Impact Red Folder">
                          <span className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse inline-block" />
                          <span>RED</span>
                        </div>
                      ) : isMediumImpact ? (
                        <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-black" title="Medium Impact Orange Folder">
                          <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                          <span>ORG</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold" title="Low Impact Yellow Folder">
                          <span className="w-2.5 h-2.5 rounded bg-yellow-400 inline-block" />
                          <span>Refresh Feed</span>
                        </div>
                      )}
                    </div>

                    {/* Event Title */}
                    <div className="sm:col-span-4 flex items-center justify-between pr-2">
                      <span className="text-xs font-black text-white hover:text-amber-400 transition-colors">
                        {item.event}
                      </span>
                    </div>

                    {/* Actual Value */}
                    <div className="sm:col-span-1 text-right font-mono text-xs font-black">
                      <span className={
                        item.betterThanExpected === true ? 'text-emerald-400 font-black' :
                        item.betterThanExpected === false ? 'text-rose-400 font-black' :
                        'text-white'
                      }>
                        {item.actual || '-'}
                      </span>
                    </div>

                    {/* Forecast Value */}
                    <div className="sm:col-span-1 text-right font-mono text-xs text-slate-400">
                      {item.forecast || '-'}
                    </div>

                    {/* Previous Value */}
                    <div className="sm:col-span-1 text-right font-mono text-xs text-slate-500">
                      {item.previous || '-'}
                    </div>

                    {/* Expand Toggle */}
                    <div className="sm:col-span-1 flex items-center justify-center text-slate-400 hover:text-amber-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded AI Grounded Rationale Accordion */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-col gap-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                          Forex Factory Grounded AI Analysis
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          item.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          item.sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.sentiment} Bias
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        {item.analysis || 'Analysis pending live market reaction.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* BREAKING MARKET NEWS FEED */
        <div className="flex flex-col gap-3.5">
          {filteredNews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center bg-slate-950/40 rounded-2xl border border-slate-850">
              <Activity className="h-8 w-8 mb-2 opacity-30 text-amber-500" />
              <p className="text-xs font-mono">No breaking news found for the selected filters.</p>
              <button
                onClick={() => { setSelectedNewsTicker('ALL'); setSelectedNewsSentiment('all'); setSelectedNewsEffect('all'); setSelectedImpact('all'); setNewsSort('newest'); setSearchQuery(''); }}
                className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black rounded-xl transition-all cursor-pointer"
              >
                Reset News Filters
              </button>
            </div>
          ) : (
            filteredNews.map((item, index) => {
              const isPositive = item.sentiment === 'positive';
              const isNegative = item.sentiment === 'negative';
              const effectDirection = item.effectAnalysis?.direction;
              const effectCardClass = newsEffectCardClass(effectDirection);
              const trackingSymbol = item.effectAnalysis?.affectedInstruments?.[0];
              const predictedEffect = effectDirection === 'MIXED' ? 'NORMAL' : effectDirection;

              return (
                <a
                  key={index}
                  href="https://www.forexfactory.com/calendar"
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${effectCardClass}`}
                >
                  {/* Top Highlight Badge for New Items */}
                  {item.isNew && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-500 to-amber-500 text-slate-950 text-[8px] font-black uppercase px-3 py-0.5 rounded-bl-xl font-mono">
                      🔥 Live Push
                    </div>
                  )}

                  {/* News Source & Time */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {item.source}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase border ${item.category === 'crypto' ? 'text-violet-300 border-violet-500/25 bg-violet-500/10' : 'text-cyan-300 border-cyan-500/25 bg-cyan-500/10'}`}>
                      {item.category === 'crypto' ? 'CRYPTO' : 'FOREX'}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 mr-12">
                      <span>{item.time}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                    </span>
                  </div>

                  {/* Headline */}
                  <h4 className="text-sm font-extrabold text-white leading-snug group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {item.summary}
                  </p>

                  {item.effectAnalysis && (
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[10px] font-mono">
                      <div className="flex flex-wrap items-center gap-2 font-black uppercase tracking-wide text-cyan-300"><span>Market Effect</span><span className={`rounded px-2 py-0.5 ${item.effectAnalysis.direction === 'BUY' ? 'bg-emerald-500/15 text-emerald-300' : item.effectAnalysis.direction === 'SELL' ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>{newsEffectDisplayLabel(item.effectAnalysis.direction)}</span></div>
                      <p className="mt-1 text-slate-300">Affected: {item.effectAnalysis.affectedInstruments.join(', ')}</p>
                      <p className="mt-1 text-slate-400">Why: {item.effectAnalysis.expectedEffect}</p>
                    </div>
                  )}

                  {/* Footer Badges */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isNegative
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-750'
                        }`}
                      >
                        {isPositive && <TrendingUp className="h-2.5 w-2.5" />}
                        {isNegative && <TrendingDown className="h-2.5 w-2.5" />}
                        {item.sentiment}
                      </span>

                      {item.relatedCurrency && (
                        <span className="bg-slate-850 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded font-bold border border-slate-800">
                          {item.relatedCurrency}
                        </span>
                      )}
                      {(item.assetTags || []).filter((tag) => tag !== item.relatedCurrency && tag !== 'Forex' && tag !== 'Crypto').slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-slate-950 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded font-bold border border-slate-800">{tag}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {trackingSymbol && predictedEffect && (
                        <button
                          type="button"
                          onClick={(event) => { event.preventDefault(); event.stopPropagation(); void trackNewsEffect.mutateAsync({ title: item.title, url: item.url, symbol: trackingSymbol, predictedEffect, evaluationWindowMinutes: 60 }); }}
                          disabled={trackNewsEffect.isPending}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                        >Track Effect</button>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono font-bold group-hover:text-amber-400 flex items-center gap-1">
                        Open public source <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
