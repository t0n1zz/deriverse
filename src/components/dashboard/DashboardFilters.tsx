'use client';

import { useMemo, useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, Filter } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DATE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: 'All', days: null },
] as const;

export function DashboardFilters() {
  const { trades, filters, setFilters, resetFilters } = useTradeStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Derive available markets from current trades
  const markets = useMemo(() => {
    const uniq = new Set<string>();
    for (const t of trades) {
      if (t.market) uniq.add(t.market);
    }
    return Array.from(uniq).sort();
  }, [trades]);

  const hasActiveFilters =
    filters.markets.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  const toggleMarket = (market: string) => {
    const next = filters.markets.includes(market)
      ? filters.markets.filter(m => m !== market)
      : [...filters.markets, market];
    setFilters({ markets: next });
  };

  const applyDatePreset = (days: number | null) => {
    if (days === null) {
      setFilters({ dateRange: { start: null, end: null } });
      setStartDate('');
      setEndDate('');
    } else {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(new Date(), days));
      setFilters({ dateRange: { start, end } });
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value) {
      const date = startOfDay(new Date(value));
      setFilters({
        dateRange: {
          ...filters.dateRange,
          start: date,
        },
      });
    } else {
      setFilters({
        dateRange: {
          ...filters.dateRange,
          start: null,
        },
      });
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (value) {
      const date = endOfDay(new Date(value));
      setFilters({
        dateRange: {
          ...filters.dateRange,
          end: date,
        },
      });
    } else {
      setFilters({
        dateRange: {
          ...filters.dateRange,
          end: null,
        },
      });
    }
  };

  const handleClear = () => {
    resetFilters();
    setStartDate('');
    setEndDate('');
  };

  // If there are no trades, don't show filters
  if (trades.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 md:px-4 md:py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      {/* Left: Label + markets */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-1">
        <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
        </div>
        {markets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {markets.map(market => (
              <Badge
                key={market}
                variant="outline"
                className={cn(
                  'cursor-pointer text-[11px] md:text-xs px-2 py-0.5',
                  filters.markets.includes(market)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                )}
                onClick={() => toggleMarket(market)}
              >
                {market}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Right: Date range + clear */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Date</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_PRESETS.map(preset => (
            <Badge
              key={preset.label}
              variant="outline"
              className={cn(
                'cursor-pointer text-[11px] md:text-xs px-2 py-0.5',
                preset.days === null && !filters.dateRange.start && !filters.dateRange.end
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              )}
              onClick={() => applyDatePreset(preset.days)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            type="date"
            value={startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            className="h-8 px-2 text-[11px] md:text-xs"
          />
          <Input
            type="date"
            value={endDate}
            onChange={e => handleEndDateChange(e.target.value)}
            className="h-8 px-2 text-[11px] md:text-xs"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

