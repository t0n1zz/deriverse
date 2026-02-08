'use client';

import { useDeriverseEngine, useClientData } from '@/lib/deriverse';
import { useWallet } from '@solana/wallet-adapter-react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const { connected } = useWallet();
  const { isReady, error } = useDeriverseEngine();
  const { data: clientData, isLoading: clientLoading } = useClientData();

  if (!connected) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <WifiOff className="h-3 w-3" />
        Not Connected
      </Badge>
    );
  }

  if (!isReady || clientLoading) {
    return (
      <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting...
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="outline" className="gap-1 text-red-500 border-red-500/30">
        <WifiOff className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
      <Wifi className="h-3 w-3" />
      {clientData ? `ID: ${clientData.clientId}` : 'Connected'}
    </Badge>
  );
}
