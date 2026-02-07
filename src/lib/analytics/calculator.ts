import { Trade, PortfolioAnalytics, PnLDataPoint, TimePerformance } from '@/types';

/**
 * Calculate complete portfolio analytics from trade history
 * 
 * @param trades - Array of trades to analyze
 * @param initialCapital - Starting capital (default 10000 USDC)
 * @returns Complete analytics object
 */
export function calculateAnalytics(
  trades: Trade[],
  initialCapital: number = 10000
): PortfolioAnalytics {
  // Filter closed trades for most calculations
  const closedTrades = trades.filter(t => t.status === 'closed');
  const openTrades = trades.filter(t => t.status === 'open');

  // Separate winning and losing trades
  const winningTrades = closedTrades.filter(t => (t.pnl ?? 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl ?? 0) < 0);

  // Calculate core metrics
  const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const totalPnL = realizedPnL + unrealizedPnL;
  const totalPnLPercent = (totalPnL / initialCapital) * 100;

  // Win rate
  const winRate = closedTrades.length > 0
    ? (winningTrades.length / closedTrades.length) * 100
    : 0;

  // Averages
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
  const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? -grossLoss / losingTrades.length : 0;

  // Duration
  const tradesWithDuration = closedTrades.filter(t => t.duration !== null);
  const averageTradeDuration = tradesWithDuration.length > 0
    ? tradesWithDuration.reduce((sum, t) => sum + (t.duration ?? 0), 0) / tradesWithDuration.length
    : 0;

  // Profit factor & risk-reward
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const riskRewardRatio = averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0;

  // Expectancy: (Win% × Avg Win) - (Loss% × Avg Loss)
  const winRateDecimal = winRate / 100;
  const expectancy = (winRateDecimal * averageWin) + ((1 - winRateDecimal) * averageLoss);

  // Find largest win/loss
  const largestWin = winningTrades.length > 0
    ? winningTrades.reduce((max, t) => (t.pnl ?? 0) > (max.pnl ?? 0) ? t : max)
    : null;
  const largestLoss = losingTrades.length > 0
    ? losingTrades.reduce((min, t) => (t.pnl ?? 0) < (min.pnl ?? 0) ? t : min)
    : null;

  // Drawdown calculation
  const { maxDrawdown, maxDrawdownPercent, currentDrawdown } = calculateDrawdown(
    closedTrades,
    initialCapital
  );

  // Long/Short analysis
  const longTrades = trades.filter(t => t.side === 'long');
  const shortTrades = trades.filter(t => t.side === 'short');
  const longPnL = longTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const shortPnL = shortTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const longShortRatio = shortTrades.length > 0 ? longTrades.length / shortTrades.length : longTrades.length;

  // Fees
  const totalTradingFees = trades.reduce((sum, t) => sum + t.fees.trading, 0);
  const totalFundingFees = trades.reduce((sum, t) => sum + t.fees.funding, 0);
  const totalFees = totalTradingFees + totalFundingFees;
  const avgFeePerTrade = trades.length > 0 ? totalFees / trades.length : 0;

  // Volume
  const totalVolume = trades.reduce((sum, t) => sum + (t.quantity * t.entryPrice), 0);
  const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

  return {
    totalPnL,
    totalPnLPercent,
    unrealizedPnL,
    realizedPnL,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    averageWin,
    averageLoss,
    averageTradeDuration,
    profitFactor,
    riskRewardRatio,
    expectancy,
    largestWin,
    largestLoss,
    maxDrawdown,
    maxDrawdownPercent,
    currentDrawdown,
    longCount: longTrades.length,
    shortCount: shortTrades.length,
    longPnL,
    shortPnL,
    longShortRatio,
    totalFees,
    avgFeePerTrade,
    feesByType: {
      trading: totalTradingFees,
      funding: totalFundingFees,
    },
    totalVolume,
    avgTradeSize,
  };
}

/**
 * Calculate drawdown metrics from trade history
 */
function calculateDrawdown(
  trades: Trade[],
  initialCapital: number
): { maxDrawdown: number; maxDrawdownPercent: number; currentDrawdown: number } {
  if (trades.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercent: 0, currentDrawdown: 0 };
  }

  // Sort by timestamp
  const sortedTrades = [...trades].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  let equity = initialCapital;
  let peak = initialCapital;
  let maxDrawdown = 0;

  for (const trade of sortedTrades) {
    equity += trade.pnl ?? 0;

    if (equity > peak) {
      peak = equity;
    }

    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const currentDrawdown = peak - equity;
  const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  return { maxDrawdown, maxDrawdownPercent, currentDrawdown };
}

/**
 * Generate PnL chart data points from trades
 */
export function generatePnLChartData(
  trades: Trade[],
  initialCapital: number = 10000
): PnLDataPoint[] {
  const sortedTrades = [...trades]
    .filter(t => t.status === 'closed')
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let cumulativePnL = 0;
  let equity = initialCapital;
  let peak = initialCapital;

  return sortedTrades.map(trade => {
    const pnl = trade.pnl ?? 0;
    cumulativePnL += pnl;
    equity += pnl;

    if (equity > peak) {
      peak = equity;
    }

    const drawdown = ((peak - equity) / peak) * 100;

    return {
      timestamp: trade.timestamp,
      pnl,
      cumulativePnL,
      drawdown,
      equity,
    };
  });
}

/**
 * Calculate time-based performance (by day, hour, etc.)
 */
export function calculateTimePerformance(
  trades: Trade[],
  groupBy: 'day' | 'hour' | 'weekday' = 'day'
): TimePerformance[] {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const groups: Map<string, Trade[]> = new Map();

  for (const trade of closedTrades) {
    let key: string;
    const date = new Date(trade.timestamp);

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'hour':
        key = date.getHours().toString().padStart(2, '0') + ':00';
        break;
      case 'weekday':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        key = days[date.getDay()];
        break;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(trade);
  }

  return Array.from(groups.entries()).map(([period, periodTrades]) => {
    const pnl = periodTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const winners = periodTrades.filter(t => (t.pnl ?? 0) > 0).length;
    const winRate = periodTrades.length > 0 ? (winners / periodTrades.length) * 100 : 0;
    const volume = periodTrades.reduce((sum, t) => sum + (t.quantity * t.entryPrice), 0);

    return {
      period,
      trades: periodTrades.length,
      pnl,
      winRate,
      volume,
    };
  });
}
