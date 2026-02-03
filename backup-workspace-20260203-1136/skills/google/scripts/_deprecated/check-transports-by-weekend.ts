/**
 * Check transports organized by weekend periods
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

function getWeekendPeriods() {
  const weekends = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from next Friday
  let current = new Date(today);
  const daysUntilFriday = (5 - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntilFriday);
  
  for (let i = 0; i < 9; i++) {
    const friday = new Date(current);
    const monday = new Date(current);
    monday.setDate(friday.getDate() + 3);
    
    weekends.push({
      start: friday,
      end: monday,
      label: `${friday.getDate()}/${friday.getMonth() + 1} - ${monday.getDate()}/${monday.getMonth() + 1}`
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return weekends;
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

function isInPeriod(eventDate: Date, start: Date, end: Date): boolean {
  return eventDate >= start && eventDate <= end;
}

async function main() {
  const tokens = await getTokens();
  const data = await getCalendarEvents(tokens);
  
  if (data.error) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${data.error.message}`);
    return;
  }
  
  const weekends = getWeekendPeriods();
  const weekendData: any = {};
  
  // Initialize weekend data
  for (const weekend of weekends) {
    weekendData[weekend.label] = {
      period: weekend,
      transports: [],
      events: [],
      needsCheck: []
    };
  }
  
  // Organize events by weekend
  for (const event of data.items || []) {
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
    
    const eventInfo = {
      date: startDate,
      endDate: endDate,
      summary,
      location: event.location,
      time: startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Assign to weekends
    for (const [label, wd] of Object.entries(weekendData) as any) {
      if (isInPeriod(startDate, wd.period.start, wd.period.end)) {
        if (isTransportEvent(summary)) {
          wd.transports.push(eventInfo);
        } else {
          wd.events.push(eventInfo);
        }
      }
    }
  }
  
  // Generate report
  let report = '🗓️ VUE PAR WEEKEND - 2 PROCHAINS MOIS\n';
  report += '='.repeat(60) + '\n\n';
  
  let hasIssues = false;
  
  for (const [label, wd] of Object.entries(weekendData) as any) {
    const startStr = wd.period.start.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short'
    });
    const endStr = wd.period.end.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short'
    });
    
    // Skip weekends with nothing
    if (wd.events.length === 0 && wd.transports.length === 0) {
      continue;
    }
    
    report += `## 📅 ${startStr} → ${endStr}\n\n`;
    
    // Events
    if (wd.events.length > 0) {
      report += '**Événements :**\n';
      for (const evt of wd.events) {
        const dateStr = evt.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        report += `  📍 ${dateStr} ${evt.time} - ${evt.summary}`;
        if (evt.location) {
          report += ` (${evt.location})`;
        }
        report += '\n';
      }
      report += '\n';
    }
    
    // Transports
    if (wd.transports.length > 0) {
      report += '**Transports réservés :**\n';
      for (const tr of wd.transports) {
        const dateStr = tr.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        report += `  🚂 ${dateStr} ${tr.time} - ${tr.summary}`;
        if (tr.location) {
          report += ` (${tr.location})`;
        }
        report += '\n';
      }
      report += '\n';
    }
    
    // Check if transport needed but missing
    const needsTransport = wd.events.some((e: any) => {
      const lower = e.summary.toLowerCase();
      return lower.includes('strasbourg') || lower.includes('paris') || 
             lower.includes('lyon') || lower.includes('lille') || 
             lower.includes('disney') || lower.includes('racketlon');
    });
    
    if (needsTransport && wd.transports.length === 0) {
      report += '⚠️ **Transport à vérifier**\n\n';
      hasIssues = true;
    } else if (wd.transports.length > 0) {
      report += '✅ **Transport OK**\n\n';
    }
    
    report += '-'.repeat(60) + '\n\n';
  }
  
  if (!hasIssues) {
    report += '\n✅ **TOUT EST EN ORDRE**\n';
    report += 'Tous vos weekends avec déplacement ont des transports réservés!\n';
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
