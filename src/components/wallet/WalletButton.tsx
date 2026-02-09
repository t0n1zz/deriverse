'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const { connected } = useWallet();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return placeholder during SSR
  if (!mounted) {
    return (
      <div className="wallet-adapter-button-wrapper">
        <div
          style={{
            backgroundColor: 'hsl(var(--secondary))',
            borderRadius: '0.5rem',
            height: '2.5rem',
            width: '10rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        />
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-wrapper">
      <WalletMultiButton
        style={{
          backgroundColor: connected ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
          borderRadius: '0.5rem',
          height: '2.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      />
    </div>
  );
}
