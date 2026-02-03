/**
 * Lobster-compatible briefing generator
 * Reads config from SQLite, outputs JSON for Lobster pipelines
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");
const GOG_PATH = "C:\\Users\\jules\\repo\\gogcli\\bin\\gog.exe";

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  throw new Error("Database not found");
}

interface BriefConfig {
  brief_type: string;
  day_type: string;
  hour: number;
  minute: number;
  enabled: number;
  sections: string[];
}

interface BriefOutput {
  type: string;
  time: string;
  dayType: string;
  sections: string[];
  data: {
    calendar?: any[];
    emails?: any;
    tasks?: any[];
    weather?: string;
  };
}

async function getBriefConfig(briefType: string, dayType: string): Promise<BriefConfig | null> {
  const db = await getDb();
  const result = db.exec(
    "SELECT * FROM brief_config WHERE brief_type = ? AND day_type = ? AND enabled = 1",
    [briefType, dayType]
  );
  db.close();

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const config: any = {};
  columns.forEach((col, i) => {
    if (col === "sections" && row[i]) {
      config[col] = JSON.parse(row[i] as string);
    } else {
      config[col] = row[i];
    }
  });
  return config as BriefConfig;
}

async function getLocalTasks(): Promise<any[]> {
  const db = await getDb();
  const result = db.exec(
    "SELECT id, title, due_date, priority, list_name FROM tasks WHERE status = 'pending' ORDER BY priority DESC, due_date"
  );
  db.close();

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const task: any = {};
    columns.forEach((col, i) => {
      task[col] = row[i];
    });
    return task;
  });
}

function runGog(args: string, account: string): any {
  try {
    const cmd = `"${GOG_PATH}" --account ${account} ${args}`;
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    return JSON.parse(output);
  } catch (e: any) {
    console.error(`gog error: ${e.message}`);
    return null;
  }
}

async function generateBrief(briefType: string): Promise<BriefOutput> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? "weekend" : "weekday";

  const config = await getBriefConfig(briefType, dayType);
  if (!config) {
    throw new Error(`No config found for ${briefType} ${dayType}`);
  }

  const output: BriefOutput = {
    type: briefType,
    time: `${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")}`,
    dayType,
    sections: config.sections,
    data: {},
  };

  const account = "jmudes76000@gmail.com";

  // Fetch data for each section
  for (const section of config.sections) {
    switch (section) {
      case "agenda":
      case "calendar":
        const days = briefType === "evening" ? 2 : 1;
        output.data.calendar = runGog(`calendar list --days ${days} --json`, account);
        break;

      case "emails":
        const emails = runGog(`gmail search "is:unread" --limit 10 --json`, account);
        output.data.emails = {
          count: emails?.length || 0,
          items: emails?.slice(0, 5) || [],
        };
        break;

      case "taches":
      case "tasks":
        output.data.tasks = await getLocalTasks();
        break;
    }
  }

  return output;
}

async function getAllBriefSchedules(): Promise<any[]> {
  const db = await getDb();
  const result = db.exec(
    "SELECT brief_type, day_type, hour, minute, enabled, sections FROM brief_config ORDER BY day_type, hour, minute"
  );
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

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case "morning":
    case "noon":
    case "evening": {
      const brief = await generateBrief(command);
      console.log(JSON.stringify(brief, null, 2));
      break;
    }

    case "schedule":
    case "schedules": {
      const schedules = await getAllBriefSchedules();
      console.log(JSON.stringify(schedules, null, 2));
      break;
    }

    case "config": {
      const schedules = await getAllBriefSchedules();
      
      console.log("📅 **Horaires des briefings**\n");
      
      const weekday = schedules.filter((s) => s.day_type === "weekday");
      const weekend = schedules.filter((s) => s.day_type === "weekend");

      console.log("**SEMAINE (Lun-Ven):**");
      for (const s of weekday) {
        const status = s.enabled ? "✅" : "❌";
        const time = `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`;
        console.log(`${status} ${s.brief_type.padEnd(8)} ${time}  → ${s.sections.join(", ")}`);
      }

      console.log("\n**WEEKEND (Sam-Dim):**");
      for (const s of weekend) {
        const status = s.enabled ? "✅" : "❌";
        const time = `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`;
        console.log(`${status} ${s.brief_type.padEnd(8)} ${time}  → ${s.sections.join(", ")}`);
      }
      break;
    }

    default:
      console.log(`
Usage:
  pnpm tsx lobster-brief.ts morning   - Generate morning brief JSON
  pnpm tsx lobster-brief.ts noon      - Generate noon brief JSON  
  pnpm tsx lobster-brief.ts evening   - Generate evening brief JSON
  pnpm tsx lobster-brief.ts schedule  - List all schedules as JSON
  pnpm tsx lobster-brief.ts config    - Show config summary
      `);
  }
})().catch(console.error);
