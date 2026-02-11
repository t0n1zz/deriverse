'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { generatePnLChartData } from '@/lib/analytics/calculator';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface PnLChartProps {
  className?: string;
  initialEquity?: number;
}

export function PnLChart({ className, initialEquity = 0 }: PnLChartProps) {
  const trades = useTradeStore(state => state.filteredTrades);

  const chartData = useMemo(() => {
    const data = generatePnLChartData(trades, initialEquity);
    return data.map(point => ({
      ...point,
      date: format(new Date(point.timestamp), 'MMM dd'),
      fullDate: format(new Date(point.timestamp), 'MMM dd, yyyy HH:mm'),
    }));
  }, [trades, initialEquity]);

  if (chartData.length === 0) {
    return (
      <div className={`rounded-lg border border-border bg-card p-4 flex flex-col h-full ${className ?? ''}`}>
        <h3 className="text-lg font-semibold mb-4">PnL History</h3>
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">No trade data for chart</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullDate: string; pnl: number; cumulativePnL: number; equity: number } }> }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.fullDate}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trade PnL:</span>
            <span className={data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cumulative:</span>
            <span className={data.cumulativePnL >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.cumulativePnL >= 0 ? '+' : ''}${data.cumulativePnL.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Equity:</span>
            <span className="text-foreground">${data.equity.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-lg border border-border bg-card p-4 flex flex-col h-full ${className ?? ''}`}>
      <h3 className="text-lg font-semibold mb-4">PnL History</h3>
      <div className="flex-1 min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            interval={Math.max(0, Math.floor((chartData.length - 1) / 6))}
            angle={-35}
            textAnchor="end"
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
            hide
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

          {/* Individual trade PnL bars */}
          <Bar
            yAxisId="left"
            dataKey="pnl"
            fill="hsl(var(--primary))"
            opacity={0.3}
            radius={[2, 2, 0, 0]}
          />

          {/* Cumulative PnL line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePnL"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
