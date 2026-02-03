#!/usr/bin/env npx tsx
/**
 * Get weather from Home Assistant
 * Usage: pnpm tsx get-weather.ts [entity_id]
 * Default: weather.forecast_home_rennes_2
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from claude-home
config({ path: resolve("C:\\Users\\jules\\repo\\claude-home\\.env") });

const HA_URL = process.env.HA_API_URL || "http://homeassistant.local:8123";
const HA_TOKEN = process.env.HA_API_TOKEN;

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windBearing: number;
  pressure: number;
  uvIndex: number;
  cloudCoverage: number;
  formatted: string;
}

const CONDITIONS: Record<string, string> = {
  "clear-night": "🌙 Nuit claire",
  "cloudy": "☁️ Nuageux",
  "exceptional": "⚠️ Exceptionnel",
  "fog": "🌫️ Brouillard",
  "hail": "🧊 Grêle",
  "lightning": "⚡ Orage",
  "lightning-rainy": "⛈️ Orage pluvieux",
  "partlycloudy": "⛅ Partiellement nuageux",
  "pouring": "🌧️ Fortes pluies",
  "rainy": "🌧️ Pluie",
  "snowy": "❄️ Neige",
  "snowy-rainy": "🌨️ Neige et pluie",
  "sunny": "☀️ Ensoleillé",
  "windy": "💨 Venteux",
  "windy-variant": "💨 Venteux variable",
};

async function getWeather(entityId: string = "weather.forecast_home_rennes_2"): Promise<WeatherData> {
  if (!HA_TOKEN) {
    throw new Error("HA_API_TOKEN not set");
  }

  const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.status}`);
  }

  const data = await response.json();
  const attrs = data.attributes;

  const condition = CONDITIONS[data.state] || data.state;
  const temp = Math.round(attrs.temperature);
  const humidity = attrs.humidity;
  const windSpeed = Math.round(attrs.wind_speed);

  const formatted = `${condition} ${temp}°C | 💧 ${humidity}% | 💨 ${windSpeed} km/h`;

  return {
    condition: data.state,
    temperature: attrs.temperature,
    humidity: attrs.humidity,
    windSpeed: attrs.wind_speed,
    windBearing: attrs.wind_bearing,
    pressure: attrs.pressure,
    uvIndex: attrs.uv_index,
    cloudCoverage: attrs.cloud_coverage,
    formatted,
  };
}

// CLI
const entityId = process.argv[2] || "weather.forecast_home_rennes_2";

getWeather(entityId)
  .then((weather) => {
    if (process.argv.includes("--json")) {
      console.log(JSON.stringify(weather, null, 2));
    } else {
      console.log(weather.formatted);
    }
  })
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
