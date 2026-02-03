const d = new Date('2026-01-19');
const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
console.log('19 janvier 2026 =', days[d.getDay()]);
console.log('18 janvier 2026 =', days[new Date('2026-01-18').getDay()]);
console.log('20 janvier 2026 =', days[new Date('2026-01-20').getDay()]);
