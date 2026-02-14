#!/usr/bin/env npx tsx
/**
 * Dashboard Generator Script - v2
 * Reproduces the original dashboard design with live data
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const DASHBOARD_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const OUTPUT_FILE = path.join(DASHBOARD_DIR, "index.html");

const CITIES = {
  rennes: { lat: 48.1173, lon: -1.6778 },
  paris: { lat: 48.8566, lon: 2.3522 },
  lille: { lat: 50.6292, lon: 3.0573 },
};

const HA_URL = "http://192.168.1.98:8123";
const HA_TOKEN_PATH = "C:\\Users\\jules\\repo\\claude-home\\.env";
const BABY_DUE_DATE = "2026-05-21";
const GOOGLE_ACCOUNT = "jmudes76000@gmail.com";
const SPORT_SESSIONS_FILE = path.join(DASHBOARD_DIR, "sport-sessions.json");

interface SportSession {
  date: string;
  sport: "squash" | "volley";
  location?: string;
}

function loadSportSessions(): SportSession[] {
  try {
    const data = JSON.parse(fs.readFileSync(SPORT_SESSIONS_FILE, "utf-8"));
    return data.sessions || [];
  } catch {
    return [];
  }
}

function getSportStats(sessions: SportSession[]) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth =
    now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  const countByMonth = (month: string, sport: string) =>
    sessions.filter((s) => s.date.startsWith(month) && s.sport === sport).length;

  return {
    squash: {
      current: countByMonth(currentMonth, "squash"),
      last: countByMonth(lastMonth, "squash"),
    },
    volley: {
      current: countByMonth(currentMonth, "volley"),
      last: countByMonth(lastMonth, "volley"),
    },
  };
}

// ============ DATA FETCHERS ============

interface WeatherData {
  current: { temp: number; icon: string };
  rain6h: { hour: number; mm: number }[];
  forecast: { day: string; min: number; max: number; icon: string }[];
}

async function fetchWeather(city: keyof typeof CITIES): Promise<WeatherData> {
  const { lat, lon } = CITIES[city];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=precipitation&daily=temperature_2m_min,temperature_2m_max,weather_code&timezone=Europe/Paris&forecast_days=7`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const weatherIcon = (code: number): string => {
      if (code === 0) {
        return "☀️";
      }
      if (code <= 3) {
        return "⛅";
      }
      if (code <= 48) {
        return "🌫️";
      }
      if (code <= 67) {
        return "🌧";
      }
      if (code <= 77) {
        return "🌨️";
      }
      if (code <= 82) {
        return "🌧";
      }
      if (code <= 86) {
        return "🌨️";
      }
      return "⛈️";
    };

    const now = new Date();
    const currentHour = now.getHours();
    const rain6h: { hour: number; mm: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const idx = currentHour + i;
      rain6h.push({
        hour: (currentHour + i) % 24,
        mm: data.hourly?.precipitation?.[idx] ?? 0,
      });
    }

    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const forecast =
      data.daily?.time?.slice(0, 6).map((date: string, i: number) => {
        const d = new Date(date);
        return {
          day: i === 0 ? "Auj" : days[d.getDay()],
          min: Math.round(data.daily.temperature_2m_min[i]),
          max: Math.round(data.daily.temperature_2m_max[i]),
          icon: weatherIcon(data.daily.weather_code[i]),
        };
      }) ?? [];

    return {
      current: {
        temp: Math.round(data.current?.temperature_2m ?? 0),
        icon: weatherIcon(data.current?.weather_code ?? 0),
      },
      rain6h,
      forecast,
    };
  } catch (e) {
    console.error(`Weather fetch failed for ${city}:`, e);
    return {
      current: { temp: 0, icon: "?" },
      rain6h: Array(6)
        .fill(0)
        .map((_, i) => ({ hour: i, mm: 0 })),
      forecast: [],
    };
  }
}

function getHAToken(): string {
  try {
    const env = fs.readFileSync(HA_TOKEN_PATH, "utf-8");
    const match = env.match(/^HA_API_TOKEN=(.+)$/m);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

interface Temperatures {
  salon: number | null;
  chambre: number | null;
  bureauJules: number | null;
  bureauAL: number | null;
  sdb: number | null;
  sdd: number | null;
}

async function fetchTemperatures(): Promise<Temperatures> {
  const token = getHAToken();
  if (!token) {
    return { salon: null, chambre: null, bureauJules: null, bureauAL: null, sdb: null, sdd: null };
  }

  const entities: Record<keyof Temperatures, string> = {
    salon: "sensor.salon_current_temperature_vt_thermostat",
    chambre: "sensor.chambre_current_temperature_vt_thermostat",
    bureauJules: "sensor.bureau_jules_current_temperature_vt_thermostat",
    bureauAL: "sensor.bureau_al_current_temperature_vt_thermostat",
    sdb: "sensor.salle_de_bain_current_temperature_vt_thermostat",
    sdd: "sensor.salle_de_douche_current_temperature_vt_thermostat",
  };

  const temps: Temperatures = {
    salon: null,
    chambre: null,
    bureauJules: null,
    bureauAL: null,
    sdb: null,
    sdd: null,
  };

  for (const [key, entityId] of Object.entries(entities)) {
    try {
      const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      temps[key as keyof Temperatures] = data.state ? parseFloat(data.state) : null;
    } catch {
      /* ignore */
    }
  }

  return temps;
}

interface GrocyTask {
  name: string;
  icon: string;
  date: string | null;
  overdue: boolean;
  description: string;
}

async function fetchGrocyTasks(): Promise<GrocyTask[]> {
  const token = getHAToken();
  if (!token) {
    return getDefaultTasks();
  }

  try {
    const res = await fetch(`${HA_URL}/api/services/todo/get_items?return_response`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ entity_id: "todo.grocy_chores" }),
    });
    const data = await res.json();
    const items = data?.service_response?.["todo.grocy_chores"]?.items ?? [];

    const iconMap: Record<string, string> = {
      draps: "ph-bed",
      laver: "ph-shower",
      sdb: "ph-shower",
      charges: "ph-money",
      payer: "ph-money",
      rocky: "ph-robot",
      maintenance: "ph-robot",
      vmc: "ph-fan",
      aspirer: "ph-fan",
      vitres: "ph-frame-corners",
    };

    return items.slice(0, 6).map((item: any) => {
      const summary = item.summary ?? "Tâche";
      const nameLower = summary.toLowerCase();
      const icon = Object.entries(iconMap).find(([k]) => nameLower.includes(k))?.[1] ?? "ph-check";
      const due = item.due ? new Date(item.due) : null;
      const overdue = due ? due < new Date() : false;

      // Extract first word as name
      const name = summary.split(/\s+/)[0];

      return {
        name,
        icon,
        date: due ? due.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null,
        overdue,
        description: item.description || getTaskDescription(nameLower),
      };
    });
  } catch (e) {
    console.error("Grocy fetch failed:", e);
    return getDefaultTasks();
  }
}

function getTaskDescription(name: string): string {
  if (name.includes("draps") || name.includes("changer")) {
    return "Changer les draps";
  }
  if (name.includes("sdb") || name.includes("laver")) {
    return "Laver la SDB";
  }
  if (name.includes("charges") || name.includes("payer")) {
    return "Payer les charges";
  }
  if (name.includes("rocky") || name.includes("maintenance")) {
    return "Maintenance robot";
  }
  if (name.includes("vmc") || name.includes("aspirer")) {
    return "Aspirer les grilles";
  }
  if (name.includes("vitres")) {
    return "Nettoyer les vitres";
  }
  return "";
}

function getDefaultTasks(): GrocyTask[] {
  return [
    { name: "Draps", icon: "ph-bed", date: "—", overdue: false, description: "Changer les draps" },
    { name: "SDB", icon: "ph-shower", date: "—", overdue: false, description: "Laver la SDB" },
    {
      name: "Charges",
      icon: "ph-money",
      date: "—",
      overdue: true,
      description: "Payer les charges",
    },
    {
      name: "Rocky",
      icon: "ph-robot",
      date: "—",
      overdue: false,
      description: "Maintenance robot",
    },
    { name: "VMC", icon: "ph-fan", date: "—", overdue: true, description: "Aspirer les grilles" },
    {
      name: "Vitres",
      icon: "ph-frame-corners",
      date: "—",
      overdue: false,
      description: "Nettoyer les vitres",
    },
  ];
}

interface CalendarEvent {
  date: string;
  summary: string;
}

async function fetchCalendar(): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 7);

  const fromDate = startOfMonth.toISOString().split("T")[0];
  const toDate = endOfMonth.toISOString().split("T")[0];

  const events: CalendarEvent[] = [];

  try {
    const output = execSync(
      `gog calendar events --from "${fromDate}T00:00:00+01:00" --to "${toDate}T23:59:59+01:00" --account ${GOOGLE_ACCOUNT} --json`,
      { encoding: "utf-8", timeout: 30000 },
    );
    const data = JSON.parse(output);

    for (const event of data.events ?? []) {
      const date = event.start?.date ?? event.start?.dateTime?.split("T")[0];
      if (date && event.summary) {
        events.push({ date, summary: event.summary });
      }
    }
  } catch (e) {
    console.error("Calendar fetch failed:", e);
  }

  return events;
}

// ============ HTML GENERATOR ============

function generateHTML(
  weather: { rennes: WeatherData; paris: WeatherData; lille: WeatherData },
  temps: Temperatures,
  tasks: GrocyTask[],
  events: CalendarEvent[],
  sportSessions: SportSession[],
): string {
  const sportStats = getSportStats(sportSessions);
  const now = new Date();
  const currentDay = now.getDate();
  const daysUntilBaby = Math.ceil((new Date(BABY_DUE_DATE).getTime() - now.getTime()) / 86400000);

  const formatTemp = (t: number | null) =>
    t !== null ? `${t.toFixed(1).replace(".", ",")}°` : "—";

  // Rain cell generator
  const rainCell = (data: WeatherData) => {
    return `<td>
      <div class="rain-vertical">
        ${data.rain6h
          .map((r) => {
            const pct = Math.min(r.mm * 50, 100);
            const mm = r.mm > 0 ? r.mm.toFixed(1) : "-";
            return `<div class="rain-row"><span class="hour">${r.hour}h</span><div class="bar-container"><div class="bar${r.mm > 1 ? " high" : ""}" style="width:${pct}%"></div></div><span class="mm">${mm}</span></div>`;
          })
          .join("")}
      </div>
    </td>`;
  };

  // Weather rows - rain row RIGHT AFTER today's row
  const weatherRows = weather.rennes.forecast
    .map((r, i) => {
      const p = weather.paris.forecast[i];
      const l = weather.lille.forecast[i];
      if (!r || !p || !l) {
        return "";
      }

      if (i === 0) {
        // Today's row + rain row immediately after
        return `<tr class="today-row">
        <td class="day-label">Auj</td>
        <td>${r.max}° ${r.icon}</td>
        <td>${p.max}° ${p.icon}</td>
        <td>${l.max}° ${l.icon}</td>
      </tr>
      <tr>
        <td class="day-label" style="font-size:0.8rem">🌧<br><span style="font-size:0.55rem">Pluie 6h</span></td>
        ${rainCell(weather.rennes)}
        ${rainCell(weather.paris)}
        ${rainCell(weather.lille)}
      </tr>`;
      }
      return `<tr>
      <td class="day-label">${r.day}</td>
      <td>${r.min}/${r.max}° ${r.icon}</td>
      <td>${p.min}/${p.max}° ${p.icon}</td>
      <td>${l.min}/${l.max}° ${l.icon}</td>
    </tr>`;
    })
    .join("\n");

  // Tasks HTML
  const tasksHTML = tasks
    .map(
      (t) => `
    <div class="task-item">
      <div class="task-left">
        <i class="ph ${t.icon}"></i>
        <span class="task-name">${t.name}</span>
        <span class="task-status ${t.overdue ? "overdue" : "ok"}">${t.date ?? "—"}</span>
      </div>
      <span class="task-desc">${t.description}</span>
    </div>`,
    )
    .join("");

  // Calendar generation
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const getWeekNum = (d: Date) => {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const shortenEvent = (summary: string): string => {
    const lower = summary.toLowerCase();
    if (lower.includes("prénatal") || lower.includes("prenatal")) {
      return "Prénatal";
    }
    if (lower.includes("squash")) {
      return "Squash";
    }
    if (lower.includes("lille")) {
      return "Lille";
    }
    if (lower.includes("adeo")) {
      return "Adeo";
    }
    if (lower.includes("lyon")) {
      return "AL→Lyon";
    }
    if (lower.includes("train")) {
      return "🚄";
    }
    if (lower.includes("strasbourg")) {
      return "Strasbourg";
    }
    // Truncate if too long
    return summary.length > 12 ? summary.slice(0, 10) + "…" : summary;
  };

  let calendarHTML = "";
  let dayCounter = 1;

  for (let i = 0; i < 35; i++) {
    const isBeforeMonth = i < firstDayOffset;
    const isAfterMonth = dayCounter > daysInMonth;

    if (isBeforeMonth || isAfterMonth) {
      calendarHTML += `<div class="cal-day other-month"></div>`;
    } else {
      const date = new Date(now.getFullYear(), now.getMonth(), dayCounter);
      // Use local date format to avoid UTC timezone shift
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isToday = dayCounter === currentDay;
      const dayOfWeek = i % 7;
      const isMonday = dayOfWeek === 0;
      const isWeekend = dayOfWeek >= 5;

      // Events for this day
      const dayEvents = events.filter((e) => e.date === dateStr);

      // Check for COMPLETED sport sessions (from JSON, not calendar)
      const hasSquash = sportSessions.some((s) => s.date === dateStr && s.sport === "squash");
      const hasVolley = sportSessions.some((s) => s.date === dateStr && s.sport === "volley");

      // Sport icon (top right of day cell)
      let sportHTML = "";
      if (hasSquash) {
        sportHTML = '<span class="cal-sport"><span class="squash-ball"></span></span>';
      } else if (hasVolley) {
        sportHTML = '<span class="cal-sport"><span class="volley-icon">🏐</span></span>';
      }

      // Event text (filter out sport events to avoid duplication)
      const nonSportEvents = dayEvents.filter((e) => {
        const lower = e.summary.toLowerCase();
        return !lower.includes("squash") && !lower.includes("volley");
      });
      const eventHTML =
        nonSportEvents.length > 0
          ? `<div class="cal-event">${shortenEvent(nonSportEvents[0].summary)}</div>`
          : "";

      // Presence (simplified logic)
      let presenceHTML = '<div class="cal-presence">';
      if (!isWeekend || isToday) {
        presenceHTML += '<span class="presence-badge jules">J</span>';
      }
      presenceHTML += '<span class="presence-badge al">AL</span>';
      presenceHTML += "</div>";

      const weekNum = isMonday
        ? `<span class="cal-week-num">S${String(getWeekNum(date)).padStart(2, "0")}</span>`
        : "";

      calendarHTML += `<div class="cal-day${isToday ? " today" : ""}">
        ${weekNum}
        <span class="cal-day-num">${dayCounter}</span>
        ${sportHTML}
        ${eventHTML}
        ${presenceHTML}
      </div>`;

      dayCounter++;
    }
  }

  // Complete HTML with original CSS
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="300">
  <title>Dashboard Maison</title>
  <script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      color: #eee;
      height: 100vh;
      overflow: hidden;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .main-row { display: flex; gap: 12px; flex: 1; min-height: 0; }
    .left-column { width: 28%; display: flex; flex-direction: column; gap: 10px; }
    .header-card { background: #111; border-radius: 12px; padding: 14px; border: 1px solid #222; }
    .datetime-row { display: flex; justify-content: space-between; align-items: center; }
    .datetime { display: flex; flex-direction: column; }
    .day-name { font-size: 2.2rem; font-weight: 600; color: #4a7c59; text-transform: capitalize; }
    .date-num { font-size: 1.4rem; color: #888; }
    .time { font-size: 3rem; font-weight: 200; color: #4a7c59; }
    .floorplans-card { flex: 1; background: #111; border-radius: 12px; padding: 10px; border: 1px solid #222; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
    .floor-wrapper { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; min-height: 0; }
    .floorplan-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .temp-overlay { position: absolute; background: rgba(0,0,0,0.75); padding: 6px 12px; border-radius: 5px; font-size: 16px; font-weight: 600; color: #ddd; }
    .floor-haut .temp-overlay.salon { top: 60%; left: 50%; transform: translate(-50%, -50%); }
    .floor-bas .temp-overlay.chambre { top: 33%; left: 69%; transform: translate(-50%, -50%); }
    .floor-bas .temp-overlay.bureau-al { top: 61%; left: 55%; transform: translate(-50%, -50%); }
    .floor-bas .temp-overlay.bureau-jules { top: 30%; left: 35%; transform: translate(-50%, -50%); }
    .floor-bas .temp-overlay.sdb { top: 59%; left: 27%; transform: translate(-50%, -50%); }
    .floor-bas .temp-overlay.sdd { top: 46%; left: 28%; transform: translate(-50%, -50%); }
    .countdown-card { background: #111; border-radius: 12px; padding: 10px; border: 1px solid #222; text-align: center; }
    .countdown-value { font-size: 2.6rem; font-weight: bold; color: #e74c3c; }
    .countdown-label { font-size: 1.1rem; color: #888; }
    .middle-column { width: 280px; display: flex; flex-direction: column; gap: 10px; }
    .stats-card { background: #111; border-radius: 10px; padding: 8px; border: 1px solid #222; text-align: center; }
    .stats-title { font-size: 0.7rem; color: #4a7c59; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
    .stats-row { display: flex; justify-content: center; gap: 16px; }
    .stat-item { display: flex; align-items: center; gap: 5px; }
    .stat-value { font-size: 1.3rem; font-weight: bold; }
    .stat-value.squash { color: #e0e0e0; }
    .stat-value.volley { color: #5dade2; }
    .stat-prev { font-size: 0.65rem; color: #666; }
    .squash-ball-big { width: 16px; height: 16px; background: #1a1a1a; border-radius: 50%; display: inline-block; position: relative; border: 2px solid #444; }
    .squash-ball-big::before, .squash-ball-big::after { content: ''; position: absolute; width: 4px; height: 4px; background: #F5A623; border-radius: 50%; }
    .squash-ball-big::before { top: 1px; left: 4px; }
    .squash-ball-big::after { bottom: 1px; left: 3px; }
    .weather-card { background: #111; border-radius: 12px; padding: 12px; border: 1px solid #222; flex: 1; }
    .weather-table { width: 100%; font-size: 1rem; }
    .weather-table th { color: #5dade2; font-weight: 600; padding: 4px 2px; text-align: center; font-size: 1.1rem; }
    .weather-table td { color: #ccc; padding: 3px 2px; text-align: center; font-size: 0.95rem; }
    .weather-table .day-label { color: #4a7c59; font-weight: 500; text-align: left; }
    .weather-table .today-row td { color: #fff; font-weight: 600; }
    .rain-vertical { display: flex; flex-direction: column; gap: 1px; font-size: 0.65rem; }
    .rain-row { display: flex; align-items: center; gap: 3px; }
    .rain-row .hour { color: #4a7c59; width: 18px; text-align: right; font-size: 0.6rem; }
    .rain-row .bar-container { flex: 1; height: 6px; background: #1a1a1a; border-radius: 2px; }
    .rain-row .bar { height: 100%; background: linear-gradient(to right, #3498db, #5dade2); border-radius: 2px; }
    .rain-row .bar.high { background: linear-gradient(to right, #2980b9, #3498db); }
    .rain-row .mm { color: #888; font-size: 0.55rem; width: 22px; }
    .calendar-container { flex: 1; background: #111; border-radius: 12px; padding: 10px; border: 1px solid #222; display: flex; flex-direction: column; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; flex: 1; }
    .cal-day-name { text-align: center; color: #4a7c59; font-size: 1.2rem; padding: 4px 0; font-weight: 600; }
    .cal-day { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; padding: 4px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .cal-day.other-month { background: #0a0a0a; border-color: #1a1a1a; opacity: 0.3; }
    .cal-day.today { background: #1a2a1a; border: 2px solid #4a7c59; }
    .cal-day-num { font-size: 1.3rem; font-weight: 600; color: #999; }
    .cal-week-num { position: absolute; top: 2px; right: 4px; font-size: 0.6rem; color: #4a7c59; font-weight: 600; }
    .cal-event { font-size: 0.9rem; padding: 3px 5px; background: rgba(74,124,89,0.3); color: #7cb87c; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .cal-sport { position: absolute; top: 2px; right: 4px; }
    .cal-presence { position: absolute; bottom: 2px; left: 2px; display: flex; gap: 2px; }
    .squash-ball { width: 22px; height: 22px; background: #1a1a1a; border-radius: 50%; display: inline-block; position: relative; border: 3px solid #444; }
    .squash-ball::before, .squash-ball::after { content: ''; position: absolute; width: 5px; height: 5px; background: #F5A623; border-radius: 50%; }
    .squash-ball::before { top: 3px; left: 6px; }
    .squash-ball::after { bottom: 3px; left: 4px; }
    .volley-icon { font-size: 1.4rem; }
    .presence-badge { font-size: 0.65rem; padding: 2px 4px; border-radius: 3px; font-weight: 700; }
    .presence-badge.jules { background: #2980b9; color: #fff; }
    .presence-badge.al { background: #8e44ad; color: #fff; }
    .bottom-row { display: flex; gap: 12px; }
    .tasks-card { background: #111; border-radius: 10px; padding: 8px; border: 1px solid #222; flex: 1; }
    .tasks-header { font-size: 0.9rem; color: #4a7c59; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; }
    .tasks-grid { display: flex; flex-direction: column; gap: 4px; }
    .task-item { background: #1a1a1a; border: 1px solid #2a2a2a; padding: 5px 8px; border-radius: 6px; display: flex; align-items: center; gap: 8px; }
    .task-item i { font-size: 1.1rem; color: #666; }
    .task-left { display: flex; align-items: center; gap: 6px; min-width: 100px; }
    .task-name { font-size: 0.7rem; color: #bbb; font-weight: 500; }
    .task-status { font-size: 0.55rem; }
    .task-status.overdue { color: #e74c3c; }
    .task-status.ok { color: #2ecc71; }
    .task-desc { font-size: 0.6rem; color: #888; flex: 1; }
    .news-card { background: #111; border-radius: 10px; padding: 8px; border: 1px solid #222; flex: 1; }
    .news-header { font-size: 0.9rem; color: #4a7c59; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; }
    .news-item { font-size: 0.75rem; color: #ccc; padding: 4px 0; border-bottom: 1px solid #222; }
    .news-item:last-child { border-bottom: none; }
    .news-source { font-size: 0.55rem; color: #666; }
  </style>
</head>
<body>

  <div class="main-row">
    <div class="left-column">
      <div class="header-card">
        <div class="datetime-row">
          <div class="datetime">
            <span class="day-name" id="day-name">--</span>
            <span class="date-num" id="date-num">--</span>
          </div>
          <div class="time" id="time">--:--</div>
        </div>
      </div>

      <div class="floorplans-card">
        <div class="floor-wrapper floor-haut">
          <img src="floorplan-haut-lit.png" class="floorplan-img" alt="Étage">
          <div class="temp-overlay salon">${formatTemp(temps.salon)}</div>
        </div>
        <div class="floor-wrapper floor-bas">
          <img src="floorplan-bas-lit.png" class="floorplan-img" alt="RDC">
          <div class="temp-overlay chambre">${formatTemp(temps.chambre)}</div>
          <div class="temp-overlay bureau-al">${formatTemp(temps.bureauAL)}</div>
          <div class="temp-overlay bureau-jules">${formatTemp(temps.bureauJules)}</div>
          <div class="temp-overlay sdb">${formatTemp(temps.sdb)}</div>
          <div class="temp-overlay sdd">${formatTemp(temps.sdd)}</div>
        </div>
      </div>

      <div class="countdown-card">
        <div class="countdown-value" id="countdown">${daysUntilBaby}</div>
        <div class="countdown-label">jours avant bébé</div>
      </div>
    </div>

    <div class="middle-column">
      <div class="stats-card">
        <div class="stats-title">Sport</div>
        <div class="stats-row">
          <div class="stat-item">
            <span class="squash-ball-big"></span>
            <div>
              <div class="stat-value squash">${sportStats.squash.current}</div>
              <div class="stat-prev">M-1: ${sportStats.squash.last}</div>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏐</span>
            <div>
              <div class="stat-value volley">${sportStats.volley.current}</div>
              <div class="stat-prev">M-1: ${sportStats.volley.last}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="weather-card">
        <table class="weather-table">
          <tr>
            <th></th>
            <th>Rennes</th>
            <th>Paris</th>
            <th>Lille</th>
          </tr>
          ${weatherRows}
        </table>
      </div>
    </div>

    <div class="calendar-container">
      <div class="calendar-grid">
        <div class="cal-day-name">Lun</div>
        <div class="cal-day-name">Mar</div>
        <div class="cal-day-name">Mer</div>
        <div class="cal-day-name">Jeu</div>
        <div class="cal-day-name">Ven</div>
        <div class="cal-day-name">Sam</div>
        <div class="cal-day-name">Dim</div>
        ${calendarHTML}
      </div>
    </div>
  </div>

  <div class="bottom-row">
    <div class="tasks-card">
      <div class="tasks-header">Tâches</div>
      <div class="tasks-grid">
        ${tasksHTML}
      </div>
    </div>
    <div class="news-card">
      <div class="news-header">📰 Actualités</div>
      <div class="news-item">Données météo live via Open-Meteo<div class="news-source">Dashboard • maintenant</div></div>
      <div class="news-item">Calendrier synchronisé avec Google<div class="news-source">gog CLI • auto</div></div>
      <div class="news-item">Tâches depuis Grocy/Home Assistant<div class="news-source">HA API • auto</div></div>
      <div class="news-item">Généré le ${now.toLocaleString("fr-FR")}<div class="news-source">generate.ts</div></div>
    </div>
  </div>

  <script>
    function updateClock() {
      const now = new Date();
      const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      document.getElementById('day-name').textContent = days[now.getDay()];
      document.getElementById('date-num').textContent = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      document.getElementById('time').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
    document.getElementById('countdown').textContent = Math.ceil((new Date('${BABY_DUE_DATE}') - new Date()) / 86400000);
  </script>
</body>
</html>`;
}

// ============ MAIN ============

async function main() {
  console.log("🏠 Generating dashboard v2...");

  const [weatherRennes, weatherParis, weatherLille, temps, tasks, events] = await Promise.all([
    fetchWeather("rennes"),
    fetchWeather("paris"),
    fetchWeather("lille"),
    fetchTemperatures(),
    fetchGrocyTasks(),
    fetchCalendar(),
  ]);

  console.log("✓ Weather:", weatherRennes.current.temp + "°C Rennes");
  console.log(
    "✓ Temperatures:",
    Object.values(temps).filter((t) => t !== null).length + "/6 sensors",
  );
  console.log("✓ Tasks:", tasks.length);
  console.log("✓ Calendar events:", events.length);

  // Load sport sessions from JSON
  const sportSessions = loadSportSessions();
  console.log("✓ Sport sessions:", sportSessions.length);

  const html = generateHTML(
    { rennes: weatherRennes, paris: weatherParis, lille: weatherLille },
    temps,
    tasks,
    events,
    sportSessions,
  );

  fs.writeFileSync(OUTPUT_FILE, html, "utf-8");
  console.log(`✓ Dashboard written to ${OUTPUT_FILE}`);
}

main().catch(console.error);
