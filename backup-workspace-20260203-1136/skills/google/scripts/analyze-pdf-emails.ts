/**
 * Analyze PDF attachments from emails and prepare draft responses
 * Uses claude-3-5-sonnet-20241022 (cheaper than opus)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { TOKENS_JMUDES, TOKENS_ALEJMUROT, OUTPUT_FILE } from './_paths.js';

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

async function analyzePdfWithClaude(pdfBase64: string, emailSubject: string, emailBody: string): Promise<string> {
  // Get Anthropic API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment');
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: `Analyse ce PDF reçu par email.

Sujet: ${emailSubject}
Corps email: ${emailBody}

Fournis-moi :
1. **Résumé du contenu** : Qu'est-ce que c'est ? (devis, facture, contrat, etc.)
2. **Points clés** : Les informations importantes (montants, dates, actions requises)
3. **Brouillon de réponse** : Propose une réponse adaptée si nécessaire

Sois concis et précis.`
          }
        ]
      }]
    })
  });
  
  const data = await response.json() as any;
  return data.content[0].text;
}

async function processPdfEmails(tokenPath: string, accountName: string): Promise<string> {
  let result = `📧 ${accountName}:\n\n`;
  
  // Search for unread emails with PDF attachments from last 7 days
  const query = 'is:unread has:attachment filename:pdf newer_than:7d';
  
  const searchData = await apiRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
    tokenPath
  );
  
  if (!searchData.messages || searchData.messages.length === 0) {
    return result + '  Aucun email avec PDF à analyser\n';
  }
  
  let processed = 0;
  
  for (const msg of searchData.messages) {
    // Get full email details
    const details = await apiRequest(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      tokenPath
    );
    
    const headers = details.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans sujet';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
    
    // Extract email body
    let emailBody = '';
    if (details.payload?.body?.data) {
      emailBody = Buffer.from(details.payload.body.data, 'base64').toString('utf-8');
    } else if (details.payload?.parts) {
      const textPart = details.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        emailBody = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }
    
    // Find PDF attachments
    const parts = details.payload?.parts || [];
    for (const part of parts) {
      if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
        // Get attachment data
        const attachmentData = await apiRequest(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`,
          tokenPath
        );
        
        if (attachmentData.data) {
          // Analyze PDF with Claude
          const analysis = await analyzePdfWithClaude(
            attachmentData.data,
            subject,
            emailBody.substring(0, 500) // First 500 chars of email body
          );
          
          result += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          result += `📎 ${part.filename}\n`;
          result += `De: ${from}\n`;
          result += `Sujet: ${subject}\n\n`;
          result += analysis;
          result += `\n\n`;
          
          processed++;
        }
      }
    }
  }
  
  if (processed === 0) {
    return result + '  Aucun PDF trouvé dans les emails non lus\n';
  }
  
  result += `\n📊 ${processed} PDF(s) analysé(s)`;
  
  return result;
}

async function main(): Promise<void> {
  try {
    let output = '🤖 Analyse des PDFs dans les emails\n\n';
    
    // Process both accounts
    output += await processPdfEmails(TOKENS_JMUDES, 'jmudes76000@gmail.com');
    output += '\n\n';
    output += await processPdfEmails(TOKENS_ALEJMUROT, 'alejmurot@gmail.com');
    
    writeFileSync(OUTPUT_FILE, output);
    console.log(output);
    
  } catch (err) {
    const error = `❌ Erreur: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
