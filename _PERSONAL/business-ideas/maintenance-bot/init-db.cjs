const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const os = require("os");

const DB_PATH = path.join(os.homedir(), ".clawdbot", "maintenance-bot.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

console.log("🗄️ Initializing DB at:", DB_PATH);

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema);

const v = db.prepare("SELECT COUNT(*) as c FROM verticals").get();
const t = db.prepare("SELECT COUNT(*) as c FROM reminder_templates").get();
console.log("📊 Verticals:", v.c, "| Templates:", t.c);
db.close();
console.log("✅ Done!");
