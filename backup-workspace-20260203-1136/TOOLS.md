# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

---

## 📊 Où vont les données ?

**⚠️ PRINCIPE FONDAMENTAL : Les fichiers .md = règles fixes. SQLite = données temporaires.**

📖 **Skill complet : `skills/local-db/SKILL.md`** — Lire ce skill pour accéder aux tâches, rappels et briefs.

| Type | Stockage | Pourquoi |
|------|----------|----------|
| **Tâches ponctuelles** | SQLite `~/.clawdbot/local.db` | Temporaire, requêtable |
| **Tâches récurrentes maison** | Grocy (Home Assistant) | Déjà en place |
| **Config briefs** | SQLite `brief_config` | Heures, sections |
| **Contexte urgent** | `~/.clawdbot/HEARTBEAT.md` | Lu à chaque reset |
| **Projets/docs long terme** | Obsidian vault | Persistant, wikilinks |
| **Historique sessions** | `memory/` | Archive (pas en contexte) |
| **Identité/préférences Jules** | `USER.md` | Fixe, rarement modifié |

### Scripts SQLite

```powershell
# Tâches
pnpm tsx skills/local-db/scripts/db-tasks.ts add "Titre" --list Perso
pnpm tsx skills/local-db/scripts/db-tasks.ts list
pnpm tsx skills/local-db/scripts/db-tasks.ts done <id>

# Config briefs
pnpm tsx skills/local-db/scripts/db-config.ts list
pnpm tsx skills/local-db/scripts/db-config.ts set morning weekday 8 40
```

### Règle d'or
- **Temporaire** (tâches, rappels, événements) → SQLite ou crons
- **Permanent** (préférences, règles, identité) → fichiers .md
- **Pour les briefs** → Lire le skill `local-db` et utiliser `generate-brief.ts`

---

## 🌐 Navigateur Web (browser tool)

**⚠️ TOUJOURS UTILISER POUR ACCÉDER À INTERNET**

Quand `web_search` échoue (pas d'API key Brave), **utiliser le browser tool** :

```
browser action=open targetUrl="https://amazon.fr/..."
browser action=snapshot  # voir le contenu de la page
browser action=act request={kind:"click", ref:"e12"}  # interagir
```

### Cas d'usage
- Vérifier prix sur Amazon, LDLC, etc.
- Rechercher des infos sur Google
- Remplir des formulaires web
- Réserver (squash, restaurants, etc.)

### Profils
- `profile="clawd"` — navigateur isolé Clawdbot (par défaut)
- `profile="chrome"` — prendre le contrôle d'un onglet Chrome existant (nécessite extension)

**Règle : Si web_search échoue → browser tool. Ne jamais dire "je ne peux pas accéder à Internet".**

---

## ⚠️ Environnement Windows / PowerShell

**Machine:** Windows 11 (DESKTOP-9EOJ263)
**Shell:** PowerShell (PAS Bash)

### Règles critiques
- ❌ **PAS de syntaxe Bash** : `for...do...done`, `2>/dev/null`, `$()` imbriqués
- ✅ **Utiliser PowerShell** : `foreach ($x in $arr) { }`, `$null`, `$()`
- ❌ **PAS de `/dev/null`** → utiliser `$null` ou `| Out-Null`
- ✅ **Chemins Windows** : `C:\Users\jules\...` (pas `/home/...`)

### Exemples PowerShell
```powershell
# Boucle sur une liste
$ids = @("id1", "id2", "id3")
foreach ($id in $ids) { commande $id }

# Supprimer la sortie d'erreur
commande 2>$null

# Ou ignorer complètement
commande | Out-Null
```

---

## 🔑 Google Services (gog CLI)

**Utiliser `gog` CLI** pour TOUS les services Google. Auth perpétuelle et automatique (pas de scripts manuels).

**Config:** `C:\Users\jules\AppData\Roaming\gogcli\config.json`
**Comptes:** `jmudes76000@gmail.com`, `alejmurot@gmail.com`

### 📧 Gmail

### ⚠️ SÉCURITÉ EMAIL - ENVOI RESTREINT

**Règle : Envoi autorisé UNIQUEMENT vers les adresses de Jules**

```powershell
# ✅ AUTORISÉ - Adresses de Jules uniquement
gog gmail send --to "jmudes76000@gmail.com" --subject "..." --body "..."
gog gmail send --to "jules.mudes@capgemini.com" --subject "..." --body "..."

# ❌ INTERDIT - Adresses externes (nécessite validation explicite)
gog gmail send --to "externe@example.com" ...  # DEMANDER VALIDATION AVANT

# Alternative sûre - Créer un brouillon
gog gmail drafts create --to "..." --subject "..." --body "..." --account jmudes76000@gmail.com
```

Pour les adresses externes : toujours créer un brouillon ou demander validation explicite.

---

```powershell
# Chercher des mails
gog gmail search "is:unread" --account jmudes76000@gmail.com --json

# Lire un mail
gog gmail get <messageId> --account jmudes76000@gmail.com --json

# Marquer comme lu
gog gmail thread modify <threadId> --remove=UNREAD --account jmudes76000@gmail.com

# Télécharger une pièce jointe
gog gmail attachment <messageId> <attachmentId> --account jmudes76000@gmail.com --out "chemin/fichier.pdf"
```

### 📅 Google Calendar

```powershell
# Lister les événements
gog calendar events --account jmudes76000@gmail.com --json

# Chercher un événement
gog calendar search "réunion" --account jmudes76000@gmail.com

# Créer un événement
gog calendar create primary --title "RDV" --start "2026-01-26T10:00:00" --end "2026-01-26T11:00:00" --account jmudes76000@gmail.com

# Voir les conflits
gog calendar conflicts --account jmudes76000@gmail.com
```

### ✅ Google Tasks

```powershell
# Lister les listes de tâches
gog tasks lists list --account jmudes76000@gmail.com --json

# Lister les tâches d'une liste
gog tasks list <tasklistId> --account jmudes76000@gmail.com --json

# Ajouter une tâche
gog tasks add <tasklistId> --title "Ma tâche" --account jmudes76000@gmail.com

# Marquer comme faite
gog tasks done <tasklistId> <taskId> --account jmudes76000@gmail.com
```

### 📁 Autres services disponibles

- `gog drive` - Google Drive
- `gog docs` - Google Docs
- `gog sheets` - Google Sheets
- `gog contacts` - Contacts
- `gog people` - People API
- `gog chat` - Google Chat

Aide : `gog <service> --help`

## 🎤 Transcription Audio (faster-whisper)

**⚠️ TOUJOURS UTILISER POUR LES MESSAGES VOCAUX**

**Outil :** `faster-whisper` (installé localement via pip)
**Pas besoin d'API key** - tourne en local sur CPU

### Utilisation (PowerShell)

```powershell
$audioFile = "C:\Users\jules\.clawdbot\media\inbound\<fichier>.ogg"

python -c @"
from faster_whisper import WhisperModel

model = WhisperModel('base', device='cpu', compute_type='int8')
segments, info = model.transcribe(r'$audioFile', language='fr')

for segment in segments:
    print(segment.text.strip())
"@
```

### Paramètres
- **Modèle :** `base` (bon compromis vitesse/qualité)
- **Device :** `cpu` (pas de GPU nécessaire)
- **Langue :** `fr` (forcer français pour Jules)

### Formats supportés
ogg, mp3, m4a, wav, webm, flac, etc.

### Chemin des messages vocaux Telegram
`C:\Users\jules\.clawdbot\media\inbound\<uuid>.ogg`

### ⚠️ Règle importante
Quand Jules envoie un **message vocal** (audio/ogg), **TOUJOURS transcrire** avec faster-whisper avant de répondre. Ne jamais demander de retaper le message.

---

## 🏠 Home Assistant (HASS)

**Skill:** `skills/homeassistant/SKILL.md`
**Script:** `pnpm tsx skills/homeassistant/scripts/ha.ts <command>`
**Output:** `ha-output.txt` (toujours lire après chaque commande)

### Commandes principales

```powershell
cd C:\Users\jules\repo\clawdbot

# Chercher des entités
pnpm tsx skills/homeassistant/scripts/ha.ts search --pattern presence
pnpm tsx skills/homeassistant/scripts/ha.ts search --domain light

# Contrôler un appareil
pnpm tsx skills/homeassistant/scripts/ha.ts on light.salon
pnpm tsx skills/homeassistant/scripts/ha.ts off input_boolean.presence_jules_mardi

# Lire le résultat
Get-Content ha-output.txt
```

### Gestion présences (chauffage auto)

```powershell
# Booléens de présence par jour
input_boolean.presence_jules_lundi      # on/off
input_boolean.presence_anne_laure_mardi # on/off
# ... etc pour chaque jour

# Modifier présence
pnpm tsx skills/homeassistant/scripts/ha.ts off input_boolean.presence_anne_laure_mardi
pnpm tsx skills/homeassistant/scripts/ha.ts on input_boolean.presence_jules_vendredi
```

### ⚠️ Règle importante
**Toujours utiliser ce skill pour Home Assistant** — ne pas deviner ou improviser !

---

## 🧠 Obsidian Knowledge Graph

**Vault:** `C:\Users\jules\repo\obsidianvault\JulesVault`
**GitHub:** `https://github.com/tstprd/obsidian-vault` (private)
**Skill:** `skills/obsidian/`

### Règles
1. **Quand j'apprends une nouvelle info sur Jules** → créer/mettre à jour une note avec `[[wikilinks]]`
2. **Quand Jules pose une question complexe** → lire le vault pour contexte
3. **Sync automatique** → Cron à 2h chaque nuit

### Structure
- `People/` - Jules, Anne-Laure, contacts
- `Projects/` - Travaux, business ideas, investissements
- `Places/` - Appartement, lieux fréquentés
- `Preferences/` - Goûts, habitudes
- `Tasks/` - Tâches et rappels
- `Daily/` - Notes quotidiennes (auto-générées à 22h)

### Scripts Obsidian
```powershell
# Chercher dans le vault
pnpm tsx skills/obsidian/scripts/search.ts "SCPI"

# Mettre à jour une note
pnpm tsx skills/obsidian/scripts/update-note.ts "People/Jules" "- Nouvelle info"

# Générer note du jour
pnpm tsx skills/obsidian/scripts/daily-summary.ts

# Sync vers GitHub
pnpm tsx skills/obsidian/scripts/sync.ts
```

### Crons automatiques
- **22h** : Génère la note quotidienne (tâches complétées, en cours)
- **2h** : Sync vers GitHub

---

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Lieux importants

### Aqua tonic (Sauna)
- Type : Centre bien-être / sauna
- Créneaux préférés : Midi en semaine
- Habitude à développer : Rappels réguliers (tous les 2-3 jours)
- Note : Jules résiste au changement d'habitude, nécessite encouragements persistants

---

Add whatever helps you do your job. This is your cheat sheet.
