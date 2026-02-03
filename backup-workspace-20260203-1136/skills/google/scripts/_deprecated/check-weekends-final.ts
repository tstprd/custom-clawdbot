/**
 * Weekend transport check with proper edge case handling:
 * - Events starting Sunday evening or Monday early morning (before 8am) = weekend
 * - Multi-day events touching Sat/Sun
 * - Check for outbound + return transports
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

function getWeekends() {
  const weekends = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let current = new Date(today);
  
  for (let i = 0; i < 60; i++) {
    const day = current.getDay();
    
    if (day === 6) { // Saturday
      const saturday = new Date(current);
      const sunday = new Date(current);
      sunday.setDate(saturday.getDate() + 1);
      
      weekends.push({
        sat: saturday,
        sun: sunday
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return weekends.slice(0, 8);
}

function isWeekendEvent(eventDate: Date, weekend: any): boolean {
  const day = eventDate.getDay();
  const hour = eventDate.getHours();
  
  // Saturday or Sunday = weekend
  if (day === 6 || day === 0) return true;
  
  // Monday before 8am = weekend departure
  if (day === 1 && hour < 8) return true;
  
  // Friday after 17h = weekend start
  if (day === 5 && hour >= 17) return true;
  
  return false;
}

function belongsToWeekend(eventDate: Date, weekend: any): boolean {
  // Check if event is within Fri 17h - Mon 8h range of this weekend
  const friday = new Date(weekend.sat);
  friday.setDate(friday.getDate() - 1);
  friday.setHours(17, 0, 0, 0);
  
  const monday = new Date(weekend.sun);
  monday.setDate(monday.getDate() + 1);
  monday.setHours(8, 0, 0, 0);
  
  return eventDate >= friday && eventDate <= monday;
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

function isReturnTransport(summary: string, location?: string): boolean {
  const lower = summary.toLowerCase();
  const toLower = location?.toLowerCase() || '';
  return lower.includes('to rennes') || lower.includes('rennes') || 
         toLower.includes('vers rennes');
}

async function main() {
  const tokens = await getTokens();
  const data = await getCalendarEvents(tokens);
  
  if (data.error) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${data.error.message}`);
    return;
  }
  
  const weekends = getWeekends();
  const weekendData: any[] = [];
  
  for (const weekend of weekends) {
    weekendData.push({
      weekend,
      events: [],
      transports: []
    });
  }
  
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  // Organize events by weekend
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
      dayName: days[date.getDay()],
      dayDate: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      isReturn: isReturnTransport(summary, event.location)
    };
    
    for (const wd of weekendData) {
      if (belongsToWeekend(date, wd.weekend)) {
        if (isTransportEvent(summary)) {
          wd.transports.push(info);
        } else if (isWeekendEvent(date, wd.weekend)) {
          wd.events.push(info);
        }
      }
    }
  }
  
  // Generate report
  let report = '🗓️ WEEKENDS - 2 PROCHAINS MOIS\n';
  report += '='.repeat(60) + '\n\n';
  
  for (const wd of weekendData) {
    if (wd.events.length === 0 && wd.transports.length === 0) continue;
    
    const satStr = wd.weekend.sat.toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short'
    });
    const sunStr = wd.weekend.sun.toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short'
    });
    
    report += `## 📅 Weekend ${satStr} - ${sunStr}\n\n`;
    
    // Events
    if (wd.events.length > 0) {
      report += '**📍 Événements :**\n';
      for (const evt of wd.events) {
        report += `  • ${evt.dayName} ${evt.dayDate} ${evt.time} - ${evt.summary}\n`;
        if (evt.location) {
          report += `    📍 ${evt.location}\n`;
        }
      }
      report += '\n';
    }
    
    // Transports
    if (wd.transports.length > 0) {
      report += '**🚂 Transports :**\n';
      
      const outbound = wd.transports.filter((t: any) => !t.isReturn);
      const returns = wd.transports.filter((t: any) => t.isReturn);
      
      for (const tr of outbound) {
        report += `  • ${tr.dayName} ${tr.dayDate} ${tr.time} - ${tr.summary}\n`;
        if (tr.location) {
          report += `    ${tr.location}\n`;
        }
      }
      
      for (const tr of returns) {
        report += `  • ${tr.dayName} ${tr.dayDate} ${tr.time} - ${tr.summary}\n`;
        if (tr.location) {
          report += `    ${tr.location}\n`;
        }
      }
      
      report += '\n';
      
      if (outbound.length > 0 && returns.length > 0) {
        report += '✅ **Aller + Retour OK**\n\n';
      } else if (outbound.length > 0 && returns.length === 0) {
        report += '⚠️ **Manque le retour**\n\n';
      } else if (outbound.length === 0 && returns.length > 0) {
        report += '⚠️ **Manque l\'aller**\n\n';
      }
    } else if (wd.events.length > 0) {
      const needsTransport = wd.events.some((e: any) => {
        const lower = e.summary.toLowerCase();
        return lower.includes('strasbourg') || lower.includes('paris') || 
               lower.includes('lyon') || lower.includes('lille') || 
               lower.includes('disney') || lower.includes('racketlon');
      });
      
      if (needsTransport) {
        report += '⚠️ **Transport à réserver (aller + retour)**\n\n';
      }
    }
    
    report += '-'.repeat(60) + '\n\n';
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
