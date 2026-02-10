import { createSolanaRpc } from '@solana/kit';
import { Engine, GetClientDataResponse, GetClientPerpOrdersInfoResponse } from '@deriverse/kit';
import { fetchTradeHistory } from './history';
import { Trade } from '@/types';

// Deriverse SDK service for fetching on-chain data
export class DeriverseService {
  private engine: Engine | null = null;
  private rpcUrl: string;
  private programId: string;
  private version: number;

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
    programId: string = process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID || 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu',
    version: number = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION || '12', 10)
  ) {
    this.rpcUrl = rpcUrl;
    this.programId = programId;
    this.version = version;
  }

  async initialize(): Promise<boolean> {
    try {
      const rpc = createSolanaRpc(this.rpcUrl);
      this.engine = new Engine(rpc, {
        programId: this.programId as `${string}`,
        version: this.version,
        uiNumbers: true,
        commitment: 'confirmed',
      });
      return await this.engine.initialize();
    } catch (error) {
      console.error('Failed to initialize Deriverse engine:', error);
      return false;
    }
  }

  async setWallet(walletAddress: string): Promise<void> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    await this.engine.setSigner(walletAddress as `${string}`);
  }

  async getClientData(): Promise<GetClientDataResponse | null> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    try {
      return await this.engine.getClientData();
    } catch (error) {
      console.error('Failed to get client data:', error);
      return null;
    }
  }

  async getPerpPositionInfo(
    instrId: number,
    clientId: number
  ): Promise<GetClientPerpOrdersInfoResponse | null> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    try {
      return await this.engine.getClientPerpOrdersInfo({ instrId, clientId });
    } catch (error) {
      console.error('Failed to get perp position info:', error);
      return null;
    }
  }

  async getTradeHistory(walletAddress: string): Promise<Trade[]> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    try {
      // Access the underlying connection from the RPC object if possible, 
      // or create a new connection using the stored RPC URL.
      // @solana/kit Rpc object might not expose connection directly in a way we need for getParsedTransactions?
      // Actually `createSolanaRpc` returns a proxy. We might need a raw web3.js Connection for the history function.

      const { Connection } = await import('@solana/web3.js');
      const connection = new Connection(this.rpcUrl, 'confirmed');

      return await fetchTradeHistory(connection, this.engine, walletAddress);
    } catch (error) {
      console.error('Failed to get trade history:', error);
      return [];
    }
  }

  getInstruments() {
    return this.engine?.instruments ?? null;
  }

  getTokens() {
    return this.engine?.tokens ?? null;
  }

  isReady(): boolean {
    return this.engine !== null;
  }
}

// Singleton instance
let serviceInstance: DeriverseService | null = null;

export function getDeriverseService(): DeriverseService {
  if (!serviceInstance) {
    serviceInstance = new DeriverseService();
  }
  return serviceInstance;
}
