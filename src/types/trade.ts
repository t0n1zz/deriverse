/**
 * Represents a single trade from Deriverse
 * Used throughout the application for trade data
 */
export interface Trade {
  /** Unique trade identifier */
  id: string;
  
  /** Solana transaction signature */
  txSignature: string;
  
  /** Trade execution timestamp */
  timestamp: Date;
  
  /** Trading pair (e.g., "SOL-USDC", "BTC-USDC") */
  market: string;
  
  /** Type of market */
  marketType: 'spot' | 'perpetual' | 'options';
  
  /** Trade direction */
  side: 'long' | 'short';
  
  /** Order type used */
  orderType: 'market' | 'limit';
  
  /** Entry price in USDC */
  entryPrice: number;
  
  /** Exit price in USDC (undefined if position still open) */
  exitPrice: number | null;
  
  /** Position size in base asset */
  quantity: number;
  
  /** Leverage used (perpetuals only) */
  leverage: number | null;
  
  /** Realized PnL in USDC (null if position open) */
  pnl: number | null;
  
  /** PnL percentage (null if position open) */
  pnlPercent: number | null;
  
  /** Fee breakdown */
  fees: {
    /** Trading fee paid */
    trading: number;
    /** Funding fee (perpetuals only) */
    funding: number;
  };
  
  /** Current trade status */
  status: 'open' | 'closed' | 'liquidated';
  
  /** Trade duration in seconds (null if open) */
  duration: number | null;
  
  /** User annotations/notes */
  annotations: string[];
}

/**
 * Trade filter options for the journal
 */
export interface TradeFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  markets: string[];
  sides: ('long' | 'short')[];
  statuses: ('open' | 'closed' | 'liquidated')[];
  orderTypes: ('market' | 'limit')[];
  pnlRange: {
    min: number | null;
    max: number | null;
  };
}

/**
 * Sort configuration for trade table
 */
export interface TradeSort {
  field: keyof Trade;
  direction: 'asc' | 'desc';
}
