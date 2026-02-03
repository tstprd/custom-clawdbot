/**
 * Check calendar for next week
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
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
    
    const newTokens = await response.json() as any;
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const tokens = await getTokens();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

async function main(): Promise<void> {
  try {
    // Next week: 13-19 January 2026
    const timeMin = '2026-01-13T00:00:00Z';
    const timeMax = '2026-01-20T00:00:00Z';
    
    const data = await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
    );
    
    let result = '📅 Agenda semaine prochaine (13-19 janvier 2026):\n';
    
    const alEvents: any[] = [];
    
    for (const event of data.items || []) {
      const start = event.start?.date || event.start?.dateTime;
      const end = event.end?.date || event.end?.dateTime;
      
      if (!start || !end) continue;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      const summary = event.summary || 'Sans titre';
      const colorId = event.colorId;
      
      result += `\n• ${summary}`;
      result += `\n  📅 ${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`;
      if (colorId) result += `\n  🎨 Couleur: ${colorId} ${colorId === '10' ? '(vert - AL)' : colorId === '11' ? '(rouge - Jules)' : ''}`;
      
      // Check if AL event (green = color 10)
      if (colorId === '10' || summary.toLowerCase().includes('al ') || summary.toLowerCase().includes('anne-laure')) {
        alEvents.push({
          summary,
          start: startDate,
          end: endDate
        });
      }
    }
    
    result += '\n\n📊 Déplacements Anne-Laure:\n';
    
    if (alEvents.length === 0) {
      result += '  Aucun déplacement prévu';
    } else {
      for (const evt of alEvents) {
        result += `\n• ${evt.summary}`;
        result += `\n  Du ${evt.start.toLocaleDateString('fr-FR')} au ${evt.end.toLocaleDateString('fr-FR')}`;
      }
    }
    
    // Analyze week presence
    result += '\n\n📅 Analyse présence Anne-Laure (13-19 janvier):';
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const weekStart = new Date('2026-01-13'); // Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      
      let isAway = false;
      for (const evt of alEvents) {
        if (day >= evt.start && day < evt.end) {
          isAway = true;
          break;
        }
      }
      
      result += `\n  ${daysOfWeek[i]} ${day.getDate()}/01: ${isAway ? '❌ Absente' : '✅ Présente'}`;
    }
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
