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

**Date:** 2026-02-15
**Portfolio total:** $58,110
**Positions suivies:** $50,413 (87%)
**Gains estimés:** ~$105/semaine (~$5,460/an)

| Position | Valeur  | APY    | Gain/sem |
| -------- | ------- | ------ | -------- |
| scrvUSD  | $20,663 | 8.95%  | $35.60   |
| frxETH   | $10,552 | 3.33%  | $6.76    |
| WETH     | $10,531 | 3.57%  | $7.23    |
| uCVX     | $8,667  | 33.35% | $55.60   |

**Total gains (positions > $5k):** $105.19/semaine
