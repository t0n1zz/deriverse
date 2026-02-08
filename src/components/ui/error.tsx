'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ message, onRetry, className }: ErrorDisplayProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3 p-6 rounded-lg border border-destructive/30 bg-destructive/5',
      className
    )}>
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-destructive text-center max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  height?: string;
}

export function ErrorCard({ message, onRetry, height = '200px' }: ErrorCardProps) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-border bg-card"
      style={{ height }}
    >
      <ErrorDisplay message={message} onRetry={onRetry} />
    </div>
  );
}
