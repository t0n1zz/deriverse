# Competition Requirements Checklist

## Required Features vs Current State

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Total PnL tracking with visual performance indicators** | ✅ | StatsCard, PnLChart, totalPnLPercent |
| **Complete trading volume and fee analysis** | ✅ | Total volume, avg trade size, FeeBreakdown by market, total/avg fees |
| **Win rate statistics and trade count metrics** | ✅ | Win rate, W/L counts, total trades |
| **Average trade duration calculations** | ✅ | Shown in Overview (Avg Duration card). |
| **Long/Short ratio analysis with directional bias** | ✅ | LongShortPie, long/short PnL, counts, risk/reward |
| **Largest gain/loss tracking for risk management** | ✅ | Largest Win/Loss cards + market |
| **Average win/loss amount analysis** | ✅ | Avg Win & Avg Loss cards in Overview. |
| **Symbol-specific filtering and date range selection** | ✅ | DashboardFilters: markets + date presets + custom range |
| **Historical PnL charts with drawdown visualization** | ✅ | PnLChart, DrawdownChart |
| **Time-based performance (daily, session, time-of-day)** | ✅ | HourlyPerformance, WeekdayPerformance, CalendarHeatmap |
| **Detailed trade history table with annotation capabilities** | ✅ | Notes column + edit dialog (one note per line). |
| **Fee composition breakdown and cumulative fee tracking** | ⚠️ | Composition by market ✅; cumulative over time optional. |
| **Order type performance analysis** | ✅ | OrderTypeBreakdown in Markets tab (Market vs Limit PnL, win rate). |

---

## Judging Criteria – Quick Wins

### Comprehensiveness
- Add: **Average trade duration** (one StatsCard).
- Add: **Average win / Average loss** (two StatsCards or one card with both).
- Add: **Order type performance** (e.g. small chart or cards: Market vs Limit PnL, win rate, count).
- Add: **Cumulative fee over time** (e.g. line chart or running total in Fees section).
- Add: **Trade table**: show **Order type** column; show **Annotations** column and allow add/edit (e.g. inline or modal).

### Clarity & Readability
- You already have tooltips on key metrics, clear tabs, and filters. Optional: one-sentence “What you’re seeing” under each chart.

### Innovation
- You already have: R-multiple distribution, rolling performance, coaching insights, goals panel, exposure breakdown. Strong here.

### Code Quality
- Add short JSDoc on key calculator functions and analytics types if not already present.
- Ensure env/API keys are not committed (you’re read-only chain, so already low risk).

### Security
- No wallet private keys; read-only analytics. Mention in README: “No signing, no key storage.”

---

## Suggested Implementation Order

1. **Display average trade duration** – one StatsCard (Overview or Performance).
2. **Display average win & average loss** – two StatsCards or one combined.
3. **Order type performance** – compute in calculator (or from trades), add small section: Market vs Limit (trades, PnL, win rate).
4. **Trade table**: add Order type column; add Annotations column + simple edit (e.g. click to add note).
5. **Cumulative fee tracking** – optional: chart of cumulative fees over time (by close date).
