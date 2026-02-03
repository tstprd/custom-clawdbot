/**
 * Check if transports are booked for Jules' weekend events only
 * - Ignore AL events
 * - Ignore single-day weekday events
 * - Only check events that touch a weekend (Sat/Sun)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function getTokens(): Promise<Tokens> {
  const tokens: Tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
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
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function getCalendarEvents(tokens: Tokens) {
  const now = new Date();
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${now.toISOString()}&` +
    `timeMax=${twoMonthsLater.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime&` +
    `maxResults=50`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

function isALEvent(summary: string): boolean {
  if (!summary) return false;
  const lower = summary.toLowerCase().trim();
  return lower.startsWith('al ') || lower.startsWith('anne-laure') || lower === 'al';
}

function isTransportEvent(summary: string): boolean {
  const lower = summary.toLowerCase();
  return lower.includes('train') || 
         lower.includes('avion') || 
         lower.includes('flight') ||
         lower.includes('vol ') ||
         lower.includes('bus ');
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function touchesWeekend(startDate: Date, endDate: Date): boolean {
  // Check if event spans across or touches a weekend
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWeekend(currentDate)) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return false;
}

function needsTransport(summary: string, location?: string): boolean {
  if (!summary) return false;
  
  const lower = summary.toLowerCase();
  const outOfTown = [
    'strasbourg', 'paris', 'lyon', 'lille', 'barcelone',
    'disney', 'racketlon', 'voyage', 'déplacement'
  ];
  
  // Check if event mentions a different city
  for (const city of outOfTown) {
    if (lower.includes(city)) return true;
  }
  
  // Check location field
  if (location) {
    const locLower = location.toLowerCase();
    if (!locLower.includes('rennes')) return true;
  }
  
  return false;
}

async function main() {
  const tokens = await getTokens();
  const data = await getCalendarEvents(tokens);
  
  if (data.error) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${data.error.message}`);
    return;
  }
  
  const events = data.items || [];
  const eventsRequiringTransport: any[] = [];
  const bookedTransports: any[] = [];
  
  // Séparer les événements nécessitant un transport et les transports déjà réservés
  for (const event of events) {
    const summary = event.summary || '';
    const start = event.start.date || event.start.dateTime;
    const end = event.end?.date || event.end?.dateTime || start;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // For all-day events, end date is exclusive, so subtract 1 day
    if (event.start.date && event.end?.date) {
      endDate.setDate(endDate.getDate() - 1);
    }
    
    // Skip AL events
    if (isALEvent(summary)) {
      continue;
    }
    
    if (isTransportEvent(summary)) {
      bookedTransports.push({
        date: startDate,
        summary,
        location: event.location,
        description: event.description
      });
    } else {
      // Only include events that touch a weekend
      if (touchesWeekend(startDate, endDate) && needsTransport(summary, event.location)) {
        eventsRequiringTransport.push({
          date: startDate,
          endDate: endDate,
          summary,
          location: event.location,
          description: event.description
        });
      }
    }
  }
  
  // Vérifier pour chaque événement si un transport est réservé dans les 2 jours avant/après
  const missingTransports: any[] = [];
  
  for (const event of eventsRequiringTransport) {
    let hasTransport = false;
    
    for (const transport of bookedTransports) {
      const daysDiff = Math.abs((transport.date.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 2) {
        hasTransport = true;
        break;
      }
    }
    
    if (!hasTransport) {
      missingTransports.push(event);
    }
  }
  
  // Générer le rapport
  let report = '🚂 VÉRIFICATION TRANSPORTS - WEEKENDS À VENIR\n';
  report += '='.repeat(60) + '\n\n';
  
  if (missingTransports.length === 0 && eventsRequiringTransport.length > 0) {
    report += '✅ **TOUT EST EN ORDRE**\n\n';
    report += 'Tous vos déplacements weekend ont des transports réservés!\n\n';
  } else if (eventsRequiringTransport.length === 0) {
    report += '📅 **AUCUN DÉPLACEMENT WEEKEND PRÉVU**\n\n';
    report += 'Pas d\'événements nécessitant un transport ce weekend.\n\n';
  } else {
    report += `⚠️ **${missingTransports.length} TRANSPORT(S) À RÉSERVER**\n\n`;
    
    for (const event of missingTransports) {
      const dateStr = event.date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
      
      let endStr = '';
      if (event.endDate.getTime() !== event.date.getTime()) {
        endStr = ' → ' + event.endDate.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: '2-digit', 
          month: 'long'
        });
      }
      
      report += `📍 **${event.summary}**\n`;
      report += `   📅 ${dateStr}${endStr}\n`;
      if (event.location) {
        report += `   🗺️ ${event.location}\n`;
      }
      report += '\n';
    }
    
    report += '\n❓ **QUESTIONS POUR VOUS :**\n\n';
    
    for (const event of missingTransports) {
      report += `- **${event.summary}** : Avez-vous réservé le transport ? (Train, avion, covoiturage...)\n`;
    }
  }
  
  report += '\n' + '='.repeat(60) + '\n\n';
  report += '✅ **TRANSPORTS DÉJÀ RÉSERVÉS :**\n\n';
  
  if (bookedTransports.length === 0) {
    report += 'Aucun transport trouvé dans le calendrier.\n';
  } else {
    for (const transport of bookedTransports) {
      const dateStr = transport.date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit'
      });
      const timeStr = transport.date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      report += `🚂 ${dateStr} ${timeStr} - ${transport.summary}`;
      if (transport.location) {
        report += ` (${transport.location})`;
      }
      report += '\n';
    }
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
