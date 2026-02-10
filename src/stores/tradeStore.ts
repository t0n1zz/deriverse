'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, TradeFilters, PortfolioAnalytics } from '@/types';
import { calculateAnalytics } from '@/lib/analytics/calculator';
import { generateMockTrades } from '@/lib/mock/generateTrades';

interface TradeState {
  // State
  dataSource: 'mock' | 'live';
  trades: Trade[];
  filteredTrades: Trade[];
  analytics: PortfolioAnalytics | null;
  filters: TradeFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDataSource: (dataSource: 'mock' | 'live') => void;
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  removeTrade: (id: string) => void;
  setFilters: (filters: Partial<TradeFilters>) => void;
  resetFilters: () => void;
  loadMockData: () => void;
  refreshAnalytics: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTrades: () => void;
}

const defaultFilters: TradeFilters = {
  dateRange: { start: null, end: null },
  markets: [],
  sides: [],
  statuses: [],
  orderTypes: [],
  pnlRange: { min: null, max: null },
};

/**
 * Apply filters to trades
 */
function applyFilters(trades: Trade[], filters: TradeFilters): Trade[] {
  return trades.filter(trade => {
    // Date range filter
    if (filters.dateRange.start && trade.timestamp < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && trade.timestamp > filters.dateRange.end) {
      return false;
    }

    // Market filter
    if (filters.markets.length > 0 && !filters.markets.includes(trade.market)) {
      return false;
    }

    // Side filter
    if (filters.sides.length > 0 && !filters.sides.includes(trade.side)) {
      return false;
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(trade.status)) {
      return false;
    }

    // Order type filter
    if (filters.orderTypes.length > 0 && !filters.orderTypes.includes(trade.orderType)) {
      return false;
    }

    // PnL range filter
    const pnl = trade.pnl ?? 0;
    if (filters.pnlRange.min !== null && pnl < filters.pnlRange.min) {
      return false;
    }
    if (filters.pnlRange.max !== null && pnl > filters.pnlRange.max) {
      return false;
    }

    return true;
  });
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      // Initial state — default to live
      dataSource: 'live',
      trades: [],
      filteredTrades: [],
      analytics: null,
      filters: defaultFilters,
      isLoading: false,
      error: null,

      // Actions
      setDataSource: (dataSource) => set({ dataSource }),

      setTrades: (trades) => {
        const analytics = calculateAnalytics(trades);
        const filteredTrades = applyFilters(trades, get().filters);
        set({ trades, analytics, filteredTrades });
      },

      addTrade: (trade) => {
        const newTrades = [...get().trades, trade];
        const analytics = calculateAnalytics(newTrades);
        const filteredTrades = applyFilters(newTrades, get().filters);
        set({ trades: newTrades, analytics, filteredTrades });
      },

      updateTrade: (id, updates) => {
        const trades = get().trades.map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
        const analytics = calculateAnalytics(trades);
        const filteredTrades = applyFilters(trades, get().filters);
        set({ trades, analytics, filteredTrades });
      },

      removeTrade: (id) => {
        const trades = get().trades.filter(t => t.id !== id);
        const analytics = calculateAnalytics(trades);
        const filteredTrades = applyFilters(trades, get().filters);
        set({ trades, analytics, filteredTrades });
      },

      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        const filteredTrades = applyFilters(get().trades, filters);
        set({ filters, filteredTrades });
      },

      resetFilters: () => {
        const filteredTrades = applyFilters(get().trades, defaultFilters);
        set({ filters: defaultFilters, filteredTrades });
      },

      loadMockData: () => {
        set({ isLoading: true, error: null });
        try {
          const mockTrades = generateMockTrades(100);
          const analytics = calculateAnalytics(mockTrades);
          const filteredTrades = applyFilters(mockTrades, get().filters);
          set({
            trades: mockTrades,
            analytics,
            filteredTrades,
            isLoading: false,
            dataSource: 'mock',
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load mock data',
            isLoading: false
          });
        }
      },

      refreshAnalytics: () => {
        const trades = get().trades;
        if (trades.length > 0) {
          const analytics = calculateAnalytics(trades);
          set({ analytics });
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearTrades: () => set({
        trades: [],
        filteredTrades: [],
        analytics: null,
        error: null,
      }),
    }),
    {
      name: 'deriverse-trades',
      // Only persist dataSource and filters — NOT trades
      // Trades are re-fetched from chain or re-generated as mock
      partialize: (state) => ({
        dataSource: state.dataSource,
        filters: state.filters,
      }),
    }
  )
);
