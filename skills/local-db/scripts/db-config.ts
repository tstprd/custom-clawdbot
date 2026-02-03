/**
 * Configuration management for briefs, reminders, and preferences
 * Stored in SQLite for easy querying
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

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

// Initialize config tables
export async function initConfigTables(): Promise<void> {
  const db = await getDb();

  // Brief configuration table
  db.run(`
    CREATE TABLE IF NOT EXISTS brief_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brief_type TEXT NOT NULL CHECK(brief_type IN ('morning', 'noon', 'evening')),
      day_type TEXT NOT NULL CHECK(day_type IN ('weekday', 'weekend')),
      hour INTEGER NOT NULL CHECK(hour >= 0 AND hour <= 23),
      minute INTEGER NOT NULL DEFAULT 0 CHECK(minute >= 0 AND minute <= 59),
      enabled INTEGER DEFAULT 1,
      sections TEXT,  -- JSON array of sections to include
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(brief_type, day_type)
    );
  `);

  // Task reminder preferences
  db.run(`
    CREATE TABLE IF NOT EXISTS reminder_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brief_type TEXT CHECK(brief_type IN ('morning', 'noon', 'evening', 'none')),
      day_type TEXT CHECK(day_type IN ('weekday', 'weekend', 'all')),
      priority INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default brief config if empty
  const existing = db.exec("SELECT COUNT(*) FROM brief_config");
  if (existing[0]?.values[0][0] === 0) {
    // Weekday briefs
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, sections) 
            VALUES ('morning', 'weekday', 8, 40, '["meteo","citation","francais","italien","agenda","events","marches"]')`);
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, sections) 
            VALUES ('noon', 'weekday', 12, 30, '["taches","rappels"]')`);
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, sections) 
            VALUES ('evening', 'weekday', 18, 30, '["taches","rappels"]')`);

    // Weekend briefs
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, sections) 
            VALUES ('morning', 'weekend', 9, 0, '["meteo","citation","francais","italien","agenda","events","marches"]')`);
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, sections) 
            VALUES ('noon', 'weekend', 14, 0, '["taches","rappels"]')`);
    db.run(`INSERT INTO brief_config (brief_type, day_type, hour, minute, enabled, sections) 
            VALUES ('evening', 'weekend', 18, 30, 0, '["taches","rappels"]')`);
  }

  saveDb(db);
  db.close();
  console.log("✅ Config tables initialized");
}

// Get brief config
export async function getBriefConfig(briefType?: string, dayType?: string): Promise<any[]> {
  const db = await getDb();

  let query = "SELECT * FROM brief_config WHERE enabled = 1";
  const params: string[] = [];

  if (briefType) {
    query += " AND brief_type = ?";
    params.push(briefType);
  }
  if (dayType) {
    query += " AND day_type = ?";
    params.push(dayType);
  }

  query += " ORDER BY hour, minute";

  const result = db.exec(query, params);
  db.close();

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const config: any = {};
    columns.forEach((col, i) => {
      if (col === "sections" && row[i]) {
        config[col] = JSON.parse(row[i] as string);
      } else {
        config[col] = row[i];
      }
    });
    return config;
  });
}

// Update brief config
export async function updateBriefConfig(
  briefType: string,
  dayType: string,
  updates: { hour?: number; minute?: number; enabled?: boolean; sections?: string[] }
): Promise<boolean> {
  const db = await getDb();

  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (updates.hour !== undefined) {
    sets.push("hour = ?");
    params.push(updates.hour);
  }
  if (updates.minute !== undefined) {
    sets.push("minute = ?");
    params.push(updates.minute);
  }
  if (updates.enabled !== undefined) {
    sets.push("enabled = ?");
    params.push(updates.enabled ? 1 : 0);
  }
  if (updates.sections !== undefined) {
    sets.push("sections = ?");
    params.push(JSON.stringify(updates.sections));
  }

  if (sets.length === 0) return false;

  sets.push("updated_at = datetime('now')");
  params.push(briefType, dayType);

  db.run(
    `UPDATE brief_config SET ${sets.join(", ")} WHERE brief_type = ? AND day_type = ?`,
    params
  );

  const changes = db.getRowsModified();
  saveDb(db);
  db.close();
  return changes > 0;
}

// Get current day's brief schedule
export async function getTodayBriefs(): Promise<any[]> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? "weekend" : "weekday";

  return getBriefConfig(undefined, dayType);
}

// Get next scheduled brief
export async function getNextBrief(): Promise<any | null> {
  const briefs = await getTodayBriefs();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const brief of briefs) {
    const briefMinutes = brief.hour * 60 + brief.minute;
    if (briefMinutes > currentMinutes) {
      return brief;
    }
  }

  return null;
}

// Format config for display
export function formatBriefConfig(configs: any[]): string {
  if (configs.length === 0) return "Aucune configuration.";

  const weekday = configs.filter((c) => c.day_type === "weekday");
  const weekend = configs.filter((c) => c.day_type === "weekend");

  let output = "📅 **Configuration des briefs**\n\n";

  if (weekday.length > 0) {
    output += "**Semaine (Lun-Ven):**\n";
    for (const c of weekday) {
      const status = c.enabled ? "✅" : "❌";
      const time = `${String(c.hour).padStart(2, "0")}:${String(c.minute).padStart(2, "0")}`;
      output += `${status} ${c.brief_type}: ${time}\n`;
    }
    output += "\n";
  }

  if (weekend.length > 0) {
    output += "**Weekend (Sam-Dim):**\n";
    for (const c of weekend) {
      const status = c.enabled ? "✅" : "❌";
      const time = `${String(c.hour).padStart(2, "0")}:${String(c.minute).padStart(2, "0")}`;
      output += `${status} ${c.brief_type}: ${time}\n`;
    }
  }

  return output;
}

// CLI
const isMain = process.argv[1]?.includes("db-config");
if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    switch (command) {
      case "init":
        await initConfigTables();
        break;

      case "list": {
        const configs = await getBriefConfig();
        console.log(formatBriefConfig(configs));
        break;
      }

      case "today": {
        const briefs = await getTodayBriefs();
        console.log("📋 Briefs du jour:\n" + formatBriefConfig(briefs));
        break;
      }

      case "next": {
        const next = await getNextBrief();
        if (next) {
          console.log(
            `⏰ Prochain brief: ${next.brief_type} à ${next.hour}:${String(next.minute).padStart(2, "0")}`
          );
        } else {
          console.log("Aucun brief restant aujourd'hui.");
        }
        break;
      }

      case "set": {
        // pnpm tsx db-config.ts set morning weekday 8 40
        const [, briefType, dayType, hour, minute] = args;
        if (!briefType || !dayType || !hour) {
          console.error("Usage: pnpm tsx db-config.ts set <morning|noon|evening> <weekday|weekend> <hour> [minute]");
          process.exit(1);
        }
        const success = await updateBriefConfig(briefType, dayType, {
          hour: parseInt(hour),
          minute: minute ? parseInt(minute) : 0,
        });
        if (success) {
          console.log(`✅ Brief ${briefType} (${dayType}) mis à jour: ${hour}:${minute || "00"}`);
        } else {
          console.error("❌ Échec de la mise à jour");
        }
        break;
      }

      case "enable":
      case "disable": {
        const [, briefType, dayType] = args;
        if (!briefType || !dayType) {
          console.error(`Usage: pnpm tsx db-config.ts ${command} <morning|noon|evening> <weekday|weekend>`);
          process.exit(1);
        }
        const enabled = command === "enable";
        const success = await updateBriefConfig(briefType, dayType, { enabled });
        if (success) {
          console.log(`✅ Brief ${briefType} (${dayType}) ${enabled ? "activé" : "désactivé"}`);
        }
        break;
      }

      case "sections": {
        // pnpm tsx db-config.ts sections evening weekday meteo,taches,rappels,agenda
        const [, briefType, dayType, sectionsStr] = args;
        if (!briefType || !dayType || !sectionsStr) {
          console.error("Usage: pnpm tsx db-config.ts sections <morning|noon|evening> <weekday|weekend> <section1,section2,...>");
          process.exit(1);
        }
        const sections = sectionsStr.split(",").map(s => s.trim());
        const success = await updateBriefConfig(briefType, dayType, { sections });
        if (success) {
          console.log(`✅ Sections ${briefType} (${dayType}) mis à jour: ${sections.join(", ")}`);
        } else {
          console.error("❌ Échec de la mise à jour");
        }
        break;
      }

      default:
        console.log(`
Usage:
  pnpm tsx db-config.ts init              - Initialize config tables
  pnpm tsx db-config.ts list              - List all brief configs
  pnpm tsx db-config.ts today             - Show today's briefs
  pnpm tsx db-config.ts next              - Show next scheduled brief
  pnpm tsx db-config.ts set <type> <day> <hour> [minute]  - Update brief time
  pnpm tsx db-config.ts enable <type> <day>   - Enable a brief
  pnpm tsx db-config.ts disable <type> <day>  - Disable a brief
        `);
    }
  })().catch(console.error);
}
