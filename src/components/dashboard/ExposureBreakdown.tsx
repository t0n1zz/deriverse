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

interface ExposureBreakdownProps {
  height?: number;
}

export function ExposureBreakdown({ height = 250 }: ExposureBreakdownProps) {
  const trades = useTradeStore((state) => state.trades);

  const chartData = useMemo(() => {
    const openTrades = trades.filter((t) => t.status === 'open');

    if (openTrades.length === 0) {
      return [];
    }

    const exposureByMarket: Map<
      string,
      { notional: number; positions: number }
    > = new Map();

    openTrades.forEach((trade) => {
      const leverage = trade.leverage ?? 1;
      const notional = Math.abs(trade.quantity * trade.entryPrice * leverage);

      let market = trade.market;
      if (!market.startsWith('PERP-')) {
        market = market.split('-')[0];
      }

      const existing = exposureByMarket.get(market) || {
        notional: 0,
        positions: 0,
      };

      exposureByMarket.set(market, {
        notional: existing.notional + notional,
        positions: existing.positions + 1,
      });
    });

    const entries = Array.from(exposureByMarket.entries()).map(
      ([market, data]) => ({
        market,
        notional: data.notional,
        positions: data.positions,
      })
    );

    const totalNotional = entries.reduce(
      (sum, entry) => sum + entry.notional,
      0
    );

    return entries
      .map((entry) => ({
        ...entry,
        percent:
          totalNotional > 0 ? (entry.notional / totalNotional) * 100 : 0,
      }))
      .sort((a, b) => b.notional - a.notional);
  }, [trades]);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        market: string;
        notional: number;
        positions: number;
        percent: number;
      };
    }>;
  }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">{data.market}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open positions:</span>
            <span>{data.positions}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Notional:</span>
            <span>${data.notional.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Share of exposure:</span>
            <span>{data.percent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] border border-border rounded-lg bg-card">
        <p className="text-muted-foreground">No open exposure</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold mb-1">Exposure Breakdown</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Open notional exposure by market (including leverage)
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) =>
              `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
            }
          />
          <YAxis
            type="category"
            dataKey="market"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="notional" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="hsl(217, 91%, 60%)"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

