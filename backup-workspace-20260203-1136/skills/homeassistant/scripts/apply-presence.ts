/**
 * Applique la configuration de présence dans Home Assistant
 * Lit la config validée et met à jour les capteurs binaires
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ENV_FILE = 'C:\\Users\\jules\\repo\\claude-home\\.env';
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const STATE_FILE = join(process.cwd(), 'skills', 'homeassistant', 'scripts', 'presence-state.json');

interface HAConfig {
  url: string;
  token: string;
}

function loadHAConfig(): HAConfig {
  const envContent = readFileSync(ENV_FILE, 'utf-8');
  const lines = envContent.split('\n');
  
  let url = '';
  let token = '';
  
  for (const line of lines) {
    if (line.startsWith('HA_API_URL=')) {
      url = line.split('=')[1].trim();
    }
    if (line.startsWith('HA_API_TOKEN=')) {
      token = line.split('=')[1].trim();
    }
  }
  
  if (!url || !token) {
    throw new Error('HA_API_URL or HA_API_TOKEN not found in .env');
  }
  
  return { url, token };
}

async function setPresence(config: HAConfig, entity: string, present: boolean) {
  const service = present ? 'turn_on' : 'turn_off';
  const url = `${config.url}/api/services/input_boolean/${service}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity_id: entity
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to set ${entity}: ${response.statusText}`);
  }
  
  return response.json();
}

async function main() {
  const config = loadHAConfig();
  
  try {
    // Lire le state validé
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    
    if (!state.validated) {
      writeFileSync(OUTPUT_FILE, '⚠️ Configuration non validée. Impossible d\'appliquer.');
      return;
    }
    
    const weekStart = new Date(state.weekStart);
    const daysNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    let report = '✅ Configuration de présence appliquée dans Home Assistant\n\n';
    
    // Appliquer pour tous les jours de la semaine
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      const dayName = daysNames[i];
      
      const julesPresent = state.presences.jules[dayKey] ?? true;
      const alPresent = state.presences.al[dayKey] ?? true;
      
      // Appliquer dans Home Assistant
      await setPresence(config, `input_boolean.presence_jules_${dayName}`, julesPresent);
      await setPresence(config, `input_boolean.presence_anne_laure_${dayName}`, alPresent);
      
      report += `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} :\n`;
      report += `  Jules: ${julesPresent ? '✅' : '❌'} | AL: ${alPresent ? '✅' : '❌'}\n`;
    }
    
    writeFileSync(OUTPUT_FILE, report);
  } catch (err) {
    writeFileSync(OUTPUT_FILE, `❌ Erreur: ${String(err)}`);
  }
}

main();
