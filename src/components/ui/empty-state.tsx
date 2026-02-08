'use client';

import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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

export function ConnectWalletPrompt({ height = '300px' }: { height?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-border bg-card"
      style={{ height }}
    >
      <EmptyState
        icon={<Wallet className="h-12 w-12" />}
        title="Connect Your Wallet"
        description="Connect your Solana wallet to view your trading analytics and position history from Deriverse."
        action={
          <div className="wallet-adapter-button-wrapper mt-2">
            <WalletMultiButton />
          </div>
        }
      />
    </div>
  );
}
