/**
 * Exchange OAuth code for tokens
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const code = process.argv[2];

if (!code) {
  console.error('Usage: node exchange-code.mjs <code>');
  process.exit(1);
}

async function main() {
  try {
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
    
    const result = `✅ Authentification réussie pour jmudes76000@gmail.com!

Tokens sauvegardés dans: ${TOKEN_PATH}

Scopes autorisés:
${tokens.scope.split(' ').map(s => '  • ' + s).join('\n')}
`;
    
    console.log(result);
    writeFileSync(OUTPUT_FILE, result);
    
  } catch (err) {
    const error = `❌ Erreur: ${err.message}`;
    console.error(error);
    writeFileSync(OUTPUT_FILE, error);
    process.exit(1);
  }
}

main();
