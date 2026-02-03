/**
 * Met à jour le lieu d'un événement Google Calendar
 * Usage: pnpm tsx update-event-location.ts <email> <event_id> <location>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH_JULES = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const TOKEN_PATH_AL = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function getTokens(path: string): Promise<Tokens> {
  const tokens: Tokens = JSON.parse(readFileSync(path, 'utf-8'));
  
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

async function updateEventLocation(tokens: Tokens, eventId: string, location: string) {
  // D'abord récupérer l'événement
  const getUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const getResponse = await fetch(getUrl, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  if (!getResponse.ok) {
    throw new Error(`Failed to get event: ${getResponse.statusText}`);
  }
  
  const event = await getResponse.json();
  
  // Mettre à jour le lieu
  event.location = location;
  
  const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  if (!updateResponse.ok) {
    throw new Error(`Failed to update event: ${updateResponse.statusText}`);
  }
  
  return updateResponse.json();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    writeFileSync(OUTPUT_FILE, 'Usage: pnpm tsx update-event-location.ts <jmudes|alejmurot> <event_id> <location>');
    return;
  }
  
  const [email, eventId, ...locationParts] = args;
  const location = locationParts.join(' ');
  
  const tokenPath = email.includes('jmudes') ? TOKEN_PATH_JULES : TOKEN_PATH_AL;
  const tokens = await getTokens(tokenPath);
  
  try {
    const updated = await updateEventLocation(tokens, eventId, location);
    writeFileSync(OUTPUT_FILE, `✅ Lieu mis à jour : ${updated.summary}\nNouveau lieu : ${location}`);
  } catch (err) {
    writeFileSync(OUTPUT_FILE, `❌ Erreur : ${String(err)}`);
  }
}

main();
