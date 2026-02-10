'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface RDistributionChartProps {
  height?: number;
}

type BucketKey =
  | '<-3R'
  | '-3R to -2R'
  | '-2R to -1R'
  | '-1R to 0R'
  | '0R to 1R'
  | '1R to 2R'
  | '>2R';

export function RDistributionChart({ height = 250 }: RDistributionChartProps) {
  const trades = useTradeStore((state) => state.filteredTrades);

  const { chartData, averageR } = useMemo(() => {
    const closedTrades = trades.filter(
      (t) => t.status === 'closed' && t.pnl !== null
    );

    if (closedTrades.length === 0) {
      return { chartData: [], averageR: 0 };
    }

    const losingTrades = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
    const grossLossAbs = Math.abs(
      losingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
    );
    const avgLossAbs =
      losingTrades.length > 0 ? grossLossAbs / losingTrades.length : 0;

    if (avgLossAbs === 0) {
      return { chartData: [], averageR: 0 };
    }

    const buckets: Record<
      BucketKey,
      { name: BucketKey; count: number; isPositive: boolean }
    > = {
      '<-3R': { name: '<-3R', count: 0, isPositive: false },
      '-3R to -2R': { name: '-3R to -2R', count: 0, isPositive: false },
      '-2R to -1R': { name: '-2R to -1R', count: 0, isPositive: false },
      '-1R to 0R': { name: '-1R to 0R', count: 0, isPositive: false },
      '0R to 1R': { name: '0R to 1R', count: 0, isPositive: true },
      '1R to 2R': { name: '1R to 2R', count: 0, isPositive: true },
      '>2R': { name: '>2R', count: 0, isPositive: true },
    };

    let totalR = 0;

    closedTrades.forEach((trade) => {
      const pnl = trade.pnl ?? 0;
      const r = pnl / avgLossAbs;
      totalR += r;

      let bucket: BucketKey;
      if (r < -3) bucket = '<-3R';
      else if (r < -2) bucket = '-3R to -2R';
      else if (r < -1) bucket = '-2R to -1R';
      else if (r < 0) bucket = '-1R to 0R';
      else if (r < 1) bucket = '0R to 1R';
      else if (r < 2) bucket = '1R to 2R';
      else bucket = '>2R';

      buckets[bucket].count += 1;
    });

    const averageR = totalR / closedTrades.length;

    const chartData = (Object.values(buckets) as {
      name: BucketKey;
      count: number;
      isPositive: boolean;
    }[]).filter((b) => b.count > 0);

    return { chartData, averageR };
  }, [trades]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; count: number } }>;
  }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trades:</span>
            <span>{data.count}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Not enough closed trades to calculate R-multiples
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold">R-Multiple Distribution</h3>
        <p className="text-xs text-muted-foreground">
          Avg R per trade: {averageR.toFixed(2)}
        </p>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        PnL normalized by your average loss size (1R ≈ avg losing trade).
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isPositive
                    ? 'hsl(142, 76%, 36%)'
                    : 'hsl(0, 84%, 60%)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

