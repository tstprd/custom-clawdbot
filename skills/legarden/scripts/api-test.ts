#!/usr/bin/env npx tsx
/**
 * Test doinsport API
 */

const CLUB_ID = "a126b4d4-a2ee-4f30-bee3-6596368368fb";
// Try different API bases
const API_BASES = [
  "https://api-v2.doinsport.club",
  "https://legarden.doinsport.club/api",
  "https://api.legarden.doinsport.club",
];
let API_BASE = API_BASES[0];

interface TokenResponse {
  token: string;
  refresh_token: string;
}

async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/authentication`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function getPlaygrounds(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clubs/${CLUB_ID}/playgrounds?itemsPerPage=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API failed: ${res.status}`);
  return res.json();
}

async function getAvailability(token: string, date: string, activityId: string): Promise<any> {
  // Try different endpoint patterns
  const res = await fetch(
    `${API_BASE}/clubs/${CLUB_ID}/bookings/available-slots?date=${date}&activity=${activityId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("Availability status:", res.status);
  if (!res.ok) {
    const text = await res.text();
    console.log("Response:", text.slice(0, 500));
    return null;
  }
  return res.json();
}

async function main() {
  const email = "jmudes76000@gmail.com";
  const password = "R^6E#2z!J6fmrZcA2cpGKc49uce#L";

  console.log("🔐 Logging in...");
  const { token } = await login(email, password);
  console.log("✅ Got token");

  console.log("\n📍 Getting playgrounds...");
  const playgrounds = await getPlaygrounds(token);
  console.log("Playgrounds:", JSON.stringify(playgrounds, null, 2).slice(0, 2000));

  console.log("\n📅 Getting availability for 2026-01-26...");
  const squashActivityId = "03168675-2e42-4f64-b8c1-7fc011609272";
  const availability = await getAvailability(token, "2026-01-26", squashActivityId);
  if (availability) {
    console.log("Availability:", JSON.stringify(availability, null, 2).slice(0, 2000));
  }
}

main().catch(console.error);
