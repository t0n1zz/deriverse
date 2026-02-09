'use client';

import { useState, useEffect } from 'react';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeStore } from '@/stores/tradeStore';
import { useClientData, useAllPerpPositions } from '@/lib/deriverse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, RefreshCw } from 'lucide-react';

type DataSource = 'mock' | 'live';

interface DataSourceToggleProps {
  onDataSourceChange?: (source: DataSource) => void;
}

export function DataSourceToggle({ onDataSourceChange }: DataSourceToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isLoading: storeLoading, loadMockData } = useTradeStore();
  const { isLoading: clientLoading, refetch: refetchClient } = useClientData();
  const { isLoading: perpLoading, refetch: refetchPerp } = useAllPerpPositions();

  const hasValidWallet = !!walletAddress && isValidAddress;
  const isLoading = storeLoading || (dataSource === 'live' && (clientLoading || perpLoading));

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSourceChange = (source: DataSource) => {
    setDataSource(source);
    onDataSourceChange?.(source);

    if (source === 'mock') {
      loadMockData();
    }
  };

  const handleRefresh = () => {
    if (dataSource === 'mock') {
      loadMockData();
    } else {
      refetchClient();
      refetchPerp();
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
    </div>
  );
}
