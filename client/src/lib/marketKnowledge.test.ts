import { describe, expect, it } from 'vitest';
import { filterResearchModules, getKnowledgePromptContext, inferResearchDomain, RESEARCH_MODULES } from './marketKnowledge';

describe('market research knowledge layer', () => {
  it('filters modules by Forex and Crypto domain', () => {
    expect(filterResearchModules(RESEARCH_MODULES, 'forex', '').every((module) => module.domain === 'forex' || module.domain === 'shared')).toBe(true);
    expect(filterResearchModules(RESEARCH_MODULES, 'crypto', '').some((module) => module.id === 'crypto-fundamentals')).toBe(true);
  });

  it('infers research domain from the active market symbol', () => {
    expect(inferResearchDomain('BINANCE:BTCUSDT')).toBe('crypto');
    expect(inferResearchDomain('OANDA:EURUSD')).toBe('forex');
  });

  it('grounds the AI prompt in evidence, invalidation, and no-guarantee rules', () => {
    const context = getKnowledgePromptContext('crypto');
    expect(context).toContain('Never invent data');
    expect(context).toContain('structural invalidation');
    expect(context).toContain('verify the calendar state');
    expect(context).toContain('never promise profit or a win rate');
    expect(context).toContain('Crypto Fundamental Due Diligence');
    expect(context).toContain('Evidence, Event & Uncertainty Discipline');
  });
});
