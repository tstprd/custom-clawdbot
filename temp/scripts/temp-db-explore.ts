import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DB_PATH = join(homedir(), '.clawdbot', 'local.db');

async function main() {
  const SQL = await initSqlJs();
  
  if (!existsSync(DB_PATH)) {
    console.log('Database not found:', DB_PATH);
    return;
  }
  
  const db = new SQL.Database(readFileSync(DB_PATH));

  // List tables
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('=== TABLES ===');
  if (tables.length > 0) {
    tables[0].values.forEach(t => console.log('-', t[0]));
  }

  // Check each table
  const tableNames = tables.length > 0 ? tables[0].values.map(t => t[0] as string) : [];

  for (const tableName of tableNames) {
    console.log('\n=== ' + tableName.toUpperCase() + ' ===');
    try {
      const result = db.exec('SELECT * FROM ' + tableName + ' LIMIT 15');
      if (result.length > 0) {
        console.log('Columns:', result[0].columns.join(', '));
        console.log('Rows:', result[0].values.length);
        result[0].values.forEach((row, i) => {
          console.log('Row ' + (i+1) + ':', JSON.stringify(row));
        });
      } else {
        console.log('(empty)');
      }
    } catch (e: any) { console.log('Error:', e.message); }
  }

  db.close();
}

main().catch(console.error);
