/**
 * Add a single task to Google Tasks
 * Usage: pnpm tsx add-single-task.ts <account> <list_name> <title> [notes]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JULES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_AL = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text: string) {
  writeFileSync(OUTPUT_FILE, text);
}

async function getTokens(path: string) {
  if (!existsSync(path)) {
    throw new Error('Tokens not found.');
  }
  
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

async function apiRequest(tokens: any, url: string, options: any = {}) {
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

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      output('Usage: pnpm tsx add-single-task.ts <jmudes|alejmurot> <list_name> <title> [notes]');
      return;
    }
    
    const [account, listName, title, ...notesParts] = args;
    const notes = notesParts.join(' ');
    
    const tokenPath = account === 'jmudes' ? TOKEN_PATH_JULES : TOKEN_PATH_AL;
    const tokens = await getTokens(tokenPath);
    
    // Get all lists
    const listsData = await apiRequest(tokens, 'https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    
    // Find the list
    const targetList = listsData.items?.find((list: any) => 
      list.title.toLowerCase().includes(listName.toLowerCase())
    );
    
    if (!targetList) {
      output(`❌ Liste "${listName}" non trouvée.\nListes disponibles:\n${listsData.items?.map((l: any) => `  - ${l.title}`).join('\n')}`);
      return;
    }
    
    // Add the task
    const task = {
      title,
      ...(notes ? { notes } : {})
    };
    
    const data = await apiRequest(
      tokens,
      `https://tasks.googleapis.com/tasks/v1/lists/${targetList.id}/tasks`,
      { method: 'POST', body: JSON.stringify(task) }
    );
    
    if (data.error) {
      output(`❌ Erreur: ${data.error.message}`);
    } else {
      output(`✅ Tâche ajoutée à "${targetList.title}":\n${title}${notes ? `\n${notes}` : ''}`);
    }
    
  } catch (err: any) {
    output(`❌ Error: ${err.message}`);
  }
}

main();
