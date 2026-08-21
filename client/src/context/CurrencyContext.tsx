import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'USD - US Dollar', rateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR - Euro', rateToUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP - British Pound', rateToUSD: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'JPY - Japanese Yen', rateToUSD: 151.4 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'CAD - Canadian Dollar', rateToUSD: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar', rateToUSD: 1.53 },
  CHF: { code: 'CHF', symbol: 'CHF ', name: 'CHF - Swiss Franc', rateToUSD: 0.89 },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currencyInfo: CurrencyInfo;
  formatVal: (priceInUSD: number, category?: string, showSymbol?: boolean) => string;
  convertVal: (priceInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      return localStorage.getItem('raito_preferred_currency') || 'USD';
    } catch {
      return 'USD';
    }
  });

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem('raito_preferred_currency', code);
      } catch {}
    }
  };

  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;

  const convertVal = (priceInUSD: number): number => {
    return priceInUSD * currencyInfo.rateToUSD;
  };

  const formatVal = (
    priceInUSD: number,
    category: string = 'other',
    showSymbol: boolean = true
  ): string => {
    if (isNaN(priceInUSD) || priceInUSD === null || priceInUSD === undefined) {
      return showSymbol ? `${currencyInfo.symbol}0.00` : '0.00';
    }

    const converted = priceInUSD * currencyInfo.rateToUSD;
    const prefix = showSymbol ? currencyInfo.symbol : '';

    let formattedNumber = '';
    if (category === 'forex') {
      formattedNumber = converted.toFixed(4);
    } else if (Math.abs(converted) >= 1000) {
      formattedNumber = converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else if (Math.abs(converted) < 1 && Math.abs(converted) > 0) {
      formattedNumber = converted.toFixed(4);
    } else {
      formattedNumber = converted.toFixed(2);
    }

    return `${prefix}${formattedNumber}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyInfo,
        formatVal,
        convertVal,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackInfo = SUPPORTED_CURRENCIES.USD;
    return {
      currency: 'USD',
      setCurrency: () => {},
      currencyInfo: fallbackInfo,
      formatVal: (price: number, category?: string, showSymbol?: boolean) => {
        const prefix = showSymbol ? '$' : '';
        if (category === 'forex') return `${prefix}${price.toFixed(4)}`;
        if (Math.abs(price) >= 1000) return `${prefix}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return `${prefix}${price.toFixed(2)}`;
      },
      convertVal: (price: number) => price,
    };
  }
  return context;
}
