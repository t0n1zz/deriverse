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

// Hook to aggregate all perp positions for the wallet address
export function useAllPerpPositions() {
  const { data: clientData } = useClientData();
  const { isReady: engineReady } = useDeriverseEngine();

  return useQuery({
    queryKey: ['allPerpPositions', Array.from(clientData?.perp?.entries() ?? [])],
    queryFn: async () => {
      if (!clientData?.perp) return [];

      const service = getDeriverseService();
      const positions = [];
      const perpEntries = Array.from(clientData.perp.entries());

      for (const [instrId, perpData] of perpEntries) {
        const positionInfo = await service.getPerpPositionInfo(instrId, perpData.clientId);
        if (positionInfo) {
          positions.push({
            instrId,
            clientId: perpData.clientId,
            ...positionInfo,
          });
        }
      }

      return positions;
    },
    enabled: engineReady && !!clientData?.perp && clientData.perp.size > 0,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
