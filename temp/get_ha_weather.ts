#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const CLAUDE_HOME = 'C:\\Users\\jules\\repo\\claude-home';
const ENV_PATH = join(CLAUDE_HOME, '.env');

function loadEnv(): { apiUrl: string; apiToken: string } {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`Missing .env file at ${ENV_PATH}`);
  }
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

async function getEntityState(entityId: string): Promise<void> {
  const url = `${apiUrl}/api/states/${entityId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
}

// Check all 3 weather entities
const cities = [
  'weather.forecast_home_rennes_2',
  'weather.forecast_paris', 
  'weather.forecast_lille'
];

for (const city of cities) {
  console.log(`\n=== ${city} ===`);
  await getEntityState(city);
}
