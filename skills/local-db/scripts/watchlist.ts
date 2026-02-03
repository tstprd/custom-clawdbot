#!/usr/bin/env bun
/**
 * Watchlist manager - add/list/remove items to watch later
 * Usage:
 *   pnpm tsx watchlist.ts add "Title" "URL" [source]
 *   pnpm tsx watchlist.ts list
 *   pnpm tsx watchlist.ts done <id>
 *   pnpm tsx watchlist.ts remove <id>
 */

import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    return new SQL.Database(fileBuffer);
  }
  return new SQL.Database();
}

function saveDb(db: Database): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

async function main() {
  const db = await getDb();

  // Create watchlist table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      type TEXT DEFAULT 'video',
      source TEXT,
      added_at TEXT DEFAULT (datetime('now')),
      watched INTEGER DEFAULT 0,
      notes TEXT
    )
  `);
  saveDb(db);

  const action = process.argv[2] || 'list';

  if (action === 'add') {
    const title = process.argv[3];
    const url = process.argv[4] || null;
    const source = process.argv[5] || null;
    
    if (!title) {
      console.error('Usage: watchlist.ts add "Title" "URL" [source]');
      process.exit(1);
    }
    
    db.run('INSERT INTO watchlist (title, url, source) VALUES (?, ?, ?)', [title, url, source]);
    saveDb(db);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] || '?';
    console.log(`✅ Added to watchlist (id: ${id})`);
    
  } else if (action === 'list') {
    const result = db.exec('SELECT * FROM watchlist WHERE watched = 0 ORDER BY added_at DESC');
    
    if (!result.length || !result[0].values.length) {
      console.log('\n📺 Watchlist is empty!\n');
    } else {
      const columns = result[0].columns;
      const items = result[0].values;
      
      console.log(`\n📺 Watchlist (${items.length} items)\n`);
      
      for (const row of items) {
        const item: any = {};
        columns.forEach((col, i) => item[col] = row[i]);
        
        console.log(`${item.id}. ${item.title}`);
        if (item.url) console.log(`   🔗 ${item.url}`);
        if (item.source) console.log(`   📌 Source: ${item.source}`);
        console.log(`   📅 Added: ${item.added_at}\n`);
      }
    }
    
  } else if (action === 'done') {
    const id = process.argv[3];
    if (!id) {
      console.error('Usage: watchlist.ts done <id>');
      process.exit(1);
    }
    db.run('UPDATE watchlist SET watched = 1 WHERE id = ?', [id]);
    saveDb(db);
    console.log(`✅ Marked as watched`);
    
  } else if (action === 'remove') {
    const id = process.argv[3];
    if (!id) {
      console.error('Usage: watchlist.ts remove <id>');
      process.exit(1);
    }
    db.run('DELETE FROM watchlist WHERE id = ?', [id]);
    saveDb(db);
    console.log(`🗑️ Removed from watchlist`);
  }

  db.close();
}

main().catch(console.error);
