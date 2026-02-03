/**
 * Weekend transport check - Fixed grouping logic
 * Events on Friday should belong to the NEXT weekend (Sat-Sun)
 */

import { readFileSync, writeFileSync } from 'fs';
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

function hasSaturdayOrSunday(startDate: Date, endDate: Date): boolean {
  let current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day === 0 || day === 6) {
      return true;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return false;
}

function findWeekendSaturday(eventDate: Date): Date {
  const day = eventDate.getDay();
  
  // If event is on Friday, weekend is NEXT day (Saturday)
  if (day === 5) {
    const saturday = new Date(eventDate);
    saturday.setDate(saturday.getDate() + 1);
    return saturday;
  }
  
  // If event is on Saturday, that's the weekend
  if (day === 6) {
    return new Date(eventDate);
  }
  
  // If event is on Sunday, weekend Saturday is previous day
  if (day === 0) {
    const saturday = new Date(eventDate);
    saturday.setDate(saturday.getDate() - 1);
    return saturday;
  }
  
  // For other days, find nearest Saturday
  // Look forward first
  let current = new Date(eventDate);
  for (let i = 0; i < 7; i++) {
    if (current.getDay() === 6) {
      return new Date(current);
    }
    current.setDate(current.getDate() + 1);
  }
  
  // Look backward
  current = new Date(eventDate);
  for (let i = 0; i < 7; i++) {
    if (current.getDay() === 6) {
      return new Date(current);
    }
    current.setDate(current.getDate() - 1);
  }
  
  return new Date(eventDate);
}

function isALEvent(summary: string): boolean {
  if (!summary) return false;
  const lower = summary.toLowerCase().trim();
  return lower.startsWith('al ') || lower.startsWith('anne-laure') || lower === 'al';
}

function isTransportEvent(summary: string): boolean {
  const lower = summary.toLowerCase();
  return lower.includes('train') || lower.includes('avion') || lower.includes('flight') || lower.includes('bus');
}

function isInWindow(transportDate: Date, eventStart: Date, eventEnd: Date): boolean {
  const windowStart = new Date(eventStart);
  windowStart.setDate(windowStart.getDate() - 1);
  
  const windowEnd = new Date(eventEnd);
  windowEnd.setDate(windowEnd.getDate() + 1);
  
  return transportDate >= windowStart && transportDate <= windowEnd;
}

async function main() {
  const tokens = await getTokens();
  const data = await getCalendarEvents(tokens);
  
  if (data.error) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${data.error.message}`);
    return;
  }
  
  const allEvents = [];
  const allTransports = [];
  
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  for (const event of data.items || []) {
    const summary = event.summary || '';
    if (isALEvent(summary)) continue;
    
    const start = event.start.date || event.start.dateTime;
    const end = event.end?.date || event.end?.dateTime || start;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (event.start.date && event.end?.date) {
      endDate.setDate(endDate.getDate() - 1);
    }
    
    const info = {
      date: startDate,
      endDate: endDate,
      summary,
      location: event.location,
      time: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dayName: days[startDate.getDay()],
      dayDate: startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    };
    
    if (isTransportEvent(summary)) {
      allTransports.push(info);
    } else {
      allEvents.push(info);
    }
  }
  
  const weekendEvents = allEvents.filter(evt => 
    hasSaturdayOrSunday(evt.date, evt.endDate)
  );
  
  const weekendGroups: any[] = [];
  
  for (const evt of weekendEvents) {
    const saturday = findWeekendSaturday(evt.date);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    
    const key = `${saturday.getDate()}/${saturday.getMonth() + 1}/${saturday.getFullYear()}`;
    
    let group = weekendGroups.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        saturday,
        sunday,
        events: [],
        transports: []
      };
      weekendGroups.push(group);
    }
    
    group.events.push(evt);
    
    for (const transport of allTransports) {
      if (isInWindow(transport.date, evt.date, evt.endDate)) {
        if (!group.transports.find((t: any) => 
          t.date.getTime() === transport.date.getTime() && t.summary === transport.summary
        )) {
          group.transports.push(transport);
        }
      }
    }
  }
  
  weekendGroups.sort((a, b) => a.saturday.getTime() - b.saturday.getTime());
  
  let report = '🗓️ WEEKENDS AVEC DÉPLACEMENTS - 2 MOIS\n';
  report += '='.repeat(60) + '\n\n';
  
  if (weekendGroups.length === 0) {
    report += 'Aucun déplacement prévu les weekends.\n';
  }
  
  for (const group of weekendGroups) {
    const satStr = group.saturday.toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short'
    });
    const sunStr = group.sunday.toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short'
    });
    
    report += `## 📅 Weekend ${satStr} - ${sunStr}\n\n`;
    
    report += '**📍 Événements :**\n';
    for (const evt of group.events) {
      report += `  • ${evt.dayName} ${evt.dayDate} ${evt.time} - ${evt.summary}\n`;
      if (evt.location) {
        report += `    📍 ${evt.location}\n`;
      }
    }
    report += '\n';
    
    if (group.transports.length > 0) {
      report += '**🚂 Transports réservés :**\n';
      
      group.transports.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
      
      for (const tr of group.transports) {
        report += `  • ${tr.dayName} ${tr.dayDate} ${tr.time} - ${tr.summary}\n`;
        if (tr.location) {
          report += `    ${tr.location}\n`;
        }
      }
      report += '\n';
      report += '✅ **Transports trouvés**\n\n';
    } else {
      report += '⚠️ **AUCUN TRANSPORT RÉSERVÉ**\n';
      report += '❓ Avez-vous besoin de réserver un transport ?\n\n';
    }
    
    report += '-'.repeat(60) + '\n\n';
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
