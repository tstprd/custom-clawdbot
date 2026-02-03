#!/usr/bin/env npx tsx
/**
 * Remove email reminders from ALL future events (gog CLI version)
 * Sets reminders to popup only (30 min before)
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const ACCOUNT = process.argv[2] === 'alejmurot' ? 'alejmurot@gmail.com' : 'jmudes76000@gmail.com';

function gog(args: string[]): string {
  const cmd = `gog ${args.join(' ')} --account ${ACCOUNT}`;
  return execSync(cmd, { 
    encoding: 'utf-8', 
    timeout: 60000,
    shell: 'powershell.exe',
    windowsHide: true
  }).trim();
}

function gogJson<T>(args: string[]): T {
  return JSON.parse(gog([...args, '--json']));
}

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

interface EventsResult {
  events?: CalendarEvent[];
}

async function main() {
  let updated = 0;
  let errors = 0;
  
  try {
    // Get events for next 60 days
    const result = gogJson<EventsResult>(['calendar', 'events', '--days', '60']);
    
    if (!result.events || result.events.length === 0) {
      writeFileSync(OUTPUT_FILE, '');
      return;
    }
    
    for (const event of result.events) {
      // Skip if no reminders or already popup-only
      if (!event.reminders) continue;
      
      const hasEmailReminder = event.reminders.overrides?.some(r => r.method === 'email');
      const usesDefault = event.reminders.useDefault;
      
      if (hasEmailReminder || usesDefault) {
        try {
          // Set to popup only, 30 min before
          gog([
            'calendar', 'update', 'primary', event.id,
            '--reminder=popup:30m',
            '--no-input'
          ]);
          updated++;
        } catch (e: any) {
          console.error(`Error updating ${event.id}: ${e.message}`);
          errors++;
        }
      }
    }
    
    if (updated > 0) {
      const output = `✅ ${updated} événements mis à jour (rappels email → popup)`;
      writeFileSync(OUTPUT_FILE, output);
      console.log(output);
    } else {
      writeFileSync(OUTPUT_FILE, '');
    }
    
    if (errors > 0) {
      console.error(`⚠️ ${errors} erreurs`);
    }
    
  } catch (e: any) {
    const error = `❌ Erreur: ${e.message}`;
    writeFileSync(OUTPUT_FILE, error);
    console.error(error);
    process.exit(1);
  }
}

main();
