---
name: local-db
description: Base de données SQLite locale pour les tâches, rappels, listes et configuration des briefs. Plus rapide que les fichiers MD et permet des requêtes SQL.
---

# Local Database (SQLite)

**⚠️ RÈGLE IMPORTANTE : Toutes les données temporaires vont dans cette base.**

Les fichiers `.md` (USER.md, TOOLS.md) contiennent uniquement des **règles et préférences fixes**.
Les **tâches, rappels, événements** = données temporaires → **SQLite**.

## 🚀 Commandes rapides

```powershell
cd C:\Users\jules\repo\clawdbot

# === TÂCHES ===
pnpm tsx skills/local-db/scripts/db-tasks.ts list          # Tâches en cours
pnpm tsx skills/local-db/scripts/db-tasks.ts today         # Tâches du jour
pnpm tsx skills/local-db/scripts/db-tasks.ts add "Titre"   # Ajouter
pnpm tsx skills/local-db/scripts/db-tasks.ts done <id>     # Terminer

# === BRIEFS ===
pnpm tsx skills/local-db/scripts/db-config.ts list         # Config actuelle
pnpm tsx skills/local-db/scripts/generate-brief.ts morning # Brief du matin
```

## 📍 Chemin de la base

`~/.clawdbot/local.db` (SQLite)

---

## 📋 Tables

### `tasks` - Tâches ponctuelles

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | ID auto |
| title | TEXT | Titre |
| notes | TEXT | Notes |
| list_id | INTEGER | → `lists.id` |
| status | TEXT | `pending`, `done`, `cancelled` |
| priority | INTEGER | 0 = normale |
| due_date | TEXT | YYYY-MM-DD |
| reminder_at | TEXT | YYYY-MM-DD HH:MM |
| reminder_sent | INTEGER | 1 si envoyé |

### `lists` - Catégories

| ID | Nom |
|----|-----|
| 1 | Perso |
| 2 | Maison |
| 3 | Bébé |
| 4 | Business |
| 5 | Tech |

### `brief_config` - Horaires des briefs

| brief_type | day_type | Heure par défaut |
|------------|----------|------------------|
| morning | weekday | 08:00 |
| noon | weekday | 12:30 |
| evening | weekday | 18:30 |
| morning | weekend | 10:00 |
| noon | weekend | 14:00 |

---

## 🔍 Requêtes SQL essentielles

### Tâches actives (pour les briefs)

```sql
SELECT t.id, t.title, t.due_date, l.name as liste
FROM tasks t 
LEFT JOIN lists l ON t.list_id = l.id 
WHERE t.status = 'pending'
ORDER BY t.due_date, t.priority DESC;
```

### Tâches en retard

```sql
SELECT * FROM tasks 
WHERE status = 'pending' 
  AND due_date < date('now');
```

### Rappels du jour

```sql
SELECT * FROM tasks 
WHERE reminder_at IS NOT NULL 
  AND date(reminder_at) = date('now')
  AND reminder_sent = 0;
```

### Config brief actuelle

```sql
SELECT * FROM brief_config 
WHERE enabled = 1 
ORDER BY day_type, hour;
```

---

## 📝 Scripts détaillés

### Tâches (`db-tasks.ts`)

```bash
# Ajouter avec options
pnpm tsx skills/local-db/scripts/db-tasks.ts add "Titre" --list Perso --due 2026-02-05

# Lister par liste
pnpm tsx skills/local-db/scripts/db-tasks.ts list --list Maison

# Toutes (y compris terminées)
pnpm tsx skills/local-db/scripts/db-tasks.ts list --all

# Supprimer
pnpm tsx skills/local-db/scripts/db-tasks.ts delete <id>
```

### Config briefs (`db-config.ts`)

```bash
# Modifier l'heure
pnpm tsx skills/local-db/scripts/db-config.ts set morning weekday 8 40

# Activer/désactiver
pnpm tsx skills/local-db/scripts/db-config.ts enable noon weekend
pnpm tsx skills/local-db/scripts/db-config.ts disable evening weekend
```

### Générateur de brief (`generate-brief.ts`)

```bash
pnpm tsx skills/local-db/scripts/generate-brief.ts morning
pnpm tsx skills/local-db/scripts/generate-brief.ts noon
pnpm tsx skills/local-db/scripts/generate-brief.ts evening
pnpm tsx skills/local-db/scripts/generate-brief.ts today     # Tâches du jour
pnpm tsx skills/local-db/scripts/generate-brief.ts reminders # Rappels
```

---

## 🔄 Règles d'utilisation

### Quand utiliser SQLite local ?
- Jules dit "ajoute une tâche" → `db-tasks.ts add`
- Jules dit "rappelle-moi de..." → `db-tasks.ts add` avec `--reminder`
- Briefs du matin/soir → `generate-brief.ts`

### Quand utiliser Google Tasks ?
- Jules dit explicitement "Google Tasks" ou "liste alejmurot"
- Tâches partagées avec Anne-Laure

### Ce qui NE VA PAS dans SQLite
- Préférences fixes (→ USER.md)
- Règles de comportement (→ SOUL.md, TOOLS.md)
- Documentation projets (→ Obsidian)

---

## 📊 Autres tables utiles

| Table | Usage |
|-------|-------|
| `dismissals` | Emails/notifs ignorés |
| `usage_tracking` | Stats quotidiennes tokens |
| `watchlist` | Vidéos à regarder |
| `recipes` | Recettes (à remplir) |
