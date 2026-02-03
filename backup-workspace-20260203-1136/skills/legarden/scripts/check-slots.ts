#!/usr/bin/env npx tsx
/**
 * Check available squash slots at Le Garden
 * Usage: pnpm tsx check-slots.ts --date 2026-01-26 [--time 10:00]
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

const CREDS_PATH = resolve(homedir(), ".clawdbot", "credentials", "legarden-squash.json");

interface Credentials {
  email: string;
  password: string;
  url: string;
  preferences: {
    courtOrder: number[];
    defaultDuration: number;
    preferredDays: string[];
    preferredTimes: string[];
  };
}

function loadCredentials(): Credentials {
  if (!existsSync(CREDS_PATH)) {
    throw new Error("Credentials not found. Run setup first.");
  }
  return JSON.parse(readFileSync(CREDS_PATH, "utf-8"));
}

function parseArgs(): { date: string; time?: string } {
  const args = process.argv.slice(2);
  let date = "";
  let time: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" && args[i + 1]) {
      date = args[i + 1];
      i++;
    } else if (args[i] === "--time" && args[i + 1]) {
      time = args[i + 1];
      i++;
    }
  }

  if (!date) {
    // Default to next Sunday
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    date = nextSunday.toISOString().split("T")[0];
  }

  return { date, time };
}

async function main(): Promise<void> {
  const creds = loadCredentials();
  const { date, time } = parseArgs();

  console.log(`🎾 Le Garden - Vérification créneaux`);
  console.log(`📅 Date: ${date}`);
  if (time) console.log(`⏰ Heure: ${time}`);
  console.log(`🏆 Terrains préférés: ${creds.preferences.courtOrder.join(" → ")}`);
  console.log("");
  console.log("⚠️  Pour vérifier les créneaux, utilise le navigateur:");
  console.log(`    1. Va sur ${creds.url}`);
  console.log(`    2. Clique sur "Réserver"`);
  console.log(`    3. Sélectionne la date ${date}`);
  console.log(`    4. Regarde les créneaux disponibles`);
  console.log("");
  console.log("💡 Demande à Dwight de le faire via browser automation!");
}

main().catch(console.error);
