#!/usr/bin/env npx tsx
/**
 * Create dismissals table for tracking acknowledged emails/tasks
 * Prevents repeated alerts for items user has already dismissed
 */
import { getDb, saveDb } from "./db-init.js";

async function createDismissalsTable(): Promise<void> {
  const db = await getDb();

  // Dismissals table
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

  db.run(`CREATE INDEX IF NOT EXISTS idx_dismissals_type ON dismissals(type);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_dismissals_remind ON dismissals(remind_after);`);

  saveDb(db);
  db.close();
  console.log("✅ Table dismissals créée");
}

createDismissalsTable().catch(console.error);
