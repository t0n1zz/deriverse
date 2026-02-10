import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import {
  Engine,
  LogType,
  PerpFillOrderReportModel,
  PerpPlaceOrderReportModel,
  PerpFeesReportModel,
  PerpFundingReportModel,
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
  limit: number = 50
): Promise<Trade[]> {
  const pubkey = new PublicKey(walletAddress);

  // 1. Fetch signatures
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  if (signatures.length === 0) return [];

  // Delay before fetching transactions to let rate limit bucket refill
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Fetch parsed transactions in batches to avoid rate limits
  const txs: (ParsedTransactionWithMeta | null)[] = [];
  const BATCH_SIZE = 2; // Conservative batch size

  for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
    const batchSignatures = signatures.slice(i, i + BATCH_SIZE).map(s => s.signature);

    try {
      const batchTxs = await connection.getParsedTransactions(
        batchSignatures,
        { maxSupportedTransactionVersion: 0, commitment: 'confirmed' }
      );
      txs.push(...batchTxs);
    } catch (e) {
      console.warn(`Failed to fetch history batch ${Math.floor(i / BATCH_SIZE) + 1}, skipping...`, e);
    }

    // Add a delay between batches to respect rate limits
    if (i + BATCH_SIZE < signatures.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
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
      console.warn('Failed to decode logs for tx:', tx.transaction.signatures[0], e);
      continue;
    }

    const signature = tx.transaction.signatures[0];
    const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();

    // Context for this transaction
    let placedOrderInstrId: number | null = null;

    const txTrades: Trade[] = [];

    for (const log of logs) {
      // TRACK CONTEXT
      if (isLogType<PerpPlaceOrderReportModel>(log, LogType.perpPlaceOrder)) {
        placedOrderInstrId = log.instrId;
      }

      // HANDLE FILLS
      if (isLogType<PerpFillOrderReportModel>(log, LogType.perpFillOrder)) {
        const fill = log;

        // Try to determine Instrument ID
        const instrId = placedOrderInstrId ?? 0;
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
          fees: {
            trading: 0,
            funding: 0,
          },
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
          lastTrade.fees.trading += log.fees;
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
          fees: {
            trading: 0,
            funding: -funding.funding,
          },
          status: 'closed',
          duration: null,
          annotations: ['Funding Payment'],
        };
        txTrades.push(fundingTrade);
      }
    }

    trades.push(...txTrades);
  }

  return trades.reverse();
}
