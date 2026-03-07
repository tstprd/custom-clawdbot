# Iran Markets - Polymarket

**Date:** 2026-03-05 23:05 UTC

## Marchés actifs

### 1. REGIME_FALL

| Champ               | Valeur                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**        | Will the Iranian regime fall before 2027?                                                                                                                                                                                              |
| **Probabilité**     | **50.5%**                                                                                                                                                                                                                              |
| **Volume**          | $7.95M                                                                                                                                                                                                                                 |
| **Résolution**      | "Islamic Republic overthrown, collapsed, or ceases to govern"                                                                                                                                                                          |
| **Critères précis** | Core structures dissolved (Supreme Leader, Guardian Council, IRGC under clerical authority). Revolution, civil war, military coup, or voluntary abdication. NOT: elections, reforms, succession, internal coups preserving structures. |
| **Source**          | Consensus of credible reporting                                                                                                                                                                                                        |
| **Statut UMA**      | —                                                                                                                                                                                                                                      |

### 2. HORMUZ_MARCH

| Champ               | Valeur                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **Question**        | Will Iran close the Strait of Hormuz by March 31?                     |
| **Probabilité**     | **67.5%** (mis à jour)                                                |
| **Volume**          | $14.6M                                                                |
| **Résolution**      | "Iran **halts OR severely restricts** international maritime traffic" |
| **Critères précis** | ⚠️ **VAGUE** - Pas de seuil quantitatif                               |
| **Source**          | Official governmental info + consensus reporting                      |
| **Statut UMA**      | **DISPUTED** ← Résolution proposée puis contestée                     |

### 3. HORMUZ_JUNE

| Champ           | Valeur                                           |
| --------------- | ------------------------------------------------ |
| **Question**    | Will Iran close the Strait of Hormuz by June 30? |
| **Probabilité** | **73.5%**                                        |
| **Volume**      | $1.1M                                            |
| **Résolution**  | Même que HORMUZ_MARCH                            |
| **Statut UMA**  | —                                                |

### 4. HORMUZ_2027

| Champ           | Valeur                                            |
| --------------- | ------------------------------------------------- |
| **Question**    | Will Iran close the Strait of Hormuz before 2027? |
| **Probabilité** | **74.4%**                                         |
| **Volume**      | $1.2M                                             |
| **Résolution**  | Même que HORMUZ_MARCH                             |
| **Statut UMA**  | —                                                 |

### 5. NUCLEAR_DEAL

| Champ               | Valeur                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Question**        | US-Iran nuclear deal before 2027?                                                                                       |
| **Probabilité**     | **52.5%**                                                                                                               |
| **Volume**          | $339K                                                                                                                   |
| **Résolution**      | "Official agreement over Iranian nuclear research/weapon development, publicly announced mutual agreement"              |
| **Critères précis** | Includes multilateral deals (like JCPOA). Official announcement by US and/or Iran, or overwhelming consensus reporting. |
| **Source**          | Official announcement + credible reporting                                                                              |
| **Statut UMA**      | —                                                                                                                       |

---

## Analyse des résolutions

### HORMUZ : Problème de définition

- "Severely restricts" = **non défini**
- Le marché HORMUZ_MARCH est en **dispute**
- 67.5% peut signifier :
  - 67.5% que l'Iran ferme vraiment, OU
  - 67.5% que les arbitres UMA valident "Yes" sur la définition floue

### REGIME_FALL : Définition claire

- Critères très précis (structures spécifiques listées)
- Exclusions explicites (pas les élections, réformes, succession)
- Moins d'ambiguïté

### NUCLEAR_DEAL : Définition large

- Inclut deals multilatéraux
- "Agreement reached" suffit (pas besoin d'entrée en vigueur)
- Relativement clair

---

## Dépendances logiques (mises à jour)

```
HORMUZ_MARCH → HORMUZ_JUNE → HORMUZ_2027 (imbrication temporelle)

HORMUZ (any) + NUCLEAR_DEAL : corrélation négative MAIS
  → Deal possible APRÈS que la crise soit résolue
  → Donc les deux peuvent être à 50%+ si séquentiels

REGIME_FALL + NUCLEAR_DEAL : exclusifs
  → Si régime tombe, plus d'interlocuteur pour deal avec ce régime
  → MAIS nouveau régime pourrait signer deal différent (edge case)
```

## Volume comme signal

| Marché       | Volume 24h | Volume Total | Ratio            |
| ------------ | ---------- | ------------ | ---------------- |
| HORMUZ_MARCH | $3.26M     | $14.6M       | 22% ← très actif |
| REGIME_FALL  | $134K      | $7.95M       | 1.7%             |
| NUCLEAR_DEAL | $16K       | $339K        | 4.7%             |

**HORMUZ_MARCH concentre l'attention** — gros money, dispute en cours.
