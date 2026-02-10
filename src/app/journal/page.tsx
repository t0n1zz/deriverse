'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { TradeTable } from '@/components/journal/TradeTable';
import { TradeFilters } from '@/components/journal/TradeFilters';
import { TradeSearch } from '@/components/journal/TradeSearch';
import { useTradeStore } from '@/stores/tradeStore';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeHistory } from '@/lib/deriverse';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, RefreshCw } from 'lucide-react';

function JournalContent() {
  const {
    trades,
    filteredTrades,
    loadMockData,
    isLoading,
    dataSource,
    setTrades,
    setLoading,
    setError,
    clearTrades,
  } = useTradeStore();
  const { walletAddress, isValidAddress, setWalletAddress } = useWalletAddress();
  const { data: tradeHistory, isLoading: historyLoading, refetch: refetchHistory } = useTradeHistory();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [didInitFromUrl, setDidInitFromUrl] = useState(false);

  // Sync wallet address from URL (?wallet=...) into context
  useEffect(() => {
    if (didInitFromUrl) return;
    const urlWallet = searchParams.get('wallet');
    if (!urlWallet) return;
    setWalletAddress(urlWallet);
    setDidInitFromUrl(true);
  }, [searchParams, didInitFromUrl, setWalletAddress]);

  // Keep wallet query param in sync with context on /journal as well
  useEffect(() => {
    const current = searchParams.get('wallet');
    if (!walletAddress || !isValidAddress) {
      if (!current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete('wallet');
      const query = new URLSearchParams(params).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      return;
    }
    if (current === walletAddress) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('wallet', walletAddress);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [walletAddress, isValidAddress, searchParams, router, pathname]);

  // When wallet is cleared in live mode, clear journal trades so it resets
  useEffect(() => {
    if (dataSource !== 'live') return;
    if (walletAddress && isValidAddress) return;

    clearTrades();
    setLoading(false);
  }, [dataSource, walletAddress, isValidAddress, clearTrades, setLoading]);

  // Ensure trades are loaded when landing directly on /journal
  useEffect(() => {
    const mode = searchParams.get('mode');

    // Wallet present: prefer live data
    if (walletAddress && isValidAddress) {
      if (
        dataSource === 'live' &&
        trades.length === 0 &&
        !historyLoading
      ) {
        setLoading(true);
        refetchHistory();
      }
      return;
    }

    // No wallet: allow mock mode via URL
    if (mode === 'mock') {
      if (dataSource !== 'mock' || trades.length === 0) {
        loadMockData();
      }
    }
  }, [
    dataSource,
    trades.length,
    walletAddress,
    isValidAddress,
    historyLoading,
    loadMockData,
    refetchHistory,
    setLoading,
    searchParams,
  ]);

  // When live trade history arrives, push it into the trade store
  useEffect(() => {
    if (dataSource !== 'live') return;
    if (historyLoading) return;

    try {
      if (tradeHistory && tradeHistory.length > 0) {
        setTrades(tradeHistory);
      } else if (walletAddress && isValidAddress) {
        // Live wallet but no history found
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to process live trade data (journal):', err);
      setError(err instanceof Error ? err.message : 'Failed to load live data');
    } finally {
      if (!historyLoading) {
        setLoading(false);
      }
    }
  }, [dataSource, tradeHistory, historyLoading, walletAddress, isValidAddress, setTrades, setError, setLoading]);

  // Apply search filter on top of store filters
  const displayTrades = useMemo(() => {
    if (!searchQuery.trim()) return filteredTrades;

    const query = searchQuery.toLowerCase();
    return filteredTrades.filter(trade =>
      trade.market.toLowerCase().includes(query) ||
      trade.txSignature?.toLowerCase().includes(query) ||
      trade.side.toLowerCase().includes(query)
    );
  }, [filteredTrades, searchQuery]);

  const handleExport = () => {
    const headers = ['Date', 'Market', 'Side', 'Entry', 'Exit', 'PnL', 'PnL%', 'Status', 'TxSignature'];
    const rows = displayTrades.map(t => [
      new Date(t.timestamp).toISOString(),
      t.market,
      t.side,
      t.entryPrice,
      t.exitPrice ?? '',
      t.pnl ?? '',
      t.pnlPercent ?? '',
      t.status,
      t.txSignature ?? '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefreshClick = () => {
    if (dataSource === 'live' && walletAddress && isValidAddress) {
      setLoading(true);
      refetchHistory();
    } else {
      loadMockData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
            <p className="text-muted-foreground">
              {trades.length} total • {displayTrades.length} showing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={displayTrades.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleRefreshClick}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <TradeSearch onSearch={setSearchQuery} />

      {/* Filters and Table */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <TradeFilters />
        </div>
        <div className="lg:col-span-3">
          <TradeTable trades={displayTrades} pageSize={15} />
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading journal...</p>
          </div>
        </div>
      }>
        <JournalContent />
      </Suspense>
    </div>
  );
}
