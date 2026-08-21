import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  Activity, 
  Globe, 
  HelpCircle, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  Sparkles
} from 'lucide-react';

interface ApiFeedSettingsProps {
  apiProvider: string;
  onProviderChange: (provider: string) => void;
  alphaVantageKey: string;
  onAlphaVantageKeyChange: (key: string) => void;
  coingeckoKey: string;
  onCoingeckoKeyChange: (key: string) => void;
  iexCloudKey: string;
  onIexCloudKeyChange: (key: string) => void;
  onForceRefresh: () => Promise<void>;
  currentSource: string;
  isRefreshing: boolean;
  simulatedTicksEnabled: boolean;
  onSimulatedTicksToggle: (enabled: boolean) => void;
}

export default function ApiFeedSettings({
  apiProvider,
  onProviderChange,
  alphaVantageKey,
  onAlphaVantageKeyChange,
  coingeckoKey,
  onCoingeckoKeyChange,
  iexCloudKey,
  onIexCloudKeyChange,
  onForceRefresh,
  currentSource,
  isRefreshing,
  simulatedTicksEnabled,
  onSimulatedTicksToggle
}: ApiFeedSettingsProps) {
  const [activeLog, setActiveLog] = useState<{ time: string; msg: string; type: 'info' | 'success' | 'warn' }[]>([]);
  const [showHelp, setShowHelp] = useState<string | null>(null);

  // Add a log entry helper
  const addLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setActiveLog(prev => [{ time: timestamp, msg, type }, ...prev].slice(0, 8));
  };

  // Log on initial load and source changes
  useEffect(() => {
    addLog(`Feed connection initialized. Active mode: "${apiProvider.toUpperCase()}"`, 'info');
  }, []);

  useEffect(() => {
    addLog(`Market source adjusted to: ${currentSource || 'Awaiting update'}`, 'success');
  }, [currentSource]);

  const handleManualTrigger = async () => {
    addLog('Initiating manual feed synchronization...', 'info');
    try {
      await onForceRefresh();
      addLog('Feed synchronized successfully with cloud servers', 'success');
    } catch {
      addLog('Synchronization warning: Server cache or connection limits', 'warn');
    }
  };

  return (
    <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-900/60 shadow-xl p-5 md:p-6" id="api-feed-settings-card">
      <div className="flex flex-col gap-6">
        
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">Real-Time Data Feed Integrations</h2>
              <p className="text-[11px] text-slate-500 leading-normal">Configure premium, real-time market API feeds &amp; credentials</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 bg-slate-900 border border-slate-850 rounded text-slate-400 flex items-center gap-1.5">
              Active Source: {isRefreshing || currentSource === 'Detecting...' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded animate-pulse text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-[9px]">Connecting...</span>
                </span>
              ) : (
                <span className="text-emerald-400 font-black">{currentSource}</span>
              )}
            </span>
            <button
              onClick={handleManualTrigger}
              disabled={isRefreshing}
              className="p-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Force Live Feed Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Selector & Keys */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Active Financial Feed Provider</span>
                <span className="text-[9px] text-emerald-500 font-semibold lowercase flex items-center gap-1">
                  <Activity className="h-3 w-3" /> multi-feed smart routing
                </span>
              </label>
              <select
                value={apiProvider}
                onChange={(e) => {
                  onProviderChange(e.target.value);
                  addLog(`Requested provider change to: ${e.target.value.toUpperCase()}`, 'info');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500/50 transition-all font-sans"
              >
                <option value="auto">Auto / Smart-Select (Recommended)</option>
                <option value="coingecko">CoinGecko (Cryptocurrencies)</option>
                <option value="alphavantage">Alpha Vantage (Forex, Stocks, Oils)</option>
                <option value="iexcloud">IEX Cloud (Enterprise Stocks)</option>
              </select>
            </div>

            {/* Simulated Ticks Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-300">Intraday Visual Micro-Ticks</span>
                <span className="text-[10px] text-slate-500">Enable organic, high-frequency tick simulations between API polls</span>
              </div>
              <button
                onClick={() => {
                  onSimulatedTicksToggle(!simulatedTicksEnabled);
                  addLog(`Intraday ticks toggled ${!simulatedTicksEnabled ? 'ON' : 'OFF'}`, 'info');
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  simulatedTicksEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    simulatedTicksEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Help / Informational notes */}
            <div className="bg-slate-900/30 border border-slate-900 p-3.5 rounded-xl flex items-start gap-2.5">
              <Globe className="h-4 w-4 text-slate-400 mt-0.5" />
              <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Reliable Financial API Fail-Safes</span>
                <p className="text-[10px] text-slate-500 leading-normal">
                  No account setup is required to get started. When credentials are not supplied, Raito-Fx queries integrated public endpoints of Binance, ExchangeRate, and Yahoo Finance to populate live, authentic assets and commodities!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Keys Input */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" /> Overwrite Provider API Keys
            </h3>

            {/* Alpha Vantage */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 font-mono">ALPHA_VANTAGE_API_KEY</span>
                <button
                  type="button"
                  onClick={() => setShowHelp(showHelp === 'av' ? null : 'av')}
                  className="text-[9px] font-semibold text-amber-500 hover:underline cursor-pointer"
                >
                  Get Free Key
                </button>
              </div>
              <input
                type="password"
                placeholder="Paste Alpha Vantage API key..."
                value={alphaVantageKey}
                onChange={(e) => onAlphaVantageKeyChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              />
              {showHelp === 'av' && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[10px] text-slate-400 leading-normal border border-slate-850 animate-fadeIn">
                  Alpha Vantage handles high-precision Forex and Stocks quotes. Generate a lifetime free API key in seconds at <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">alphavantage.co</a>.
                </div>
              )}
            </div>

            {/* CoinGecko */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 font-mono">COINGECKO_API_KEY</span>
                <button
                  type="button"
                  onClick={() => setShowHelp(showHelp === 'cg' ? null : 'cg')}
                  className="text-[9px] font-semibold text-amber-500 hover:underline cursor-pointer"
                >
                  Pro/Demo Key Info
                </button>
              </div>
              <input
                type="password"
                placeholder="Paste CoinGecko Demo/Pro API key (optional)..."
                value={coingeckoKey}
                onChange={(e) => onCoingeckoKeyChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              />
              {showHelp === 'cg' && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[10px] text-slate-400 leading-normal border border-slate-850 animate-fadeIn">
                  CoinGecko powers Raito's cryptocurrency metrics. No key is required for default public access, but Demo/Pro keys can be specified here to lift default request rate throttles.
                </div>
              )}
            </div>

            {/* IEX Cloud */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 font-mono">IEX_CLOUD_API_KEY</span>
                <button
                  type="button"
                  onClick={() => setShowHelp(showHelp === 'iex' ? null : 'iex')}
                  className="text-[9px] font-semibold text-amber-500 hover:underline cursor-pointer"
                >
                  IEX Cloud Help
                </button>
              </div>
              <input
                type="password"
                placeholder="Paste IEX Cloud API key..."
                value={iexCloudKey}
                onChange={(e) => onIexCloudKeyChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              />
              {showHelp === 'iex' && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[10px] text-slate-400 leading-normal border border-slate-850 animate-fadeIn">
                  IEX Cloud provides ultra-low latency enterprise stock data. Paste your IEX Cloud publishable token to pull stocks metrics from enterprise nodes.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Live Stream Terminal Logs */}
        <div className="flex flex-col gap-2 border-t border-slate-900 pt-5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-amber-500" /> Integration Node Terminal Monitor
            </span>
            <span className="text-[9px] lowercase font-normal text-slate-600">auto-prunes old packets</span>
          </div>
          
          <div className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[10px] flex flex-col-reverse gap-1.5 custom-scrollbar">
            {activeLog.length === 0 ? (
              <span className="text-slate-600 animate-pulse">Awaiting feed interactions...</span>
            ) : (
              activeLog.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="text-slate-600 select-none">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warn' ? 'text-amber-500 font-semibold' : 'text-slate-400'
                  }>
                    {log.type === 'success' && '✔ '}
                    {log.type === 'warn' && '⚠ '}
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
