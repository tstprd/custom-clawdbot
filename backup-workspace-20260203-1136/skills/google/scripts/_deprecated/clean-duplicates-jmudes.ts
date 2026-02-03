/**
 * Clean duplicate tasks and update claustra task
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
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
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found.');
  }
  
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
    const listId = listsData.items?.[0]?.id;
    
    const data = await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
    );
    
    let result = '🧹 Nettoyage des doublons:\n';
    
    // Group tasks by title
    const tasksByTitle = new Map<string, any[]>();
    for (const task of data.items || []) {
      if (!tasksByTitle.has(task.title)) {
        tasksByTitle.set(task.title, []);
      }
      tasksByTitle.get(task.title)!.push(task);
    }
    
    // Remove duplicates (keep first occurrence)
    for (const [title, tasks] of tasksByTitle.entries()) {
      if (tasks.length > 1) {
        result += `\n📝 ${title}: ${tasks.length} doublons trouvés`;
        
        // Keep first, delete others
        for (let i = 1; i < tasks.length; i++) {
          await apiRequest(
            `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${tasks[i].id}`,
            { method: 'DELETE' }
          );
          result += `\n  🗑️ Doublon supprimé`;
        }
        
        // Update Mabilais task
        if (title === 'Devis claustra Mabilais') {
          const vendredi = new Date('2026-01-10T23:59:59.000Z');
          const updatedTask = {
            title: 'Devis claustra Mabilais',
            notes: 'Parler à Anne-Laure vendredi pour valider ensemble',
            due: vendredi.toISOString()
          };
          
          await apiRequest(
            `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${tasks[0].id}`,
            { method: 'PATCH', body: JSON.stringify(updatedTask) }
          );
          result += `\n  ✏️ Mise à jour: échéance vendredi 10 janvier`;
        }
      }
    }
    
    result += '\n\n✨ Nettoyage terminé!';
    writeFileSync(OUTPUT_FILE, result);
    
  } catch (err) {
    writeFileSync(OUTPUT_FILE, `Error: ${err instanceof Error ? err.message : err}`);
  }
}

main();
