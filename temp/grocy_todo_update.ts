#!/usr/bin/env npx tsx
import { readFileSync } from 'fs';
import { join } from 'path';

const CLAUDE_HOME = 'C:\\Users\\jules\\repo\\claude-home';
const ENV_PATH = join(CLAUDE_HOME, '.env');

function loadEnv(): { apiUrl: string; apiToken: string } {
  const content = readFileSync(ENV_PATH, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    vars[key.trim()] = rest.join('=').trim();
  }
  return {
    apiUrl: vars.HA_API_URL || 'http://192.168.1.98:8123',
    apiToken: vars.HA_API_TOKEN || '',
  };
}

const { apiUrl, apiToken } = loadEnv();

// Try updating via todo.update_item
async function updateTodo(uid: string, status: string, due: string): Promise<void> {
  const url = `${apiUrl}/api/services/todo/update_item`;
  const body = {
    entity_id: 'todo.grocy_chores',
    item: uid,
    status: status,
    due_date: due
  };
  
  console.log(`Updating ${uid}...`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (response.ok) {
    console.log(`✓ Updated ${uid}`);
  } else {
    console.log(`✗ Error: ${response.status} - ${await response.text()}`);
  }
}

// Mark as completed
await updateTodo('2', 'completed', '2026-02-16'); // Draps - next due in 1 week
await updateTodo('4', 'completed', '2026-02-15'); // SDB - next due in 1 week
await updateTodo('5', 'completed', '2026-02-24'); // Rocky - next due in ~1 month
