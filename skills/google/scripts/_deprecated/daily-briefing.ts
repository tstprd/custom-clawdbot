#!/usr/bin/env tsx
/**
 * Daily Briefing - Récap complet : Calendrier + Emails + Tâches
 * UX optimale inspirée du skill morning-email-rollup
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { TOKENS_ALEJMUROT, TOKENS_JMUDES, OUTPUT_FILE, REPO_ROOT } from './_paths.js';
import { join } from 'path';

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

const MAX_EMAILS = 5; // Moins d'emails pour un briefing rapide
const MAX_TASKS = 10;

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

interface Email {
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

interface Task {
  title: string;
  due?: string;
  listName: string;
}

// === AUTH ===
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

// === CALENDAR ===
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

// === EMAILS ===
async function getImportantEmails(tokenPath: string): Promise<Email[]> {
  const query = encodeURIComponent('(is:important OR is:starred) newer_than:1d is:unread');
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

      const senderMatch = from.match(/^([^<]+)/);
      const senderName = senderMatch ? senderMatch[1].trim().replace(/"/g, '') : from;

      emails.push({
        from: senderName.substring(0, 25),
        subject: subject.substring(0, 50),
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

// === TASKS ===
async function getTasks(tokenPath: string): Promise<Task[]> {
  try {
    // Get task lists
    const listsData = await apiRequest('https://tasks.googleapis.com/tasks/v1/users/@me/lists', tokenPath);
    const lists = listsData.items || [];
    const tasks: Task[] = [];

    for (const list of lists) {
      const tasksUrl = `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false&maxResults=${MAX_TASKS}`;
      const tasksData = await apiRequest(tasksUrl, tokenPath);
      
      for (const task of (tasksData.items || [])) {
        if (task.title && task.status !== 'completed') {
          tasks.push({
            title: task.title,
            due: task.due,
            listName: list.title,
          });
        }
      }
    }

    return tasks;
  } catch {
    return [];
  }
}

// === GROCY ===
async function getGrocyTasks(): Promise<string[]> {
  const HA_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
  const HA_TOKEN = process.env.HA_TOKEN;
  
  if (!HA_TOKEN) {
    // Try .env.homeassistant
    const envPath = join(REPO_ROOT, '.env.homeassistant');
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      const match = content.match(/HA_TOKEN=(.+)/);
      if (match) process.env.HA_TOKEN = match[1].trim();
    }
  }
  
  if (!process.env.HA_TOKEN) return [];

  try {
    const response = await fetch(`${HA_URL}/api/states/sensor.grocy_chores`, {
      headers: { Authorization: `Bearer ${process.env.HA_TOKEN}` }
    });
    const data = await response.json() as any;
    
    if (!data.attributes?.chores) return [];
    
    // Get overdue or due today
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return data.attributes.chores
      .filter((chore: any) => {
        if (!chore.next_estimated_execution_time) return false;
        const dueDate = chore.next_estimated_execution_time.split(' ')[0];
        return dueDate <= today;
      })
      .map((chore: any) => chore.name);
  } catch {
    return [];
  }
}

// === FORMATTERS ===
function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  const formatted = new Date().toLocaleDateString('fr-FR', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function cleanSnippet(snippet: string): string {
  return snippet
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .substring(0, 100);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Bonjour Sir';
  if (hour < 18) return '☀️ Bon après-midi Sir';
  return '🌙 Bonsoir Sir';
}

// === MAIN ===
async function main() {
  const lines: string[] = [];

  // Header
  lines.push(`${getGreeting()} - ${formatDate()}`);
  lines.push('');

  // === CALENDRIER ===
  const allEvents: CalendarEvent[] = [];
  for (const tokenPath of [TOKENS_ALEJMUROT, TOKENS_JMUDES]) {
    try {
      const events = await getCalendarEvents(tokenPath);
      allEvents.push(...events);
    } catch {}
  }

  const uniqueEvents = allEvents.filter(
    (event, index, self) =>
      index === self.findIndex((e) => 
        e.title === event.title && e.start.getTime() === event.start.getTime()
      )
  );
  uniqueEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Filtrer les événements passés
  const now = new Date();
  const upcomingEvents = uniqueEvents.filter(e => e.end > now || e.isAllDay);

  if (upcomingEvents.length > 0) {
    lines.push(`📅 **Agenda** (${upcomingEvents.length})`);
    for (const event of upcomingEvents.slice(0, 5)) {
      if (event.isAllDay) {
        lines.push(`  • ${event.title}`);
      } else {
        lines.push(`  • ${formatTime(event.start)} ${event.title}`);
      }
    }
    lines.push('');
  }

  // === EMAILS NON LUS ===
  const allEmails: Email[] = [];
  for (const tokenPath of [TOKENS_ALEJMUROT, TOKENS_JMUDES]) {
    try {
      const emails = await getImportantEmails(tokenPath);
      allEmails.push(...emails);
    } catch {}
  }

  allEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
  const unreadEmails = allEmails.filter(e => e.isUnread).slice(0, MAX_EMAILS);

  if (unreadEmails.length > 0) {
    lines.push(`📧 **Emails importants non lus** (${unreadEmails.length})`);
    for (const email of unreadEmails) {
      lines.push(`  🔴 ${email.from}: ${email.subject}`);
    }
    lines.push('');
  }

  // === TÂCHES ===
  const allTasks: Task[] = [];
  for (const tokenPath of [TOKENS_ALEJMUROT, TOKENS_JMUDES]) {
    try {
      const tasks = await getTasks(tokenPath);
      allTasks.push(...tasks);
    } catch {}
  }

  // Tâches dues aujourd'hui ou en retard
  const today = new Date().toISOString().split('T')[0];
  const urgentTasks = allTasks.filter(t => {
    if (!t.due) return false;
    const dueDate = t.due.split('T')[0];
    return dueDate <= today;
  });

  // Grocy chores
  const grocyTasks = await getGrocyTasks();

  if (urgentTasks.length > 0 || grocyTasks.length > 0) {
    lines.push(`✅ **À faire aujourd'hui**`);
    
    for (const task of urgentTasks.slice(0, 5)) {
      lines.push(`  • ${task.title}`);
    }
    
    for (const chore of grocyTasks.slice(0, 3)) {
      lines.push(`  • 🏠 ${chore}`);
    }
    lines.push('');
  }

  // === RÉSUMÉ ===
  if (upcomingEvents.length === 0 && unreadEmails.length === 0 && urgentTasks.length === 0 && grocyTasks.length === 0) {
    lines.push('✨ **Rien d\'urgent pour le moment !**');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('💬 Demandez-moi pour plus de détails');

  const output = lines.join('\n');
  writeFileSync(OUTPUT_FILE, output);
  console.log(output);
}

main().catch(console.error);
