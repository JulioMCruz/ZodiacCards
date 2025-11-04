# ZodiacCards Dune Analytics Dashboard

## Contract Information
- **Network**: Celo Mainnet
- **Proxy Contract**: `0x415Df58904f56A159748476610B8830db2548158`
- **Implementation**: `0xd1846BE5C31604496C63be66CE33Af67d68ecf84`
- **Contract Type**: ERC721 NFT (Upgradeable)

---

## Query 1: Total Mints Overview

```sql
-- Total NFT Mints Overview
SELECT
    COUNT(*) as total_mints,
    COUNT(DISTINCT "to") as unique_minters,
    SUM(value) / 1e18 as total_celo_collected,
    MIN(block_time) as first_mint,
    MAX(block_time) as last_mint
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
    AND block_time >= TIMESTAMP '2025-01-01'
```

**Description**: High-level metrics showing total mints, unique users, and CELO collected.

---

## Query 2: Daily Minting Activity

```sql
-- Daily Minting Trends
SELECT
    DATE_TRUNC('day', block_time) as mint_date,
    COUNT(*) as daily_mints,
    COUNT(DISTINCT "from") as unique_minters,
    SUM(value) / 1e18 as daily_celo_collected,
    AVG(value) / 1e18 as avg_mint_price
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1 DESC
```

**Description**: Daily breakdown of minting activity over the last 30 days.

---

## Query 3: Top Minters Leaderboard

```sql
-- Top Minters by Volume
SELECT
    "from" as minter_address,
    COUNT(*) as total_mints,
    SUM(value) / 1e18 as total_spent_celo,
    MIN(block_time) as first_mint_date,
    MAX(block_time) as last_mint_date
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
GROUP BY 1
ORDER BY 2 DESC
LIMIT 100
```

**Description**: Leaderboard of most active minters.

---

## Query 4: Minting Events with Token IDs

```sql
-- NFT Minting Events with Token IDs
WITH mint_events AS (
    SELECT
        evt_block_time,
        evt_tx_hash,
        "to",
        tokenId,
        uri
    FROM erc721_celo.evt_Transfer
    WHERE contract_address = 0x415df58904f56a159748476610b8830db2548158
        AND "from" = 0x0000000000000000000000000000000000000000
)
SELECT
    me.evt_block_time as mint_time,
    me.evt_tx_hash as transaction_hash,
    me."to" as minter,
    me.tokenId as token_id,
    me.uri as metadata_uri,
    t.value / 1e18 as mint_fee_celo,
    t.gas_used,
    t.gas_price / 1e9 as gas_price_gwei
FROM mint_events me
LEFT JOIN celo.transactions t
    ON me.evt_tx_hash = t.hash
ORDER BY me.evt_block_time DESC
LIMIT 1000
```

**Description**: Detailed view of each NFT mint including token ID, metadata URI, and transaction details.

---

## Query 5: Hourly Minting Patterns

```sql
-- Hourly Minting Distribution
SELECT
    EXTRACT(hour FROM block_time) as hour_of_day,
    COUNT(*) as total_mints,
    COUNT(DISTINCT "from") as unique_minters,
    AVG(value) / 1e18 as avg_fee
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1
```

**Description**: Identifies peak minting hours for user engagement insights.

---

## Query 6: Weekly Growth Metrics

```sql
-- Weekly Growth Analysis
WITH weekly_stats AS (
    SELECT
        DATE_TRUNC('week', block_time) as week,
        COUNT(*) as mints,
        COUNT(DISTINCT "from") as unique_minters,
        SUM(value) / 1e18 as revenue_celo
    FROM celo.transactions
    WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
        AND success = true
    GROUP BY 1
)
SELECT
    week,
    mints,
    unique_minters,
    revenue_celo,
    LAG(mints) OVER (ORDER BY week) as prev_week_mints,
    ROUND(100.0 * (mints - LAG(mints) OVER (ORDER BY week)) / NULLIF(LAG(mints) OVER (ORDER BY week), 0), 2) as mint_growth_pct,
    ROUND(100.0 * (unique_minters - LAG(unique_minters) OVER (ORDER BY week)) / NULLIF(LAG(unique_minters) OVER (ORDER BY week), 0), 2) as user_growth_pct
FROM weekly_stats
ORDER BY week DESC
```

**Description**: Week-over-week growth metrics for mints and users.

---

## Query 7: Gas Analysis

```sql
-- Gas Usage Analysis
SELECT
    DATE_TRUNC('day', block_time) as date,
    AVG(gas_used) as avg_gas_used,
    MIN(gas_used) as min_gas_used,
    MAX(gas_used) as max_gas_used,
    AVG(gas_price) / 1e9 as avg_gas_price_gwei,
    AVG(gas_used * gas_price / 1e18) as avg_transaction_cost_celo
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1 DESC
```

**Description**: Gas consumption patterns and costs.

---

## Query 8: Revenue by Minter Cohort

```sql
-- Cohort Analysis: First-time vs Repeat Minters
WITH minter_stats AS (
    SELECT
        "from" as minter,
        COUNT(*) as total_mints,
        MIN(block_time) as first_mint_date,
        SUM(value) / 1e18 as total_spent
    FROM celo.transactions
    WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
        AND success = true
    GROUP BY 1
)
SELECT
    CASE
        WHEN total_mints = 1 THEN 'Single Mint'
        WHEN total_mints BETWEEN 2 AND 5 THEN '2-5 Mints'
        WHEN total_mints BETWEEN 6 AND 10 THEN '6-10 Mints'
        ELSE '10+ Mints'
    END as minter_type,
    COUNT(*) as number_of_minters,
    SUM(total_mints) as total_mints,
    SUM(total_spent) as total_revenue_celo,
    AVG(total_spent) as avg_spent_per_minter
FROM minter_stats
GROUP BY 1
ORDER BY 3 DESC
```

**Description**: User segmentation by minting behavior.

---

## Query 9: Failed Transactions Analysis

```sql
-- Failed Minting Attempts
SELECT
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT "from") as unique_failed_users,
    SUM(CASE WHEN value < 10e18 THEN 1 ELSE 0 END) as insufficient_payment_count
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = false
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1 DESC
```

**Description**: Tracking failed minting attempts to identify UX issues.

---

## Query 10: Treasury Inflows

```sql
-- Treasury CELO Inflows
SELECT
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as incoming_transactions,
    SUM(value) / 1e18 as total_celo_received,
    COUNT(DISTINCT "from") as unique_senders
FROM celo.transactions
WHERE "to" = 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f  -- Treasury address
    AND success = true
    AND value > 0
    AND block_time >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1 DESC
```

**Description**: Monitoring treasury wallet inflows from NFT sales.

---

## Query 11: Minting Velocity

```sql
-- Time Between Mints (Velocity)
WITH mint_times AS (
    SELECT
        block_time,
        LAG(block_time) OVER (ORDER BY block_time) as prev_mint_time
    FROM celo.transactions
    WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
        AND success = true
)
SELECT
    DATE_TRUNC('day', block_time) as date,
    AVG(EXTRACT(EPOCH FROM (block_time - prev_mint_time)) / 60) as avg_minutes_between_mints,
    MIN(EXTRACT(EPOCH FROM (block_time - prev_mint_time)) / 60) as min_minutes_between_mints,
    MAX(EXTRACT(EPOCH FROM (block_time - prev_mint_time)) / 60) as max_minutes_between_mints
FROM mint_times
WHERE prev_mint_time IS NOT NULL
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1 DESC
```

**Description**: Measures minting frequency and platform momentum.

---

## Query 12: Complete Transaction History

```sql
-- Complete Transaction History with Decoded Data
SELECT
    block_time,
    block_number,
    hash as tx_hash,
    "from" as minter_address,
    value / 1e18 as mint_fee_celo,
    gas_used,
    gas_price / 1e9 as gas_price_gwei,
    (gas_used * gas_price / 1e18) as tx_cost_celo,
    success,
    nonce
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
ORDER BY block_time DESC
LIMIT 1000
```

**Description**: Raw transaction data for detailed analysis.

---

## Dashboard Setup Instructions

### Step 1: Create a Dune Account
1. Go to [dune.com](https://dune.com)
2. Sign up for a free account

### Step 2: Create New Dashboard
1. Click "New Dashboard"
2. Name it "ZodiacCards Analytics"
3. Add description: "NFT minting analytics for ZodiacCards Farcaster Mini App on Celo"

### Step 3: Add Queries
For each query above:
1. Click "+ New Query"
2. Paste the SQL code
3. Click "Run" to execute
4. Save the query with the corresponding name
5. Add to dashboard as a visualization

### Step 4: Recommended Visualizations
- **Query 1**: Counter widgets for each metric
- **Query 2**: Line chart (date vs mints/revenue)
- **Query 3**: Table view
- **Query 4**: Table view with clickable transaction hashes
- **Query 5**: Bar chart (hour vs mints)
- **Query 6**: Line chart with dual Y-axis
- **Query 7**: Line chart (gas trends)
- **Query 8**: Pie chart or bar chart
- **Query 9**: Line chart (failed attempts over time)
- **Query 10**: Area chart (cumulative treasury growth)
- **Query 11**: Line chart (velocity trends)
- **Query 12**: Table view with pagination

### Step 5: Dashboard Layout Suggestion
```
Row 1: Total Mints | Unique Minters | Total CELO | Avg Mint Price
Row 2: Daily Minting Activity (full width line chart)
Row 3: Hourly Pattern (bar) | Top Minters (table)
Row 4: Weekly Growth (line) | Cohort Analysis (pie)
Row 5: Gas Analysis (line) | Failed Txns (line)
Row 6: Recent Mints (table, full width)
```

---

## Key Metrics to Track

### Core Metrics
- **Total Mints**: Overall adoption
- **Unique Minters**: User base size
- **Total Revenue**: Platform earnings in CELO
- **Average Mint Fee**: Pricing validation

### Growth Metrics
- **Daily Active Minters**: Engagement trends
- **Week-over-Week Growth**: Growth velocity
- **New vs Repeat Minters**: User retention

### Operational Metrics
- **Gas Costs**: User experience optimization
- **Failed Transactions**: UX friction points
- **Minting Velocity**: Platform momentum

### Financial Metrics
- **Treasury Inflows**: Revenue tracking
- **Revenue per User**: Monetization efficiency
- **Cohort LTV**: Long-term value analysis

---

## Advanced Analytics (Optional)

### NFT Holder Distribution
```sql
-- Current NFT Holders
WITH transfers AS (
    SELECT
        "to" as holder,
        tokenId
    FROM erc721_celo.evt_Transfer
    WHERE contract_address = 0x415df58904f56a159748476610b8830db2548158
    ORDER BY evt_block_time DESC
)
SELECT
    holder,
    COUNT(DISTINCT tokenId) as nfts_owned
FROM transfers
WHERE holder != 0x0000000000000000000000000000000000000000
GROUP BY 1
ORDER BY 2 DESC
```

### Minting Time Distribution
```sql
-- Day of Week Analysis
SELECT
    EXTRACT(dow FROM block_time) as day_of_week,
    CASE EXTRACT(dow FROM block_time)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    COUNT(*) as total_mints,
    AVG(value) / 1e18 as avg_fee
FROM celo.transactions
WHERE "to" = 0x415df58904f56a159748476610b8830db2548158
    AND success = true
GROUP BY 1, 2
ORDER BY 1
```

---

## Sharing Your Dashboard

Once created, you can:
1. Make the dashboard public
2. Share the URL (e.g., `dune.com/username/zodiac-cards-analytics`)
3. Embed widgets in your website
4. Export data as CSV for further analysis

---

## Dashboard URL Template
`https://dune.com/[your-username]/zodiac-cards-analytics`

## Support Resources
- Dune Docs: https://dune.com/docs
- Celo Data: https://dune.com/docs/data-tables/celo
- Community: https://discord.gg/dunecom
