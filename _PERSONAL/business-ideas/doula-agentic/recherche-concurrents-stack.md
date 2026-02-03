# Doula Agentic - Recherche Concurrents & Stack Technique
**Date :** 14 janvier 2026  
**Status :** Recherche initiale

---

## 🎯 Concept Core

Assistant IA conversationnel empathique pour accompagner les futurs parents pendant la grossesse et le post-partum.

**Différenciation clé :**
- Ton doula (empathique, bienveillant, personnalisé)
- Push actif d'infos médicales selon la semaine de grossesse
- Checklist démarches admin progressive (sans automatisation)
- Logger humeur/santé quotidien avec feedback IA
- Possibilité RDV doula physique (B2B2C)

---

## 🏆 CONCURRENTS DIRECTS - Analyse Fonctionnalités

### **Top Apps Grossesse (France + International)**

#### **1. YooMum! (La Boîte Rose)**
- ✅ Réseau social géolocalisé (rencontre futures mamans)
- ✅ Suivi grossesse semaine/semaine avec comparaison fruits
- ✅ Journal intime + photos
- ✅ Courbe de poids + To-do list
- ✅ Après naissance : courbe croissance bébé
- 💰 Gratuit + premium
- 🔗 https://www.laboiterose.fr/fr/yoomum-ton-application-de-suivi-de-grossesse

#### **2. Ovia Pregnancy Tracker**
- ✅ Comparaison quotidienne taille bébé (fruits/animaux)
- ✅ Suivi symptômes + jalons détaillés
- ✅ Backed by doctors
- ✅ Version fertilité + parentalité
- 💰 Gratuit
- 📊 Note : Très populaire, interface engageante

#### **3. Flo**
- ✅ Interface simple et intelligente
- ✅ Apprend au fil du temps (prédictions cycle)
- ✅ Tracker grossesse + post-partum
- 💰 Freemium (3,99$/mois premium)
- 📊 Leader mondial du tracking cycle/grossesse

#### **4. BabyCenter**
- ✅ Communauté très active
- ✅ Infos médicales détaillées
- ✅ Suivi hebdomadaire
- 💰 Gratuit
- 📊 Marque établie, contenu riche

#### **5. Pregnancy+ / Grossesse+**
- ✅ Modèles 3D interactifs du bébé
- ✅ Zoom sur détails anatomiques
- ✅ Visualisation semaine par semaine
- 💰 Gratuit + premium
- 📊 Force : visualisation immersive

#### **6. What to Expect**
- ✅ Très populaire (souvent citée #1 par utilisatrices)
- ✅ Guides + communauté
- ✅ Suivi post-naissance (dentition, étapes)
- 💰 Gratuit
- 📊 Référence américaine

#### **7. Alimentation Grossesse (La Boîte Rose)**
- ✅ Base 10 000 aliments (autorisé/interdit)
- ✅ Prévention toxoplasmose/listériose
- ✅ Favoris pour courses
- 💰 Gratuit
- 📊 Niche alimentaire bien couverte

---

## 📊 GAP ANALYSIS - Ce qui manque

### **Fonctionnalités absentes des apps actuelles :**

❌ **Push actif de docs/articles médicaux personnalisés** (selon semaine grossesse)  
❌ **Démarches administratives : checklist progressive + rappels doux**  
❌ **Logger humeur + état santé quotidien avec feedback IA empathique**  
❌ **RDV doula physique intégré (B2B2C)**  
❌ **Conversationnel empathique style doula** (vs tracking froid)  
❌ **Accompagnement des deux parents** (papa + maman)

### **Notre positionnement unique :**

**Doula Agentic = Compagnon conversationnel empathique**
- Interface : WhatsApp/Telegram (zéro friction, pas d'app à installer)
- Ton : Doula bienveillante, pas robot médical
- Focus : **Guidance humaine + organisation** plutôt que tracking technique
- Différence : On **accompagne émotionnellement**, on ne se contente pas de suivre des métriques

---

## 🤖 STACK TECHNIQUE - Character.AI vs Claude SDK

### ❌ **Character.AI - NON RECOMMANDÉ**

**Pourquoi éviter :**
- Pas d'API publique B2B documentée
- Pricing B2B non transparent (freemium grand public 8-35$/mois)
- Modèle monétisation : in-app purchases + ads
- Pas adapté pour SaaS B2B/B2C professionnel
- Lock-in plateforme, pas de contrôle

**Verdict :** Impasse technique et business.

---

### ✅ **Claude SDK + Clawdbot - RECOMMANDÉ**

**Avantages :**
- ✅ API officielle Anthropic (Claude 3.5 Sonnet, Haiku)
- ✅ Pricing transparent : usage-based (~$3-15/M tokens)
- ✅ Contrôle total : personality, context, mémoire utilisateur
- ✅ Self-hosted possible via Clawdbot SDK
- ✅ Messaging multicanal : WhatsApp, Telegram (UX native)
- ✅ B2B-ready : maternités peuvent intégrer via API

**Architecture technique recommandée :**

```
┌─────────────────────────────────────────────┐
│  Interface Utilisateur                      │
│  - WhatsApp (via Clawdbot)                  │
│  - Telegram (via Clawdbot)                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Application Layer                          │
│  - Claude API (Haiku pour conversations)    │
│  - Clawdbot messaging layer                 │
│  - Business logic (Node.js/TypeScript)      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Data Layer                                 │
│  - PostgreSQL (tracker, journal, préfs)     │
│  - Redis (cache sessions)                   │
│  - Firebase (push notifications)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Content Management                         │
│  - CMS médical (Strapi)                     │
│  - Articles/docs par semaine grossesse      │
│  - Checklist démarches admin                │
└─────────────────────────────────────────────┘
```

**Coût estimé MVP (100 utilisateurs actifs) :**
- Claude API (Haiku) : ~50-150€/mois
- Hébergement (Railway/Fly.io) : ~20€/mois
- Firebase (notifications) : Gratuit (< 10k/jour)
- **Total : ~70-170€/mois**

**Scale (1000 utilisateurs actifs) :**
- Claude API : ~300-800€/mois
- Hébergement : ~100€/mois
- **Total : ~400-900€/mois**

---

## 💰 STRATÉGIES DE MONÉTISATION

### **Option 1 : Freemium agressif**
- **Gratuit :** 20 messages IA/mois + tracker basique
- **Premium :** 9€/mois (messages illimités + démarches + articles)
- **Avantage :** Viralité rapide, acquisition facile
- **Risque :** Conversion faible (5-10% typique)

### **Option 2 : One-shot émotionnel**
- **29€ accès lifetime** (pendant grossesse uniquement)
- **Avantage :** Grosse conversion sur urgence/émotion grossesse
- **Risque :** Revenue limité long terme, pas de récurrence

### **Option 3 : B2B2C (RECOMMANDÉ)**
- **Maternités/mutuelles :** 500-2000€/an pour 100-500 patientes
- **Patientes :** Gratuit (via maternité) ou 4,99€/mois (direct)
- **Upsell :** RDV doula physique (commission 20-30%)
- **Avantage :** Revenue récurrent + crédibilité médicale + bouche-à-oreille
- **Exemple :** Partenariat avec 10 maternités = 10-20k€/an base + upsells

### **Mix optimal (Phase 1-2) :**
1. **MVP :** Freemium B2C (validation marché)
2. **Phase 2 :** Approche 3-5 maternités pilotes (B2B2C)
3. **Phase 3 :** Marketplace doulas + services premium

---

## 📝 FEATURES MVP (Priorités)

### **Core Must-Have :**
1. ✅ **Chat empathique quotidien** (Claude + personality doula)
2. ✅ **Push articles/infos** selon semaine de grossesse
3. ✅ **Logger humeur/symptômes** (3 questions rapides/jour)
4. ✅ **Checklist démarches admin progressive** (maman + papa)
   - Déclaration grossesse
   - Mutuelle/employeur
   - CAF/allocations
   - Préparation maternité
   - Congés paternité/maternité
5. ✅ **Tracker basique** (semaine grossesse, dates clés)

### **Nice-to-Have (Phase 2) :**
- 📅 Calendrier RDV médicaux
- 📸 Journal photo ventre
- 👥 Communauté (style YooMum)
- 🩺 Prise RDV doula physique
- 📊 Rapport hebdomadaire (export PDF)

---

## 🎯 NEXT STEPS IMMÉDIATS

### **Validation (Semaine 1-2) :**
1. ✅ **Interview Anne-Laure** (beta tester parfaite, rentre 22/01)
   - Pain points quotidiens
   - Questions récurrentes
   - Infos manquantes actuellement
   - Willingness to pay

2. ✅ **Interviews 5-10 futures mamans**
   - Forums : Doctissimo, aufeminin
   - Groupes FB : "Moms to be", "Grossesse 2026"
   - Question clé : **Paieraient-elles 9€/mois ?**

### **Proto MVP (Semaine 3-4) :**
3. ✅ **Claude API + WhatsApp bot** (48h dev)
   - Personality doula (prompt engineering)
   - 3 scénarios de conversation test
   - Logger humeur basique

4. ✅ **Checklist admin interactive**
   - CMS (Strapi) avec contenus par semaine
   - Système de rappels doux (pas intrusif)

### **Go-to-Market (Semaine 5-8) :**
5. ✅ **Landing page + waitlist**
   - SEO : "suivi grossesse empathique", "doula virtuelle"
   - Capture email : offre early bird 4,99€/mois

6. ✅ **Contact 2-3 maternités pilotes**
   - Pitch : "Assistant IA pour vos patientes"
   - Offre : 6 mois gratuits pour test

---

## 🔬 RECHERCHE COMPLÉMENTAIRE À FAIRE

### **Concurrents à analyser en profondeur :**
1. **YooMum** - Feature set exact + pricing
2. **What to Expect** - Pourquoi #1 ? Quelles failles ?
3. **Flo** - Modèle freemium (conversion rate si dispo)

### **Benchmarks à trouver :**
- Taux de conversion freemium health apps (5-15% typique)
- CAC (coût acquisition client) apps grossesse
- Churn rate post-accouchement (critique !)

### **Questions ouvertes :**
- **Thea de Character.AI :** C'est qui/quoi exactement ? (mentionné par Jules)
- **Post-partum :** Étendre le service après naissance ? (+ revenue récurrent)
- **Multi-langue :** France first, puis Belgique/Suisse/Canada ?

---

## 💡 RÉFLEXIONS STRATÉGIQUES

### **Timing parfait :**
- Anne-Laure enceinte = **Beta tester idéale** (feedback temps réel)
- Mai 2026 = 4 mois pour MVP + validation
- Marché grossesse = **750k naissances/an en France**

### **Avantages compétitifs :**
1. **Ton humain** vs robots froids (Flo, Ovia)
2. **Zéro friction** (WhatsApp) vs télécharger app
3. **Deux parents** vs focus maman uniquement
4. **Démarches admin** (gap actuel évident)
5. **B2B2C** (crédibilité maternités)

### **Risques à mitiger :**
- ⚠️ **Médical liability** : Disclaimer clair, pas de diagnostic
- ⚠️ **Churn post-accouchement** : Étendre au post-partum (12 mois)
- ⚠️ **Concurrence** : YooMum bien installé en France
- ⚠️ **Scaling costs** : Claude API peut devenir cher (optimiser prompts)

---

## 📚 RESSOURCES UTILES

### **Documentation technique :**
- Claude API : https://docs.anthropic.com/
- Clawdbot SDK : https://github.com/clawdbot/clawdbot
- WhatsApp Business API : https://developers.facebook.com/docs/whatsapp

### **Communautés cibles :**
- r/pregnant (Reddit)
- Groupes FB "Grossesse 2026", "Moms to be"
- Forums Doctissimo, aufeminin

### **Benchmark apps :**
- YooMum : https://www.yoomum.com/
- Flo : https://flo.health/
- What to Expect : https://www.whattoexpect.com/

---

**Dernière mise à jour :** 14 janvier 2026, 22:32  
**Prochaine étape :** Interview Anne-Laure (retour 22/01)
