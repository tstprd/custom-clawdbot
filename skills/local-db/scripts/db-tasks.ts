/**
 * Task management utilities for local SQLite database
 * Usage:
 *   pnpm tsx db-tasks.ts add "Task title" [--list Perso] [--due 2026-01-25] [--reminder "2026-01-24 10:00"]
 *   pnpm tsx db-tasks.ts list [--all] [--list Perso]
 *   pnpm tsx db-tasks.ts today
 *   pnpm tsx db-tasks.ts reminders
 *   pnpm tsx db-tasks.ts done <id>
 *   pnpm tsx db-tasks.ts delete <id>
 */
import initSqlJs, { type Database } from "sql.js";
import { resolve } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

const DB_PATH = resolve(homedir(), ".clawdbot", "local.db");

async function getDb(): Promise<Database> {
  const SQL = await initSqlJs();
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

interface Task {
  id: number;
  title: string;
  notes: string | null;
  list_name: string | null;
  status: string;
  priority: number;
  due_date: string | null;
  reminder_at: string | null;
  created_at: string;
}

// Add a task
export async function addTask(
  title: string,
  options: {
    notes?: string;
    list?: string;
    dueDate?: string;
    reminderAt?: string;
    priority?: number;
  } = {}
): Promise<number> {
  const db = await getDb();

  let listId: number | null = null;
  if (options.list) {
    const result = db.exec("SELECT id FROM lists WHERE name = ?", [options.list]);
    if (result.length > 0 && result[0].values.length > 0) {
      listId = result[0].values[0][0] as number;
    } else {
      // Create the list if it doesn't exist
      db.run("INSERT INTO lists (name) VALUES (?)", [options.list]);
      const idResult = db.exec("SELECT last_insert_rowid()");
      listId = idResult[0].values[0][0] as number;
    }
  }

  db.run(
    `INSERT INTO tasks (title, notes, list_id, due_date, reminder_at, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      title,
      options.notes || null,
      listId,
      options.dueDate || null,
      options.reminderAt || null,
      options.priority || 0,
    ]
  );

  const idResult = db.exec("SELECT last_insert_rowid()");
  const id = idResult[0].values[0][0] as number;

  saveDb(db);
  db.close();
  return id;
}

// List tasks
export async function listTasks(options: {
  all?: boolean;
  list?: string;
  today?: boolean;
  withReminders?: boolean;
}): Promise<Task[]> {
  const db = await getDb();

  let query = `
    SELECT t.id, t.title, t.notes, l.name as list_name, t.status, t.priority, 
           t.due_date, t.reminder_at, t.created_at
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (!options.all) {
    query += " AND t.status = 'pending'";
  }

  if (options.list) {
    query += " AND l.name = ?";
    params.push(options.list);
  }

  if (options.today) {
    query += " AND date(t.due_date) <= date('now')";
  }

  if (options.withReminders) {
    query +=
      " AND t.reminder_at IS NOT NULL AND t.reminder_sent = 0 AND datetime(t.reminder_at) <= datetime('now')";
  }

  query += " ORDER BY t.priority DESC, t.due_date ASC, t.created_at DESC";

  const result = db.exec(query, params);
  db.close();

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const task: any = {};
    columns.forEach((col, i) => {
      task[col] = row[i];
    });
    return task as Task;
  });
}

// Get tasks due today or overdue
export async function getTodayTasks(): Promise<Task[]> {
  return listTasks({ today: true });
}

// Get tasks with pending reminders
export async function getPendingReminders(): Promise<Task[]> {
  return listTasks({ withReminders: true });
}

// Mark task as done
export async function completeTask(id: number): Promise<boolean> {
  const db = await getDb();
  db.run(
    `UPDATE tasks 
     SET status = 'done', completed_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
    [id]
  );
  const changes = db.getRowsModified();
  saveDb(db);
  db.close();
  return changes > 0;
}

// Delete task
export async function deleteTask(id: number): Promise<boolean> {
  const db = await getDb();
  db.run("DELETE FROM tasks WHERE id = ?", [id]);
  const changes = db.getRowsModified();
  saveDb(db);
  db.close();
  return changes > 0;
}

// Mark reminder as sent
export async function markReminderSent(id: number): Promise<void> {
  const db = await getDb();
  db.run("UPDATE tasks SET reminder_sent = 1 WHERE id = ?", [id]);
  saveDb(db);
  db.close();
}

// Get all lists
export async function getLists(): Promise<{ id: number; name: string }[]> {
  const db = await getDb();
  const result = db.exec("SELECT id, name FROM lists ORDER BY name");
  db.close();

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
  }));
}

// Format tasks for display
export function formatTasks(tasks: Task[]): string {
  if (tasks.length === 0) return "Aucune tâche.";

  return tasks
    .map((t) => {
      let line = `[${t.id}] ${t.title}`;
      if (t.list_name) line += ` (${t.list_name})`;
      if (t.due_date) line += ` 📅 ${t.due_date}`;
      if (t.reminder_at) line += ` ⏰ ${t.reminder_at}`;
      if (t.status === "done") line += " ✅";
      return line;
    })
    .join("\n");
}

// CLI
const isMain = process.argv[1]?.includes("db-tasks");
if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    switch (command) {
      case "add": {
        const title = args[1];
        if (!title) {
          console.error(
            "Usage: pnpm tsx db-tasks.ts add <title> [--list X] [--due YYYY-MM-DD] [--reminder 'YYYY-MM-DD HH:MM']"
          );
          process.exit(1);
        }
        const listIdx = args.indexOf("--list");
        const dueIdx = args.indexOf("--due");
        const reminderIdx = args.indexOf("--reminder");

        const id = await addTask(title, {
          list: listIdx > -1 ? args[listIdx + 1] : undefined,
          dueDate: dueIdx > -1 ? args[dueIdx + 1] : undefined,
          reminderAt: reminderIdx > -1 ? args[reminderIdx + 1] : undefined,
        });
        console.log(`✅ Tâche #${id} ajoutée: ${title}`);
        break;
      }

      case "list": {
        const allFlag = args.includes("--all");
        const listIdx = args.indexOf("--list");
        const tasks = await listTasks({
          all: allFlag,
          list: listIdx > -1 ? args[listIdx + 1] : undefined,
        });
        console.log(formatTasks(tasks));
        break;
      }

      case "today": {
        const tasks = await getTodayTasks();
        console.log("📋 Tâches du jour:\n" + formatTasks(tasks));
        break;
      }

      case "reminders": {
        const tasks = await getPendingReminders();
        console.log("⏰ Rappels en attente:\n" + formatTasks(tasks));
        break;
      }

      case "done": {
        const id = parseInt(args[1]);
        if (await completeTask(id)) {
          console.log(`✅ Tâche #${id} terminée`);
        } else {
          console.error(`❌ Tâche #${id} non trouvée`);
        }
        break;
      }

      case "delete": {
        const id = parseInt(args[1]);
        if (await deleteTask(id)) {
          console.log(`🗑️ Tâche #${id} supprimée`);
        } else {
          console.error(`❌ Tâche #${id} non trouvée`);
        }
        break;
      }

      case "lists": {
        const lists = await getLists();
        console.log("📂 Listes:\n" + lists.map((l) => `- ${l.name}`).join("\n"));
        break;
      }

      default:
        console.log(`
Usage:
  pnpm tsx db-tasks.ts add <title> [--list X] [--due YYYY-MM-DD] [--reminder 'YYYY-MM-DD HH:MM']
  pnpm tsx db-tasks.ts list [--all] [--list X]
  pnpm tsx db-tasks.ts today
  pnpm tsx db-tasks.ts reminders
  pnpm tsx db-tasks.ts done <id>
  pnpm tsx db-tasks.ts delete <id>
  pnpm tsx db-tasks.ts lists
        `);
    }
  })().catch(console.error);
}
