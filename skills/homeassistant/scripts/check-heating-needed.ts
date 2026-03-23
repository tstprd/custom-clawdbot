#!/usr/bin/env npx tsx
/**
 * Check if presence alert should fire based on heating conditions
 *
 * Returns exit code 0 (alert needed) if:
 *   - At least one room is actively heating, OR
 *   - Exterior temp is significantly lower than interior average (> threshold)
 *
 * Returns exit code 1 (skip alert) if heating not needed
 *
 * Usage: pnpm tsx skills/homeassistant/scripts/check-heating-needed.ts [--threshold 3]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "../../..");

const CLAUDE_HOME = "C:\\Users\\jules\\repo\\claude-home";
const ENV_PATH = join(CLAUDE_HOME, ".env");
const OUTPUT_FILE = join(REPO_ROOT, "ha-output.txt");

// Climate entities to check (VT thermostats - they have hvac_action)
const CLIMATE_ENTITIES = [
  "climate.thermostat_vt_salon",
  "climate.thermostat_vt_bureau_jules",
  "climate.thermostat_vt_bureau_al",
  "climate.thermostat_vt_salle_de_bain",
  "climate.thermostat_vt_salle_de_douche",
  "climate.thermo_chambre",
];

// Temperature sensors for interior average
const INTERIOR_TEMP_SENSORS = [
  "sensor.salon_current_temperature_vt_thermostat",
  "sensor.bureau_jules_current_temperature_vt_thermostat",
  "sensor.bureau_al_current_temperature_vt_thermostat",
  "sensor.salle_de_bain_current_temperature_vt_thermostat",
  "sensor.salle_de_douche_current_temperature_vt_thermostat",
  "sensor.chambre_current_temperature_vt_thermostat",
];

const EXTERIOR_TEMP_SENSOR = "sensor.temperature_exterieure_rennes";

// Default threshold: alert if exterior is more than X degrees colder than interior
const DEFAULT_THRESHOLD = 3;

function loadEnv(): { apiUrl: string; apiToken: string } {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`Missing .env file at ${ENV_PATH}`);
  }
  const content = readFileSync(ENV_PATH, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    vars[key.trim()] = rest.join("=").trim();
  }
  return {
    apiUrl: vars.HA_API_URL || "http://192.168.1.98:8123",
    apiToken: vars.HA_API_TOKEN || "",
  };
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

async function getEntity(apiUrl: string, apiToken: string, entityId: string): Promise<EntityState> {
  const response = await fetch(`${apiUrl}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status} for ${entityId}`);
  }
  return response.json() as Promise<EntityState>;
}

function output(text: string): void {
  writeFileSync(OUTPUT_FILE, text + "\n");
  console.log(text);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const thresholdIdx = args.indexOf("--threshold");
  const threshold = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1]) : DEFAULT_THRESHOLD;

  const { apiUrl, apiToken } = loadEnv();

  // Check 1: Is any room actively heating?
  let anyHeating = false;
  const heatingStatus: string[] = [];

  for (const entityId of CLIMATE_ENTITIES) {
    try {
      const entity = await getEntity(apiUrl, apiToken, entityId);
      const hvacAction = entity.attributes.hvac_action as string;
      const roomName = (entity.attributes.friendly_name as string) || entityId;

      if (hvacAction === "heating") {
        anyHeating = true;
        heatingStatus.push(`🔥 ${roomName}: heating`);
      } else {
        heatingStatus.push(`⏸️ ${roomName}: ${hvacAction}`);
      }
    } catch (err) {
      heatingStatus.push(`❌ ${entityId}: error`);
    }
  }

  // Check 2: Temperature differential
  let exteriorTemp: number | null = null;
  let interiorTemps: number[] = [];

  try {
    const extEntity = await getEntity(apiUrl, apiToken, EXTERIOR_TEMP_SENSOR);
    exteriorTemp = parseFloat(extEntity.state);
  } catch {
    // Fallback: try to get from climate entity attributes
    try {
      const salonEntity = await getEntity(apiUrl, apiToken, "climate.thermostat_vt_salon");
      const specificStates = salonEntity.attributes.specific_states as Record<string, unknown>;
      if (specificStates?.ext_current_temperature) {
        exteriorTemp = specificStates.ext_current_temperature as number;
      }
    } catch {
      // ignore
    }
  }

  for (const sensorId of INTERIOR_TEMP_SENSORS) {
    try {
      const entity = await getEntity(apiUrl, apiToken, sensorId);
      const temp = parseFloat(entity.state);
      if (!isNaN(temp)) {
        interiorTemps.push(temp);
      }
    } catch {
      // ignore individual failures
    }
  }

  const interiorAvg =
    interiorTemps.length > 0
      ? interiorTemps.reduce((a, b) => a + b, 0) / interiorTemps.length
      : null;

  const tempDiff =
    exteriorTemp !== null && interiorAvg !== null ? interiorAvg - exteriorTemp : null;

  const significantTempDiff = tempDiff !== null && tempDiff > threshold;

  // Decision
  const shouldAlert = anyHeating || significantTempDiff;

  // Output report
  const report = [
    "🌡️ Heating Check Report",
    "═══════════════════════",
    "",
    "📍 Heating Status:",
    ...heatingStatus.map((s) => `  ${s}`),
    "",
    "🌡️ Temperatures:",
    `  Extérieur: ${exteriorTemp !== null ? exteriorTemp.toFixed(1) + "°C" : "N/A"}`,
    `  Intérieur (moy): ${interiorAvg !== null ? interiorAvg.toFixed(1) + "°C" : "N/A"}`,
    `  Différence: ${tempDiff !== null ? tempDiff.toFixed(1) + "°C" : "N/A"}`,
    `  Seuil: ${threshold}°C`,
    "",
    "═══════════════════════",
    `🎯 Chauffage actif: ${anyHeating ? "OUI" : "NON"}`,
    `🎯 Écart temp significatif: ${significantTempDiff ? "OUI" : "NON"} (>${threshold}°C)`,
    "",
    shouldAlert
      ? "✅ ALERT NEEDED - Presence check is relevant"
      : "⏭️ SKIP ALERT - No heating/temp concern",
  ].join("\n");

  output(report);

  // Exit code for automation integration
  process.exit(shouldAlert ? 0 : 1);
}

main().catch((err) => {
  output(`❌ Error: ${err instanceof Error ? err.message : err}`);
  process.exit(2);
});
