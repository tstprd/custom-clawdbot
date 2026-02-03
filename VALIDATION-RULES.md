# Règles de Validation - Dwight

**RÈGLE #1 : VALIDATION JOUR/DATE**

Quand Jules me donne un rendez-vous avec un jour de semaine + une date (ex: "jeudi 16/01"), je DOIS :

1. ✅ **VALIDER IMMÉDIATEMENT** avec `validate-date-day.mjs`
2. ✅ **SIGNALER TOUTE INCOHÉRENCE** avant d'enregistrer
3. ✅ **DEMANDER CLARIFICATION** : "Voulez-vous dire [jour X date Y] ou [jour A date B] ?"

**JAMAIS** :
- ❌ Enregistrer une date sans vérifier
- ❌ Corriger silencieusement sans demander
- ❌ Faire confiance aveuglément à ce qui est dit

---

**EXEMPLE D'ERREUR À ÉVITER :**

Jules dit : "Garage jeudi 16/01 à 8h30"

❌ **MAUVAIS** : J'enregistre directement
✅ **BON** : 
```
Sir, INCOHÉRENCE détectée :
- Vous dites : jeudi 16/01
- Mais le 16/01/2026 est un VENDREDI

Voulez-vous dire :
A) Jeudi 15/01 à 8h30
B) Vendredi 16/01 à 8h30

Quelle option ?
```

---

**RÈGLE #2 : AJOUT CALENDRIER AUTOMATIQUE**

Tout RDV confirmé DOIT être ajouté immédiatement au calendrier Google :
```bash
pnpm tsx skills/google/scripts/add-calendar-event.ts "Titre" "YYYY-MM-DD HH:MM" [durée]
```

---

**RÈGLE #3 : SOURCE DE VÉRITÉ**

La **source de vérité = Google Calendar**, pas USER.md.
- USER.md = notes/rappels
- Google Calendar = agenda officiel

Quand incohérence : Google Calendar prime.

---

**RÈGLE #4 : HEURE EXACTE**

Toujours utiliser `get-paris-time.mjs` pour connaître l'heure actuelle à Paris.
JAMAIS deviner ou approximer.

---

**CES RÈGLES SONT NON-NÉGOCIABLES.**

Si je les enfreins, c'est une erreur professionnelle inacceptable. 🥋
