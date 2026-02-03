/**
 * Find syndic email with PDF attachment and download it
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JMUDES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const PDF_OUTPUT = join(process.cwd(), 'syndic-pdf.pdf');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

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

async function apiRequest(tokens: any, url: string, options: any = {}) {
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

async function main() {
  try {
    const tokens = await getTokens(TOKEN_PATH_JMUDES);
    
    // Search for syndic emails with PDF in last 60 days
    const query = 'has:attachment filename:pdf (syndic OR "charges copropriété" OR "appel de fonds") newer_than:60d';
    
    const searchData = await apiRequest(
      tokens,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`
    );
    
    if (!searchData.messages || searchData.messages.length === 0) {
      writeFileSync(OUTPUT_FILE, '❌ Aucun email du syndic avec PDF trouvé dans les 60 derniers jours');
      return;
    }
    
    let output = `📧 ${searchData.messages.length} email(s) trouvé(s):\n\n`;
    
    // List all emails found
    for (let i = 0; i < searchData.messages.length; i++) {
      const msg = searchData.messages[i];
      const details = await apiRequest(
        tokens,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`
      );
      
      const headers = details.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans sujet';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      output += `${i + 1}. De: ${from}\n`;
      output += `   Date: ${date}\n`;
      output += `   Sujet: ${subject}\n\n`;
    }
    
    // Download PDF from first email
    const msg = searchData.messages[0];
    const details = await apiRequest(
      tokens,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`
    );
    
    const headers = details.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans sujet';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
    const date = headers.find((h: any) => h.name === 'Date')?.value || '';
    
    output += `\n━━━━━━━━━━━━━━━━━━━━━━━━\nTéléchargement du premier email:\n`;
    output += `De: ${from}\n`;
    output += `Date: ${date}\n`;
    output += `Sujet: ${subject}\n\n`;
    
    // Find PDF attachment
    const parts = details.payload?.parts || [];
    let pdfFound = false;
    
    for (const part of parts) {
      if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
        output += `📎 PDF trouvé: ${part.filename}\n`;
        
        // Get attachment data
        const attachmentData = await apiRequest(
          tokens,
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`
        );
        
        if (attachmentData.data) {
          // Save PDF
          const pdfBuffer = Buffer.from(attachmentData.data, 'base64url');
          writeFileSync(PDF_OUTPUT, pdfBuffer);
          output += `\n✅ PDF téléchargé: syndic-pdf.pdf\n`;
          output += `Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB`;
          pdfFound = true;
          break;
        }
      }
    }
    
    if (!pdfFound) {
      output += '\n❌ Aucun PDF trouvé dans cet email';
    }
    
    writeFileSync(OUTPUT_FILE, output);
    console.log(output);
    
  } catch (err: any) {
    const error = `❌ Erreur: ${err.message}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
