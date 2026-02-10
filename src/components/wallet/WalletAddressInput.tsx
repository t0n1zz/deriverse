'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, X, Check, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function WalletAddressInput() {
  const { walletAddress, setWalletAddress, isValidAddress, clearAddress } = useWalletAddress();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [inputValue, setInputValue] = useState(walletAddress || '');
  const [open, setOpen] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const inputValid = inputValue.trim() ? isValidSolanaAddress(inputValue.trim()) : false;

  const handleSubmit = () => {
    setHasAttempted(true);
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (isValidSolanaAddress(trimmed)) {
      setWalletAddress(trimmed);

      const params = new URLSearchParams(searchParams.toString());
      params.set('wallet', trimmed);
      // Wallet connected ⇒ always live; clear any mock flag
      params.delete('mode');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      setOpen(false);
      setHasAttempted(false);
    }
  };

  const handleClear = () => {
    clearAddress();
    setInputValue('');
    setHasAttempted(false);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // If address is set, show compact view
  if (walletAddress && isValidAddress) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          <Wallet className="h-3.5 w-3.5" />
          {shortenAddress(walletAddress)}
        </Badge>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show input dialog
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) setHasAttempted(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Enter Wallet Address
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>View Wallet Analytics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste any Solana wallet address to view its Deriverse trading analytics.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste wallet address..."
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setHasAttempted(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleSubmit} disabled={!inputValue.trim()}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {hasAttempted && inputValue.trim() && !inputValid && (
            <p className="text-sm text-red-500">Invalid Solana address format</p>
          )}
          {inputValue.trim() && inputValid && (
            <p className="text-sm text-green-500">✓ Valid Solana address</p>
          )}
          <p className="text-xs text-muted-foreground">
            💡 No wallet connection needed. Just paste any public address to view analytics.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
