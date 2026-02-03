/**
 * List all task lists for alejmurot account
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

async function getTokens(): Promise<Tokens> {
  const tokens: Tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
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
    
    const newTokens = await response.json() as any;
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

async function main(): Promise<void> {
  try {
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    
    let result = '📋 Toutes les listes (alejmurot@gmail.com):\n';
    
    for (const list of listsData.items || []) {
      result += `\n📝 ${list.title}`;
      
      // Get tasks for this list
      const tasksData = await apiRequest(
        `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false&showHidden=false`
      );
      
      const count = tasksData.items?.length || 0;
      result += ` (${count} tâches)`;
      
      // Show tasks
      if (tasksData.items && tasksData.items.length > 0) {
        for (const task of tasksData.items) {
          result += `\n  • ${task.title}`;
          if (task.due) {
            const dueDate = new Date(task.due);
            result += ` - ${dueDate.toLocaleDateString('fr-FR')}`;
          }
        }
      }
      result += '\n';
    }
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
