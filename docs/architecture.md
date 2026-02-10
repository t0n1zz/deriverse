# Architecture & Codebase Overview

This document explains the high-level architecture of the Deriverse Analytics Dashboard. It is intended for developers who want to understand how the application is structured and how data flows from the blockchain to the UI.

## 🏗️ High-Level Architecture

The application follows a **Client-Side Data Fetching** model, enhanced with Server-Side Rendering (SSR) for the initial shell.

1.  **Next.js App Router**: Serves the initial HTML and hydration bundles.
2.  **Zustand Store**: Acts as the "single source of truth" for trade data on the client.
3.  **Deriverse Service**: A singleton service layer that abstracts the complexity of Solana RPC calls and SDK interaction.
4.  **UI Components**: React components that subscribe to the Store to display charts and stats.

---

## 🔄 Data Flow

### 1. Connecting & Fetching
When a user connects their wallet (or enters an address):

1.  **Context**: The `WalletAddressContext` updates with the new public key.
2.  **Effect**: A `useEffect` hook in `page.tsx` (or `journal/page.tsx`) triggers a fetch.
3.  **Service Call**: `DeriverseService.getTradeHistory(walletAddress)` is called.
    - This function uses `@solana/web3.js` to find transaction signatures for the address.
    - It then fetches the parsed transaction details.
4.  **Parsing**: The raw Solana transaction logs are passed to the **@deriverse/kit** SDK, which parses them into readable "Trade" objects (Entry, Exit, PnL).
5.  **Store Update**: The parsed trades are saved into the `tradeStore` (Zustand).

### 2. Computing Analytics
Once trades are in the `useTradeStore`:
- The store automatically triggers a recalculation of `analytics` (Win Rate, PnL, Drawdown).
- This is done via `calculateAnalytics()` in `src/lib/analytics/calculator.ts`.
- Components like `<StatsCard />` or `<PnLChart />` automatically re-render with the new numbers.

---

## 📂 Key Directories & Files

### `src/lib/deriverse/` ( The "Backend" Logic)
This is the most critical logic folder.
- **`service.ts`**: The main entry point. Use this class to fetch data. It handles rate limiting and connection management.
- **`history.ts`**: Contains the complex logic for iterating through Solana transaction history and reconstructing trade sessions.
- **`types.ts`**: Defines what a "Deriverse Trade" looks like internally.

### `src/stores/` (State Management)
- **`tradeStore.ts`**: Contains the global state for:
    - `trades`: Array of all fetched trades.
    - `filteredTrades`: Trades matching current filters (date, symbol).
    - `analytics`: Pre-computed metrics for the dashboard.
    - `isLoading`: Loading state flags.

### `src/components/dashboard/` (Visuals)
- Contains all the widgets you see on the main page.
- **`PnLChart.tsx`**: Uses `recharts` to visualize equity curve.
- **`StatsCard.tsx`**: Reusable card for showing a single metric with a tooltip.
- **`CoachingInsights.tsx`**: Analyzes the store data to generate text-based advice.

---

## 🧩 The Deriverse SDK Integration

We use **@deriverse/kit** to avoid writing raw Solana program parsers.

```typescript
// Conceptual example of how we use the SDK
import { DeriverseParser } from '@deriverse/kit';

// 1. Get raw transaction from Solana
const tx = connection.getParsedTransaction(signature);

// 2. Pass it to the SDK
const tradeEvent = DeriverseParser.parseLog(tx.meta.logMessages);

// 3. Convert to our internal Trade type
if (tradeEvent) {
  return {
    market: tradeEvent.marketName,
    price: tradeEvent.price,
    // ...
  };
}
```

**Why this matters**: If Deriverse updates their smart contract, we upgrade the `@deriverse/kit` package, and our parser updates automatically. We don't need to manually decode byte data from the blockchain.
