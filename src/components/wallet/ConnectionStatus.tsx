'use client';

import { useState, useEffect } from 'react';
import { useDeriverseEngine, useClientData } from '@/lib/deriverse';
import { useWallet } from '@solana/wallet-adapter-react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const [mounted, setMounted] = useState(false);
  const { connected } = useWallet();
  const { isReady, error: engineError } = useDeriverseEngine();
  const { data: clientData, isLoading: clientLoading, error: clientError } = useClientData();

  // Prevent hydration mismatch - wallet state differs between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (!connected) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <WifiOff className="h-3 w-3" />
        Not Connected
      </Badge>
    );
  }

  // Show loading only briefly, then show connected even if engine is initializing
  if (!isReady && !engineError) {
    return (
      <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        Initializing...
      </Badge>
    );
  }

  // Engine initialization failed (e.g., RangeError from buffer parsing)
  if (engineError) {
    return (
      <Badge variant="outline" className="gap-1 text-orange-500 border-orange-500/30">
        <AlertCircle className="h-3 w-3" />
        Connected (SDK Error)
      </Badge>
    );
  }

  // Client loading or no account found - still considered connected
  if (clientLoading) {
    return (
      <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  // Client error (e.g., "Client account not found") - wallet connected but no trading account
  if (clientError || !clientData) {
    return (
      <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
        <Wifi className="h-3 w-3" />
        Connected (No Account)
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
