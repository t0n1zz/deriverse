'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeStore } from '@/stores/tradeStore';
import { useTradeHistory, useClientData } from '@/lib/deriverse';

import { Database, Cloud } from 'lucide-react';

export function DataSourceToggle() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const {
    dataSource,
    setDataSource,
    loadMockData,
    setTrades,
    setLoading,
    setError,
  } = useTradeStore();
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isLoading: clientLoading } = useClientData();
  const { data: tradeHistory, isLoading: historyLoading, refetch: refetchHistory } = useTradeHistory();

  const hasValidWallet = !!walletAddress && isValidAddress;


  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Choose data source based on URL and wallet:
  // - If wallet is connected → always live (until wallet is cleared)
  // - Else if ?mode=mock → mock data
  // - Else → leave empty so dashboard can show landing
  useEffect(() => {
    if (!mounted) return;

    const mode = searchParams.get('mode');

    // Wallet present: force live mode
    if (hasValidWallet) {
      if (dataSource !== 'live') {
        setDataSource('live');
        setLoading(true);
        refetchHistory();
      }
      return;
    }

    // No wallet: allow persistent/mock-only mode via URL
    if (mode === 'mock') {
      if (dataSource !== 'mock') {
        setDataSource('mock');
      }
      // Ensure mock trades are present
      loadMockData();
    }
  }, [mounted, searchParams, hasValidWallet, dataSource, setDataSource, setLoading, refetchHistory, loadMockData]);

  // Sync store loading state with history fetching
  useEffect(() => {
    if (dataSource === 'live') {
      setLoading(historyLoading || clientLoading);
    }
  }, [dataSource, historyLoading, clientLoading, setLoading]);

  // When live trade history arrives, push it into the trade store
  useEffect(() => {
    if (dataSource !== 'live') return;
    if (historyLoading) return;

    try {
      if (tradeHistory && tradeHistory.length > 0) {
        setTrades(tradeHistory);
      } else {
        // No trades: clear store so dashboard shows "No Position Data" or empty state
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to process live trade data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load live data');
    }
  }, [dataSource, tradeHistory, historyLoading, setTrades, setError]);

  // Return skeleton during SSR
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-muted/50 px-2 h-7 w-24" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-border bg-muted/50 px-2 h-7">
        {dataSource === 'live' ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
            <Cloud className="h-3.5 w-3.5" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Mock
          </span>
        )}
      </div>
    </div>
  );
}
