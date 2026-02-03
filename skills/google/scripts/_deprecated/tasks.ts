/**
 * Google Tasks Skill for Clawdbot
 * Usage: pnpm tsx skills/google/scripts/tasks.ts <command> [args]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text);
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

async function getTokens(): Promise<Tokens> {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found. Run google-auth.mjs first.');
  }
  
  const tokens: Tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
  // Refresh if expired
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
    if (newTokens.error) {
      throw new Error(`Token refresh failed: ${newTokens.error}`);
    }
    
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const tokens = await getTokens();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

// ============ TASKS ============

async function listTaskLists(): Promise<void> {
  const data = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = '📝 Listes de tâches:\n';
  
  for (const list of data.items || []) {
    result += `\n• ${list.title} (ID: ${list.id})`;
  }
  
  output(result);
}

async function listTasks(listId?: string): Promise<void> {
  // If no listId provided, get default list
  if (!listId) {
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    if (listsData.error) {
      output(`Error: ${listsData.error.message}`);
      return;
    }
    listId = listsData.items?.[0]?.id;
    if (!listId) {
      output('Aucune liste de tâches trouvée.');
      return;
    }
  }
  
  const data = await apiRequest(
    `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = '✅ Tâches en cours:\n';
  
  if (!data.items || data.items.length === 0) {
    result += '\n✨ Aucune tâche !';
  } else {
    for (const task of data.items) {
      result += `\n• ${task.title}`;
      if (task.notes) result += `\n  📝 ${task.notes}`;
      if (task.due) {
        const dueDate = new Date(task.due);
        result += `\n  ⏰ ${dueDate.toLocaleDateString('fr-FR')}`;
      }
    }
  }
  
  output(result);
}

async function addTask(title: string, notes?: string, due?: string, listId?: string): Promise<void> {
  // If no listId provided, get default list
  if (!listId) {
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    if (listsData.error) {
      output(`Error: ${listsData.error.message}`);
      return;
    }
    listId = listsData.items?.[0]?.id;
    if (!listId) {
      output('Aucune liste de tâches trouvée.');
      return;
    }
  }
  
  const task: any = { title };
  if (notes) task.notes = notes;
  if (due) task.due = new Date(due).toISOString();
  
  const data = await apiRequest(
    `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
    { method: 'POST', body: JSON.stringify(task) }
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  output(`✅ Tâche créée: ${title}`);
}

async function completeTask(taskId: string, listId?: string): Promise<void> {
  // If no listId provided, get default list
  if (!listId) {
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    if (listsData.error) {
      output(`Error: ${listsData.error.message}`);
      return;
    }
    listId = listsData.items?.[0]?.id;
  }
  
  const task = { status: 'completed' };
  
  const data = await apiRequest(
    `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
    { method: 'PATCH', body: JSON.stringify(task) }
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  output(`✅ Tâche complétée!`);
}

// ============ CLI ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'lists':
        await listTaskLists();
        break;
        
      case 'list':
      case 'tasks':
        await listTasks(args[1]);
        break;
        
      case 'add':
        if (!args[1]) throw new Error('Usage: add "titre" [notes] [due_date]');
        await addTask(args[1], args[2], args[3]);
        break;
        
      case 'complete':
        if (!args[1]) throw new Error('Usage: complete <taskId> [listId]');
        await completeTask(args[1], args[2]);
        break;
        
      default:
        output(`Google Tasks

Commands:
  lists                           Liste toutes les listes de tâches
  list [listId]                   Liste les tâches (défaut: liste principale)
  add "titre" [notes] [date]      Créer une tâche
  complete <taskId> [listId]      Marquer une tâche comme complétée

Exemples:
  pnpm tsx tasks.ts lists
  pnpm tsx tasks.ts list
  pnpm tsx tasks.ts add "Acheter du pain"
  pnpm tsx tasks.ts add "Réunion" "Préparer slides" "2026-01-15"
`);
    }
  } catch (err) {
    output(`Error: ${err instanceof Error ? err.message : err}`);
  }
}

main();
