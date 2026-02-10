import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import {
  Engine,
  LogType,
  PerpFillOrderReportModel,
  PerpPlaceOrderReportModel,
  PerpFeesReportModel,
  PerpFundingReportModel,
  SpotPlaceOrderReportModel,
  SpotFillOrderReportModel,
  SpotFeesReportModel,
  LogMessage
} from '@deriverse/kit';
import { Trade } from '@/types';

// Helper to check if a log is a specific type
function isLogType<T>(log: LogMessage, type: LogType): log is T & LogMessage {
  return log.tag === type;
}

/**
 * Fetch and parse trade history from on-chain logs.
 */
export async function fetchTradeHistory(
  connection: Connection,
  engine: Engine,
  walletAddress: string,
  limit: number = 100
): Promise<Trade[]> {
  const pubkey = new PublicKey(walletAddress);

  // 1. Fetch signatures
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  if (signatures.length === 0) return [];

  // 2. Fetch parsed transactions one by one to avoid rate limits
  const txs: (ParsedTransactionWithMeta | null)[] = [];

  for (let i = 0; i < signatures.length; i++) {
    const signature = signatures[i].signature;

    let retries = 3;
    while (retries > 0) {
      try {
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed'
        });
        if (tx) txs.push(tx);
        break;
      } catch (e: any) {
        if (e.message?.includes('429')) {
          const delay = (4 - retries) * 1000;
          await new Promise(r => setTimeout(r, delay));
          retries--;
        } else {
          console.warn(`Failed to fetch history tx ${signature}, skipping...`);
          break;
        }
      }
    }

    // Small delay between requests to be nice to public RPC
    await new Promise(r => setTimeout(r, 200));
  }

  const trades: Trade[] = [];

  // Process transactions chronologically if needed, but reverse at end for UI
  for (const tx of txs) {
    if (!tx || !tx.meta || !tx.meta.logMessages || !tx.transaction.signatures[0]) continue;

    // Use SDK to decode logs
    let logs: LogMessage[] = [];
    try {
      logs = engine.logsDecode(tx.meta.logMessages);
    } catch (e) {
      // Not a Deriverse transaction or decoding failed
      continue;
    }

    const signature = tx.transaction.signatures[0];
    const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

    // Context for this transaction
    let placedPerpInstrId: number | null = null;
    let placedSpotInstrId: number | null = null;

    const txTrades: Trade[] = [];

    for (const log of logs) {
      // --- PERP ---

      // TRACK CONTEXT
      if (isLogType<PerpPlaceOrderReportModel>(log, LogType.perpPlaceOrder)) {
        placedPerpInstrId = log.instrId;
      }

      // HANDLE FILLS
      if (isLogType<PerpFillOrderReportModel>(log, LogType.perpFillOrder)) {
        const fill = log;
        const instrId = placedPerpInstrId ?? 0;
        const marketName = instrId ? `PERP-${instrId}` : 'Unknown-PERP';
        const side = fill.side === 0 ? 'long' : 'short';

        const trade: Trade = {
          id: `${signature}-${fill.orderId.toString()}`,
          txSignature: signature,
          timestamp: timestamp,
          market: marketName,
          marketType: 'perpetual',
          side: side,
          orderType: 'limit',
          entryPrice: fill.price,
          exitPrice: null,
          quantity: fill.perps,
          leverage: null,
          pnl: 0,
          pnlPercent: 0,
          fees: { trading: 0, funding: 0 },
          status: 'closed',
          duration: null,
          annotations: [],
        };
        txTrades.push(trade);
      }

      // HANDLE FEES
      if (isLogType<PerpFeesReportModel>(log, LogType.perpFees)) {
        if (txTrades.length > 0) {
          const lastTrade = txTrades[txTrades.length - 1];
          if (lastTrade.marketType === 'perpetual') {
            lastTrade.fees.trading += log.fees;
          }
        }
      }

      // HANDLE FUNDING
      if (isLogType<PerpFundingReportModel>(log, LogType.perpFunding)) {
        const funding = log;
        const fundingTrade: Trade = {
          id: `${signature}-funding-${funding.instrId}`,
          txSignature: signature,
          timestamp: timestamp,
          market: `PERP-${funding.instrId}`,
          marketType: 'perpetual',
          side: 'long',
          orderType: 'market',
          entryPrice: 0,
          exitPrice: 0,
          quantity: 0,
          leverage: null,
          pnl: funding.funding,
          pnlPercent: 0,
          fees: { trading: 0, funding: -funding.funding },
          status: 'closed',
          duration: null,
          annotations: ['Funding Payment'],
        };
        txTrades.push(fundingTrade);
      }

      // --- SPOT ---

      // TRACK CONTEXT
      if (isLogType<SpotPlaceOrderReportModel>(log, LogType.spotPlaceOrder)) {
        placedSpotInstrId = log.instrId;
      }

      // HANDLE FILLS
      if (isLogType<SpotFillOrderReportModel>(log, LogType.spotFillOrder)) {
        const fill = log;
        const instrId = placedSpotInstrId ?? 0;
        const marketName = instrId ? `SPOT-${instrId}` : 'Unknown-SPOT';
        const side = fill.side === 0 ? 'long' : 'short'; // 0 = Buy? Need to verify. Assuming standard.

        const trade: Trade = {
          id: `${signature}-${fill.orderId.toString()}`,
          txSignature: signature,
          timestamp: timestamp,
          market: marketName,
          marketType: 'spot',
          side: side,
          orderType: 'limit',
          entryPrice: fill.price,
          exitPrice: null,
          quantity: fill.qty,
          leverage: null,
          pnl: null, // Spot trades don't have PnL on fill
          pnlPercent: null,
          fees: { trading: 0, funding: 0 },
          status: 'closed',
          duration: null,
          annotations: [],
        };
        txTrades.push(trade);
      }

      // HANDLE FEES
      if (isLogType<SpotFeesReportModel>(log, LogType.spotFees)) {
        if (txTrades.length > 0) {
          const lastTrade = txTrades[txTrades.length - 1];
          if (lastTrade.marketType === 'spot') {
            lastTrade.fees.trading += log.fees;
          }
        }
      }
    }

    trades.push(...txTrades);
  }

  return trades.reverse();
}
