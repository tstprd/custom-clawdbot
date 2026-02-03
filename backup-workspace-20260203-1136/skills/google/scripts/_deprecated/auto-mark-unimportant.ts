/**
 * Auto-mark unimportant emails as read
 * Run daily, notify only if actions taken
 */

import { readFileSync, writeFileSync } from 'fs';
import { TOKENS_ALEJMUROT, TOKENS_JMUDES, OUTPUT_FILE } from './_paths.js';

const TOKEN_PATH_JMUDES = TOKENS_JMUDES;
const TOKEN_PATH_ALEJMUROT = TOKENS_ALEJMUROT;

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

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

async function markUnimportantAsRead(tokenPath: string): Promise<number> {
  // Keywords for unimportant emails (NO newsletters - keep those unread)
  const unimportantKeywords = [
    'listes électorales',
    'inscription électorale',
    'mise à jour',
    'conditions générales',
    'politique de confidentialité',
    'instagram',
    'rattrapez les moments'
  ];
  
  // Notification emails from specific senders to auto-mark
  const notificationSenders = [
    'from:LCL@infos.lcl.fr subject:"virement"',
    'from:shipment-tracking@amazon.fr',
    'from:order-update@amazon.fr'
  ];
  
  let totalMarked = 0;
  
  // Mark keyword-based unimportant emails
  for (const keyword of unimportantKeywords) {
    const query = `is:unread newer_than:7d subject:"${keyword}"`;
    
    const searchData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      tokenPath
    );
    
    if (searchData.messages) {
      for (const msg of searchData.messages) {
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
        totalMarked++;
      }
    }
  }
  
  // Mark notification emails
  for (const sender of notificationSenders) {
    const query = `is:unread newer_than:7d ${sender}`;
    
    const searchData = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      tokenPath
    );
    
    if (searchData.messages) {
      for (const msg of searchData.messages) {
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
        totalMarked++;
      }
    }
  }
  
  return totalMarked;
}

async function main(): Promise<void> {
  try {
    let totalJmudes = 0;
    let totalAlejmurot = 0;
    
    // Mark unimportant emails on both accounts
    totalJmudes = await markUnimportantAsRead(TOKEN_PATH_JMUDES);
    totalAlejmurot = await markUnimportantAsRead(TOKEN_PATH_ALEJMUROT);
    
    const total = totalJmudes + totalAlejmurot;
    
    // Only write output if emails were marked
    if (total > 0) {
      let result = `📧 Emails peu importants marqués comme lus:\n`;
      if (totalJmudes > 0) result += `\n  • jmudes76000: ${totalJmudes} email(s)`;
      if (totalAlejmurot > 0) result += `\n  • alejmurot: ${totalAlejmurot} email(s)`;
      result += `\n\n📊 Total: ${total} email(s) traité(s)`;
      
      writeFileSync(OUTPUT_FILE, result);
    } else {
      writeFileSync(OUTPUT_FILE, '');  // Empty = no notification
    }
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
