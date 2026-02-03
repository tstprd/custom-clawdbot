# Plan de Migration → gog CLI

## État des lieux (25/01/2026)

### ✅ Scripts déjà sur gog CLI
- `skills/local-db/scripts/unified-brief.ts` - utilise gog directement

### ❌ Scripts legacy (tokens manuels) - À MIGRER
| Script | Cron | Priorité |
|--------|------|----------|
| `remove-all-email-reminders.ts` | Nettoyage alertes email agenda | Haute |
| `auto-mark-unimportant.ts` | Nettoyage emails quotidien | Haute |
| `heartbeat-check.ts` | Heartbeat intelligent | Haute |
| `check-weekends-v3.ts` | Rappel transports | Moyenne |

### 🔧 Crons à corriger

#### Phase 1 : Immédiat (gog CLI direct)

1. **Nettoyage alertes email agenda** (`d835df85`)
   - Actuel : `pnpm tsx skills/google/scripts/remove-all-email-reminders.ts`
   - Nouveau : Script réécrit avec gog CLI

2. **Nettoyage emails quotidien** (`5efb67a7`)
   - Actuel : `pnpm tsx skills/google/scripts/auto-mark-unimportant.ts`
   - Nouveau : Script réécrit avec gog CLI

3. **Heartbeat intelligent** (`ce377f26`)
   - Actuel : `pnpm tsx skills/heartbeat/heartbeat-check.ts`
   - Nouveau : Script réécrit avec gog CLI

#### Phase 2 : Court terme

4. **Rappel transports** (`5824be66`)
   - Actuel : `pnpm tsx skills/google/scripts/check-weekends-v3.ts`
   - Nouveau : Script réécrit avec gog CLI

5. **Analyse présences** (`574784cd`)
   - Vérifier si dépend de scripts legacy

#### Phase 3 : Nettoyage

- Archiver les scripts legacy dans `skills/google/scripts/_deprecated/`
- Mettre à jour SKILL.md
- Supprimer les fichiers de tokens `.clawdbot-google-tokens-*.json`

## Wrapper gog CLI (réutilisable)

```typescript
// skills/google/scripts/gog-wrapper.ts
import { execSync } from 'child_process';

const GOG_PATH = 'gog'; // Disponible dans PATH

export function gog(account: string, args: string[]): string {
  const cmd = `gog ${args.join(' ')} --account ${account}`;
  return execSync(cmd, { 
    encoding: 'utf-8', 
    timeout: 30000,
    shell: 'powershell.exe'
  }).trim();
}

export function gogJson<T>(account: string, args: string[]): T {
  const output = gog(account, [...args, '--json']);
  return JSON.parse(output);
}
```

## Validation

Après chaque migration :
1. Tester manuellement le script
2. Vérifier le cron suivant
3. Confirmer absence d'erreurs dans les logs
