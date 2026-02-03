/**
 * Simplified calendar event creation
 * Usage: pnpm tsx add-calendar-event.ts "Title" "YYYY-MM-DD HH:MM" [duration_minutes]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text);
  console.log(text);
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

async function getTokens(): Promise<Tokens> {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found.');
  }
  
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
    if (newTokens.error) {
      throw new Error(`Token refresh failed: ${newTokens.error}`);
    }
    
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

async function addEvent(summary: string, dateTime: string, duration: number): Promise<void> {
  try {
    let start: Date;
    if (dateTime.includes('T')) {
      start = new Date(dateTime);
    } else {
      const parts = dateTime.split(' ');
      if (parts.length === 2) {
        start = new Date(`${parts[0]}T${parts[1]}:00`);
      } else {
        start = new Date(dateTime);
      }
    }
    
    if (isNaN(start.getTime())) {
      output(`Error: Invalid date format: ${dateTime}`);
      return;
    }
    
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    const event = {
      summary,
      start: { dateTime: start.toISOString(), timeZone: 'Europe/Paris' },
      end: { dateTime: end.toISOString(), timeZone: 'Europe/Paris' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 }
        ]
      }
    };
    
    const data = await apiRequest(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      { method: 'POST', body: JSON.stringify(event) }
    );
    
    if (data.error) {
      output(`Error: ${data.error.message}`);
      return;
    }
    
    output(`✅ Événement créé: ${summary}\n📆 ${start.toLocaleString('fr-FR')}`);
  } catch (error) {
    output(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: pnpm tsx add-calendar-event.ts "Title" "YYYY-MM-DD HH:MM" [duration_min]');
  process.exit(1);
}

const title = args[0];
const dateTime = args[1];
const duration = parseInt(args[2]) || 60;

addEvent(title, dateTime, duration)
  .catch(err => {
    output(`Fatal error: ${err.message}`);
    process.exit(1);
  });
