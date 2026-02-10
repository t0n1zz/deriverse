'use client';

import { useMemo, useState } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { calculateTimePerformance } from '@/lib/analytics/calculator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePrivacy } from '@/contexts/PrivacyContext';

export function GoalsPanel() {
  const trades = useTradeStore((state) => state.trades);
  const { hideBalances } = usePrivacy();

  const {
    maxTradesPerDay,
    maxLossPerDay,
    targetRPerTrade,
    setMaxTradesPerDay,
    setMaxLossPerDay,
    setTargetRPerTrade,
    resetGoals,
  } = useGoalsStore();

  const [tradesPerDayInput, setTradesPerDayInput] = useState(
    maxTradesPerDay?.toString() ?? ''
  );
  const [lossPerDayInput, setLossPerDayInput] = useState(
    maxLossPerDay?.toString() ?? ''
  );
  const [targetRInput, setTargetRInput] = useState(
    targetRPerTrade?.toString() ?? ''
  );

  const todayStats = useMemo(() => {
    if (trades.length === 0) {
      return {
        tradesToday: 0,
        pnlToday: 0,
      };
    }

    const today = new Date();
    const isoDay = today.toISOString().split('T')[0];

    const dayPerf = calculateTimePerformance(trades, 'day').find(
      (p) => p.period === isoDay
    );

    return {
      tradesToday: dayPerf?.trades ?? 0,
      pnlToday: dayPerf?.pnl ?? 0,
    };
  }, [trades]);

  const tradesLimitReached =
    maxTradesPerDay != null &&
    todayStats.tradesToday >= maxTradesPerDay &&
    maxTradesPerDay > 0;

  const lossLimitBreached =
    maxLossPerDay != null && todayStats.pnlToday <= -(maxLossPerDay ?? 0);

  const formatPnL = (value: number) => {
    if (hideBalances) return '****';
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold">Daily Goals & Guardrails</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs px-2 h-7"
          onClick={resetGoals}
        >
          Reset defaults
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Define simple rules for yourself and see if today&apos;s trading
        respects them.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Max trades per day
            </p>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 10"
              value={tradesPerDayInput}
              onChange={(e) => {
                const v = e.target.value;
                setTradesPerDayInput(v);
                const num = Number(v);
                setMaxTradesPerDay(Number.isFinite(num) && num > 0 ? num : null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Today: {todayStats.tradesToday}{' '}
              {maxTradesPerDay != null &&
                `(limit ${maxTradesPerDay} trades)`}
            </p>
            {tradesLimitReached && (
              <p className="text-xs font-medium text-amber-500">
                You&apos;ve reached your trade limit for today. Consider
                stopping to avoid overtrading.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Max loss per day (USDC)
            </p>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 200"
              value={lossPerDayInput}
              onChange={(e) => {
                const v = e.target.value;
                setLossPerDayInput(v);
                const num = Number(v);
                setMaxLossPerDay(Number.isFinite(num) && num > 0 ? num : null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Today PnL: {formatPnL(todayStats.pnlToday)}{' '}
              {maxLossPerDay != null &&
                `(max -$${maxLossPerDay.toFixed(0)})`}
            </p>
            {lossLimitBreached && (
              <p className="text-xs font-medium text-red-500">
                Daily loss limit breached. Your main job now is capital
                protection—consider stopping for the day.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Target expectancy (R per trade)
            </p>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 0.3"
              value={targetRInput}
              onChange={(e) => {
                const v = e.target.value;
                setTargetRInput(v);
                const num = Number(v);
                setTargetRPerTrade(
                  Number.isFinite(num) && num > 0 ? num : null
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              This is your long-run goal per trade in units of average risk
              (R). For example, 0.3R means you aim to make 0.3 times your
              typical loss per trade.
            </p>
          </div>

          <div className="space-y-1 rounded-md border border-dashed border-border/70 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Coaching tip
            </p>
            <p className="text-xs text-muted-foreground">
              When you hit your daily loss limit or max trades, your edge
              usually degrades. Treat those limits as hard rules—review your
              day instead of trying to earn it back immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

