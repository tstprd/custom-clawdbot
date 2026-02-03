#!/usr/bin/env npx tsx
/**
 * Auto-mark unimportant emails as read (gog CLI version)
 * Run daily, notify only if actions taken
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { gmailSearch, gmailMarkReadBatch, ACCOUNTS, type GmailThread } from './gog-wrapper.js';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

// Patterns d'emails non importants (marquer comme lus automatiquement)
const UNIMPORTANT_PATTERNS = [
  // Administratif automatique
  { from: 'ne-pas-repondre@interieur.gouv.fr', subject: 'électorale' },
  { from: 'noreply@', subject: 'conditions' },
  { from: 'no-reply@', subject: 'privacy' },
  { from: 'noreply@', subject: 'mise à jour' },
  
  // Réseaux sociaux
  { from: 'notification@instagram.com' },
  { from: 'info@instagram.com' },
  { from: 'notification@facebookmail.com' },
  
  // Marketing (sauf newsletters souhaitées)
  { from: 'promo@' },
  { from: 'marketing@' },
];

// Newsletters à garder NON LUES
const NEWSLETTER_PATTERNS = [
  'Matt Levine',
  'Money Stuff',
  'Vert',
  'l\'hebdo',
];

function isNewsletter(thread: GmailThread): boolean {
  return NEWSLETTER_PATTERNS.some(pattern => 
    thread.subject.toLowerCase().includes(pattern.toLowerCase()) ||
    thread.from.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isUnimportant(thread: GmailThread): boolean {
  // Ne JAMAIS marquer les newsletters comme lues
  if (isNewsletter(thread)) return false;
  
  const fromLower = thread.from.toLowerCase();
  const subjectLower = thread.subject.toLowerCase();
  
  return UNIMPORTANT_PATTERNS.some(pattern => {
    const fromMatch = pattern.from ? fromLower.includes(pattern.from.toLowerCase()) : true;
    const subjectMatch = pattern.subject ? subjectLower.includes(pattern.subject.toLowerCase()) : true;
    return fromMatch && subjectMatch;
  });
}

async function processAccount(account: string, accountName: string): Promise<string[]> {
  const markedRead: string[] = [];
  
  try {
    const result = gmailSearch('is:unread', account, 50);
    
    // Handle empty results
    if (!result.threads || result.threads.length === 0) {
      return markedRead;
    }
    
    for (const thread of result.threads) {
      if (isUnimportant(thread)) {
        gmailMarkReadBatch([thread.id], account);
        markedRead.push(`${accountName}: ${thread.subject}`);
      }
    }
  } catch (e: any) {
    console.error(`Erreur ${accountName}: ${e.message}`);
  }
  
  return markedRead;
}

async function main() {
  const allMarked: string[] = [];
  
  // Process both accounts
  const jmudesMarked = await processAccount(ACCOUNTS.jmudes, 'jmudes');
  const alejmurotMarked = await processAccount(ACCOUNTS.alejmurot, 'alejmurot');
  
  allMarked.push(...jmudesMarked, ...alejmurotMarked);
  
  // Output
  if (allMarked.length > 0) {
    const output = `✅ ${allMarked.length} emails marqués comme lus:\n${allMarked.map(m => `- ${m}`).join('\n')}`;
    writeFileSync(OUTPUT_FILE, output);
    console.log(output);
  } else {
    writeFileSync(OUTPUT_FILE, '');
    // Silencieux si rien à faire
  }
}

main().catch(console.error);
