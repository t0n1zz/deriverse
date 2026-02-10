'use client';

import { useState, useEffect } from 'react';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeStore } from '@/stores/tradeStore';
import { useClientData, useAllPerpPositions } from '@/lib/deriverse';
import { getDeriverseService } from '@/lib/deriverse/service';
import { Trade } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, RefreshCw } from 'lucide-react';

type DataSource = 'mock' | 'live';

/**
 * Transform Deriverse SDK perp position data into Trade[] format
 */
function transformLiveDataToTrades(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perpPositions: any[]
): Trade[] {
  const service = getDeriverseService();
  const instruments = service.getInstruments();

  return perpPositions.map((position, index) => {
    const instrId = position.instrId;
    const instrument = instruments?.get(instrId);
    const marketName = instrument?.name || `PERP-${instrId}`;

    // Determine side from position quantity
    const isLong = (position.baseAssetAmount ?? position.qty ?? 0) >= 0;

    // Extract price data
    const entryPrice = position.entryPrice ?? position.avgEntryPrice ?? 0;
    const currentPrice = position.markPrice ?? position.oraclePrice ?? entryPrice;
    const quantity = Math.abs(position.baseAssetAmount ?? position.qty ?? 0);

    // Calculate PnL
    const unrealizedPnl = position.unrealizedPnl ?? position.pnl ?? 0;
    const realizedPnl = position.realizedPnl ?? 0;
    const totalPnl = unrealizedPnl + realizedPnl;
    const pnlPercent = entryPrice > 0 ? (totalPnl / (entryPrice * quantity)) * 100 : 0;

    // Determine status
    const isOpen = quantity > 0;

    return {
      id: `live-${instrId}-${position.clientId ?? index}`,
      txSignature: '',
      timestamp: new Date(),
      market: marketName,
      marketType: 'perpetual' as const,
      side: isLong ? 'long' as const : 'short' as const,
      orderType: 'market' as const,
      entryPrice,
      exitPrice: isOpen ? null : currentPrice,
      quantity,
      leverage: position.leverage ?? null,
      pnl: totalPnl,
      pnlPercent: isNaN(pnlPercent) ? 0 : pnlPercent,
      fees: {
        trading: position.tradingFee ?? 0,
        funding: position.fundingFee ?? 0,
      },
      status: isOpen ? 'open' as const : 'closed' as const,
      duration: null,
      annotations: [],
    };
  });
}

export function DataSourceToggle() {
  const [mounted, setMounted] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isLoading: storeLoading, loadMockData, setTrades, setLoading, setError } = useTradeStore();
  const { data: clientData, isLoading: clientLoading, refetch: refetchClient } = useClientData();
  const { data: perpPositions, isLoading: perpLoading, refetch: refetchPerp } = useAllPerpPositions();

  const hasValidWallet = !!walletAddress && isValidAddress;
  const isLoading = storeLoading || (dataSource === 'live' && (clientLoading || perpLoading));

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // When live data arrives, push it into the trade store
  useEffect(() => {
    if (dataSource !== 'live') return;
    if (clientLoading || perpLoading) return;

    setLoading(true);

    try {
      if (perpPositions && perpPositions.length > 0) {
        const trades = transformLiveDataToTrades(perpPositions);
        setTrades(trades);
      } else if (clientData) {
        // Client exists but has no perp positions - show empty state
        setTrades([]);
      }
    } catch (err) {
      console.error('Failed to transform live data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  }, [dataSource, perpPositions, clientData, clientLoading, perpLoading, setTrades, setLoading, setError]);

  const handleSourceChange = (source: DataSource) => {
    setDataSource(source);

    if (source === 'mock') {
      loadMockData();
    } else if (source === 'live') {
      // Trigger refetch of live data
      setLoading(true);
      refetchClient();
      refetchPerp();
    }
  };

  const handleRefresh = () => {
    if (dataSource === 'mock') {
      loadMockData();
    } else {
      setLoading(true);
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

      {dataSource === 'live' && hasValidWallet && !isLoading && (!perpPositions || perpPositions.length === 0) && (
        <Badge variant="outline" className="text-xs text-yellow-500">
          No positions found for this wallet
        </Badge>
      )}
    </div>
  );
}
