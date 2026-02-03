/**
 * Google Tasks for jmudes account
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
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
    throw new Error('Tokens not found.');
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

async function listTasks(): Promise<void> {
  const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
  const listId = listsData.items?.[0]?.id;
  
  const data = await apiRequest(
    `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
  );
  
  let result = '✅ Tâches jmudes76000@gmail.com:\n';
  
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

async function addTask(title: string, notes?: string, due?: string): Promise<void> {
  const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
  const listId = listsData.items?.[0]?.id;
  
  const task: any = { title };
  if (notes) task.notes = notes;
  if (due) task.due = due;
  
  await apiRequest(
    `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
    { method: 'POST', body: JSON.stringify(task) }
  );
  
  output(`✅ Tâche créée: ${title}`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  
  try {
    if (command === 'add') {
      const tasksToAdd = [
        {
          title: 'Massage cadeau Valentin',
          notes: 'À réserver avant mai 2026',
          due: '2026-04-30T23:59:59.000Z'
        },
        {
          title: 'Répondre Anticor (Datalab)',
          notes: 'Projet en attente de réponse'
        },
        {
          title: 'Devis claustra Mabilais',
          notes: 'Relancer pour le claustra côté gauche'
        },
        {
          title: 'Sauna Aqua tonic',
          notes: 'Habitude midi en semaine - Y aller régulièrement'
        }
      ];
      
      for (const task of tasksToAdd) {
        await addTask(task.title, task.notes, task.due);
      }
      
      output('✅ 4 tâches ajoutées dans jmudes76000@gmail.com');
    } else {
      await listTasks();
    }
  } catch (err) {
    output(`Error: ${err instanceof Error ? err.message : err}`);
  }
}

main();
