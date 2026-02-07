'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { format, startOfDay, getDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarHeatmapProps {
  daysToShow?: number;
}

export function CalendarHeatmap({ daysToShow = 35 }: CalendarHeatmapProps) {
  const trades = useTradeStore(state => state.trades);

  const calendarData = useMemo(() => {
    // Group trades by day
    const dailyPnL = new Map<string, { pnl: number; trades: number }>();

    trades.forEach(trade => {
      if (trade.pnl !== null && trade.pnl !== undefined) {
        const dateKey = format(new Date(trade.timestamp), 'yyyy-MM-dd');
        const existing = dailyPnL.get(dateKey) || { pnl: 0, trades: 0 };
        dailyPnL.set(dateKey, {
          pnl: existing.pnl + trade.pnl,
          trades: existing.trades + 1,
        });
      }
    });

    // Generate last N days
    const days = [];
    const today = startOfDay(new Date());

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const data = dailyPnL.get(dateKey);

      days.push({
        date,
        dateKey,
        dayOfWeek: getDay(date),
        pnl: data?.pnl ?? 0,
        trades: data?.trades ?? 0,
      });
    }

    return days;
  }, [trades, daysToShow]);

  const maxAbsPnL = useMemo(() => {
    return Math.max(...calendarData.map(d => Math.abs(d.pnl)), 1);
  }, [calendarData]);

  const getColor = (pnl: number) => {
    if (pnl === 0) return 'bg-muted/30';

    const intensity = Math.min(Math.abs(pnl) / maxAbsPnL, 1);

    if (pnl > 0) {
      if (intensity > 0.7) return 'bg-green-500';
      if (intensity > 0.4) return 'bg-green-500/70';
      return 'bg-green-500/40';
    } else {
      if (intensity > 0.7) return 'bg-red-500';
      if (intensity > 0.4) return 'bg-red-500/70';
      return 'bg-red-500/40';
    }
  };

  // Organize into weeks
  const weeks = useMemo(() => {
    const result: typeof calendarData[] = [];
    let currentWeek: typeof calendarData = [];

    calendarData.forEach((day, i) => {
      if (i === 0) {
        // Pad the first week with empty days
        for (let j = 0; j < day.dayOfWeek; j++) {
          currentWeek.push({ date: new Date(0), dateKey: '', dayOfWeek: j, pnl: 0, trades: 0 });
        }
      }

      currentWeek.push(day);

      if (day.dayOfWeek === 6 || i === calendarData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [calendarData]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground">
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={cn(
                    'w-4 h-4 rounded-sm transition-colors cursor-pointer',
                    day.dateKey ? getColor(day.pnl) : 'opacity-0'
                  )}
                  title={day.dateKey ? `${format(day.date, 'MMM d')}: ${day.trades} trades, $${day.pnl.toFixed(2)}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/40" />
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-green-500/40" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
