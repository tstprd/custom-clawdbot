# Idée originale - Jules (2026-03-05)

## Concept clé

**Le LLM ne prédit PAS. Les marchés prédisent. Le LLM explore.**

```
ARBRE (LLM)  →  PROBABILITÉS (Marchés)  →  EXPLORATION (LLM)
   structure         quel univers?           que se passe-t-il
                                             dans cet univers?
```

### Étape 1 : Construction de l'arbre

Le LLM construit la **structure pure** des possibilités :

- Quels sont les outcomes possibles ?
- Quelles sont les dépendances logiques ?
- Quels événements influencent quoi ?

**Pas de probabilités à ce stade** — juste la topologie du problème.

### ⚠️ Étape 1b : Analyse des critères de RÉSOLUTION (CRUCIAL)

**La question ≠ Ce que le marché mesure vraiment**

Pour chaque marché, extraire et analyser :

1. **Description complète** (pas juste le titre)
2. **Critères de résolution** précis
3. **Sources de résolution** (qui décide ?)
4. **Edge cases** mentionnés
5. **Statut UMA** (proposed, disputed, resolved)

**Exemple Hormuz :**

- Question : "Will Iran close the Strait of Hormuz?"
- Résolution : "halts OR **severely restricts** international maritime traffic"
- → "severely restricts" est SUBJECTIF → marché peut résoudre Yes sans fermeture totale
- → Statut "disputed" = quelqu'un conteste déjà une résolution proposée

**Impact sur l'analyse :**

- Un marché à 68% peut signifier "68% de fermeture totale" OU "68% que la définition floue sera interprétée comme Yes"
- Les disputes de résolution créent de l'incertitude supplémentaire

### Étape 2 : Les marchés définissent l'univers probable

On injecte les probabilités des marchés de prédiction.

Le LLM ne cherche pas à "expliquer" pourquoi 91% — il **accepte** que le marché a tranché et identifie :

- Quelle branche de l'arbre est l'univers dominant
- Quelles branches sont quasi-éliminées

### Étape 3 : Exploration de l'univers probable

**C'est là que le LLM brille.**

"OK, on est dans le monde où Anthropic vaut $500B+. Qu'est-ce qui se passe ?"

Le LLM imagine les **conséquences de 2ème et 3ème ordre** :

- Effets sur les concurrents
- Réactions politiques/réglementaires
- Opportunités et risques dérivés
- Nouvelles questions à monitorer

### Étape 4 : Méta-index et suivi

Créer un dashboard qui :

- Agrège les marchés liés
- Suit les fluctuations quotidiennes
- Alerte quand un univers change de probabilité
- Propose de nouvelles explorations quand les données bougent

---

## Sources de données (testées 2026-03-05)

### ✅ Accessibles sans auth

| Plateforme     | API                        | Type       | Volume     | Notes                                  |
| -------------- | -------------------------- | ---------- | ---------- | -------------------------------------- |
| **Polymarket** | `gamma-api.polymarket.com` | Real money | Très élevé | Meilleure source, résolutions UMA      |
| **Manifold**   | `api.manifold.markets`     | Play money | Moyen      | Beaucoup de marchés, communauté active |
| **PredictIt**  | `predictit.org/api`        | Real money | Moyen      | **US politics only**                   |

### 🔒 Nécessitent auth ou browser

| Plateforme             | Problème          | Solution           |
| ---------------------- | ----------------- | ------------------ |
| **Metaculus**          | Cloudflare        | Browser automation |
| **Kalshi**             | Rate limit + auth | API key            |
| **GJOpen**             | Auth required     | Compte GJ          |
| **Insight Prediction** | Login required    | Compte             |

### Approche multi-plateforme

1. **Scraper Polymarket + Manifold** automatiquement (APIs publiques)
2. **Comparer les divergences** entre real money (Poly) et play money (Manifold)
3. **Ajouter manuellement** Metaculus/Kalshi si besoin (browser)

### Divergences comme signal

- Si **Polymarket >> Manifold** : les parieurs real money savent quelque chose
- Si **Manifold >> Polymarket** : possible inefficience à arbitrer
- **Écart > 10%** = signal fort à investiguer

---

## Pourquoi c'est intéressant

1. **Calibration du LLM** : On voit si son raisonnement a priori match les marchés
2. **Explicabilité** : Le LLM doit justifier chaque mouvement de marché
3. **Arbitrage informationnel** : Détecter quand les marchés sont incohérents entre eux
4. **Anticipation** : Si event A se produit, quels marchés vont bouger et comment ?

---

## Exemple concret : Anthropic vs Pentagon

### Phase aveugle (ce que le LLM devrait produire)

```
SUJET: Pentagon déclare Anthropic "supply chain risk"

MARCHÉS PERTINENTS (à trouver):
- Valorisation Anthropic à l'IPO
- Contrats gouvernementaux AI
- Parts de marché Claude vs ChatGPT
- Régulation AI aux US

ARBRE DES POSSIBILITÉS:

1. Anthropic gagne en appel
   ├── Statu quo, business as usual
   └── Boost réputationnel (David vs Goliath)

2. Désignation maintenue
   ├── Interprétation large (catastrophique)
   │   ├── AWS/Azure/GCP doivent couper les liens
   │   └── Anthropic perd son compute → mort
   └── Interprétation stricte (limitée)
       ├── Seuls les contrats DoD affectés (~5%)
       └── Impact minimal

DÉPENDANCES LOGIQUES:
- Si AWS coupe → P(survie Anthropic) ≈ 0
- Si interprétation stricte → P(impact minimal) ≈ 0.9
- Amazon/Google/Microsoft ont 30% d'Anthropic → ils vont lobbyer
- Publicité "éthique" → boost B2C possible

ESTIMATION A PRIORI:
- P(Anthropic >$500B en 2026) = ???
```

### Phase révélation

On montre : "La proba est passée de 90% → 76% → 83%"

Le LLM doit expliquer :

- Le drop initial (panique, incertitude)
- Le rebound (analyse juridique, interprétation stricte)
- Pourquoi 83% et pas 90% (risque résiduel)

---

## Questions ouvertes

- Comment scraper les historiques de prix ?
- Quel format pour l'arbre des possibilités ?
- Comment mesurer la qualité du raisonnement "aveugle" ?
- Peut-on créer un score de calibration LLM vs marchés ?
