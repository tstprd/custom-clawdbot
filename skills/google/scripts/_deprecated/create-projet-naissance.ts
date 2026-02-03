/**
 * Create "Projet de naissance" list in alejmurot account and add cord clamping task
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

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
    let result = '📋 Création liste "Projet de naissance":\n';
    
    // Create "Projet de naissance" list
    const listData = await apiRequest(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      { 
        method: 'POST', 
        body: JSON.stringify({ title: 'Projet de naissance' }) 
      }
    );
    
    result += '\n✅ Liste "Projet de naissance" créée';
    const listId = listData.id;
    
    // Add cord clamping task
    const task = {
      title: 'Clampage tardif du cordon (30s-3min après naissance)',
      notes: `Recommandation de Théa (doula).

Bénéfices prouvés:
- Meilleure concentration d'hémoglobine
- Taux de ferritine augmenté  
- Réduction de l'anémie ferriprive à 4-6 mois
- Aucun effet négatif sur la mère

À demander à la maternité / sage-femme.

Source: https://pubmed.ncbi.nlm.nih.gov/23407180/`
    };
    
    await apiRequest(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
      { method: 'POST', body: JSON.stringify(task) }
    );
    
    result += '\n✅ Tâche ajoutée: Clampage tardif du cordon';
    result += '\n\n📝 Source: Recommandation de Théa';
    
    writeFileSync(OUTPUT_FILE, result);
    console.log(result);
    
  } catch (error) {
    const errorMsg = `❌ Erreur: ${error}`;
    writeFileSync(OUTPUT_FILE, errorMsg);
    console.error(errorMsg);
  }
}

main();
