/**
 * Track sport sessions for heatmap display
 * Sports: squash, volley, etc.
 */
import { getDb, saveDb } from "./db-init.js";

interface SportSession {
  id?: number;
  date: string; // YYYY-MM-DD
  sport: string;
  source?: string; // email, manual, calendar
  notes?: string;
  created_at?: string;
}

async function initSportTable() {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS sport_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      sport TEXT NOT NULL,
      source TEXT DEFAULT 'manual',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, sport)
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sport_date ON sport_sessions(date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sport_type ON sport_sessions(sport);`);
  saveDb(db);
  db.close();
}

async function addSession(s: SportSession) {
  const db = await getDb();
  await initSportTable();
  
  try {
    db.run(
      `INSERT OR REPLACE INTO sport_sessions (date, sport, source, notes) VALUES (?, ?, ?, ?)`,
      [s.date, s.sport, s.source || 'manual', s.notes || null]
    );
    saveDb(db);
    console.log(`✅ Added ${s.sport} session on ${s.date}`);
  } catch (e) {
    console.log(`⚠️ Session already exists: ${s.sport} on ${s.date}`);
  }
  db.close();
}

async function listSessions(options?: { sport?: string; year?: number; weeks?: number }) {
  const db = await getDb();
  await initSportTable();
  
  let query = "SELECT * FROM sport_sessions WHERE 1=1";
  const params: (string | number)[] = [];
  
  if (options?.sport) {
    query += " AND sport = ?";
    params.push(options.sport);
  }
  
  if (options?.year) {
    query += " AND date LIKE ?";
    params.push(`${options.year}%`);
  }
  
  if (options?.weeks) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (options.weeks * 7));
    query += " AND date >= ?";
    params.push(cutoff.toISOString().split('T')[0]);
  }
  
  query += " ORDER BY date DESC";
  
  const result = db.exec(query, params);
  db.close();
  
  if (!result.length) {
    console.log("📭 No sessions found");
    return [];
  }
  
  const cols = result[0].columns;
  const rows = result[0].values.map(row => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
  
  console.table(rows.map(r => ({
    date: r.date,
    sport: r.sport,
    source: r.source
  })));
  
  return rows;
}

async function stats(year?: number) {
  const db = await getDb();
  await initSportTable();
  
  const yearFilter = year ? `WHERE date LIKE '${year}%'` : '';
  
  const result = db.exec(`
    SELECT sport, COUNT(*) as count 
    FROM sport_sessions 
    ${yearFilter}
    GROUP BY sport 
    ORDER BY count DESC
  `);
  
  const weekly = db.exec(`
    SELECT 
      strftime('%Y-W%W', date) as week,
      sport,
      COUNT(*) as count
    FROM sport_sessions
    ${yearFilter}
    GROUP BY week, sport
    ORDER BY week DESC
    LIMIT 20
  `);
  
  db.close();
  
  console.log("\n🏆 Total par sport:");
  if (result.length) {
    for (const row of result[0].values) {
      const emoji = row[0] === 'squash' ? '🏸' : row[0] === 'volley' ? '🏐' : '🏃';
      console.log(`  ${emoji} ${row[0]}: ${row[1]} sessions`);
    }
  }
  
  console.log("\n📅 Par semaine (récent):");
  if (weekly.length) {
    for (const row of weekly[0].values) {
      console.log(`  ${row[0]} - ${row[1]}: ${row[2]}`);
    }
  }
}

async function heatmapData(weeks = 52) {
  const db = await getDb();
  await initSportTable();
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (weeks * 7));
  
  const result = db.exec(`
    SELECT date, GROUP_CONCAT(sport) as sports, COUNT(*) as count
    FROM sport_sessions
    WHERE date >= ?
    GROUP BY date
    ORDER BY date
  `, [cutoff.toISOString().split('T')[0]]);
  
  db.close();
  
  if (!result.length) {
    console.log("{}");
    return {};
  }
  
  const data: Record<string, { count: number; sports: string[] }> = {};
  for (const row of result[0].values) {
    data[row[0] as string] = {
      count: row[2] as number,
      sports: (row[1] as string).split(',')
    };
  }
  
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function deleteSession(date: string, sport: string) {
  const db = await getDb();
  db.run("DELETE FROM sport_sessions WHERE date = ? AND sport = ?", [date, sport]);
  saveDb(db);
  db.close();
  console.log(`🗑️ Deleted ${sport} on ${date}`);
}

// CLI
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case "add": {
    const date = args[0];
    const sport = args[1];
    const source = args.find(a => a.startsWith("--source="))?.split("=")[1];
    const notes = args.find(a => a.startsWith("--notes="))?.split("=")[1];
    
    if (!date || !sport) {
      console.log("Usage: db-sport.ts add <YYYY-MM-DD> <sport> [--source=...] [--notes=...]");
      process.exit(1);
    }
    addSession({ date, sport, source, notes });
    break;
  }
  
  case "list": {
    const sport = args.find(a => !a.startsWith("--"));
    const weeks = args.find(a => a.startsWith("--weeks="))?.split("=")[1];
    const year = args.find(a => a.startsWith("--year="))?.split("=")[1];
    listSessions({ 
      sport, 
      weeks: weeks ? parseInt(weeks) : undefined,
      year: year ? parseInt(year) : undefined
    });
    break;
  }
  
  case "stats": {
    const year = args[0] ? parseInt(args[0]) : undefined;
    stats(year);
    break;
  }
  
  case "heatmap": {
    const weeks = args[0] ? parseInt(args[0]) : 52;
    heatmapData(weeks);
    break;
  }
  
  case "delete": {
    const date = args[0];
    const sport = args[1];
    if (!date || !sport) {
      console.log("Usage: db-sport.ts delete <YYYY-MM-DD> <sport>");
      process.exit(1);
    }
    deleteSession(date, sport);
    break;
  }
  
  case "init":
    initSportTable().then(() => console.log("✅ Sport table ready"));
    break;
  
  default:
    console.log(`
🏃 Sport Sessions Tracker

Commands:
  init                          Create table
  add <date> <sport> [options]  Log a session
  list [sport] [--weeks=N]      List sessions
  stats [year]                  Show statistics
  heatmap [weeks]               JSON data for heatmap (default 52 weeks)
  delete <date> <sport>         Remove a session

Examples:
  pnpm tsx skills/local-db/scripts/db-sport.ts add 2026-02-01 squash --source=email
  pnpm tsx skills/local-db/scripts/db-sport.ts add 2026-01-30 volley --source=manual
  pnpm tsx skills/local-db/scripts/db-sport.ts list --weeks=8
  pnpm tsx skills/local-db/scripts/db-sport.ts stats 2026
`);
}
