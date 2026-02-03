#!/usr/bin/env npx tsx
/**
 * Dump all config from local.db
 */
import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DB_PATH = join(homedir(), '.clawdbot', 'local.db');

async function main() {
  const SQL = await initSqlJs();
  
  if (!existsSync(DB_PATH)) {
    console.log('Database not found:', DB_PATH);
    return;
  }
  
  const db = new SQL.Database(readFileSync(DB_PATH));
  
  // List all tables
  console.log('=== TABLES ===');
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length > 0) {
    for (const row of tables[0].values) {
      console.log('-', row[0]);
    }
  }
  
  // Check brief_config
  console.log('\n=== BRIEF_CONFIG ===');
  const briefConfig = db.exec('SELECT * FROM brief_config');
  if (briefConfig.length > 0) {
    const cols = briefConfig[0].columns;
    for (const row of briefConfig[0].values) {
      const obj: any = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      console.log(JSON.stringify(obj, null, 2));
    }
  } else {
    console.log('(empty)');
  }
  
  // Check for any text containing old patterns
  console.log('\n=== SEARCHING FOR OLD PATTERNS ===');
  const patterns = [
    'clawdbot-google-tokens',
    'skills/google/scripts/auth',
    'exchange-code',
    'refresh_token'
  ];
  
  for (const pattern of patterns) {
    // Search in all text columns of all tables
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tablesResult.length === 0) continue;
    
    for (const tableRow of tablesResult[0].values) {
      const tableName = tableRow[0] as string;
      try {
        const content = db.exec(`SELECT * FROM "${tableName}" WHERE CAST("${tableName}" AS TEXT) LIKE '%${pattern}%'`);
        // This won't work directly, let's try a different approach
      } catch (e) {
        // Ignore errors
      }
    }
  }
  
  // Check reminder_config
  console.log('\n=== REMINDER_CONFIG ===');
  try {
    const reminderConfig = db.exec('SELECT * FROM reminder_config');
    if (reminderConfig.length > 0) {
      const cols = reminderConfig[0].columns;
      for (const row of reminderConfig[0].values) {
        const obj: any = {};
        cols.forEach((col, i) => obj[col] = row[i]);
        console.log(JSON.stringify(obj, null, 2));
      }
    } else {
      console.log('(empty)');
    }
  } catch (e) {
    console.log('No reminder_config table');
  }
  
  // Check notes for any mentions of old methods
  console.log('\n=== NOTES (checking for old patterns) ===');
  try {
    const notes = db.exec("SELECT * FROM notes WHERE content LIKE '%google-tokens%' OR content LIKE '%skills/google/scripts/auth%'");
    if (notes.length > 0 && notes[0].values.length > 0) {
      console.log('Found notes with old patterns:', notes[0].values.length);
    } else {
      console.log('No old patterns in notes');
    }
  } catch (e) {
    console.log('Error checking notes:', e);
  }
  
  db.close();
}

main().catch(console.error);
