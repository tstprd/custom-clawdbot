/**
 * Wisdom Log - Track Dwight memes and Italian words sent
 * Prevents repetition in daily wisdom cron
 */
import { getDb, saveDb } from "./db-init.js";

async function ensureTable() {
  const db = await getDb();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS wisdom_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      UNIQUE(type, content)
    );
  `);
  
  // Index for quick lookups
  db.run(`CREATE INDEX IF NOT EXISTS idx_wisdom_type ON wisdom_log(type);`);
  
  saveDb(db);
  return db;
}

async function add(type: "meme" | "italian_word", content: string) {
  const db = await ensureTable();
  
  try {
    db.run(
      `INSERT OR IGNORE INTO wisdom_log (type, content) VALUES (?, ?)`,
      [type, content]
    );
    saveDb(db);
    console.log(`✓ Added ${type}: ${content}`);
  } catch (e) {
    console.log(`Already exists: ${content}`);
  }
}

async function check(type: "meme" | "italian_word", content: string): Promise<boolean> {
  const db = await ensureTable();
  
  const result = db.exec(
    `SELECT 1 FROM wisdom_log WHERE type = ? AND content = ? LIMIT 1`,
    [type, content]
  );
  
  return result.length > 0 && result[0].values.length > 0;
}

async function list(type?: "meme" | "italian_word") {
  const db = await ensureTable();
  
  const query = type 
    ? `SELECT type, content, sent_at FROM wisdom_log WHERE type = ? ORDER BY sent_at DESC`
    : `SELECT type, content, sent_at FROM wisdom_log ORDER BY sent_at DESC`;
  
  const result = type ? db.exec(query, [type]) : db.exec(query);
  
  if (result.length === 0 || result[0].values.length === 0) {
    console.log("No wisdom logged yet.");
    return;
  }
  
  console.log("\n📚 Wisdom Log:\n");
  for (const row of result[0].values) {
    const [t, content, date] = row;
    const emoji = t === "meme" ? "🖼️" : "🇮🇹";
    console.log(`${emoji} [${date}] ${content}`);
  }
  console.log(`\nTotal: ${result[0].values.length} entries`);
}

async function getUnused(type: "meme" | "italian_word", candidates: string[]): Promise<string[]> {
  const db = await ensureTable();
  
  const unused: string[] = [];
  for (const c of candidates) {
    const exists = await check(type, c);
    if (!exists) unused.push(c);
  }
  
  return unused;
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "add":
    if (args.length < 3) {
      console.log("Usage: wisdom-log.ts add <meme|italian_word> <content>");
      process.exit(1);
    }
    await add(args[1] as "meme" | "italian_word", args.slice(2).join(" "));
    break;
    
  case "check":
    if (args.length < 3) {
      console.log("Usage: wisdom-log.ts check <meme|italian_word> <content>");
      process.exit(1);
    }
    const exists = await check(args[1] as "meme" | "italian_word", args.slice(2).join(" "));
    console.log(exists ? "Already sent" : "Not sent yet");
    break;
    
  case "list":
    await list(args[1] as "meme" | "italian_word" | undefined);
    break;
    
  default:
    console.log(`Wisdom Log - Track sent memes and Italian words

Commands:
  add <meme|italian_word> <content>   Log a sent item
  check <meme|italian_word> <content> Check if already sent
  list [meme|italian_word]            List all logged items

Examples:
  pnpm tsx skills/local-db/scripts/wisdom-log.ts add italian_word "ciao"
  pnpm tsx skills/local-db/scripts/wisdom-log.ts list meme
`);
}
