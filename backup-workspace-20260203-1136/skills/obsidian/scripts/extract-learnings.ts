#!/usr/bin/env npx tsx
/**
 * Extract learnings from today's conversations and update Obsidian
 * Reads session history and extracts key information
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

const VAULT_PATH = "C:\\Users\\jules\\repo\\obsidianvault\\JulesVault";
const SESSIONS_PATH = resolve(homedir(), ".clawdbot", "agents", "main", "sessions");

// Known entities for auto-linking
const KNOWN_ENTITIES: Record<string, string> = {
  "anne-laure": "[[Anne-Laure]]",
  "al": "[[Anne-Laure]]",
  "jules": "[[Jules]]",
  "dwight": "[[Dwight]]",
  "scpi": "[[SCPI Aurel Ruiz]]",
  "aurel ruiz": "[[SCPI Aurel Ruiz]]",
  "kays": "[[SCPI Aurel Ruiz]]",
  "claustra": "[[Claustra Mabilais]]",
  "mabilais": "[[Claustra Mabilais]]",
  "bébé": "[[Chambre Bébé]]",
  "crèche": "[[Crèche]]",
  "home assistant": "[[Home Assistant]]",
  "capgemini": "[[Capgemini]]",
  "rennes": "[[Appartement Rennes]]",
  "aqua tonic": "[[Sauna Aqua Tonic]]",
  "sauna": "[[Sauna Aqua Tonic]]",
  "doula": "[[Doula Agentic]]",
  "bot-as-a-service": "[[Bot-as-a-Service]]",
  "obsidian": "[[Obsidian]]",
  "lobster": "[[Lobster]]",
};

interface Learning {
  category: string;
  content: string;
  links: string[];
}

function findLinks(text: string): string[] {
  const links: string[] = [];
  const textLower = text.toLowerCase();
  
  for (const [keyword, link] of Object.entries(KNOWN_ENTITIES)) {
    if (textLower.includes(keyword) && !links.includes(link)) {
      links.push(link);
    }
  }
  
  return links;
}

function extractLearningsFromMessages(messages: any[]): Learning[] {
  const learnings: Learning[] = [];
  
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    
    const content = msg.content?.toLowerCase() || "";
    
    // Detect preferences
    if (content.includes("j'aime") || content.includes("je préfère") || content.includes("préférence")) {
      learnings.push({
        category: "Préférences",
        content: msg.content.substring(0, 200),
        links: findLinks(msg.content),
      });
    }
    
    // Detect decisions
    if (content.includes("on va") || content.includes("j'ai décidé") || content.includes("on fait")) {
      learnings.push({
        category: "Décisions",
        content: msg.content.substring(0, 200),
        links: findLinks(msg.content),
      });
    }
    
    // Detect new info about people
    if (content.includes("anne-laure") || content.includes(" al ")) {
      const links = findLinks(msg.content);
      if (links.length > 0) {
        learnings.push({
          category: "Personnes",
          content: msg.content.substring(0, 200),
          links,
        });
      }
    }
    
    // Detect project updates
    if (content.includes("scpi") || content.includes("claustra") || content.includes("crèche") || content.includes("bébé")) {
      learnings.push({
        category: "Projets",
        content: msg.content.substring(0, 200),
        links: findLinks(msg.content),
      });
    }
    
    // Detect tasks/reminders
    if (content.includes("rappel") || content.includes("n'oublie pas") || content.includes("pense à")) {
      learnings.push({
        category: "Rappels",
        content: msg.content.substring(0, 200),
        links: findLinks(msg.content),
      });
    }
  }
  
  return learnings;
}

function getTodaysSessions(): any[] {
  if (!existsSync(SESSIONS_PATH)) return [];
  
  const today = new Date().toISOString().split("T")[0];
  const allMessages: any[] = [];
  
  const files = readdirSync(SESSIONS_PATH).filter(f => f.endsWith(".jsonl") && !f.endsWith(".lock"));
  
  for (const file of files) {
    const filePath = resolve(SESSIONS_PATH, file);
    const stat = statSync(filePath);
    const fileDate = stat.mtime.toISOString().split("T")[0];
    
    // Only process files modified today
    if (fileDate !== today) continue;
    
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim());
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        
        // Handle message entries
        if (entry.type === "message" && entry.message) {
          const msg = entry.message;
          let textContent = "";
          
          // Extract text from content array
          if (Array.isArray(msg.content)) {
            for (const part of msg.content) {
              if (part.type === "text" && part.text) {
                textContent += part.text + " ";
              }
            }
          } else if (typeof msg.content === "string") {
            textContent = msg.content;
          }
          
          if (textContent.trim()) {
            allMessages.push({
              role: msg.role,
              content: textContent.trim(),
              timestamp: entry.timestamp,
            });
          }
        }
      } catch {
        // Skip invalid lines
      }
    }
  }
  
  return allMessages;
}

function updateDailyNote(learnings: Learning[]): void {
  const today = new Date().toISOString().split("T")[0];
  const notePath = resolve(VAULT_PATH, "Daily", `${today}.md`);
  
  if (learnings.length === 0) {
    console.log("📝 Aucun apprentissage détecté aujourd'hui.");
    return;
  }
  
  // Group by category
  const byCategory: Record<string, Learning[]> = {};
  for (const l of learnings) {
    if (!byCategory[l.category]) byCategory[l.category] = [];
    byCategory[l.category].push(l);
  }
  
  // Build content
  let newContent = "\n## 🧠 Apprentissages du jour\n\n";
  
  for (const [category, items] of Object.entries(byCategory)) {
    newContent += `### ${category}\n`;
    for (const item of items.slice(0, 3)) {  // Max 3 per category
      const links = item.links.length > 0 ? ` (${item.links.join(", ")})` : "";
      newContent += `- ${item.content.substring(0, 100)}...${links}\n`;
    }
    newContent += "\n";
  }
  
  // Collect all unique links
  const allLinks = [...new Set(learnings.flatMap(l => l.links))];
  if (allLinks.length > 0) {
    newContent += `### 🔗 Liens détectés\n`;
    for (const link of allLinks) {
      newContent += `- ${link}\n`;
    }
  }
  
  // Update or create note
  let existingContent = "";
  if (existsSync(notePath)) {
    existingContent = readFileSync(notePath, "utf-8");
    
    // Check if already has learnings section
    if (existingContent.includes("## 🧠 Apprentissages")) {
      console.log("📝 Apprentissages déjà extraits pour aujourd'hui.");
      return;
    }
  }
  
  const finalContent = existingContent.trim() + "\n" + newContent;
  writeFileSync(notePath, finalContent);
  
  console.log(`✅ ${learnings.length} apprentissages extraits`);
  console.log(`📄 Note mise à jour: Daily/${today}.md`);
  console.log(`🔗 Liens: ${allLinks.join(", ") || "aucun"}`);
}

async function main(): Promise<void> {
  console.log("🔍 Extraction des apprentissages...\n");
  
  const messages = getTodaysSessions();
  console.log(`📨 ${messages.length} messages analysés`);
  
  const learnings = extractLearningsFromMessages(messages);
  console.log(`🧠 ${learnings.length} apprentissages détectés\n`);
  
  updateDailyNote(learnings);
}

main().catch(console.error);
