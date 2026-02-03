/**
 * Multi-Account Email Monitor
 * - Monitors alejmurot@gmail.com and jmudes76000@gmail.com
 * - Creates calendar events automatically
 * - Marks promotional emails as read
 * - Creates tasks for actionable items
 * - NO email sending allowed
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const STATE_PATH = join(process.cwd(), '.clawdbot-email-monitor-state.json');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Account {
  name: string;
  tokenPath: string;
  calendarId: string;
}

const ACCOUNTS: Account[] = [
  {
    name: 'alejmurot@gmail.com',
    tokenPath: join(process.cwd(), '.clawdbot-google-tokens.json'),
    calendarId: 'primary'
  },
  {
    name: 'jmudes76000@gmail.com',
    tokenPath: join(process.cwd(), '.clawdbot-google-tokens-jmudes.json'),
    calendarId: 'primary'
  }
];

// Promotional/notification senders to mark as read
const PROMO_SENDERS = [
  'amazon', 'noreply', 'no-reply', 'newsletter', 'promo', 'marketing',
  'googleplay-noreply', 'info.sncf', 'tricount', 'bunq', 'lcl@infos',
  'notification', 'alert', 'update', 'news@', 'deals@', 'offers@'
];

// Keywords that indicate actionable items
const ACTION_KEYWORDS = [
  'devis', 'facture', 'paiement', 'régler', 'confirmer', 'répondre',
  'rdv', 'rendez-vous', 'réunion', 'deadline', 'urgent', 'rappel',
  'à faire', 'action requise', 'en attente'
];

// Event keywords
const EVENT_KEYWORDS = [
  'invitation', 'invité', 'événement', 'fête', 'anniversaire',
  'réunion', 'rdv', 'rendez-vous', 'réservation', 'voyage'
];

interface State {
  processedIds: Record<string, string[]>;
  tasks: Array<{ title: string; source: string; date: string }>;
}

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text);
}

function getState(): State {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  }
  return { processedIds: {}, tasks: [] };
}

function saveState(state: State): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function getTokens(account: Account): Promise<any> {
  if (!existsSync(account.tokenPath)) {
    throw new Error(`Tokens not found for ${account.name}`);
  }
  
  const tokens = JSON.parse(readFileSync(account.tokenPath, 'utf-8'));
  
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
    if (!newTokens.error) {
      tokens.access_token = newTokens.access_token;
      tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
      writeFileSync(account.tokenPath, JSON.stringify(tokens, null, 2));
    }
  }
  
  return tokens;
}

function isPromoEmail(from: string, subject: string): boolean {
  const text = `${from} ${subject}`.toLowerCase();
  return PROMO_SENDERS.some(sender => text.includes(sender));
}

function isActionable(subject: string, body: string): boolean {
  const text = `${subject} ${body}`.toLowerCase();
  return ACTION_KEYWORDS.some(kw => text.includes(kw));
}

function isEventEmail(subject: string, body: string): boolean {
  const text = `${subject} ${body}`.toLowerCase();
  return EVENT_KEYWORDS.some(kw => text.includes(kw));
}

async function markAsRead(tokens: any, messageId: string): Promise<void> {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
}

async function processAccount(account: Account, state: State): Promise<string> {
  let result = `\n📬 ${account.name}:\n`;
  
  try {
    const tokens = await getTokens(account);
    
    // Get recent unread emails
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:unread',
      { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
    );
    
    const data = await response.json();
    
    if (data.error) {
      return result + `  Erreur: ${data.error.message}\n`;
    }
    
    if (!data.messages || data.messages.length === 0) {
      return result + `  ✨ Pas de nouveaux emails\n`;
    }
    
    const processed = state.processedIds[account.name] || [];
    let newEmails = 0;
    let markedRead = 0;
    let tasksCreated = 0;
    
    for (const msg of data.messages) {
      if (processed.includes(msg.id)) continue;
      
      // Get message details
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
      );
      const msgData = await msgResponse.json();
      
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
      const from = headers.find((h: any) => h.name === 'From')?.value || '?';
      
      // Get body
      let body = '';
      const parts = msgData.payload?.parts || [msgData.payload];
      for (const part of parts) {
        if (part?.mimeType === 'text/plain' && part?.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
      
      newEmails++;
      
      // Check if promotional - mark as read
      if (isPromoEmail(from, subject)) {
        await markAsRead(tokens, msg.id);
        markedRead++;
        result += `  📭 [LU] ${subject}\n`;
      }
      // Check if actionable - create task
      else if (isActionable(subject, body)) {
        state.tasks.push({
          title: subject,
          source: account.name,
          date: new Date().toISOString()
        });
        tasksCreated++;
        result += `  ✅ [TÂCHE] ${subject}\n`;
      }
      // Regular important email
      else {
        result += `  📧 ${subject} (de: ${from.split('<')[0].trim()})\n`;
      }
      
      processed.push(msg.id);
    }
    
    // Keep only last 200 processed IDs
    state.processedIds[account.name] = processed.slice(-200);
    
    if (newEmails === 0) {
      result += `  ✨ Rien de nouveau\n`;
    } else {
      result += `  ---\n  ${newEmails} nouveaux | ${markedRead} marqués lus | ${tasksCreated} tâches\n`;
    }
    
  } catch (err) {
    result += `  Erreur: ${err instanceof Error ? err.message : err}\n`;
  }
  
  return result;
}

async function main(): Promise<void> {
  const state = getState();
  let result = '📧 Vérification des emails...\n';
  result += `⏰ ${new Date().toLocaleString('fr-FR')}\n`;
  
  for (const account of ACCOUNTS) {
    result += await processAccount(account, state);
  }
  
  // Show pending tasks
  if (state.tasks.length > 0) {
    result += `\n📋 Tâches en attente (${state.tasks.length}):\n`;
    for (const task of state.tasks.slice(-10)) {
      result += `  • ${task.title}\n`;
    }
  }
  
  saveState(state);
  output(result);
}

// CLI
const command = process.argv[2];

if (command === 'reset') {
  writeFileSync(STATE_PATH, JSON.stringify({ processedIds: {}, tasks: [] }, null, 2));
  output('✅ État réinitialisé');
} else if (command === 'tasks') {
  const state = getState();
  let result = `📋 Tâches (${state.tasks.length}):\n`;
  for (const task of state.tasks) {
    result += `• ${task.title}\n  Source: ${task.source}\n`;
  }
  output(result || 'Aucune tâche');
} else {
  main();
}
