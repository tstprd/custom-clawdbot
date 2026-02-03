#!/usr/bin/env npx tsx
/**
 * Update or create an Obsidian note
 * Usage: pnpm tsx update-note.ts <folder/NoteName> <content>
 * 
 * Examples:
 *   pnpm tsx update-note.ts "People/Jules" "## Nouveau\n- Info ajoutée"
 *   pnpm tsx update-note.ts "Projects/SCPI" "Status: En cours"
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";

interface UpdateOptions {
  mode: "append" | "prepend" | "replace" | "section";
  section?: string;  // For section mode, the section header to update
}

function updateNote(
  notePath: string,
  content: string,
  options: UpdateOptions = { mode: "append" }
): void {
  // Normalize path
  const normalizedPath = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
  const fullPath = resolve(VAULT_PATH, normalizedPath);
  
  // Ensure directory exists
  const dir = dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let existingContent = "";
  if (existsSync(fullPath)) {
    existingContent = readFileSync(fullPath, "utf-8");
  }

  let newContent: string;

  switch (options.mode) {
    case "replace":
      newContent = content;
      break;
      
    case "prepend":
      newContent = content + "\n\n" + existingContent;
      break;
      
    case "section":
      // Update or add a specific section
      if (options.section) {
        const sectionRegex = new RegExp(
          `(## ${options.section}\\n)([\\s\\S]*?)(?=\\n## |$)`,
          "g"
        );
        
        if (sectionRegex.test(existingContent)) {
          newContent = existingContent.replace(
            sectionRegex,
            `## ${options.section}\n${content}\n\n`
          );
        } else {
          // Add new section at the end
          newContent = existingContent.trim() + `\n\n## ${options.section}\n${content}\n`;
        }
      } else {
        newContent = existingContent + "\n\n" + content;
      }
      break;
      
    case "append":
    default:
      if (existingContent) {
        newContent = existingContent.trim() + "\n\n" + content;
      } else {
        // New file - add title
        const title = notePath.split("/").pop()?.replace(".md", "") || "Note";
        newContent = `# ${title}\n\n${content}`;
      }
      break;
  }

  writeFileSync(fullPath, newContent.trim() + "\n");
  console.log(`✅ Note updated: ${normalizedPath}`);
}

// CLI
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage:
  pnpm tsx update-note.ts <folder/NoteName> "<content>" [--mode append|prepend|replace|section] [--section "Section Name"]

Examples:
  pnpm tsx update-note.ts "People/Jules" "- Nouvelle info"
  pnpm tsx update-note.ts "Projects/SCPI" "Status: Signé" --mode section --section "Status"
  pnpm tsx update-note.ts "Daily/2026-01-23" "## Résumé\\n- Point 1" --mode replace
`);
  process.exit(1);
}

const notePath = args[0];
const content = args[1].replace(/\\n/g, "\n");

// Parse options
let mode: UpdateOptions["mode"] = "append";
let section: string | undefined;

for (let i = 2; i < args.length; i++) {
  if (args[i] === "--mode" && args[i + 1]) {
    mode = args[i + 1] as UpdateOptions["mode"];
    i++;
  } else if (args[i] === "--section" && args[i + 1]) {
    section = args[i + 1];
    mode = "section";
    i++;
  }
}

updateNote(notePath, content, { mode, section });
