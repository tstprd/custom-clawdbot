#!/usr/bin/env npx tsx
/**
 * Generate daily summary note in Obsidian
 * Extracts key information from the day's conversations and tasks
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import initSqlJs from "sql.js";
import { homedir } from "os";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";
const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

interface DailySummary {
  date: string;
  tasks: { title: string; status: string }[];
  notes: string[];
}

async function getTasksFromDb(): Promise<any[]> {
  const SQL = await initSqlJs();
  if (!existsSync(DB_PATH)) return [];
  
  const fileBuffer = readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  const result = db.exec(`
    SELECT t.title, t.status, t.completed_at, l.name as list_name
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE date(t.updated_at) = date('now')
    OR date(t.completed_at) = date('now')
    ORDER BY t.completed_at DESC
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

async function generateDailySummary(): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const dayName = now.toLocaleDateString("fr-FR", { weekday: "long" });
  const monthDay = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  
  // Ensure Daily folder exists
  const dailyFolder = resolve(VAULT_PATH, "Daily");
  if (!existsSync(dailyFolder)) {
    mkdirSync(dailyFolder, { recursive: true });
  }
  
  const notePath = resolve(dailyFolder, `${dateStr}.md`);
  
  // Get tasks
  const tasks = await getTasksFromDb();
  const completedTasks = tasks.filter(t => t.status === "done");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  
  // Build note content
  let content = `# ${dayName} ${monthDay}\n\n`;
  
  // Completed tasks
  if (completedTasks.length > 0) {
    content += `## ✅ Tâches complétées\n`;
    for (const task of completedTasks) {
      const list = task.list_name ? ` (${task.list_name})` : "";
      content += `- [x] ${task.title}${list}\n`;
    }
    content += "\n";
  }
  
  // Active tasks
  if (pendingTasks.length > 0) {
    content += `## 📋 Tâches en cours\n`;
    for (const task of pendingTasks) {
      const list = task.list_name ? ` (${task.list_name})` : "";
      content += `- [ ] ${task.title}${list}\n`;
    }
    content += "\n";
  }
  
  // Notes section (to be filled manually or by agent)
  content += `## 📝 Notes\n\n`;
  
  // Links section
  content += `## 🔗 Liens\n`;
  content += `- [[Jules]]\n`;
  
  // Check if note already exists
  if (existsSync(notePath)) {
    // Read existing and merge
    const existing = readFileSync(notePath, "utf-8");
    
    // Only update if there's new content
    if (existing.includes("## ✅ Tâches complétées") || existing.includes("## 📋 Tâches en cours")) {
      console.log(`📅 Note du ${dateStr} déjà à jour`);
      return;
    }
    
    // Append new content
    content = existing.trim() + "\n\n---\n\n" + content;
  }
  
  writeFileSync(notePath, content);
  console.log(`✅ Note quotidienne créée: Daily/${dateStr}.md`);
}

generateDailySummary().catch(console.error);
