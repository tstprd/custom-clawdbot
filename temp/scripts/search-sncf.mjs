import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT = join(process.cwd(), 'ha-output.txt');

const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));

try {
  // Search for SNCF emails
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=from:sncf OR subject:sncf OR subject:voyage OR subject:billet`,
    { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
  );
  
  const data = await response.json();
  let output = '🚄 Emails SNCF trouvés:\n\n';
  
  for (const msg of data.messages || []) {
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { 'Authorization': `Bearer ${tokens.access_token}` } }
    );
    const msgData = await msgResponse.json();
    
    const headers = msgData.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '(sans sujet)';
    const from = headers.find(h => h.name === 'From')?.value || '?';
    const date = headers.find(h => h.name === 'Date')?.value || '?';
    
    // Get body
    let body = '';
    const parts = msgData.payload?.parts || [msgData.payload];
    for (const part of parts) {
      if (part?.mimeType === 'text/plain' && part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
    }
    if (!body && msgData.payload?.body?.data) {
      body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
    }
    
    output += `📧 ${subject}\n`;
    output += `Date: ${date}\n`;
    
    // Look for trip details
    const tripMatch = body.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})/gi);
    const routeMatch = body.match(/((?:Paris|Lyon|Marseille|Rennes|Strasbourg|Nantes|Bordeaux|Lille|Toulouse|Nice)[^,\n]*(?:→|->|-|à)[^,\n]*(?:Paris|Lyon|Marseille|Rennes|Strasbourg|Nantes|Bordeaux|Lille|Toulouse|Nice))/gi);
    const timeMatch = body.match(/(\d{1,2}[h:]\d{2})/gi);
    const cancelMatch = subject.toLowerCase().includes('annul') || body.toLowerCase().includes('annulé') || body.toLowerCase().includes('annulation');
    
    if (cancelMatch) output += `⚠️ ANNULATION DÉTECTÉE\n`;
    if (routeMatch) output += `Trajet: ${routeMatch[0]}\n`;
    if (tripMatch) output += `Dates: ${tripMatch.slice(0, 3).join(', ')}\n`;
    if (timeMatch) output += `Heures: ${timeMatch.slice(0, 4).join(', ')}\n`;
    
    output += `\n---\n\n`;
  }
  
  writeFileSync(OUTPUT, output);
} catch (err) {
  writeFileSync(OUTPUT, `Exception: ${err.message}`);
}
