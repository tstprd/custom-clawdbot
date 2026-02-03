/**
 * gog CLI wrapper - auth perpétuelle, pas de tokens manuels
 * Utiliser ce module pour TOUTES les interactions Google
 */
import { execSync } from 'child_process';

const GOG_CMD = 'gog';

export interface GogOptions {
  account: string;
  timeout?: number;
}

/**
 * Execute gog command and return raw output
 */
export function gog(args: string[], options: GogOptions): string {
  const { account, timeout = 30000 } = options;
  const cmd = `${GOG_CMD} ${args.join(' ')} --account ${account}`;
  
  try {
    return execSync(cmd, { 
      encoding: 'utf-8', 
      timeout,
      shell: 'powershell.exe',
      windowsHide: true
    }).trim();
  } catch (e: any) {
    throw new Error(`gog error: ${e.message}`);
  }
}

/**
 * Execute gog command and parse JSON output
 */
export function gogJson<T = any>(args: string[], options: GogOptions): T {
  const output = gog([...args, '--json'], options);
  return JSON.parse(output);
}

// === Gmail helpers ===

export interface GmailThread {
  id: string;
  date: string;
  from: string;
  subject: string;
  labels: string[];
  messageCount: number;
}

export interface GmailSearchResult {
  nextPageToken?: string;
  threads: GmailThread[];
}

export function gmailSearch(query: string, account: string, limit = 20): GmailSearchResult {
  return gogJson<GmailSearchResult>(
    ['gmail', 'search', `"${query}"`, '--limit', String(limit)],
    { account }
  );
}

export function gmailMarkRead(threadId: string, account: string): void {
  gog(['gmail', 'thread', 'modify', threadId, '--remove=UNREAD', '--no-input'], { account });
}

export function gmailMarkReadBatch(threadIds: string[], account: string): void {
  for (const id of threadIds) {
    gmailMarkRead(id, account);
  }
}

// === Calendar helpers ===

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  reminders?: any;
}

export interface CalendarEventsResult {
  events: CalendarEvent[];
}

export function calendarEvents(account: string, days = 7): CalendarEventsResult {
  return gogJson<CalendarEventsResult>(
    ['calendar', 'events', '--days', String(days)],
    { account }
  );
}

export function calendarSearch(query: string, account: string): CalendarEventsResult {
  return gogJson<CalendarEventsResult>(
    ['calendar', 'search', `"${query}"`],
    { account }
  );
}

// === Tasks helpers ===

export interface TaskList {
  id: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  notes?: string;
}

export interface TaskListsResult {
  lists: TaskList[];
}

export interface TasksResult {
  tasks: Task[];
}

export function taskLists(account: string): TaskListsResult {
  return gogJson<TaskListsResult>(['tasks', 'lists', 'list'], { account });
}

export function tasksList(tasklistId: string, account: string): TasksResult {
  return gogJson<TasksResult>(['tasks', 'list', tasklistId], { account });
}

export function taskAdd(tasklistId: string, title: string, account: string): void {
  gog(['tasks', 'add', tasklistId, '--title', `"${title}"`], { account });
}

export function taskDone(tasklistId: string, taskId: string, account: string): void {
  gog(['tasks', 'done', tasklistId, taskId], { account });
}

// === Accounts ===

export const ACCOUNTS = {
  jmudes: 'jmudes76000@gmail.com',
  alejmurot: 'alejmurot@gmail.com'
} as const;
