// Xpace «Objeto» en el selector Xpaces (Carlos, 5-nov-2026): locales = gemelos de objetos
// físicos conectados a METAHUMAN. Primer local: Stream Deck XL. No pasa por AdmiraNext.
export const OBJET_ID = 'objeto';
export const OBJET_PROJECT = { id: OBJET_ID, name: 'Objeto' };
export const OBJET_VENUES = [
  { id: 'stream-deck', project_id: OBJET_ID, name: 'Stream Deck', url: '/objeto/stream-deck/' },
];
export const objetoVenue = id => OBJET_VENUES.find(v => v.id === id) || null;
