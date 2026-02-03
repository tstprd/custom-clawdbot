# Obsidian Skill

Sync knowledge to Obsidian vault with automatic git backup.

## Vault Location

`C:\Users\jules\repo\obsidianvault\JulesVault`

## Structure

```
JulesVault/
├── People/       - Jules, Anne-Laure, contacts
├── Projects/     - Travaux, business ideas, investissements
├── Places/       - Appartement, lieux fréquentés
├── Preferences/  - Goûts, habitudes
├── Tasks/        - Tâches et rappels
└── Daily/        - Notes quotidiennes
```

## Scripts

### Sync & Backup

```bash
# Commit et push les changements
pnpm tsx skills/obsidian/scripts/sync.ts

# Ajouter/mettre à jour une note
pnpm tsx skills/obsidian/scripts/update-note.ts <path> <content>

# Chercher dans le vault
pnpm tsx skills/obsidian/scripts/search.ts <query>
```

### Daily Summary

```bash
# Génère un résumé quotidien basé sur les conversations
pnpm tsx skills/obsidian/scripts/daily-summary.ts
```

## Wikilinks

Utilise `[[NomDeLaNote]]` pour créer des liens entre notes.

Exemples:
- `[[Jules]]` → People/Jules.md
- `[[Appartement Rennes]]` → Places/Appartement Rennes.md
- `[[SCPI Aurel Ruiz]]` → Projects/SCPI Aurel Ruiz.md

## Git Backup

- Remote: `https://github.com/tstprd/obsidian-vault` (private)
- Auto-sync: Daily at 2h via Windows Task Scheduler
- Manual: `pnpm tsx skills/obsidian/scripts/sync.ts`
