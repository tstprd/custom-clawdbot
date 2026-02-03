#!/usr/bin/env bun
/**
 * Weather fetcher using wttr.in API
 * Usage: pnpm tsx get-weather.ts [city]
 * Default city: Rennes
 */

const city = process.argv[2] || "Rennes";

interface WttrData {
  current_condition: Array<{
    temp_C: string;
    FeelsLikeC: string;
    humidity: string;
    windspeedKmph: string;
    weatherDesc: Array<{ value: string }>;
    uvIndex: string;
  }>;
  weather: Array<{
    date: string;
    maxtempC: string;
    mintempC: string;
    hourly: Array<{
      time: string;
      tempC: string;
      chanceofrain: string;
      weatherDesc: Array<{ value: string }>;
    }>;
  }>;
}

async function getWeather(city: string): Promise<string> {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "fr" }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: WttrData = await response.json();
    const current = data.current_condition[0];
    const today = data.weather[0];
    
    // Current conditions
    const temp = current.temp_C;
    const feelsLike = current.FeelsLikeC;
    const humidity = current.humidity;
    const wind = current.windspeedKmph;
    const desc = current.weatherDesc[0]?.value || "?";
    const uv = current.uvIndex;
    
    // Today's forecast
    const maxTemp = today.maxtempC;
    const minTemp = today.mintempC;
    
    // Rain probability from hourly data
    const nextHours = today.hourly.slice(0, 4);
    const maxRainChance = Math.max(...nextHours.map(h => parseInt(h.chanceofrain) || 0));
    
    // Weather emoji based on description
    const descLower = desc.toLowerCase();
    let emoji = "🌤️";
    if (descLower.includes("rain") || descLower.includes("pluie")) emoji = "🌧️";
    else if (descLower.includes("cloud") || descLower.includes("nuag")) emoji = "⛅";
    else if (descLower.includes("sun") || descLower.includes("soleil") || descLower.includes("clear")) emoji = "☀️";
    else if (descLower.includes("snow") || descLower.includes("neige")) emoji = "❄️";
    else if (descLower.includes("thunder") || descLower.includes("orage")) emoji = "⛈️";
    else if (descLower.includes("fog") || descLower.includes("brouillard")) emoji = "🌫️";
    
    let output = `${emoji} ${desc} ${temp}°C`;
    
    if (parseInt(feelsLike) !== parseInt(temp)) {
      output += ` (ressenti ${feelsLike}°C)`;
    }
    
    output += `\n💧 Humidité ${humidity}% | 💨 Vent ${wind} km/h`;
    
    if (parseInt(uv) >= 5) {
      output += ` | ☀️ UV ${uv}`;
    }
    
    output += `\n📊 Min ${minTemp}°C → Max ${maxTemp}°C`;
    
    if (maxRainChance > 30) {
      output += `\n🌧️ Risque pluie: ${maxRainChance}%`;
    }
    
    return output;
  } catch (error: any) {
    return `[Météo indisponible: ${error.message}]`;
  }
}

getWeather(city).then(console.log);
