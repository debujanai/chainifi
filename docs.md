# ChainFi — What It Provides

ChainFi is a crypto insights dashboard that helps you spot where informed capital is moving, understand token health, and profile wallet behavior. It organizes on‑chain activity into clear views so you can discover opportunities, validate ideas, and monitor cohorts without digging through raw data.

## What You Can Do
- Find tokens gaining attention among well‑informed cohorts and track their momentum.
- See who is buying and selling, how much, and over which time windows.
- Inspect recent trades by smart money and follow their activity across chains.
- Understand holder distribution and how concentrated or broad a token’s ownership is.
- Profile a wallet: balances, transfers, counterparties, related wallets, labels, and PnL.
- Filter by cohorts (funds, whales, smart traders, exchanges, fresh wallets) to focus signal.
- Sort and paginate large datasets quickly to pinpoint what matters.

## Main Sections (User Views)
- DEX Trades — Recent decentralized exchange trades by smart money; see trade size, timing, and context to gauge conviction.
- Token Netflows — Net inflows/outflows over 24h/7d/30d; identify tokens attracting or losing capital.
- Smart Money Holdings — What smart money holds, how values move, holder counts, and sector hints.
- Historical Holdings — Time‑series views to understand how positions evolved under filters.
- DCAs — Dollar‑cost‑averaging orders by smart money; group by status/labels; search by trader/address.
- Address Transactions — Token‑level transfers for any wallet; view sent/received volumes and activity patterns.
- Address Balances — Snapshot of assets a wallet holds, with value ranges to size its footprint.
- Address Historical Balances — Balance history over time for a wallet to see accumulation or distribution.
- Counterparties — Who a wallet interacts with, how often, and net volume in/out to map relationships.
- Related Wallets — Addresses linked by behavior; tabular view with timestamps to explore clusters.
- Address PnL — Performance at the address level: realized/unrealized, ROI, win rate, cost basis.
- Address Labels — Behavioral and category labels that provide quick context on wallet type.
- Entity Name Search — Look up funds, exchanges, and other named entities to jumpstart research.
- Token Screener — Multi‑chain screener with age, liquidity, volume, market cap, and netflow filters.
- Flow Intelligence (TGM) — Rollups that summarize activity of whales, smart traders, exchanges, and fresh wallets.
- Holders — Distribution metrics per token; understand concentration, depth, and holder bands by USD value.
- Flows — General flow datasets with consistent pagination and per‑page controls.
- Who Bought / Sold — Clear breakdown of buyers vs sellers in cohorts for a given token.
- TGM DEX Trades — Focused feed of DEX trades within the TGM scope.
- TGM Transfers — Token transfer activity scoped to TGM.
- TGM JUP DCA — Specialized view for DCA activity in the JUP ecosystem under TGM.

## Filters and Controls
- Cohorts — Include/exclude Funds, Whales, Smart Traders, Exchanges, Fresh Wallets.
- Time — Switch windows (e.g., 24h/7d/30d) to track changes and persistence.
- Ranges — Filter by age, USD value, volume, market cap to narrow the universe.
- Sorting — Rank by netflow, volume, market cap, change, activity bursts.
- Pagination — Move through large results efficiently with per‑page controls.

## Example Workflows
- Find Emerging Tokens
  - Open Token Screener; filter by age/liquidity/volume and sort by netflow.
  - Check Netflows for sustained inflow and cohort presence.
  - Inspect Holders to confirm healthy distribution vs extreme concentration.
- Follow Smart Money Activity
  - Visit DEX Trades to see large or frequent trades by informed cohorts.
  - Use Who Bought / Sold to confirm buying or distribution across cohorts.
  - Review Flow Intelligence to understand which groups are most active.
- Profile a Wallet
  - Start with Address Labels or Entity Name Search for quick context.
  - Review Address Balances and Address Transactions to see assets and behavior.
  - Check Counterparties and Related Wallets to map its network.
  - Validate Address PnL to understand performance and conviction.
- Track Position Building
  - Use DCAs to spot accumulation strategies and label‑based patterns.
  - Pair with Historical Holdings and Address Historical Balances to confirm build‑up.

## Insights You Get
- Which cohorts are buying, selling, or accumulating — and at what scale.
- Which tokens are attracting capital and whether momentum persists.
- How holders are distributed and whether ownership is concentrated or broad.
- How specific wallets behave: what they hold, who they interact with, and how they perform.
- Where flows are intensifying across chains and which entities drive them.

## Who Uses ChainFi
- Traders — to discover opportunities early and validate setups.
- Analysts — to build conviction with cohort‑level evidence and distribution metrics.
- Researchers — to profile entities, trace relationships, and understand wallet behavior.

## Notes & Non‑Goals
- ChainFi surfaces on‑chain activity and cohort behavior; it does not offer trading advice.
- It focuses on crypto analytics and visualization, not content creation or code‑level details.

## Detailed Views — Columns, Grouping, Filters, Sorting

### Token Netflows (Smart Money Netflows)
- Grouping: by `chain` or `flow`.
- Columns: `Symbol`, `Token`, `Sectors`, `Net Flow 24h`, `Net Flow 7d`, `Net Flow 30d`, `Traders`, `Age (days)`, `Market Cap`.
- Filters: `Chains`, `Smart Money Labels` (Fund, Smart Trader), `Token Options` (Stablecoins, Native Tokens), `Sectors`.

### Smart Money Holdings
- Grouping: by `chain`.
- Columns: `Symbol`, `Token`, `Sectors`, `Value USD`, `24h %`, `Holders`, `Share %`, `Age (days)`, `Market Cap`.
- Filters: `Chains`, `Smart Money Labels`, `Token Options` (Stablecoins, Native Tokens), `Sectors`, numeric ranges for `24h % Change`, `Token Age (days)`, `Min Value USD`.

### Historical Holdings (Smart Money)
- Grouping: by `date`.
- Columns: `Symbol`, `Token`, `Sectors`, `Value USD`, `24h %`, `Holders`, `Share %`, `Age (days)`, `Market Cap`.
- Filters: `Date Range` (from/to), `Chains`, `Smart Money Labels`, `Token Options` (Stablecoins, Native Tokens), `Sectors`.

### DEX Trades (Smart Money)
- Grouping: by `chain` or `label`.
- Columns: `Tx`, `Pair (Bought/Sold)`, `Value USD`, `Bought Amount`, `Sold Amount`, `Age (bought/sold)`, `Market Caps (bought/sold)`, `Buy Address`, `Sell Address`, `Time`, `Tag`.
- Filters: `Chains`, `Smart Money Labels`, numeric ranges for `Trade Value USD (min/max)`, `Token Age (min/max days)`.
- Sorting: by `timestamp` or `value USD`.

### Perp Trades (Smart Money)
- Columns: `Trader`, `Coin`, `Side`, `Action`, `Amount`, `Price`, `Value USD`, `Type`, `Time`, `Tx Hash`.
- Filters: `Side` (Long/Short), `Type` (Market/Limit), `Action` (Open/Add/Reduce/Close), `Token Symbol`, `Value USD (min/max)`.
- Sorting: by `block timestamp`, `value USD`, or `token amount`.

### DCAs (Smart Money)
- Grouping: by `status` or `label`.
- Columns: `Trader`, `Token In`, `Token Out`, `Vault`, `Deposit`, `Spent`, `Redeemed`, `Deposit USD`, `Status` (if not grouped), `Created`, `Tx Hash`.
- Filters: include/exclude `Smart Money Labels`, search by `Trader/Address`.
- Sorting: by `created at`, `updated at`, or `deposit value USD`.

### TGM DEX Trades
- Grouping: by `action` or `label`; sections show counts (e.g., Buying, Selling).
- Columns: `Timestamp`, `Trader (address + label)`, `Action (BUY/SELL)`, `Token`, `Traded Token`, `Amount`, `Traded Amount`, `Value USD`.
- Filters: `Chain`, `Token Address`, `Smart Money Only`, `Date Range (from/to)`, `Action (ALL/BUY/SELL)`, `Smart Money Labels`, `Estimated Value USD (min/max)`, `Token Amount (min/max)`.
- Pagination: `10/25/50/100` per page.
- Sorting: by `timestamp`, `value USD`, `token amount`, `traded token amount`, `swap price`, `trader address`, or `transaction hash`.

### TGM Transfers (Token Transfers)
- Grouping: by `transaction type` (CEX, DEX, Other) or none.
- Columns: `Timestamp`, `From (address + label)`, `→`, `To (address + label)`, `Type`, `Amount`, `Value USD`.
- Filters: `Include CEX`, `Include DEX`, `Non‑Exchange Transfers`, `Only Smart Money`, plus `Chain`, `Token Address`, `Date Range`.
- Pagination: `10/25/50/100` per page.
- Sorting: by `timestamp`, `value USD`, `amount`, `from address`, `to address`, or `transaction hash`.

### Who Bought / Sold (Token Mode)
- Grouping: by `label` or none.
- Columns: `Address`, `Label`, `Bought USD`, `Sold USD`, `Trade Volume USD`, `Bought Tokens`, `Sold Tokens`, `Net` (Buyer/Seller badge & net volume).
- Filters: `Chain`, `Token Address`, `Date Range (from/to)`, include specific `Smart Money Labels`, numeric range for `Trade Volume USD (min/max)`.
- Pagination: `10/25/50/100` per page.
- Sorting: by `Trade Volume USD`, `Bought USD`, `Sold USD`, `Bought Token Volume`, `Sold Token Volume`, `Token Trade Volume`, `Address`.

### Address Balances (Current)
- Grouping: by `chain` or `value`.
- Columns: `Token`, `Symbol`, `Chain`, `Amount`, `Price USD`, `Value USD`, `24h Change`.
- Filters: `Address / Entity Name`, `Chain`, `Hide Spam Tokens`, `Token Symbol`, `Min Value USD`.
- Sorting: by `value USD` or `amount`.

### Address Historical Balances
- Columns: `Block Time`, `Token`, `Symbol`, `Chain`, `Amount`, `Value USD`.
- Filters: `Address / Entity Name`, `Chain`, `Date Range (from/to)`, `Hide Spam Tokens`, `Token Symbol`, `Min/Max Value USD`.
- Sorting: by `block time` or `value USD`.
- Pagination: `10/20/50` per page.

### Address Transactions
- Grouping: by `chain` or `type`.
- Columns: `Tx Hash`, `Transaction (tokens sent/received)`, `Method`, `Volume USD`, `Time`.
- Filters: `Address`, `Chain`, `Hide Spam Tokens`, `Volume USD (min/max)`.
- Sorting: by `timestamp` or `volume USD`.

### Flow Intelligence (TGM)
- Metrics: `Net Flow`, `Average Flow`, `Wallet Count` per segment (Whales, Smart Traders, Exchanges, Public Figures, Top PnL, Fresh Wallets).
- Filters: `Chain`, `Token Address`, `Timeframe` (`5m`, `1h`, `6h`, `12h`, `1d`, `7d`), `Min Whale Wallet Count`.

### Token Flows
- Grouping: by `week` or raw.
- Columns: `Date`, `Price USD`, `Token Amount`, `Value USD`, `Holders`, `Inflows`, `Outflows`.
- Filters: `Chain`, `Token Address`, `Date Range (from/to)`, `Label Type` (Top 100 Holders, Smart Money, Whale, Public Figure, Exchange), numeric ranges for `Price USD (min/max)` and `Value USD (min/max)`.
- Sorting: by `date`, `price USD`, `token amount`, `value USD`, `holders`, `inflows`, `outflows`.
- Pagination: per‑page controls.

### Token Holders
- Grouping: by `label` or `entity aggregation`.
- Columns: `Address`, `Label`, `Balance Change 24h/7d/30d`, `Token Amount`, `Ownership %`, `Value USD`.
- Filters: `Chain`, `Token Address`, `Label Type` (All Holders, Smart Money, Whale, Public Figure, Exchange), `Aggregate by Entity`, optional `Smart Money Labels`, numeric ranges for `Ownership %`, `Token Amount`, `Value USD`.
- Sorting: by `value USD`, `token amount`, `ownership %`, `balance changes`, or `address`.
- Pagination: per‑page controls.

### Jupiter DCAs (Token Mode; Solana Only)
- Columns: `Since`, `Last`, `Trader (address + label)`, `Vault (address + token in/out)`, `Status`, `Deposit`, `Spent`, `Redeemed`, `Deposit USD`.
- Filters: numeric ranges for `Deposit Amount (min/max)`, `Deposit USD (min/max)`, `Status` (All/Active/Closed/Cancelled).
- Pagination: `10/25/50` per page.
- Sorting: by `since timestamp`, `last timestamp`, `deposit amount`, `deposit spent`, `redeemed`, `deposit USD value`.

## What Each View Does — Script Hooks

### Token Screener
- Purpose: Surface promising tokens across chains using age, liquidity, volume, market cap, and netflow constraints.
- Typical inputs: `chain[]`, `min_age_days`, `min_liquidity_usd`, `min_volume_usd`, `market_cap_range`, `netflow_window`.
- Outputs (use in scripts): ranked tokens with age, liquidity, volume, market cap, netflow metrics.
- Common automations:
  - Alert when a new token crosses `min_liquidity_usd` and `netflow_24h > X`.
  - Generate watchlists by `age_days < Y` and `market_cap < Z` with positive netflows.

### Token Netflows (Smart Money)
- Purpose: Measure net inflow/outflow of capital from informed cohorts over `24h/7d/30d` windows.
- Typical inputs: `chains[]`, `cohorts` (Funds, Smart Traders), `token_filters` (Stablecoins, Native), `sectors`.
- Outputs: netflow values per window, token metadata, traders count.
- Common automations:
  - Rank tokens by `netflow_24h` and persist top N for trend dashboards.
  - Detect momentum when `netflow_7d` and `netflow_30d` both positive with rising `traders`.

### Smart Money Holdings
- Purpose: See where smart cohorts hold exposure, how values move, and how concentrated ownership is.
- Typical inputs: `chains[]`, `cohorts`, `token_options`, `sectors`, ranges for `24h_change`, `token_age`, `min_value_usd`.
- Outputs: current value USD, holders count, share %, token age, market cap.
- Common automations:
  - Flag tokens with `share% > threshold` (concentration risk) or rising holders.
  - Track cohort exposure shifts via `24h%` and `holders` deltas.

### Historical Holdings (Smart Money)
- Purpose: Time‑series of cohort positions to identify building or unwinding.
- Typical inputs: `date_range`, `chains[]`, `cohorts`, `token_options`, `sectors`.
- Outputs: value USD per date, holders count, token age snapshots.
- Common automations:
  - Detect sustained accumulation when `value_usd` increases across consecutive windows.
  - Correlate `holders` trend with price or netflow for conviction scoring.

### DEX Trades (Smart Money)
- Purpose: Stream of on‑chain swaps by informed cohorts to gauge real‑time activity.
- Typical inputs: `chains[]`, `cohorts`, `min_trade_usd`, `token_age_range`.
- Outputs: tx hash, pair (in/out), value USD, amounts, asset ages, market caps, time, tags.
- Common automations:
  - Alert on single trades `value_usd > X` or repeated buys within `Y` minutes.
  - Aggregate `value_usd` per token per interval to track bursts.

### Perp Trades (Smart Money)
- Purpose: Derivatives positioning (long/short) with action context (open/add/reduce/close).
- Typical inputs: `side`, `type`, `action`, `token_symbol`, `value_range_usd`.
- Outputs: trader, coin, side, action, amount, price, value, type, time, tx hash.
- Common automations:
  - Compute net long/short ratio per asset and alert on flips.
  - Detect large `open` events `value_usd > X` as conviction signals.

### DCAs (Smart Money)
- Purpose: Identify accumulation via recurring buys routed through vaults.
- Typical inputs: `group_by status|label`, `include/exclude cohorts`, `search trader/address`.
- Outputs: trader, vault, token in/out, deposit, spent, redeemed, deposit USD, status, created, tx hash.
- Common automations:
  - Alert when `status=Active` vaults increase `deposit_usd` above threshold.
  - Track DCA completion (`status=Closed`) with `redeemed` spikes.

### TGM DEX Trades
- Purpose: Focused trades stream constrained to TGM scope; supports Smart Money Only.
- Typical inputs: `chain`, `token_address`, `date_range`, `action`, `smart_money_only`, `labels`, `value_usd_range`, `token_amount_range`.
- Outputs: timestamp, trader (address+label), action, token, traded token, amounts, value USD.
- Common automations:
  - Monitor one token’s buy/sell balance to detect distribution.
  - Track Smart Money Only feed for timely alerts.

### TGM Transfers
- Purpose: Token‑level transfers across CEX/DEX and non‑exchange routes to spot liquidity movement.
- Typical inputs: `chain`, `token_address`, `date_range`, toggles for `include_cex`, `include_dex`, `non_exchange_transfers`, `only_smart_money`.
- Outputs: timestamp, from/to address+label, type (CEX/DEX/Other), amount, value USD.
- Common automations:
  - Detect exchange inflows/outflows to anticipate listing or sell pressure.
  - Filter non‑exchange transfers to study distribution among wallets.

### Who Bought / Sold
- Purpose: Aggregated view of buyers vs sellers per token at the address level.
- Typical inputs: `chain`, `token_address`, `date_range`, `labels_include[]`, `trade_volume_usd_range`.
- Outputs: address, label, bought USD, sold USD, total trade USD, bought/sold token volumes, net buyer/seller badge.
- Common automations:
  - Build a scoreboard of top net buyers over `24h`.
  - Flag addresses switching from net buyer to net seller.

### Address Balances (Current)
- Purpose: Snapshot of a wallet’s assets with approximate USD footprint.
- Typical inputs: `address|entity_name`, `chain`, `hide_spam`, `token_symbol`, `min_value_usd`.
- Outputs: token, symbol, chain, amount, price USD, value USD, 24h change.
- Common automations:
  - Filter holdings by value to size wallet tier and track changes.

### Address Historical Balances
- Purpose: Time‑series of wallet holdings to observe accumulation/distribution.
- Typical inputs: `address|entity_name`, `chain`, `date_range`, `hide_spam`, `token_symbol`, `value_usd_range`.
- Outputs: block time, token, symbol, chain, amount, value USD.
- Common automations:
  - Detect accumulation streaks per token and summarize intervals.

### Address Transactions
- Purpose: Token transfer activity for a wallet (in/out volumes and methods).
- Typical inputs: `address`, `chain`, `hide_spam`, `volume_usd_range`.
- Outputs: tx hash, sent/received tokens summary, method, volume USD, time.
- Common automations:
  - Alert on large outgoing transfers or unusual method patterns.

### Flow Intelligence (TGM)
- Purpose: Segment‑level rollups of net flow, average flow, and wallet counts for specific cohorts.
- Typical inputs: `chain`, `token_address`, `timeframe (5m..7d)`, `min_whale_wallet_count`.
- Outputs: per‑segment metrics (Whales, Smart Traders, Exchanges, Public Figures, Top PnL, Fresh Wallets).
- Common automations:
  - Identify which cohort drives flows and alert when leadership changes.

### Token Flows
- Purpose: Time‑series flows (value, holders, inflows, outflows) for one token.
- Typical inputs: `chain`, `token_address`, `date_range`, `label_type`, `price_usd_range`, `value_usd_range`, `group_by_week`.
- Outputs: date, price, token amount, value USD, holders, inflows, outflows.
- Common automations:
  - Detect inflow surges with rising holders across consecutive windows.

### Token Holders
- Purpose: Holder distribution, concentration, and ownership bands for one token.
- Typical inputs: `chain`, `token_address`, `label_type`, `aggregate_by_entity`, optional `smart_money_labels`, ranges for `ownership%`, `token_amount`, `value_usd`.
- Outputs: address, label, balance changes (24h/7d/30d), token amount, ownership %, value USD.
- Common automations:
  - Track whale concentration and top holder movements.

### Jupiter DCAs (Solana)
- Purpose: DCA vaults on Solana (Jupiter); lifecycle and performance snapshot.
- Typical inputs: `token_address`, `deposit_amount_range`, `deposit_usd_range`, `status`.
- Outputs: since/last timestamps, trader address+label, vault address, tokens in/out, status, deposit/spent/redeemed, deposit USD.
- Common automations:
  - Monitor active DCAs for increased deposits or completion events.

### Counterparties / Related Wallets / Labels / Entity Search / PnL
- Purpose: Network and metadata views for profiling addresses and entities.
- Typical inputs: `address|entity_name`, optional scopes per view.
- Outputs: counterparties lists with volumes, related wallets by behavior, labels (behavior/category), PnL metrics, named entities.
- Common automations:
  - Build relationship graphs and score clusters; filter flows by entity type.