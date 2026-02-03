#!/usr/bin/env npx tsx
/**
 * Search Obsidian vault
 * Usage: pnpm tsx search.ts <query>
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { resolve, relative } from "path";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";

interface SearchResult {
  path: string;
  matches: string[];
}

function searchVault(query: string, maxResults: number = 10): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();

  function searchDir(dir: string): void {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      
      const fullPath = resolve(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        const matches: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            // Get context (line with some trimming)
            const line = lines[i].trim();
            if (line.length > 100) {
              const idx = line.toLowerCase().indexOf(queryLower);
              const start = Math.max(0, idx - 40);
              const end = Math.min(line.length, idx + query.length + 40);
              matches.push("..." + line.substring(start, end) + "...");
            } else {
              matches.push(line);
            }
          }
        }
        
        if (matches.length > 0) {
          results.push({
            path: relative(VAULT_PATH, fullPath),
            matches: matches.slice(0, 3),  // Max 3 matches per file
          });
        }
        
        if (results.length >= maxResults) return;
      }
    }
  }

  searchDir(VAULT_PATH);
  return results;
}

// CLI
const query = process.argv.slice(2).join(" ");

if (!query) {
  console.log("Usage: pnpm tsx search.ts <query>");
  process.exit(1);
}

const results = searchVault(query);

if (results.length === 0) {
  console.log(`❌ No results for "${query}"`);
} else {
  console.log(`🔍 Found ${results.length} result(s) for "${query}":\n`);
  
  for (const result of results) {
    console.log(`📄 ${result.path}`);
    for (const match of result.matches) {
      console.log(`   ${match}`);
    }
    console.log("");
  }
}
