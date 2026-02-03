/**
 * Delete event by search
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
  
  // DELETE returns 204 No Content
  if (response.status === 204) {
    return {};
  }
  
  return response.json();
}

async function deleteEventByName(query: string): Promise<void> {
  try {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + 7);
    
    const data = await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${future.toISOString()}&q=${encodeURIComponent(query)}&singleEvents=true`
    );
    
    if (data.error) {
      output(`Error: ${data.error.message}`);
      return;
    }
    
    if (!data.items || data.items.length === 0) {
      output(`Aucun événement trouvé pour: ${query}`);
      return;
    }
    
    let result = '';
    for (const event of data.items) {
      const deleteData = await apiRequest(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
        { method: 'DELETE' }
      );
      
      result += `✅ Supprimé: ${event.summary}\n`;
    }
    
    output(result);
  } catch (error) {
    output(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const query = process.argv[2];
if (!query) {
  console.error('Usage: pnpm tsx delete-event.ts "search query"');
  process.exit(1);
}

deleteEventByName(query).catch(err => {
  output(`Fatal error: ${err.message}`);
  process.exit(1);
});
