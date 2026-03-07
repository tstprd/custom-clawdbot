# Prediction Market LLM Analysis

## Concept

Utiliser un LLM pour analyser et synthétiser les marchés de prédiction de manière structurée.

## Workflow proposé

### Phase 1 : Exploration à l'aveugle

1. Donner un **sujet** au LLM (ex: "Anthropic vs Pentagon")
2. Le LLM recherche les marchés de prédiction liés (Polymarket, Metaculus, Manifold, etc.)
3. **SANS révéler les probabilités actuelles**, le LLM construit :
   - L'arbre des possibilités (outcomes possibles)
   - Les dépendances logiques entre marchés
   - Les interactions causales (si X alors Y probable)
   - Son estimation a priori basée sur le raisonnement pur

### Phase 2 : Révélation progressive

4. On révèle **une courbe à la fois** (historique des probas)
5. Le LLM explique :
   - Pourquoi cette proba ? (justification)
   - Qu'est-ce qui a causé les mouvements ?
   - Comment ça impacte les autres marchés liés ?

### Phase 3 : Méta-index

6. Créer un **index composite** agrégant plusieurs marchés
7. Suivre les fluctuations jour par jour
8. Anticiper les événements et leurs impacts sur les résolutions
9. Détecter les incohérences inter-marchés (arbitrage informationnel)

## Cas d'usage

- **Géopolitique** : Conflit X → impact sur marchés Y, Z
- **Tech** : Annonce produit → valorisation, régulation
- **Politique US** : Midterms → policies, nominations
- **Finance** : Décisions Fed → indices, crypto

## Sources de données

- [Polymarket](https://polymarket.com) - Marchés crypto
- [Metaculus](https://metaculus.com) - Prédictions communautaires
- [Manifold](https://manifold.markets) - Play money mais gros volume
- [Kalshi](https://kalshi.com) - Régulé CFTC
- [PredictIt](https://predictit.org) - Politique US

## Stack technique (à définir)

- Scraping/API des marchés
- LLM pour analyse (Claude, GPT-4)
- Stockage historique des courbes
- Visualisation des arbres de dépendances
- Alertes sur mouvements significatifs

## Prochaines étapes

1. [ ] Prototype sur un cas simple (Anthropic)
2. [ ] Définir format de l'arbre de possibilités
3. [ ] Scraper les historiques Polymarket
4. [ ] Prompt engineering pour phase "aveugle"
5. [ ] Interface de révélation progressive
