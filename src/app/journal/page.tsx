'use client';

import { useState, useMemo } from 'react';
import { TradeTable } from '@/components/journal/TradeTable';
import { TradeFilters } from '@/components/journal/TradeFilters';
import { TradeSearch } from '@/components/journal/TradeSearch';
import { useTradeStore } from '@/stores/tradeStore';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, RefreshCw } from 'lucide-react';

export default function JournalPage() {
  const { trades, filteredTrades, loadMockData, isLoading } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');

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
          <Button variant="outline" onClick={loadMockData}>
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
