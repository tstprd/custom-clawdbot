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

// Call the weather.get_forecasts service with return_response
async function getHourlyForecast(entityId: string): Promise<void> {
  const url = `${apiUrl}/api/services/weather/get_forecasts?return_response`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entity_id: entityId,
      type: 'hourly'
    })
  });
  
  console.log(`=== ${entityId} ===`);
  console.log(`Status: ${response.status}`);
  
  const result = await response.text();
  console.log(result.substring(0, 2000));
}

await getHourlyForecast('weather.forecast_home_rennes_2');
