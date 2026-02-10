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

interface MarketBreakdownProps {
  height?: number;
}

export function MarketBreakdown({ height = 250 }: MarketBreakdownProps) {
  const trades = useTradeStore(state => state.trades);

  const chartData = useMemo(() => {
    const marketMap: Map<string, { trades: number; pnl: number; volume: number }> = new Map();

    trades.forEach(trade => {
      const existing = marketMap.get(trade.market) || { trades: 0, pnl: 0, volume: 0 };
      marketMap.set(trade.market, {
        trades: existing.trades + 1,
        pnl: existing.pnl + (trade.pnl ?? 0),
        volume: existing.volume + (trade.quantity * trade.entryPrice),
      });
    });

    return Array.from(marketMap.entries())
      .map(([market, data]) => ({
        market: market.startsWith('PERP-') ? market : market.split('-')[0], // SOL-USDC -> SOL, PERP-1 -> PERP-1
        fullMarket: market,
        ...data,
      }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  }, [trades]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullMarket: string; trades: number; pnl: number; volume: number } }> }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.fullMarket}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Trades:</span>
            <span>{data.trades}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">PnL:</span>
            <span className={data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volume:</span>
            <span>${data.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-4">Market Breakdown</h3>
      <p className="text-sm text-muted-foreground mb-4">PnL by trading pair</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
          />
          <YAxis
            type="category"
            dataKey="market"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
