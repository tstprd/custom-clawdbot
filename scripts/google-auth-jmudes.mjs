/**
 * Google OAuth2 Authorization Script for jmudes76000@gmail.com
 */

import { createServer } from 'http';
import { URL } from 'url';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'google-auth-log.txt');
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(LOG_FILE, line);
};

log('Starting OAuth server for jmudes76000...');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3334/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');

const server = createServer(async (req, res) => {
  log(`Request: ${req.url}`);
  
  try {
    const url = new URL(req.url, `http://localhost:3334`);
    
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      log(`Callback received. Code: ${code ? 'yes' : 'no'}, Error: ${error || 'none'}`);
      
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>Erreur: ${error}</h1>`);
        return;
      }
      
      if (code) {
        log('Exchanging code for tokens...');
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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
        
        const tokens = await tokenResponse.json();
        log(`Token response: ${JSON.stringify(tokens)}`);
        
        if (tokens.error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>Erreur: ${tokens.error_description || tokens.error}</h1>`);
          return;
        }
        
        const tokenData = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: Date.now() + (tokens.expires_in * 1000),
          token_type: tokens.token_type,
          scope: tokens.scope,
          account: 'jmudes76000@gmail.com'
        };
        
        writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
        log(`Tokens saved to ${TOKEN_PATH}`);
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1>✅ Autorisation réussie pour jmudes76000@gmail.com!</h1>
            <p>Tu peux fermer cette fenêtre.</p>
          </body>
          </html>
        `);
        
        log('Success! Closing server...');
        setTimeout(() => process.exit(0), 1000);
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OAuth server running for jmudes76000');
    }
  } catch (err) {
    log(`Exception: ${err.message}\n${err.stack}`);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Erreur: ${err.message}</h1>`);
  }
});

server.on('error', (err) => {
  log(`Server error: ${err.message}`);
});

server.listen(3334, () => {
  log('Server listening on port 3334');
});
