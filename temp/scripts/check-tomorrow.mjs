#!/usr/bin/env node

/**
 * Check tomorrow's appointments
 * Cross-references USER.md reminders with Google Calendar
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
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

async function getTomorrowEvents() {
  const tokens = await getTokens();
  
  // Get tomorrow's date range
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  const timeMin = tomorrow.toISOString();
  const timeMax = dayAfter.toISOString();
  
  // Query both calendars
  const accounts = [
    { email: 'jmudes76000@gmail.com', name: 'Jules' },
    { email: 'alejmurot@gmail.com', name: 'AL+Jules' }
  ];
  
  let allEvents = [];
  
  for (const account of accounts) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(account.email)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    
    const data = await res.json();
    
    if (data.items) {
      for (const event of data.items) {
        allEvents.push({
          account: account.name,
          summary: event.summary,
          start: event.start.dateTime || event.start.date,
          location: event.location
        });
      }
    }
  }
  
  return { tomorrow, events: allEvents };
}

async function main() {
  const { tomorrow, events } = await getTomorrowEvents();
  
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = dayNames[tomorrow.getDay()];
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`DEMAIN : ${dayName} ${dateStr}`);
  console.log(`\nÉVÉNEMENTS TROUVÉS (${events.length}) :`);
  
  if (events.length === 0) {
    console.log('  Aucun événement');
  } else {
    for (const evt of events) {
      const time = new Date(evt.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      console.log(`  [${evt.account}] ${time} - ${evt.summary}`);
      if (evt.location) console.log(`    📍 ${evt.location}`);
    }
  }
}

main().catch(console.error);
