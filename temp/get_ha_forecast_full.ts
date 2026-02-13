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

interface ForecastEntry {
  datetime: string;
  condition: string;
  temperature: number;
  precipitation: number;
  wind_speed: number;
  humidity: number;
}

async function getHourlyForecast(entityId: string): Promise<ForecastEntry[]> {
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
  
  if (!response.ok) {
    console.error(`Error for ${entityId}: ${response.status}`);
    return [];
  }
  
  const result = await response.json();
  return result.service_response?.[entityId]?.forecast || [];
}

const cities = [
  { id: 'weather.forecast_home_rennes_2', name: 'Rennes' },
  { id: 'weather.forecast_paris', name: 'Paris' },
  { id: 'weather.forecast_lille', name: 'Lille' }
];

for (const city of cities) {
  const forecast = await getHourlyForecast(city.id);
  
  console.log(`\n=== ${city.name} (12 prochaines heures) ===`);
  
  // Get next 12 hours
  const next12 = forecast.slice(0, 12);
  
  for (const entry of next12) {
    const dt = new Date(entry.datetime);
    const hour = dt.getHours().toString().padStart(2, '0');
    const precip = entry.precipitation > 0 ? `${entry.precipitation}mm 🌧` : '';
    console.log(`${hour}h: ${entry.temperature}° ${entry.condition} ${precip}`);
  }
}
