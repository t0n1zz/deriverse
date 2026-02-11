'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface OrderTypeBreakdownProps {
  height?: number;
}

const COLORS = {
  market: 'hsl(var(--primary))',
  limit: 'hsl(var(--muted-foreground))',
  stop: 'hsl(var(--destructive))',
};

export function OrderTypeBreakdown({ height = 220 }: OrderTypeBreakdownProps) {
  const analytics = useTradeStore((state) => state.analytics);

  const data = useMemo(() => {
    if (!analytics) return [];

    // Normalize keys to title case for display
    return [
      { name: 'Market', value: analytics.orderTypeCounts?.market || 0, color: COLORS.market },
      { name: 'Limit', value: analytics.orderTypeCounts?.limit || 0, color: COLORS.limit },
    ].filter(d => d.value > 0);
  }, [analytics]);

  if (!analytics || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 h-[220px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No order type data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Order Types</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) => [`${value} trades`, 'Count']}
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
