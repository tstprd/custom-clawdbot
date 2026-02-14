#!/usr/bin/env npx tsx
/**
 * Sport Sessions Database
 * Track actual completed sport sessions (not future bookings)
 *
 * Usage:
 *   pnpm tsx skills/local-db/scripts/db-sport.ts add <date> <sport> [location] [duration_min] [notes]
 *   pnpm tsx skills/local-db/scripts/db-sport.ts list [--month YYYY-MM]
 *   pnpm tsx skills/local-db/scripts/db-sport.ts stats [--month YYYY-MM]
 *   pnpm tsx skills/local-db/scripts/db-sport.ts delete <id>
 */

import Database from "better-sqlite3";
import * as os from "os";
import * as path from "path";

const DB_PATH = path.join(os.homedir(), ".clawdbot", "local.db");
const db = new Database(DB_PATH);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS sport_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    sport TEXT NOT NULL,
    location TEXT,
    duration_min INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const [, , command, ...args] = process.argv;

function add(date: string, sport: string, location?: string, duration?: string, notes?: string) {
  // Normalize sport name
  const sportNorm = sport.toLowerCase();
  const sportName = sportNorm.includes("squash")
    ? "squash"
    : sportNorm.includes("volley")
      ? "volley"
      : sport;

  const stmt = db.prepare(`
    INSERT INTO sport_sessions (date, sport, location, duration_min, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    date,
    sportName,
    location || null,
    duration ? parseInt(duration) : null,
    notes || null,
  );
  console.log(`✅ Session ajoutée: ${sportName} le ${date} (id: ${result.lastInsertRowid})`);
}

function list(month?: string) {
  let query = "SELECT * FROM sport_sessions";
  const params: string[] = [];

  if (month) {
    query += " WHERE date LIKE ?";
    params.push(`${month}%`);
  }

  query += " ORDER BY date DESC";

  const rows = db.prepare(query).all(...params) as any[];

  if (rows.length === 0) {
    console.log("Aucune session trouvée.");
    return;
  }

  console.log("\n📊 Sessions sport:\n");
  for (const row of rows) {
    const icon = row.sport === "squash" ? "🎾" : row.sport === "volley" ? "🏐" : "🏃";
    const duration = row.duration_min ? ` (${row.duration_min}min)` : "";
    const loc = row.location ? ` @ ${row.location}` : "";
    console.log(`  ${icon} ${row.date} - ${row.sport}${duration}${loc}`);
    if (row.notes) console.log(`     └─ ${row.notes}`);
  }
  console.log("");
}

function stats(month?: string) {
  let whereClause = "";
  const params: string[] = [];

  if (month) {
    whereClause = "WHERE date LIKE ?";
    params.push(`${month}%`);
  }

  // Current month stats
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth =
    now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  const currentStats = db
    .prepare(`
    SELECT sport, COUNT(*) as count 
    FROM sport_sessions 
    WHERE date LIKE ? 
    GROUP BY sport
  `)
    .all(`${currentMonth}%`) as any[];

  const lastStats = db
    .prepare(`
    SELECT sport, COUNT(*) as count 
    FROM sport_sessions 
    WHERE date LIKE ? 
    GROUP BY sport
  `)
    .all(`${lastMonth}%`) as any[];

  const getCounts = (stats: any[]) => {
    const result: Record<string, number> = { squash: 0, volley: 0 };
    for (const s of stats) {
      result[s.sport] = s.count;
    }
    return result;
  };

  const current = getCounts(currentStats);
  const last = getCounts(lastStats);

  console.log("\n📈 Stats sport:\n");
  console.log(`  Mois en cours (${currentMonth}):`);
  console.log(`    🎾 Squash: ${current.squash} (M-1: ${last.squash})`);
  console.log(`    🏐 Volley: ${current.volley} (M-1: ${last.volley})`);
  console.log("");

  // Return JSON for dashboard
  return { current, last };
}

function remove(id: string) {
  const stmt = db.prepare("DELETE FROM sport_sessions WHERE id = ?");
  const result = stmt.run(parseInt(id));
  if (result.changes > 0) {
    console.log(`✅ Session ${id} supprimée`);
  } else {
    console.log(`❌ Session ${id} non trouvée`);
  }
}

// Parse command
switch (command) {
  case "add":
    if (args.length < 2) {
      console.log("Usage: db-sport.ts add <date> <sport> [location] [duration_min] [notes]");
      console.log("Example: db-sport.ts add 2026-02-06 squash 'Le Garden' 60");
      process.exit(1);
    }
    add(args[0], args[1], args[2], args[3], args[4]);
    break;

  case "list":
    const monthArg = args.indexOf("--month");
    const monthVal = monthArg >= 0 ? args[monthArg + 1] : undefined;
    list(monthVal);
    break;

  case "stats":
    const statsMonthArg = args.indexOf("--month");
    const statsMonthVal = statsMonthArg >= 0 ? args[statsMonthArg + 1] : undefined;
    const result = stats(statsMonthVal);
    if (args.includes("--json")) {
      console.log(JSON.stringify(result));
    }
    break;

  case "delete":
    if (!args[0]) {
      console.log("Usage: db-sport.ts delete <id>");
      process.exit(1);
    }
    remove(args[0]);
    break;

  default:
    console.log(`
Sport Sessions Database

Commands:
  add <date> <sport> [location] [duration] [notes]  - Add a completed session
  list [--month YYYY-MM]                            - List sessions
  stats [--json]                                    - Show stats for dashboard
  delete <id>                                       - Remove a session

Examples:
  db-sport.ts add 2026-02-06 squash "Le Garden" 60
  db-sport.ts add 2026-02-04 volley
  db-sport.ts list --month 2026-02
  db-sport.ts stats --json
`);
}

db.close();
