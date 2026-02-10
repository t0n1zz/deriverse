'use client';

import { useState, useEffect } from 'react';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeStore } from '@/stores/tradeStore';
import { useTradeHistory, useClientData } from '@/lib/deriverse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, RefreshCw } from 'lucide-react';

type DataSource = 'mock' | 'live';

export function DataSourceToggle() {
  const [mounted, setMounted] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isLoading: storeLoading, loadMockData, setTrades, setLoading, setError } = useTradeStore();
  const { data: clientData, isLoading: clientLoading } = useClientData();
  const { data: tradeHistory, isLoading: historyLoading, refetch: refetchHistory } = useTradeHistory();

  const hasValidWallet = !!walletAddress && isValidAddress;
  const isLoading = storeLoading || (dataSource === 'live' && (clientLoading || historyLoading));

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // When live trade history arrives, push it into the trade store
  useEffect(() => {
    if (dataSource !== 'live') return;
    if (historyLoading) return;

    try {
      if (tradeHistory && tradeHistory.length > 0) {
        setTrades(tradeHistory);
      } else if (clientData && !historyLoading) {
        // Client exists but no trade fills found
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to process live trade data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load live data');
    }
  }, [dataSource, tradeHistory, clientData, historyLoading, setTrades, setError]);

  const handleSourceChange = (source: DataSource) => {
    setDataSource(source);

    if (source === 'mock') {
      loadMockData();
    } else if (source === 'live') {
      setLoading(true);
      refetchHistory();
    }
  };

  const handleRefresh = () => {
    if (dataSource === 'mock') {
      loadMockData();
    } else {
      setLoading(true);
      refetchHistory();
    }
  };

  // Return skeleton during SSR
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1 h-9 w-32" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
        <Button
          variant={dataSource === 'mock' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSourceChange('mock')}
          className="gap-1.5 h-7"
        >
          <Database className="h-3.5 w-3.5" />
          Mock
        </Button>
        <Button
          variant={dataSource === 'live' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleSourceChange('live')}
          disabled={!hasValidWallet}
          className="gap-1.5 h-7"
        >
          <Cloud className="h-3.5 w-3.5" />
          Live
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>

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
