/**
 * Check both calendars for the next 2 months
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_ALEJMUROT = join(process.cwd(), '.clawdbot-google-tokens.json');
const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text);
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function getTokens(tokenPath: string): Promise<Tokens> {
  if (!existsSync(tokenPath)) {
    throw new Error(`Tokens not found at ${tokenPath}`);
  }
  
  const tokens: Tokens = JSON.parse(readFileSync(tokenPath, 'utf-8'));
  
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
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function getCalendarEvents(tokens: Tokens, accountName: string) {
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
  
  const data = await response.json();
  
  if (data.error) {
    return `❌ Erreur ${accountName}: ${data.error.message}`;
  }
  
  let result = `\n📅 ${accountName}:\n`;
  
  if (!data.items || data.items.length === 0) {
    result += '  (Aucun événement)\n';
    return result;
  }
  
  for (const event of data.items) {
    const start = event.start.date || event.start.dateTime;
    const end = event.end?.date || event.end?.dateTime;
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    result += `\n• ${event.summary || '(Sans titre)'}\n`;
    
    if (event.start.date) {
      result += `  📆 ${startDate.toLocaleDateString('fr-FR')}`;
      if (endDate && endDate.getTime() !== startDate.getTime()) {
        const daysBefore = new Date(endDate);
        daysBefore.setDate(daysBefore.getDate() - 1);
        result += ` → ${daysBefore.toLocaleDateString('fr-FR')}`;
      }
      result += '\n';
    } else {
      result += `  ⏰ ${startDate.toLocaleString('fr-FR')}\n`;
    }
    
    if (event.location) {
      result += `  📍 ${event.location}\n`;
    }
    
    if (event.description) {
      const desc = event.description.substring(0, 100);
      result += `  📝 ${desc}${event.description.length > 100 ? '...' : ''}\n`;
    }
  }
  
  return result;
}

async function main() {
  try {
    let output = '🗓️ Calendriers - 2 prochains mois\n';
    output += '='.repeat(50) + '\n';
    
    // Check alejmurot calendar
    try {
      const tokensAlejmurot = await getTokens(TOKEN_PATH_ALEJMUROT);
      output += await getCalendarEvents(tokensAlejmurot, 'alejmurot@gmail.com');
    } catch (err) {
      output += `\n❌ alejmurot@gmail.com: ${err instanceof Error ? err.message : err}\n`;
    }
    
    // Check jmudes calendar
    try {
      const tokensJmudes = await getTokens(TOKEN_PATH_JMUDES);
      output += await getCalendarEvents(tokensJmudes, 'jmudes76000@gmail.com');
    } catch (err) {
      output += `\n❌ jmudes76000@gmail.com: ${err instanceof Error ? err.message : err}\n`;
    }
    
    writeFileSync(OUTPUT_FILE, output);
  } catch (err) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${err instanceof Error ? err.message : err}`);
  }
}

main();
