/**
 * Remove email reminders from ALL future events
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text);
  console.log(text);
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

async function getTokens(): Promise<Tokens> {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error('Tokens not found.');
  }
  
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
    
    const newTokens = await response.json();
    if (newTokens.error) {
      throw new Error(`Token refresh failed: ${newTokens.error}`);
    }
    
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

async function removeAllEmailReminders(): Promise<void> {
  try {
    const now = new Date();
    // Get events for the next 6 months
    const sixMonthsLater = new Date(now);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    
    output('🔇 Recherche des événements futurs...\n');
    
    // Get future events
    const data = await apiRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${sixMonthsLater.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=2500`
    );
    
    if (data.error) {
      output(`Error: ${data.error.message}`);
      return;
    }
    
    let result = `📅 ${data.items?.length || 0} événements trouvés\n\n`;
    let count = 0;
    let skipped = 0;
    
    for (const event of data.items || []) {
      const reminders = event.reminders;
      
      // Check if using default reminders or has email reminders
      const useDefault = reminders?.useDefault !== false;
      const hasEmailReminders = reminders?.overrides?.some((r: any) => r.method === 'email');
      
      if (useDefault || hasEmailReminders) {
        // Set popup reminder only (30 min before)
        const newReminders = {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 }
          ]
        };
        
        // Update event
        const updateData = await apiRequest(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ reminders: newReminders })
          }
        );
        
        if (updateData.error) {
          result += `❌ ${event.summary}: ${updateData.error.message}\n`;
        } else {
          const eventDate = new Date(event.start?.dateTime || event.start?.date);
          result += `✅ ${event.summary} (${eventDate.toLocaleDateString('fr-FR')})\n`;
          count++;
        }
      } else {
        skipped++;
      }
    }
    
    if (count === 0) {
      result += '\n✨ Aucun rappel email trouvé (tous les événements sont déjà configurés correctement)';
    } else {
      result += `\n✅ ${count} événement(s) modifié(s)`;
      if (skipped > 0) {
        result += `\n⏭️ ${skipped} événement(s) déjà sans rappel email`;
      }
    }
    
    output(result);
  } catch (error) {
    output(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

removeAllEmailReminders().catch(err => {
  output(`Fatal error: ${err.message}`);
  process.exit(1);
});
