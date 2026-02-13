#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from 'fs';
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

// Use websocket to call weather.get_forecasts action
async function getHourlyForecast(entityId: string): Promise<void> {
  // Try using the template API to access forecast
  const url = `${apiUrl}/api/template`;
  
  const template = `
{% set forecast = state_attr('${entityId}', 'forecast') %}
{% if forecast %}
{{ forecast | tojson }}
{% else %}
NO_FORECAST_ATTR
{% endif %}
`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template })
  });
  
  if (!response.ok) {
    console.error(`API error ${response.status}: ${response.statusText}`);
    return;
  }
  
  const result = await response.text();
  console.log(`=== ${entityId} ===`);
  console.log(result);
}

// Try all 3 cities
const cities = [
  'weather.forecast_home_rennes_2',
  'weather.forecast_paris',
  'weather.forecast_lille'
];

for (const city of cities) {
  await getHourlyForecast(city);
}
