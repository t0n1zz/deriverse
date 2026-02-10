'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { useTradeStore } from '@/stores/tradeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, ArrowRight, Database } from 'lucide-react';

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function WalletLanding() {
  const { setWalletAddress } = useWalletAddress();
  const { loadMockData } = useTradeStore();
  const [inputValue, setInputValue] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const inputValid = inputValue.trim() ? isValidSolanaAddress(inputValue.trim()) : false;

  const handleSubmit = () => {
    setHasAttempted(true);
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (isValidSolanaAddress(trimmed)) {
      setWalletAddress(trimmed);
    }
  };

  const handleMockData = () => {
    loadMockData();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
      {/* Hero Content */}
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Icon & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Deriverse Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Paste any Solana wallet address to view trading analytics on Deriverse.
          </p>
        </div>

        {/* Wallet Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Paste wallet address..."
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setHasAttempted(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="pl-10 h-12 font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="h-12 px-6 gap-2"
            >
              Analyze
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Validation feedback */}
          {hasAttempted && inputValue.trim() && !inputValid && (
            <p className="text-sm text-red-500">Invalid Solana address format</p>
          )}
          {inputValue.trim() && inputValid && (
            <p className="text-sm text-green-500">✓ Valid Solana address</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Mock Data Option */}
        <Button
          variant="outline"
          onClick={handleMockData}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          Explore with Mock Data
        </Button>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground">
          💡 No wallet connection needed. Read-only analytics for any public address.
        </p>
      </div>
    </div>
  );
}
