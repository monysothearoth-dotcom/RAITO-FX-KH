import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, HelpCircle, ArrowRight, CornerDownRight, Cpu, User, RefreshCw } from 'lucide-react';
import { MarketTicker } from '../types';
import { getKnowledgePromptContext, inferResearchDomain } from '../lib/marketKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actionDetected?: {
    type: string;
    symbol?: string;
    strategy?: string;
  };
}

interface AIAgentProps {
  activeTicker: MarketTicker;
  availableMarkets: MarketTicker[];
  selectedStrategy: string;
  onSwitchAsset: (symbol: string) => void;
  onSwitchStrategy: (strategy: string) => void;
}

const SUGGESTED_PROMPTS = [
  { text: "🏆 XAU/USD Institutional Signal Analysis (9-Concept Confluence)", label: "Institutional XAU/USD Signal" },
  { text: "Scan active asset using 9-Concept Confluence (SMC+ICT+MSNR)", label: "9-Concept Scan" },
  { text: "What are the key institutional liquidity pools for Gold?", label: "Gold Liquidity Pools" },
  { text: "Explain SMT Divergence & Order Block entries", label: "SMT & OB Strategy" }
];

export default function AIAgent({
  activeTicker,
  availableMarkets,
  selectedStrategy,
  onSwitchAsset,
  onSwitchStrategy
}: AIAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('raito_ai_agent_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map((message) => ({ ...message, text: typeof message?.text === 'string' ? message.text.replace(/NEXUS Core Institutional AI|NEXUS Core AI Agent|NEXUS Core/g, 'RAITO Agent') : message?.text }));
      }
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: `Hello! I am **RAITO Agent**, your market-research copilot for structured, evidence-led analysis.

I analyze market structure through our **9-Concept Analytical Framework**:
1. **SMC** (BOS/CHoCH & Inducements)
2. **ICT** (Killzones, FVG, OB & Silver Bullets)
3. **Price Action** (Wick exhaustion & momentum)
4. **Trendlines** (Retail liquidity traps)
5. **MSNR** (High-Timeframe S/R & Session Open/Closes)
6. **Order Flow** (Volume delta & absorption)
7. **Fibonacci** (OTE 61.8%-79% Premium/Discount)
8. **Supply & Demand** (Unmitigated origin blocks)
9. **SMT Divergence** (DXY / Silver correlation)

Try asking:
* "🏆 **XAU/USD Institutional Signal Analysis**"
* "Scan ${(typeof activeTicker?.name === 'string' ? activeTicker.name : String(activeTicker?.name || '')).split(' / ')[0]} using SMC + ICT"
* "Show me Gold chart"`
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto persist chat messages to localStorage so history is preserved across tab switching
  useEffect(() => {
    try {
      localStorage.setItem('raito_ai_agent_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleClearHistory = () => {
    const welcomeMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'assistant',
      text: `Chat history cleared. I am ready to analyze market charts or trading strategies for you.`
    };
    setMessages([welcomeMsg]);
    try {
      localStorage.removeItem('raito_ai_agent_messages');
    } catch {}
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/market-watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: activeTicker.symbol,
          strategy: selectedStrategy,
          currentPrice: activeTicker.price,
          timeframe: '1h',
          customPrompt: `${getKnowledgePromptContext(inferResearchDomain(activeTicker.symbol))} User question: ${textToSend}`
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      
      const signalSummary = data.recommendation ? `\n\n**Unified Market Watch:** ${data.recommendation} · ${data.confidence}% confidence\n**Entry:** ${data.entryPrice} · **Stop:** ${data.stopLoss} · **Take Profit:** ${data.takeProfit}\n**Consensus:** ${data.agreementPercent || 0}% agreement across ${data.providersAnalyzed?.length || 0} providers\n**Risk:** ${data.warning || 'Review the provider warnings before acting.'}` : '';
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        text: `${data.consensusRationale || 'Unified Market Watch completed the live-chart analysis.'}${signalSummary}`
      };

      if (data.action) {
        assistantMsg.actionDetected = data.action;
        
        // Execute Action Commands directly on frontend!
        setTimeout(() => {
          if (data.action.type === 'SWITCH_ASSET' || data.action.type === 'BOTH') {
            if (data.action.symbol) {
              onSwitchAsset(data.action.symbol);
            }
          }
          if (data.action.type === 'SWITCH_STRATEGY' || data.action.type === 'BOTH') {
            if (data.action.strategy) {
              onSwitchStrategy(data.action.strategy);
            }
          }
        }, 800);
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI Chat Agent error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          text: "I encountered an issue connecting to my core matrix brain. Please verify that your system is online and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 h-[480px]" id="ai-agent-chat-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5">
              RAITO Agent
            </h2>
            <p className="text-[10px] text-slate-500">Natural Language Trading Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="text-[10px] text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 px-2 py-1 rounded-lg transition-all cursor-pointer font-medium"
            title="Clear Chat History"
            id="clear-chat-history-btn"
          >
            Clear History
          </button>
          <div className="hidden sm:flex items-center gap-1 bg-cyan-500/5 px-2 py-1 rounded-lg border border-cyan-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest">Unified Watch</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-850">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Online</span>
          </div>
        </div>
      </div>

      {/* Message History area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 max-h-[280px] no-scrollbar scroll-smooth"
        id="ai-agent-messages-box"
      >
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAssistant ? '' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-[10px]">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
              )}
              
              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div
                  className={`p-3 rounded-2xl text-[11px] leading-relaxed break-words border ${
                    isAssistant
                      ? 'bg-slate-950/60 border-slate-850 text-slate-200'
                      : 'bg-amber-500 border-amber-600 text-slate-950 font-medium'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {/* Action Commands feedback */}
                  {msg.actionDetected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-amber-500 flex items-center gap-1.5 font-semibold">
                      <CornerDownRight className="h-3 w-3 animate-bounce" />
                      <span>
                        Executing terminal command: {msg.actionDetected.type === 'BOTH' ? 'Switch Asset & Strategy' : msg.actionDetected.type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {!isAssistant && (
                <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 text-[10px]">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
            </div>
            <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-2xl text-[10px] text-slate-400 font-mono tracking-wider animate-pulse uppercase">
              RAITO Agent is compiling the market context...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Quick Commands
        </span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p.text)}
              disabled={loading}
              className="text-[10px] bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg shrink-0 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 mt-auto"
        id="ai-agent-input-form"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RAITO Agent, e.g. 'SMC scan XAUUSD' or 'summarize macro risk'..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-850 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors duration-200 disabled:opacity-50"
          id="ai-agent-chat-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 hover:text-black p-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40"
          id="ai-agent-submit-btn"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
