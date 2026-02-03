/**
 * Check January calendar events
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

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
    // Get primary calendar
    const timeMin = '2026-01-01T00:00:00Z';
    const timeMax = '2026-02-01T00:00:00Z';
    
    const data = await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
    );
    
    let result = '📅 Événements Janvier 2026:\n';
    
    const multiDayEvents: any[] = [];
    
    for (const event of data.items || []) {
      const start = event.start?.date || event.start?.dateTime;
      const end = event.end?.date || event.end?.dateTime;
      
      if (!start || !end) continue;
      
      // Check if multi-day event
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const isMultiDay = diffDays > 1 || event.start?.date; // all-day events
      
      result += `\n• ${event.summary || 'Sans titre'}`;
      result += `\n  📅 ${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`;
      
      if (isMultiDay) {
        result += ` (${diffDays} jours)`;
        multiDayEvents.push({
          id: event.id,
          summary: event.summary,
          start: startDate,
          end: endDate,
          days: diffDays
        });
      }
      
      if (event.reminders?.overrides) {
        result += `\n  ⏰ ${event.reminders.overrides.length} rappel(s)`;
      }
      
      if (event.colorId) {
        result += `\n  🎨 Couleur: ${event.colorId}`;
      }
    }
    
    result += '\n\n📊 Événements multi-jours:\n';
    for (const evt of multiDayEvents) {
      result += `\n• ${evt.summary} (${evt.days} jours)`;
      result += `\n  ID: ${evt.id}`;
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
