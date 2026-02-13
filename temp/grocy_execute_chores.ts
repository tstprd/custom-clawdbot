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

async function executeChore(choreId: number, date: string): Promise<void> {
  const url = `${apiUrl}/api/services/grocy/execute_chore`;
  const body = {
    chore_id: choreId,
    tracked_time: date,
    done_by: 1
  };
  console.log(`Calling with: ${JSON.stringify(body)}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const text = await response.text();
  if (response.ok) {
    console.log(`✓ Chore ${choreId} marked as done on ${date}`);
  } else {
    console.log(`✗ Error for chore ${choreId}: ${response.status} - ${text}`);
  }
}

// Draps (ID 2) - fait le 9 fév
await executeChore(2, '2026-02-09T12:00:00');

// SDB (ID 4) - fait le 8 fév
await executeChore(4, '2026-02-08T12:00:00');

// Rocky (ID 5) - fait le 24 jan
await executeChore(5, '2026-01-24T12:00:00');

console.log('\nDone!');
