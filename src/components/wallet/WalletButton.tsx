'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  const { connected, publicKey } = useWallet();

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
