# DeFi Monitor Skill

Monitor Jules' DeFi portfolio, track yields, prices, and generate weekly reports.

## Wallet

```
0x8cddeb3f2d0b56a2e2dd36bfe27f55b1630b647f
```

## Data Storage

**SQLite:** `~/.clawdbot/local.db`

Tables:

- `defi_snapshots` - Weekly portfolio snapshots
- `defi_prices` - Asset prices history
- `defi_yields` - APY/APR history

## Sources & How to Scrape

### 1. DeBank (Portfolio)

**URL:** `https://debank.com/profile/0x8cddeb3f2d0b56a2e2dd36bfe27f55b1630b647f`
**Method:** Browser scrape
**Data:** Total value, positions by protocol, token balances

### 2. Curve Savings (scrvUSD APY)

**URL:** `https://www.curve.finance/crvusd/ethereum/scrvUSD`
**Method:** Browser scrape
**Data:** "Current projected APY" value

### 3. AAVE Markets (ETH Supply APY)

**URL:** `https://app.aave.com/markets/`
**Method:** Browser scrape
**Data:** ETH row → "Supply APY" column

### 4. Llama Airforce (uCVX APY)

**URL:** `https://llama.airforce/pounders`
**Method:** Browser scrape
**Data:** "Convex (Pirex)" card → APY value

### 5. Curve LlamaLend Fraxtal (sfrxUSD Borrow APR)

**URL:** `https://www.curve.finance/lend/fraxtal/markets`
**Method:** Browser scrape
**Data:** "sfrxUSD • crvUSD fraxtal" row → "Net borrow APR" column
**⚠️ IMPORTANT:** This is a COST, not yield (positive = you pay)

### 6. Frax sfrxETH (Staking APR)

**URL:** `https://app.frax.finance/frxeth/stake`
**Method:** Browser scrape
**Data:** "ESTIMATED sfrxETH APR" value

## Positions Structure

```yaml
positions:
  yield_positions:
    - name: scrvUSD
      value: $20,677
      asset: crvUSD
      apy_source: curve_savings

    - name: Fraxlend frxETH
      value: $11,251
      asset: frxETH
      apy_source: frax_sfrxeth
      price_exposure: ETH

    - name: AAVE WETH
      value: $11,053
      asset: WETH
      apy_source: aave_eth
      price_exposure: ETH

    - name: uCVX
      value: $9,056
      asset: CVX
      apy_source: llama_airforce
      price_exposure: CVX

    - name: sfrxUSD→crvUSD (Fraxtal)
      net_equity: $4,799
      collateral:
        asset: sfrxUSD
        value: $71,925
        yield: +4.25%
      borrowed:
        asset: crvUSD
        value: $67,125
        cost_source: curve_fraxtal_borrow

  non_yield_positions:
    - name: Dinero
      value: $758
    - name: CLever CVX
      value: $373
    - name: frxUSD→crvUSD
      value: $352
    - name: Convex
      value: $217
    - name: Wallet
      value: $1,126
```

## Price Exposure

```yaml
price_exposure:
  ETH:
    positions: [Fraxlend frxETH, AAVE WETH, Wallet ETH]
    total: $22,827

  CVX:
    positions: [uCVX, CLever CVX]
    total: $9,429

  TAO:
    positions: [Wallet wTAO]
    total: $391

  Stablecoins:
    positions: [scrvUSD, sfrxUSD position]
    total: $25,828
```

## Weekly Report Format

```
🦙 DEFI REPORT — Dimanche [date]

📊 PORTFOLIO
Total: $XX,XXX (Δ X.XX% WoW)

📈 POSITIONS
[Position] $XX,XXX | +X.XX% APY | +$XX/sem

💰 REVENUE
Gross Yield: +$XXX/sem
Borrow Cost: -$XXX/sem
Net: +$XX/sem (+$XXX/mois)

📉 PRICE CHANGES (WoW)
ETH: $X,XXX → $X,XXX (X.XX%)
CVX: $X.XX → $X.XX (X.XX%)
Impact: +/- $XXX

📊 APY WATCH
[Metric]: X.XX% (Δ X.XX pts)

⚠️ ALERTES
[if any thresholds crossed]
```

## Alerts Configuration

```yaml
alerts:
  - name: High Borrow Cost
    condition: sfrxUSD_borrow_apr > 5%
    severity: warning

  - name: Very High Borrow Cost
    condition: sfrxUSD_borrow_apr > 8%
    severity: critical

  - name: High Utilization
    condition: sfrxUSD_utilization > 95%
    severity: warning

  - name: APY Drop
    condition: any_apy_change > 5_points
    severity: info
```

## Scripts

- `scripts/defi-snapshot.ts` - Take weekly snapshot
- `scripts/defi-report.ts` - Generate weekly report
- `scripts/defi-prices.ts` - Fetch current prices

## Cron

**Weekly Report:** Dimanche 10h15 (Europe/Paris)
**Job ID:** `21a9087c-116e-4772-b624-3b57e9019784`
