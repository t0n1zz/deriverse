'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface RollingPerformanceChartProps {
  height?: number;
  windowSize?: number;
}

interface RollingPoint {
  index: number;
  label: string;
  rollingWinRate: number;
  rollingAvgPnL: number;
}

export function RollingPerformanceChart({
  height = 260,
  windowSize = 20,
}: RollingPerformanceChartProps) {
  const trades = useTradeStore((state) => state.trades);

  const chartData = useMemo<RollingPoint[]>(() => {
    const closed = trades
      .filter((t) => t.status === 'closed' && t.pnl !== null)
      .slice()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (closed.length === 0) return [];

    const data: RollingPoint[] = [];

    for (let i = 0; i < closed.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const windowTrades = closed.slice(start, i + 1);
      const wins = windowTrades.filter((t) => (t.pnl ?? 0) > 0).length;
      const totalPnL = windowTrades.reduce(
        (sum, t) => sum + (t.pnl ?? 0),
        0
      );
      const winRate =
        windowTrades.length > 0
          ? (wins / windowTrades.length) * 100
          : 0;
      const avgPnL =
        windowTrades.length > 0 ? totalPnL / windowTrades.length : 0;

      data.push({
        index: i + 1,
        label: format(new Date(closed[i].timestamp), 'MMM dd'),
        rollingWinRate: winRate,
        rollingAvgPnL: avgPnL,
      });
    }

    return data;
  }, [trades, windowSize]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: RollingPoint }>;
  }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          Last {Math.min(windowSize, data.index)} trades
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Up to:</span>
            <span>{data.label}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Win Rate:</span>
            <span>{data.rollingWinRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Avg PnL / trade:</span>
            <span
              className={
                data.rollingAvgPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }
            >
              {data.rollingAvgPnL >= 0 ? '+' : ''}
              ${data.rollingAvgPnL.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">
          Not enough closed trades for rolling stats
        </p>
      </div>
    );
  }

  const sampleSize = chartData.length;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold">Rolling Performance</h3>
        <p className="text-xs text-muted-foreground">
          Sample size: {sampleSize} closed trades
        </p>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {windowSize}-trade rolling win rate and average PnL per trade. Helps
        you see if your edge is improving or degrading over time.
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="index"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickFormatter={(value) => `#${value}`}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) =>
              `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => (
              <span className="text-muted-foreground">{value}</span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rollingWinRate"
            name="Win Rate"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(217, 91%, 60%)' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rollingAvgPnL"
            name="Avg PnL / trade"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(142, 76%, 36%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

