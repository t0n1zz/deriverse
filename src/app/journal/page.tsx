'use client';

import { TradeTable } from '@/components/journal/TradeTable';
import { TradeFilters } from '@/components/journal/TradeFilters';
import { useTradeStore } from '@/stores/tradeStore';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, RefreshCw } from 'lucide-react';

export default function JournalPage() {
  const { trades, filteredTrades, loadMockData, isLoading } = useTradeStore();

  const handleExport = () => {
    const headers = ['Date', 'Market', 'Side', 'Entry', 'Exit', 'PnL', 'PnL%', 'Status'];
    const rows = filteredTrades.map(t => [
      new Date(t.timestamp).toISOString(),
      t.market,
      t.side,
      t.entryPrice,
      t.exitPrice ?? '',
      t.pnl ?? '',
      t.pnlPercent ?? '',
      t.status,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
            <p className="text-muted-foreground">
              {trades.length} total trades • {filteredTrades.length} filtered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filteredTrades.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadMockData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <TradeFilters />
        </div>
        <div className="lg:col-span-3">
          <TradeTable pageSize={15} />
        </div>
      </div>
    </div>
  );
}
