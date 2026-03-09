# DeFi Portfolio - Rapport Hebdomadaire

## Configuration

**Wallet:** `0x8cddeb3f2d0b56a2e2dd36bfe27f55b1630b647f`
**Seuil:** Positions > $5,000 uniquement (< $5k = ignoré, APY = 0)
**Cron:** Dimanche 10h15 (après morning brief)
**Méthode:** Browser snapshot visuel (pas d'API)

---

## Sources de données

| Donnée              | URL                                                                     | Méthode          |
| ------------------- | ----------------------------------------------------------------------- | ---------------- |
| Portfolio           | `https://debank.com/profile/0x8cddeb3f2d0b56a2e2dd36bfe27f55b1630b647f` | browser snapshot |
| Curve LlamaLend APR | `https://www.curve.finance/llamalend/ethereum/markets`                  | browser snapshot |
| Llama Airforce APY  | `https://llama.airforce/pounders`                                       | browser snapshot |
| Curve Savings APY   | `https://www.curve.finance/scrvusd`                                     | browser snapshot |
| AAVE APY            | `https://app.aave.com/markets/`                                         | browser snapshot |
| Frax sfrxETH APR    | `https://app.frax.finance/sfrxeth`                                      | browser snapshot |

---

## Positions suivies (> $5,000)

### 1. Curve Savings (scrvUSD)

- **Token:** scrvUSD
- **Source APY:** Curve Savings page
- **Dernier APY:** 8.95%

### 2. Fraxlend (frxETH supply)

- **Token:** frxETH
- **Source APY:** sfrxETH APR (proxy)
- **Dernier APY:** 3.33%

### 3. Aave V3 (WETH supply)

- **Token:** WETH
- **Source APY:** AAVE markets (ETH Supply APY)
- **Dernier APY:** 3.57%

### 4. Llama Airforce Union (uCVX)

- **Token:** uCVX (CVX auto-compound)
- **Source APY:** Llama Airforce Pounders → Convex (Pirex)
- **Dernier APY:** 33.35%

---

## Positions ignorées (< $5,000)

| Position                           | Valeur     | Raison       |
| ---------------------------------- | ---------- | ------------ |
| LlamaLend Fraxtal (sfrxUSD/crvUSD) | $4,768 net | < $5k        |
| LlamaLend ETH (frxUSD/crvUSD)      | $353 net   | < $5k        |
| Dinero (sDINERO)                   | $758       | < $5k        |
| CLever CVX                         | $361       | < $5k        |
| Convex Fraxtal (cvxFXS)            | $216       | < $5k        |
| Wallet                             | $1,091     | pas de yield |

---

## Alertes configurées

1. **APY change > 5pts** sur positions > $5k
2. **Borrow APR devient positif** sur LlamaLend (si tu paies pour emprunter)
3. **Position passe sous $5k** (notification pour info)

---

## Calcul gains hebdo

```
Gain/semaine = (Valeur × APY) / 52
```

### Template rapport

```
📊 DeFi Report - [DATE]

Portfolio: $XX,XXX

| Position | Valeur | APY | Gain/sem |
|----------|--------|-----|----------|
| scrvUSD  | $XX,XXX | X.XX% | $XX.XX |
| frxETH   | $XX,XXX | X.XX% | $XX.XX |
| WETH     | $XX,XXX | X.XX% | $XX.XX |
| uCVX     | $XX,XXX | X.XX% | $XX.XX |

💰 Total: ~$XXX/semaine (~$X,XXX/an)

⚠️ Alertes: [si APY change > 5pts]
```

---

## Dernière mise à jour

**Date:** 2026-03-08
**Portfolio total:** $59,631
**Positions suivies:** $52,286 (88%)
**Gains estimés:** ~$64/semaine (~$3,325/an)

| Position | Valeur  | APY    | Gain/sem |
| -------- | ------- | ------ | -------- |
| scrvUSD  | $20,762 | 7.14%  | $28.52   |
| frxETH   | $10,617 | 2.88%  | $5.88    |
| WETH     | $10,537 | 1.78%  | $3.61    |
| uCVX     | $10,370 | 12.98% | $25.90   |

**Total gains (positions > $5k):** $63.91/semaine

### Historique APY

| Date       | scrvUSD | frxETH | WETH  | uCVX   |
| ---------- | ------- | ------ | ----- | ------ |
| 2026-02-15 | 8.95%   | 3.33%  | 3.57% | 33.35% |
| 2026-02-19 | 5.82%   | 2.97%  | 1.99% | 33.35% |
| 2026-02-22 | 7.05%   | 2.98%  | 1.95% | 33.35% |
| 2026-03-01 | 6.67%   | 2.79%  | 1.93% | 33.35% |
| 2026-03-08 | 7.14%   | 2.88%  | 1.78% | 12.98% |
