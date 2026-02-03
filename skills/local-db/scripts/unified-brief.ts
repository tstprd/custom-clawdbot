#!/usr/bin/env npx tsx
/**
 * Unified briefing script - combines SQLite config + Lobster + gog
 * Outputs formatted text ready for Telegram
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");
const GOG_PATH = "C:\\Users\\jules\\repo\\gogcli\\bin\\gog.exe";
const LOBSTER_PATH = "C:\\Users\\jules\\repo\\lobster\\bin\\lobster.ps1";

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  throw new Error("Database not found");
}

function runCmd(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000, shell: "powershell.exe" }).trim();
  } catch (e: any) {
    return `[Erreur: ${e.message}]`;
  }
}

function runGog(args: string, account: string): any {
  try {
    const cmd = `& "${GOG_PATH}" --account ${account} ${args}`;
    const output = execSync(cmd, { encoding: "utf-8", timeout: 30000, shell: "powershell.exe" });
    return JSON.parse(output);
  } catch (e: any) {
    console.error(`gog error: ${e.message}`);
    return null;
  }
}

function runLobster(pipeline: string, account: string): any {
  try {
    // Use -Command instead of -File, and Set-Item for proper env var setting
    const cmd = `Set-Item -Path Env:GOG_ACCOUNT -Value '${account}'; & '${LOBSTER_PATH}' '${pipeline}'`;
    const output = execSync(cmd, { encoding: "utf-8", timeout: 60000, shell: "powershell.exe" });
    return JSON.parse(output);
  } catch (e: any) {
    console.error(`lobster error: ${e.message}`);
    return null;
  }
}

async function getLocalTasks(): Promise<any[]> {
  const db = await getDb();
  const result = db.exec(`
    SELECT t.id, t.title, t.due_date, t.priority, l.name as list_name 
    FROM tasks t 
    LEFT JOIN lists l ON t.list_id = l.id 
    WHERE t.status = 'pending' 
    ORDER BY t.priority DESC, t.due_date
  `);
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

async function getBriefConfig(briefType: string, dayType: string): Promise<any | null> {
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
  return config;
}

async function generateBrief(briefType: string): Promise<string> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? "weekend" : "weekday";

  const config = await getBriefConfig(briefType, dayType);
  if (!config) {
    return `[Briefing ${briefType} désactivé pour ${dayType}]`;
  }

  const account = "jmudes76000@gmail.com";
  const sections = config.sections as string[];
  let output = "";

  // Header
  const timeStr = `${String(config.hour).padStart(2, "0")}:${String(config.minute).padStart(2, "0")}`;
  const typeEmoji = briefType === "morning" ? "🌅" : briefType === "noon" ? "☀️" : "🌙";
  output += `${typeEmoji} **Briefing ${briefType}** (${timeStr})\n\n`;
  
  // Baby countdown (only for morning brief)
  if (briefType === "morning") {
    const babyDueDate = new Date("2026-05-21T00:00:00");
    const now = new Date();
    const diffMs = babyDueDate.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      output += `👶 **Naissance bébé** : J-${diffDays} (${diffMonths} mois, ${remainingDays} jours, ${diffHours}h)\n\n`;
    }
  }

  const processedSections = new Set<string>();
  
  for (const section of sections) {
    // Normalize section names to avoid duplicates
    const normalizedSection = 
      section === "calendar" || section === "events" ? "agenda" :
      section === "tasks" || section === "rappels" ? "taches" :
      section;
    
    if (processedSections.has(normalizedSection)) continue;
    processedSections.add(normalizedSection);
    
    switch (section) {
      case "agenda":
      case "calendar":
      case "events": {
        const days = briefType === "evening" ? 2 : 1;
        try {
          const events = runGog(`calendar list --days ${days} --json`, account);
          if (events && Array.isArray(events) && events.length > 0) {
            output += "📅 **Agenda**\n";
            for (const e of events.slice(0, 5)) {
              const start = e.start?.dateTime || e.start?.date || "";
              const time = start.includes("T") ? start.split("T")[1]?.substring(0, 5) : "journée";
              output += `• ${time} - ${e.summary}\n`;
            }
            output += "\n";
          } else {
            output += "📅 **Agenda** : RAS\n\n";
          }
        } catch (e) {
          output += "📅 **Agenda** : [erreur]\n\n";
        }
        break;
      }

      case "emails": {
        try {
          // Get unread emails directly via gog
          const result = runGog("gmail search is:unread --max 15 --json", account);
          const emails = result?.threads || [];
          
          if (emails && Array.isArray(emails) && emails.length > 0) {
            output += `📧 **Emails** (${emails.length} non lus)\n`;
            
            // Patterns to categorize emails
            const ignorePatterns = [/newsletter/i, /noreply/i, /notification/i, /linkedin/i, /instagram/i, /promo/i, /digest/i];
            const actionPatterns = [/facture/i, /paiement/i, /urgent/i, /action\s*requise/i, /échéance/i, /rappel/i, /relance/i, /RDV/i, /rendez-vous/i];
            const replyPatterns = [/\?$/, /question/i, /réponse/i, /confirme/i, /merci de/i, /pouvez-vous/i, /peux-tu/i];
            
            const actionEmails: any[] = [];
            const replyEmails: any[] = [];
            const fyiEmails: any[] = [];
            
            for (const email of emails) {
              const subject = email.subject || '';
              const from = email.from || '';
              
              // Skip ignored patterns
              if (ignorePatterns.some(p => p.test(subject) || p.test(from))) continue;
              
              if (actionPatterns.some(p => p.test(subject))) {
                actionEmails.push(email);
              } else if (replyPatterns.some(p => p.test(subject))) {
                replyEmails.push(email);
              } else {
                fyiEmails.push(email);
              }
            }
            
            if (actionEmails.length > 0) {
              for (const email of actionEmails.slice(0, 4)) {
                const from = (email.from || '').split('<')[0].trim() || email.from || '?';
                const subject = email.subject || '(sans objet)';
                output += `• ⚡ **${from}**: ${subject}\n`;
              }
            }
            
            if (replyEmails.length > 0) {
              for (const email of replyEmails.slice(0, 3)) {
                const from = (email.from || '').split('<')[0].trim() || email.from || '?';
                const subject = email.subject || '(sans objet)';
                output += `• ↩️ ${from}: ${subject}\n`;
              }
            }
            
            if (fyiEmails.length > 0 && actionEmails.length + replyEmails.length < 5) {
              for (const email of fyiEmails.slice(0, 3)) {
                const from = (email.from || '').split('<')[0].trim() || email.from || '?';
                const subject = email.subject || '(sans objet)';
                output += `• 📌 ${from}: ${subject}\n`;
              }
            }
            
            if (actionEmails.length === 0 && replyEmails.length === 0 && fyiEmails.length === 0) {
              output += "✨ Rien d'urgent\n";
            }
            output += "\n";
          } else {
            output += "📧 **Emails** : ✨ Inbox clean !\n\n";
          }
        } catch (e) {
          output += "📧 **Emails** : [erreur]\n\n";
        }
        break;
      }

      case "taches":
      case "tasks":
      case "rappels": {
        const tasks = await getLocalTasks();
        if (tasks.length > 0) {
          output += "✅ **Tâches**\n";
          for (const t of tasks.slice(0, 5)) {
            const due = t.due_date ? ` (${t.due_date})` : "";
            output += `• [${t.id}] ${t.title}${due}\n`;
          }
          output += "\n";
        } else {
          output += "✅ **Tâches** : RAS\n\n";
        }
        
        // Also show upcoming crons for today
        try {
          const cronsCmd = `pnpm clawdbot cron list --json`;
          const cronsOutput = runCmd(cronsCmd);
          const cronsData = JSON.parse(cronsOutput);
          const jobs = cronsData?.jobs || [];
          
          const now = Date.now();
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);
          const endOfDayMs = endOfDay.getTime();
          
          // Filter crons running today that look like reminders (not system tasks)
          const upcomingToday = jobs.filter((job: any) => {
            const nextRun = job.state?.nextRunAtMs;
            if (!nextRun || nextRun < now || nextRun > endOfDayMs) return false;
            // Exclude system jobs (briefings, sync, cleanup, etc.)
            const name = (job.name || "").toLowerCase();
            const systemPatterns = ["briefing", "sync", "backup", "nettoyage", "heartbeat", "email", "obsidian", "usage", "réflexion", "health", "application présences"];
            return !systemPatterns.some(p => name.includes(p));
          });
          
          if (upcomingToday.length > 0) {
            output += "⏰ **Rappels aujourd'hui**\n";
            for (const job of upcomingToday) {
              const nextRun = new Date(job.state.nextRunAtMs);
              const time = `${String(nextRun.getHours()).padStart(2, "0")}:${String(nextRun.getMinutes()).padStart(2, "0")}`;
              output += `• ${time} - ${job.name}\n`;
            }
            output += "\n";
          }
        } catch (e) {
          // Skip silently if cron list fails
        }
        break;
      }

      case "meteo": {
        try {
          // Use wttr.in weather service (more detailed than HA)
          const weatherCmd = `pnpm tsx C:\\Users\\jules\\repo\\clawdbot\\skills\\weather\\get-weather.ts Rennes`;
          const weather = runCmd(weatherCmd);
          if (weather && !weather.includes("indisponible")) {
            output += `🌤️ **Météo Rennes**\n${weather}\n\n`;
          }
        } catch (e) {
          // Skip silently
        }
        break;
      }

      case "italien": {
        // Génère 3 mots italiens avec prononciation et exemple
        output += "🇮🇹 **Italien du jour**\n";
        output += "[Généré dynamiquement par le cron Italien 13h]\n\n";
        break;
      }

      case "francais": {
        // Règle de grammaire française du jour
        output += "📝 **Français du jour**\n";
        output += "[À implémenter - règle grammaire aléatoire]\n\n";
        break;
      }

      case "citation":
      case "marches": {
        // Skip - not implemented yet
        break;
      }
    }
  }

  return output.trim();
}

// CLI
const args = process.argv.slice(2);
const briefType = args[0];

if (!briefType || !["morning", "noon", "evening"].includes(briefType)) {
  console.log(`
Usage:
  pnpm tsx unified-brief.ts morning   - Generate morning brief
  pnpm tsx unified-brief.ts noon      - Generate noon brief
  pnpm tsx unified-brief.ts evening   - Generate evening brief
`);
  process.exit(1);
}

generateBrief(briefType)
  .then((output) => console.log(output))
  .catch(console.error);
