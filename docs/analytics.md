# Analytics & Metrics Explained

This guide explains the trading metrics used in the dashboard. Even if you aren't a math wiz, understanding these will help you make sense of the data.

## 📊 Core Performance Metrics

### Win Rate
> **Formula**: `(Winning Trades / Total Closed Trades) * 100`

The percentage of your trades that ended in profit.
- **Good**: Anything above 50% is solid.
- **Note**: A high win rate doesn't guarantee profit if your losses are huge.

### Profit Factor
> **Formula**: `Gross Profit / Gross Loss`

Measures the efficiency of your strategy. It answers: *"For every $1 I lose, how many dollars do I make?"*
- **< 1.0**: Losing money overall.
- **1.0 - 1.5**: Break-even to slightly profitable.
- **> 1.5**: **Healthy Strategy**. This is a good target.
- **> 3.0**: Exceptional (or very small sample size).

---

## 🧠 Advanced / "Smart" Metrics

### Expectancy
> **Formula**: `(Win Rate % * Avg Win $) - (Loss Rate % * Avg Loss $)`

This tells you the **average value of your next trade**.
- If your expectancy is **+$10**, it means over 100 trades, you can expect to make ~$1,000, even if individual trades lose.
- **Positive** = Profitable system over time.
- **Negative** = Losing system over time.

### R-Multiples (Risk Multiples)
Professional traders often think in terms of "R" (Risk) rather than dollars.
- **1R** = Your average loss on a losing trade (or your predefined stop loss amount).
- **Example**: If your average loss is $50, then **1R = $50**.
    - A winning trade of $100 is a **+2R** trade.
    - A losing trade of $25 is a **-0.5R** trade.

**Why use it?** It helps normalize performance. Making $1000 risking $500 (2R) is the same skill level as making $100 risking $50 (2R), just with different capital.

### Expectancy (R)
> **Formula**: `Average(Trade PnL / Average Loss)`

Your expectancy measured in Risk Units.
- **0.5R**: On average, for every unit of risk you put on the table, you make 0.5 units back in profit (plus your original risk).

---

## 🛡️ Risk Management Metrics

### Max Drawdown
The largest percentage drop in your account equity from a peak to a trough.
- If you start at $10k, go up to $15k, then drop to $9k, your drawdown is from $15k -> $9k (a $6k drop, or ~40%).
- **Crucial**: Recovering from large drawdowns gets exponentially harder (a 50% drop requires a 100% gain to get back to even).

### Open Exposure
> **Formula**: `(Total Position Size with Leverage / Account Equity) * 100`

How much "market value" you are controlling relative to your cash.
- **100%**: You are fully invested (1x leverage).
- **200%**: You are leveraged 2x.
- **High Exposure** (>300-500%) dramatically increases the speed at which you can lose your entire account.
