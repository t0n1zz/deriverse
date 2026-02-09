'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenBalance {
  symbol: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h?: number;
}

export function WalletBalance() {
  const [mounted, setMounted] = useState(false);
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch SOL price from CoinGecko
  const fetchSolPrice = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
      );
      const data = await response.json();
      if (data.solana) {
        setSolPrice(data.solana.usd || 0);
        setPriceChange(data.solana.usd_24h_change || 0);
      }
    } catch (error) {
      console.error('Failed to fetch SOL price:', error);
      // Fallback price if API fails
      setSolPrice(150); // Approximate SOL price
    }
  };

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!publicKey || !connection) return;

    setIsLoading(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh
  useEffect(() => {
    if (connected && publicKey) {
      fetchSolPrice();
      fetchBalance();
    }
  }, [connected, publicKey, connection]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      fetchSolPrice();
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const handleRefresh = () => {
    fetchSolPrice();
    fetchBalance();
  };

  // Don't render during SSR or if not connected
  if (!mounted) {
    return null;
  }

  if (!connected) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to view balance
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalUsdValue = solBalance * solPrice;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total USD Value */}
        <div>
          <p className="text-2xl font-bold text-green-500">
            ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">Total Balance (USD)</p>
        </div>

        {/* SOL Balance */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              ◎
            </div>
            <div>
              <p className="text-sm font-medium">
                {solBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL
              </p>
              <p className="text-xs text-muted-foreground">
                @ ${solPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              ${(solBalance * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Badge
              variant="outline"
              className={`text-xs ${priceChange >= 0 ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}
            >
              {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-xs text-muted-foreground text-center">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
