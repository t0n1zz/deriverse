import { createSolanaRpc, address } from '@solana/kit';
import { Engine, GetClientDataResponse, GetClientPerpOrdersInfoResponse } from '@deriverse/kit';
import { fetchTradeHistory } from './history';
import { Trade } from '@/types';

// Deriverse SDK service for fetching on-chain data
export class DeriverseService {
  private engine: Engine | null = null;
  private rpcUrl: string;
  private programId: string;
  private version: number;
  private tokenSymbols: Map<number, string> = new Map();
  private baseTokenId: number | null = null;

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
      const ok = await this.engine.initialize();
      if (!ok) return false;

      // Derive known token symbols (e.g. SOL / USDC) from configured mints
      try {
        const solMint = process.env.NEXT_PUBLIC_TOKEN_SOL;
        const usdcMint = process.env.NEXT_PUBLIC_TOKEN_USDC;

        if (solMint) {
          const solId = await this.engine.getTokenId(address(solMint as `${string}`));
          if (solId !== null) {
            this.tokenSymbols.set(solId, 'SOL');
          }
        }
        if (usdcMint) {
          const usdcId = await this.engine.getTokenId(address(usdcMint as `${string}`));
          if (usdcId !== null) {
            this.tokenSymbols.set(usdcId, 'USDC');
            this.baseTokenId = usdcId;
          }
        }

        // Fallback: if no explicit base token was found, pick the first instrument's currency token
        if (this.baseTokenId === null && this.engine.instruments && this.engine.instruments.size > 0) {
          const firstInstr = Array.from(this.engine.instruments.values())[0] as { header: { crncyTokenId: number } };
          this.baseTokenId = firstInstr.header.crncyTokenId;
        }
      } catch (e) {
        console.warn('Failed to derive token symbols from mints:', e);
      }

      return true;
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

      return await fetchTradeHistory(connection, this.engine, walletAddress, this.tokenSymbols);
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

  /**
   * Resolve a Deriverse token ID into a human-readable symbol when possible.
   * Falls back to "Token {id}" if we don't know it.
   */
  getTokenSymbol(tokenId: number): string {
    return this.tokenSymbols.get(tokenId) ?? `Token ${tokenId}`;
  }

  /**
   * Approximate Deriverse account equity in base token (e.g. USDC).
   * Uses client token balances and instrument prices.
   */
  async getAccountEquity(): Promise<number | null> {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    const client = await this.getClientData();
    if (!client || !client.tokens || client.tokens.size === 0) return null;
    if (this.baseTokenId === null) return null;

    const instruments = this.engine.instruments;
    if (!instruments || instruments.size === 0) return null;

    let total = 0;

    for (const token of client.tokens.values()) {
      const { tokenId, amount } = token;
      if (tokenId === this.baseTokenId) {
        // Base currency balance (e.g. USDC)
        total += amount;
      } else {
        // Try to find a spot or perp market where this token is the asset and baseTokenId is the currency
        const entry = Array.from(instruments.values()).find(instr => {
          const header = instr.header as { assetTokenId: number; crncyTokenId: number };
          return header.assetTokenId === tokenId && header.crncyTokenId === this.baseTokenId;
        }) as { header: { lastPx?: number; bestBid?: number; bestAsk?: number } } | undefined;

        if (!entry) continue;

        const header = entry.header;
        let price = header.lastPx ?? 0;
        const bestBid = header.bestBid ?? 0;
        const bestAsk = header.bestAsk ?? 0;

        if (price <= 0 && bestBid > 0 && bestAsk > 0) {
          price = (bestBid + bestAsk) / 2;
        } else if (price <= 0) {
          price = bestBid || bestAsk || 0;
        }

        if (price > 0) {
          total += amount * price;
        }
      }
    }

    return total;
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
