/**
 * Show tasks from "Envie" list
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
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
    const listId = 'dk04RWxjaHNDZERtT2htNg'; // Envie list ID
    
    const data = await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
    );
    
    let result = '💭 Liste "Envie":\n';
    
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
    
    result += `\n\nTotal: ${data.items?.length || 0} tâche(s)`;
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
