/**
 * Manage resources table (icons, inspirations, references, links)
 * Stores structured lists for stats and context-efficient retrieval
 */
import { getDb, saveDb } from "./db-init.js";

interface Resource {
  id?: number;
  category: string;
  name: string;
  url?: string;
  tags?: string;
  notes?: string;
  project?: string;
  created_at?: string;
}

async function initResourcesTable() {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT,
      tags TEXT,
      notes TEXT,
      project TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_resources_project ON resources(project);`);
  saveDb(db);
  db.close();
}

async function addResource(r: Resource) {
  const db = await getDb();
  await initResourcesTable();
  
  db.run(
    `INSERT INTO resources (category, name, url, tags, notes, project) VALUES (?, ?, ?, ?, ?, ?)`,
    [r.category, r.name, r.url || null, r.tags || null, r.notes || null, r.project || null]
  );
  saveDb(db);
  
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0];
  db.close();
  
  console.log(`✅ Added resource #${id}: ${r.name}`);
  return id;
}

async function listResources(category?: string, project?: string) {
  const db = await getDb();
  await initResourcesTable();
  
  let query = "SELECT * FROM resources WHERE 1=1";
  const params: string[] = [];
  
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (project) {
    query += " AND project = ?";
    params.push(project);
  }
  
  query += " ORDER BY category, created_at DESC";
  
  const result = db.exec(query, params);
  db.close();
  
  if (!result.length) {
    console.log("📭 No resources found");
    return [];
  }
  
  const cols = result[0].columns;
  const rows = result[0].values.map(row => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
  
  console.table(rows.map(r => ({
    id: r.id,
    cat: r.category,
    name: r.name,
    url: r.url ? '✓' : '',
    tags: r.tags,
    project: r.project || '-'
  })));
  
  return rows;
}

async function stats() {
  const db = await getDb();
  await initResourcesTable();
  
  const result = db.exec(`
    SELECT category, COUNT(*) as count 
    FROM resources 
    GROUP BY category 
    ORDER BY count DESC
  `);
  db.close();
  
  if (!result.length) {
    console.log("📭 No resources");
    return;
  }
  
  console.log("\n📊 Resources by category:");
  for (const row of result[0].values) {
    console.log(`  ${row[0]}: ${row[1]}`);
  }
}

async function deleteResource(id: number) {
  const db = await getDb();
  db.run("DELETE FROM resources WHERE id = ?", [id]);
  saveDb(db);
  db.close();
  console.log(`🗑️ Deleted resource #${id}`);
}

// CLI
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case "add": {
    const category = args[0];
    const name = args[1];
    const url = args.find(a => a.startsWith("--url="))?.split("=")[1];
    const tags = args.find(a => a.startsWith("--tags="))?.split("=")[1];
    const notes = args.find(a => a.startsWith("--notes="))?.split("=")[1];
    const project = args.find(a => a.startsWith("--project="))?.split("=")[1];
    
    if (!category || !name) {
      console.log("Usage: db-resources.ts add <category> <name> [--url=...] [--tags=...] [--notes=...] [--project=...]");
      process.exit(1);
    }
    addResource({ category, name, url, tags, notes, project });
    break;
  }
  
  case "list": {
    const category = args[0];
    const project = args.find(a => a.startsWith("--project="))?.split("=")[1];
    listResources(category, project);
    break;
  }
  
  case "stats":
    stats();
    break;
    
  case "delete": {
    const id = parseInt(args[0]);
    if (isNaN(id)) {
      console.log("Usage: db-resources.ts delete <id>");
      process.exit(1);
    }
    deleteResource(id);
    break;
  }
  
  case "init":
    initResourcesTable().then(() => console.log("✅ Resources table ready"));
    break;
  
  default:
    console.log(`
📦 Resources Database

Commands:
  init                                    Create table
  add <category> <name> [options]         Add resource
  list [category] [--project=...]         List resources  
  stats                                   Show counts by category
  delete <id>                             Remove resource

Options for add:
  --url=<url>
  --tags=<comma,separated>
  --notes=<text>
  --project=<project-name>

Examples:
  pnpm tsx skills/local-db/scripts/db-resources.ts add icons "Phosphor" --url=https://phosphoricons.com --tags=svg,react
  pnpm tsx skills/local-db/scripts/db-resources.ts list icons
  pnpm tsx skills/local-db/scripts/db-resources.ts list --project=deskpanel
`);
}
