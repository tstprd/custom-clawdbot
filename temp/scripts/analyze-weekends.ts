/**
 * Analyze calendar for next 2 months and identify weekend plans
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_PATH = join(process.cwd(), '.clawdbot-google-tokens-jmudes.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');
const PLANS_FILE = join(process.cwd(), 'plans-weekends.md');

const CLIENT_ID = '484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function getTokens(): Promise<Tokens> {
  const tokens: Tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  
  if (Date.now() > tokens.expiry_date - 60000) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    const newTokens = await response.json();
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  }
  
  return tokens;
}

async function getCalendarEvents(tokens: Tokens) {
  const now = new Date();
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${now.toISOString()}&` +
    `timeMax=${twoMonthsLater.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime&` +
    `maxResults=50`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  
  return response.json();
}

function getWeekendPeriods() {
  const weekends = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Trouver le prochain samedi
  let currentDay = today.getDay(); // 0 = dimanche, 6 = samedi
  let daysUntilSaturday = (6 - currentDay + 7) % 7;
  if (daysUntilSaturday === 0 && today.getDay() !== 6) {
    daysUntilSaturday = 7;
  }
  
  for (let i = 0; i < 9; i++) {
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday + (i * 7));
    saturday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    
    // J-1 et J+1 pour analyse transport
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() - 1);
    
    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() + 1);
    
    weekends.push({
      saturday,
      sunday,
      friday, // J-1
      monday, // J+1
      label: `Weekend ${saturday.getDate()}/${saturday.getMonth() + 1}-${sunday.getDate()}/${sunday.getMonth() + 1}`
    });
  }
  
  return weekends;
}

function isInWeekendPeriod(eventDate: Date, weekend: any) {
  // Vérifier si l'événement est dans la période J-1, J, J+1
  const dayStart = new Date(eventDate);
  dayStart.setHours(0, 0, 0, 0);
  
  return dayStart >= weekend.friday && dayStart <= weekend.monday;
}

function getDayType(eventDate: Date, weekend: any): 'friday' | 'saturday' | 'sunday' | 'monday' | null {
  const dayStart = new Date(eventDate);
  dayStart.setHours(0, 0, 0, 0);
  
  if (dayStart.getTime() === weekend.friday.getTime()) return 'friday';
  if (dayStart.getTime() === weekend.saturday.getTime()) return 'saturday';
  if (dayStart.getTime() === weekend.sunday.getTime()) return 'sunday';
  if (dayStart.getTime() === weekend.monday.getTime()) return 'monday';
  
  return null;
}

async function main() {
  const tokens = await getTokens();
  const data = await getCalendarEvents(tokens);
  
  if (data.error) {
    writeFileSync(OUTPUT_FILE, `Erreur: ${data.error.message}`);
    return;
  }
  
  const weekends = getWeekendPeriods();
  const weekendPlans: any = {};
  
  // Organiser les événements par weekend
  for (const weekend of weekends) {
    weekendPlans[weekend.label] = {
      period: weekend,
      events: {
        friday: [],
        saturday: [],
        sunday: [],
        monday: []
      },
      hasTransport: false,
      needsTransport: false,
      status: '⚠️ Libre'
    };
  }
  
  // Analyser chaque événement
  for (const event of data.items || []) {
    const start = event.start.date || event.start.dateTime;
    const eventDate = new Date(start);
    const summary = event.summary || '(Sans titre)';
    const lowerSummary = summary.toLowerCase();
    
    // Détection transport explicite
    const isTransport = lowerSummary.includes('train') || 
                       lowerSummary.includes('avion') || 
                       lowerSummary.includes('flight') ||
                       lowerSummary.includes('tgv') ||
                       lowerSummary.includes('ouigo');
    
    for (const weekend of weekends) {
      if (isInWeekendPeriod(eventDate, weekend)) {
        const dayType = getDayType(eventDate, weekend);
        if (!dayType) continue;
        
        const eventInfo = {
          date: eventDate,
          summary,
          location: event.location || '',
          description: event.description || '',
          isTransport,
          time: eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Ne garder que si c'est vraiment lié au weekend :
        // - Sam/Dim : TOUS les événements
        // - Vendredi : uniquement TRANSPORTS après 17h (départ weekend)
        // - Lundi : uniquement TRANSPORTS avant 12h (retour weekend)
        const hour = eventDate.getHours();
        const shouldInclude = 
          dayType === 'saturday' || 
          dayType === 'sunday' || 
          (dayType === 'friday' && hour >= 17 && isTransport) ||
          (dayType === 'monday' && hour < 12 && isTransport);
        
        if (shouldInclude) {
          weekendPlans[weekend.label].events[dayType].push(eventInfo);
          
          if (isTransport) {
            weekendPlans[weekend.label].hasTransport = true;
          }
        }
      }
    }
  }
  
  // Analyser les besoins de transport pour chaque weekend
  for (const [label, plan] of Object.entries(weekendPlans) as any) {
    const hasFridayEvents = plan.events.friday.length > 0;
    const hasSaturdayEvents = plan.events.saturday.length > 0;
    const hasSundayEvents = plan.events.sunday.length > 0;
    const hasMondayEvents = plan.events.monday.length > 0;
    
    const hasWeekendEvents = hasSaturdayEvents || hasSundayEvents;
    const hasAdjacentEvents = hasFridayEvents || hasMondayEvents;
    
    // Besoin de transport si événements sur le weekend OU sur J-1/J+1
    if (hasWeekendEvents || hasAdjacentEvents) {
      plan.needsTransport = true;
      
      if (plan.hasTransport) {
        plan.status = '✅ Transport réservé';
      } else {
        plan.status = '⚠️ MANQUE TRANSPORT';
      }
    } else {
      plan.status = '🏠 Weekend libre';
    }
  }
  
  // Générer le rapport
  let report = '🗓️ ANALYSE WEEKENDS - 2 PROCHAINS MOIS\n';
  report += '='.repeat(60) + '\n\n';
  
  report += '📊 **RÉSUMÉ**\n\n';
  
  let withTransport = 0;
  let needsTransport = 0;
  let free = 0;
  
  for (const [label, plan] of Object.entries(weekendPlans) as any) {
    if (plan.status === '✅ Transport réservé') {
      withTransport++;
    } else if (plan.status === '⚠️ MANQUE TRANSPORT') {
      needsTransport++;
    } else {
      free++;
    }
    
    report += `${plan.status} **${label}**\n`;
    
    // Afficher les événements jour par jour
    const days = ['friday', 'saturday', 'sunday', 'monday'];
    const dayLabels = {
      friday: '  📅 Ven',
      saturday: '  📅 Sam',
      sunday: '  📅 Dim',
      monday: '  📅 Lun'
    };
    
    for (const day of days) {
      if (plan.events[day].length > 0) {
        for (const evt of plan.events[day]) {
          const icon = evt.isTransport ? '🚂' : dayLabels[day];
          report += `${icon} ${evt.time} - ${evt.summary}`;
          if (evt.location) {
            report += ` @ ${evt.location}`;
          }
          report += '\n';
        }
      }
    }
    
    if (!plan.needsTransport) {
      report += '  🏠 Pas d\'événements\n';
    }
    
    report += '\n';
  }
  
  report += '\n' + '='.repeat(60) + '\n\n';
  report += `✅ ${withTransport} weekends avec transport réservé\n`;
  report += `⚠️ ${needsTransport} weekends BESOIN TRANSPORT\n`;
  report += `🏠 ${free} weekends libres\n\n`;
  
  if (needsTransport > 0) {
    report += '⚠️ **WEEKENDS À RÉSERVER URGEMMENT :**\n\n';
    
    for (const [label, plan] of Object.entries(weekendPlans) as any) {
      if (plan.status === '⚠️ MANQUE TRANSPORT') {
        const satDate = plan.period.saturday.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
        const sunDate = plan.period.sunday.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
        report += `🚨 ${satDate} - ${sunDate}\n`;
        
        // Montrer pourquoi transport nécessaire
        const days = ['friday', 'saturday', 'sunday', 'monday'];
        for (const day of days) {
          if (plan.events[day].length > 0) {
            for (const evt of plan.events[day]) {
              report += `   → ${evt.summary}\n`;
            }
          }
        }
        report += '\n';
      }
    }
  }
  
  writeFileSync(OUTPUT_FILE, report);
  writeFileSync(PLANS_FILE, report);
}

main();
