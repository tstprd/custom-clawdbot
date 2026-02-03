# Configuration Vérification Automatique Emails

## Configuration

**Règles :**
- ⏰ **Heures actives** : 9h - 23h uniquement (pas de vérification nocturne)
- 🔄 **Fréquence** : Toutes les heures
- 🔇 **Mode silencieux** : Ne notifie QUE si emails importants détectés
- 📬 **Comptes** : alejmurot@gmail.com + jmudes76000@gmail.com

## Option 1: Cron Job Gateway (Recommandé)

Ajouter dans le système de cron de Clawdbot :

```json
{
  "id": "email-check-hourly",
  "name": "Vérification emails silencieuse",
  "schedule": "0 9-22 * * *",
  "command": "cd C:\\Users\\jules\\repo\\clawdbot && pnpm tsx skills/google/scripts/check-emails-silent.ts",
  "enabled": true,
  "notifyOnError": true
}
```

## Option 2: Task Scheduler Windows

```powershell
# Créer une tâche planifiée Windows
$action = New-ScheduledTaskAction -Execute "pnpm" -Argument "tsx skills/google/scripts/check-emails-silent.ts" -WorkingDirectory "C:\Users\jules\repo\clawdbot"

$trigger = New-ScheduledTaskTrigger -Daily -At "9:00AM" -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Hours 14)

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName "ClawdbotEmailCheck" -Action $action -Trigger $trigger -Settings $settings
```

## Option 3: Rappels manuels

Utiliser le système de rappels de Clawdbot pour demander à l'utilisateur de vérifier ou lancer automatiquement.

## Mots-clés détection emails importants

- `urgent`
- `expire` / `expiration`
- `facture`
- `paiement`
- `confirmation`
- `rdv` / `rendez-vous`
- `réservation`
- `anticor`
- `datalab`

## Test manuel

```bash
# Tester la vérification silencieuse
cd C:\Users\jules\repo\clawdbot
pnpm tsx skills/google/scripts/check-emails-silent.ts
type ha-output.txt
```

Si `ha-output.txt` est vide → Aucun email important
Si `ha-output.txt` contient du texte → Emails importants à notifier
