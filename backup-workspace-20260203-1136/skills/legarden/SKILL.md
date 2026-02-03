# Le Garden Squash Skill

Réservation de terrains de squash au Garden (Rennes).

## Site

`https://legarden.doinsport.club`

## Credentials

`~/.clawdbot/credentials/legarden-squash.json`

## Préférences terrains (ordre)

**4 → 7 → 5 → 8 → 6 → 9 → 1 → 2 → 3**

## Affichage standard

Quand Jules demande "dispo squash", afficher :

```
🎾 **[Jour] [Date]** (9h-12h)

Terrain │ 09:45 │ 10:45 │ 11:45
────────┼───────┼───────┼───────
   1    │  ✅   │  ❌   │  ❌
   2    │  ✅   │  ✅   │  ✅
   ...
   4 ⭐ │  ✅   │  ✅   │  ❌   ← étoile sur préféré dispo
   ...

🏆 **Terrain X à HH:MM**
```

**Règles d'affichage :**
- Terrains triés **1 → 9** (ordre numérique)
- Étoile ⭐ sur le **premier terrain dispo** selon l'ordre de préférence de Jules
- Recommandation = premier créneau dispo du terrain préféré

## API (via browser)

```javascript
(async () => {
  const token = JSON.parse(localStorage.getItem('CapacitorStorage.TOKENS_USER')).token;
  const res = await fetch(
    'https://api-v3.doinsport.club/clubs/playgrounds/plannings/{DATE}?club.id=a126b4d4-a2ee-4f30-bee3-6596368368fb&from=09:00&to=12:30&activities.id=03168675-2e42-4f64-b8c1-7fc011609272&bookingType=unique',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  return await res.json();
})()
```

## Constantes

- Club ID: `a126b4d4-a2ee-4f30-bee3-6596368368fb`
- Squash Activity ID: `03168675-2e42-4f64-b8c1-7fc011609272`
- API Base: `https://api-v3.doinsport.club`

## Prix

- 60 min : 9€/personne (18€ total pour 2)
- 120 min : 13.50€/personne (27€ total pour 2)

## Paiement

Mode préféré : **Paiement par participant + Wallet**

### Flow de réservation complet

1. **Sélection créneau** : Terrain + heure + durée (60 min préféré)
2. **Participants** : Jules auto-ajouté, **laisser le 2e vide** (pas besoin de l'ajouter)
3. **Clic "Suivant"** → Page paiement
4. **Mode paiement** : Dropdown → **"Paiement par participant"**
   - Le total passe de 18€ à **9€** (ta part seulement)
5. **Méthode** : Cliquer **"Payer avec mon wallet"**
   - Affiche le solde wallet
   - Bouton "Payer avec mon wallet" finalise la résa (9€ déduits)

### Pour Jules (résumé)

```
Créneau → Suivant (sans 2e participant) → "Paiement par participant" → "Payer avec mon wallet"
```

- Le 2e joueur s'ajoutera lui-même après (lien de partage)

## Cron

- **Vendredi 19h** : Rappel pour réserver dimanche
