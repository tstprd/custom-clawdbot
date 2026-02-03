/**
 * List all emails received today
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

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
  return response.json();
}

async function main(): Promise<void> {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySeconds = Math.floor(today.getTime() / 1000);
    
    // Search for emails received after midnight today
    const query = `after:${todaySeconds}`;
    
    const data = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`
    );
    
    let result = `📧 Emails reçus depuis minuit (jmudes76000@gmail.com):\n`;
    result += `⏰ ${new Date().toLocaleString('fr-FR')}\n`;
    
    if (!data.messages || data.messages.length === 0) {
      result += '\n✨ Aucun email reçu aujourd\'hui';
      writeFileSync(OUTPUT_FILE, result);
      return;
    }
    
    result += `\n📊 ${data.messages.length} email(s) reçu(s)\n`;
    
    const emails: any[] = [];
    
    for (const msg of data.messages) {
      const details = await apiRequest(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
      );
      
      const headers = details.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans objet';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Expéditeur inconnu';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      const isUnread = details.labelIds?.includes('UNREAD');
      
      emails.push({
        subject,
        from,
        date,
        isUnread,
        time: new Date(Number(details.internalDate))
      });
    }
    
    // Sort by time (newest first)
    emails.sort((a, b) => b.time.getTime() - a.time.getTime());
    
    // Group by read/unread
    const unread = emails.filter(e => e.isUnread);
    const read = emails.filter(e => !e.isUnread);
    
    if (unread.length > 0) {
      result += `\n📬 NON LUS (${unread.length}):\n`;
      for (const email of unread) {
        result += `\n• ${email.subject}`;
        result += `\n  De: ${email.from}`;
        result += `\n  ${email.time.toLocaleTimeString('fr-FR')}`;
      }
    }
    
    if (read.length > 0) {
      result += `\n\n📭 LUS (${read.length}):\n`;
      for (const email of read) {
        result += `\n• ${email.subject}`;
        result += `\n  De: ${email.from}`;
        result += `\n  ${email.time.toLocaleTimeString('fr-FR')}`;
      }
    }
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
