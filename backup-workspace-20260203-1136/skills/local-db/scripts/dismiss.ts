#!/usr/bin/env npx tsx
/**
 * Dismiss an email/task/reminder to stop repeated alerts
 * 
 * Usage:
 *   pnpm tsx dismiss.ts email <external_id> [subject] [--snooze 2026-01-30]
 *   pnpm tsx dismiss.ts task <external_id> [subject]
 *   pnpm tsx dismiss.ts list                           # List all dismissals
 *   pnpm tsx dismiss.ts clear <type> <external_id>     # Remove a dismissal
 */
import { getDb, saveDb } from "./db-init.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const db = await getDb();

  // Ensure table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS dismissals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      external_id TEXT NOT NULL,
      subject TEXT,
      dismissed_at TEXT DEFAULT (datetime('now')),
      remind_after TEXT,
      reason TEXT,
      UNIQUE(type, external_id)
    );
  `);

  if (command === "list") {
    const rows = db.exec("SELECT type, external_id, subject, dismissed_at, remind_after FROM dismissals ORDER BY dismissed_at DESC");
    if (rows.length === 0 || rows[0].values.length === 0) {
      console.log("📭 Aucun dismissal enregistré");
    } else {
      console.log("📋 Dismissals actifs:\n");
      for (const row of rows[0].values) {
        const [type, extId, subject, dismissedAt, remindAfter] = row;
        const snooze = remindAfter ? ` (snooze until ${remindAfter})` : "";
        console.log(`- [${type}] ${subject || extId}${snooze}`);
        console.log(`  ID: ${extId} | Dismissed: ${dismissedAt}`);
      }
    }
  } else if (command === "clear") {
    const type = args[1];
    const externalId = args[2];
    if (!type || !externalId) {
      console.error("Usage: dismiss.ts clear <type> <external_id>");
      process.exit(1);
    }
    db.run("DELETE FROM dismissals WHERE type = ? AND external_id = ?", [type, externalId]);
    saveDb(db);
    console.log(`✅ Dismissal supprimé: ${type}/${externalId}`);
  } else if (command === "email" || command === "task" || command === "reminder") {
    const externalId = args[1];
    const subject = args[2] || null;
    
    // Check for --snooze flag
    let remindAfter: string | null = null;
    const snoozeIdx = args.indexOf("--snooze");
    if (snoozeIdx !== -1 && args[snoozeIdx + 1]) {
      remindAfter = args[snoozeIdx + 1];
    }

    if (!externalId) {
      console.error(`Usage: dismiss.ts ${command} <external_id> [subject] [--snooze YYYY-MM-DD]`);
      process.exit(1);
    }

    db.run(
      "INSERT OR REPLACE INTO dismissals (type, external_id, subject, remind_after, reason) VALUES (?, ?, ?, ?, ?)",
      [command, externalId, subject, remindAfter, "user_dismissed"]
    );
    saveDb(db);
    
    if (remindAfter) {
      console.log(`✅ ${command} snoozé jusqu'au ${remindAfter}: ${subject || externalId}`);
    } else {
      console.log(`✅ ${command} dismissed: ${subject || externalId}`);
    }
  } else if (command === "check") {
    // Check if an item is dismissed (for use by other scripts)
    const type = args[1];
    const externalId = args[2];
    if (!type || !externalId) {
      console.error("Usage: dismiss.ts check <type> <external_id>");
      process.exit(1);
    }
    
    const rows = db.exec(
      `SELECT id FROM dismissals 
       WHERE type = '${type}' AND external_id = '${externalId}'
       AND (remind_after IS NULL OR remind_after > datetime('now'))`
    );
    
    if (rows.length > 0 && rows[0].values.length > 0) {
      console.log("DISMISSED");
      process.exit(0);
    } else {
      console.log("NOT_DISMISSED");
      process.exit(1);
    }
  } else {
    console.log(`
📋 Dismiss - Gérer les alertes répétées

Commandes:
  email <id> [subject] [--snooze DATE]  Dismiss un email
  task <id> [subject] [--snooze DATE]   Dismiss une tâche
  list                                   Lister les dismissals
  clear <type> <id>                      Supprimer un dismissal
  check <type> <id>                      Vérifier si dismissed

Exemples:
  dismiss.ts email bitmex-123 "BitMEX Account Review"
  dismiss.ts email livraison-456 "Amazon" --snooze 2026-02-01
  dismiss.ts list
`);
  }

  db.close();
}

main().catch(console.error);
