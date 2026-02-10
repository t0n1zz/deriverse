'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { useTradeHistory, useClientData } from '@/lib/deriverse';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AUTO_REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export function DataSourceRefreshButton() {
  const {
    dataSource,
    isLoading: storeLoading,
    loadMockData,
    setLoading,
    autoRefresh,
    setAutoRefresh,
  } = useTradeStore();
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { data: tradeHistory, isLoading: historyLoading, refetch: refetchHistory } = useTradeHistory();
  const { isLoading: clientLoading } = useClientData();

  const hasValidWallet = !!walletAddress && isValidAddress;
  const isLoading = storeLoading || (dataSource === 'live' && (clientLoading || historyLoading));

  const handleRefresh = () => {
    if (dataSource === 'mock') {
      loadMockData();
    } else {
      setLoading(true);
      refetchHistory();
    }
  };

  // Auto-refresh when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    // Only auto-refresh when we have something meaningful to refresh
    if (dataSource === 'live' && !hasValidWallet) return;

    const id = setInterval(() => {
      if (dataSource === 'mock') {
        loadMockData();
      } else if (dataSource === 'live' && hasValidWallet) {
        setLoading(true);
        refetchHistory();
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [autoRefresh, dataSource, hasValidWallet, loadMockData, setLoading, refetchHistory]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        <span className="text-xs">Refresh</span>
      </Button>

      <button
        type="button"
        className={cn(
          'inline-flex items-center rounded-md px-3 text-xs h-8 border transition-colors',
          autoRefresh
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/60'
            : 'text-muted-foreground border-border hover:bg-muted/60'
        )}
        onClick={() => setAutoRefresh(!autoRefresh)}
      >
        Auto
      </button>

      {dataSource === 'live' && !hasValidWallet && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Enter wallet address for live data
        </Badge>
      )}

      {dataSource === 'live' && hasValidWallet && historyLoading && (
        <Badge variant="outline" className="text-xs text-blue-500">
          Fetching on-chain trades...
        </Badge>
      )}

      {dataSource === 'live' && hasValidWallet && !historyLoading && (!tradeHistory || tradeHistory.length === 0) && (
        <Badge variant="outline" className="text-xs text-yellow-500">
          No trades found for this wallet
        </Badge>
      )}

      {dataSource === 'live' && hasValidWallet && !historyLoading && tradeHistory && tradeHistory.length > 0 && (
        <Badge variant="outline" className="text-xs text-green-500">
          {tradeHistory.length} trades loaded
        </Badge>
      )}
    </div>
  );
}

