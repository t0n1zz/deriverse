'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoalsState {
  /** Maximum number of trades allowed per calendar day */
  maxTradesPerDay: number | null;
  /** Maximum loss allowed per day in USDC (negative PnL limit) */
  maxLossPerDay: number | null;
  /** Target R expectancy per trade (e.g. 0.3R) */
  targetRPerTrade: number | null;

  setMaxTradesPerDay: (value: number | null) => void;
  setMaxLossPerDay: (value: number | null) => void;
  setTargetRPerTrade: (value: number | null) => void;
  resetGoals: () => void;
}

const defaultState: Pick<
  GoalsState,
  'maxTradesPerDay' | 'maxLossPerDay' | 'targetRPerTrade'
> = {
  maxTradesPerDay: 10,
  maxLossPerDay: 200,
  targetRPerTrade: 0.3,
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...defaultState,
      setMaxTradesPerDay: (value) =>
        set({
          maxTradesPerDay: value && value > 0 ? value : null,
        }),
      setMaxLossPerDay: (value) =>
        set({
          maxLossPerDay: value && value > 0 ? value : null,
        }),
      setTargetRPerTrade: (value) =>
        set({
          targetRPerTrade: value && value > 0 ? value : null,
        }),
      resetGoals: () => set({ ...defaultState }),
    }),
    {
      name: 'deriverse-goals',
    }
  )
);

