#!/usr/bin/env tsx
/**
 * Gestion des recettes
 * Usage:
 *   pnpm tsx skills/local-db/scripts/recipes.ts init          # Crée la table
 *   pnpm tsx skills/local-db/scripts/recipes.ts add "Nom" ... # Ajoute une recette
 *   pnpm tsx skills/local-db/scripts/recipes.ts list          # Liste toutes les recettes
 *   pnpm tsx skills/local-db/scripts/recipes.ts search "mot"  # Recherche
 *   pnpm tsx skills/local-db/scripts/recipes.ts random        # Recette aléatoire
 *   pnpm tsx skills/local-db/scripts/recipes.ts vg            # Recettes végétariennes
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

// Initialisation de la table
async function init() {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      servings INTEGER DEFAULT 2,
      prep_time_min INTEGER,
      cook_time_min INTEGER,
      difficulty TEXT CHECK(difficulty IN ('facile', 'moyen', 'difficile')),
      vegetarian BOOLEAN DEFAULT 0,
      ingredients TEXT,
      instructions TEXT,
      notes TEXT,
      source TEXT,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      last_made DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_recipes_vegetarian ON recipes(vegetarian)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name)`);
  saveDb(db);
  console.log("✅ Table recipes créée/vérifiée");
}

// Ajouter une recette
async function add(args: string[]) {
  const name = args[0];
  if (!name) {
    console.error("Usage: recipes.ts add <nom> [--cat <catégorie>] [--vg] [--servings <n>] [--prep <min>] [--cook <min>] [--diff <facile|moyen|difficile>]");
    process.exit(1);
  }

  const opts: Record<string, any> = { 
    name,
    category: null,
    servings: 2,
    prep_time_min: null,
    cook_time_min: null,
    difficulty: null,
    vegetarian: 0,
    ingredients: null,
    instructions: null,
    notes: null,
    source: null,
    rating: null
  };
  
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--cat": opts.category = args[++i]; break;
      case "--vg": opts.vegetarian = 1; break;
      case "--servings": opts.servings = parseInt(args[++i]); break;
      case "--prep": opts.prep_time_min = parseInt(args[++i]); break;
      case "--cook": opts.cook_time_min = parseInt(args[++i]); break;
      case "--diff": opts.difficulty = args[++i]; break;
      case "--ingredients": opts.ingredients = args[++i]; break;
      case "--instructions": opts.instructions = args[++i]; break;
      case "--notes": opts.notes = args[++i]; break;
      case "--source": opts.source = args[++i]; break;
      case "--rating": opts.rating = parseInt(args[++i]); break;
    }
  }

  const db = await getDb();
  db.run(`
    INSERT INTO recipes (name, category, servings, prep_time_min, cook_time_min, difficulty, vegetarian, ingredients, instructions, notes, source, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [opts.name, opts.category, opts.servings, opts.prep_time_min, opts.cook_time_min, opts.difficulty, opts.vegetarian, opts.ingredients, opts.instructions, opts.notes, opts.source, opts.rating]);
  
  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0]?.values[0]?.[0];
  saveDb(db);
  console.log(`✅ Recette "${name}" ajoutée (id: ${id})`);
}

// Lister les recettes
async function list() {
  const db = await getDb();
  const result = db.exec(`
    SELECT id, name, category, servings, prep_time_min, cook_time_min, difficulty, vegetarian, rating
    FROM recipes ORDER BY name
  `);

  if (!result.length || !result[0].values.length) {
    console.log("📭 Aucune recette encore. Utilise 'add' pour en ajouter.");
    return;
  }

  const recipes = result[0].values.map(row => ({
    id: row[0], name: row[1], category: row[2], servings: row[3],
    prep_time_min: row[4], cook_time_min: row[5], difficulty: row[6],
    vegetarian: row[7], rating: row[8]
  }));

  console.log(`🍳 **${recipes.length} recettes**\n`);
  for (const r of recipes) {
    const vg = r.vegetarian ? "🥬" : "";
    const time = r.prep_time_min || r.cook_time_min 
      ? `⏱️ ${((r.prep_time_min as number) || 0) + ((r.cook_time_min as number) || 0)}min` 
      : "";
    const stars = r.rating ? "⭐".repeat(r.rating as number) : "";
    console.log(`- **${r.name}** ${vg} ${time} ${stars}`);
    if (r.category) console.log(`  📁 ${r.category}`);
  }
}

// Rechercher
async function search(query: string) {
  if (!query) {
    console.error("Usage: recipes.ts search <mot-clé>");
    process.exit(1);
  }

  const db = await getDb();
  const result = db.exec(`
    SELECT * FROM recipes 
    WHERE name LIKE '%${query}%' OR ingredients LIKE '%${query}%' OR category LIKE '%${query}%' OR notes LIKE '%${query}%'
    ORDER BY name
  `);

  if (!result.length || !result[0].values.length) {
    console.log(`❌ Aucune recette trouvée pour "${query}"`);
    return;
  }

  const cols = result[0].columns;
  const recipes = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });

  console.log(`🔍 ${recipes.length} résultat(s) pour "${query}":\n`);
  for (const r of recipes) {
    printRecipe(r);
  }
}

// Recette aléatoire
async function random() {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM recipes ORDER BY RANDOM() LIMIT 1`);
  
  if (!result.length || !result[0].values.length) {
    console.log("📭 Aucune recette dans la base.");
    return;
  }

  const cols = result[0].columns;
  const row = result[0].values[0];
  const recipe: any = {};
  cols.forEach((c, i) => recipe[c] = row[i]);

  console.log("🎲 **Recette aléatoire:**\n");
  printRecipe(recipe);
}

// Recettes végétariennes
async function vg() {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM recipes WHERE vegetarian = 1 ORDER BY name`);
  
  if (!result.length || !result[0].values.length) {
    console.log("🥬 Aucune recette végétarienne.");
    return;
  }

  const cols = result[0].columns;
  const recipes = result[0].values.map(row => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });

  console.log(`🥬 **${recipes.length} recettes végétariennes:**\n`);
  for (const r of recipes) {
    const time = r.prep_time_min || r.cook_time_min 
      ? `⏱️ ${(r.prep_time_min || 0) + (r.cook_time_min || 0)}min` 
      : "";
    console.log(`- **${r.name}** ${time}`);
  }
}

// Afficher une recette complète
function printRecipe(r: any) {
  const vg = r.vegetarian ? " 🥬" : "";
  console.log(`### ${r.name}${vg}`);
  if (r.category) console.log(`📁 ${r.category}`);
  if (r.servings) console.log(`👥 ${r.servings} personnes`);
  if (r.prep_time_min || r.cook_time_min) {
    console.log(`⏱️ Prépa: ${r.prep_time_min || 0}min | Cuisson: ${r.cook_time_min || 0}min`);
  }
  if (r.difficulty) console.log(`📊 ${r.difficulty}`);
  if (r.rating) console.log(`⭐ ${r.rating}/5`);
  if (r.ingredients) console.log(`\n**Ingrédients:**\n${r.ingredients}`);
  if (r.instructions) console.log(`\n**Instructions:**\n${r.instructions}`);
  if (r.notes) console.log(`\n💡 ${r.notes}`);
  if (r.source) console.log(`📖 Source: ${r.source}`);
  console.log("");
}

// Afficher une recette par ID
async function get(id: string) {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM recipes WHERE id = ${parseInt(id)}`);
  
  if (!result.length || !result[0].values.length) {
    console.log(`❌ Recette #${id} introuvable`);
    return;
  }
  
  const cols = result[0].columns;
  const row = result[0].values[0];
  const recipe: any = {};
  cols.forEach((c, i) => recipe[c] = row[i]);
  
  printRecipe(recipe);
}

// Mettre à jour le rating
async function rate(args: string[]) {
  const [id, rating] = args;
  if (!id || !rating) {
    console.error("Usage: recipes.ts rate <id> <1-5>");
    process.exit(1);
  }
  
  const db = await getDb();
  db.run(`UPDATE recipes SET rating = ? WHERE id = ?`, [parseInt(rating), parseInt(id)]);
  saveDb(db);
  console.log(`✅ Recette #${id} notée ${rating}/5`);
}

// Marquer comme faite
async function made(id: string) {
  const db = await getDb();
  db.run(`UPDATE recipes SET last_made = date('now') WHERE id = ?`, [parseInt(id)]);
  saveDb(db);
  console.log(`✅ Recette #${id} marquée comme faite aujourd'hui`);
}

// Main
async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "init": await init(); break;
    case "add": await add(args); break;
    case "list": await list(); break;
    case "search": await search(args[0]); break;
    case "random": await random(); break;
    case "vg": await vg(); break;
    case "get": await get(args[0]); break;
    case "rate": await rate(args); break;
    case "made": await made(args[0]); break;
    default:
      console.log(`Usage: recipes.ts <init|add|list|search|random|vg|get|rate|made>`);
  }
}

main();
