#!/usr/bin/env npx tsx
/**
 * Save or retrieve DeFi snapshots
 *
 * Usage:
 *   pnpm tsx scripts/db-snapshot.ts save --date 2026-02-15 --total 59708 --gross 174.34 --cost 142.17
 *   pnpm tsx scripts/db-snapshot.ts list
 *   pnpm tsx scripts/db-snapshot.ts last
 *   pnpm tsx scripts/db-snapshot.ts compare
 */

import Database from "better-sqlite3";
import { homedir } from "os";
import { join } from "path";

const dbPath = join(homedir(), ".clawdbot", "local.db");
const db = new Database(dbPath);

const args = process.argv.slice(2);
const command = args[0];

function getWeek(date: string): string {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] || "";
      i++;
    }
  }
  return result;
}

switch (command) {
  case "save": {
    const opts = parseArgs(args.slice(1));
    const date = opts.date || new Date().toISOString().split("T")[0];
    const week = getWeek(date);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO defi_snapshots 
      (date, week, total_value, gross_yield_weekly, borrow_cost_weekly, net_yield_weekly, positions_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const gross = parseFloat(opts.gross || "0");
    const cost = parseFloat(opts.cost || "0");

    stmt.run(
      date,
      week,
      parseFloat(opts.total || "0"),
      gross,
      cost,
      gross - cost,
      opts.positions || null,
    );

    console.log(`✅ Snapshot saved for ${date} (${week})`);
    break;
  }

  case "price": {
    const opts = parseArgs(args.slice(1));
    const date = opts.date || new Date().toISOString().split("T")[0];

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO defi_prices (date, asset, price_usd)
      VALUES (?, ?, ?)
    `);

    stmt.run(date, opts.asset, parseFloat(opts.price || "0"));
    console.log(`✅ Price saved: ${opts.asset} = $${opts.price} on ${date}`);
    break;
  }

  case "yield": {
    const opts = parseArgs(args.slice(1));
    const date = opts.date || new Date().toISOString().split("T")[0];

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO defi_yields (date, source, metric, value)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(date, opts.source, opts.metric || "apy", parseFloat(opts.value || "0"));
    console.log(`✅ Yield saved: ${opts.source} = ${opts.value}% on ${date}`);
    break;
  }

  case "list": {
    const rows = db
      .prepare(`
      SELECT date, week, total_value, net_yield_weekly 
      FROM defi_snapshots 
      ORDER BY date DESC 
      LIMIT 10
    `)
      .all();

    console.log("\n📊 Recent Snapshots:\n");
    for (const row of rows as any[]) {
      console.log(
        `${row.date} (${row.week}): $${row.total_value.toLocaleString()} | Net: $${row.net_yield_weekly?.toFixed(2)}/week`,
      );
    }
    break;
  }

  case "last": {
    const row = db
      .prepare(`
      SELECT * FROM defi_snapshots ORDER BY date DESC LIMIT 1
    `)
      .get() as any;

    if (row) {
      console.log("\n📊 Last Snapshot:\n");
      console.log(`Date: ${row.date} (${row.week})`);
      console.log(`Total: $${row.total_value.toLocaleString()}`);
      console.log(`Gross Yield: +$${row.gross_yield_weekly?.toFixed(2)}/week`);
      console.log(`Borrow Cost: -$${row.borrow_cost_weekly?.toFixed(2)}/week`);
      console.log(`Net: +$${row.net_yield_weekly?.toFixed(2)}/week`);
    } else {
      console.log("No snapshots found");
    }
    break;
  }

  case "compare": {
    const rows = db
      .prepare(`
      SELECT * FROM defi_snapshots ORDER BY date DESC LIMIT 2
    `)
      .all() as any[];

    if (rows.length < 2) {
      console.log("Need at least 2 snapshots to compare");
      break;
    }

    const [current, previous] = rows;
    const valueDiff = current.total_value - previous.total_value;
    const valuePct = (valueDiff / previous.total_value) * 100;

    console.log("\n📊 Week-on-Week Comparison:\n");
    console.log(`Previous (${previous.date}): $${previous.total_value.toLocaleString()}`);
    console.log(`Current (${current.date}): $${current.total_value.toLocaleString()}`);
    console.log(
      `Change: ${valueDiff >= 0 ? "+" : ""}$${valueDiff.toLocaleString()} (${valuePct >= 0 ? "+" : ""}${valuePct.toFixed(2)}%)`,
    );
    break;
  }

  case "prices": {
    const rows = db
      .prepare(`
      SELECT date, asset, price_usd 
      FROM defi_prices 
      ORDER BY date DESC, asset
      LIMIT 20
    `)
      .all();

    console.log("\n📊 Recent Prices:\n");
    for (const row of rows as any[]) {
      console.log(`${row.date} | ${row.asset}: $${row.price_usd}`);
    }
    break;
  }

  default:
    console.log(`
DeFi Snapshot Manager

Commands:
  save    Save a snapshot (--date, --total, --gross, --cost, --positions)
  price   Save a price (--date, --asset, --price)
  yield   Save a yield (--date, --source, --metric, --value)
  list    List recent snapshots
  last    Show last snapshot
  compare Compare last 2 snapshots
  prices  List recent prices
`);
}

db.close();
