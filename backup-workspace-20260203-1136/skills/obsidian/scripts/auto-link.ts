#!/usr/bin/env npx tsx
/**
 * Auto-link: Create and update notes based on detected entities
 * - Creates notes for new entities
 * - Adds backlinks between related notes
 * - Updates existing notes with new context
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname } from "path";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";

// Entity definitions with their folder and template
interface EntityDef {
  folder: string;
  template: (name: string) => string;
  aliases: string[];
}

const ENTITIES: Record<string, EntityDef> = {
  // People
  "Anne-Laure": {
    folder: "People",
    template: (name) => `# ${name}\n\n## À propos\n\nPartenaire de [[Jules]].\n\n## Notes\n`,
    aliases: ["al", "anne laure"],
  },
  "Jules": {
    folder: "People",
    template: (name) => `# ${name}\n\n## Identité\n\n## Projets\n\n## Notes\n`,
    aliases: ["moi", "je"],
  },
  
  // Projects
  "SCPI Aurel Ruiz": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nInvestissement immobilier (SCPI)\n\n## Status\n\nEn cours\n\n## Documents\n\n## Notes\n`,
    aliases: ["scpi", "aurel ruiz", "kays", "kays wm"],
  },
  "Claustra Mabilais": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nTravaux claustra - Ateliers de la Mabilais\n\n## Status\n\n## Devis\n\n## Notes\n`,
    aliases: ["claustra", "mabilais"],
  },
  "Chambre Bébé": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nAménagement chambre bébé (naissance mai 2026)\n\n## TODO\n\n## Achats\n\n## Notes\n`,
    aliases: ["bébé", "chambre bebe", "naissance"],
  },
  "Crèche": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nRecherche crèche pour bébé\n\n## Inscriptions\n\n## Visites\n\n## Notes\n`,
    aliases: ["creche", "crèches"],
  },
  "Bot-as-a-Service": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nIdée business: Bot multi-messagerie\n\n## Concept\n\n## MVP\n\n## Notes\n`,
    aliases: ["bot saas", "bot-saas"],
  },
  "Doula Agentic": {
    folder: "Projects",
    template: (name) => `# ${name}\n\nIdée business: Assistant IA pour grossesse\n\n## Concept\n\n## Partenaires\n\n## Notes\n`,
    aliases: ["doula", "thea"],
  },
  
  // Places
  "Appartement Rennes": {
    folder: "Places",
    template: (name) => `# ${name}\n\nAppartement ~100m² sur 2 niveaux\n\n## Étage (haut)\n- Salon\n- Cuisine\n- Entrée\n\n## RDC (bas)\n- Bureaux\n- Chambre\n- SDB\n\n## Notes\n`,
    aliases: ["rennes", "appart", "appartement", "maison"],
  },
  "Sauna Aqua Tonic": {
    folder: "Places",
    template: (name) => `# ${name}\n\nCentre bien-être / sauna\n\n## Infos\n- Prix: 35€/séance\n- Préférence: midi en semaine\n\n## Notes\n`,
    aliases: ["aqua tonic", "sauna"],
  },
  
  // Work
  "Capgemini": {
    folder: "Work",
    template: (name) => `# ${name}\n\nEmployeur de [[Jules]]\n\n## Notes\n`,
    aliases: ["capgemini", "cap", "travail", "boulot"],
  },
  
  // Tech
  "Home Assistant": {
    folder: "Tech",
    template: (name) => `# ${name}\n\nDomotique maison\n\n## Intégrations\n\n## Automations\n\n## Notes\n`,
    aliases: ["home assistant", "ha", "domotique"],
  },
  "Lobster": {
    folder: "Tech",
    template: (name) => `# ${name}\n\nWorkflow shell pour Clawdbot\n\n## Commandes\n\n## Workflows\n\n## Notes\n`,
    aliases: ["lobster"],
  },
  "Obsidian": {
    folder: "Tech",
    template: (name) => `# ${name}\n\nKnowledge management\n\n## Vault\n\n## Plugins\n\n## Notes\n`,
    aliases: ["obsidian", "vault"],
  },
  "Clawdbot": {
    folder: "Tech",
    template: (name) => `# ${name}\n\nAssistant IA personnel\n\n## Config\n\n## Skills\n\n## Notes\n`,
    aliases: ["clawdbot", "clawd", "dwight"],
  },
};

function findEntityByAlias(text: string): string | null {
  const textLower = text.toLowerCase();
  
  for (const [entityName, def] of Object.entries(ENTITIES)) {
    for (const alias of def.aliases) {
      if (textLower.includes(alias)) {
        return entityName;
      }
    }
  }
  
  return null;
}

function ensureNoteExists(entityName: string): boolean {
  const def = ENTITIES[entityName];
  if (!def) return false;
  
  const notePath = resolve(VAULT_PATH, def.folder, `${entityName}.md`);
  
  // Ensure folder exists
  const folder = dirname(notePath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
  
  // Create note if doesn't exist
  if (!existsSync(notePath)) {
    const content = def.template(entityName);
    writeFileSync(notePath, content);
    console.log(`📝 Created: ${def.folder}/${entityName}.md`);
    return true;
  }
  
  return false;
}

function addBacklink(notePath: string, linkedEntity: string): boolean {
  if (!existsSync(notePath)) return false;
  
  const content = readFileSync(notePath, "utf-8");
  const link = `[[${linkedEntity}]]`;
  
  // Check if link already exists
  if (content.includes(link)) return false;
  
  // Add to Notes section or end of file
  let newContent: string;
  if (content.includes("## Notes")) {
    newContent = content.replace(
      "## Notes\n",
      `## Notes\n- Lié à ${link}\n`
    );
  } else {
    newContent = content.trim() + `\n\n## Liens\n- ${link}\n`;
  }
  
  writeFileSync(notePath, newContent);
  return true;
}

function getAllNotes(): string[] {
  const notes: string[] = [];
  
  function scan(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith(".md")) {
        notes.push(fullPath);
      }
    }
  }
  
  scan(VAULT_PATH);
  return notes;
}

function updateBacklinks(): void {
  console.log("🔗 Updating backlinks...\n");
  
  const notes = getAllNotes();
  let linksAdded = 0;
  
  for (const notePath of notes) {
    const content = readFileSync(notePath, "utf-8");
    const noteName = notePath.split(/[/\\]/).pop()?.replace(".md", "") || "";
    
    // Find all entity mentions in this note
    for (const [entityName, def] of Object.entries(ENTITIES)) {
      if (entityName === noteName) continue; // Skip self
      
      // Check if note mentions this entity
      let mentioned = false;
      for (const alias of def.aliases) {
        if (content.toLowerCase().includes(alias)) {
          mentioned = true;
          break;
        }
      }
      
      if (mentioned) {
        // Add backlink to the mentioned entity's note
        const entityNotePath = resolve(VAULT_PATH, def.folder, `${entityName}.md`);
        if (addBacklink(entityNotePath, noteName)) {
          console.log(`  🔗 ${entityName} ← ${noteName}`);
          linksAdded++;
        }
      }
    }
  }
  
  console.log(`\n✅ ${linksAdded} backlinks added`);
}

function createMissingNotes(): void {
  console.log("📝 Creating missing entity notes...\n");
  
  let created = 0;
  for (const entityName of Object.keys(ENTITIES)) {
    if (ensureNoteExists(entityName)) {
      created++;
    }
  }
  
  console.log(`\n✅ ${created} notes created`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case "create":
      createMissingNotes();
      break;
      
    case "backlinks":
      updateBacklinks();
      break;
      
    case "all":
    default:
      createMissingNotes();
      console.log("");
      updateBacklinks();
      break;
  }
}

main().catch(console.error);
