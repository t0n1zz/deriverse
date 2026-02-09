'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  hideBalances: boolean;
  toggleHideBalances: () => void;
  formatAmount: (value: number, options?: { prefix?: string; suffix?: string }) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const STORAGE_KEY = 'deriverse-hide-balances';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hideBalances, setHideBalances] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setHideBalances(stored === 'true');
    }
  }, []);

  const toggleHideBalances = () => {
    setHideBalances(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  };

  const formatAmount = (value: number, options?: { prefix?: string; suffix?: string }) => {
    if (!mounted) {
      // During SSR, show actual values
      const prefix = options?.prefix ?? '';
      const suffix = options?.suffix ?? '';
      return `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }

    if (hideBalances) {
      return '****';
    }

    const prefix = options?.prefix ?? '';
    const suffix = options?.suffix ?? '';
    return `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  };

  return (
    <PrivacyContext.Provider value={{ hideBalances, toggleHideBalances, formatAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
