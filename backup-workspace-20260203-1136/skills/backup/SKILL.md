# Backup Skill

Sauvegarde quotidienne des données Clawdbot.

## Ce qui est sauvegardé

1. **Repo clawdbot** → Git commit + push (auto-backup)
2. **SQLite databases** → Copie dans `~/backups/clawdbot/YYYY-MM-DD/`
   - `local.db` (tâches, config, briefs)
   - `memory/main.sqlite` (mémoire agent)

## Rétention

- 30 jours de backups conservés
- Les plus anciens sont supprimés automatiquement

## Exécution manuelle

```bash
cd C:\Users\jules\repo\clawdbot
pnpm tsx skills/backup/backup-all.ts
```

## Cron

- **4h chaque nuit** (silencieux sauf erreur)
