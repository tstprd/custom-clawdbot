/**
 * Google OAuth for Tasks + Gmail + Calendar FOR JMUDES ACCOUNT
 * Run: node skills/google/scripts/auth-tasks-jmudes.mjs
 */

import { createServer } from 'http';
import { writeFileSync } from 'fs';
import { join } from 'path';

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks'
].join(' ');

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');

// Step 1: Generate auth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPES,
  access_type: 'offline',
  prompt: 'consent',
  login_hint: 'jmudes76000@gmail.com'
})}`;

console.log('\n🔐 Authentification pour jmudes76000@gmail.com\n');
console.log('Ouvrez ce lien dans votre navigateur:\n');
console.log(authUrl);
console.log('\n⚠️  IMPORTANT: Sélectionnez le compte jmudes76000@gmail.com\n');

// Also write to output file
writeFileSync(join(process.cwd(), 'ha-output.txt'), `🔐 Authentification Google OAuth pour jmudes76000@gmail.com

Ouvrez ce lien dans votre navigateur:

${authUrl}

⚠️ IMPORTANT: Sélectionnez le compte jmudes76000@gmail.com

📡 Serveur en attente sur http://localhost:3000
`);

// Step 2: Start local server to receive callback
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3000`);
  
  if (url.pathname === '/oauth2callback') {
    const code = url.searchParams.get('code');
    
    if (!code) {
      res.writeHead(400);
      res.end('Error: No code received');
      return;
    }
    
    try {
      // Exchange code for tokens
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await response.json();
      
      if (tokens.error) {
        throw new Error(tokens.error);
      }
      
      // Save tokens
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + (tokens.expires_in * 1000),
        token_type: tokens.token_type,
        scope: tokens.scope,
        account: 'jmudes76000@gmail.com'
      };
      
      writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <head><meta charset="utf-8"></head>
          <body>
            <h1>✅ Authentification réussie!</h1>
            <p><strong>Compte:</strong> jmudes76000@gmail.com</p>
            <p><strong>Tokens sauvegardés dans:</strong> ${TOKEN_PATH}</p>
            <p>Vous pouvez fermer cette fenêtre.</p>
          </body>
        </html>
      `);
      
      console.log('\n✅ Tokens sauvegardés pour jmudes76000@gmail.com');
      console.log('Fichier:', TOKEN_PATH);
      console.log('Scopes:', tokens.scope);
      
      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
      
    } catch (err) {
      console.error('Error:', err.message);
      res.writeHead(500);
      res.end('Error: ' + err.message);
    }
  }
});

server.listen(3000, () => {
  console.log('📡 Serveur en attente sur http://localhost:3000\n');
});
