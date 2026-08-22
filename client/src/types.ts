export type MarketCategory = 'all' | 'forex' | 'crypto' | 'stocks' | 'oils';

export interface MachineFeatureMatrix {
  is_fvg_present: number;           // 1 or 0
  liquidity_swept: number;          // 1 or 0
  market_structure_shift: number;   // 1 or 0
  active_killzone: 'LONDON_KILLZONE' | 'NEW_YORK_KILLZONE' | 'ASIAN_SESSION' | 'OFF_SESSION';
  atr_value: number;
  volatility_regime: 'COMPRESSING' | 'EXPANDING' | 'STABLE';
}

export interface TripleBarrierSetup {
  upperBarrierTP: number;           // Barrier 1: Dynamic TP (1.5x - 3.0x ATR)
  lowerBarrierSL: number;           // Barrier 2: Dynamic Invalidation Level
  verticalBarrierHours: number;     // Barrier 3: Time Decay Expiration (Hours)
  timeDecayLimit: string;
}

export interface ExecutionRealities {
  rawSpread: number;
  standardSpread: number;
  spreadPenaltyDeducted: number;
  expectedMove: number;
  isViableAfterSpread: boolean;
  spreadImpactNote: string;
}

export interface MetaLabelingEngine {
  baseModelSignal: 'BUY' | 'SELL';
  baseModelStrategy: string;
  metaModelWinProbability: number;  // 0% - 100%
  metaFilterStatus: 'PASSED_A_PLUS' | 'FILTERED_OUT' | 'MARGINAL_ACCEPT';
  metaModelScoreReason: string;
}

export interface MacroCorrelatedMetrics {
  dxyVelocity: string;
  dxyCorrelationScore: number;
  us10yYieldMomentum: string;
  is_nfp_day: number;              // 1 or 0
  is_cpi_day: number;              // 1 or 0
  is_fomc_day: number;             // 1 or 0
  economicEventSummary: string;
}

export interface SignalReport {
  symbol: string;
  strategy: string;
  recommendation: 'BUY' | 'SELL';
  confidence: number;
  winRateEstimate?: number;
  validationGrade?: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit1?: number;
  takeProfit2?: number;
  takeProfit3?: number;
  confluenceFactors?: string[];
  thinkingProcess?: string;
  rationale: string;
  institutionalFramework?: {
    executionWindow?: string;
    bias?: string;
    rrRatio?: string;
    smcIctPriceAction?: string;
    fibMsnrSupplyDemand?: string;
    liquidityOrderFlowTrendlines?: string;
    smtDivergence?: string;
    invalidationAndRisk?: string;
    confluenceCount?: number;
    isNoTrade?: boolean;
  };
  machineFeatures?: MachineFeatureMatrix;
  tripleBarrier?: TripleBarrierSetup;
  executionRealities?: ExecutionRealities;
  metaLabeling?: MetaLabelingEngine;
  macroCorrelated?: MacroCorrelatedMetrics;
  indicators: Array<{ name: string; value: string }>;
  warning?: string;
  isLiveAI?: boolean;
  apiKeySource?: string;
  modelUsed?: string;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
  watchMode?: "unified" | string;
  agreementPercent?: number;
  providerVotes?: { BUY: number; SELL: number };
  providersAnalyzed?: string[];
  providerStatuses?: Array<{ provider: string; status: "ok" | "failed"; recommendation?: "BUY" | "SELL"; error?: string }>;
  consensusRationale?: string;
  bestSetupOnly?: boolean;
  selectedProvider?: string;
  setupScore?: number;
  riskReward?: number;
  selectionReason?: string;
  eventEvidence?: {
    status: 'upcoming_high_impact' | 'no_upcoming_high_impact' | 'unavailable';
    checkedAt: number;
    horizonHours: number;
    source: string;
    highImpactEvents: Array<{ event: string; currency: string; scheduledAt: number; minutesUntil: number }>;
  };
  headlineEvidence?: {
    status: 'available' | 'no_relevant_headlines' | 'unavailable' | 'not_requested';
    sourceFailures: string[];
    headlines: Array<{ title: string; source: string; timestamp: number; category: string; relatedCurrency: string }>;
  };
}

export interface MarketTicker {
  symbol: string;         // TradingView symbol, e.g., "NASDAQ:AAPL"
  name: string;           // Readable name, e.g., "Apple Inc."
  category: MarketCategory;
  price: number;          // Current price
  change: number;         // 24h change value
  changePercent: number;  // 24h change percent
  high: number;
  low: number;
  volume: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  category: MarketCategory;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface JournalEntry {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  strategy: string;
  entryPrice: number;
  exitPrice?: number;
  size: number;
  pnl?: number;
  status: 'WIN' | 'LOSS' | 'ACTIVE';
  screenshotUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface SignalLogEntry {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  strategy: string;
  entryPrice: number;
  exitTargetPrice: number;
  stopLossPrice: number;
  projectedWinRate?: number;
  projectedRrRatio?: string;
  actualExitPrice?: number;
  actualStatus: 'TARGET_HIT' | 'STOPPED_OUT' | 'IN_PROGRESS';
  actualPerformancePercent?: number;
  notes?: string;
  createdAt: string;
  evaluatedAt?: string;
}
