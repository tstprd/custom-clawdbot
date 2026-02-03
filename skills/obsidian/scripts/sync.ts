#!/usr/bin/env npx tsx
/**
 * Obsidian vault sync - commit and push to GitHub
 */
import { execSync } from "child_process";
import { existsSync } from "fs";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault";

function run(cmd: string, cwd: string = VAULT_PATH): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 30000 }).trim();
  } catch (e: any) {
    return e.message;
  }
}

async function sync(): Promise<void> {
  if (!existsSync(VAULT_PATH)) {
    console.error(`❌ Vault not found: ${VAULT_PATH}`);
    process.exit(1);
  }

  console.log("📚 Syncing Obsidian vault...\n");

  // Check git status
  const status = run("git status --porcelain");
  
  if (!status) {
    console.log("✅ Vault is up to date, no changes to sync.");
    return;
  }

  console.log("📝 Changes detected:");
  console.log(status);
  console.log("");

  // Add all changes
  run("git add -A");

  // Commit with timestamp
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0];
  const commitMsg = `Sync ${timestamp}`;
  
  const commitResult = run(`git commit -m "${commitMsg}"`);
  console.log(commitResult);

  // Push
  console.log("\n🚀 Pushing to GitHub...");
  const pushResult = run("git push");
  
  if (pushResult.includes("error") || pushResult.includes("fatal")) {
    console.error("❌ Push failed:", pushResult);
    process.exit(1);
  }

  console.log("✅ Vault synced successfully!");
}

sync().catch(console.error);
