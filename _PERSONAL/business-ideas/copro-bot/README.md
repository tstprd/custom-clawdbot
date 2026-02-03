# CoproBot - Assistant Communication Copropriété

**Date idée :** 18 janvier 2026
**Statut :** Idée initiale

## Concept

Bot IA qui automatise la communication en copropriété pour soulager le conseil syndical.

### Problème résolu
- Le conseil syndical passe trop de temps à faire la communication
- Les copropriétaires sont mal informés
- L'information est éparpillée (emails, AG, affichages...)

### Solution

Bot connecté à la boîte mail globale de la copropriété qui :

1. **Monitore les emails entrants**
   - Détecte les sujets importants (travaux, incidents, AG...)
   - Catégorise automatiquement

2. **Push notifications**
   - WhatsApp / Telegram pour les copropriétaires inscrits
   - Alertes immédiates (fuite, coupure...)
   - Récaps hebdo

3. **Génère du contenu**
   - Billets de blog / newsletter hebdo
   - Récap de ce qui s'est passé
   - Basé sur les emails + inputs du syndic

4. **Interface syndic**
   - Le syndic peut ajouter des infos
   - Valider/modifier avant publication
   - Dashboard des sujets en cours

## Différenciation

- **Pas un outil de gestion** (déjà plein : Matera, Cotoit, etc.)
- **Uniquement communication** = plus simple, moins cher
- **Plug & play** sur boîte mail existante
- **Multi-canal** (WhatsApp, Telegram, email, blog)

## Cibles

1. **Conseils syndicaux** fatigués de faire la com
2. **Syndics pros** qui veulent offrir un service premium
3. **Copropriétés** sans syndic (autogestion)

## Modèle économique

| Plan | Prix | Inclus |
|------|------|--------|
| Starter | 29€/mois | 1 copro, 50 lots max, email + 1 canal |
| Pro | 79€/mois | 1 copro, illimité, tous canaux + blog |
| Syndic | 199€/mois | 10 copros, dashboard multi-copro |

## Stack technique

- **Email parsing** : IMAP + LLM extraction
- **Messagerie** : WhatsApp Business API / Telegram Bot
- **Blog** : Ghost/Notion API ou static gen
- **LLM** : Claude API pour résumés/catégorisation
- **Base** : Clawdbot comme fondation

## Risques / Questions

- [ ] RGPD : emails = données perso → consentement nécessaire
- [ ] Adoption : convaincre le conseil syndical
- [ ] Valeur perçue : "juste de la com" = moins sexy que gestion
- [ ] Concurrence : syndics qui internalisent

## Synergies avec Doula Bot

- Même architecture (bot multi-canal + email monitoring)
- Même modèle (B2B2C ou direct B2C)
- Peut partager la stack technique

## Next Steps

1. [ ] Valider le pain point avec des conseils syndicaux
2. [ ] Prototype : connecter Clawdbot à une boîte mail copro test
3. [ ] Landing page + waitlist
