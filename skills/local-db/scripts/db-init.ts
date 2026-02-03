/**
 * Initialize SQLite database for local tasks, reminders, and lists
 * Path: ~/.clawdbot/local.db
 * Uses sql.js (pure JS SQLite)
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

export async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();

  // Ensure directory exists
  const dir = resolve(homedir(), ".clawdbot");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create new
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  return new SQL.Database();
}

export function saveDb(db: Database): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  // Lists table (for organizing tasks)
  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      notes TEXT,
      list_id INTEGER REFERENCES lists(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'cancelled')),
      priority INTEGER DEFAULT 0,
      due_date TEXT,
      reminder_at TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);

  // Reminders table (standalone reminders, not task-linked)
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT,
      remind_at TEXT NOT NULL,
      repeat TEXT CHECK(repeat IN ('once', 'daily', 'weekly', 'monthly')),
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Notes table (for quick notes)
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create default lists
  const defaultLists = ["Perso", "Maison", "Bébé", "Business", "Tech"];
  for (const list of defaultLists) {
    db.run("INSERT OR IGNORE INTO lists (name) VALUES (?)", [list]);
  }

  saveDb(db);
  db.close();
  console.log(`✅ Database initialized at ${DB_PATH}`);
}

// Run if called directly
const isMain = process.argv[1]?.includes("db-init");
if (isMain) {
  initDb().catch(console.error);
}
