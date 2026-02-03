/**
 * Split Disney+Lille into 2 events
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
    let result = '📅 Division de l\'événement:\n';
    
    // 1. Delete original event
    const originalId = '70p6ccr361gmcb9i6pgj0b9k6hgjib9o74oj8b9l60o34ohmc5h30cph60';
    
    await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${originalId}`,
      { method: 'DELETE' }
    );
    
    result += '\n🗑️ Supprimé: Disney a paris puis Lille';
    
    // 2. Create Disney event (Monday 19 Jan)
    const disneyEvent = {
      summary: 'Disney',
      start: { date: '2026-01-19' },
      end: { date: '2026-01-20' },
      colorId: '11',  // Red
      reminders: {
        useDefault: false,
        overrides: []
      }
    };
    
    await apiRequest(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      { method: 'POST', body: JSON.stringify(disneyEvent) }
    );
    
    result += '\n\n✅ Créé: Disney';
    result += '\n   📅 Lundi 19 janvier 2026';
    result += '\n   🔴 Rouge';
    
    // 3. Create Lille event (Tuesday 20 - Thursday 22 Jan)
    const lilleEvent = {
      summary: 'Lille',
      start: { date: '2026-01-20' },
      end: { date: '2026-01-23' },  // End date is exclusive
      colorId: '11',  // Red
      reminders: {
        useDefault: false,
        overrides: []
      }
    };
    
    await apiRequest(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      { method: 'POST', body: JSON.stringify(lilleEvent) }
    );
    
    result += '\n\n✅ Créé: Lille';
    result += '\n   📅 Mardi 20 - Jeudi 22 janvier 2026';
    result += '\n   🔴 Rouge';
    
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
