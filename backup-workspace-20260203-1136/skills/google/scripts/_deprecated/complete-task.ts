#!/usr/bin/env node
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
}

function output(text: string) {
  writeFileSync(OUTPUT_FILE, text, 'utf-8');
  console.log(text);
}

async function getTokens(): Promise<Tokens> {
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
    
    const newTokens: any = await response.json();
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function completeTask(taskTitle: string) {
  const tokens = await getTokens();
  const headers = { 'Authorization': `Bearer ${tokens.access_token}` };
  
  // Get all task lists
  const listsResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', { headers });
  const listsData: any = await listsResponse.json();
  
  if (!listsData.items) {
    output('Aucune liste de tâches trouvée');
    return;
  }
  
  let found = false;
  
  // Search in all lists
  for (const list of listsData.items) {
    const tasksResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false&maxResults=100`,
      { headers }
    );
    const tasksData: any = await tasksResponse.json();
    
    if (!tasksData.items) continue;
    
    for (const task of tasksData.items) {
      if (task.title?.toLowerCase().includes(taskTitle.toLowerCase())) {
        // Mark as completed
        await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks/${task.id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          }
        );
        
        output(`✅ Tâche complétée : "${task.title}"\n   Liste : ${list.title}`);
        found = true;
      }
    }
  }
  
  if (!found) {
    output(`❌ Aucune tâche trouvée contenant : "${taskTitle}"`);
  }
}

async function main() {
  const taskTitle = process.argv[2];
  
  if (!taskTitle) {
    console.error('Usage: complete-task.ts "titre de la tâche"');
    process.exit(1);
  }
  
  await completeTask(taskTitle);
}

main().catch(console.error);
