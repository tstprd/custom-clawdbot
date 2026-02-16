#!/usr/bin/env npx tsx
/**
 * Initialize DeFi monitoring tables in local.db
 */

import Database from "better-sqlite3";
import { homedir } from "os";
import { join } from "path";

const dbPath = join(homedir(), ".clawdbot", "local.db");
const db = new Database(dbPath);

// Weekly portfolio snapshots
db.exec(`
  CREATE TABLE IF NOT EXISTS defi_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    week TEXT NOT NULL,
    total_value REAL NOT NULL,
    gross_yield_weekly REAL,
    borrow_cost_weekly REAL,
    net_yield_weekly REAL,
    positions_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Asset prices history
db.exec(`
  CREATE TABLE IF NOT EXISTS defi_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    asset TEXT NOT NULL,
    price_usd REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, asset)
  )
`);

// APY/APR history
db.exec(`
  CREATE TABLE IF NOT EXISTS defi_yields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, source, metric)
  )
`);

// Position values history (for WoW comparison)
db.exec(`
  CREATE TABLE IF NOT EXISTS defi_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    position_name TEXT NOT NULL,
    value_usd REAL NOT NULL,
    asset TEXT,
    quantity REAL,
    apy REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, position_name)
  )
`);

console.log("✅ DeFi tables initialized in", dbPath);

// Show table info
const tables = db
  .prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name LIKE 'defi_%'
`)
  .all();

console.log("📊 Tables:", tables.map((t: any) => t.name).join(", "));

db.close();
