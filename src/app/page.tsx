'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTradeStore } from '@/stores/tradeStore';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { WalletLanding } from '@/components/wallet/WalletLanding';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PnLChart } from '@/components/dashboard/PnLChart';
import { DrawdownChart } from '@/components/dashboard/DrawdownChart';
import { LongShortPie } from '@/components/dashboard/LongShortPie';
import { HourlyPerformance } from '@/components/dashboard/HourlyPerformance';
import { MarketBreakdown } from '@/components/dashboard/MarketBreakdown';
import { FeeBreakdown } from '@/components/dashboard/FeeBreakdown';
import { CalendarHeatmap } from '@/components/dashboard/CalendarHeatmap';
import { ExposureBreakdown } from '@/components/dashboard/ExposureBreakdown';
import { RDistributionChart } from '@/components/dashboard/RDistributionChart';
import { RollingPerformanceChart } from '@/components/dashboard/RollingPerformanceChart';
import { WeekdayPerformance } from '@/components/dashboard/WeekdayPerformance';
import { GoalsPanel } from '@/components/dashboard/GoalsPanel';
import { CoachingInsights } from '@/components/dashboard/CoachingInsights';
import { DataSourceToggle } from '@/components/dashboard/DataSourceToggle';
import { DataSourceRefreshButton } from '@/components/dashboard/DataSourceRefreshButton';
import { SharePnLCard } from '@/components/dashboard/SharePnLCard';
import { LoadingCard } from '@/components/ui/loading';
import { useAccountEquity } from '@/lib/deriverse';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function DashboardContent() {
  const { analytics, filteredTrades, isLoading, dataSource, clearTrades, setLoading } = useTradeStore();
  const { walletAddress, isValidAddress, setWalletAddress } = useWalletAddress();
  const { hideBalances } = usePrivacy();
  const { data: accountEquity } = useAccountEquity();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [didInitFromUrl, setDidInitFromUrl] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On first load, if URL has ?wallet=..., sync it into the wallet context once
  useEffect(() => {
    if (didInitFromUrl) return;
    const urlWallet = searchParams.get('wallet');
    if (!urlWallet) return;
    setWalletAddress(urlWallet);
    setDidInitFromUrl(true);
  }, [searchParams, didInitFromUrl, setWalletAddress]);

  // Keep wallet query param in sync with context (add when set, remove when cleared)
  useEffect(() => {
    if (!mounted) return;
    const current = searchParams.get('wallet');

    if (!walletAddress || !isValidAddress) {
      // Clear wallet param if it exists
      if (!current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete('wallet');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      return;
    }

    if (current === walletAddress) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('wallet', walletAddress);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [mounted, walletAddress, isValidAddress, searchParams, router, pathname]);

  // When wallet is cleared in live mode, clear any live trades/analytics so UI resets
  useEffect(() => {
    if (!mounted) return;
    if (dataSource !== 'live') return;
    if (walletAddress && isValidAddress) return;

    // No valid wallet in live mode: clear current live data
    clearTrades();
    setLoading(false);
  }, [mounted, dataSource, walletAddress, isValidAddress, clearTrades, setLoading]);

  const hasValidWallet = !!walletAddress && isValidAddress;
  const mode = searchParams.get('mode');

  // Show nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Landing rules:
  // - If a wallet is connected → always go to live dashboard (no landing)
  // - If NO wallet and mode !== 'mock' → show landing to choose wallet or mock
  if (!hasValidWallet && mode !== 'mock') {
    return <WalletLanding />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your trading performance at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <DataSourceToggle />
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
    if (dataSource === 'live') {
      // Live mode with wallet but no data yet
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Your trading performance at a glance</p>
            </div>
            <div className="flex items-center gap-2">
              <SharePnLCard />
              <DataSourceToggle />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-2">No Position Data Found</h3>
            <p className="text-muted-foreground mb-4">
              We could not find any positions for this wallet on Deriverse.
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure you are connected to the correct network and have open positions.
            </p>
          </div>
        </div>
      );
    }

    // Mock mode but no data — shouldn't normally happen
    return <WalletLanding />;
  }

  const formatCurrency = (value: number) => {
    if (hideBalances) {
      return '****';
    }
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

  const initialEquity =
    accountEquity != null && !Number.isNaN(accountEquity)
      ? accountEquity - analytics.realizedPnL
      : 0;

  const openPositions = filteredTrades.filter((t) => t.status === 'open');
  const totalOpenNotional = openPositions.reduce((sum, trade) => {
    const leverage = trade.leverage ?? 1;
    const notional = Math.abs(trade.quantity * trade.entryPrice * leverage);
    return sum + notional;
  }, 0);

  const largestPosition = openPositions.reduce<{
    market: string | null;
    notional: number;
  }>(
    (acc, trade) => {
      const leverage = trade.leverage ?? 1;
      const notional = Math.abs(trade.quantity * trade.entryPrice * leverage);
      if (notional > acc.notional) {
        return { market: trade.market, notional };
      }
      return acc;
    },
    { market: null, notional: 0 }
  );

  const openExposurePercent =
    initialEquity > 0 ? (totalOpenNotional / initialEquity) * 100 : 0;

  // Expectancy in R units, based on average loss size
  const closedTrades = filteredTrades.filter(
    (t) => t.status === 'closed' && t.pnl !== null
  );
  const losingClosedTrades = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const grossLossAbs = Math.abs(
    losingClosedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  );
  const avgLossAbs =
    losingClosedTrades.length > 0 ? grossLossAbs / losingClosedTrades.length : 0;
  const expectancyR =
    closedTrades.length > 0 && avgLossAbs > 0
      ? closedTrades.reduce((sum, t) => {
        const pnl = t.pnl ?? 0;
        return sum + pnl / avgLossAbs;
      }, 0) / closedTrades.length
      : 0;
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your trading performance at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <SharePnLCard />
          <DataSourceRefreshButton />
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters />

      <CoachingInsights />

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
          subtitle={`${filteredTrades.filter(t => t.status === 'open').length} open`}
          icon={Activity}
        />
        <StatsCard
          title="Profit Factor"
          value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          subtitle="Gross profit / loss"
          icon={BarChart3}
          valueClassName={analytics.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}
          tooltip="Measures how much you win relative to how much you lose. A value of 2.0 means you make $2 for every $1 lost. Aim for above 1.5."
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
          {/* PnL and Position Distribution */}
          <div className="grid gap-4 lg:grid-cols-3 items-stretch min-h-[260px] md:min-h-[320px]">
            <div className="lg:col-span-2 h-full">
              <PnLChart initialEquity={initialEquity} />
            </div>
            <div className="h-full">
              <LongShortPie />
            </div>
          </div>

          <DrawdownChart height={150} initialEquity={initialEquity} />

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
              tooltip="The estimated profit (or loss) of your next trade based on your history. If this is positive, your strategy is profitable over time."
            />
            <StatsCard
              title="Open Exposure"
              value={
                initialEquity > 0
                  ? `${openExposurePercent.toFixed(1)}%`
                  : '$0'
              }
              subtitle={
                totalOpenNotional > 0
                  ? `$${totalOpenNotional.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })} notional`
                  : 'No open positions'
              }
              tooltip="Approximate open notional exposure relative to your equity, including leverage."
            />
            <StatsCard
              title="Position Concentration"
              value={
                largestPosition.market
                  ? largestPosition.market
                  : 'No open positions'
              }
              subtitle={
                largestPosition.notional > 0 && totalOpenNotional > 0
                  ? `${(
                    (largestPosition.notional / totalOpenNotional) *
                    100
                  ).toFixed(1)}% of open exposure`
                  : '—'
              }
              tooltip="Largest single-market position as a share of your total open exposure."
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
                valueClassName={
                  analytics.longPnL >= 0 ? 'text-green-500' : 'text-red-500'
                }
              />
              <StatsCard
                title="Short PnL"
                value={formatCurrency(analytics.shortPnL)}
                subtitle={`${analytics.shortCount} trades`}
                valueClassName={
                  analytics.shortPnL >= 0 ? 'text-green-500' : 'text-red-500'
                }
              />
              <StatsCard
                title="Risk/Reward"
                value={analytics.riskRewardRatio.toFixed(2)}
                subtitle="Avg win / Avg loss"
              />
              <StatsCard
                title="Expectancy (R)"
                value={`${expectancyR.toFixed(2)}R`}
                subtitle="Per trade, normalized by avg loss size"
                tooltip="Average R-multiple per trade. 1R is roughly the size of your typical losing trade. Positive values mean your system makes more per trade than it loses, in R terms."
              />
            </div>
          </div>

          {/* Position Pie */}
          <LongShortPie height={250} />

          <RDistributionChart height={250} />

          {/* Calendar & Consistency */}
          <div className="grid gap-4 lg:grid-cols-2">
            <CalendarHeatmap daysToShow={35} />
            <RollingPerformanceChart height={260} />
          </div>

          <WeekdayPerformance height={220} />

          <GoalsPanel />
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

          <ExposureBreakdown height={260} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingCard height="100vh" text="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
