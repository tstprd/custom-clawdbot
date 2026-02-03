# Google Gmail + Calendar + Tasks Skill

Accès à Gmail, Google Calendar et Google Tasks via **gogcli**.

## Comptes configurés

- ✅ **jmudes76000@gmail.com** (personnel Jules)
- ✅ **alejmurot@gmail.com** (commun AL+Jules)

## gogcli (nouvelle méthode)

**Avantages vs ancienne méthode :**
- 🔄 Auto-refresh tokens (plus d'expiration manuelle)
- 🔐 Stocké dans Windows Credential Manager
- 📦 Multi-services : Gmail, Calendar, Tasks, Drive, Contacts, Sheets, Docs

### Commandes de base

```powershell
# Définir le PATH (une fois par session)
$env:Path = "C:\Users\jules\repo\gogcli\bin;$env:Path"

# Gmail
gog --account jmudes76000@gmail.com gmail search "is:unread" --limit 10
gog --account jmudes76000@gmail.com gmail search "from:doctolib" --limit 5

# Calendar
gog --account jmudes76000@gmail.com calendar list --days 7
gog --account alejmurot@gmail.com calendar list --days 14

# Tasks
gog --account jmudes76000@gmail.com tasks lists
gog --account alejmurot@gmail.com tasks list "Bébé"
gog --account jmudes76000@gmail.com tasks add "Liste de Jules Mudès" "Nouvelle tâche"

# Drive
gog --account jmudes76000@gmail.com drive list --limit 10

# JSON output (pour scripts)
gog --account jmudes76000@gmail.com gmail search "is:unread" --json
```

### Wrapper TypeScript

```typescript
import { gog, gogJson, searchEmails, listEvents } from './scripts/gog';

// Exécuter une commande
const result = await gog('jmudes76000@gmail.com', ['gmail', 'search', 'is:unread']);

// Avec JSON parsing
const emails = await gogJson('jmudes76000@gmail.com', ['gmail', 'search', 'is:unread', '--limit', '5']);

// Helpers
const unread = await searchEmails('jmudes76000@gmail.com', 'is:unread', 10);
const events = await listEvents('alejmurot@gmail.com', 7);
```

### CLI wrapper

```bash
pnpm tsx skills/google/scripts/gog.ts jmudes76000@gmail.com gmail search "is:unread"
pnpm tsx skills/google/scripts/gog.ts alejmurot@gmail.com tasks lists
```

## ⚠️ Scripts legacy (DÉPRÉCIÉS)

Les scripts dans `skills/google/scripts/` sont **dépréciés**.
Utiliser **gog CLI directement** pour toutes les opérations :

```powershell
# ❌ ANCIEN (ne plus utiliser)
# pnpm tsx skills/google/scripts/add-calendar-event.ts ...
# pnpm tsx skills/google/scripts/check-emails-silent.ts ...

# ✅ NOUVEAU (gog CLI)
gog calendar create primary --title "Titre" --start "2026-01-26T10:00:00" --account jmudes76000@gmail.com
gog gmail search "is:unread" --account jmudes76000@gmail.com --json
```

## Auth management

```powershell
# Lister les comptes
gog auth list

# Vérifier les tokens
gog auth list --check

# Ajouter un compte
gog auth add nouveau@gmail.com

# Status
gog auth status
```

## Framework de slots de rappel

**Jules utilise un système de slots temporels (pas de dates fixes) :**

### Slots disponibles
- **Matin semaine** (8h40) : Tâches pro/administratif
- **Midi semaine** (12h30) : Tâches pro/RH/appels bureau
- **Soir semaine** (18h30) : Tâches perso/maison
- **Matin weekend** (10h) : Tâches perso
- **Après-midi weekend** (14h) : Tâches perso

### Catégorisation automatique

**Tâches pro → matin ou midi semaine :**
- RH, VIVINTER, mutuelle, travaux bureau, entreprise, collègue, réunion, appel pro

**Tâches perso → soir semaine ou weekend :**
- Maison, courses, famille, loisirs, sport, sauna, claustra, bricolage

## Notes

- **Compte par défaut**: jmudes76000@gmail.com (personnel Jules)
- **Compte commun**: alejmurot@gmail.com (quand Jules dit "commun" ou pour tâches partagées)
- **Rappels calendrier**: Popup uniquement (30 min avant), JAMAIS d'email
- **Rappels de tâches** : Utiliser le framework de slots

## Migration

✅ **gog CLI** est LA méthode pour tous les services Google.
- Auth perpétuelle et automatique (tokens auto-refresh)
- Plus de scripts manuels d'authentification
- Plus d'expiration de tokens

❌ **Dépréciés :**
- Fichiers `.clawdbot-google-tokens-*.json`
- Scripts `skills/google/scripts/*.ts` (sauf `gog.ts` wrapper)
- Commande `pnpm tsx skills/google/scripts/auth.ts`
