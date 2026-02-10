'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { calculateTimePerformance } from '@/lib/analytics/calculator';
import { Lightbulb, HeartPulse, Target } from 'lucide-react';

type InsightTone = 'positive' | 'caution' | 'neutral';

interface CoachingInsightsProps {
  className?: string;
}

export function CoachingInsights({ className }: CoachingInsightsProps) {
  const { analytics, trades, filteredTrades } = useTradeStore();
  const { hideBalances } = usePrivacy();
  const { maxTradesPerDay, maxLossPerDay, targetRPerTrade } = useGoalsStore();

  const insight = useMemo(() => {
    if (!analytics || trades.length === 0) {
      return {
        tone: 'neutral' as InsightTone,
        title: 'Start building your sample',
        message:
          'Once you have at least 20–30 closed trades, this panel will surface patterns in your performance and discipline.',
      };
    }

    const closed = filteredTrades.filter(
      (t) => t.status === 'closed' && t.pnl !== null
    );

    if (closed.length < 10) {
      return {
        tone: 'neutral' as InsightTone,
        title: 'Sample is still small',
        message:
          'You have fewer than 10 closed trades in this view. Focus on executing your plan consistently before drawing strong conclusions from the stats.',
      };
    }

    // Today stats
    const today = new Date();
    const isoDay = today.toISOString().split('T')[0];
    const todayPerf = calculateTimePerformance(trades, 'day').find(
      (p) => p.period === isoDay
    );
    const tradesToday = todayPerf?.trades ?? 0;
    const pnlToday = todayPerf?.pnl ?? 0;

    // Overtrading / daily loss rules
    if (
      maxTradesPerDay != null &&
      tradesToday > maxTradesPerDay &&
      maxTradesPerDay > 0
    ) {
      return {
        tone: 'caution' as InsightTone,
        title: 'You may be overtrading today',
        message:
          "You've already traded more than your own daily limit. Consider pausing and doing a quick review instead of pushing for more entries.",
      };
    }

    if (
      maxLossPerDay != null &&
      pnlToday <= -Math.abs(maxLossPerDay) &&
      maxLossPerDay > 0
    ) {
      return {
        tone: 'caution' as InsightTone,
        title: 'Daily loss limit is hit',
        message:
          "You're beyond your planned daily loss. The best traders stop here and protect capital instead of trying to win it back immediately.",
      };
    }

    // Recent streak (last 10 closed trades in this filtered view)
    const recentClosed = [...closed]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-10);
    const recentPnL = recentClosed.reduce(
      (sum, t) => sum + (t.pnl ?? 0),
      0
    );
    const winnersRecent = recentClosed.filter((t) => (t.pnl ?? 0) > 0).length;
    const recentWinRate =
      recentClosed.length > 0
        ? (winnersRecent / recentClosed.length) * 100
        : 0;

    const avgLossAbsBlock = (() => {
      const losers = closed.filter((t) => (t.pnl ?? 0) < 0);
      const grossLossAbs = Math.abs(
        losers.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
      );
      return losers.length > 0 ? grossLossAbs / losers.length : 0;
    })();

    const expectancyRBlock =
      closed.length > 0 && avgLossAbsBlock > 0
        ? closed.reduce((sum, t) => {
            const pnl = t.pnl ?? 0;
            return sum + pnl / avgLossAbsBlock;
          }, 0) / closed.length
        : 0;

    // Positive: strong recent performance
    if (recentWinRate >= 60 && recentPnL > 0) {
      return {
        tone: 'positive' as InsightTone,
        title: 'Your recent execution looks strong',
        message:
          `Over your last 10 closed trades in this view, your win rate is around ${recentWinRate.toFixed(
            0
          )}%. Keep following the same process rather than increasing size too quickly.`,
      };
    }

    // Positive: stable expectancy
    if (expectancyRBlock > 0.3) {
      return {
        tone: 'positive' as InsightTone,
        title: 'Your system has a positive edge',
        message:
          `Your average expectancy is about ${expectancyRBlock.toFixed(
            2
          )}R per trade. Focus now on position sizing and avoiding emotional trades that deviate from your plan.`,
      };
    }

    // Goal comparison
    if (
      targetRPerTrade != null &&
      targetRPerTrade > 0 &&
      expectancyRBlock > 0 &&
      expectancyRBlock < targetRPerTrade
    ) {
      return {
        tone: 'neutral' as InsightTone,
        title: 'Edge is positive but below your goal',
        message:
          `Your expectancy is roughly ${expectancyRBlock.toFixed(
            2
          )}R per trade versus your target of ${targetRPerTrade.toFixed(
            2
          )}R. Look for small improvements in trade selection or reward-to-risk, not more trades.`,
      };
    }

    // Drawdown coaching
    if (analytics.currentDrawdown > 0 && analytics.maxDrawdown > 0) {
      const ddPctOfMax =
        (analytics.currentDrawdown / analytics.maxDrawdown) * 100;
      if (ddPctOfMax >= 70) {
        return {
          tone: 'caution' as InsightTone,
          title: 'Deep in a drawdown',
          message:
            'You are close to your largest historical drawdown. This is usually the worst time to be aggressive. Reduce size, be selective, and stick tightly to your rules.',
        };
      }
    }

    // Default neutral nudge
    return {
      tone: 'neutral' as InsightTone,
      title: 'Let the data guide your rules',
      message:
        'Use your hourly, weekday, and R-multiple stats to define clear rules: when you trade, how many trades per day, and which setups you should avoid.',
    };
  }, [analytics, trades, filteredTrades, maxTradesPerDay, maxLossPerDay, targetRPerTrade]);

  const formatPnL = (value: number) => {
    if (hideBalances) return '****';
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toFixed(2)}`;
  };

  const Icon =
    insight.tone === 'positive'
      ? Target
      : insight.tone === 'caution'
      ? HeartPulse
      : Lightbulb;

  const toneClasses =
    insight.tone === 'positive'
      ? 'border-emerald-500/40 bg-emerald-500/5'
      : insight.tone === 'caution'
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-primary/40 bg-primary/5';

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-start gap-3 text-sm ${toneClasses} ${className ?? ''}`}
    >
      <div className="mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{insight.title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {insight.message}
        </p>
      </div>
    </div>
  );
}

