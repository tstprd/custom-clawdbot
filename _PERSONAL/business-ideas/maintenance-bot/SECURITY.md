# 🔒 Security Architecture - Maintenance Bot

## Principe fondamental

**Chaque client ne peut accéder qu'à ses propres données.**

Le `client_id` est verrouillé au niveau de la session, pas passé en paramètre.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WhatsApp Message                         │
│                    (whatsapp_id: +33612...)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MaintenanceDB                             │
│         getClientSession(whatsappId) → ClientScopedDB       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ClientScopedDB                             │
│                                                              │
│   readonly clientId: number  ◄── VERROUILLÉ à l'instanciation│
│   readonly whatsappId: string                                │
│                                                              │
│   Object.freeze(this) ◄── IMPOSSIBLE à modifier              │
│                                                              │
│   Toutes les opérations incluent:                           │
│   - SELECT: WHERE client_id = this.clientId                 │
│   - UPDATE: WHERE id = ? AND client_id = this.clientId      │
│   - DELETE: WHERE id = ? AND client_id = this.clientId      │
│   - INSERT: client_id = this.clientId (hardcodé)            │
└─────────────────────────────────────────────────────────────┘
```

## Garanties de sécurité

### 1. Isolation par client

| Opération | Protection |
|-----------|------------|
| `getReminders()` | `WHERE client_id = ?` |
| `getReminder(id)` | `WHERE id = ? AND client_id = ?` |
| `addReminder()` | `INSERT ... client_id = this.clientId` |
| `updateReminderDates()` | `WHERE id = ? AND client_id = ?` |
| `markReminderDone()` | `WHERE id = ? AND client_id = ?` |
| `deleteReminder()` | `WHERE id = ? AND client_id = ?` |
| `logNotification()` | Vérifie ownership avant INSERT |

### 2. Pas de client_id en paramètre

❌ **INTERDIT** :
```typescript
// Ne jamais faire ça - permet l'injection
db.updateReminder(reminderId, clientId, data);
```

✅ **OBLIGATOIRE** :
```typescript
// Le clientId est verrouillé dans la session
const session = db.getClientSession(whatsappId);
session.updateReminder(reminderId, data);
// client_id est automatiquement inclus dans WHERE
```

### 3. Vérification systématique

Chaque méthode UPDATE/DELETE vérifie d'abord que le reminder appartient au client :

```typescript
markReminderDone(reminderId: number): boolean {
  // 1. Vérifie ownership
  const reminder = this.getReminder(reminderId);
  if (!reminder) {
    console.error(`SECURITY: Attempt to mark done reminder ${reminderId} not owned by client ${this.clientId}`);
    return false;
  }
  
  // 2. Exécute avec double WHERE
  this.db.prepare(`
    UPDATE client_reminders 
    SET completed_at = datetime('now')
    WHERE id = ? AND client_id = ?
  `).run(reminderId, this.clientId);
}
```

### 4. Logging des tentatives suspectes

Toute tentative d'accès à des données non autorisées est loggée :

```
SECURITY: Attempt to update reminder 123 not owned by client 456
SECURITY: Attempt to delete reminder 789 not owned by client 456
```

## Fichiers concernés

| Fichier | Status | Notes |
|---------|--------|-------|
| `core/secure-engine.ts` | ✅ SÉCURISÉ | Remplace `engine.ts` |
| `core/secure-scheduler.ts` | ✅ SÉCURISÉ | Utilise `ClientScopedDB` |
| `core/engine.ts` | ⚠️ DÉPRÉCIÉ | Ne pas utiliser |
| `core/scheduler.ts` | ⚠️ DÉPRÉCIÉ | Ne pas utiliser |

## Usage

### Bot WhatsApp

```typescript
import { MaintenanceDB } from './core/secure-engine';

const db = new MaintenanceDB('./maintenance.db');

// Handler de message WhatsApp
async function handleMessage(whatsappId: string, message: string) {
  // Crée une session client-scoped
  const session = db.getClientSession(whatsappId);
  
  // Toutes les opérations sont automatiquement scoped
  const reminders = session.getReminders();
  
  if (message === 'fait') {
    // Ne peut marquer done QUE ses propres reminders
    session.markReminderDone(lastReminderId);
  }
}
```

### Scheduler (cron)

```typescript
import { MaintenanceDB } from './core/secure-engine';
import { SecureNotificationScheduler } from './core/secure-scheduler';

const db = new MaintenanceDB('./maintenance.db');
const scheduler = new SecureNotificationScheduler(db, sendWhatsAppMessage);

// Le scheduler utilise ClientScopedDB pour chaque notification
scheduler.start();
```

## Tests de sécurité à effectuer

- [ ] Un client ne peut pas lire les reminders d'un autre
- [ ] Un client ne peut pas modifier les reminders d'un autre
- [ ] Un client ne peut pas supprimer les reminders d'un autre
- [ ] Les tentatives sont loggées
- [ ] Le client_id ne peut pas être modifié après instanciation

---

*Dernière mise à jour : 29/01/2026*
