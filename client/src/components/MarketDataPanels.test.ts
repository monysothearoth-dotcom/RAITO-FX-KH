import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'client/src/components/MarketDataPanels.tsx'), 'utf8');
const paperSource = readFileSync(resolve(process.cwd(), 'client/src/components/PaperTradingPanel.tsx'), 'utf8');

describe('market validation panel contracts', () => {
  it('exposes macro and crypto public data endpoints with refresh behavior', () => {
    expect(source).toContain('/api/macro-indicators');
    expect(source).toContain('/api/crypto-metrics');
    expect(source).toContain('15 * 60 * 1000');
    expect(source).toContain('60 * 1000');
    expect(source).toContain('FRED PUBLIC');
    expect(source).toContain('Upcoming token unlocks');
    expect(source).toContain('indicators.payrolls');
    expect(source).toContain('Bitcoin network only');
    expect(source).toContain("onChain?.network === 'Bitcoin'");
  });

  it('captures selected setups and exposes paper-trade lifecycle controls', () => {
    expect(paperSource).toContain('raito_auto_log_signal');
    expect(paperSource).toContain('trpc.paperTrades.open.useMutation');
    expect(paperSource).toContain('trpc.paperTrades.close.useMutation');
    expect(paperSource).toContain('TARGET_HIT');
    expect(paperSource).toContain('STOPPED_OUT');
  });
});
