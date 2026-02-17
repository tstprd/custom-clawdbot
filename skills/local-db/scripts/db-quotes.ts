import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
/**
 * Dwight quotes rotation for briefs
 * Usage:
 *   pnpm tsx db-quotes.ts get          # Get next quote (least recently used)
 *   pnpm tsx db-quotes.ts list         # List all quotes with usage stats
 *   pnpm tsx db-quotes.ts add "quote"  # Add a new quote
 *   pnpm tsx db-quotes.ts reset        # Reset all usage counters
 */
import initSqlJs, { type Database } from "sql.js";

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

async function ensureTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS dwight_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL UNIQUE,
      last_used_at TEXT,
      use_count INTEGER DEFAULT 0
    )
  `);
}

// Get next quote (least recently used, then random among ties)
async function getQuote(): Promise<string> {
  const db = await getDb();
  await ensureTable(db);

  // Get quote with lowest use_count, then oldest last_used_at, then random
  const result = db.exec(`
    SELECT id, quote FROM dwight_quotes 
    ORDER BY use_count ASC, 
             COALESCE(last_used_at, '1970-01-01') ASC,
             RANDOM()
    LIMIT 1
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    db.close();
    return "Fact: Bears eat beets.";
  }

  const [id, quote] = result[0].values[0] as [number, string];

  // Mark as used
  const now = new Date().toISOString();
  db.run("UPDATE dwight_quotes SET use_count = use_count + 1, last_used_at = ? WHERE id = ?", [
    now,
    id,
  ]);
  saveDb(db);
  db.close();

  return quote;
}

// List all quotes
async function listQuotes(): Promise<void> {
  const db = await getDb();
  await ensureTable(db);

  const result = db.exec(`
    SELECT id, substr(quote, 1, 50) as preview, use_count, last_used_at 
    FROM dwight_quotes 
    ORDER BY use_count DESC, last_used_at DESC
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    console.log("Aucune citation en base.");
    db.close();
    return;
  }

  console.log("\n📜 Citations de Dwight (" + result[0].values.length + " au total)\n");
  console.log("ID | Utilisée | Dernière | Citation");
  console.log("---|----------|----------|----------");
  for (const row of result[0].values) {
    const lastUsed = row[3] ? new Date(row[3] as string).toLocaleDateString("fr-FR") : "jamais";
    console.log(`${row[0]} | ${row[2]}x | ${lastUsed} | ${row[1]}...`);
  }
  db.close();
}

// Add a quote
async function addQuote(quote: string): Promise<void> {
  const db = await getDb();
  await ensureTable(db);

  try {
    db.run("INSERT INTO dwight_quotes (quote) VALUES (?)", [quote]);
    saveDb(db);
    console.log("✅ Citation ajoutée");
  } catch (e) {
    console.log("⚠️ Citation déjà existante ou erreur");
  }
  db.close();
}

// Reset counters
async function resetCounters(): Promise<void> {
  const db = await getDb();
  await ensureTable(db);
  db.run("UPDATE dwight_quotes SET use_count = 0, last_used_at = NULL");
  saveDb(db);
  console.log("✅ Compteurs réinitialisés");
  db.close();
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "get":
      const quote = await getQuote();
      console.log(quote);
      break;
    case "list":
      await listQuotes();
      break;
    case "add":
      if (!args[1]) {
        console.error('Usage: db-quotes.ts add "citation"');
        process.exit(1);
      }
      await addQuote(args[1]);
      break;
    case "reset":
      await resetCounters();
      break;
    default:
      console.log("Usage: db-quotes.ts [get|list|add|reset]");
  }
}

main().catch(console.error);
