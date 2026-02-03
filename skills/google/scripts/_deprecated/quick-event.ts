import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

async function getTokens() {
  const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
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

const tokens = await getTokens();

const event = {
  summary: "Garage - Déposer voiture (phares)",
  start: { 
    dateTime: "2026-01-16T08:30:00", 
    timeZone: "Europe/Paris" 
  },
  end: { 
    dateTime: "2026-01-16T09:00:00", 
    timeZone: "Europe/Paris" 
  }
};

const response = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  }
);

const result = await response.json();
console.log(result.error ? `Error: ${result.error.message}` : `✅ Créé: ${result.htmlLink}`);
