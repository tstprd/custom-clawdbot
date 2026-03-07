# Test #1 : Anthropic vs Pentagon

**Date :** 2026-03-05
**Sujet :** Pentagon déclare Anthropic "supply chain risk"

---

## Phase 1 : Analyse aveugle

### Arbre des possibilités (construit AVANT de voir les données)

```
ANTHROPIC "SUPPLY CHAIN RISK"
│
├── 1. Anthropic gagne en appel/contestation
│   ├── 1a. Désignation annulée rapidement (<3 mois)
│   │   └── Business as usual + boost réputation
│   └── 1b. Procédure longue (6-12 mois)
│       └── Incertitude prolongée, deals gelés
│
├── 2. Désignation maintenue
│   ├── 2a. Interprétation LARGE (Hegseth)
│   │   ├── AWS/Azure/GCP doivent couper
│   │   └── → Anthropic perd compute = mort
│   │
│   └── 2b. Interprétation STRICTE (juristes)
│       ├── Seuls contrats DoD affectés (~5%)
│       ├── Cloud providers gardent Anthropic
│       └── → Impact minimal
│
└── 3. Effets secondaires
    ├── 3a. Publicité "David vs Goliath" → Boost B2C
    ├── 3b. Entreprises préfèrent "éthique" → Gain B2B
    └── 3c. Investisseurs paniquent → IPO retardée/dévaluée
```

### Dépendances logiques identifiées

| Si...                            | Alors...                     |
| -------------------------------- | ---------------------------- |
| AWS coupe Anthropic              | P(survie) ≈ 5%               |
| Interprétation stricte confirmée | P(>$500B) ↑ fortement        |
| Amazon/Google/MS lobbying actif  | P(interprétation stricte) ↑  |
| Claude #1 App Store dure         | P(>$500B) ↑                  |
| Hegseth utilise OpenAI pour DoD  | Affaiblit son argument légal |

### Estimations a priori (AVEUGLE)

| Question                             | Ma proba | Raisonnement                    |
| ------------------------------------ | -------- | ------------------------------- |
| Anthropic >$500B en 2026             | **70%**  | Forte mais risque résiduel gouv |
| Désignation annulée                  | **55%**  | Arguments juridiques solides    |
| AWS/Azure gardent Anthropic          | **95%**  | Trop d'argent en jeu ($100B+)   |
| Claude reste top 10 App Store (mars) | **60%**  | Buzz temporaire probable        |

---

## Phase 2 : Révélation

### Marché #1 : Anthropic $500B+ valuation in 2026

**Source:** https://polymarket.com/event/anthropic-500b-valuation-in-2026

**API Data:**

```json
{
  "outcomePrices": "[\"0.91\", \"0.09\"]",
  "volume": "7678.739269999999",
  "volume24hr": 872.40852
}
```

### Comparaison

|               | Mon estimation | Marché réel | Écart       |
| ------------- | -------------- | ----------- | ----------- |
| **P(>$500B)** | 70%            | **91%**     | **-21 pts** |

### Analyse de l'écart

**Pourquoi j'étais trop pessimiste :**

1. **Surestimation du risque gouvernemental** - Le marché price que l'interprétation stricte est quasi-certaine

2. **Sous-estimation du verrou GAFAM** - Amazon/Google/MS ont ~$100B investis → ils ne laisseront pas tomber

3. **Momentum pré-crise ignoré** - Anthropic était déjà sur trajectoire $500B+ AVANT le Pentagon. Le drama est du bruit.

4. **Upside du buzz** - Claude #1 App Store = le marché est PLUS bullish qu'avant la crise

### Mise à jour du modèle

- P(AWS coupe Anthropic) : ~~5%~~ → **<1%** (le marché l'exclut quasi-totalement)
- P(>$500B) : ~~70%~~ → **91%** (aligné sur le marché)
- L'interprétation stricte est le scénario de base, pas un scénario optimiste

---

## Métriques de calibration

| Métrique                | Valeur                  |
| ----------------------- | ----------------------- |
| Brier Score (mon prior) | (0.70 - 0.91)² = 0.0441 |
| Direction correcte      | ✓ (>50% pour YES)       |
| Écart absolu moyen      | 21 points               |

## Leçons apprises

1. **Ne pas surpondérer les événements récents** - Le Pentagon drama est bruyant mais pas forcément important
2. **Suivre l'argent** - $100B d'investissements = verrou puissant
3. **Les marchés intègrent les rebonds** - La chute 90→76→83→91% montre que le marché digère vite l'info

---

## Données brutes (API Polymarket)

```json
{
  "id": "1294391",
  "question": "Anthropic $500B+ valuation in 2026?",
  "slug": "anthropic-500b-valuation-in-2026",
  "outcomePrices": "[\"0.91\", \"0.09\"]",
  "volume": "7678.739269999999",
  "volume24hr": 872.40852,
  "liquidity": "8245.0148",
  "endDate": "2026-12-31T00:00:00Z",
  "updatedAt": "2026-03-05T21:38:02.104309Z"
}
```
