# 🎊 Event Planner Bots

Bots WhatsApp pour organiser des événements avec rétro-planning automatique.

## 🎯 Verticales

| Bot | Cible | Délai typique |
|-----|-------|---------------|
| 💒 **MariageBot** | Futurs mariés | 12-18 mois |
| 👶 **BaptêmeBot** | Parents | 3-6 mois |
| 🎂 **AnnivBot** | Organisateurs | 1-3 mois |
| 🎉 **EventBot** | Événements génériques | Variable |

## 💡 Concept

1. L'utilisateur entre la **date de l'événement**
2. Le bot génère un **rétro-planning personnalisé**
3. Rappels automatiques pour chaque étape
4. Checklists interactives
5. Tips et conseils contextuels

## 📋 Exemple : Mariage (J-12 mois)

```
J-12 mois : Définir budget, liste invités, style
J-10 mois : Réserver lieu cérémonie + réception
J-8 mois  : Choisir traiteur, DJ/groupe
J-6 mois  : Commander robe/costume, save-the-date
J-4 mois  : Réserver photographe, fleuriste
J-3 mois  : Envoyer faire-part, essayages
J-2 mois  : Confirmer prestataires, plan de table
J-1 mois  : Répétition, derniers ajustements
J-1 sem   : Confirmer horaires, météo, plan B
Jour J    : Profiter ! 🎉
```

## 🔍 Concurrence identifiée

### Apps mariage existantes
| App | Type | Pricing | Points forts | Limites |
|-----|------|---------|--------------|---------|
| **The Knot** | Web/App | Freemium | Très complet, US leader | Pas de chat, complexe |
| **Zola** | Web/App | Freemium | Design moderne | US-focused |
| **Mariages.net** | Web | Gratuit | France, annuaire prestas | Pas proactif |
| **WedShoots** | App | Freemium | Photos invités | Niche photo |
| **Zankyou** | Web | Gratuit | Liste cadeaux | Pas de planning |

### Ce qui manque sur le marché
- ❌ **Pas de bot WhatsApp** proactif
- ❌ **Pas de rétro-planning automatique** personnalisé
- ❌ **Pas de rappels contextuels** (météo J-7, etc.)
- ❌ **Pas simple** (apps trop complexes)

## ✅ Notre différenciation

1. **WhatsApp natif** → Pas d'app à télécharger
2. **Proactif** → Rappels au bon moment
3. **Simple** → Conversation, pas interface complexe
4. **Personnalisé** → Adapté à la date et au style
5. **Français** → Adapté au marché FR (mairie + église, etc.)

## 💰 Pricing envisagé

| Offre | Prix | Contenu |
|-------|------|---------|
| **Basic** | 29€ | Rétro-planning + rappels |
| **Premium** | 59€ | + Tips personnalisés + checklist détaillée |
| **VIP** | 99€ | + Support humain + modifications illimitées |

## 📊 Marché potentiel

**France :**
- ~230 000 mariages/an
- ~700 000 baptêmes/an
- Millions d'anniversaires

**TAM (si 1% mariages FR)** = 2 300 clients × 50€ = **115 000€/an**

## 🛠️ Stack technique

Même stack que Maintenance Bot :
- WhatsApp Business API
- PostgreSQL / SQLite
- LLM (Haiku) pour personnalisation
- Node.js / TypeScript

## 🚀 MVP Strategy

**Phase 1 : MariageBot** (plus gros marché, plus long cycle)
1. Templates rétro-planning par style (intime, grand, laïque, religieux)
2. Inscription WhatsApp
3. Génération planning personnalisé
4. Rappels automatiques

**Phase 2 : BaptêmeBot** (plus simple, cycle court)
- Réutiliser l'engine
- Templates baptême

## ⚠️ Risques identifiés

- Cycle long (12-18 mois) → trésorerie
- Événement unique → pas de récurrence
- Concurrence apps gratuites

## 💡 Idées pour récurrence

- Bundle avec MaisonBot (post-mariage = nouvelle maison ?)
- Upsell AnnivBot (anniversaire de mariage)
- Parrainage (invités → leurs événements)

---

*À valider : interviews avec 5-10 futurs mariés*
