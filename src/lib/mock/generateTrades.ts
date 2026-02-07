import { Trade } from '@/types';

const MARKETS = [
  'SOL-USDC',
  'BTC-USDC',
  'ETH-USDC',
  'BONK-USDC',
  'JTO-USDC',
  'WIF-USDC',
];

const MARKET_TYPES: ('spot' | 'perpetual')[] = ['spot', 'perpetual'];

/**
 * Generate mock trade data for development and testing
 * 
 * @param count - Number of trades to generate
 * @param startDate - Start date for trade history
 * @returns Array of mock Trade objects
 */
export function generateMockTrades(
  count: number = 100,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
): Trade[] {
  const trades: Trade[] = [];
  const endDate = new Date();
  const timeRange = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < count; i++) {
    const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];
    const marketType = MARKET_TYPES[Math.floor(Math.random() * MARKET_TYPES.length)];
    const side: 'long' | 'short' = Math.random() > 0.5 ? 'long' : 'short';
    const orderType: 'market' | 'limit' = Math.random() > 0.3 ? 'market' : 'limit';

    // Random timestamp within range
    const timestamp = new Date(startDate.getTime() + Math.random() * timeRange);

    // Generate realistic prices based on market
    const basePrice = getBasePrice(market);
    const volatility = 0.05; // 5% price range
    const entryPrice = basePrice * (1 + (Math.random() - 0.5) * volatility);

    // 90% of trades are closed
    const isClosed = Math.random() < 0.9;
    const status: 'open' | 'closed' | 'liquidated' = isClosed
      ? (Math.random() < 0.95 ? 'closed' : 'liquidated')
      : 'open';

    // Calculate exit price and PnL for closed trades
    let exitPrice: number | null = null;
    let pnl: number | null = null;
    let pnlPercent: number | null = null;
    let duration: number | null = null;

    if (status !== 'open') {
      // Slightly profitable strategy (55% win rate simulation)
      const isWinner = Math.random() < 0.55;
      const priceChange = (Math.random() * 0.08) * (isWinner ? 1 : -1); // 0-8% change

      if (side === 'long') {
        exitPrice = entryPrice * (1 + priceChange);
      } else {
        exitPrice = entryPrice * (1 - priceChange);
      }

      // Random position size
      const quantity = parseFloat((Math.random() * 10 + 0.1).toFixed(4));
      const leverage = marketType === 'perpetual' ? Math.floor(Math.random() * 5) + 1 : null;

      // Calculate PnL
      const rawPnL = side === 'long'
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;

      pnl = parseFloat((rawPnL * (leverage ?? 1)).toFixed(2));
      pnlPercent = parseFloat(((pnl / (entryPrice * quantity)) * 100).toFixed(2));

      // Random duration (1 minute to 48 hours)
      duration = Math.floor(Math.random() * 172800) + 60;

      const trade: Trade = {
        id: `trade-${i}-${Date.now()}`,
        txSignature: generateTxSignature(),
        timestamp,
        market,
        marketType,
        side,
        orderType,
        entryPrice: parseFloat(entryPrice.toFixed(4)),
        exitPrice: parseFloat(exitPrice.toFixed(4)),
        quantity,
        leverage,
        pnl,
        pnlPercent,
        fees: {
          trading: parseFloat((quantity * entryPrice * 0.001).toFixed(4)), // 0.1% trading fee
          funding: marketType === 'perpetual' ? parseFloat((Math.random() * 0.5).toFixed(4)) : 0,
        },
        status,
        duration,
        annotations: [],
      };

      trades.push(trade);
    } else {
      // Open trade
      const quantity = parseFloat((Math.random() * 10 + 0.1).toFixed(4));
      const leverage = marketType === 'perpetual' ? Math.floor(Math.random() * 5) + 1 : null;

      // Simulate unrealized PnL
      const currentPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.02);
      const unrealizedPnL = side === 'long'
        ? (currentPrice - entryPrice) * quantity * (leverage ?? 1)
        : (entryPrice - currentPrice) * quantity * (leverage ?? 1);

      const trade: Trade = {
        id: `trade-${i}-${Date.now()}`,
        txSignature: generateTxSignature(),
        timestamp,
        market,
        marketType,
        side,
        orderType,
        entryPrice: parseFloat(entryPrice.toFixed(4)),
        exitPrice: null,
        quantity,
        leverage,
        pnl: parseFloat(unrealizedPnL.toFixed(2)),
        pnlPercent: parseFloat(((unrealizedPnL / (entryPrice * quantity)) * 100).toFixed(2)),
        fees: {
          trading: parseFloat((quantity * entryPrice * 0.001).toFixed(4)),
          funding: marketType === 'perpetual' ? parseFloat((Math.random() * 0.5).toFixed(4)) : 0,
        },
        status: 'open',
        duration: null,
        annotations: [],
      };

      trades.push(trade);
    }
  }

  // Sort by timestamp
  return trades.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get approximate base price for a market
 */
function getBasePrice(market: string): number {
  const prices: Record<string, number> = {
    'SOL-USDC': 180,
    'BTC-USDC': 95000,
    'ETH-USDC': 3200,
    'BONK-USDC': 0.000025,
    'JTO-USDC': 3.5,
    'WIF-USDC': 2.8,
  };
  return prices[market] ?? 100;
}

/**
 * Generate a fake Solana transaction signature
 */
function generateTxSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '';
  for (let i = 0; i < 88; i++) {
    signature += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return signature;
}
