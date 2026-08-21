export type ResearchDomain = 'forex' | 'crypto' | 'shared';

export interface ResearchModule {
  id: string;
  domain: ResearchDomain;
  title: string;
  level: 'Foundation' | 'Execution' | 'Advanced';
  summary: string;
  lessons: string[];
  checklist: string[];
  sourceLabel: string;
  sourceUrl: string;
}

export const RESEARCH_MODULES: ResearchModule[] = [
  {
    id: 'shared-market-structure', domain: 'shared', title: 'Market Structure & Regimes', level: 'Foundation',
    summary: 'Read trend, range, expansion, contraction, liquidity, and invalidation before selecting a setup.',
    lessons: ['Define the higher-timeframe bias from swing structure, not a single indicator.', 'Mark displacement, consolidation, equal highs/lows, and obvious liquidity pools.', 'Classify the regime as trend, range, breakout, or event-driven; use no-trade conditions when structure is unclear.'],
    checklist: ['Higher-timeframe direction agrees with execution timeframe.', 'Entry has a visible invalidation level.', 'Reward-to-risk is measured before the signal is accepted.'],
    sourceLabel: 'BIS FX market structure context', sourceUrl: 'https://www.bis.org/statistics/rpfx25.htm'
  },
  {
    id: 'shared-risk', domain: 'shared', title: 'Risk, Position Sizing & Invalidation', level: 'Foundation',
    summary: 'Treat risk control as part of the setup, not as an afterthought.',
    lessons: ['Define maximum account risk per idea before calculating position size.', 'Place stops at structural invalidation rather than arbitrary distance.', 'Separate signal confidence from position size; high confidence is never a guarantee.'],
    checklist: ['Stop, target, and spread/slippage assumptions are explicit.', 'One trade cannot create unacceptable portfolio concentration.', 'The setup is skipped when liquidity, spread, or event risk makes execution unreliable.'],
    sourceLabel: 'Educational risk framework', sourceUrl: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/ForexTradingRisks.html'
  },
  {
    id: 'forex-macro', domain: 'forex', title: 'Forex Macro Playbook', level: 'Execution',
    summary: 'Combine policy expectations, yield differentials, inflation, employment, and risk sentiment to explain currency pressure.',
    lessons: ['Track central-bank reaction functions: inflation, labor, growth, and financial conditions.', 'Compare rate expectations and yield differentials across the two currencies in a pair.', 'Treat CPI, employment, PMIs, central-bank decisions, and guidance as catalysts; compare actual against consensus and prior data.'],
    checklist: ['The pair has a clear base and quote-currency thesis.', 'The event calendar is checked for high-impact releases.', 'Price action confirms or rejects the macro thesis before entry.'],
    sourceLabel: 'Federal Reserve FOMC policy reference', sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm'
  },
  {
    id: 'forex-technical', domain: 'forex', title: 'Forex Technical Execution', level: 'Execution',
    summary: 'Use multi-timeframe structure, session behavior, volatility, and liquidity-aware entries for currency pairs.',
    lessons: ['Map Asia, London, and New York session ranges and watch for confirmed expansion rather than guessing breakouts.', 'Use ATR or realized range to prevent stops that are too tight for current volatility.', 'Require confluence between structure, momentum, and a defined retest or rejection.'],
    checklist: ['Spread and session conditions are suitable.', 'Breakout has displacement and follow-through, or the retest is clean.', 'The stop is beyond the liquidity sweep and the target is not inside opposing structure.'],
    sourceLabel: 'BIS FX market statistics', sourceUrl: 'https://www.bis.org/statistics/rpfx25.htm'
  },
  {
    id: 'crypto-fundamentals', domain: 'crypto', title: 'Crypto Fundamental Due Diligence', level: 'Execution',
    summary: 'Evaluate the asset, protocol, token economics, liquidity, adoption, and event risk before interpreting a chart.',
    lessons: ['Separate network utility from narrative momentum and identify what creates durable demand.', 'Review supply schedule, unlocks, emissions, staking, treasury, and concentration risks.', 'Track protocol upgrades, governance, exchange/liquidity conditions, stablecoin flows, and regulatory headlines as catalysts.'],
    checklist: ['Token supply and unlock calendar are known.', 'Liquidity and venue concentration are acceptable.', 'The fundamental thesis has a measurable invalidation condition.'],
    sourceLabel: 'Ethereum whitepaper and current-history warning', sourceUrl: 'https://ethereum.org/whitepaper/'
  },
  {
    id: 'crypto-onchain', domain: 'crypto', title: 'Crypto Market Microstructure', level: 'Advanced',
    summary: 'Use funding, open interest, liquidations, volume, basis, and on-chain activity to detect crowded positioning.',
    lessons: ['Interpret price, open interest, and funding together; rising price with crowded leverage is not automatically bullish.', 'Watch spot-led demand versus derivatives-led movement and identify liquidation cascades.', 'Treat on-chain metrics as context that requires a time window and a comparable baseline, not as a standalone trigger.'],
    checklist: ['Leverage and funding are consistent with the proposed direction.', 'Volume confirms the move rather than only wick-driven volatility.', 'A liquidation or funding reversal scenario is included in risk planning.'],
    sourceLabel: 'Bitcoin whitepaper: consensus and settlement foundations', sourceUrl: 'https://bitcoin.org/bitcoin.pdf'
  },
  {
    id: 'shared-signal-workflow', domain: 'shared', title: 'Signal Validation Workflow', level: 'Advanced',
    summary: 'A disciplined sequence for turning research into one auditable BUY/SELL setup.',
    lessons: ['Start with regime and higher-timeframe thesis, then add macro/fundamental context, then execution structure.', 'Require agreement between at least two independent evidence groups; do not double-count correlated indicators.', 'Return one setup only when entry, stop, target, expected risk/reward, and invalidation are coherent; otherwise report that no qualified setup is available.'],
    checklist: ['Context is live and timestamped.', 'The thesis explains both direction and invalidation.', 'The final setup is backtested or paper-tested before real capital is considered.'],
    sourceLabel: 'Research workflow assembled for this terminal', sourceUrl: 'https://www.bis.org/statistics/rpfx25.htm'
  }
];

export const MARKET_KNOWLEDGE_PROMPT_CONTEXT = `Use the terminal research library as a decision framework, not as a guarantee. For every live analysis: (1) classify regime and higher-timeframe structure; (2) incorporate relevant Forex macro or Crypto fundamental context; (3) confirm execution with price, volatility, liquidity, and multi-timeframe evidence; (4) define entry, structural invalidation, stop, target, and risk/reward; (5) reject setups with contradictory evidence, excessive event/liquidity risk, or missing live values. Never invent data, never promise profit, and return one BUY or SELL only when the strongest qualified setup is coherent.`;

export function getKnowledgePromptContext(domain: ResearchDomain = 'shared'): string {
  const relevant = RESEARCH_MODULES.filter((module) => module.domain === domain || module.domain === 'shared').map((module) => `${module.title}: ${module.summary}`).join(' | ');
  return `${MARKET_KNOWLEDGE_PROMPT_CONTEXT} Relevant modules: ${relevant}`;
}

export function filterResearchModules(modules: ResearchModule[], domain: ResearchDomain | 'all', query: string): ResearchModule[] {
  const normalized = query.trim().toLowerCase();
  return modules.filter((module) => {
    const domainMatch = domain === 'all' || module.domain === domain;
    const textMatch = !normalized || [module.title, module.summary, module.level, module.domain, ...module.lessons, ...module.checklist].join(' ').toLowerCase().includes(normalized);
    return domainMatch && textMatch;
  });
}

export function inferResearchDomain(symbol: string): 'forex' | 'crypto' {
  const value = symbol.toUpperCase();
  return value.includes('USDT') || value.includes('BTC') || value.includes('ETH') || value.includes('SOL') || value.includes('XRP') ? 'crypto' : 'forex';
}

export const RESEARCH_SOURCES = [
  { label: 'BIS 2025 FX Survey', url: 'https://www.bis.org/statistics/rpfx25.htm' },
  { label: 'Federal Reserve FOMC', url: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm' },
  { label: 'Bitcoin whitepaper', url: 'https://bitcoin.org/bitcoin.pdf' },
  { label: 'Ethereum whitepaper', url: 'https://ethereum.org/whitepaper/' },
];
