'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { generatePnLChartData } from '@/lib/analytics/calculator';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface DrawdownChartProps {
  height?: number;
}

export function DrawdownChart({ height = 200 }: DrawdownChartProps) {
  const trades = useTradeStore(state => state.trades);

  const chartData = useMemo(() => {
    const data = generatePnLChartData(trades, 10000);
    return data.map(point => ({
      ...point,
      date: format(new Date(point.timestamp), 'MMM dd'),
      fullDate: format(new Date(point.timestamp), 'MMM dd, yyyy HH:mm'),
      drawdownNeg: -point.drawdown, // Negative for visual
    }));
  }, [trades]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; fullDate: string; drawdown: number; drawdownNeg: number } }> }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.fullDate}</p>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Drawdown:</span>
          <span className="text-red-500">-{data.drawdown.toFixed(2)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Drawdown</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            domain={['dataMin', 0]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="drawdownNeg"
            stroke="hsl(0, 84%, 60%)"
            fill="url(#drawdownGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
