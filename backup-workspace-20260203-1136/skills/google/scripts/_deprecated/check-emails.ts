/**
 * Email Monitor - Analyse les nouveaux emails et crée des événements calendrier
 * Usage: pnpm tsx skills/google/scripts/check-emails.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const STATE_PATH = join(process.cwd(), '.clawdbot-gmail-state.json');
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

interface State {
  lastCheckedHistoryId?: string;
  processedMessageIds: string[];
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

function getState(): State {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  }
  return { processedMessageIds: [] };
}

function saveState(state: State): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
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

// Parse date from various formats
function parseDate(text: string): Date | null {
  // Common French date patterns
  const patterns = [
    // "15 janvier 2026" or "15 janvier"
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*(\d{4})?/i,
    // "15/01/2026" or "15/01"
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
    // "2026-01-15"
    /(\d{4})-(\d{2})-(\d{2})/,
    // "lundi 15 janvier"
    /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
  ];
  
  const months: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth();
      let day = 1;
      
      if (pattern.source.includes('janvier')) {
        // French month name pattern
        day = parseInt(match[1]) || parseInt(match[2]);
        const monthName = (match[2] || match[3]).toLowerCase();
        month = months[monthName] ?? month;
        year = match[3] ? parseInt(match[3]) : (match[4] ? parseInt(match[4]) : year);
      } else if (pattern.source.includes('\\d{4}-')) {
        // ISO format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // DD/MM format
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = match[3] ? parseInt(match[3]) : year;
      }
      
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// Parse time from text
function parseTime(text: string): { hour: number; minute: number } | null {
  const patterns = [
    /(\d{1,2})[h:](\d{2})?/i,
    /(\d{1,2})\s*heures?\s*(\d{2})?/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        hour: parseInt(match[1]),
        minute: parseInt(match[2]) || 0
      };
    }
  }
  
  return null;
}

// Analyze email content for events
function analyzeEmailForEvent(subject: string, body: string, from: string): {
  isEvent: boolean;
  title?: string;
  date?: Date;
  time?: { hour: number; minute: number };
  location?: string;
  needsReminder?: boolean;
  reminderDaysBefore?: number;
} {
  const fullText = `${subject}\n${body}`.toLowerCase();
  
  // Keywords that suggest an event/invitation
  const eventKeywords = [
    'invitation', 'invité', 'convié', 'rendez-vous', 'rdv', 'réunion',
    'événement', 'soirée', 'fête', 'anniversaire', 'mariage', 'cérémonie',
    'réserver', 'réservation', 'confirmer', 'présence', 'rsvp',
    'le lieu', 'à l\'adresse', 'se tiendra', 'aura lieu'
  ];
  
  const isEvent = eventKeywords.some(kw => fullText.includes(kw));
  
  if (!isEvent) {
    return { isEvent: false };
  }
  
  // Extract date
  const date = parseDate(fullText);
  
  // Extract time
  const time = parseTime(fullText);
  
  // Extract location (look for address patterns)
  let location: string | undefined;
  const locationPatterns = [
    /(?:à l'adresse|au|à|lieu\s*:)\s*([^,\n]+(?:,\s*\d{5}\s*[^,\n]+)?)/i,
    /(\d+[^,\n]*(?:rue|avenue|boulevard|place)[^,\n]*)/i,
  ];
  for (const pattern of locationPatterns) {
    const match = body.match(pattern);
    if (match) {
      location = match[1].trim();
      break;
    }
  }
  
  // Determine if reminder is needed (events that require preparation)
  const needsReminderKeywords = ['réserver', 'préparer', 'acheter', 'cadeau', 'tenue', 'dress code'];
  const needsReminder = needsReminderKeywords.some(kw => fullText.includes(kw));
  
  return {
    isEvent: true,
    title: subject,
    date: date || undefined,
    time,
    location,
    needsReminder,
    reminderDaysBefore: needsReminder ? 3 : 1
  };
}

// Create calendar event
async function createCalendarEvent(
  title: string,
  date: Date,
  time?: { hour: number; minute: number },
  location?: string
): Promise<string | null> {
  const start = new Date(date);
  if (time) {
    start.setHours(time.hour, time.minute, 0, 0);
  } else {
    start.setHours(10, 0, 0, 0); // Default to 10:00
  }
  
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
  
  const event: any = {
    summary: title,
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Paris' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Paris' },
  };
  
  if (location) {
    event.location = location;
  }
  
  // Add reminder
  event.reminders = {
    useDefault: false,
    overrides: [
      { method: 'popup', minutes: 24 * 60 }, // 1 day before
      { method: 'popup', minutes: 60 }       // 1 hour before
    ]
  };
  
  const data = await apiRequest(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    { method: 'POST', body: JSON.stringify(event) }
  );
  
  if (data.error) {
    return null;
  }
  
  return data.id;
}

// Main check function
async function checkNewEmails(): Promise<void> {
  const state = getState();
  let result = '📧 Vérification des nouveaux emails...\n\n';
  
  // Get recent messages
  const data = await apiRequest(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10'
  );
  
  if (data.error) {
    output(`Error: ${data.error.message}`);
    return;
  }
  
  const newMessages: string[] = [];
  const eventsCreated: string[] = [];
  
  for (const msg of data.messages || []) {
    // Skip already processed
    if (state.processedMessageIds.includes(msg.id)) {
      continue;
    }
    
    // Get message details
    const msgData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`
    );
    
    const headers = msgData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
    const from = headers.find((h: any) => h.name === 'From')?.value || '?';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '?';
    
    // Get body
    let body = '';
    const parts = msgData.payload?.parts || [msgData.payload];
    for (const part of parts) {
      if (part?.mimeType === 'text/plain' && part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
    }
    if (!body && msgData.payload?.body?.data) {
      body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
    }
    
    newMessages.push(`• ${subject} (de: ${from})`);
    
    // Analyze for events
    const analysis = analyzeEmailForEvent(subject, body, from);
    
    if (analysis.isEvent && analysis.date) {
      // Create calendar event
      const eventId = await createCalendarEvent(
        analysis.title || subject,
        analysis.date,
        analysis.time,
        analysis.location
      );
      
      if (eventId) {
        const dateStr = analysis.date.toLocaleDateString('fr-FR');
        const timeStr = analysis.time ? `${analysis.time.hour}h${analysis.time.minute.toString().padStart(2, '0')}` : '';
        eventsCreated.push(`✅ "${subject}" → 📅 ${dateStr} ${timeStr}`);
      }
    }
    
    // Mark as processed
    state.processedMessageIds.push(msg.id);
  }
  
  // Keep only last 100 processed IDs
  if (state.processedMessageIds.length > 100) {
    state.processedMessageIds = state.processedMessageIds.slice(-100);
  }
  
  saveState(state);
  
  // Build output
  if (newMessages.length === 0) {
    result += '✨ Pas de nouveaux emails.\n';
  } else {
    result += `📬 ${newMessages.length} nouveau(x) email(s):\n`;
    result += newMessages.join('\n') + '\n';
  }
  
  if (eventsCreated.length > 0) {
    result += `\n📅 Événements créés:\n`;
    result += eventsCreated.join('\n') + '\n';
  }
  
  output(result);
}

// Reset state (for testing)
async function reset(): Promise<void> {
  if (existsSync(STATE_PATH)) {
    writeFileSync(STATE_PATH, JSON.stringify({ processedMessageIds: [] }, null, 2));
  }
  output('✅ État réinitialisé. Tous les emails seront re-analysés.');
}

// CLI
const command = process.argv[2];

if (command === 'reset') {
  reset();
} else {
  checkNewEmails();
}
