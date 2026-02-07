'use client';

import { useState } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const MARKETS = ['SOL-USDC', 'BTC-USDC', 'ETH-USDC', 'BONK-USDC', 'JTO-USDC', 'WIF-USDC'];

const DATE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: 'All', days: null },
];

export function TradeFilters() {
  const { filters, setFilters, resetFilters } = useTradeStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const hasActiveFilters =
    filters.markets.length > 0 ||
    filters.sides.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  const toggleMarket = (market: string) => {
    const markets = filters.markets.includes(market)
      ? filters.markets.filter(m => m !== market)
      : [...filters.markets, market];
    setFilters({ markets });
  };

  const toggleSide = (side: 'long' | 'short') => {
    const sides = filters.sides.includes(side)
      ? filters.sides.filter(s => s !== side)
      : [...filters.sides, side];
    setFilters({ sides });
  };

  const toggleStatus = (status: 'open' | 'closed' | 'liquidated') => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses });
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
          start: date
        }
      });
    } else {
      setFilters({
        dateRange: {
          ...filters.dateRange,
          start: null
        }
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
          end: date
        }
      });
    } else {
      setFilters({
        dateRange: {
          ...filters.dateRange,
          end: null
        }
      });
    }
  };

  const handleClearFilters = () => {
    resetFilters();
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Date Range</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {DATE_PRESETS.map(preset => (
            <Badge
              key={preset.label}
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors text-xs',
                preset.days === null && !filters.dateRange.start
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              )}
              onClick={() => applyDatePreset(preset.days)}
            >
              {preset.label}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="text-xs h-8"
            placeholder="Start"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="text-xs h-8"
            placeholder="End"
          />
        </div>
      </div>

      {/* Market Filter */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Market</p>
        <div className="flex flex-wrap gap-1">
          {MARKETS.map(market => (
            <Badge
              key={market}
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors text-xs',
                filters.markets.includes(market)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              )}
              onClick={() => toggleMarket(market)}
            >
              {market.split('-')[0]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Side Filter */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Side</p>
        <div className="flex gap-1">
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors text-xs',
              filters.sides.includes('long')
                ? 'bg-green-500/20 text-green-500 border-green-500'
                : 'hover:bg-accent'
            )}
            onClick={() => toggleSide('long')}
          >
            Long
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors text-xs',
              filters.sides.includes('short')
                ? 'bg-red-500/20 text-red-500 border-red-500'
                : 'hover:bg-accent'
            )}
            onClick={() => toggleSide('short')}
          >
            Short
          </Badge>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-1">
          {(['open', 'closed', 'liquidated'] as const).map(status => (
            <Badge
              key={status}
              variant="outline"
              className={cn(
                'cursor-pointer capitalize transition-colors text-xs',
                filters.statuses.includes(status)
                  ? status === 'open'
                    ? 'bg-blue-500/20 text-blue-500 border-blue-500'
                    : status === 'closed'
                      ? 'bg-green-500/20 text-green-500 border-green-500'
                      : 'bg-red-500/20 text-red-500 border-red-500'
                  : 'hover:bg-accent'
              )}
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
