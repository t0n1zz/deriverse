'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletError } from '@solana/wallet-adapter-base';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivacyProvider } from '@/contexts/PrivacyContext';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface ProvidersProps {
  children: React.ReactNode;
}

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - wallet state differs between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use devnet RPC endpoint
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

  // Initialize wallet adapters (Solflare is auto-detected via Wallet Standard)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  // Handle wallet errors to prevent infinite spinner
  const onError = useCallback((error: WalletError) => {
    console.error('[Wallet Error]', error.name, error.message);

    // Don't show alerts for user-initiated disconnects or cancellations
    if (error.name === 'WalletDisconnectedError') {
      return;
    }

    // Handle specific error types
    if (error.name === 'WalletConnectionError') {
      console.error('Failed to connect wallet. Please try again.');
    } else if (error.name === 'WalletNotReadyError') {
      console.error('Wallet is not ready. Please ensure the wallet extension is installed.');
    } else if (error.name === 'WalletTimeoutError') {
      console.error('Wallet connection timed out. Please try again.');
    }
  }, []);

  // Render only ThemeProvider and QueryClient during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <PrivacyProvider>
            {children}
          </PrivacyProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <PrivacyProvider>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect onError={onError}>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </PrivacyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
