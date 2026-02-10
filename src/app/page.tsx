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
import { DataSourceToggle } from '@/components/dashboard/DataSourceToggle';
import { DataSourceRefreshButton } from '@/components/dashboard/DataSourceRefreshButton';
import { SharePnLCard } from '@/components/dashboard/SharePnLCard';
import { LoadingCard } from '@/components/ui/loading';
import { useAccountEquity } from '@/lib/deriverse';
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
  const { analytics, trades, isLoading, dataSource, clearTrades, setLoading } = useTradeStore();
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

  // Show nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show wallet landing page when:
  // - In live mode with no wallet address set
  // - In live mode with no trades and not loading
  const hasValidWallet = !!walletAddress && isValidAddress;
  const shouldShowLanding = dataSource === 'live' && !hasValidWallet && trades.length === 0;

  if (shouldShowLanding) {
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingCard height="100vh" text="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
