'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

interface WalletAddressContextType {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  isValidAddress: boolean;
  clearAddress: () => void;
}

const WalletAddressContext = createContext<WalletAddressContextType | undefined>(undefined);

const STORAGE_KEY = 'deriverse-wallet-address';

// Validate Solana address format
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function WalletAddressProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Load saved address on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidSolanaAddress(stored)) {
      setWalletAddressState(stored);
      setIsValidAddress(true);
    }
  }, []);

  const setWalletAddress = (address: string | null) => {
    if (address === null) {
      setWalletAddressState(null);
      setIsValidAddress(false);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const isValid = isValidSolanaAddress(address);
    setIsValidAddress(isValid);

    if (isValid) {
      setWalletAddressState(address);
      localStorage.setItem(STORAGE_KEY, address);
    } else {
      setWalletAddressState(address); // Still set it so user can see their input
    }
  };

  const clearAddress = () => {
    setWalletAddressState(null);
    setIsValidAddress(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <WalletAddressContext.Provider value={{ walletAddress, setWalletAddress, isValidAddress, clearAddress }}>
      {children}
    </WalletAddressContext.Provider>
  );
}

export function useWalletAddress() {
  const context = useContext(WalletAddressContext);
  if (context === undefined) {
    throw new Error('useWalletAddress must be used within a WalletAddressProvider');
  }
  return context;
}
