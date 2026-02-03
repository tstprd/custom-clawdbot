/**
 * Check transports for Jules' weekend events with uncertainty handling
 * - Ignore AL events
 * - Include events that touch weekends
 * - Ask for uncertain events (weekday events near weekends)
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
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWeekend(currentDate)) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return false;
}

function isNearWeekend(date: Date): boolean {
  const day = date.getDay();
  // Thursday or Friday = near weekend
  return day === 4 || day === 5;
}

function needsTransport(summary: string, location?: string): boolean {
  if (!summary) return false;
  
  const lower = summary.toLowerCase();
  const outOfTown = [
    'strasbourg', 'paris', 'lyon', 'lille', 'barcelone',
    'disney', 'racketlon', 'voyage', 'déplacement', 'anniversaire'
  ];
  
  for (const city of outOfTown) {
    if (lower.includes(city)) return true;
  }
  
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
  const uncertainEvents: any[] = [];
  const bookedTransports: any[] = [];
  
  for (const event of events) {
    const summary = event.summary || '';
    const start = event.start.date || event.start.dateTime;
    const end = event.end?.date || event.end?.dateTime || start;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
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
        location: event.location
      });
    } else if (needsTransport(summary, event.location)) {
      // Event touches weekend = definitely include
      if (touchesWeekend(startDate, endDate)) {
        eventsRequiringTransport.push({
          date: startDate,
          endDate: endDate,
          summary,
          location: event.location,
          certain: true
        });
      }
      // Event is near weekend (Thu/Fri) = uncertain
      else if (isNearWeekend(startDate)) {
        uncertainEvents.push({
          date: startDate,
          endDate: endDate,
          summary,
          location: event.location,
          certain: false
        });
      }
    }
  }
  
  // Check for missing transports
  const missingTransports: any[] = [];
  
  for (const event of eventsRequiringTransport) {
    let hasTransport = false;
    
    for (const transport of bookedTransports) {
      const daysDiff = Math.abs((transport.date.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 3) {
        hasTransport = true;
        break;
      }
    }
    
    if (!hasTransport) {
      missingTransports.push(event);
    }
  }
  
  // Generate report
  let report = '🚂 VÉRIFICATION TRANSPORTS - WEEKENDS À VENIR\n';
  report += '='.repeat(60) + '\n\n';
  
  const totalToCheck = missingTransports.length + uncertainEvents.length;
  
  if (totalToCheck === 0 && eventsRequiringTransport.length > 0) {
    report += '✅ **TOUT EST EN ORDRE**\n\n';
    report += 'Tous vos déplacements weekend ont des transports réservés!\n\n';
  } else if (totalToCheck === 0 && eventsRequiringTransport.length === 0) {
    report += '📅 **AUCUN DÉPLACEMENT WEEKEND PRÉVU**\n\n';
  } else {
    report += `⚠️ **${totalToCheck} TRANSPORT(S) À VÉRIFIER**\n\n`;
    
    // Missing transports (certain)
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
      
      report += `### **${event.summary}**\n`;
      report += `📅 ${dateStr}${endStr}\n`;
      if (event.location) {
        report += `📍 ${event.location}\n`;
      }
      report += `❓ **Avez-vous réservé le transport ?** (Train, avion, dates ?)\n\n`;
    }
    
    // Uncertain events
    for (const event of uncertainEvents) {
      const dateStr = event.date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
      const timeStr = event.date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      report += `### **${event.summary}**\n`;
      report += `📅 ${dateStr} ${timeStr}\n`;
      if (event.location) {
        report += `📍 ${event.location}\n`;
      }
      report += `❓ **Cet événement nécessite-t-il un transport ?**\n`;
      report += `   Si oui, avez-vous réservé ?\n\n`;
    }
  }
  
  report += '='.repeat(60) + '\n\n';
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
