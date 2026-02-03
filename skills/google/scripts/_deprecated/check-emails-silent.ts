/**
 * Silent email check - only report if important
 * Run hourly between 9h-23h
 */

import { readFileSync, writeFileSync } from 'fs';
import { TOKENS_ALEJMUROT, TOKENS_JMUDES, OUTPUT_FILE } from './_paths.js';

const TOKEN_PATH_ALEJMUROT = TOKENS_ALEJMUROT;
const TOKEN_PATH_JMUDES = TOKENS_JMUDES;

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

async function apiRequest(url: string, tokenPath: string): Promise<any> {
  const tokens = await getTokens(tokenPath);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

async function checkAccount(tokenPath: string, accountName: string): Promise<string[]> {
  const important: string[] = [];
  
  // Get recent unread emails (last hour)
  const query = 'is:unread newer_than:1h';
  const data = await apiRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    tokenPath
  );
  
  if (!data.messages || data.messages.length === 0) {
    return important;
  }
  
  // Keywords for important emails
  const importantKeywords = [
    'urgent', 'expire', 'facture', 'paiement', 'confirmation',
    'rdv', 'rendez-vous', 'réservation', 'anticor', 'datalab'
  ];
  
  for (const msg of data.messages) {
    const details = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      tokenPath
    );
    
    const subject = details.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
    const from = details.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
    
    // Check if important
    const subjectLower = subject.toLowerCase();
    const isImportant = importantKeywords.some(kw => subjectLower.includes(kw));
    
    if (isImportant) {
      important.push(`[${accountName}] ${subject} (de: ${from})`);
    }
  }
  
  return important;
}

async function main(): Promise<void> {
  try {
    // Check time - only run between 9h and 23h (Paris time)
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 9 || hour >= 23) {
      writeFileSync(OUTPUT_FILE, '🔇 Mode silence (23h-9h)');
      return;
    }
    
    const importantEmails: string[] = [];
    
    // Check both accounts
    const alejmurotImportant = await checkAccount(TOKEN_PATH_ALEJMUROT, 'alejmurot');
    const jmudesImportant = await checkAccount(TOKEN_PATH_JMUDES, 'jmudes');
    
    importantEmails.push(...alejmurotImportant, ...jmudesImportant);
    
    // Only write output if there are important emails
    if (importantEmails.length > 0) {
      let result = `📧 Emails importants détectés (${now.toLocaleTimeString('fr-FR')}):\n\n`;
      result += importantEmails.join('\n');
      writeFileSync(OUTPUT_FILE, result);
      console.log(result);
    } else {
      writeFileSync(OUTPUT_FILE, '');  // Empty = no notification needed
    }
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
