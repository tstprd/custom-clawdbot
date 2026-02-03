/**
 * Initialize the maintenance bot database
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(homedir(), '.clawdbot', 'maintenance-bot.db');
const SCHEMA_PATH = join(__dirname, '..', 'schema.sql');

console.log('🗄️ Initializing database...');
console.log('📍 Path:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Read and execute schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

console.log('✅ Database initialized!');

// Show stats
const verticals = db.prepare('SELECT COUNT(*) as count FROM verticals').get() as { count: number };
const templates = db.prepare('SELECT COUNT(*) as count FROM reminder_templates').get() as { count: number };

console.log(`📊 ${verticals.count} verticals, ${templates.count} templates`);

db.close();
