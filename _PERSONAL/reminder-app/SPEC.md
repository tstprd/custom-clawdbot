# 🏠 MÉNAGE ZEN — Spec Produit v1.0

> _"Libère ton esprit. Fais les choses. Sois fiable envers toi-même."_

---

## 📋 Table des matières

1. [Vision & Positionnement](#vision--positionnement)
2. [Onboarding — Phase Découverte](#onboarding--phase-découverte)
3. [Packs de Tâches Ménagères](#packs-de-tâches-ménagères)
4. [Interaction Quotidienne](#interaction-quotidienne)
5. [Système de Karma](#système-de-karma)
6. [Architecture Backend](#architecture-backend)
7. [Intégration Paiement (Stripe)](#intégration-paiement-stripe)
8. [Interface Web de Gestion](#interface-web-de-gestion)
9. [Stratégie Communication](#stratégie-communication)
10. [Vie Privée & Éthique](#vie-privée--éthique)
11. [Roadmap](#roadmap)

---

## 1. Vision & Positionnement

### Tagline

> _"L'app qui te rend fiable envers toi-même."_

### Problème

- 78% des gens procrastinent sur les tâches ménagères
- Le ménage s'accumule → stress → cercle vicieux
- Les to-do lists sont ignorées

### Solution

Un assistant WhatsApp/Telegram qui :

- Découpe les grosses corvées en **micro-tâches** (5-15 min)
- Rappelle avec les **conséquences** si ignoré
- Récompense avec du **karma** quand tu fais
- Apprend tes habitudes et **anticipe**

### Valeurs de marque

| Valeur                      | Manifestation                              |
| --------------------------- | ------------------------------------------ |
| 🧘 **Libération mentale**   | "Fais-le, oublie-le"                       |
| 🎯 **Fiabilité envers soi** | Karma = mesure de ta parole                |
| 🔒 **Respect total**        | Zéro pub, zéro partage données             |
| 😊 **Bienveillance**        | Jamais moralisateur, toujours encourageant |

---

## 2. Onboarding — Phase Découverte

### Objectif

**< 3 minutes** pour être opérationnel. Pas de questionnaire chiant.

### Flow

```
👋 Salut ! Je suis [Nom], ton assistant ménage.

Mon job : te rappeler les petits trucs avant
qu'ils deviennent des gros trucs.

Une seule question pour commencer :

🏠 Tu vis dans quoi ?
├── [Studio / T1]
├── [T2 / T3]
├── [T4+ / Maison]
└── [Coloc]
```

_L'utilisateur répond_

```
Top ! Et niveau ménage, t'es plutôt :

😅 "J'oublie tout, c'est le chaos"
🤷 "Ça va, mais j'ai des angles morts"
✨ "Assez organisé, je veux optimiser"
```

_L'utilisateur répond_

```
Dernier truc : à quelle heure tu préfères
que je te fasse ton récap du jour ?

[Matin ☀️ 8h]
[Midi 🌤️ 12h]
[Soir 🌙 19h]
```

_L'utilisateur répond_

```
C'est parti ! 🎉

Je t'ai préparé quelques rappels de base.
Tu peux les voir avec "mes rappels".

Astuce : tu peux me parler naturellement.
"Rappelle-moi de nettoyer le frigo dimanche"
→ Je comprends.

Premier rappel demain. Bonne soirée !
```

### Rappels initiaux (auto-configurés selon profil)

| Profil   | Rappels suggérés                                 |
| -------- | ------------------------------------------------ |
| Chaos    | Poubelles, vaisselle quotidienne, 1 surface/jour |
| Moyen    | Hebdo : aspirateur, SDB, poussières              |
| Organisé | Mensuels : VMC, frigo, vitres                    |

---

## 3. Packs de Tâches Ménagères

### Principe

Chaque "grosse corvée" = plusieurs **micro-tâches** de 5-15 min.

### 🧹 Pack Quotidien

| Tâche                            | Durée | Fréquence |
| -------------------------------- | ----- | --------- |
| Vaisselle / vider lave-vaisselle | 5 min | Quotidien |
| Sortir poubelles                 | 2 min | 2-3x/sem  |
| Essuyer plan de travail cuisine  | 3 min | Quotidien |
| Ranger ce qui traîne (10 objets) | 5 min | Quotidien |
| Faire son lit                    | 2 min | Quotidien |

### 🧽 Pack Hebdomadaire

| Tâche                     | Durée       | Jour suggéré |
| ------------------------- | ----------- | ------------ |
| Aspirateur salon          | 10 min      | Samedi       |
| Aspirateur chambre        | 8 min       | Samedi       |
| Aspirateur entrée/couloir | 5 min       | Samedi       |
| Nettoyer lavabo SDB       | 5 min       | Dimanche     |
| Nettoyer toilettes        | 5 min       | Dimanche     |
| Nettoyer douche/baignoire | 10 min      | Dimanche     |
| Changer draps             | 10 min      | Dimanche     |
| Laver 1 machine           | 5 min actif | Samedi       |
| Étendre/plier linge       | 10 min      | Dimanche     |
| Nettoyer miroirs          | 5 min       | Dimanche     |

### 🏠 Pack Mensuel

| Tâche                          | Durée  | Semaine |
| ------------------------------ | ------ | ------- |
| Nettoyer frigo intérieur       | 15 min | S1      |
| Nettoyer four                  | 15 min | S1      |
| Dépoussiérer meubles hauts     | 10 min | S2      |
| Nettoyer 2-3 vitres            | 15 min | S2      |
| Aspirer grilles VMC            | 10 min | S3      |
| Nettoyer machine à laver       | 10 min | S3      |
| Détartrer bouilloire/cafetière | 10 min | S4      |
| Vérifier dates péremption      | 10 min | S4      |

### 🗓️ Pack Saisonnier

| Tâche                   | Fréquence   |
| ----------------------- | ----------- |
| Retourner matelas       | 2x/an       |
| Nettoyer radiateurs     | Avant hiver |
| Nettoyer climatisation  | Avant été   |
| Tri vêtements           | 2x/an       |
| Nettoyer stores/rideaux | 2x/an       |

### 📦 Packs Spéciaux

**Invités ce weekend :**

- SDB express (15 min)
- Salon + entrée (20 min)
- Poubelles + odeurs (5 min)

**Déménagement :**

- Check-list sortie
- État des lieux

---

## 4. Interaction Quotidienne

### Check-in du matin/soir

```
☀️ Bonjour !

Aujourd'hui, 2 petits trucs :
├── 🧽 Lavabo SDB (5 min)
└── 🗑️ Sortir poubelles (2 min)

Temps total : ~7 min

[✅ C'est parti !] [⏰ Plus tard]
```

### Quand l'utilisateur fait une tâche

```
✅ Lavabo SDB — Fait !

+5 ⭐ Karma
🔥 Streak : 12 jours

Il te reste : Sortir poubelles (2 min)

Tu viens de t'enlever ça de la tête. 🧘
```

### Quand l'utilisateur reporte

```
⏰ OK, je reporte "Lavabo SDB".

Quand tu veux que je te relance ?
(Réponds en texte libre : "demain", "ce soir", "dans 2h")
```

_L'utilisateur répond "demain matin"_

```
Noté pour demain 8h.

💡 Rappel : si tu le fais maintenant,
c'est 5 min. Demain, ça sera toujours 5 min
+ la charge mentale de l'avoir repoussé.

Mais c'est toi qui décides. 🤷
```

### Quand l'utilisateur ignore (escalade)

**Jour 1 (ignoré):**

```
🔔 Rappel : Lavabo SDB (5 min)

Ignoré hier. Pas grave, on reprend.
```

**Jour 2 (encore ignoré):**

```
🔔🔔 Le lavabo SDB attend toujours.

Conséquence si tu continues à ignorer :
→ Calcaire qui s'incruste
→ Nettoyage x3 plus long après

5 min maintenant = tranquillité.

[Faire] [Reporter à quand ?] [Supprimer ce rappel]
```

**Jour 3+ (ignoré) :**

```
⚠️ "Lavabo SDB" ignoré 3 fois.

Options :
1. Tu le fais maintenant (5 min)
2. Tu me dis quand sérieusement
3. On supprime — c'est pas important pour toi

Pas de jugement. Mais sois honnête avec toi.
```

### Comprendre le langage naturel

| Ce que dit l'utilisateur                     | Action                   |
| -------------------------------------------- | ------------------------ |
| "Rappelle-moi de nettoyer le frigo dimanche" | Crée rappel dimanche     |
| "J'ai fait la vaisselle"                     | Marque fait + karma      |
| "Mes rappels"                                | Liste les rappels actifs |
| "Annule le rappel frigo"                     | Supprime                 |
| "Décale tout à la semaine prochaine"         | Report groupé            |
| "Ajoute laver les vitres tous les mois"      | Crée rappel récurrent    |
| "Karma" / "Stats"                            | Affiche stats            |
| "Aide"                                       | Menu d'aide              |

---

## 5. Système de Karma

### Gains

| Action                             | Karma       |
| ---------------------------------- | ----------- |
| Tâche complétée                    | +5 ⭐       |
| Complétée dans les 5 min du rappel | +2 ⭐ bonus |
| Streak 7 jours                     | +20 ⭐      |
| Streak 30 jours                    | +100 ⭐     |
| Premier rappel créé                | +10 ⭐      |

### Pertes

| Action                        | Karma      |
| ----------------------------- | ---------- |
| Tâche ignorée 2+ jours        | -2 ⭐      |
| Inactivité 3 jours            | -5 ⭐/jour |
| Supprimer un rappel ignoré 5x | -10 ⭐     |

### Niveaux

| Karma     | Titre       |
| --------- | ----------- |
| 0-50      | 🌱 Débutant |
| 50-200    | 🌿 Apprenti |
| 200-500   | 🌳 Régulier |
| 500-1000  | ⭐ Fiable   |
| 1000-2500 | 🏆 Maître   |
| 2500-5000 | 💎 Expert   |
| 5000+     | 👑 Légende  |

### Affichage stats (commande "stats")

```
📊 Tes stats

⭐ Karma : 847 (Maître 🏆)
🔥 Streak : 23 jours
📈 Ce mois : 34 tâches faites

Progression vers Expert 💎 :
████████░░░░ 847/2500

🏅 Badges : 5/12
├── ✅ Early Bird (10 tâches avant 8h)
├── ✅ Weekend Warrior (samedi + dimanche)
├── ✅ Streak 7
├── ✅ Streak 30
├── ✅ Zéro Ignore (7 jours)
└── 🔒 Streak 100
└── 🔒 Légende (5000+ karma)
```

---

## 6. Architecture Backend

### Stack technique

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│  WhatsApp Business API / Telegram Bot API   │
└─────────────────┬───────────────────────────┘
                  │ Webhooks
                  ▼
┌─────────────────────────────────────────────┐
│              API GATEWAY                     │
│         (FastAPI / Node.js)                 │
│  - Authentification                         │
│  - Rate limiting                            │
│  - Webhook validation                       │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  NLP SERVICE  │   │  CORE SERVICE │
│  (OpenAI API) │   │  (Business    │
│  - Intent     │   │   Logic)      │
│  - Entities   │   │  - Users      │
│               │   │  - Reminders  │
│               │   │  - Karma      │
└───────────────┘   └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            ┌───────────┐   ┌───────────┐
            │ PostgreSQL│   │   Redis   │
            │ (Data)    │   │ (Cache,   │
            │           │   │  Sessions)│
            └───────────┘   └───────────┘
                    │
                    ▼
            ┌───────────────┐
            │  SCHEDULER    │
            │  (Celery/     │
            │   Temporal)   │
            │  - Rappels    │
            │  - Streaks    │
            │  - Karma decay│
            └───────────────┘
```

### Base de données (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    platform ENUM('whatsapp', 'telegram'),
    platform_id VARCHAR(100),
    name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    checkin_time TIME DEFAULT '08:00',
    karma INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    level VARCHAR(20) DEFAULT 'beginner',
    housing_type VARCHAR(20),
    created_at TIMESTAMP,
    last_active TIMESTAMP,
    subscription_status ENUM('free', 'trial', 'active', 'expired'),
    stripe_customer_id VARCHAR(100)
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    duration_minutes INTEGER,
    frequency ENUM('once', 'daily', 'weekly', 'monthly', 'yearly'),
    frequency_config JSONB, -- {day_of_week: 6, week_of_month: 1, etc.}
    next_due TIMESTAMP,
    last_completed TIMESTAMP,
    times_completed INTEGER DEFAULT 0,
    times_ignored INTEGER DEFAULT 0,
    times_postponed INTEGER DEFAULT 0,
    status ENUM('active', 'paused', 'completed', 'deleted'),
    category VARCHAR(50),
    created_at TIMESTAMP
);

-- Completion History
CREATE TABLE completions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    reminder_id UUID REFERENCES reminders(id),
    completed_at TIMESTAMP,
    response_time_minutes INTEGER, -- temps entre rappel et complétion
    karma_earned INTEGER
);

-- Badges
CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id),
    badge_id VARCHAR(50),
    earned_at TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);
```

### WhatsApp Business API

**Option 1 : WhatsApp Cloud API (Meta)**

- Gratuit jusqu'à 1000 conversations/mois
- Puis ~0.05€/conversation
- Numéro WhatsApp Business dédié

**Option 2 : Twilio**

- Plus simple à intégrer
- ~0.005€/message
- Support WhatsApp + SMS fallback

**Recommandation :** Commencer avec Twilio (plus rapide), migrer vers Cloud API si volume.

### Telegram Bot API

- **Gratuit** (illimité)
- Moins mainstream en France mais utilisateurs tech-savvy
- Bon pour tester/MVP

---

## 7. Intégration Paiement (Stripe)

### Flow paiement via texte

```
⭐ Tu as atteint 100 karma !

Tu utilises Ménage Zen gratuitement depuis 14 jours.
Pour continuer et débloquer toutes les fonctionnalités :

💳 20€/an (1.67€/mois)
   → Rappels illimités
   → Stats avancées
   → Nouveaux packs de tâches
   → Badges exclusifs
   → Zéro pub, zéro tracking

[Continuer gratuitement 7 jours]
[S'abonner 20€/an →]
```

_L'utilisateur clique sur "S'abonner"_

```
Parfait ! Voici ton lien de paiement sécurisé :

🔗 https://pay.menagezen.com/checkout/abc123

(Lien valide 24h, paiement via Stripe)
```

### Stripe Checkout

```javascript
// Création du checkout session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email, // ou créer customer
  line_items: [
    {
      price: "price_annual_20eur",
      quantity: 1,
    },
  ],
  mode: "subscription",
  success_url: "https://menagezen.com/success?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://menagezen.com/cancel",
  metadata: {
    user_id: user.id,
    platform: "whatsapp",
  },
});

// Retourner le lien
return session.url;
```

### Webhook Stripe → Activation

```javascript
// Webhook /stripe/webhook
if (event.type === "checkout.session.completed") {
  const userId = event.data.object.metadata.user_id;
  await activateSubscription(userId);

  // Envoyer confirmation WhatsApp
  await sendWhatsApp(
    userId,
    `
    🎉 Abonnement activé !
    
    Merci pour ta confiance.
    Tu as maintenant accès à tout :
    
    ✅ Rappels illimités
    ✅ Stats avancées  
    ✅ Tous les packs
    ✅ Badges premium
    
    Continue sur ta lancée ! 💪
  `,
  );
}
```

### Modèle de prix

| Formule           | Prix       | Détail                         |
| ----------------- | ---------- | ------------------------------ |
| **Essai gratuit** | 0€         | 14 jours, 5 rappels max        |
| **Annuel**        | 20€/an     | (~1.67€/mois)                  |
| **Mensuel**       | 2.99€/mois | (pour ceux qui veulent tester) |
| **Lifetime**      | 49€ once   | (early adopters)               |

---

## 8. Interface Web de Gestion

### URL

`https://app.menagezen.com`

### Accès

Lien magique envoyé par WhatsApp (pas de mot de passe)

```
Tu veux accéder à ton espace web ?

🔗 https://app.menagezen.com/magic/xyz789

(Lien valide 15 min, usage unique)
```

### Écrans

#### Dashboard

```
┌─────────────────────────────────────────┐
│  Ménage Zen                    [Logout] │
├─────────────────────────────────────────┤
│                                         │
│  ⭐ 847 Karma        🔥 23 jours        │
│  ████████░░ 847/2500                    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  📋 Rappels actifs (12)                 │
│  ┌─────────────────────────────────┐    │
│  │ 🧽 Lavabo SDB      Dim 10h  [✏️]│    │
│  │ 🗑️ Poubelles       Mar/Ven  [✏️]│    │
│  │ 🧹 Aspirateur      Sam 10h  [✏️]│    │
│  │ ...                              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [+ Ajouter un rappel]                  │
│                                         │
└─────────────────────────────────────────┘
```

#### Paramètres

```
┌─────────────────────────────────────────┐
│  ⚙️ Paramètres                          │
├─────────────────────────────────────────┤
│                                         │
│  📱 Notifications                       │
│  ├── Check-in quotidien : [08:00 ▼]    │
│  ├── Rappels urgents : [Activé ✓]      │
│  └── Tips hebdo : [Activé ✓]           │
│                                         │
│  🏠 Mon logement                        │
│  └── Type : [T3 ▼]                      │
│                                         │
│  💳 Abonnement                          │
│  ├── Status : Actif jusqu'au 08/03/27  │
│  └── [Gérer l'abonnement]              │
│                                         │
│  🔒 Données                             │
│  ├── [Exporter mes données]            │
│  └── [Supprimer mon compte]            │
│                                         │
└─────────────────────────────────────────┘
```

#### Stats

```
┌─────────────────────────────────────────┐
│  📊 Statistiques                        │
├─────────────────────────────────────────┤
│                                         │
│  Ce mois-ci                             │
│  ┌─────────────────────────────────┐    │
│  │ Tâches complétées : 34          │    │
│  │ Taux de complétion : 87%        │    │
│  │ Temps total : 4h12              │    │
│  │ Karma gagné : +245              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Répartition                            │
│  🧹 Ménage courant ████████░░ 45%       │
│  🧽 SDB/WC         ████░░░░░░ 25%       │
│  🍽️ Cuisine        ███░░░░░░░ 20%       │
│  🪟 Autre          █░░░░░░░░░ 10%       │
│                                         │
│  Badges (5/12)                          │
│  [🌅] [💪] [🔥] [⚡] [🧘]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Stratégie Communication

### Identité de marque

**Nom :** Ménage Zen (ou variantes : ZenHome, TidyMind, ClearMind)

**Baseline :** "Libère ton esprit. Fais les choses."

**Ton :**

- Bienveillant mais direct
- Jamais moralisateur
- Légèrement humour
- Zen, pas stressant

**Couleurs :**

- Primaire : Vert sauge #9CAF88
- Secondaire : Blanc cassé #F5F5F0
- Accent : Or doux #D4A574

### TikTok / Reels

**Format 1 : POV**

> POV : T'as encore ignoré le rappel "nettoyer le frigo"
> _Montrer le frigo dégueulasse_
> vs
> POV : Tu fais 5 min par jour
> _Montrer frigo nickel_

**Format 2 : Satisfying**

> Vidéos satisfaisantes de micro-tâches
> "Ce lavabo m'a pris 3 minutes"
> CTA : Lien bio

**Format 3 : Storytelling**

> "J'ai téléchargé une app qui m'envoie des rappels ménage"
> "Au début je trouvais ça relou"
> "Puis j'ai vu mon karma monter"
> "Maintenant mon appart est toujours clean"

**Format 4 : Tips**

> "3 micro-tâches qui changent tout"
>
> 1. Essuyer le lavabo après chaque utilisation (10 sec)
> 2. Ranger 5 objets avant de quitter une pièce
> 3. Faire son lit en se levant

### Hashtags

- #menagezen #cleaningtiktok #homeorganization
- #adultingtips #procrastination #productivityhack
- #appartement #menage #organisation

### Influenceurs cibles

- Micro-influenceurs lifestyle/organisation (10K-100K)
- Comptes "adulting" / jeunes adultes
- Minimalisme / Marie Kondo-adjacent

### Partenariats potentiels

- Marques de produits ménagers (Méthode, Rainett)
- Apps de productivité (cross-promo)
- Podcasts développement perso

---

## 10. Vie Privée & Éthique

### Engagements

```
🔒 NOS ENGAGEMENTS

✓ ZÉRO publicité
  Jamais de pub dans l'app. Jamais.

✓ ZÉRO revente de données
  Tes données restent chez nous. Point.

✓ ZÉRO tracking externe
  Pas de Facebook Pixel, pas de Google Analytics
  sur tes données perso.

✓ Chiffrement
  Messages chiffrés en transit et au repos.

✓ Suppression complète
  Tu peux supprimer ton compte et toutes tes
  données en 1 clic. Vraiment supprimées.

✓ Export
  Tu peux exporter toutes tes données (RGPD).

✓ Transparence
  Notre politique de confidentialité est lisible
  par un humain normal.
```

### Données collectées

| Donnée                | Pourquoi         | Durée                |
| --------------------- | ---------------- | -------------------- |
| Numéro téléphone      | Identification   | Jusqu'à suppression  |
| Rappels               | Le service       | Jusqu'à suppression  |
| Historique complétion | Stats perso      | 2 ans puis anonymisé |
| Heure de check-in     | Personnalisation | Jusqu'à suppression  |

### Données NON collectées

- Localisation
- Contacts
- Historique navigation
- Données d'autres apps

---

## 11. Roadmap

### Phase 1 : MVP (Mois 1-2)

- [ ] Bot Telegram fonctionnel
- [ ] Onboarding basique
- [ ] Pack tâches quotidiennes + hebdo
- [ ] Karma simple
- [ ] Compréhension langage naturel (via OpenAI)
- [ ] 10 beta-testeurs

### Phase 2 : WhatsApp + Paiement (Mois 3-4)

- [ ] Migration WhatsApp Business
- [ ] Intégration Stripe
- [ ] Interface web basique
- [ ] Tous les packs de tâches
- [ ] Badges
- [ ] 100 utilisateurs

### Phase 3 : Growth (Mois 5-6)

- [ ] Stratégie TikTok
- [ ] Optimisation conversion
- [ ] Streaks avancés
- [ ] Packs spéciaux (invités, déménagement)
- [ ] 1000 utilisateurs

### Phase 4 : Expansion (Mois 7-12)

- [ ] Autres verticales (santé, admin, finances)
- [ ] Fonctionnalités sociales (duo accountability)
- [ ] API pour intégrations
- [ ] 10K utilisateurs
- [ ] Rentabilité

---

## 📎 Annexes

### A. Messages types

Voir fichier séparé : `MESSAGES.md`

### B. Liste complète des tâches

Voir fichier séparé : `TASKS.md`

### C. Badges

Voir fichier séparé : `BADGES.md`

---

_Document créé le 8 mars 2026_
_Version 1.0_
