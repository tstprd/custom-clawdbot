/**
 * Italian Words Tracking
 * 
 * Tracks sent Italian words to avoid repetition in daily briefs
 */

import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

const dbPath = join(homedir(), '.clawdbot', 'local.db');
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS italian_words_sent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL,
    translation TEXT,
    sent_at DATE DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const action = process.argv[2];

if (action === 'add') {
  // Add words: pnpm tsx italian-words.ts add "word1|translation1" "word2|translation2"
  const words = process.argv.slice(3);
  const stmt = db.prepare('INSERT OR IGNORE INTO italian_words_sent (word, translation) VALUES (?, ?)');
  
  for (const w of words) {
    const [word, translation] = w.split('|');
    stmt.run(word.toLowerCase().trim(), translation?.trim() || '');
  }
  console.log(`✅ ${words.length} mot(s) ajouté(s)`);

} else if (action === 'list') {
  // List all sent words
  const words = db.prepare('SELECT word, translation, sent_at FROM italian_words_sent ORDER BY sent_at DESC').all();
  console.log(`📚 ${words.length} mots italiens envoyés:\n`);
  for (const w of words as any[]) {
    console.log(`- ${w.word} (${w.translation}) - ${w.sent_at}`);
  }

} else if (action === 'check') {
  // Check if a word was already sent
  const word = process.argv[3]?.toLowerCase().trim();
  if (!word) {
    console.log('Usage: italian-words.ts check <word>');
    process.exit(1);
  }
  const exists = db.prepare('SELECT 1 FROM italian_words_sent WHERE word = ?').get(word);
  if (exists) {
    console.log(`⚠️ "${word}" déjà envoyé`);
    process.exit(1);
  } else {
    console.log(`✅ "${word}" pas encore envoyé`);
  }

} else if (action === 'get-new') {
  // Get words that haven't been sent (for brief generation)
  // This would need a source list of Italian words to pick from
  const sentWords = db.prepare('SELECT word FROM italian_words_sent').all() as { word: string }[];
  const sentSet = new Set(sentWords.map(w => w.word));
  console.log(JSON.stringify({ sentCount: sentSet.size, sentWords: Array.from(sentSet) }));

} else {
  console.log(`
Italian Words Tracker

Usage:
  pnpm tsx italian-words.ts add "word|translation" ...
  pnpm tsx italian-words.ts list
  pnpm tsx italian-words.ts check <word>
  pnpm tsx italian-words.ts get-new
  `);
}

db.close();
