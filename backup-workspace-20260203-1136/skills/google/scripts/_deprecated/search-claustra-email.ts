/**
 * Search for claustra-related emails in both accounts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JULES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_AL = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

async function getTokens(path: string) {
  const tokens = JSON.parse(readFileSync(path, 'utf-8'));
  
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
    writeFileSync(path, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function searchEmails(tokens: any, query: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

async function getMessage(tokens: any, messageId: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

function getHeader(message: any, name: string): string {
  const header = message.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function decodeBase64(str: string): string {
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

function getBody(message: any): string {
  if (message.payload?.body?.data) {
    return decodeBase64(message.payload.body.data);
  }
  
  if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
  }
  
  return '';
}

function getAttachments(message: any): any[] {
  const attachments: any[] = [];
  
  function extractParts(parts: any[] | undefined) {
    if (!parts) return;
    
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
          size: part.body.size
        });
      }
      if (part.parts) {
        extractParts(part.parts);
      }
    }
  }
  
  extractParts(message.payload?.parts);
  return attachments;
}

async function main() {
  const tokensJules = await getTokens(TOKEN_PATH_JULES);
  const tokensAL = await getTokens(TOKEN_PATH_AL);
  
  const queries = [
    'claustra',
    'Nord',
    'Mabilais',
    'subject:claustra',
    'subject:Nord'
  ];
  
  let report = '🔍 RECHERCHE EMAILS CLAUSTRA\n';
  report += '='.repeat(60) + '\n\n';
  
  // Search in both accounts
  for (const [accountName, tokens] of [['jmudes76000@gmail.com', tokensJules], ['alejmurot@gmail.com', tokensAL]]) {
    report += `\n📧 Compte: ${accountName}\n\n`;
    
    let foundAny = false;
    
    for (const query of queries) {
      const results = await searchEmails(tokens, query);
      
      if (results.messages && results.messages.length > 0) {
        foundAny = true;
        
        for (const msgRef of results.messages.slice(0, 3)) { // Max 3 per query
          const message = await getMessage(tokens, msgRef.id);
          
          const subject = getHeader(message, 'Subject');
          const from = getHeader(message, 'From');
          const date = getHeader(message, 'Date');
          const body = getBody(message).slice(0, 500);
          const attachments = getAttachments(message);
          
          report += `\n📨 ${subject}\n`;
          report += `De: ${from}\n`;
          report += `Date: ${date}\n`;
          report += `ID: ${message.id}\n`;
          
          if (attachments.length > 0) {
            report += `📎 Pièces jointes (${attachments.length}):\n`;
            for (const att of attachments) {
              report += `   - ${att.filename} (${att.mimeType}, ${Math.round(att.size / 1024)}KB)\n`;
            }
          }
          
          report += `\nAperçu:\n${body.replace(/\s+/g, ' ').slice(0, 200)}...\n`;
          report += '\n' + '-'.repeat(60) + '\n';
        }
      }
    }
    
    if (!foundAny) {
      report += '   Aucun email trouvé\n';
    }
  }
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
