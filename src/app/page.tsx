'use client';

import { useEffect } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PnLChart } from '@/components/dashboard/PnLChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { LongShortPie } from '@/components/dashboard/LongShortPie';
import { HourlyPerformance } from '@/components/dashboard/HourlyPerformance';
import { MarketBreakdown } from '@/components/dashboard/MarketBreakdown';
import { FeeBreakdown } from '@/components/dashboard/FeeBreakdown';
import { CalendarHeatmap } from '@/components/dashboard/CalendarHeatmap';
import { DataSourceToggle } from '@/components/dashboard/DataSourceToggle';
import { WalletBalance } from '@/components/dashboard/WalletBalance';
import { LoadingCard } from '@/components/ui/loading';
import {
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const { analytics, trades, loadMockData, isLoading } = useTradeStore();

  useEffect(() => {
    if (trades.length === 0 && !isLoading) {
      loadMockData();
    }
  }, [trades.length, isLoading, loadMockData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your trading performance at a glance</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LoadingCard height="120px" />
          <LoadingCard height="120px" />
          <LoadingCard height="120px" />
          <LoadingCard height="120px" />
        </div>
        <LoadingCard height="350px" text="Loading charts..." />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">No trade data available</p>
        <Button onClick={loadMockData}>Load Mock Data</Button>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your trading performance at a glance</p>
        </div>
        <DataSourceToggle />
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total PnL"
          value={formatCurrency(analytics.totalPnL)}
          subtitle={formatPercent(analytics.totalPnLPercent)}
          icon={DollarSign}
          valueClassName={analytics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <StatsCard
          title="Win Rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          subtitle={`${analytics.winningTrades}W / ${analytics.losingTrades}L`}
          icon={Target}
          valueClassName={analytics.winRate >= 50 ? 'text-green-500' : 'text-yellow-500'}
        />
        <StatsCard
          title="Total Trades"
          value={analytics.totalTrades}
          subtitle={`${trades.filter(t => t.status === 'open').length} open`}
          icon={Activity}
        />
        <StatsCard
          title="Profit Factor"
          value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          subtitle="Gross profit / loss"
          icon={BarChart3}
          valueClassName={analytics.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* PnL, Wallet Balance, Position Distribution */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <PnLChart height={500} />
            </div>
            <div className="space-y-4">
              <WalletBalance />
              <LongShortPie height={260} />
            </div>
          </div>

          <DrawdownChart height={150} />

          {/* Risk Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Max Drawdown"
              value={formatPercent(-analytics.maxDrawdownPercent)}
              subtitle={formatCurrency(-analytics.maxDrawdown)}
              icon={AlertTriangle}
              valueClassName="text-red-500"
            />
            <StatsCard
              title="Largest Win"
              value={analytics.largestWin ? formatCurrency(analytics.largestWin.pnl ?? 0) : '-'}
              subtitle={analytics.largestWin?.market}
              icon={ArrowUpRight}
              valueClassName="text-green-500"
            />
            <StatsCard
              title="Largest Loss"
              value={analytics.largestLoss ? formatCurrency(analytics.largestLoss.pnl ?? 0) : '-'}
              subtitle={analytics.largestLoss?.market}
              icon={ArrowDownRight}
              valueClassName="text-red-500"
            />
            <StatsCard
              title="Expectancy"
              value={formatCurrency(analytics.expectancy)}
              subtitle="Expected per trade"
              icon={TrendingUp}
              valueClassName={analytics.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Hourly and Position Analysis */}
          <div className="grid gap-4 lg:grid-cols-2">
            <HourlyPerformance height={300} />
            <div className="space-y-4">
              <StatsCard
                title="Long PnL"
                value={formatCurrency(analytics.longPnL)}
                subtitle={`${analytics.longCount} trades`}
                valueClassName={analytics.longPnL >= 0 ? 'text-green-500' : 'text-red-500'}
              />
              <StatsCard
                title="Short PnL"
                value={formatCurrency(analytics.shortPnL)}
                subtitle={`${analytics.shortCount} trades`}
                valueClassName={analytics.shortPnL >= 0 ? 'text-green-500' : 'text-red-500'}
              />
              <StatsCard
                title="Risk/Reward"
                value={analytics.riskRewardRatio.toFixed(2)}
                subtitle="Avg win / Avg loss"
              />
            </div>
          </div>

          {/* Position Pie */}
          <LongShortPie height={250} />

          {/* Calendar Heatmap */}
          <CalendarHeatmap daysToShow={35} />
        </TabsContent>

        <TabsContent value="markets" className="space-y-4">
          {/* Market and Fee Analysis */}
          <div className="grid gap-4 lg:grid-cols-2">
            <MarketBreakdown height={300} />
            <FeeBreakdown height={300} />
          </div>

          {/* Volume Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Volume"
              value={`$${analytics.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              subtitle="Cumulative volume"
            />
            <StatsCard
              title="Avg Trade Size"
              value={`$${analytics.avgTradeSize.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              subtitle="Mean position size"
            />
            <StatsCard
              title="Total Fees"
              value={formatCurrency(-analytics.totalFees)}
              subtitle={`Avg ${formatCurrency(-analytics.avgFeePerTrade)}/trade`}
              valueClassName="text-yellow-500"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
