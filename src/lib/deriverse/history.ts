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
  LogMessage,
} from '@deriverse/kit';
import { Trade } from '@/types';

// Helper to check if a log is a specific type
function isLogType<T>(log: LogMessage, type: LogType): log is T & LogMessage {
  return log.tag === type;
}

/** Token ID to symbol for display (devnet: SOL/USDC typical). Override via env NEXT_PUBLIC_TOKEN_SYMBOL_0=SOL etc. */
const DEFAULT_TOKEN_SYMBOLS: Record<number, string> = {
  0: 'SOL',
  1: 'USDC',
};

function getTokenSymbol(tokenId: number): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env?.[`NEXT_PUBLIC_TOKEN_SYMBOL_${tokenId}`]
      : undefined;
  return (typeof fromEnv === 'string' ? fromEnv : null) ?? DEFAULT_TOKEN_SYMBOLS[tokenId] ?? `Token${tokenId}`;
}

/** Human-readable market name e.g. "SOL-USDC Perps" or "SOL-USDC Spot". */
function getInstrumentDisplayName(
  engine: Engine,
  instrId: number,
  marketType: 'perpetual' | 'spot'
): string {
  const instr = (engine as { instruments?: Map<number, { header: { assetTokenId: number; crncyTokenId: number } }> })
    .instruments?.get(instrId);
  if (!instr?.header) return marketType === 'perpetual' ? `PERP-${instrId}` : `SPOT-${instrId}`;
  const asset = getTokenSymbol(instr.header.assetTokenId);
  const crncy = getTokenSymbol(instr.header.crncyTokenId);
  const suffix = marketType === 'perpetual' ? ' Perps' : ' Spot';
  return `${asset}-${crncy}${suffix}`;
}

/** Get token decimal factor from engine (same as SDK tokenDec). */
function getTokenDec(engine: Engine, tokenId: number): number {
  const tokens = (engine as { tokens?: Map<number, { mask: number }> }).tokens;
  const token = tokens?.get(tokenId);
  return token ? 10 ** (token.mask & 0xff) : 1;
}

/** Decode base64 "Program data: " payload to Buffer (works in Node and browser). */
function decodeProgramDataBase64(logLine: string): Buffer | null {
  if (typeof logLine !== 'string' || !logLine.startsWith('Program data: ')) return null;
  const b64 = logLine.slice(14);
  try {
    if (typeof Buffer !== 'undefined' && Buffer.from) {
      return Buffer.from(b64, 'base64');
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

/** Try to decode Program data logs when SDK strict length fails (program may emit extra bytes). */
function decodeLogsWithLengthFallback(
  logMessages: string[],
  engine: Engine
): LogMessage[] {
  const logs: LogMessage[] = [];
  const dec = 1_000_000_000;
  let assetTokenDec = 1;
  let crncyTokenDec = 1;
  let placedPerpInstrId: number | null = null;
  let placedSpotInstrId: number | null = null;
  const instruments = (engine as { instruments?: Map<number, { header: { assetTokenId: number; crncyTokenId: number } }> })
    .instruments;

  for (const log of logMessages) {
    const raw = decodeProgramDataBase64(log);
    if (!raw || raw.length < 2) continue;
    const tag = raw[0];
    const trySlice = (length: number): Buffer =>
      raw.length >= length ? (raw.subarray(0, length) as Buffer) : (raw as Buffer);

    try {
      switch (tag) {
        case LogType.spotPlaceOrder:
          if (raw.length >= 40) {
            const r = SpotPlaceOrderReportModel.fromBuffer(trySlice(40));
            placedSpotInstrId = r.instrId;
            const instr = instruments?.get(r.instrId);
            if (instr && (engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              assetTokenDec = getTokenDec(engine, instr.header.assetTokenId);
              crncyTokenDec = getTokenDec(engine, instr.header.crncyTokenId);
            }
            logs.push(r);
          }
          break;
        case LogType.spotFillOrder:
          if (raw.length >= 48) {
            const r = SpotFillOrderReportModel.fromBuffer(trySlice(48));
            const instr = placedSpotInstrId != null ? instruments?.get(placedSpotInstrId) : null;
            if (instr && (engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              assetTokenDec = getTokenDec(engine, instr.header.assetTokenId);
              crncyTokenDec = getTokenDec(engine, instr.header.crncyTokenId);
              r.qty /= assetTokenDec;
              r.crncy /= crncyTokenDec;
              r.rebates /= crncyTokenDec;
              r.price /= dec;
            }
            logs.push(r);
          }
          break;
        case LogType.spotFees:
          if (raw.length >= 24) {
            const r = SpotFeesReportModel.fromBuffer(trySlice(24));
            if ((engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              r.fees /= crncyTokenDec;
              r.refPayment /= crncyTokenDec;
            }
            logs.push(r);
          }
          break;
        case LogType.perpPlaceOrder:
          if (raw.length >= 48) {
            const r = PerpPlaceOrderReportModel.fromBuffer(trySlice(48));
            placedPerpInstrId = r.instrId;
            const instr = instruments?.get(r.instrId);
            if (instr && (engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              assetTokenDec = getTokenDec(engine, instr.header.assetTokenId);
              crncyTokenDec = getTokenDec(engine, instr.header.crncyTokenId);
            }
            logs.push(r);
          }
          break;
        case LogType.perpFillOrder:
          if (raw.length >= 48) {
            const r = PerpFillOrderReportModel.fromBuffer(trySlice(48));
            const instr = placedPerpInstrId != null ? instruments?.get(placedPerpInstrId) : null;
            if (instr && (engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              assetTokenDec = getTokenDec(engine, instr.header.assetTokenId);
              crncyTokenDec = getTokenDec(engine, instr.header.crncyTokenId);
              r.perps /= assetTokenDec;
              r.crncy /= crncyTokenDec;
              r.rebates /= crncyTokenDec;
              r.price /= dec;
            }
            logs.push(r);
          }
          break;
        case LogType.perpFees:
          if (raw.length >= 24) {
            const r = PerpFeesReportModel.fromBuffer(trySlice(24));
            if ((engine as unknown as { uiNumbers?: boolean }).uiNumbers) {
              r.fees /= crncyTokenDec;
              r.refPayment /= crncyTokenDec;
            }
            logs.push(r);
          }
          break;
        case LogType.perpFunding:
          if (raw.length >= 24) {
            logs.push(PerpFundingReportModel.fromBuffer(trySlice(24)));
          }
          break;
        default:
          break;
      }
    } catch {
      // ignore single log decode failure
    }
  }
  return logs;
}

/**
 * Fetch and parse trade history from on-chain logs.
 * Deriverse emits "Program data: <base64>" via sol_log_data; logsDecode expects that format.
 */
export async function fetchTradeHistory(
  connection: Connection,
  engine: Engine,
  walletAddress: string,
  limit: number = 500
): Promise<Trade[]> {
  const pubkey = new PublicKey(walletAddress);

  // 1. Fetch signatures (newest first)
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
          commitment: 'confirmed',
        });
        if (tx) txs.push(tx);
        break;
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (err.message?.includes('429')) {
          const delay = (4 - retries) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          retries--;
        } else {
          console.warn(`Failed to fetch history tx ${signature}, skipping...`);
          break;
        }
      }
    }

    // Small delay between requests to be nice to public RPC
    await new Promise((r) => setTimeout(r, 200));
  }

  const trades: Trade[] = [];

  // Process transactions chronologically; reverse at end for UI (newest first)
  for (const tx of txs) {
    if (!tx?.meta?.logMessages?.length || !tx.transaction.signatures[0]) continue;

    let logs: LogMessage[] = [];
    try {
      logs = engine.logsDecode(tx.meta.logMessages);
      // When SDK drops logs due to strict buffer length, try fallback (program may emit extra bytes)
      if (logs.length === 0 && tx.meta.logMessages.some((m: string) => m.startsWith('Program data: '))) {
        logs = decodeLogsWithLengthFallback(tx.meta.logMessages, engine);
      }
    } catch {
      // Not a Deriverse transaction or decoding failed
      continue;
    }

    if (logs.length === 0) continue;

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
        const marketName = getInstrumentDisplayName(engine, instrId, 'perpetual');
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
          market: getInstrumentDisplayName(engine, funding.instrId, 'perpetual'),
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
        const marketName = getInstrumentDisplayName(engine, instrId, 'spot');
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
