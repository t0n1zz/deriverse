'use client';

import { useQuery } from '@tanstack/react-query';
import { useWalletAddress } from '@/contexts/WalletAddressContext';
import { getDeriverseService } from './service';
import { useEffect, useState } from 'react';

// Hook to initialize Deriverse engine
export function useDeriverseEngine() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initEngine = async () => {
      const service = getDeriverseService();
      if (!service.isReady()) {
        try {
          const success = await service.initialize();
          setIsReady(success);
          if (!success) {
            setError(new Error('Failed to initialize Deriverse engine'));
          }
        } catch (err) {
          setError(err as Error);
          setIsReady(false);
        }
      } else {
        setIsReady(true);
      }
    };

    initEngine();
  }, []);

  return { isReady, error };
}

// Hook to get client data (positions, balances, etc.) using pasted wallet address
export function useClientData() {
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isReady: engineReady } = useDeriverseEngine();

  return useQuery({
    queryKey: ['clientData', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const service = getDeriverseService();
      await service.setWallet(walletAddress);
      return service.getClientData();
    },
    enabled: !!walletAddress && isValidAddress && engineReady,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to get perp position details for a specific instrument
export function usePerpPosition(instrId: number, clientId: number | undefined) {
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isReady: engineReady } = useDeriverseEngine();

  return useQuery({
    queryKey: ['perpPosition', walletAddress, instrId, clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const service = getDeriverseService();
      return service.getPerpPositionInfo(instrId, clientId);
    },
    enabled: !!walletAddress && isValidAddress && engineReady && clientId !== undefined,
    staleTime: 15000, // 15 seconds for position data
    refetchInterval: 30000,
  });
}

// Hook to get all perp positions - simplified to just use client data
export function useAllPerpPositions() {
  const { data: clientData } = useClientData();
  const { isReady: engineReady } = useDeriverseEngine();

  return useQuery({
    queryKey: ['allPerpPositions', Array.from(clientData?.perp?.entries() ?? [])],
    queryFn: async () => {
      if (!clientData?.perp) return [];
      if (clientData.perp.size === 0) return [];

      // Convert the perp map directly to an array without querying each instrument
      const positions = [];
      const perpEntries = Array.from(clientData.perp.entries());

      for (const [instrId, perpData] of perpEntries) {
        positions.push({
          ...perpData,
          instrId,
        });
      }

      return positions;
    },
    enabled: engineReady && !!clientData,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Hook to fetch trade history from logs
export function useTradeHistory() {
  const { walletAddress, isValidAddress } = useWalletAddress();
  const { isReady: engineReady } = useDeriverseEngine();

  return useQuery({
    queryKey: ['tradeHistory', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const service = getDeriverseService();
      return service.getTradeHistory(walletAddress);
    },
    enabled: !!walletAddress && isValidAddress && engineReady,
    staleTime: 5 * 60 * 1000, // 5 minutes — history doesn't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 15000),
  });
}
