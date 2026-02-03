#!/usr/bin/env bun
/**
 * Daily backup script for Clawdbot data
 * - Git commit/push clawdbot repo
 * - Copy SQLite databases to backup location
 */

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const CLAWDBOT_REPO = 'C:\\Users\\jules\\repo\\clawdbot';
const CLAWDBOT_DATA = 'C:\\Users\\jules\\.clawdbot';
const BACKUP_DIR = 'C:\\Users\\jules\\backups\\clawdbot';

const today = new Date().toISOString().split('T')[0];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function runCmd(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e: any) {
    return e.message || 'error';
  }
}

async function main() {
  log('🔄 Starting daily backup...');

  // 1. Git backup - clawdbot repo
  log('📦 Backing up clawdbot repo...');
  const status = runCmd('git status --porcelain', CLAWDBOT_REPO);
  if (status) {
    runCmd('git add -A', CLAWDBOT_REPO);
    runCmd(`git commit -m "Auto-backup ${today}"`, CLAWDBOT_REPO);
    const pushResult = runCmd('git push', CLAWDBOT_REPO);
    log(`Git push: ${pushResult.substring(0, 100)}`);
  } else {
    log('No changes to commit in clawdbot repo');
  }

  // 2. SQLite databases backup
  log('💾 Backing up SQLite databases...');
  const backupSubdir = join(BACKUP_DIR, today);
  if (!existsSync(backupSubdir)) {
    mkdirSync(backupSubdir, { recursive: true });
  }

  const dbFiles = [
    { src: join(CLAWDBOT_DATA, 'local.db'), name: 'local.db' },
    { src: join(CLAWDBOT_DATA, 'memory', 'main.sqlite'), name: 'memory-main.sqlite' },
  ];

  for (const db of dbFiles) {
    if (existsSync(db.src)) {
      const dest = join(backupSubdir, db.name);
      copyFileSync(db.src, dest);
      log(`✅ ${db.name} → ${dest}`);
    } else {
      log(`⚠️ ${db.name} not found`);
    }
  }

  // 3. Cleanup old backups (keep 30 days)
  log('🧹 Cleaning old backups...');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (existsSync(BACKUP_DIR)) {
    const { readdirSync, rmSync, statSync } = await import('fs');
    const dirs = readdirSync(BACKUP_DIR);
    for (const dir of dirs) {
      const dirPath = join(BACKUP_DIR, dir);
      try {
        const stat = statSync(dirPath);
        if (stat.isDirectory() && stat.mtime < thirtyDaysAgo) {
          rmSync(dirPath, { recursive: true });
          log(`🗑️ Deleted old backup: ${dir}`);
        }
      } catch {}
    }
  }

  log('✅ Backup complete!');
}

main().catch(console.error);
