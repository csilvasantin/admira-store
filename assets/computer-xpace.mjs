// Xpace «Computer» en el selector Xpaces (Carlos, 4-nov-2026): sus locales son los gemelos del Supercomputer
// ya publicados, Metahuman y PC-Cocina. No pasa por AdmiraNext: elegir un local navega a su gemelo.
export const COMPUTER_ID = 'computer';
export const COMPUTER_PROJECT = { id: COMPUTER_ID, name: 'Computer' };
export const COMPUTER_VENUES = [
  { id: 'metahuman', project_id: COMPUTER_ID, name: 'Metahuman', url: '/supercomputer/metahuman/' },
  { id: 'pc-cocina', project_id: COMPUTER_ID, name: 'PC-Cocina', url: '/supercomputer/pc-cocina/' },
];
export const computerVenue = id => COMPUTER_VENUES.find(v => v.id === id) || null;
