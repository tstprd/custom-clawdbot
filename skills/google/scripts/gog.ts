/**
 * Google API wrapper using gogcli
 * Replaces the old OAuth token management with gogcli commands
 * 
 * Usage: 
 *   import { gog } from './gog';
 *   const emails = await gog('jmudes76000@gmail.com', ['gmail', 'search', 'is:unread', '--limit', '5', '--json']);
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const GOG_PATH = 'C:\\Users\\jules\\repo\\gogcli\\bin\\gog.exe';

export type GogAccount = 'jmudes76000@gmail.com' | 'alejmurot@gmail.com';

/**
 * Execute a gogcli command and return the result
 */
export async function gog(account: GogAccount, args: string[]): Promise<string> {
  const cmd = `"${GOG_PATH}" --account "${account}" ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
  
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(`gogcli error: ${error.message}`);
  }
}

/**
 * Execute a gogcli command and parse JSON result
 */
export async function gogJson<T = any>(account: GogAccount, args: string[]): Promise<T> {
  // Add --json flag if not present
  const jsonArgs = args.includes('--json') ? args : [...args, '--json'];
  const result = await gog(account, jsonArgs);
  return JSON.parse(result);
}

/**
 * Sync version for simple scripts
 */
export function gogSync(account: GogAccount, args: string[]): string {
  const cmd = `"${GOG_PATH}" --account "${account}" ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
  return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
}

// ============ GMAIL HELPERS ============

export async function searchEmails(account: GogAccount, query: string, limit = 10) {
  return gogJson(account, ['gmail', 'search', query, '--limit', String(limit)]);
}

export async function getUnreadEmails(account: GogAccount, limit = 10) {
  return searchEmails(account, 'is:unread', limit);
}

export async function markEmailRead(account: GogAccount, messageId: string) {
  return gog(account, ['gmail', 'modify', messageId, '--remove-labels', 'UNREAD']);
}

// ============ CALENDAR HELPERS ============

export async function listEvents(account: GogAccount, days = 7) {
  return gogJson(account, ['calendar', 'list', '--days', String(days)]);
}

export async function createEvent(account: GogAccount, summary: string, start: string, end?: string) {
  const args = ['calendar', 'create', summary, '--start', start];
  if (end) args.push('--end', end);
  return gog(account, args);
}

// ============ TASKS HELPERS ============

export async function listTaskLists(account: GogAccount) {
  return gogJson(account, ['tasks', 'lists']);
}

export async function listTasks(account: GogAccount, listName: string) {
  return gogJson(account, ['tasks', 'list', listName]);
}

export async function addTask(account: GogAccount, listName: string, title: string) {
  return gog(account, ['tasks', 'add', listName, title]);
}

export async function completeTask(account: GogAccount, listName: string, taskId: string) {
  return gog(account, ['tasks', 'done', listName, taskId]);
}

// ============ CLI ============

const args = process.argv.slice(2);
if (args.length > 0) {
  const account = (args[0] as GogAccount) || 'jmudes76000@gmail.com';
  const gogArgs = args.slice(1);
  
  if (gogArgs.length === 0) {
    console.log(`
Google CLI wrapper using gogcli

Usage: pnpm tsx gog.ts <account> <gog-command> [args...]

Accounts:
  jmudes76000@gmail.com (default)
  alejmurot@gmail.com

Examples:
  pnpm tsx gog.ts jmudes76000@gmail.com gmail search "is:unread" --limit 5
  pnpm tsx gog.ts alejmurot@gmail.com tasks lists
  pnpm tsx gog.ts jmudes76000@gmail.com calendar list --days 7
`);
    process.exit(0);
  }
  
  gog(account, gogArgs)
    .then(result => console.log(result))
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}
