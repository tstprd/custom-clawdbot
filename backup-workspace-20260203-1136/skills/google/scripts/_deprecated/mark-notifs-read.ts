/**
 * Mark notification emails as read (LCL, Amazon, etc)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
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

async function apiRequest(url: string, tokenPath: string, options: RequestInit = {}): Promise<any> {
  const tokens = await getTokens(tokenPath);
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

async function markNotificationsRead(tokenPath: string): Promise<string> {
  let result = '';
  
  // Patterns for notification emails to auto-mark as read
  const queries = [
    'from:LCL@infos.lcl.fr subject:"virement"',
    'from:shipment-tracking@amazon.fr',
    'from:order-update@amazon.fr',
  ];
  
  let totalMarked = 0;
  
  for (const query of queries) {
    const fullQuery = `is:unread newer_than:1d ${query}`;
    
    const searchData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(fullQuery)}&maxResults=50`,
      tokenPath
    );
    
    if (!searchData.messages || searchData.messages.length === 0) {
      continue;
    }
    
    for (const msg of searchData.messages) {
      const details = await apiRequest(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        tokenPath
      );
      
      const subject = details.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
      
      await apiRequest(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
        tokenPath,
        {
          method: 'POST',
          body: JSON.stringify({
            removeLabelIds: ['UNREAD']
          })
        }
      );
      
      result += `✅ ${subject}\n`;
      totalMarked++;
    }
  }
  
  if (totalMarked === 0) {
    return 'Aucune notification à marquer comme lue';
  }
  
  return `${result}\n📊 ${totalMarked} notification(s) marquée(s) comme lue(s)`;
}

async function main(): Promise<void> {
  try {
    const result = await markNotificationsRead(TOKEN_PATH_JMUDES);
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
