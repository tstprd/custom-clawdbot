# 🏅 Système de Badges — Ménage Zen

## Structure d'un badge

```json
{
  "id": "streak_7",
  "emoji": "🔥",
  "name": "On Fire",
  "description": "Maintiens un streak de 7 jours",
  "condition": "streak >= 7",
  "rarity": "common",
  "karma_bonus": 20,
  "percentage_users": 23
}
```

---

## Badges Streak 🔥

| Emoji  | Nom           | Condition        | Rareté    | Karma |
| ------ | ------------- | ---------------- | --------- | ----- |
| 🔥     | On Fire       | Streak 7 jours   | Common    | +20   |
| 🔥🔥   | Unstoppable   | Streak 30 jours  | Rare      | +100  |
| 🔥🔥🔥 | Inferno       | Streak 100 jours | Epic      | +500  |
| 💯     | Triple Digits | Streak 100+      | Epic      | +250  |
| 🗓️     | Full Year     | Streak 365 jours | Legendary | +2000 |

---

## Badges Timing ⏰

| Emoji | Nom         | Condition                        | Rareté | Karma |
| ----- | ----------- | -------------------------------- | ------ | ----- |
| 🌅    | Early Bird  | 10 tâches avant 8h               | Common | +15   |
| 🌙    | Night Owl   | 10 tâches après 22h              | Common | +15   |
| ⚡    | Speed Demon | 5 tâches faites en < 2 min       | Common | +15   |
| ⏱️    | Quick Draw  | Tâche faite < 1 min après rappel | Rare   | +25   |
| 🎯    | Sniper      | 10 tâches faites immédiatement   | Rare   | +50   |

---

## Badges Régularité 📅

| Emoji | Nom               | Condition                     | Rareté | Karma |
| ----- | ----------------- | ----------------------------- | ------ | ----- |
| 💪    | Weekend Warrior   | Samedi + Dimanche complets    | Common | +20   |
| 📆    | Monday Motivation | 4 lundis consécutifs complets | Rare   | +30   |
| 🧘    | Zen Master        | 0 ignore sur 7 jours          | Rare   | +50   |
| 🎯    | Perfect Week      | 100% complétion sur 7 jours   | Rare   | +75   |
| 🏆    | Perfect Month     | 100% complétion sur 30 jours  | Epic   | +200  |

---

## Badges Volume 📊

| Emoji | Nom         | Condition              | Rareté    | Karma |
| ----- | ----------- | ---------------------- | --------- | ----- |
| 🌱    | First Steps | 10 tâches complétées   | Common    | +10   |
| 🌿    | Growing     | 50 tâches complétées   | Common    | +25   |
| 🌳    | Established | 100 tâches complétées  | Rare      | +50   |
| 🌲    | Veteran     | 500 tâches complétées  | Epic      | +150  |
| 🏔️    | Mountain    | 1000 tâches complétées | Legendary | +500  |

---

## Badges Catégorie 🏠

| Emoji | Nom            | Condition                 | Rareté | Karma |
| ----- | -------------- | ------------------------- | ------ | ----- |
| 🍽️    | Kitchen Master | 50 tâches cuisine         | Rare   | +30   |
| 🚿    | Bathroom Pro   | 50 tâches SDB             | Rare   | +30   |
| 🛋️    | Living Expert  | 50 tâches salon           | Rare   | +30   |
| 🛏️    | Bedroom Boss   | 50 tâches chambre         | Rare   | +30   |
| 🏠    | Home Expert    | Tous les badges catégorie | Epic   | +100  |

---

## Badges Spéciaux ✨

| Emoji | Nom          | Condition                    | Rareté | Karma |
| ----- | ------------ | ---------------------------- | ------ | ----- |
| 🎭    | Redemption   | Tâche ignorée 5x puis faite  | Rare   | +40   |
| 🦸    | Comeback Kid | Reprendre après streak perdu | Rare   | +30   |
| 🎁    | Generous     | 100 karma offert à d'autres  | Rare   | +50   |
| 🌍    | Eco Warrior  | Pack éco/green complété      | Rare   | +40   |
| 🧹    | Spring Clean | Pack "Grand ménage" complété | Rare   | +50   |

---

## Badges Secrets 🔒

_Non affichés jusqu'à déblocage_

| Emoji | Nom            | Condition                                      | Rareté |
| ----- | -------------- | ---------------------------------------------- | ------ |
| 🎪    | Circus         | 10 tâches dans 10 pièces différentes en 1 jour | Epic   |
| 🌈    | Rainbow        | Tous les types de tâches en 1 semaine          | Epic   |
| 🦉    | Insomniac      | Tâche faite entre 3h et 5h du matin            | Rare   |
| 🎄    | Holiday Spirit | Tâche faite le 25 décembre                     | Rare   |
| 🥳    | New Year       | Tâche faite le 1er janvier                     | Rare   |
| 🎂    | Birthday Clean | Tâche faite le jour de ton anniversaire        | Rare   |

---

## Badges Karma 👑

| Emoji  | Nom     | Condition   | Rareté    | % Users |
| ------ | ------- | ----------- | --------- | ------- |
| ⭐     | Starter | 100 karma   | Common    | 80%     |
| ⭐⭐   | Rising  | 500 karma   | Common    | 50%     |
| ⭐⭐⭐ | Shining | 1000 karma  | Rare      | 25%     |
| 💎     | Diamond | 2500 karma  | Epic      | 10%     |
| 👑     | Legend  | 5000 karma  | Legendary | 3%      |
| 🌟     | Mythic  | 10000 karma | Mythic    | 0.5%    |

---

## Affichage des badges

### Dans le profil

```
🏅 Badges (7/24)

Obtenus :
🔥 On Fire        ⚡ Speed Demon    🌅 Early Bird
💪 Weekend War.   🧘 Zen Master     🌱 First Steps
🌿 Growing

Prochain :
🔥🔥 Unstoppable (streak 30) — tu es à 23 !
```

### Notification nouveau badge

```
🎉 NOUVEAU BADGE !

🧘 Zen Master
"0 tâche ignorée sur 7 jours"

Tu fais partie des 12% d'utilisateurs
qui ont ce badge.

+50 ⭐ Karma bonus !
```

### Image générée (milestone)

```
┌─────────────────────────────┐
│                             │
│    🔥🔥🔥 UNSTOPPABLE 🔥🔥🔥    │
│                             │
│    30 jours consécutifs     │
│                             │
│    @username                │
│    Mars 2026                │
│                             │
│    [logo Ménage Zen]        │
└─────────────────────────────┘
```

---

## Progression & Rareté

### Répartition cible

| Rareté    | % Users qui l'ont | Couleur        |
| --------- | ----------------- | -------------- |
| Common    | 50-80%            | Gris           |
| Rare      | 15-30%            | Bleu           |
| Epic      | 5-15%             | Violet         |
| Legendary | 1-5%              | Or             |
| Mythic    | < 1%              | Rouge/Brillant |

### Badges "difficiles" (motivants)

1. **Perfect Month** — 0 ignore sur 30 jours
2. **Streak 100** — 100 jours consécutifs
3. **Legend** — 5000 karma
4. **Home Expert** — Tous les badges catégorie
5. **Full Year** — 365 jours de streak

---

## Gamification avancée

### Collections

```
📚 Collections

🏠 Maison Complète (4/5)
├── ✅ Kitchen Master
├── ✅ Bathroom Pro
├── ✅ Living Expert
├── ✅ Bedroom Boss
└── 🔒 Home Expert (débloque tous les autres)

🔥 Streak Master (2/5)
├── ✅ On Fire (7j)
├── ✅ Unstoppable (30j)
├── 🔒 Inferno (100j)
├── 🔒 Triple Digits (100+)
└── 🔒 Full Year (365j)
```

### Badges limités (events)

- 🎃 Halloween Clean (tâche le 31 octobre)
- 🎄 Holiday Hero (tâche chaque jour de décembre)
- 🌸 Spring Renewal (grand ménage printemps)

---

_Système de badges v1.0 — Mars 2026_
_24 badges de base + 6 secrets + badges events_
