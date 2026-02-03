#!/usr/bin/env npx tsx
/**
 * Usage tracking for Clawdbot
 * Reads usage from session status and stores in SQLite
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  return new SQL.Database();
}

function saveDb(db: Database): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

async function initUsageTable(): Promise<void> {
  const db = await getDb();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS usage_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      tokens_in INTEGER DEFAULT 0,
      tokens_out INTEGER DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      sessions_count INTEGER DEFAULT 0,
      model TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date)
    );
  `);
  
  saveDb(db);
  db.close();
}

async function recordUsage(data: {
  tokensIn: number;
  tokensOut: number;
  costUsd?: number;
  model?: string;
  notes?: string;
}): Promise<void> {
  const db = await getDb();
  const today = new Date().toISOString().split("T")[0];
  
  // Insert or update today's record
  db.run(`
    INSERT INTO usage_tracking (date, tokens_in, tokens_out, cost_usd, model, sessions_count)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(date) DO UPDATE SET
      tokens_in = tokens_in + excluded.tokens_in,
      tokens_out = tokens_out + excluded.tokens_out,
      cost_usd = cost_usd + excluded.cost_usd,
      sessions_count = sessions_count + 1
  `, [today, data.tokensIn, data.tokensOut, data.costUsd || 0, data.model || "unknown"]);
  
  saveDb(db);
  db.close();
}

async function getUsageSummary(days: number = 7): Promise<any[]> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT date, tokens_in, tokens_out, cost_usd, sessions_count, model
    FROM usage_tracking
    WHERE date >= date('now', '-${days} days')
    ORDER BY date DESC
  `);
  
  db.close();
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const record: any = {};
    columns.forEach((col, i) => {
      record[col] = row[i];
    });
    return record;
  });
}

async function getTotalUsage(): Promise<any> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT 
      SUM(tokens_in) as total_in,
      SUM(tokens_out) as total_out,
      SUM(cost_usd) as total_cost,
      SUM(sessions_count) as total_sessions,
      COUNT(*) as days_tracked
    FROM usage_tracking
  `);
  
  db.close();
  
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const totals: any = {};
  columns.forEach((col, i) => {
    totals[col] = row[i];
  });
  return totals;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

async function displayUsage(days: number = 7): Promise<void> {
  const records = await getUsageSummary(days);
  const totals = await getTotalUsage();
  
  console.log(`📊 **Usage des ${days} derniers jours**\n`);
  
  if (records.length === 0) {
    console.log("Aucune donnée enregistrée.");
    return;
  }
  
  for (const r of records) {
    const cost = r.cost_usd ? `$${r.cost_usd.toFixed(2)}` : "-";
    console.log(`${r.date}: ${formatNumber(r.tokens_in)} in / ${formatNumber(r.tokens_out)} out | ${cost}`);
  }
  
  if (totals) {
    console.log(`\n**Totaux (${totals.days_tracked} jours):**`);
    console.log(`• Tokens: ${formatNumber(totals.total_in || 0)} in / ${formatNumber(totals.total_out || 0)} out`);
    console.log(`• Coût estimé: $${(totals.total_cost || 0).toFixed(2)}`);
    console.log(`• Sessions: ${totals.total_sessions || 0}`);
  }
}

// Parse current session status
function parseSessionStatus(): { tokensIn: number; tokensOut: number; model: string } | null {
  try {
    const output = execSync("clawdbot status --json", { encoding: "utf-8", timeout: 10000 });
    const data = JSON.parse(output);
    return {
      tokensIn: data.tokens?.in || 0,
      tokensOut: data.tokens?.out || 0,
      model: data.model || "unknown",
    };
  } catch (e) {
    // Fallback: try to parse from non-JSON output
    return null;
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  await initUsageTable();
  
  switch (command) {
    case "record": {
      const status = parseSessionStatus();
      if (status) {
        await recordUsage(status);
        console.log(`✅ Enregistré: ${status.tokensIn} in / ${status.tokensOut} out`);
      } else {
        // Manual input
        const tokensIn = parseInt(args[1] || "0");
        const tokensOut = parseInt(args[2] || "0");
        await recordUsage({ tokensIn, tokensOut });
        console.log(`✅ Enregistré: ${tokensIn} in / ${tokensOut} out`);
      }
      break;
    }
    
    case "show":
    case "summary": {
      const days = parseInt(args[1] || "7");
      await displayUsage(days);
      break;
    }
    
    case "today": {
      await displayUsage(1);
      break;
    }
    
    case "week": {
      await displayUsage(7);
      break;
    }
    
    case "month": {
      await displayUsage(30);
      break;
    }
    
    default:
      console.log(`
Usage:
  pnpm tsx usage-tracking.ts record [tokens_in] [tokens_out]  - Record usage
  pnpm tsx usage-tracking.ts show [days]                       - Show summary
  pnpm tsx usage-tracking.ts today                             - Today's usage
  pnpm tsx usage-tracking.ts week                              - Last 7 days
  pnpm tsx usage-tracking.ts month                             - Last 30 days
      `);
  }
})().catch(console.error);
