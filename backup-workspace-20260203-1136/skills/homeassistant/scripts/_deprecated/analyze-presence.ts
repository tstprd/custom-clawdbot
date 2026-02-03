/**
 * Analyse l'agenda Google (Jules + AL) pour détecter les présences/absences
 * et générer une proposition de configuration pour la semaine
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JULES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_AL = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const STATE_FILE = join(process.cwd(), 'skills', 'homeassistant', 'scripts', 'presence-state.json');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function getTokens(path: string): Promise<Tokens> {
  const tokens: Tokens = JSON.parse(readFileSync(path, 'utf-8'));
  
  if (Date.now() > tokens.expiry_date - 60000) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    const newTokens = await response.json();
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(path, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function getCalendarEvents(tokens: Tokens, startDate: Date, endDate: Date) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${startDate.toISOString()}&` +
    `timeMax=${endDate.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime&` +
    `maxResults=100`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
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
  
  const loc = location.toLowerCase();
  
  // Lieux de présence (Rennes)
  const homeKeywords = ['rennes', 'maison', '35000', '35200', '35700'];
  const isHome = homeKeywords.some(k => loc.includes(k));
  if (isHome) return true;
  
  // Lieux d'absence explicites
  const awayKeywords = ['paris', 'lyon', 'strasbourg', 'marseille', 'bordeaux', 'toulouse', 'nantes', 'rouen', 'lille'];
  const isAway = awayKeywords.some(k => loc.includes(k));
  if (isAway) return false;
  
  return null; // Incertain
}

function isTransportEvent(summary: string, location?: string): boolean {
  const text = (summary + ' ' + (location || '')).toLowerCase();
  const transportKeywords = ['train', 'avion', 'flight', 'tgv', 'ouigo', 'gare', 'aéroport'];
  return transportKeywords.some(k => text.includes(k));
}

interface UncertainEvent {
  date: string;
  summary: string;
  location?: string;
  id: string;
  dayKey: string;
}

function analyzePresence(events: any[], personName: string): { 
  presence: { [key: string]: boolean }, 
  uncertain: UncertainEvent[] 
} {
  const week = getNextWeek();
  const presence: { [key: string]: boolean } = {};
  const uncertain: UncertainEvent[] = [];
  
  // Par défaut, présent
  for (let i = 0; i < 7; i++) {
    const date = new Date(week.start);
    date.setDate(week.start.getDate() + i);
    const dayKey = date.toISOString().split('T')[0];
    presence[dayKey] = true;
  }
  
  // Analyser les événements
  for (const event of events) {
    const start = new Date(event.start.date || event.start.dateTime);
    const dayKey = start.toISOString().split('T')[0];
    
    if (presence[dayKey] === undefined) continue;
    
    const summary = event.summary || '(Sans titre)';
    const location = event.location;
    
    // Transport = absent
    if (isTransportEvent(summary, location)) {
      presence[dayKey] = false;
      continue;
    }
    
    // Analyser le lieu
    const locationCheck = isHomeLocation(location);
    
    if (locationCheck === false) {
      // Lieu ailleurs → absent
      presence[dayKey] = false;
    } else if (locationCheck === null && location !== undefined) {
      // Lieu incertain mais présent → demander
      uncertain.push({
        date: start.toLocaleDateString('fr-FR'),
        summary,
        location,
        id: event.id,
        dayKey
      });
    } else if (locationCheck === null && !location) {
      // Pas de lieu ET pas évident → demander seulement si important
      const importantKeywords = ['réunion', 'rendez-vous', 'rdv', 'meeting'];
      const seemsImportant = importantKeywords.some(k => summary.toLowerCase().includes(k));
      
      if (seemsImportant) {
        uncertain.push({
          date: start.toLocaleDateString('fr-FR'),
          summary,
          location: undefined,
          id: event.id,
          dayKey
        });
      }
    }
  }
  
  return { presence, uncertain };
}

async function main() {
  const tokensJules = await getTokens(TOKEN_PATH_JULES);
  const tokensAL = await getTokens(TOKEN_PATH_AL);
  
  const week = getNextWeek();
  
  const eventsJules = await getCalendarEvents(tokensJules, week.start, week.end);
  const eventsAL = await getCalendarEvents(tokensAL, week.start, week.end);
  
  if (eventsJules.error) {
    writeFileSync(OUTPUT_FILE, `Erreur Jules: ${eventsJules.error.message}`);
    return;
  }
  
  if (eventsAL.error) {
    writeFileSync(OUTPUT_FILE, `Erreur AL: ${eventsAL.error.message}`);
    return;
  }
  
  const resultJules = analyzePresence(eventsJules.items || [], 'Jules');
  const resultAL = analyzePresence(eventsAL.items || [], 'Anne-Laure');
  
  const presenceJules = resultJules.presence;
  const presenceAL = resultAL.presence;
  const uncertainJules = resultJules.uncertain;
  const uncertainAL = resultAL.uncertain;
  
  // Générer le rapport
  let report = '🏠 ANALYSE PRÉSENCES - SEMAINE PROCHAINE\n';
  report += '='.repeat(60) + '\n\n';
  
  report += `📅 Période : ${week.start.toLocaleDateString('fr-FR')} → ${week.end.toLocaleDateString('fr-FR')}\n\n`;
  
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  report += '**PRÉSENCES PAR JOUR :**\n\n';
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(week.start);
    date.setDate(week.start.getDate() + i);
    const dayKey = date.toISOString().split('T')[0];
    const dayName = daysOfWeek[i];
    
    const julesPresent = presenceJules[dayKey];
    const alPresent = presenceAL[dayKey];
    
    report += `${dayName} ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} :\n`;
    report += `  Jules: ${julesPresent ? '✅ Présent' : '❌ Absent'}\n`;
    report += `  AL: ${alPresent ? '✅ Présent' : '❌ Absent'}\n\n`;
  }
  
  report += '\n' + '='.repeat(60) + '\n\n';
  report += '**CONFIGURATION HOME ASSISTANT À APPLIQUER :**\n\n';
  
  // Résumé de la semaine
  const julesAbsentDays = Object.values(presenceJules).filter(p => !p).length;
  const alAbsentDays = Object.values(presenceAL).filter(p => !p).length;
  
  report += `Jules : ${7 - julesAbsentDays} jours présent, ${julesAbsentDays} jours absent\n`;
  report += `AL : ${7 - alAbsentDays} jours présent, ${alAbsentDays} jours absent\n\n`;
  
  // Événements incertains
  if (uncertainJules.length > 0 || uncertainAL.length > 0) {
    report += '❓ **ÉVÉNEMENTS À CLARIFIER :**\n\n';
    
    if (uncertainJules.length > 0) {
      report += '**Jules :**\n';
      for (const evt of uncertainJules) {
        report += `  📅 ${evt.date} - ${evt.summary}\n`;
        report += `     Lieu : ${evt.location || '(non renseigné)'}\n`;
        report += `     ➡️ Êtes-vous présent à Rennes ce jour-là ?\n\n`;
      }
    }
    
    if (uncertainAL.length > 0) {
      report += '**Anne-Laure :**\n';
      for (const evt of uncertainAL) {
        report += `  📅 ${evt.date} - ${evt.summary}\n`;
        report += `     Lieu : ${evt.location || '(non renseigné)'}\n`;
        report += `     ➡️ Est-elle présente à Rennes ce jour-là ?\n\n`;
      }
    }
    
    report += '---\n\n';
  }
  
  report += '⚠️ Confirmez cette configuration pour application lundi 1h du matin.\n';
  
  // Sauvegarder la proposition dans le fichier state
  const state = {
    validated: false,
    proposalDate: new Date().toISOString(),
    weekStart: week.start.toISOString(),
    weekEnd: week.end.toISOString(),
    presences: {
      jules: presenceJules,
      al: presenceAL
    },
    uncertainEvents: {
      jules: uncertainJules,
      al: uncertainAL
    }
  };
  
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  writeFileSync(OUTPUT_FILE, report);
}

main();
