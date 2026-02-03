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

async function main() {
  const tokens = await getTokens();
  
  // Get tasklists
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  const lists = await listsRes.json();
  
  // Find "Liste de Jules Mudès"
  const targetList = lists.items.find(l => l.title === 'Liste de Jules Mudès');
  if (!targetList) {
    console.log('❌ Liste "Liste de Jules Mudès" non trouvée');
    return;
  }
  
  const tasks = [
    {
      title: '📊 Analyser rapport SCPI (3 SCPI européennes)',
      notes: `[SLOT:matin-weekend]

Rapport complet disponible : scpi-final-analysis.md

3 SCPI proposées :
- EPARGNE PIERRE EUROPE (Atland Voisin) - 479M€ cap, TOF 100%
- EDR EUROPA (Rothschild) - 53M€ cap, WALB 13,7 ans, décote -6,20%
- TRANSITION EUROPE (Arkea REIM) - décote -3,39%, ISR

Questions à se poser :
- Quel profil investisseur ? (Prudent / Dynamique / Équilibré)
- Montant à investir ? (150k€ / 200k€ évoqués avec AL)
- Horizon de placement ? (10 ans recommandé)
- Appeler Aurélien Ruiz pour compléter infos TRANSITION EUROPE

Demandé le 14/01 à 14h18`
    },
    {
      title: '🛒 Passer commande Leroy Merlin',
      notes: `[SLOT:soir-semaine]
Demandé le 14/01 à 14h18 pour rappel ce soir`
    }
  ];
  
  for (const task of tasks) {
    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${targetList.id}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });
    
    const result = await response.json();
    console.log(`OK - ${task.title}`);
  }
  
  console.log('\nOK - 2 rappels crees');
}

main().catch(console.error);
