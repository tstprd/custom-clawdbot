/**
 * Get full email content and download attachments
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JULES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const ATTACHMENTS_DIR = join(process.cwd(), 'claustra-docs');

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

async function getMessage(tokens: any, messageId: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

async function getAttachment(tokens: any, messageId: string, attachmentId: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

function decodeBase64(str: string): string {
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch {
    return str;
  }
}

function decodeBase64ToBuffer(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
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

function getAttachmentParts(message: any): any[] {
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
  const messageId = '19b93c6ac0bd0c60'; // Latest email from Mabilais
  
  const tokens = await getTokens(TOKEN_PATH_JULES);
  const message = await getMessage(tokens, messageId);
  
  const body = getBody(message);
  const attachments = getAttachmentParts(message);
  
  let report = '📧 EMAIL MABILAIS CLAUSTRAS\n';
  report += '='.repeat(60) + '\n\n';
  report += `CONTENU EMAIL:\n\n${body}\n\n`;
  report += '='.repeat(60) + '\n\n';
  
  // Create attachments directory
  if (!existsSync(ATTACHMENTS_DIR)) {
    mkdirSync(ATTACHMENTS_DIR, { recursive: true });
  }
  
  report += `📎 PIÈCES JOINTES (${attachments.length}):\n\n`;
  
  for (const att of attachments) {
    report += `- ${att.filename} (${Math.round(att.size / 1024)}KB)\n`;
    
    // Download PDF/important files only
    if (att.filename.toUpperCase().endsWith('.PDF')) {
      const attData = await getAttachment(tokens, messageId, att.attachmentId);
      const buffer = decodeBase64ToBuffer(attData.data);
      const filePath = join(ATTACHMENTS_DIR, att.filename);
      writeFileSync(filePath, buffer);
      report += `  ✅ Téléchargé: ${filePath}\n`;
    }
  }
  
  report += `\n📁 Documents sauvegardés dans: ${ATTACHMENTS_DIR}\n`;
  
  writeFileSync(OUTPUT_FILE, report);
}

main();
