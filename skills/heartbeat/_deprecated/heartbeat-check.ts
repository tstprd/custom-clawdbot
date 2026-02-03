/**
 * Heartbeat pre-filter script
 * Aggregates tasks from Google Tasks, Grocy, and markdown files
 * Only outputs actionable items to save tokens
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_ALEJMUROT = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const HEARTBEAT_FILE = join(process.cwd(), 'HEARTBEAT.md');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

const HA_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
const HA_TOKEN = process.env.HA_TOKEN;

interface ActionableItem {
  source: string;
  priority: 'urgent' | 'soon' | 'info';
  message: string;
}

// ==================== Google Tasks ====================

async function getTokens(path: string): Promise<any> {
  const tokens = JSON.parse(readFileSync(path, 'utf-8'));
  
  if (Date.now() > tokens.expiry_date - 60000) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    const newTokens = await response.json();
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(path, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(tokens: any, url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

async function checkGoogleTasks(tokenPath: string, accountName: string): Promise<ActionableItem[]> {
  const items: ActionableItem[] = [];
  const tokens = await getTokens(tokenPath);
  
  // Get all task lists
  const listsData = await apiRequest(tokens, 'https://tasks.googleapis.com/tasks/v1/users/@me/lists');
  
  if (!listsData.items) return items;
  
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  for (const list of listsData.items) {
    const tasksData = await apiRequest(
      tokens,
      `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false`
    );
    
    if (!tasksData.items) continue;
    
    for (const task of tasksData.items) {
      if (!task.due) continue;
      
      const dueDate = new Date(task.due);
      
      // Overdue
      if (dueDate < now) {
        items.push({
          source: `Google Tasks (${accountName})`,
          priority: 'urgent',
          message: `⚠️ RETARD: "${task.title}" (${list.title}) - Échéance: ${dueDate.toLocaleDateString('fr-FR')}`
        });
      }
      // Due within 3 days
      else if (dueDate <= threeDaysFromNow) {
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        items.push({
          source: `Google Tasks (${accountName})`,
          priority: 'soon',
          message: `⏰ Bientôt: "${task.title}" (${list.title}) - Dans ${daysLeft} jour(s)`
        });
      }
    }
  }
  
  return items;
}

// ==================== Grocy (Home Assistant) ====================

async function checkGrocy(): Promise<ActionableItem[]> {
  const items: ActionableItem[] = [];
  
  if (!HA_TOKEN) {
    return items; // Skip if no HA token configured
  }
  
  try {
    // Get Grocy chores
    const response = await fetch(`${HA_URL}/api/services/grocy/get_chores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return items;
    
    const data = await response.json();
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    for (const chore of data.chores || []) {
      if (!chore.next_execution_time) continue;
      
      const nextExecution = new Date(chore.next_execution_time);
      
      // Overdue
      if (nextExecution < now) {
        items.push({
          source: 'Grocy',
          priority: 'urgent',
          message: `🧹 RETARD: "${chore.name}" - En retard de ${Math.ceil((now.getTime() - nextExecution.getTime()) / (24 * 60 * 60 * 1000))} jour(s)`
        });
      }
      // Due within 2 days
      else if (nextExecution <= twoDaysFromNow) {
        const daysLeft = Math.ceil((nextExecution.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        items.push({
          source: 'Grocy',
          priority: 'soon',
          message: `🧹 Bientôt: "${chore.name}" - Dans ${daysLeft} jour(s)`
        });
      }
    }
  } catch (error) {
    // Silently fail if Grocy unavailable
  }
  
  return items;
}

// ==================== Markdown Files ====================

function checkHeartbeatMd(): ActionableItem[] {
  const items: ActionableItem[] = [];
  
  try {
    const content = readFileSync(HEARTBEAT_FILE, 'utf-8').trim();
    
    // Check if file has content beyond the header/instructions
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('#') && 
             !trimmed.toLowerCase().includes('keep this file empty') &&
             !trimmed.toLowerCase().includes('keep it small');
    });
    
    if (lines.length > 0) {
      items.push({
        source: 'HEARTBEAT.md',
        priority: 'info',
        message: `📝 HEARTBEAT.md contient des notes:\n${lines.join('\n')}`
      });
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
  
  return items;
}

// ==================== Main ====================

async function main(): Promise<void> {
  try {
    const allItems: ActionableItem[] = [];
    
    // Aggregate from all sources
    allItems.push(...await checkGoogleTasks(TOKEN_PATH_JMUDES, 'jmudes76000'));
    allItems.push(...await checkGoogleTasks(TOKEN_PATH_ALEJMUROT, 'alejmurot'));
    allItems.push(...await checkGrocy());
    allItems.push(...checkHeartbeatMd());
    
    // If nothing actionable, output HEARTBEAT_OK
    if (allItems.length === 0) {
      writeFileSync(OUTPUT_FILE, 'HEARTBEAT_OK');
      console.log('HEARTBEAT_OK');
      return;
    }
    
    // Sort by priority
    const priorityOrder = { urgent: 0, soon: 1, info: 2 };
    allItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Format output
    let output = '🔔 Items nécessitant attention:\n\n';
    
    const urgent = allItems.filter(i => i.priority === 'urgent');
    const soon = allItems.filter(i => i.priority === 'soon');
    const info = allItems.filter(i => i.priority === 'info');
    
    if (urgent.length > 0) {
      output += '🚨 URGENT:\n';
      for (const item of urgent) {
        output += `${item.message}\n`;
      }
      output += '\n';
    }
    
    if (soon.length > 0) {
      output += '⏰ PROCHAINEMENT:\n';
      for (const item of soon) {
        output += `${item.message}\n`;
      }
      output += '\n';
    }
    
    if (info.length > 0) {
      output += '📌 INFO:\n';
      for (const item of info) {
        output += `${item.message}\n`;
      }
    }
    
    writeFileSync(OUTPUT_FILE, output.trim());
    console.log(output.trim());
    
  } catch (error) {
    const errorMsg = `❌ Erreur heartbeat check: ${error instanceof Error ? error.message : String(error)}`;
    writeFileSync(OUTPUT_FILE, errorMsg);
    console.error(errorMsg);
  }
}

main();
