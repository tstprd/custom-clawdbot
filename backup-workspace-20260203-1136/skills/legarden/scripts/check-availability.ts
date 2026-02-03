#!/usr/bin/env npx tsx
/**
 * Check squash availability at Le Garden via browser API
 * 
 * This script is meant to be called by Clawdbot which will:
 * 1. Open browser to legarden.doinsport.club (with saved session)
 * 2. Execute the API call via browser console
 * 3. Parse and display results
 * 
 * Usage: Ask Dwight "dispo squash dimanche" or "check squash 2026-01-26"
 */

const CLUB_ID = "a126b4d4-a2ee-4f30-bee3-6596368368fb";
const SQUASH_ACTIVITY_ID = "03168675-2e42-4f64-b8c1-7fc011609272";
const API_BASE = "https://api-v3.doinsport.club";
const COURT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Browser JS to execute (will be injected via browser tool)
export const BROWSER_SCRIPT = (date: string) => `
(async () => {
  const token = JSON.parse(localStorage.getItem('CapacitorStorage.TOKENS_USER')).token;
  const res = await fetch(
    '${API_BASE}/clubs/playgrounds/plannings/${date}?club.id=${CLUB_ID}&from=09:00&to=12:30&activities.id=${SQUASH_ACTIVITY_ID}&bookingType=unique',
    { headers: { Authorization: 'Bearer ' + token } }
  );
  return await res.json();
})()
`;

export interface SlotPrice {
  duration: number;
  pricePerParticipant: number;
  bookable: boolean;
}

export interface ActivitySlot {
  startAt: string;
  prices: SlotPrice[];
}

export interface Playground {
  name: string;
  activities: { slots: ActivitySlot[] }[];
}

export interface ApiResponse {
  "hydra:member": Playground[];
}

export function parseAvailability(data: ApiResponse): Map<number, Map<string, { has60: boolean; has120: boolean }>> {
  const result = new Map<number, Map<string, { has60: boolean; has120: boolean }>>();
  
  for (const pg of data["hydra:member"] || []) {
    const courtNum = parseInt(pg.name.match(/\d+/)?.[0] || "0");
    const courtMap = new Map<string, { has60: boolean; has120: boolean }>();
    
    for (const activity of pg.activities || []) {
      for (const slot of activity.slots || []) {
        const time = slot.startAt;
        const has60 = slot.prices.some(p => p.duration === 3600 && p.bookable);
        const has120 = slot.prices.some(p => p.duration === 7200 && p.bookable);
        courtMap.set(time, { has60, has120 });
      }
    }
    
    result.set(courtNum, courtMap);
  }
  
  return result;
}

export function formatTable(
  availability: Map<number, Map<string, { has60: boolean; has120: boolean }>>,
  date: string
): string {
  // Get all unique times
  const allTimes = new Set<string>();
  for (const courtMap of availability.values()) {
    for (const time of courtMap.keys()) {
      allTimes.add(time);
    }
  }
  const times = Array.from(allTimes).sort();
  
  const lines: string[] = [];
  const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  
  lines.push(`🎾 **Le Garden - ${dayName}**`);
  lines.push("");
  lines.push("```");
  lines.push("Terrain │ " + times.map(t => t.padStart(5)).join(" │ "));
  lines.push("────────┼" + times.map(() => "───────").join("┼"));
  
  for (const court of COURT_ORDER) {
    const star = court === COURT_ORDER[0] ? "⭐" : "  ";
    let row = `   ${court}${star} │`;
    
    const courtMap = availability.get(court);
    for (const time of times) {
      const slot = courtMap?.get(time);
      row += (slot?.has60 || slot?.has120) ? "  ✅   │" : "  ❌   │";
    }
    lines.push(row);
  }
  
  lines.push("```");
  
  // Recommendation
  for (const court of COURT_ORDER) {
    const courtMap = availability.get(court);
    if (courtMap) {
      const firstAvailable = Array.from(courtMap.entries())
        .filter(([_, v]) => v.has60 || v.has120)
        .sort(([a], [b]) => a.localeCompare(b))[0];
      if (firstAvailable) {
        lines.push("");
        lines.push(`🏆 **Reco: Terrain ${court} à ${firstAvailable[0]}**`);
        break;
      }
    }
  }
  
  return lines.join("\n");
}

// For testing from command line
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("This script is meant to be used via Clawdbot browser automation.");
  console.log("");
  console.log("Ask: 'dispo squash dimanche' or 'check squash 2026-01-26'");
  console.log("");
  console.log("Browser script to execute:");
  console.log(BROWSER_SCRIPT("2026-01-26"));
}
