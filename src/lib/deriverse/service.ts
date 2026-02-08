import { createSolanaRpc } from '@solana/kit';
import { Engine, GetClientDataResponse, GetClientPerpOrdersInfoResponse } from '@deriverse/kit';

// Deriverse SDK service for fetching on-chain data
export class DeriverseService {
  private engine: Engine | null = null;
  private rpcUrl: string;
  private programId: string;

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
    programId: string = process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID || 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu'
  ) {
    this.rpcUrl = rpcUrl;
    this.programId = programId;
  }

  async initialize(): Promise<boolean> {
    try {
      const rpc = createSolanaRpc(this.rpcUrl);
      this.engine = new Engine(rpc, {
        programId: this.programId as `${string}`,
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
