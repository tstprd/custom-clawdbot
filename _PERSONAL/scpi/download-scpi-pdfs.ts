import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
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
    
    const newTokens = await response.json();
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function main() {
  const tokens = await getTokens();
  
  // Search for the email
  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=${encodeURIComponent('from:ruiz subject:SCPI')}`;
  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  const searchData = await searchRes.json();
  
  if (!searchData.messages || searchData.messages.length === 0) {
    console.log('❌ Email non trouvé');
    return;
  }
  
  const messageId = searchData.messages[0].id;
  console.log(`📧 Message ID: ${messageId}`);
  
  // Get full message with attachments
  const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  const msgRes = await fetch(msgUrl, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  const msgData = await msgRes.json();
  
  // Create output directory
  const outDir = join(process.cwd(), 'scpi-pdfs');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  
  // Find all PDF attachments
  const parts = msgData.payload?.parts || [];
  let pdfCount = 0;
  
  async function processPart(part: any) {
    if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
      console.log(`📄 Téléchargement: ${part.filename}`);
      
      const attachId = part.body.attachmentId;
      const attachUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachId}`;
      const attachRes = await fetch(attachUrl, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      const attachData = await attachRes.json();
      
      // Decode base64 and save
      const buffer = Buffer.from(attachData.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      const filePath = join(outDir, part.filename);
      writeFileSync(filePath, buffer);
      console.log(`✅ Sauvegardé: ${filePath}`);
      pdfCount++;
    }
    
    // Recursively check nested parts
    if (part.parts) {
      for (const subPart of part.parts) {
        await processPart(subPart);
      }
    }
  }
  
  for (const part of parts) {
    await processPart(part);
  }
  
  console.log(`\n✅ ${pdfCount} PDF(s) téléchargés dans ${outDir}`);
}

main().catch(console.error);
