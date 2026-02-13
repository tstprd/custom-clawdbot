/**
 * Presence schedule management for local SQLite database
 * Tracks planned presence for Jules and Anne-Laure, syncs to Home Assistant
 * 
 * Usage:
 *   pnpm tsx db-presence.ts set jules 2026-02-17 home
 *   pnpm tsx db-presence.ts set anne-laure 2026-02-17 away
 *   pnpm tsx db-presence.ts week [YYYY-Www]         # Show week schedule
 *   pnpm tsx db-presence.ts week-set <person> <week> <pattern>
 *   pnpm tsx db-presence.ts sync                     # Sync current week to HA
 *   pnpm tsx db-presence.ts infer <week>             # Infer from calendar/patterns
 *   pnpm tsx db-presence.ts history [person]         # Show historical data
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

// Load HA config
const CLAUDE_HOME = "C:\\Users\\jules\\repo\\claude-home";
const ENV_PATH = resolve(CLAUDE_HOME, ".env");

function loadHaConfig(): { apiUrl: string; apiToken: string } {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`Missing .env file at ${ENV_PATH}`);
  }
  const content = readFileSync(ENV_PATH, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    vars[key.trim()] = rest.join("=").trim();
  }
  return {
    apiUrl: vars.HA_API_URL || "http://192.168.1.98:8123",
    apiToken: vars.HA_API_TOKEN || "",
  };
}

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

function ensureTable(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS presence_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'home',
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person, date)
    )
  `);
  // Index for fast week queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_presence_date ON presence_schedule(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_presence_person ON presence_schedule(person)`);
}

// Get ISO week string (YYYY-Www)
function getWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

// Get dates for a week (Mon-Sun)
function getWeekDates(weekStr?: string): Date[] {
  let d: Date;
  if (weekStr) {
    const [year, week] = weekStr.split("-W").map(Number);
    d = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    // Adjust to Monday
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
  } else {
    d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
  }
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type Person = "jules" | "anne-laure";
type Status = "home" | "away" | "unknown";

// Set presence for a specific date
async function setPresence(person: Person, date: string, status: Status, source = "manual"): Promise<void> {
  const db = await getDb();
  ensureTable(db);
  
  db.run(`
    INSERT INTO presence_schedule (person, date, status, source, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(person, date) DO UPDATE SET
      status = excluded.status,
      source = excluded.source,
      updated_at = CURRENT_TIMESTAMP
  `, [person, date, status, source]);
  
  saveDb(db);
  console.log(`✓ ${person} ${date}: ${status}`);
}

// Set presence for an entire week using pattern
// Pattern: "HHHHHHH" (7 chars, H=home, A=away, ?=unknown)
async function setWeekPattern(person: Person, weekStr: string, pattern: string, source = "manual"): Promise<void> {
  if (pattern.length !== 7) {
    throw new Error("Pattern must be 7 characters (Mon-Sun): H=home, A=away, ?=unknown");
  }
  
  const dates = getWeekDates(weekStr);
  const db = await getDb();
  ensureTable(db);
  
  for (let i = 0; i < 7; i++) {
    const char = pattern[i].toUpperCase();
    const status: Status = char === "H" ? "home" : char === "A" ? "away" : "unknown";
    const dateStr = formatDate(dates[i]);
    
    db.run(`
      INSERT INTO presence_schedule (person, date, status, source, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(person, date) DO UPDATE SET
        status = excluded.status,
        source = excluded.source,
        updated_at = CURRENT_TIMESTAMP
    `, [person, dateStr, status, source]);
  }
  
  saveDb(db);
  console.log(`✓ ${person} semaine ${weekStr}: ${pattern}`);
}

// Show week schedule
async function showWeek(weekStr?: string): Promise<void> {
  const dates = getWeekDates(weekStr);
  const db = await getDb();
  ensureTable(db);
  
  const week = weekStr || getWeekString(new Date());
  console.log(`\n📅 Semaine ${week}\n`);
  console.log("         " + DAYS_FR.join("  "));
  console.log("         " + dates.map(d => formatDate(d).slice(8)).join("   "));
  console.log("");
  
  for (const person of ["jules", "anne-laure"] as Person[]) {
    const row: string[] = [];
    for (const date of dates) {
      const dateStr = formatDate(date);
      const result = db.exec(`SELECT status FROM presence_schedule WHERE person = ? AND date = ?`, [person, dateStr]);
      if (result.length && result[0].values.length) {
        const status = result[0].values[0][0] as string;
        row.push(status === "home" ? "🏠" : status === "away" ? "🚗" : "❓");
      } else {
        row.push("·");
      }
    }
    const label = person === "jules" ? "Jules     " : "Anne-Laure";
    console.log(`${label} ${row.join("   ")}`);
  }
  console.log("");
}

// Sync current week to Home Assistant booleans
async function syncToHA(): Promise<void> {
  const { apiUrl, apiToken } = loadHaConfig();
  const db = await getDb();
  ensureTable(db);
  
  const dates = getWeekDates();
  const dayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  
  console.log("🔄 Syncing to Home Assistant...\n");
  
  for (const person of ["jules", "anne-laure"] as Person[]) {
    for (let i = 0; i < 7; i++) {
      const dateStr = formatDate(dates[i]);
      const dayName = dayNames[i];
      const entityId = person === "jules" 
        ? `input_boolean.presence_jules_${dayName}`
        : `input_boolean.presence_anne_laure_${dayName}`;
      
      const result = db.exec(`SELECT status FROM presence_schedule WHERE person = ? AND date = ?`, [person, dateStr]);
      let status: Status = "unknown";
      if (result.length && result[0].values.length) {
        status = result[0].values[0][0] as Status;
      }
      
      // Only sync if we have a definite status
      if (status === "home" || status === "away") {
        const service = status === "home" ? "turn_on" : "turn_off";
        const url = `${apiUrl}/api/services/input_boolean/${service}`;
        
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ entity_id: entityId }),
          });
          
          if (response.ok) {
            const icon = status === "home" ? "🏠" : "🚗";
            console.log(`  ${icon} ${entityId}`);
          } else {
            console.error(`  ❌ ${entityId}: ${response.status}`);
          }
        } catch (error) {
          console.error(`  ❌ ${entityId}: ${error}`);
        }
      }
    }
  }
  
  console.log("\n✓ Sync complete");
}

// Show history
async function showHistory(person?: Person, limit = 30): Promise<void> {
  const db = await getDb();
  ensureTable(db);
  
  let query = `SELECT person, date, status, source, updated_at 
               FROM presence_schedule 
               ORDER BY date DESC, person 
               LIMIT ?`;
  const params: (string | number)[] = [limit];
  
  if (person) {
    query = `SELECT person, date, status, source, updated_at 
             FROM presence_schedule 
             WHERE person = ?
             ORDER BY date DESC 
             LIMIT ?`;
    params.unshift(person);
  }
  
  const result = db.exec(query, params);
  
  console.log("\n📜 Historique présence\n");
  if (!result.length || !result[0].values.length) {
    console.log("Aucune donnée");
    return;
  }
  
  for (const row of result[0].values) {
    const [p, date, status, source] = row as [string, string, string, string];
    const icon = status === "home" ? "🏠" : status === "away" ? "🚗" : "❓";
    console.log(`${date} ${p.padEnd(12)} ${icon} (${source})`);
  }
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "set": {
        const person = args[1]?.toLowerCase() as Person;
        const date = args[2];
        const status = (args[3]?.toLowerCase() || "home") as Status;
        if (!person || !date) {
          throw new Error("Usage: set <jules|anne-laure> <YYYY-MM-DD> <home|away>");
        }
        await setPresence(person, date, status);
        break;
      }
      
      case "week":
        await showWeek(args[1]);
        break;
      
      case "week-set": {
        const person = args[1]?.toLowerCase() as Person;
        const week = args[2];
        const pattern = args[3];
        if (!person || !week || !pattern) {
          throw new Error("Usage: week-set <jules|anne-laure> <YYYY-Www> <HHHHHHH>\n  H=home, A=away, ?=unknown");
        }
        await setWeekPattern(person, week, pattern);
        break;
      }
      
      case "sync":
        await syncToHA();
        break;
      
      case "history":
        await showHistory(args[1] as Person | undefined);
        break;
      
      default:
        console.log(`Presence Schedule Manager

Commands:
  set <person> <date> <status>      Set presence (home/away)
  week [YYYY-Www]                   Show week schedule
  week-set <person> <week> <pattern> Set week (HHHHHHH: H=home, A=away)
  sync                              Sync current week to Home Assistant
  history [person]                  Show historical data

Examples:
  pnpm tsx db-presence.ts set jules 2026-02-17 away
  pnpm tsx db-presence.ts week-set jules 2026-W08 HHHAAHH
  pnpm tsx db-presence.ts week
  pnpm tsx db-presence.ts sync
`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
