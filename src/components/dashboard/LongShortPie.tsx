'use client';

import { useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';

interface LongShortPieProps {
  height?: number;
}

export function LongShortPie({ height = 250 }: LongShortPieProps) {
  const analytics = useTradeStore(state => state.analytics);

  const data = useMemo(() => {
    if (!analytics) return [];

    return [
      { name: 'Long', value: analytics.longCount, pnl: analytics.longPnL, color: '#22c55e' },
      { name: 'Short', value: analytics.shortCount, pnl: analytics.shortPnL, color: '#ef4444' },
    ];
  }, [analytics]);

  if (data.length === 0 || (data[0].value === 0 && data[1].value === 0)) {
    return (
      <div className="flex items-center justify-center h-[250px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.name} Positions</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trades:</span>
            <span>{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">PnL:</span>
            <span className={data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex justify-center gap-6 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {entry.value}: {data[index]?.value} trades
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-2">Position Distribution</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
