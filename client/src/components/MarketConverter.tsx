import { useState, useEffect } from 'react';
import { MarketTicker } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { Calculator, ArrowRightLeft } from 'lucide-react';

interface MarketConverterProps {
  activeTicker: MarketTicker;
}

export default function MarketConverter({ activeTicker }: MarketConverterProps) {
  const { currency, formatVal } = useCurrency();
  const [amount, setAmount] = useState<number>(1);
  const [result, setResult] = useState<number>(0);

  const isForex = activeTicker.category === 'forex';
  const isCrypto = activeTicker.category === 'crypto';
  const isStock = activeTicker.category === 'stocks';
  const isOil = activeTicker.category === 'oils';

  const rawSym = typeof activeTicker?.symbol === 'string' ? activeTicker.symbol : String(activeTicker?.symbol || '');

  // Get units label
  let unitLabel = 'Units';
  if (isCrypto) {
    unitLabel = rawSym.split(':').pop()?.replace('USD', '').replace('USDT', '') || 'Tokens';
  } else if (isForex) {
    unitLabel = rawSym.split(':').pop()?.substring(0, 3) || 'Base Cur';
  } else if (isStock) {
    unitLabel = 'Shares';
  } else if (isOil) {
    if (rawSym.includes('OIL')) unitLabel = 'Barrels';
    else if (rawSym.includes('XAU')) unitLabel = 'Ounces (Gold)';
    else if (rawSym.includes('XAG')) unitLabel = 'Ounces (Silver)';
    else unitLabel = 'Units';
  }

  // Calculate result based on amount and ticker price
  useEffect(() => {
    setResult(amount * activeTicker.price);
  }, [amount, activeTicker.price]);

  return (
    <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-900/60 p-5 shadow-xl flex flex-col" id="market-converter-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-500">
          <Calculator className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Asset Calculator</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Input Field */}
        <div className="w-full sm:flex-1">
          <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
            Amount ({unitLabel})
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.0001"
              step="any"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              id="converter-amount-input"
            />
          </div>
        </div>

        {/* Swap visual */}
        <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-slate-500 mt-4 sm:mt-5">
          <ArrowRightLeft className="h-4 w-4 rotate-90 sm:rotate-0" />
        </div>

        {/* Output Field */}
        <div className="w-full sm:flex-1">
          <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">
            Equivalent ({currency})
          </label>
          <div className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-900/30 border border-slate-850 rounded-xl text-emerald-400 font-semibold flex items-center justify-between">
            <span>{formatVal(result, 'default')}</span>
            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-sans uppercase">{currency}</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 mt-3 italic text-center sm:text-left">
        * Estimates are calculated in real-time based on current live rates.
      </p>
    </div>
  );
}
