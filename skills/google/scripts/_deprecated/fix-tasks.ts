/**
 * Fix duplicate tasks manually
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
    // Get list
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    const listId = listsData.items?.[0]?.id;
    
    // Get tasks
    const data = await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
    );
    
    const tasks = data.items || [];
    let result = '🧹 Nettoyage:\n';
    
    // Find duplicates by title
    const seen = new Map<string, string>(); // title -> first ID
    const toDelete: string[] = [];
    let mabailisId: string | null = null;
    
    for (const task of tasks) {
      if (seen.has(task.title)) {
        // Duplicate - mark for deletion
        toDelete.push(task.id);
        result += `\n🗑️ Doublon: ${task.title}`;
      } else {
        seen.set(task.title, task.id);
        if (task.title === 'Devis claustra Mabilais') {
          mabailisId = task.id;
        }
      }
    }
    
    // Delete duplicates
    for (const taskId of toDelete) {
      await apiRequest(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
        { method: 'DELETE' }
      );
    }
    
    result += `\n\n✅ ${toDelete.length} doublons supprimés`;
    
    // Update Mabilais task
    if (mabailisId) {
      const vendredi = '2026-01-10T23:59:59.000Z';
      const updatedTask = {
        title: 'Devis claustra Mabilais',
        notes: 'Parler à Anne-Laure vendredi pour valider ensemble',
        due: vendredi
      };
      
      await apiRequest(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${mabailisId}`,
        { method: 'PATCH', body: JSON.stringify(updatedTask) }
      );
      
      result += '\n✏️ Tâche Mabilais mise à jour (vendredi 10 janvier)';
    }
    
    result += '\n\n✨ Terminé!';
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
