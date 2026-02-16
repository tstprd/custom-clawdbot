#!/usr/bin/env npx tsx
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
/**
 * DeFi monitoring data management
 *
 * Usage:
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts init
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts snapshot --total 59708 --gross 174.34 --cost 142.17
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts price --asset ETH --price 2063
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts yield --source scrvusd --value 8.95
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts list
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts compare
 *   pnpm tsx skills/defi-monitor/scripts/db-defi.ts report
 */
import initSqlJs, { type Database } from "sql.js";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
  // Ensure directory exists
  const dir = resolve(homedir(), ".clawdbot");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
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

async function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS defi_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      week TEXT NOT NULL,
      total_value REAL NOT NULL,
      gross_yield_weekly REAL,
      borrow_cost_weekly REAL,
      net_yield_weekly REAL,
      positions_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS defi_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      asset TEXT NOT NULL,
      price_usd REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, asset)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS defi_yields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      source TEXT NOT NULL,
      value REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, source)
    )
  `);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const opts = parseArgs(args.slice(1));

  const db = await getDb();
  await initTables(db);

  const today = new Date().toISOString().split("T")[0];
  const date = opts.date || today;

  switch (command) {
    case "init": {
      saveDb(db);
      console.log("✅ DeFi tables initialized");
      break;
    }

    case "snapshot": {
      const week = getWeek(date);
      const gross = parseFloat(opts.gross || "0");
      const cost = parseFloat(opts.cost || "0");
      const total = parseFloat(opts.total || "0");

      db.run(
        `
        INSERT OR REPLACE INTO defi_snapshots 
        (date, week, total_value, gross_yield_weekly, borrow_cost_weekly, net_yield_weekly, positions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [date, week, total, gross, cost, gross - cost, opts.positions || null],
      );

      saveDb(db);
      console.log(`✅ Snapshot saved: ${date} (${week})`);
      console.log(`   Total: $${total.toLocaleString()}`);
      console.log(`   Gross: +$${gross.toFixed(2)}/week`);
      console.log(`   Cost: -$${cost.toFixed(2)}/week`);
      console.log(`   Net: +$${(gross - cost).toFixed(2)}/week`);
      break;
    }

    case "price": {
      const asset = opts.asset?.toUpperCase();
      const price = parseFloat(opts.price || "0");

      if (!asset) {
        console.log("❌ --asset required");
        break;
      }

      db.run(
        `
        INSERT OR REPLACE INTO defi_prices (date, asset, price_usd)
        VALUES (?, ?, ?)
      `,
        [date, asset, price],
      );

      saveDb(db);
      console.log(`✅ Price saved: ${asset} = $${price} on ${date}`);
      break;
    }

    case "yield": {
      const source = opts.source?.toLowerCase();
      const value = parseFloat(opts.value || "0");

      if (!source) {
        console.log("❌ --source required");
        break;
      }

      db.run(
        `
        INSERT OR REPLACE INTO defi_yields (date, source, value)
        VALUES (?, ?, ?)
      `,
        [date, source, value],
      );

      saveDb(db);
      console.log(`✅ Yield saved: ${source} = ${value}% on ${date}`);
      break;
    }

    case "list": {
      const snapshots = db.exec(`
        SELECT date, week, total_value, net_yield_weekly 
        FROM defi_snapshots 
        ORDER BY date DESC 
        LIMIT 10
      `);

      console.log("\n📊 Recent Snapshots:\n");
      if (snapshots.length && snapshots[0].values.length) {
        for (const row of snapshots[0].values) {
          const [d, w, total, net] = row;
          console.log(
            `${d} (${w}): $${Number(total).toLocaleString()} | Net: +$${Number(net).toFixed(2)}/week`,
          );
        }
      } else {
        console.log("No snapshots yet");
      }
      break;
    }

    case "compare": {
      const snapshots = db.exec(`
        SELECT date, week, total_value, gross_yield_weekly, borrow_cost_weekly, net_yield_weekly
        FROM defi_snapshots 
        ORDER BY date DESC 
        LIMIT 2
      `);

      if (!snapshots.length || snapshots[0].values.length < 2) {
        console.log("Need at least 2 snapshots to compare");
        break;
      }

      const [current, previous] = snapshots[0].values;
      const [cDate, cWeek, cTotal, cGross, cCost, cNet] = current;
      const [pDate, pWeek, pTotal, pGross, pCost, pNet] = previous;

      const valueDiff = Number(cTotal) - Number(pTotal);
      const valuePct = (valueDiff / Number(pTotal)) * 100;

      console.log("\n📊 Week-on-Week Comparison:\n");
      console.log(`Previous (${pDate}): $${Number(pTotal).toLocaleString()}`);
      console.log(`Current (${cDate}): $${Number(cTotal).toLocaleString()}`);
      console.log(
        `Change: ${valueDiff >= 0 ? "+" : ""}$${valueDiff.toLocaleString()} (${valuePct >= 0 ? "+" : ""}${valuePct.toFixed(2)}%)`,
      );
      console.log(`\nNet Yield: $${Number(pNet).toFixed(2)} → $${Number(cNet).toFixed(2)}/week`);
      break;
    }

    case "prices": {
      const prices = db.exec(`
        SELECT date, asset, price_usd 
        FROM defi_prices 
        ORDER BY date DESC, asset
        LIMIT 20
      `);

      console.log("\n📊 Recent Prices:\n");
      if (prices.length && prices[0].values.length) {
        for (const row of prices[0].values) {
          const [d, asset, price] = row;
          console.log(`${d} | ${asset}: $${price}`);
        }
      } else {
        console.log("No prices yet");
      }
      break;
    }

    case "yields": {
      const yields = db.exec(`
        SELECT date, source, value 
        FROM defi_yields 
        ORDER BY date DESC, source
        LIMIT 20
      `);

      console.log("\n📊 Recent Yields:\n");
      if (yields.length && yields[0].values.length) {
        for (const row of yields[0].values) {
          const [d, source, value] = row;
          console.log(`${d} | ${source}: ${value}%`);
        }
      } else {
        console.log("No yields yet");
      }
      break;
    }

    case "report": {
      // Get latest snapshot
      const snap = db.exec(`SELECT * FROM defi_snapshots ORDER BY date DESC LIMIT 1`);

      // Get latest prices
      const priceRows = db.exec(`
        SELECT asset, price_usd FROM defi_prices 
        WHERE date = (SELECT MAX(date) FROM defi_prices)
      `);

      // Get latest yields
      const yieldRows = db.exec(`
        SELECT source, value FROM defi_yields 
        WHERE date = (SELECT MAX(date) FROM defi_yields)
      `);

      console.log("\n🦙 DEFI REPORT\n");

      if (snap.length && snap[0].values.length) {
        const [id, date, week, total, gross, cost, net] = snap[0].values[0];
        console.log(`📅 Date: ${date} (${week})`);
        console.log(`💰 Portfolio: $${Number(total).toLocaleString()}`);
        console.log(`📈 Gross Yield: +$${Number(gross).toFixed(2)}/week`);
        console.log(`📉 Borrow Cost: -$${Number(cost).toFixed(2)}/week`);
        console.log(`✨ Net Revenue: +$${Number(net).toFixed(2)}/week`);
      }

      if (priceRows.length && priceRows[0].values.length) {
        console.log("\n💹 Prices:");
        for (const [asset, price] of priceRows[0].values) {
          console.log(`   ${asset}: $${price}`);
        }
      }

      if (yieldRows.length && yieldRows[0].values.length) {
        console.log("\n📊 Yields:");
        for (const [source, value] of yieldRows[0].values) {
          console.log(`   ${source}: ${value}%`);
        }
      }
      break;
    }

    default:
      console.log(`
DeFi Monitor - Data Management

Commands:
  init      Initialize tables
  snapshot  Save weekly snapshot (--total, --gross, --cost, --date, --positions)
  price     Save asset price (--asset, --price, --date)
  yield     Save yield/APY (--source, --value, --date)
  list      List recent snapshots
  compare   Compare last 2 snapshots
  prices    List recent prices
  yields    List recent yields
  report    Show latest report data
`);
  }

  db.close();
}

main().catch(console.error);
