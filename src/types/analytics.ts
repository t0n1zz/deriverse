import { Trade } from './trade';

/**
 * Complete portfolio analytics computed from trades
 */
export interface PortfolioAnalytics {
  // ===== Core Metrics =====
  /** Total realized + unrealized PnL in USDC */
  totalPnL: number;
  /** Total PnL as percentage of initial capital */
  totalPnLPercent: number;
  /** PnL from open positions */
  unrealizedPnL: number;
  /** PnL from closed positions */
  realizedPnL: number;

  // ===== Win/Loss Metrics =====
  /** Total number of trades */
  totalTrades: number;
  /** Number of profitable trades */
  winningTrades: number;
  /** Number of losing trades */
  losingTrades: number;
  /** Win rate as percentage (0-100) */
  winRate: number;

  // ===== Average Metrics =====
  /** Average profit on winning trades */
  averageWin: number;
  /** Average loss on losing trades (negative number) */
  averageLoss: number;
  /** Average trade duration in seconds */
  averageTradeDuration: number;
  /** Gross profit / Gross loss ratio */
  profitFactor: number;
  /** Risk-reward ratio (avg win / avg loss) */
  riskRewardRatio: number;
  /** Expected value per trade */
  expectancy: number;

  orderTypeCounts: {
    market: number;
    limit: number;
    stop: number;
    other: number;
  };

  // ===== Risk Metrics =====
  /** Trade with largest profit */
  largestWin: Trade | null;
  /** Trade with largest loss */
  largestLoss: Trade | null;
  /** Maximum peak-to-trough decline in USDC */
  maxDrawdown: number;
  /** Maximum drawdown as percentage */
  maxDrawdownPercent: number;
  /** Current drawdown from peak */
  currentDrawdown: number;

  // ===== Position Analysis =====
  /** Number of long trades */
  longCount: number;
  /** Number of short trades */
  shortCount: number;
  /** Total PnL from long trades */
  longPnL: number;
  /** Total PnL from short trades */
  shortPnL: number;
  /** Ratio of long to short trades */
  longShortRatio: number;

  // ===== Fee Analysis =====
  /** Total fees paid */
  totalFees: number;
  /** Average fee per trade */
  avgFeePerTrade: number;
  /** Fees broken down by type */
  feesByType: {
    trading: number;
    funding: number;
  };

  // ===== Volume Metrics =====
  /** Total trading volume in USDC */
  totalVolume: number;
  /** Average trade size in USDC */
  avgTradeSize: number;
}

/**
 * Time-based performance data point
 */
export interface TimePerformance {
  /** Period identifier (e.g., "2024-01-15", "09:00") */
  period: string;
  /** Number of trades in period */
  trades: number;
  /** PnL for period */
  pnl: number;
  /** Win rate for period */
  winRate: number;
  /** Volume for period */
  volume: number;
}

/**
 * Data point for PnL chart
 */
export interface PnLDataPoint {
  /** Timestamp of data point */
  timestamp: Date;
  /** Individual trade PnL */
  pnl: number;
  /** Running total PnL */
  cumulativePnL: number;
  /** Drawdown at this point */
  drawdown: number;
  /** Total equity at this point */
  equity: number;
}

/**
 * Data for distribution charts
 */
export interface DistributionData {
  name: string;
  value: number;
  color: string;
}
