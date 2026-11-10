// Xpace «Computer» en el selector Xpaces (Carlos, 4-nov-2026): sus locales son los gemelos del Supercomputer
// ya publicados. El 01 se llama AdmiraNeXT01 (antes Metahuman; el id y la URL se conservan, con alias).
// PC-Cocina no se renombra aquí. No pasa por AdmiraNext: elegir un local navega a su gemelo.
export const COMPUTER_ID = 'computer';
export const COMPUTER_PROJECT = { id: COMPUTER_ID, name: 'Computer' };
export const COMPUTER_VENUES = [
  { id: 'metahuman', project_id: COMPUTER_ID, name: 'AdmiraNeXT01', url: '/supercomputer/metahuman/' },
  { id: 'pc-cocina', project_id: COMPUTER_ID, name: 'PC-Cocina', url: '/supercomputer/pc-cocina/' },
];
export const COMPUTER_ALIAS = { admiranext01: 'metahuman' };
export const computerVenue = id => COMPUTER_VENUES.find(v => v.id === (COMPUTER_ALIAS[id] || id)) || null;
