#!/usr/bin/env npx tsx
/**
 * Home Assistant API Helper for Clawdbot
 * Usage: pnpm tsx skills/homeassistant/scripts/ha.ts <command> [options]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Fix: Use absolute path to repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../../..');

// Config
const CLAUDE_HOME = 'C:\\Users\\jules\\repo\\claude-home';
const ENV_PATH = join(CLAUDE_HOME, '.env');
const OUTPUT_FILE = join(REPO_ROOT, 'ha-output.txt');

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

// Output helper - writes to file since console.log doesn't work well on Windows
function output(text: string, append = true): void {
  if (append) {
    writeFileSync(OUTPUT_FILE, text + '\n', { flag: 'a' });
  } else {
    writeFileSync(OUTPUT_FILE, text + '\n');
  }
}

async function apiRequest(endpoint: string, method = 'GET', data?: unknown): Promise<unknown> {
  const url = `${apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { 
    method, 
    headers,
    signal: AbortSignal.timeout(15000)
  };
  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

// Commands
async function getStates(): Promise<void> {
  const states = await apiRequest('/api/states') as EntityState[];
  output(JSON.stringify(states, null, 2), false);
}

async function getEntity(entityId: string): Promise<void> {
  const state = await apiRequest(`/api/states/${entityId}`);
  output(JSON.stringify(state, null, 2), false);
}

async function searchEntities(options: { domain?: string; pattern?: string; state?: string }): Promise<void> {
  const states = await apiRequest('/api/states') as EntityState[];
  
  let filtered = states;
  
  if (options.domain) {
    filtered = filtered.filter(e => e.entity_id.startsWith(`${options.domain}.`));
  }
  
  if (options.pattern) {
    const regex = new RegExp(options.pattern, 'i');
    filtered = filtered.filter(e => 
      regex.test(e.entity_id) || 
      regex.test(String(e.attributes.friendly_name || ''))
    );
  }
  
  if (options.state) {
    filtered = filtered.filter(e => e.state.toLowerCase() === options.state!.toLowerCase());
  }
  
  // Compact output for readability
  output(`Found ${filtered.length} entities:`, false);
  for (const e of filtered) {
    const name = e.attributes.friendly_name || e.entity_id;
    output(`  ${e.entity_id} = ${e.state} (${name})`);
  }
}

async function callService(domain: string, service: string, data?: Record<string, unknown>): Promise<void> {
  const result = await apiRequest(`/api/services/${domain}/${service}`, 'POST', data || {});
  output(JSON.stringify(result, null, 2), false);
}

async function turnOn(entityId: string, options?: Record<string, unknown>): Promise<void> {
  const domain = entityId.split('.')[0];
  await callService(domain, 'turn_on', { entity_id: entityId, ...options });
  output(`✓ Turned on ${entityId}`, false);
}

async function turnOff(entityId: string): Promise<void> {
  const domain = entityId.split('.')[0];
  await callService(domain, 'turn_off', { entity_id: entityId });
  output(`✓ Turned off ${entityId}`, false);
}

async function setLightColor(entityId: string, color: string): Promise<void> {
  const colorMap: Record<string, [number, number, number]> = {
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    white: [255, 255, 255],
    yellow: [255, 255, 0],
    orange: [255, 165, 0],
    purple: [128, 0, 128],
    pink: [255, 192, 203],
    cyan: [0, 255, 255],
    warm: [255, 180, 107],
    cool: [200, 200, 255],
  };
  
  const rgb = colorMap[color.toLowerCase()];
  if (!rgb) {
    throw new Error(`Unknown color: ${color}. Available: ${Object.keys(colorMap).join(', ')}`);
  }
  
  await callService('light', 'turn_on', { 
    entity_id: entityId, 
    rgb_color: rgb 
  });
  output(`✓ Set ${entityId} to ${color}`, false);
}

async function setBrightness(entityId: string, brightness: number): Promise<void> {
  const pct = Math.min(100, Math.max(0, brightness));
  const value = Math.round((pct / 100) * 255);
  await callService('light', 'turn_on', { 
    entity_id: entityId, 
    brightness: value 
  });
  output(`✓ Set ${entityId} brightness to ${pct}%`, false);
}

async function listAreas(): Promise<void> {
  const result = await apiRequest('/api/template', 'POST', {
    template: '{{ areas() | list }}'
  }) as string;
  const areaIds = JSON.parse(result);
  
  output('Areas:', false);
  for (const areaId of areaIds) {
    const nameResult = await apiRequest('/api/template', 'POST', {
      template: `{{ area_name('${areaId}') }}`
    }) as string;
    output(`  ${areaId}: ${nameResult}`);
  }
}

async function getEntitiesInArea(areaName: string): Promise<void> {
  const result = await apiRequest('/api/template', 'POST', {
    template: `{{ area_entities('${areaName}') | list }}`
  }) as string;
  const entityIds = JSON.parse(result);
  
  const states = await apiRequest('/api/states') as EntityState[];
  const filtered = states.filter(s => entityIds.includes(s.entity_id));
  
  output(`Entities in "${areaName}":`, false);
  for (const e of filtered) {
    const name = e.attributes.friendly_name || e.entity_id;
    output(`  ${e.entity_id} = ${e.state} (${name})`);
  }
}

// CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'states':
        await getStates();
        break;
        
      case 'entity':
        if (!args[1]) throw new Error('Usage: entity <entity_id>');
        await getEntity(args[1]);
        break;
        
      case 'search': {
        const searchOpts: { domain?: string; pattern?: string; state?: string } = {};
        for (let i = 1; i < args.length; i += 2) {
          if (args[i] === '--domain') searchOpts.domain = args[i + 1];
          if (args[i] === '--pattern') searchOpts.pattern = args[i + 1];
          if (args[i] === '--state') searchOpts.state = args[i + 1];
        }
        await searchEntities(searchOpts);
        break;
      }
        
      case 'service': {
        if (!args[1] || !args[2]) throw new Error('Usage: service <domain> <service> [--data JSON]');
        let serviceData: Record<string, unknown> | undefined;
        const dataIdx = args.indexOf('--data');
        if (dataIdx !== -1 && args[dataIdx + 1]) {
          serviceData = JSON.parse(args[dataIdx + 1]);
        }
        await callService(args[1], args[2], serviceData);
        break;
      }
        
      case 'on':
        if (!args[1]) throw new Error('Usage: on <entity_id>');
        await turnOn(args[1]);
        break;
        
      case 'off':
        if (!args[1]) throw new Error('Usage: off <entity_id>');
        await turnOff(args[1]);
        break;
        
      case 'color':
        if (!args[1] || !args[2]) throw new Error('Usage: color <entity_id> <color>');
        await setLightColor(args[1], args[2]);
        break;
        
      case 'brightness':
        if (!args[1] || !args[2]) throw new Error('Usage: brightness <entity_id> <0-100>');
        await setBrightness(args[1], parseInt(args[2]));
        break;
        
      case 'areas':
        await listAreas();
        break;
        
      case 'area-entities':
        if (!args[1]) throw new Error('Usage: area-entities <area_name>');
        await getEntitiesInArea(args[1]);
        break;
        
      default:
        output(`Home Assistant CLI

Commands:
  states                          Get all entity states
  entity <entity_id>              Get specific entity state
  search --domain X --pattern Y   Search entities
  service <domain> <service>      Call a service
  on <entity_id>                  Turn on entity
  off <entity_id>                 Turn off entity
  color <entity_id> <color>       Set light color
  brightness <entity_id> <0-100>  Set light brightness
  areas                           List all areas
  area-entities <area>            Get entities in area

Colors: red, green, blue, white, yellow, orange, purple, pink, cyan, warm, cool
`, false);
    }
  } catch (error) {
    output(`Error: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }
}

main();
