#!/usr/bin/env npx tsx
/**
 * Analyse l'agenda Google (Jules + AL) pour détecter les présences/absences
 * et générer une proposition de configuration pour la semaine
 * Version gog CLI (auth perpétuelle)
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const STATE_FILE = join(process.cwd(), 'skills', 'homeassistant', 'scripts', 'presence-state.json');

const ACCOUNTS = {
  jules: 'jmudes76000@gmail.com',
  al: 'alejmurot@gmail.com'
};

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

function gogJson<T>(args: string[], account: string): T | null {
  try {
    const cmd = `gog ${args.join(' ')} --account ${account} --json`;
    const output = execSync(cmd, { 
      encoding: 'utf-8', 
      timeout: 30000,
      shell: 'powershell.exe',
      windowsHide: true
    });
    return JSON.parse(output);
  } catch (e: any) {
    console.error(`gog error: ${e.message}`);
    return null;
  }
}

function getNextWeek() {
  const today = new Date();
  const nextMonday = new Date(today);
  
  // Trouver le lundi suivant
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);
  
  return { start: nextMonday, end: nextSunday };
}

function isHomeLocation(location?: string): boolean | null {
  if (!location) return null; // Incertain
  
  const homeLoc = location.toLowerCase();
  
  // Clairement à Rennes
  if (homeLoc.includes('rennes') || homeLoc.includes('domicile') || homeLoc.includes('maison')) {
    return true;
  }
  
  // Clairement ailleurs
  if (homeLoc.includes('paris') || homeLoc.includes('lyon') || 
      homeLoc.includes('nantes') || homeLoc.includes('bordeaux') ||
      homeLoc.includes('lille') || homeLoc.includes('hotel') ||
      homeLoc.includes('train') || homeLoc.includes('avion')) {
    return false;
  }
  
  return null; // Incertain
}

function detectAbsence(events: CalendarEvent[], date: Date): { present: boolean; uncertain: boolean; reason?: string } {
  const dateStr = date.toISOString().split('T')[0];
  
  for (const event of events) {
    const eventStart = event.start?.dateTime || event.start?.date;
    if (!eventStart) continue;
    
    const eventDate = eventStart.split('T')[0];
    if (eventDate !== dateStr) continue;
    
    const summary = (event.summary || '').toLowerCase();
    const location = event.location;
    
    // Mots-clés d'absence
    if (summary.includes('voyage') || summary.includes('vacances') || 
        summary.includes('déplacement') || summary.includes('train') ||
        summary.includes('avion') || summary.includes('conférence')) {
      return { present: false, uncertain: false, reason: event.summary };
    }
    
    // Vérifier la localisation
    const isHome = isHomeLocation(location);
    if (isHome === false) {
      return { present: false, uncertain: false, reason: `${event.summary} (${location})` };
    }
  }
  
  return { present: true, uncertain: false };
}

async function main() {
  const { start, end } = getNextWeek();
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get events for next 14 days to cover the week
  const julesEvents = gogJson<{ events?: CalendarEvent[] }>(['calendar', 'events', '--days', '14'], ACCOUNTS.jules);
  const alEvents = gogJson<{ events?: CalendarEvent[] }>(['calendar', 'events', '--days', '14'], ACCOUNTS.al);
  
  const julesToCheck = julesEvents?.events || [];
  const alToCheck = alEvents?.events || [];
  
  const presenceConfig: any = {};
  const uncertainEvents: string[] = [];
  
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];
    
    const julesStatus = detectAbsence(julesToCheck, date);
    const alStatus = detectAbsence(alToCheck, date);
    
    presenceConfig[dateStr] = {
      day: dayName,
      jules: julesStatus.present ? 'home' : 'away',
      al: alStatus.present ? 'home' : 'away'
    };
    
    if (julesStatus.uncertain) {
      uncertainEvents.push(`${dayName} ${dateStr}: Jules - événement incertain`);
    }
    if (alStatus.uncertain) {
      uncertainEvents.push(`${dayName} ${dateStr}: AL - événement incertain`);
    }
    if (!julesStatus.present && julesStatus.reason) {
      uncertainEvents.push(`${dayName} ${dateStr}: Jules absent (${julesStatus.reason})`);
    }
    if (!alStatus.present && alStatus.reason) {
      uncertainEvents.push(`${dayName} ${dateStr}: AL absente (${alStatus.reason})`);
    }
  }
  
  // Save state
  writeFileSync(STATE_FILE, JSON.stringify({ 
    generatedAt: new Date().toISOString(),
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    config: presenceConfig,
    validated: false
  }, null, 2));
  
  // Output
  let output = `📅 **Proposition présences semaine du ${start.toLocaleDateString('fr-FR')}**\n\n`;
  
  for (const [dateStr, config] of Object.entries(presenceConfig)) {
    const c = config as any;
    const julesIcon = c.jules === 'home' ? '🏠' : '✈️';
    const alIcon = c.al === 'home' ? '🏠' : '✈️';
    output += `**${c.day}** (${dateStr}): Jules ${julesIcon} | AL ${alIcon}\n`;
  }
  
  if (uncertainEvents.length > 0) {
    output += `\n⚠️ **Événements à clarifier:**\n`;
    for (const event of uncertainEvents) {
      output += `- ${event}\n`;
    }
  }
  
  output += `\nRépondre "valide" pour appliquer cette configuration.`;
  
  writeFileSync(OUTPUT_FILE, output);
  console.log(output);
}

main().catch(console.error);
