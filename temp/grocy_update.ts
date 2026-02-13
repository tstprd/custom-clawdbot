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

// List available services for grocy
async function listGrocyServices(): Promise<void> {
  const url = `${apiUrl}/api/services`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  
  const services = await response.json();
  const grocyServices = services.filter((s: any) => s.domain === 'grocy');
  
  console.log('Grocy services:');
  for (const svc of grocyServices) {
    console.log(`  ${svc.domain}.${Object.keys(svc.services).join(', ')}`);
    for (const [name, info] of Object.entries(svc.services)) {
      console.log(`    - ${name}: ${(info as any).description || ''}`);
    }
  }
}

// Also check todo services
async function listTodoServices(): Promise<void> {
  const url = `${apiUrl}/api/services`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  
  const services = await response.json();
  const todoServices = services.filter((s: any) => s.domain === 'todo');
  
  console.log('\nTodo services:');
  for (const svc of todoServices) {
    for (const [name, info] of Object.entries(svc.services)) {
      console.log(`  - todo.${name}`);
    }
  }
}

await listGrocyServices();
await listTodoServices();
