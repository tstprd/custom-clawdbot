/**
 * Create Achats list in alejmurot account
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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P';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
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
    
    const newTokens = await response.json() as any;
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const tokens = await getTokens();
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

async function main(): Promise<void> {
  try {
    let result = '🛒 Création liste Achats:\n';
    
    // Create "Achats" list
    const achatsListData = await apiRequest(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      { 
        method: 'POST', 
        body: JSON.stringify({ title: 'Achats' }) 
      }
    );
    
    result += '\n✅ Liste "Achats" créée';
    const achatsListId = achatsListData.id;
    
    // Add items
    const items = [
      {
        title: 'Lit 180',
        notes: 'Nouveau lit 180cm pour la chambre'
      },
      {
        title: 'Renouveler canapé',
        notes: 'Changer le canapé du salon'
      },
      {
        title: 'Table basse',
        notes: 'Nouvelle table basse'
      }
    ];
    
    for (const item of items) {
      await apiRequest(
        `https://tasks.googleapis.com/tasks/v1/lists/${achatsListId}/tasks`,
        { method: 'POST', body: JSON.stringify(item) }
      );
    }
    
    result += `\n  → ${items.length} items ajoutés`;
    result += '\n\n✅ Terminé!';
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (err) {
    const error = `Error: ${err instanceof Error ? err.message : String(err)}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
  }
}

main();
