#!/usr/bin/env npx tsx
/**
 * Heartbeat pre-filter script (gog CLI version)
 * Aggregates tasks from Google Tasks, Grocy, and markdown files
 * Only outputs actionable items to save tokens
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const HEARTBEAT_FILE = join(process.cwd(), 'HEARTBEAT.md');

const HA_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
const HA_TOKEN = process.env.HA_TOKEN;

const ACCOUNTS = {
  jmudes: 'jmudes76000@gmail.com',
  alejmurot: 'alejmurot@gmail.com'
};

interface ActionableItem {
  source: string;
  priority: 'urgent' | 'soon' | 'info';
  message: string;
}

// ==================== gog CLI helpers ====================

function gogJson<T>(args: string[], account: string): T | null {
  try {
    const cmd = `gog ${args.join(' ')} --account ${account} --json`;
    const output = execSync(cmd, { 
      encoding: 'utf-8', 
      timeout: 30000,
      shell: 'powershell.exe',
      windowsHide: true
    });
    return JSON.parse(output);
  } catch (e: any) {
    console.error(`gog error: ${e.message}`);
    return null;
  }
}

// ==================== Google Tasks ====================

async function getGoogleTasks(account: string): Promise<ActionableItem[]> {
  const items: ActionableItem[] = [];
  
  // Get task lists
  const listsResult = gogJson<{ lists: Array<{ id: string; title: string }> }>(
    ['tasks', 'lists', 'list'],
    account
  );
  
  if (!listsResult?.lists) return items;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  for (const list of listsResult.lists) {
    const tasksResult = gogJson<{ tasks: Array<{ id: string; title: string; due?: string; status: string }> }>(
      ['tasks', 'list', list.id],
      account
    );
    
    if (!tasksResult?.tasks) continue;
    
    for (const task of tasksResult.tasks) {
      if (task.status === 'completed') continue;
      
      if (task.due) {
        const dueDate = new Date(task.due);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          items.push({
            source: `Google Tasks (${list.title})`,
            priority: 'urgent',
            message: `⚠️ EN RETARD: ${task.title}`
          });
        } else if (dueDate.getTime() === today.getTime()) {
          items.push({
            source: `Google Tasks (${list.title})`,
            priority: 'soon',
            message: `📅 Aujourd'hui: ${task.title}`
          });
        }
      }
    }
  }
  
  return items;
}

// ==================== Grocy / Home Assistant ====================

async function getGrocyTasks(): Promise<ActionableItem[]> {
  if (!HA_TOKEN) return [];
  
  const items: ActionableItem[] = [];
  
  try {
    const response = await fetch(`${HA_URL}/api/states`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}` }
    });
    
    if (!response.ok) return items;
    
    const states = await response.json() as any[];
    const grocyChores = states.filter(s => 
      s.entity_id.startsWith('sensor.grocy_chore_') && 
      s.attributes?.next_estimated_execution_time
    );
    
    const today = new Date();
    
    for (const chore of grocyChores) {
      const nextDate = new Date(chore.attributes.next_estimated_execution_time);
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        items.push({
          source: 'Grocy',
          priority: 'urgent',
          message: `⚠️ EN RETARD: ${chore.attributes.friendly_name}`
        });
      } else if (daysUntil === 0) {
        items.push({
          source: 'Grocy',
          priority: 'soon',
          message: `🏠 Aujourd'hui: ${chore.attributes.friendly_name}`
        });
      }
    }
  } catch (e: any) {
    console.error(`Grocy error: ${e.message}`);
  }
  
  return items;
}

// ==================== HEARTBEAT.md ====================

function getHeartbeatItems(): ActionableItem[] {
  if (!existsSync(HEARTBEAT_FILE)) return [];
  
  const content = readFileSync(HEARTBEAT_FILE, 'utf-8');
  const items: ActionableItem[] = [];
  
  // Parse markdown checklist items
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^- \[ \] (.+)$/);
    if (match) {
      items.push({
        source: 'HEARTBEAT.md',
        priority: 'soon',
        message: match[1]
      });
    }
  }
  
  return items;
}

// ==================== Main ====================

async function main() {
  const allItems: ActionableItem[] = [];
  
  // Google Tasks (both accounts)
  const jmudesTasks = await getGoogleTasks(ACCOUNTS.jmudes);
  const alejmurotTasks = await getGoogleTasks(ACCOUNTS.alejmurot);
  allItems.push(...jmudesTasks, ...alejmurotTasks);
  
  // Grocy
  const grocyItems = await getGrocyTasks();
  allItems.push(...grocyItems);
  
  // HEARTBEAT.md
  const heartbeatItems = getHeartbeatItems();
  allItems.push(...heartbeatItems);
  
  // Output
  if (allItems.length === 0) {
    writeFileSync(OUTPUT_FILE, 'HEARTBEAT_OK');
    console.log('HEARTBEAT_OK');
    return;
  }
  
  // Sort by priority
  const priorityOrder = { urgent: 0, soon: 1, info: 2 };
  allItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  const output = allItems.map(item => `[${item.source}] ${item.message}`).join('\n');
  writeFileSync(OUTPUT_FILE, output);
  console.log(output);
}

main().catch(console.error);
