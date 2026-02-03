/**
 * Delete Disney Lille + Update AL Nord events to green
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
  
  if (options.method === 'DELETE') {
    return { success: response.ok };
  }
  
  return response.json();
}

async function main(): Promise<void> {
  try {
    let result = '📅 Modifications agenda:\n';
    
    // 1. Delete Disney Lille
    const disneyLilleId = '6osj8p9n71hj6b9jc8p3ib9kcli30bb2ccqm2b9g60q64c3664s3ap1hck';
    
    await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${disneyLilleId}`,
      { method: 'DELETE' }
    );
    
    result += '\n🗑️ Supprimé: Disney+ Lille adeo (13-16 janvier)';
    
    // 2. Find AL Nord events
    const timeMin = '2026-01-01T00:00:00Z';
    const timeMax = '2026-02-01T00:00:00Z';
    
    const data = await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
    );
    
    result += '\n\n🔍 Recherche déplacements AL Nord:\n';
    
    const alNordKeywords = ['al', 'anne-laure', 'nord', 'lille', 'strasbourg'];
    
    for (const event of data.items || []) {
      const summary = (event.summary || '').toLowerCase();
      
      // Check if multi-day
      const start = event.start?.date || event.start?.dateTime;
      const end = event.end?.date || event.end?.dateTime;
      
      if (!start || !end) continue;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const isMultiDay = diffDays > 1;
      
      // Check if it's an AL Nord event
      const isALNord = alNordKeywords.some(kw => summary.includes(kw)) && isMultiDay;
      
      if (isALNord) {
        // Update to green (10) + remove reminders
        const update = {
          colorId: '10',  // Green
          reminders: {
            useDefault: false,
            overrides: []
          }
        };
        
        await apiRequest(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
          { method: 'PATCH', body: JSON.stringify(update) }
        );
        
        result += `\n✅ ${event.summary}`;
        result += `\n   📅 ${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`;
        result += `\n   🟢 Mis en vert`;
        result += `\n   🔇 Notifications supprimées`;
      }
    }
    
    result += '\n\n✨ Terminé!';
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
