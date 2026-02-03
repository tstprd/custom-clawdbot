#!/usr/bin/env node

/**
 * Get current time in Paris timezone
 * Usage: node get-paris-time.mjs
 */

const parisTime = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).format(new Date());

const [date, time] = parisTime.split(' ');
const [day, month, year] = date.split('/');
const isoDate = `${year}-${month}-${day}`;

console.log(`Paris: ${isoDate} ${time}`);

// Also output just the hour for easy parsing
const hourOnly = time.split(':')[0];
const minuteOnly = time.split(':')[1];
console.log(`Hour: ${hourOnly}h${minuteOnly}`);

// Day of week
const dayOfWeek = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long'
}).format(new Date());

console.log(`Day: ${dayOfWeek}`);
