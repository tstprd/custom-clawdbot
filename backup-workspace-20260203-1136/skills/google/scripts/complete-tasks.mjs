/**
 * Complete multiple tasks by index
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text) {
  writeFileSync(OUTPUT_FILE, text);
}

async function getTokens() {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found.');
  }
  
  const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
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

async function apiRequest(url, options = {}) {
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

async function main() {
  try {
    // Get default list
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
    const listId = listsData.items?.[0]?.id;
    
    // Get all tasks
    const data = await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false&showHidden=false`
    );
    
    const tasks = data.items || [];
    
    // Get indices from command line (e.g., 2,3,4)
    const indices = process.argv.slice(2).map(i => parseInt(i) - 1);
    
    let result = '✅ Marquage des tâches comme complétées:\n';
    
    for (const index of indices) {
      if (index < 0 || index >= tasks.length) {
        result += `\n❌ Index ${index + 1} invalide`;
        continue;
      }
      
      const task = tasks[index];
      
      // Mark as completed
      await apiRequest(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${task.id}`,
        { 
          method: 'PATCH', 
          body: JSON.stringify({ status: 'completed' }) 
        }
      );
      
      result += `\n✅ ${task.title}`;
    }
    
    output(result);
    
  } catch (err) {
    output(`Error: ${err.message}`);
  }
}

main();
