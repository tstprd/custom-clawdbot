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
      title: '🏫 Faire inscriptions crèche',
      notes: '[SLOT:soir-semaine]\nDemandé le 14/01 pour rappel ce soir'
    },
    {
      title: '🚗 Aller chercher le drive',
      notes: '[SLOT:soir-semaine]\nDemandé le 14/01 pour rappel ce soir'
    },
    {
      title: '💡 Passer du temps sur agentic doula',
      notes: '[SLOT:soir-semaine]\nProjet business idea - voir business-ideas/doula-agentic/\nDemandé le 14/01 pour rappel ce soir'
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
    console.log(`✅ ${task.title}`);
  }
  
  console.log('\n✅ 3 rappels créés pour ce soir (18h30)');
}

main().catch(console.error);
