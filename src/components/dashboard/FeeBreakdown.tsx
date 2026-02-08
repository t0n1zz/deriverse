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
  Legend,
} from 'recharts';

interface FeeBreakdownProps {
  height?: number;
}

export function FeeBreakdown({ height = 200 }: FeeBreakdownProps) {
  const trades = useTradeStore(state => state.trades);

  const chartData = useMemo(() => {
    const feesByMarket: Map<string, { trading: number; funding: number }> = new Map();

    trades.forEach(trade => {
      const market = trade.market.split('-')[0];
      const existing = feesByMarket.get(market) || { trading: 0, funding: 0 };
      feesByMarket.set(market, {
        trading: existing.trading + trade.fees.trading,
        funding: existing.funding + trade.fees.funding,
      });
    });

    return Array.from(feesByMarket.entries())
      .map(([market, fees]) => ({
        market,
        trading: fees.trading,
        funding: fees.funding,
        total: fees.trading + fees.funding,
      }))
      .sort((a, b) => b.total - a.total);
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) => {
    if (!active || !payload?.[0]) return null;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trading Fees:</span>
            <span className="text-yellow-500">${payload[0]?.value?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Funding Fees:</span>
            <span className="text-orange-500">${payload[1]?.value?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No fee data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="market"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="trading" name="Trading" fill="hsl(48, 96%, 53%)" stackId="fees" radius={[0, 0, 0, 0]} />
          <Bar dataKey="funding" name="Funding" fill="hsl(25, 95%, 53%)" stackId="fees" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
