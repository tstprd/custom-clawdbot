/**
 * Google Gmail + Calendar Skill for Clawdbot
 * Usage: pnpm tsx skills/google/scripts/google.ts <command> [args]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
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
  token_type: string;
  scope: string;
}

async function getTokens(): Promise<Tokens> {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found. Run google-auth.mjs first.');
  }
  
  const tokens: Tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
  // Refresh if expired
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

// ============ GMAIL ============

async function listEmails(maxResults = 10, query?: string): Promise<void> {
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  if (query) url += `&q=${encodeURIComponent(query)}`;
  
  const data = await apiRequest(url);
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = `📬 ${data.resultSizeEstimate} emails\n`;
  
  for (const msg of data.messages || []) {
    const msgData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
    );
    
    const headers = msgData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
    const from = headers.find((h: any) => h.name === 'From')?.value || '?';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '?';
    
    result += `\n• ${subject}\n  De: ${from}\n  Date: ${date}\n`;
  }
  
  output(result);
}

async function readEmail(messageId: string): Promise<void> {
  const data = await apiRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  const headers = data.payload?.headers || [];
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
  const from = headers.find((h: any) => h.name === 'From')?.value || '?';
  const date = headers.find((h: any) => h.name === 'Date')?.value || '?';
  
  // Get body
  let body = '';
  const parts = data.payload?.parts || [data.payload];
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      break;
    }
  }
  if (!body && data.payload?.body?.data) {
    body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8');
  }
  
  output(`📧 ${subject}\nDe: ${from}\nDate: ${date}\n\n${body.substring(0, 2000)}`);
}

async function searchInvitations(): Promise<void> {
  // Search for calendar invitations
  const data = await apiRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=filename:invite.ics OR subject:invitation`
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = `📨 Invitations trouvées: ${data.messages?.length || 0}\n`;
  
  for (const msg of data.messages || []) {
    const msgData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
    );
    
    const headers = msgData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
    const from = headers.find((h: any) => h.name === 'From')?.value || '?';
    
    result += `\n• ${subject}\n  De: ${from}\n`;
  }
  
  output(result);
}

// ============ CALENDAR ============

async function listEvents(days = 7): Promise<void> {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  const data = await apiRequest(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${future.toISOString()}&singleEvents=true&orderBy=startTime`
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = `📅 Événements des ${days} prochains jours:\n`;
  
  if (!data.items || data.items.length === 0) {
    result += '\n(Aucun événement)';
  } else {
    for (const event of data.items) {
      const start = event.start?.dateTime || event.start?.date || '?';
      const startDate = new Date(start);
      const dateStr = startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      
      result += `\n• ${event.summary || '(sans titre)'}\n  📆 ${dateStr}\n`;
      if (event.location) result += `  📍 ${event.location}\n`;
    }
  }
  
  output(result);
}

async function todayEvents(): Promise<void> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const data = await apiRequest(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${tomorrow.toISOString()}&singleEvents=true&orderBy=startTime`
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  let result = `📅 Aujourd'hui:\n`;
  
  if (!data.items || data.items.length === 0) {
    result += '\n✨ Rien de prévu !';
  } else {
    for (const event of data.items) {
      const start = event.start?.dateTime || event.start?.date || '?';
      const startDate = new Date(start);
      const timeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      result += `\n• ${timeStr} - ${event.summary || '(sans titre)'}`;
      if (event.location) result += `\n  📍 ${event.location}`;
      result += '\n';
    }
  }
  
  output(result);
}

async function addEvent(summary: string, dateTime: string, duration = 60): Promise<void> {
  try {
    // Parse date - handle both ISO and simple formats
    let start: Date;
    if (dateTime.includes('T')) {
      // ISO format: 2026-01-30T19:00:00
      start = new Date(dateTime);
    } else {
      // Simple format: 2026-01-30 19:00
      const parts = dateTime.split(' ');
      if (parts.length === 2) {
        start = new Date(`${parts[0]}T${parts[1]}:00`);
      } else {
        start = new Date(dateTime);
      }
    }
    
    if (isNaN(start.getTime())) {
      output(`Error: Invalid date format: ${dateTime}. Use YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM`);
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
    output(`Error creating event: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============ CLI ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'emails':
        await listEmails(parseInt(args[1]) || 10, args[2]);
        break;
        
      case 'read':
        if (!args[1]) throw new Error('Usage: read <messageId>');
        await readEmail(args[1]);
        break;
        
      case 'invitations':
        await searchInvitations();
        break;
        
      case 'events':
        await listEvents(parseInt(args[1]) || 7);
        break;
        
      case 'today':
        await todayEvents();
        break;
        
      case 'add-event':
        if (!args[1]) throw new Error('Usage: add-event <titre> <date> [time] [duration_min]');
        // Find the date argument (format: YYYY-MM-DD or contains T)
        const dateArgIndex = args.findIndex((arg, i) => i > 0 && (arg.match(/^\d{4}-\d{2}-\d{2}/) || arg.includes('T')));
        if (dateArgIndex === -1) throw new Error('Date not found. Format: YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM:SS');
        
        // Join all args before date as title
        const title = args.slice(1, dateArgIndex).join(' ');
        let dateTime = args[dateArgIndex];
        let durationArgIndex = dateArgIndex + 1;
        
        // Check if next arg is time (HH:MM format)
        if (args[dateArgIndex + 1] && args[dateArgIndex + 1].match(/^\d{1,2}:\d{2}$/)) {
          dateTime = `${dateTime} ${args[dateArgIndex + 1]}`;
          durationArgIndex = dateArgIndex + 2;
        }
        
        const duration = parseInt(args[durationArgIndex]) || 60;
        
        await addEvent(title, dateTime, duration);
        break;
        
      default:
        output(`Google Gmail + Calendar

Commands:
  emails [n] [query]              Liste les n derniers emails (défaut: 10)
  read <messageId>                Lire un email
  invitations                     Chercher les invitations
  events [days]                   Événements des n prochains jours (défaut: 7)
  today                           Événements d'aujourd'hui
  add-event "titre" "datetime"    Créer un événement

Exemples:
  pnpm tsx google.ts emails 5
  pnpm tsx google.ts emails 10 "from:amazon"
  pnpm tsx google.ts today
  pnpm tsx google.ts add-event "Réunion" "2026-01-15T14:00"
`);
    }
  } catch (err) {
    output(`Error: ${err instanceof Error ? err.message : err}`);
  }
}

main();
