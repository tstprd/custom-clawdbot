# Feature : Boutons Inline (Hybrid Chat + Buttons)

**Date :** 13 janvier 2026  
**Status :** Feature clé pour MVP

---

## 🎯 Concept

**Hybride Chat + Boutons** : Conversation naturelle + boutons contextuels pour actions rapides.

### Philosophie
- **Chat** pour créer/modifier (flexibilité maximale)
- **Boutons** pour actions répétitives (done/snooze/delete)
- **Meilleur des deux mondes** : naturel + efficace

---

## 💡 Use Cases Concrets

### 1. Habit Tracker avec Quick Actions

```
Bot: Habitudes du jour (14 janvier)

🟢 Méditation (7 days streak) ✅
🔴 Sport
🔴 Lecture 30 min

[✅ Tout fait]  [🔄 Refresh]  [📊 Stats]
```

**Actions :**
- Clic sur ✅ à côté d'un habit = marque fait + update streak
- "Tout fait" = marque toutes les habitudes du jour
- Refresh = recharge la liste

### 2. To-Do Lists avec Contexte

```
Bot: Tâche ajoutée !

📌 Appeler VIVINTER pour mutuelle
🕐 Rappel: Midi semaine (12h30)
📝 Notes: Demander tarif salarié + enfant

[✅ Done]  [📝 Edit]  [📅 Changer rappel]  [🗑️ Delete]
```

**Scénario d'usage :**
1. User : "Ajoute tâche appeler VIVINTER"
2. Bot crée la tâche + affiche boutons
3. User clique [✅ Done] quand terminé
4. Bot update + archive automatiquement

### 3. Nutrition Log Rapide

```
Toi: Déjeuner salade caesar

Bot: ✅ Repas enregistré
🥗 Salade caesar
📊 ~350 kcal estimées

[✏️ Ajuster calories]  [➕ Ajouter aliment]  [🗑️ Supprimer]
```

### 4. Rappels avec Actions

```
Bot: ⏰ Rappel midi-semaine

📋 Contacter VIVINTER pour infos mutuelle

[✅ Fait]  [📅 Reporter demain]  [🔕 Snooze 1h]  [❌ Annuler]
```

**Flow :**
- [✅ Fait] = marque done + archive
- [📅 Reporter] = reschedule à demain même slot
- [🔕 Snooze] = rappel dans 1h
- [❌ Annuler] = supprime le rappel

---

## 🎨 Types de Boutons Telegram

### 1. Inline Keyboards (attachés au message)

**Avantages :**
- Contexte clair (attaché au message)
- Pas de pollution UI (disparaît avec le message)
- Callback data = action spécifique

**Exemple code :**
```javascript
bot.sendMessage(chatId, "Tâche créée !", {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "✅ Done", callback_data: "task_done_123" },
        { text: "📅 Snooze", callback_data: "task_snooze_123" }
      ],
      [
        { text: "🗑️ Delete", callback_data: "task_delete_123" }
      ]
    ]
  }
});

// Handle callback
bot.on('callback_query', (query) => {
  const data = query.data; // "task_done_123"
  const [action, type, id] = data.split('_');
  
  if (action === 'task' && type === 'done') {
    markTaskDone(id);
    bot.answerCallbackQuery(query.id, { text: "✅ Tâche marquée !" });
    bot.editMessageText("✅ ~~Tâche terminée~~", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
});
```

### 2. Reply Keyboards (remplace clavier)

**Avantages :**
- Navigation principale
- Toujours visible
- Raccourcis rapides

**Exemple :**
```javascript
bot.sendMessage(chatId, "Menu principal", {
  reply_markup: {
    keyboard: [
      ["📋 Mes tâches", "➕ Nouvelle tâche"],
      ["📊 Statistiques", "⚙️ Paramètres"]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
});
```

---

## 🚀 Implémentation MVP

### Phase 1 : Habit Tracker

**Boutons essentiels :**
1. ✅ **Check habit** (inline sur chaque habit)
2. 🔄 **Refresh list** (reload habits du jour)
3. 📊 **Voir stats** (graphique de progression)

**Exemple d'interaction :**
```
Toi: /habits

Bot: Habitudes (14 jan)

🔴 Méditation [✅]
🔴 Sport [✅]
🟢 Lecture ✅ (fait)

[🔄 Refresh]  [📊 Stats]  [➕ Nouvelle habitude]
```

### Phase 2 : Tasks

**Boutons essentiels :**
1. ✅ **Done** (marque terminé)
2. 📅 **Reschedule** (choisir nouveau slot)
3. 🔕 **Snooze** (reporter de X temps)
4. ✏️ **Edit** (modifier titre/notes)
5. 🗑️ **Delete** (supprimer)

**Flows avancés :**

**Reschedule :**
```
[Clic sur 📅 Reschedule]

Bot: Nouveau slot pour "Appeler VIVINTER" ?

[🌅 Matin]  [☀️ Midi]  [🌙 Soir]
[🏖️ Weekend]  [📆 Date précise]
```

**Snooze :**
```
[Clic sur 🔕 Snooze]

Bot: Reporter de combien ?

[⏰ 1h]  [⏰ 3h]  [📅 Demain]  [✏️ Custom]
```

### Phase 3 : Images Cloud

**Boutons pour organisation :**
```
Toi: [Envoie une photo]

Bot: ✅ Image sauvegardée
📸 Photo_14-01-2026_12-30.jpg

Tags automatiques : #food #restaurant

[🏷️ Ajouter tags]  [📁 Changer album]  [🗑️ Supprimer]
```

---

## 📊 Avantages Business

### 1. Onboarding Plus Rapide

**Sans boutons :**
- User doit apprendre commandes (/done, /snooze, etc.)
- Courbe d'apprentissage = friction

**Avec boutons :**
- Découvrabilité native (boutons visibles)
- Guidage implicite (voir les options)
- Réduction churn onboarding

### 2. Engagement Quotidien

**Stats d'utilisation estimées :**
- Check habits : **5-10x/jour**
- Done tasks : **3-5x/jour**
- Snooze : **2-3x/jour**

**Impact :**
- Boutons rendent ces actions **2x plus rapides**
- Moins de friction = plus d'utilisation
- Plus d'utilisation = meilleure rétention

### 3. Différenciation Concurrence

**Bots gratuits :**
- Commandes uniquement (/add, /done)
- UX 2010

**Notre bot premium :**
- Chat naturel + boutons contextuels
- UX moderne (Notion-like dans Telegram)
- Feeling "app native" sans installer

---

## ⚠️ Pièges à Éviter

### 1. Trop de Boutons

❌ **Mauvais :**
```
Bot: Tâche créée !

[✅][📅][🔕][✏️][🗑️][📋][🔗][📊][⚙️][❓]
```

✅ **Bon :**
```
Bot: Tâche créée !

[✅ Done]  [📅 Reschedule]
[Plus d'options ⋯]
```

### 2. Callback Data Limits

**Telegram limite : 64 bytes max**

❌ Mauvais : `task_reschedule_user_123_task_456_slot_midi-semaine_date_2026-01-14`

✅ Bon : `tr:123:456:m` (task reschedule, user 123, task 456, midi)

### 3. État dans les Boutons

❌ **Ne pas stocker l'état uniquement dans les boutons**
- Les messages peuvent être supprimés
- Les boutons peuvent expirer

✅ **Toujours synchroniser avec la DB**
- Boutons = UI only
- Source of truth = PostgreSQL

---

## 🎯 Positionnement Marketing

### Tagline Features

**"Productivité en 1 clic"**
- Pas de commandes à mémoriser
- Actions rapides via boutons
- Chat naturel quand tu veux

**Comparaison visuelle (landing page) :**

| Bots classiques | Notre bot |
|----------------|-----------|
| `/done task 123` | [✅ Done] ← 1 clic |
| `/snooze 123 1h` | [🔕 1h] ← 1 clic |
| `/reschedule 123 tomorrow` | [📅 Demain] ← 1 clic |

---

## 📚 Ressources Techniques

### Telegram Bot API Docs
- [Inline Keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
- [Reply Keyboards](https://core.telegram.org/bots/api#replykeyboardmarkup)
- [Callback Queries](https://core.telegram.org/bots/api#answercallbackquery)

### Libraries (Node.js)
- **Telegraf.js** : Support natif inline keyboards
- **node-telegram-bot-api** : Plus bas niveau, plus de contrôle
- **grammy** : Framework moderne, type-safe

### Exemples Open Source
- [Todoist Telegram Bot](https://github.com/example) (fictif, à rechercher)
- [Habitica Telegram Bot](https://github.com/HabitRPG/habitica)

---

## 💬 Prochaines Étapes

1. **Prototyper 3 flows** :
   - [ ] Habit check avec boutons
   - [ ] Task done/snooze
   - [ ] Reschedule avec slots

2. **Tester avec 5 beta users** :
   - [ ] Mesurer fréquence d'utilisation boutons vs commandes
   - [ ] Identifier boutons les plus utilisés
   - [ ] Itérer sur le design (emojis, texte)

3. **Documentation user** :
   - [ ] GIF animé montrant l'interaction
   - [ ] Landing page avec démo interactive
   - [ ] Tutoriel in-app (premier usage)

---

## 🎨 Design System (Draft)

### Emojis Standards

**Actions principales :**
- ✅ Done
- 📅 Schedule/Reschedule
- 🔕 Snooze
- ✏️ Edit
- 🗑️ Delete
- ➕ Add new

**Navigation :**
- 🔄 Refresh/Reload
- ⬅️ Back
- ⋯ More options
- ❌ Cancel

**Stats/Info :**
- 📊 Statistics
- ℹ️ Info/Help
- ⚙️ Settings

**Status :**
- 🟢 Active/Done
- 🔴 Pending/Undone
- 🟡 In Progress
- ⚪ Archived

### Disposition Boutons

**1 action = 1 ligne :**
```
[✅ Done]
```

**2-3 actions = 1 ligne :**
```
[✅ Done]  [📅 Reschedule]
```

**4+ actions = Grid 2x2 :**
```
[✅ Done]  [📅 Reschedule]
[✏️ Edit]  [🗑️ Delete]
```

**Plus d'options = Sous-menu :**
```
[✅ Done]  [Plus ⋯]

[Si clic sur "Plus ⋯"]

[📅 Reschedule]  [🔕 Snooze]
[✏️ Edit]  [🗑️ Delete]
[⬅️ Retour]
```

---

**Note :** Feature à présenter dans le pitch deck. Différenciateur clé vs bots gratuits ! 🚀
