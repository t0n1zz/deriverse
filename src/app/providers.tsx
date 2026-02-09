'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { WalletAddressProvider } from '@/contexts/WalletAddressContext';

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
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <PrivacyProvider>
          <WalletAddressProvider>
            {children}
          </WalletAddressProvider>
        </PrivacyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
