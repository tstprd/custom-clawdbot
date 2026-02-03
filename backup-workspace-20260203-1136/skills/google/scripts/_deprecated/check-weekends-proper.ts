/**
 * Proper weekend check with:
 * - Real weekend days (Sat-Sun)
 * - Outbound + return transport verification
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
  
  // Find next 8 weekends (Sat-Sun pairs)
  let current = new Date(today);
  
  for (let i = 0; i < 60; i++) { // Check 60 days
    const day = current.getDay();
    
    if (day === 6) { // Saturday
      const saturday = new Date(current);
      const sunday = new Date(current);
      sunday.setDate(saturday.getDate() + 1);
      
      weekends.push({
        sat: saturday,
        sun: sunday,
        label: `${saturday.getDate()}/${saturday.getMonth() + 1}/${saturday.getFullYear()}`
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return weekends.slice(0, 8);
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

function touchesWeekend(eventDate: Date, weekend: any): boolean {
  const friday = new Date(weekend.sat);
  friday.setDate(friday.getDate() - 1);
  const monday = new Date(weekend.sun);
  monday.setDate(monday.getDate() + 1);
  
  return eventDate >= friday && eventDate <= monday;
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
  
  // Organize events by weekend
  for (const event of data.items || []) {
    const summary = event.summary || '';
    if (isALEvent(summary)) continue;
    
    const start = event.start.date || event.start.dateTime;
    const date = new Date(start);
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    const info = {
      date,
      summary,
      location: event.location,
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dayName: days[date.getDay()],
      dayDate: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    };
    
    for (const wd of weekendData) {
      if (touchesWeekend(date, wd.weekend)) {
        if (isTransportEvent(summary)) {
          wd.transports.push(info);
        } else {
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
          report += `    ${evt.location}\n`;
        }
      }
      report += '\n';
    }
    
    // Transports
    if (wd.transports.length > 0) {
      report += '**🚂 Transports :**\n';
      for (const tr of wd.transports) {
        report += `  • ${tr.dayName} ${tr.dayDate} ${tr.time} - ${tr.summary}\n`;
        if (tr.location) {
          report += `    ${tr.location}\n`;
        }
      }
      report += '\n';
      
      // Check for outbound + return
      const hasOutbound = wd.transports.some((t: any) => 
        !t.summary.toLowerCase().includes('rennes') || 
        (t.location && !t.location.toLowerCase().includes('rennes'))
      );
      const hasReturn = wd.transports.some((t: any) => 
        t.summary.toLowerCase().includes('rennes')
      );
      
      if (hasOutbound && hasReturn) {
        report += '✅ **Aller + Retour OK**\n\n';
      } else if (hasOutbound && !hasReturn) {
        report += '⚠️ **Manque le retour**\n\n';
      } else if (!hasOutbound && hasReturn) {
        report += '⚠️ **Manque l\'aller**\n\n';
      }
    } else if (wd.events.length > 0) {
      // Check if events need transport
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
