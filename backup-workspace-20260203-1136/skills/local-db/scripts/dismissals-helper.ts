#!/usr/bin/env npx tsx
/**
 * Helper module for checking dismissals
 * Used by email triage and other crons
 */
import { getDb, saveDb } from "./db-init.js";

export interface Dismissal {
  type: string;
  external_id: string;
  subject: string | null;
  dismissed_at: string;
  remind_after: string | null;
}

/**
 * Check if an item is dismissed
 * @param type - 'email', 'task', or 'reminder'
 * @param externalId - The ID to check (can be partial match with LIKE)
 */
export async function isDismissed(type: string, externalId: string): Promise<boolean> {
  const db = await getDb();
  
  // Check for exact match or pattern match
  const rows = db.exec(`
    SELECT id FROM dismissals 
    WHERE type = '${type}' 
    AND (external_id = '${externalId}' OR '${externalId}' LIKE '%' || external_id || '%')
    AND (remind_after IS NULL OR datetime(remind_after) > datetime('now'))
  `);
  
  db.close();
  return rows.length > 0 && rows[0].values.length > 0;
}

/**
 * Check if an email should be dismissed based on rules
 * - Newsletters (Money Stuff, etc.)
 * - Past deliveries (Amazon, etc.)
 * - Specifically dismissed emails
 */
export async function shouldDismissEmail(from: string, subject: string, emailId: string): Promise<{ dismissed: boolean; reason?: string }> {
  const db = await getDb();
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();
  
  // Rule 1: Check specific dismissal by ID
  const byId = db.exec(`
    SELECT id FROM dismissals 
    WHERE type = 'email' 
    AND (external_id = '${emailId}' OR '${emailId}' LIKE '%' || external_id || '%' OR external_id LIKE '%' || '${emailId}' || '%')
    AND (remind_after IS NULL OR datetime(remind_after) > datetime('now'))
  `);
  if (byId.length > 0 && byId[0].values.length > 0) {
    db.close();
    return { dismissed: true, reason: "user_dismissed" };
  }
  
  // Rule 2: Check pattern-based dismissals
  // BitMEX
  if (fromLower.includes("bitmex") || subjectLower.includes("bitmex")) {
    const bitmex = db.exec(`SELECT id FROM dismissals WHERE type = 'email' AND external_id LIKE '%bitmex%'`);
    if (bitmex.length > 0 && bitmex[0].values.length > 0) {
      db.close();
      return { dismissed: true, reason: "pattern_bitmex" };
    }
  }
  
  // Rule 3: Newsletters - never alert (can check dismissal or auto-dismiss)
  if (fromLower.includes("newsletter") || 
      subjectLower.includes("newsletter") ||
      fromLower.includes("money stuff") ||
      subjectLower.includes("money stuff") ||
      fromLower.includes("vert l'hebdo") ||
      fromLower.includes("noreply") && subjectLower.includes("hebdo")) {
    db.close();
    return { dismissed: true, reason: "newsletter" };
  }
  
  db.close();
  return { dismissed: false };
}

/**
 * List all active dismissals
 */
export async function listDismissals(): Promise<Dismissal[]> {
  const db = await getDb();
  const rows = db.exec(`
    SELECT type, external_id, subject, dismissed_at, remind_after 
    FROM dismissals 
    WHERE remind_after IS NULL OR datetime(remind_after) > datetime('now')
    ORDER BY dismissed_at DESC
  `);
  db.close();
  
  if (rows.length === 0 || rows[0].values.length === 0) {
    return [];
  }
  
  return rows[0].values.map(row => ({
    type: row[0] as string,
    external_id: row[1] as string,
    subject: row[2] as string | null,
    dismissed_at: row[3] as string,
    remind_after: row[4] as string | null,
  }));
}

/**
 * Dismiss an item
 */
export async function dismiss(
  type: string, 
  externalId: string, 
  subject?: string, 
  remindAfter?: string
): Promise<void> {
  const db = await getDb();
  
  db.run(`
    INSERT OR REPLACE INTO dismissals (type, external_id, subject, remind_after, reason)
    VALUES (?, ?, ?, ?, 'user_dismissed')
  `, [type, externalId, subject || null, remindAfter || null]);
  
  saveDb(db);
  db.close();
}

// CLI interface
if (process.argv[1]?.includes("dismissals-helper")) {
  const cmd = process.argv[2];
  
  if (cmd === "check-email") {
    const from = process.argv[3] || "";
    const subject = process.argv[4] || "";
    const emailId = process.argv[5] || "";
    
    shouldDismissEmail(from, subject, emailId).then(result => {
      console.log(JSON.stringify(result));
    });
  }
}
