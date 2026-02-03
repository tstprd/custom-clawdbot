/**
 * Mark emails matching a search query as read
 * Usage: pnpm tsx skills/google/scripts/mark-search-read.ts <account> "<query>"
 * Example: pnpm tsx skills/google/scripts/mark-search-read.ts alejmurot "from:leroy"
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_ALEJMUROT = join(process.cwd(), '.clawdbot-google-tokens.json');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
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

async function main(): Promise<void> {
  const [,, account, query] = process.argv;
  
  if (!account || !query) {
    console.log('Usage: pnpm tsx mark-search-read.ts <account> "<query>"');
    console.log('  account: jmudes or alejmurot');
    console.log('  query: Gmail search query (e.g., "from:leroy is:unread")');
    process.exit(1);
  }
  
  const tokenPath = account === 'jmudes' ? TOKEN_PATH_JMUDES : TOKEN_PATH_ALEJMUROT;
  const tokens = await getTokens(tokenPath);
  
  // Add is:unread to query if not present
  const searchQuery = query.includes('is:unread') ? query : `is:unread ${query}`;
  
  // Search for emails
  const searchResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=50`,
    { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
  );
  const searchData = await searchResponse.json() as any;
  
  if (!searchData.messages || searchData.messages.length === 0) {
    console.log('Aucun email trouvé');
    return;
  }
  
  console.log(`${searchData.messages.length} email(s) trouvé(s)`);
  
  for (const msg of searchData.messages) {
    // Get subject
    const detailsResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
      { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
    );
    const details = await detailsResponse.json() as any;
    const subject = details.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(sans sujet)';
    
    // Mark as read
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      }
    );
    
    console.log(`✅ ${subject}`);
  }
  
  console.log(`\n${searchData.messages.length} email(s) marqué(s) comme lu(s)`);
}

main();
