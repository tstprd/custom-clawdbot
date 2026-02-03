import { writeFileSync } from 'fs';

const today = new Date('2026-01-07'); // Mardi
today.setHours(0, 0, 0, 0);

let output = '';
output += `Aujourd'hui: ${today.toLocaleDateString('fr-FR', {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'})}\n`;
output += `getDay(): ${today.getDay()}\n`; // 0=dim, 6=sam

let currentDay = today.getDay();
let daysUntilSaturday = (6 - currentDay + 7) % 7;
if (daysUntilSaturday === 0 && today.getDay() !== 6) {
  daysUntilSaturday = 7;
}

output += `Jours jusqu'au samedi: ${daysUntilSaturday}\n`;

for (let i = 0; i < 3; i++) {
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday + (i * 7));
  
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  
  output += `\nWeekend ${i}:\n`;
  output += `  Samedi: ${saturday.toLocaleDateString('fr-FR', {weekday: 'long', day: '2-digit', month: '2-digit'})}\n`;
  output += `  Dimanche: ${sunday.toLocaleDateString('fr-FR', {weekday: 'long', day: '2-digit', month: '2-digit'})}\n`;
}

writeFileSync('debug-out2.txt', output);
