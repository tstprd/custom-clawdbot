#!/usr/bin/env tsx
/**
 * Morning Rollup - Récap emails + calendrier avec UX optimale
 * Format inspiré du skill morning-email-rollup mais avec notre auth existante
 */

import { readFileSync, writeFileSync } from 'fs';
import { TOKENS_ALEJMUROT, TOKENS_JMUDES, OUTPUT_FILE } from './_paths.js';

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

const MAX_EMAILS = 10;

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  isUnread: boolean;
  date: Date;
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

async function getTokens(tokenPath: string): Promise<Tokens> {
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
    
    const newTokens = await response.json() as any;
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(url: string, tokenPath: string): Promise<any> {
  const tokens = await getTokens(tokenPath);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  return response.json();
}

async function getCalendarEvents(tokenPath: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`;

  try {
    const data = await apiRequest(url, tokenPath);
    return (data.items || []).map((event: any) => ({
      title: event.summary || "(Sans titre)",
      start: new Date(event.start?.dateTime || event.start?.date || ""),
      end: new Date(event.end?.dateTime || event.end?.date || ""),
      isAllDay: !event.start?.dateTime,
    }));
  } catch {
    return [];
  }
}

async function getImportantEmails(tokenPath: string): Promise<Email[]> {
  const query = encodeURIComponent('(is:important OR is:starred) newer_than:1d');
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${MAX_EMAILS}`;

  try {
    const data = await apiRequest(url, tokenPath);
    const messages = data.messages || [];
    const emails: Email[] = [];

    for (const msg of messages) {
      const detailUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
      const detail = await apiRequest(detailUrl, tokenPath);

      const headers = detail.payload?.headers || [];
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sans objet)';
      const dateStr = headers.find((h: any) => h.name === 'Date')?.value || '';
      const isUnread = detail.labelIds?.includes('UNREAD') || false;

      // Extraire le nom de l'expéditeur
      const senderMatch = from.match(/^([^<]+)/);
      const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : from;

      emails.push({
        id: msg.id,
        from: senderName.substring(0, 30), // Limiter la longueur
        subject: subject.substring(0, 60), // Limiter la longueur
        snippet: detail.snippet || '',
        isUnread,
        date: new Date(dateStr),
      });
    }

    return emails;
  } catch {
    return [];
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const formatted = new Date().toLocaleDateString('fr-FR', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function cleanSnippet(snippet: string): string {
  return snippet
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .substring(0, 150);
}

async function main() {
  const lines: string[] = [];

  // Header avec emoji et date
  lines.push(`📧 **Récap du moment** - ${formatDate()}`);
  lines.push('');

  // === CALENDRIER ===
  const allEvents: CalendarEvent[] = [];
  
  for (const tokenPath of [TOKENS_ALEJMUROT, TOKENS_JMUDES]) {
    try {
      const events = await getCalendarEvents(tokenPath);
      allEvents.push(...events);
    } catch {
      // Silently ignore
    }
  }

  // Dédupliquer par titre + heure de début
  const uniqueEvents = allEvents.filter(
    (event, index, self) =>
      index === self.findIndex((e) => 
        e.title === event.title && e.start.getTime() === event.start.getTime()
      )
  );
  uniqueEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  if (uniqueEvents.length > 0) {
    lines.push(`📅 **${uniqueEvents.length} événement(s) aujourd'hui**`);
    for (const event of uniqueEvents) {
      if (event.isAllDay) {
        lines.push(`• ${event.title} - Toute la journée`);
      } else {
        lines.push(`• ${event.title} - ${formatTime(event.start)} à ${formatTime(event.end)}`);
      }
    }
    lines.push('');
  }

  // === EMAILS ===
  const allEmails: Email[] = [];

  for (const tokenPath of [TOKENS_ALEJMUROT, TOKENS_JMUDES]) {
    try {
      const emails = await getImportantEmails(tokenPath);
      allEmails.push(...emails);
    } catch {
      // Silently ignore
    }
  }

  // Trier par date (plus récent d'abord) et limiter
  allEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
  const topEmails = allEmails.slice(0, MAX_EMAILS);

  if (topEmails.length > 0) {
    lines.push(`📧 **${topEmails.length} email(s) important(s) des dernières 24h**`);
    lines.push('');

    for (const email of topEmails) {
      const marker = email.isUnread ? '🔴' : '🟢';
      lines.push(`${marker} **${email.from}: ${email.subject}**`);
      lines.push(`   ${cleanSnippet(email.snippet)}`);
      lines.push('');
    }
  } else {
    lines.push('✅ Aucun email important dans les dernières 24h.');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push("💡 **Besoin de détails?** Demandez-moi de lire un email spécifique.");

  const output = lines.join('\n');
  writeFileSync(OUTPUT_FILE, output);
  console.log(output);
}

main().catch(console.error);
