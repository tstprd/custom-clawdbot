# 🔧 Maintenance Reminder Bots

Plateforme de bots WhatsApp pour rappels d'entretien, déclinée en verticales.

## 🎯 Verticales

| Bot | Cible | Exemples rappels |
|-----|-------|------------------|
| 🏠 **MaisonBot** | Propriétaires/locataires | Chaudière, ramonage, VMC, détecteurs fumée |
| 🚗 **AutoBot** | Conducteurs | Vidange, CT, pneus, révision |
| 🏍️ **MotoBot** | Motards | Vidange, chaîne, pneus, hivernage |
| 🌱 **JardinBot** | Jardiniers | Taille, arrosage, traitement, hivernage |
| 🪴 **PlantesBot** | Urban gardeners | Arrosage, rempotage, engrais |
| 🐕 **PetBot** | Propriétaires animaux | Vaccins, vermifuge, toilettage |

## 💡 Concept

1. L'utilisateur s'inscrit via WhatsApp (scan QR ou lien)
2. Il renseigne ses infos (dernière vidange, etc.)
3. Le bot calcule les prochaines échéances
4. Rappels automatiques au bon moment
5. L'utilisateur peut ajuster dates et délais

## 🛠️ Stack technique (commune)

```
┌─────────────────────────────────────────┐
│           WhatsApp Business API         │
│         (1 numéro par verticale)        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            Core Engine                  │
│  - Gestion clients                      │
│  - Système de crons/rappels             │
│  - Notifications                        │
│  - Paiements (Stripe/Polar)             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         PostgreSQL / SQLite             │
│  - 1 DB partagée ou 1 DB/verticale      │
└─────────────────────────────────────────┘
```

## 💰 Pricing envisagé

- **30€/an** par verticale
- **Bundle** : 50€/an pour 2+ verticales
- **Lifetime** : 99€ (one-time)

## 📊 Coûts WhatsApp Business API

| Volume | Coût/message | Notes |
|--------|--------------|-------|
| < 1000 | ~0.05€ | Conversation initiée par business |
| > 1000 | Dégressive | Négociable avec provider |

**Providers recommandés :**
- Twilio (~0.05€/msg)
- 360dialog (moins cher, EU-based)
- Meta Cloud API (direct, plus complexe)

## 🚀 MVP Strategy

**Phase 1 : MaisonBot** (le plus universel)
1. Templates rappels maison
2. Inscription WhatsApp
3. Config dates + délais personnalisés
4. Crons et notifications
5. Test avec 10 beta users

**Phase 2 : AutoBot** (gros marché)
1. Mêmes features
2. Templates voiture
3. Test marché

**Phase 3 : Scale**
- Landing pages par verticale
- Ads ciblées (TikTok, Facebook)
- Bundles cross-sell

## 📁 Structure

```
maintenance-bot/
├── core/                 # Engine partagé
│   ├── db.ts            # Database
│   ├── cron.ts          # Système crons
│   ├── notifications.ts # WhatsApp sender
│   └── payments.ts      # Stripe/Polar
├── verticals/
│   ├── maison/          # MaisonBot
│   ├── auto/            # AutoBot
│   ├── moto/            # MotoBot
│   ├── jardin/          # JardinBot
│   ├── plantes/         # PlantesBot
│   └── pets/            # PetBot
├── schema.sql           # DB schema
└── README.md
```

## ⚖️ Réglementaire

- [ ] RGPD : consentement, droit à l'oubli, export données
- [ ] CGV/CGU par verticale
- [ ] Mentions légales
- [ ] Politique de confidentialité
- [ ] WhatsApp Business Policy compliance
