/**
 * Generate brief based on SQLite configuration
 * Reads brief_config to know what sections to include
 * Reads tasks for reminders
 * 
 * Usage:
 *   pnpm tsx generate-brief.ts [morning|noon|evening]
 *   
 * Output: JSON with sections to generate
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
  throw new Error("Database not found. Run db-init.ts first.");
}

interface BriefConfig {
  id: number;
  brief_type: string;
  day_type: string;
  hour: number;
  minute: number;
  enabled: number;
  sections: string[];
}

interface Task {
  id: number;
  title: string;
  notes: string | null;
  list_name: string | null;
  status: string;
  due_date: string | null;
  reminder_at: string | null;
}

// Get current brief config
async function getCurrentBriefConfig(briefType?: string): Promise<BriefConfig | null> {
  const db = await getDb();
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? "weekend" : "weekday";
  
  let query = `
    SELECT * FROM brief_config 
    WHERE enabled = 1 AND day_type = ?
  `;
  const params: (string | number)[] = [dayType];
  
  if (briefType) {
    query += " AND brief_type = ?";
    params.push(briefType);
  }
  
  const result = db.exec(query, params);
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

// Get pending tasks (due today or overdue)
async function getPendingTasks(): Promise<Task[]> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT t.id, t.title, t.notes, l.name as list_name, t.status, t.due_date, t.reminder_at
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE t.status = 'pending'
    ORDER BY t.priority DESC, t.due_date ASC
  `);
  
  db.close();
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const task: any = {};
    columns.forEach((col, i) => {
      task[col] = row[i];
    });
    return task as Task;
  });
}

// Get tasks due today
async function getTodayTasks(): Promise<Task[]> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT t.id, t.title, t.notes, l.name as list_name, t.status, t.due_date, t.reminder_at
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE t.status = 'pending' 
      AND date(t.due_date) <= date('now')
    ORDER BY t.priority DESC, t.due_date ASC
  `);
  
  db.close();
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const task: any = {};
    columns.forEach((col, i) => {
      task[col] = row[i];
    });
    return task as Task;
  });
}

// Get tasks with pending reminders
async function getTasksWithReminders(): Promise<Task[]> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT t.id, t.title, t.notes, l.name as list_name, t.status, t.due_date, t.reminder_at
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE t.status = 'pending'
      AND t.reminder_at IS NOT NULL 
      AND t.reminder_sent = 0 
      AND datetime(t.reminder_at) <= datetime('now')
    ORDER BY t.reminder_at ASC
  `);
  
  db.close();
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const task: any = {};
    columns.forEach((col, i) => {
      task[col] = row[i];
    });
    return task as Task;
  });
}

// Get all brief configs for display
async function getAllBriefConfigs(): Promise<BriefConfig[]> {
  const db = await getDb();
  
  const result = db.exec(`
    SELECT * FROM brief_config 
    ORDER BY 
      CASE day_type WHEN 'weekday' THEN 0 ELSE 1 END,
      hour, minute
  `);
  
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
    return config as BriefConfig;
  });
}

// Generate brief instructions based on config
async function generateBriefInstructions(briefType: string): Promise<string> {
  const config = await getCurrentBriefConfig(briefType);
  
  if (!config) {
    return `Pas de brief ${briefType} configuré pour aujourd'hui.`;
  }
  
  const tasks = await getPendingTasks();
  const todayTasks = await getTodayTasks();
  const reminderTasks = await getTasksWithReminders();
  
  let instructions = `**Brief ${briefType} (${config.day_type})**\n\n`;
  instructions += `Sections à inclure : ${config.sections.join(", ")}\n\n`;
  
  // Add section-specific instructions
  for (const section of config.sections) {
    switch (section) {
      case "meteo":
        instructions += `**Météo :** Utilise web_fetch sur https://api.open-meteo.com/v1/forecast pour Rennes, Lille, Paris.\n`;
        instructions += `Format UNE LIGNE par ville : emoji + temp matin → temp aprèm + pluie oui/non\n\n`;
        break;
        
      case "citation":
        instructions += `**Citation Dwight :** Choisis une citation Dwight Schrute différente chaque jour.\n\n`;
        break;
        
      case "francais":
        instructions += `**Français :** Mini-leçon conjugaison, grammaire ou orthographe. Un seul sujet, court.\n\n`;
        break;
        
      case "italien":
        instructions += `**Italien :** 3 mots utiles avec prononciation + exemple.\n\n`;
        break;
        
      case "agenda":
        instructions += `**Agenda :** Exécute pnpm tsx skills/google/scripts/daily-briefing.ts puis lis ha-output.txt\n\n`;
        break;
        
      case "events":
        instructions += `**Événements à venir :** Regarde l'agenda sur les 14 prochains jours.\n`;
        instructions += `- Événements longs/weekends : S-2, J-7, J-3, J-1\n`;
        instructions += `- Événements courts : J-7, J-3, J-1\n`;
        instructions += `⚠️ NE PAS répéter le même événement entre ces jalons.\n\n`;
        break;
        
      case "taches":
        instructions += `**Tâches locales (SQLite) :**\n`;
        if (todayTasks.length > 0) {
          instructions += `📋 Tâches du jour :\n`;
          for (const t of todayTasks) {
            instructions += `- [${t.id}] ${t.title}`;
            if (t.list_name) instructions += ` (${t.list_name})`;
            if (t.due_date) instructions += ` 📅 ${t.due_date}`;
            instructions += `\n`;
          }
        } else {
          instructions += `Aucune tâche locale pour aujourd'hui.\n`;
        }
        instructions += `\n`;
        break;
        
      case "rappels":
        instructions += `**Rappels en attente :**\n`;
        if (reminderTasks.length > 0) {
          for (const t of reminderTasks) {
            instructions += `- [${t.id}] ${t.title} ⏰ ${t.reminder_at}\n`;
          }
        } else {
          instructions += `Aucun rappel en attente.\n`;
        }
        instructions += `\n`;
        break;
        
      case "marches":
        instructions += `**Marchés :** Capgemini, Bitcoin, Ethereum. Seulement si variation > ±5%.\n\n`;
        break;
    }
  }
  
  instructions += `**Format final :** Un seul message consolidé.`;
  
  return instructions;
}

// CLI
const isMain = process.argv[1]?.includes("generate-brief");
if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  (async () => {
    switch (command) {
      case "morning":
      case "noon":
      case "evening": {
        const instructions = await generateBriefInstructions(command);
        console.log(instructions);
        break;
      }
      
      case "config": {
        const configs = await getAllBriefConfigs();
        console.log(JSON.stringify(configs, null, 2));
        break;
      }
      
      case "tasks": {
        const tasks = await getPendingTasks();
        console.log(JSON.stringify(tasks, null, 2));
        break;
      }
      
      case "today": {
        const tasks = await getTodayTasks();
        if (tasks.length === 0) {
          console.log("Aucune tâche pour aujourd'hui.");
        } else {
          console.log("📋 Tâches du jour :");
          for (const t of tasks) {
            console.log(`- [${t.id}] ${t.title}${t.list_name ? ` (${t.list_name})` : ""}${t.due_date ? ` 📅 ${t.due_date}` : ""}`);
          }
        }
        break;
      }
      
      case "reminders": {
        const tasks = await getTasksWithReminders();
        if (tasks.length === 0) {
          console.log("Aucun rappel en attente.");
        } else {
          console.log("⏰ Rappels :");
          for (const t of tasks) {
            console.log(`- [${t.id}] ${t.title} ⏰ ${t.reminder_at}`);
          }
        }
        break;
      }
      
      default:
        // Auto-detect current brief based on time
        const now = new Date();
        const hour = now.getHours();
        let briefType = "morning";
        if (hour >= 12 && hour < 17) briefType = "noon";
        else if (hour >= 17) briefType = "evening";
        
        const instructions = await generateBriefInstructions(briefType);
        console.log(instructions);
    }
  })().catch(console.error);
}

export {
  getCurrentBriefConfig,
  getPendingTasks,
  getTodayTasks,
  getTasksWithReminders,
  generateBriefInstructions,
};
