/**
 * Mark specific emails as read
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_ALEJMUROT = join(process.cwd(), '.clawdbot-google-tokens.json');
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

async function markAsRead(tokenPath: string, accountName: string): Promise<string> {
  let result = `📧 ${accountName}:\n`;
  
  // Search for today's unread emails with keywords
  const query = 'is:unread newer_than:1d (subject:pictures OR subject:mail OR subject:élection OR subject:election OR subject:listes électorales)';
  
  const searchData = await apiRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    tokenPath
  );
  
  if (!searchData.messages || searchData.messages.length === 0) {
    result += '  Aucun email à marquer';
    return result;
  }
  
  let marked = 0;
  
  for (const msg of searchData.messages) {
    // Get email details
    const details = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      tokenPath
    );
    
    const subject = details.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
    
    // Mark as read
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
    
    result += `\n  ✅ ${subject}`;
    marked++;
  }
  
  result += `\n\n  📊 ${marked} email(s) marqué(s) comme lu(s)`;
  
  return result;
}

async function main(): Promise<void> {
  try {
    let result = '📬 Marquage des emails comme lus:\n\n';
    
    // Check both accounts
    result += await markAsRead(TOKEN_PATH_JMUDES, 'jmudes76000@gmail.com');
    result += '\n\n';
    result += await markAsRead(TOKEN_PATH_ALEJMUROT, 'alejmurot@gmail.com');
    
    result += '\n\n✨ Terminé!';
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
