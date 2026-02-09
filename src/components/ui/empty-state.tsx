'use client';

import { cn } from '@/lib/utils';
import { Wallet, Search } from 'lucide-react';
import { WalletAddressInput } from '@/components/wallet/WalletAddressInput';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 p-8 text-center',
      className
    )}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EnterWalletPrompt({ height = '300px' }: { height?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-border bg-card"
      style={{ height }}
    >
      <EmptyState
        icon={<Search className="h-12 w-12" />}
        title="Enter a Wallet Address"
        description="Paste any Solana wallet address to view trading analytics and position history from Deriverse."
        action={
          <div className="mt-2">
            <WalletAddressInput />
          </div>
        }
      />
    </div>
  );
}
