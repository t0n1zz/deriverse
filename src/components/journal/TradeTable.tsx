'use client';

import { useState, useMemo } from 'react';
import { useTradeStore } from '@/stores/tradeStore';
import { Trade, TradeSort } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';

interface TradeTableProps {
  trades?: Trade[];
  pageSize?: number;
}

export function TradeTable({ trades: propTrades, pageSize = 15 }: TradeTableProps) {
  const storeTrades = useTradeStore(state => state.filteredTrades);
  const updateTrade = useTradeStore(state => state.updateTrade);
  const trades = propTrades ?? storeTrades;

  const [annotationTradeId, setAnnotationTradeId] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState('');

  const [sort, setSort] = useState<TradeSort>({ field: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Sort and paginate trades
  const { sortedTrades, totalPages, paginatedTrades } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    const total = Math.ceil(sorted.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    return { sortedTrades: sorted, totalPages: total, paginatedTrades: paginated };
  }, [trades, sort, currentPage, pageSize]);

  const handleSort = (field: keyof Trade) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: keyof Trade }) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc'
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const StatusBadge = ({ status }: { status: Trade['status'] }) => {
    const variants = {
      open: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      closed: 'bg-green-500/20 text-green-500 border-green-500/30',
      liquidated: 'bg-red-500/20 text-red-500 border-red-500/30',
    };

    return (
      <Badge variant="outline" className={cn('capitalize', variants[status])}>
        {status}
      </Badge>
    );
  };

  const SideBadge = ({ side }: { side: Trade['side'] }) => {
    return (
      <div className={cn(
        'flex items-center gap-1 font-medium',
        side === 'long' ? 'text-green-500' : 'text-red-500'
      )}>
        {side === 'long' ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
        {side.toUpperCase()}
      </div>
    );
  };

  const openAnnotationEditor = (trade: Trade) => {
    setAnnotationTradeId(trade.id);
    setAnnotationDraft((trade.annotations ?? []).join('\n'));
  };

  const saveAnnotations = () => {
    if (!annotationTradeId) return;
    const lines = annotationDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updateTrade(annotationTradeId, { annotations: lines });
    setAnnotationTradeId(null);
  };

  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No trades to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="rounded-lg border border-border bg-card overflow-x-auto overflow-y-visible">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Date <SortIcon field="timestamp" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('market')}
              >
                <div className="flex items-center gap-1">
                  Market <SortIcon field="market" />
                </div>
              </TableHead>
              <TableHead>Side</TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('orderType')}
              >
                <div className="flex items-center gap-1">
                  Type <SortIcon field="orderType" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('entryPrice')}
              >
                <div className="flex items-center gap-1">
                  Entry <SortIcon field="entryPrice" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-end gap-1">
                  Size <SortIcon field="quantity" />
                </div>
              </TableHead>
              <TableHead>Exit</TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center justify-end gap-1">
                  PnL <SortIcon field="pnl" />
                </div>
              </TableHead>
              <TableHead className="text-right">PnL %</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[120px]">Notes</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => (
              <TableRow key={trade.id} className="group">
                <TableCell className="font-mono text-sm">
                  {format(new Date(trade.timestamp), 'MMM dd HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  {trade.market}
                </TableCell>
                <TableCell>
                  <SideBadge side={trade.side} />
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {trade.orderType}
                </TableCell>
                <TableCell className="font-mono">
                  ${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {trade.quantity > 0
                    ? trade.quantity.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })
                    : '-'}
                </TableCell>
                <TableCell className="font-mono">
                  {trade.exitPrice
                    ? `$${trade.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    : '-'
                  }
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono font-medium',
                  (trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {(trade.pnl ?? 0) >= 0 ? '+' : ''}
                  ${Math.abs(trade.pnl ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono',
                  (trade.pnlPercent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {(trade.pnlPercent ?? 0) >= 0 ? '+' : ''}
                  {trade.pnlPercent?.toFixed(2) ?? '0.00'}%
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(trade.duration)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={trade.status} />
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm text-muted-foreground">
                      {(trade.annotations ?? []).length > 0
                        ? (trade.annotations ?? []).slice(0, 2).join('; ')
                        : '—'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => openAnnotationEditor(trade)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedTrades.length)} of {sortedTrades.length} trades
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!annotationTradeId} onOpenChange={(open) => !open && setAnnotationTradeId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit trade notes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">One note per line. These are stored locally for your review.</p>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={annotationDraft}
            onChange={(e) => setAnnotationDraft(e.target.value)}
            placeholder="Add notes..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnotationTradeId(null)}>Cancel</Button>
            <Button onClick={saveAnnotations}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
