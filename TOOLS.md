# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

---

## 📁 Organisation du repo clawdbot

**⚠️ RÈGLE : Séparer le code OpenClaw des projets perso de Jules**

### Structure

```
clawdbot/
├── src/, docs/, extensions/...  → Code OpenClaw (ne pas toucher sauf dev)
├── _PERSONAL/                   → Side projects de Jules
│   ├── linkedin-genai/          → Stratégie LinkedIn + visuels
│   ├── scpi/                    → Analyse SCPI
│   ├── mutuelle/                → Docs mutuelle
│   ├── wishlist/                → Wishlist Anne-Laure
│   ├── syndic/                  → Docs syndic
│   ├── maison-bot/              → MaisonBot / Home Assistant
│   ├── roadmap-esn/             → Roadmap ESN IA
│   └── table-des-savoirs/       → Quiz Émilien - classements Serial76
├── temp/                        → Fichiers jetables (debug, scripts one-shot)
└── *.md (racine)                → Config workspace Jules (SOUL, USER, etc.)
```

### Règles pour les side projects

1. **Nouveau projet** → Créer `_PERSONAL/<nom-projet>/`
2. **Stocker tous les docs** du projet dans ce dossier (pdf, images, scripts, analyses)
3. **Ne jamais** mettre de fichiers perso à la racine du repo
4. `temp/` = jetable, peut être vidé sans regret
5. `_PERSONAL/` = important, organisé par projet

### Backup Git

- `_PERSONAL/` et `temp/` sont trackés par git
- **Cron quotidien à 2h** : commit + push vers `jules` (repo privé `tstprd/custom-clawdbot`)
- Le repo `origin` reste le repo public OpenClaw (ne pas push les fichiers perso dessus)

---

## 📊 Où vont les données ?

**⚠️ PRINCIPE FONDAMENTAL : Les fichiers .md = règles fixes. SQLite = données temporaires/structurées.**

📖 **Skill complet : `skills/local-db/SKILL.md`** — Lire ce skill pour accéder aux tâches, rappels et briefs.

### Règle : Listes → SQL, pas texte

Quand une info est une **liste de ressources** (packs d'icônes, inspirations, références, liens utiles, etc.) :

- ❌ Ne PAS écrire en markdown (pollue le contexte, pas requêtable)
- ✅ Stocker en SQLite → stats possibles, filtres, contexte-efficient

Tables à créer selon besoin : `resources`, `inspirations`, `references`, etc.

| Type                           | Stockage                      | Pourquoi                  |
| ------------------------------ | ----------------------------- | ------------------------- |
| **Tâches ponctuelles**         | SQLite `~/.clawdbot/local.db` | Temporaire, requêtable    |
| **Tâches récurrentes maison**  | Grocy (Home Assistant)        | Déjà en place             |
| **Config briefs**              | SQLite `brief_config`         | Heures, sections          |
| **Contexte urgent**            | `~/.clawdbot/HEARTBEAT.md`    | Lu à chaque reset         |
| **Projets/docs long terme**    | Obsidian vault                | Persistant, wikilinks     |
| **Historique sessions**        | `memory/`                     | Archive (pas en contexte) |
| **Identité/préférences Jules** | `USER.md`                     | Fixe, rarement modifié    |

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

### Citations Dwight (rotation automatique)

```powershell
# Obtenir la prochaine citation (LRU = least recently used)
pnpm tsx skills/local-db/scripts/db-quotes.ts get

# Voir toutes les citations avec stats d'usage
pnpm tsx skills/local-db/scripts/db-quotes.ts list

# Ajouter une citation
pnpm tsx skills/local-db/scripts/db-quotes.ts add "Citation ici"

# Reset les compteurs
pnpm tsx skills/local-db/scripts/db-quotes.ts reset
```

**⚠️ RÈGLE : Dans les briefs (matin/midi/soir), TOUJOURS utiliser `db-quotes.ts get` pour la citation Dwight. Ne jamais hardcoder une citation.**

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

### 📅 Gestion présences (chauffage auto)

**⚠️ IMPORTANT : Utiliser SQLite comme source de vérité, puis sync vers HA**

**DB:** `~/.clawdbot/local.db` table `presence_schedule`
**Script:** `pnpm tsx skills/local-db/scripts/db-presence.ts`
**Cron:** Lundi 9h → demande présences de la semaine

```powershell
cd C:\Users\jules\repo\clawdbot

# Voir la semaine en cours
pnpm tsx skills/local-db/scripts/db-presence.ts week

# Voir une semaine spécifique
pnpm tsx skills/local-db/scripts/db-presence.ts week 2026-W08

# Set un jour
pnpm tsx skills/local-db/scripts/db-presence.ts set jules 2026-02-17 away
pnpm tsx skills/local-db/scripts/db-presence.ts set anne-laure 2026-02-17 home

# Set une semaine entière (pattern: H=home, A=away, ?=unknown)
pnpm tsx skills/local-db/scripts/db-presence.ts week-set jules 2026-W08 HAAAHHA
pnpm tsx skills/local-db/scripts/db-presence.ts week-set anne-laure 2026-W08 HHHHHHH

# Sync vers Home Assistant (met à jour les input_boolean)
pnpm tsx skills/local-db/scripts/db-presence.ts sync

# Historique
pnpm tsx skills/local-db/scripts/db-presence.ts history
```

**Entités HA synchronisées:**

- `input_boolean.presence_jules_lundi` ... `_dimanche`
- `input_boolean.presence_anne_laure_lundi` ... `_dimanche`

### 🧹 Tâches Grocy (corvées maison)

**Entité HA:** `todo.grocy_chores`

```powershell
# Lister les tâches Grocy via API
$env = Get-Content "C:\Users\jules\repo\claude-home\.env" -Raw
$token = ($env -split "`n" | Where-Object { $_ -match "^HA_API_TOKEN=" }) -replace "^HA_API_TOKEN=", ""
$url = "http://192.168.1.98:8123/api/services/todo/get_items?return_response"
$body = @{entity_id = "todo.grocy_chores"} | ConvertTo-Json
$headers = @{Authorization = "Bearer $token"; "Content-Type" = "application/json"}
(Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body).service_response

# Marquer une tâche comme faite
$url = "http://192.168.1.98:8123/api/services/todo/update_item"
$body = @{entity_id = "todo.grocy_chores"; item = "Changer les draps"; status = "completed"} | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

**Tâches récurrentes:** Changer draps, Laver vitres, Aspirer VMC, Laver SDB, Maintenance Rocky, Payer charges

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

## 🏆 La Table des Savoirs (Quiz Émilien)

**Site :** https://latabledessavoirs.fr/classements
**Pseudo Jules :** Serial76
**Données :** `_PERSONAL/table-des-savoirs/`

### Cron quotidien

- **Horaire** : 12h30 (Windows Task Scheduler)
- **Script** : `C:\Users\jules\scripts\table_savoirs_scraper\run.bat`
- **Output** : CSV + Parquet dans `data/`

### Commandes rapides

```powershell
# Stats actuelles de Serial76
Select-String -Path "_PERSONAL\table-des-savoirs\*.csv" -Pattern "Serial76"

# Ou via browser pour stats live
browser action=open targetUrl="https://latabledessavoirs.fr/classements"
```

### Trigger keywords

Quand Jules dit : "quiz", "table des savoirs", "classement", "Serial76", "Émilien"
→ Aller voir `_PERSONAL/table-des-savoirs/` et/ou le site live.

---

## Lieux importants

### Aqua tonic (Sauna)

- Type : Centre bien-être / sauna
- Créneaux préférés : Midi en semaine
- Habitude à développer : Rappels réguliers (tous les 2-3 jours)
- Note : Jules résiste au changement d'habitude, nécessite encouragements persistants

---

Add whatever helps you do your job. This is your cheat sheet.
