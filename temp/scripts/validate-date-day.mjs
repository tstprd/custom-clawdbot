#!/usr/bin/env node

/**
 * Validate that a date matches the expected day of week
 * Usage: node validate-date-day.mjs "jeudi" "2026-01-16"
 */

const dayNames = {
  'dimanche': 0,
  'lundi': 1,
  'mardi': 2,
  'mercredi': 3,
  'jeudi': 4,
  'vendredi': 5,
  'samedi': 6
};

const dayNamesReverse = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function validateDateDay(dayName, dateStr) {
  dayName = dayName.toLowerCase();
  
  if (!dayNames.hasOwnProperty(dayName)) {
    return { valid: false, error: `Jour invalide: ${dayName}` };
  }
  
  const expectedDay = dayNames[dayName];
  const date = new Date(dateStr + 'T00:00:00');
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: `Date invalide: ${dateStr}` };
  }
  
  const actualDay = date.getDay();
  
  if (actualDay !== expectedDay) {
    const actualDayName = dayNamesReverse[actualDay];
    return {
      valid: false,
      error: `INCOHÉRENCE: Le ${dateStr} est un ${actualDayName}, PAS un ${dayName}`,
      expected: dayName,
      actual: actualDayName,
      date: dateStr
    };
  }
  
  return { valid: true, message: `✓ ${dayName} ${dateStr} est correct` };
}

// Command line usage
if (process.argv.length >= 4) {
  const dayName = process.argv[2];
  const dateStr = process.argv[3];
  
  const result = validateDateDay(dayName, dateStr);
  
  if (result.valid) {
    console.log(result.message);
    process.exit(0);
  } else {
    console.error(result.error);
    process.exit(1);
  }
}

export { validateDateDay };
