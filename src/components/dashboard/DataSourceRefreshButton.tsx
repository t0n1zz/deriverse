'use client';

import { RefreshCw } from 'lucide-react';
import { useTradeStore } from '@/stores/tradeStore';
import { useTradeHistory, useClientData } from '@/lib/deriverse';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { Badge } from '@/components/ui/badge';

export function DataSourceRefreshButton() {
  const {
    dataSource,
    isLoading: storeLoading,
    loadMockData,
    setLoading,
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

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
        onClick={handleRefresh}
        disabled={isLoading}
        aria-label="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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

