#!/usr/bin/env npx tsx
/**
 * Health dashboard - check all systems
 * Runs weekly to ensure everything is working
 */
import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

interface HealthCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
}

function runCmd(cmd: string, timeout: number = 10000): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout, shell: "powershell.exe" }).trim();
  } catch (e: any) {
    return `ERROR: ${e.message}`;
  }
}

async function checkGateway(): Promise<HealthCheck> {
  const result = runCmd("clawdbot health --json");
  try {
    const health = JSON.parse(result);
    if (health.status === "ok") {
      return { name: "Gateway", status: "ok", message: "Running" };
    }
    return { name: "Gateway", status: "warning", message: health.status };
  } catch {
    return { name: "Gateway", status: "error", message: "Not responding" };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const dbPath = resolve(homedir(), ".clawdbot", "local.db");
  if (existsSync(dbPath)) {
    const stats = statSync(dbPath);
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
    return { name: "SQLite DB", status: "ok", message: `${sizeMb} MB` };
  }
  return { name: "SQLite DB", status: "error", message: "Not found" };
}

async function checkHomeAssistant(): Promise<HealthCheck> {
  const result = runCmd("pnpm tsx skills/homeassistant/scripts/ha.ts search --domain light", 15000);
  if (result.includes("ERROR") || result.includes("error")) {
    return { name: "Home Assistant", status: "error", message: "Connection failed" };
  }
  const count = (result.match(/Found (\d+)/)?.[1]) || "?";
  return { name: "Home Assistant", status: "ok", message: `${count} entities` };
}

async function checkGog(): Promise<HealthCheck> {
  const result = runCmd("C:\\Users\\jules\\repo\\gogcli\\bin\\gog.exe --version");
  if (result.includes("ERROR")) {
    return { name: "gogcli", status: "error", message: "Not installed" };
  }
  return { name: "gogcli", status: "ok", message: result.split("\n")[0] };
}

async function checkLobster(): Promise<HealthCheck> {
  const result = runCmd("powershell -File C:\\Users\\jules\\repo\\lobster\\bin\\lobster.ps1 version");
  if (result.includes("ERROR") || !result) {
    return { name: "Lobster", status: "error", message: "Not working" };
  }
  return { name: "Lobster", status: "ok", message: `v${result.trim()}` };
}

async function checkObsidian(): Promise<HealthCheck> {
  const vaultPath = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";
  if (!existsSync(vaultPath)) {
    return { name: "Obsidian", status: "error", message: "Vault not found" };
  }
  
  // Check git status
  const result = runCmd(`cd ${vaultPath.replace(/\\/g, "/")} ; git status --porcelain`);
  const uncommitted = result.split("\n").filter(l => l.trim()).length;
  
  if (uncommitted > 0) {
    return { name: "Obsidian", status: "warning", message: `${uncommitted} uncommitted changes` };
  }
  return { name: "Obsidian", status: "ok", message: "Synced" };
}

async function checkCrons(): Promise<HealthCheck> {
  const result = runCmd("clawdbot cron list --json");
  try {
    const crons = JSON.parse(result);
    const enabled = crons.jobs?.filter((j: any) => j.enabled).length || 0;
    const total = crons.jobs?.length || 0;
    return { name: "Cron Jobs", status: "ok", message: `${enabled}/${total} enabled` };
  } catch {
    return { name: "Cron Jobs", status: "error", message: "Failed to list" };
  }
}

async function checkDiskSpace(): Promise<HealthCheck> {
  const result = runCmd("Get-PSDrive C | Select-Object -ExpandProperty Free");
  try {
    const freeBytes = parseInt(result);
    const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(1);
    if (parseFloat(freeGb) < 10) {
      return { name: "Disk Space", status: "warning", message: `${freeGb} GB free` };
    }
    return { name: "Disk Space", status: "ok", message: `${freeGb} GB free` };
  } catch {
    return { name: "Disk Space", status: "error", message: "Check failed" };
  }
}

async function runHealthCheck(): Promise<void> {
  console.log("🏥 **Health Dashboard**\n");
  
  const checks: HealthCheck[] = [];
  
  // Run all checks
  checks.push(await checkGateway());
  checks.push(await checkDatabase());
  checks.push(await checkHomeAssistant());
  checks.push(await checkGog());
  checks.push(await checkLobster());
  checks.push(await checkObsidian());
  checks.push(await checkCrons());
  checks.push(await checkDiskSpace());
  
  // Format output
  const statusEmoji = {
    ok: "✅",
    warning: "⚠️",
    error: "❌",
  };
  
  for (const check of checks) {
    console.log(`${statusEmoji[check.status]} **${check.name}**: ${check.message}`);
  }
  
  // Summary
  const errors = checks.filter(c => c.status === "error").length;
  const warnings = checks.filter(c => c.status === "warning").length;
  
  console.log("");
  if (errors > 0) {
    console.log(`🚨 ${errors} error(s), ${warnings} warning(s)`);
  } else if (warnings > 0) {
    console.log(`⚠️ ${warnings} warning(s), all systems operational`);
  } else {
    console.log("🎉 All systems operational!");
  }
}

runHealthCheck().catch(console.error);
