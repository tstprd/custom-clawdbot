const dates = [
  '2026-01-20',
  '2026-01-21', 
  '2026-01-22',
  '2026-01-23',
  '2026-01-19'
];

const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

for (const d of dates) {
  const date = new Date(d);
  console.log(`${d} = ${days[date.getDay()]} ${date.toLocaleDateString('fr-FR')}`);
}
