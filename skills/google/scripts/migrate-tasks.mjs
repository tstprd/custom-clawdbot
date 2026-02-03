/**
 * Migrate tasks from alejmurot to jmudes account
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_ALEJMUROT = join(process.cwd(), '.clawdbot-google-tokens.json');
const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text) {
  writeFileSync(OUTPUT_FILE, text);
}

async function getTokens(tokenPath) {
  if (!existsSync(tokenPath)) {
    throw new Error(`Tokens not found at ${tokenPath}`);
  }
  
  const tokens = JSON.parse(readFileSync(tokenPath, 'utf-8'));
  
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
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(url, tokenPath, options = {}) {
  const tokens = await getTokens(tokenPath);
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
    let result = '📋 Migration des tâches:\n';
    
    // Get list from alejmurot account
    result += '\n📥 Lecture compte alejmurot...';
    const alejmurotLists = await apiRequest(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      TOKEN_PATH_ALEJMUROT
    );
    const alejmurotListId = alejmurotLists.items?.[0]?.id;
    
    // Get tasks from alejmurot
    const alejmurotTasks = await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${alejmurotListId}/tasks?showCompleted=false&showHidden=false`,
      TOKEN_PATH_ALEJMUROT
    );
    
    // Get list from jmudes account
    result += '\n📥 Lecture compte jmudes...';
    const jmudesLists = await apiRequest(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      TOKEN_PATH_JMUDES
    );
    const jmudesListId = jmudesLists.items?.[0]?.id;
    
    // Tasks to migrate (added recently)
    const tasksToMigrate = [
      'Massage cadeau Valentin',
      'Répondre Anticor (Datalab)',
      'Devis claustra Mabilais',
      'Sauna Aqua tonic'
    ];
    
    result += '\n\n✅ Ajout dans jmudes76000@gmail.com:';
    
    for (const task of alejmurotTasks.items || []) {
      if (tasksToMigrate.includes(task.title)) {
        // Add to jmudes
        const newTask = {
          title: task.title,
          notes: task.notes,
          due: task.due
        };
        
        await apiRequest(
          `https://tasks.googleapis.com/tasks/v1/lists/${jmudesListId}/tasks`,
          TOKEN_PATH_JMUDES,
          { method: 'POST', body: JSON.stringify(newTask) }
        );
        
        result += `\n  ✅ ${task.title}`;
        
        // Delete from alejmurot
        await apiRequest(
          `https://tasks.googleapis.com/tasks/v1/lists/${alejmurotListId}/tasks/${task.id}`,
          TOKEN_PATH_ALEJMUROT,
          { method: 'DELETE' }
        );
      }
    }
    
    result += '\n\n🗑️ Supprimées d\'alejmurot@gmail.com';
    result += '\n\n✨ Migration terminée !';
    
    output(result);
    
  } catch (err) {
    output(`Error: ${err.message}`);
  }
}

main();
