const dates = [
  '2026-01-07', // Aujourd'hui
  '2026-01-10',
  '2026-01-11',
  '2026-01-17',
  '2026-01-18',
  '2026-01-19',
];

for (const d of dates) {
  const date = new Date(d);
  console.log(`${d} → ${date.toLocaleDateString('fr-FR', {weekday: 'long', day: '2-digit', month: '2-digit'})}`);
}
