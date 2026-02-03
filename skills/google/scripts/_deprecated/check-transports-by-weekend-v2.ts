/**
 * Check transports organized by weekend periods (improved)
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

function getWeekendPeriods() {
  const weekends = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 10; i++) {
    const current = new Date(today);
    current.setDate(current.getDate() + (i * 7));
    
    // Find next Friday from current
    const dayOfWeek = current.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (12 - dayOfWeek);
    
    const friday = new Date(current);
    friday.setDate(current.getDate() + daysUntilFriday);
    
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    
    weekends.push({
      start: friday,
      end: monday,
      label: `${friday.getDate()}/${friday.getMonth() + 1}`
    });
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
  return lower.includes('train') || lower.includes('avion') || lower.includes('flight');
}

function needsTransport(summary: string, location?: string): boolean {
  const lower = (summary || '').toLowerCase();
  const cities = ['strasbourg', 'paris', 'lyon', 'lille', 'disney', 'racketlon'];
  
  for (const city of cities) {
    if (lower.includes(city)) return true;
  }
  
  if (location && !location.toLowerCase().includes('rennes')) {
    return true;
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
  
  const weekends = getWeekendPeriods();
  const weekendData: any = {};
  
  // Initialize
  for (const w of weekends) {
    weekendData[w.label] = {
      period: w,
      transports: [],
      events: [],
      status: '✅'
    };
  }
  
  // Organize events
  for (const event of data.items || []) {
    const summary = event.summary || '';
    if (isALEvent(summary)) continue;
    
    const start = event.start.date || event.start.dateTime;
    const date = new Date(start);
    
    const info = {
      date,
      summary,
      location: event.location,
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      day: date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    };
    
    // Find matching weekend (within 3 days before/after weekend period)
    for (const [label, wd] of Object.entries(weekendData) as any) {
      const diffDays = (date.getTime() - wd.period.start.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays >= -3 && diffDays <= 3) {
        if (isTransportEvent(summary)) {
          wd.transports.push(info);
        } else {
          wd.events.push(info);
          if (needsTransport(summary, event.location)) {
            wd.needsTransport = true;
          }
        }
      }
    }
  }
  
  // Generate report
  let report = '🗓️ VUE PAR WEEKEND - 2 PROCHAINS MOIS\n';
  report += '='.repeat(60) + '\n\n';
  
  for (const [label, wd] of Object.entries(weekendData) as any) {
    if (wd.events.length === 0 && wd.transports.length === 0) continue;
    
    const startStr = wd.period.start.toLocaleDateString('fr-FR', { 
      weekday: 'short', day: '2-digit', month: 'short'
    });
    const endStr = wd.period.end.toLocaleDateString('fr-FR', { 
      weekday: 'short', day: '2-digit', month: 'short'
    });
    
    report += `## 📅 Weekend ${startStr} → ${endStr}\n\n`;
    
    // Events
    if (wd.events.length > 0) {
      report += '**📍 Événements :**\n';
      for (const evt of wd.events) {
        report += `  • ${evt.day} ${evt.time} - ${evt.summary}\n`;
        if (evt.location) {
          report += `    📍 ${evt.location}\n`;
        }
      }
      report += '\n';
    }
    
    // Transports
    if (wd.transports.length > 0) {
      report += '**🚂 Transports :**\n';
      for (const tr of wd.transports) {
        report += `  • ${tr.day} ${tr.time} - ${tr.summary}\n`;
        if (tr.location) {
          report += `    ${tr.location}\n`;
        }
      }
      report += '\n';
    }
    
    // Status
    if (wd.needsTransport && wd.transports.length === 0) {
      report += '⚠️ **TRANSPORT À RÉSERVER**\n\n';
    } else if (wd.transports.length > 0) {
      report += '✅ **OK**\n\n';
    }
    
    report += '-'.repeat(60) + '\n\n';
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
