// Xpace «Objeto» en el selector Xpaces (Carlos, 5-nov-2026): locales = gemelos de objetos
// físicos conectados a AdmiraNeXT01 (antes METAHUMAN). Primer local: Stream Deck XL. No pasa por AdmiraNext.
export const OBJET_ID = 'objeto';
export const OBJET_PROJECT = { id: OBJET_ID, name: 'Objeto' };
export const OBJET_VENUES = [
  { id: 'stream-deck', project_id: OBJET_ID, name: 'Stream Deck', url: '/objeto/stream-deck/' },
  { id: 'galleon-100', project_id: OBJET_ID, name: 'Corsair Galleon 100 SD', url: '/objeto/galleon-100/' },
];
export const objetoVenue = id => OBJET_VENUES.find(v => v.id === id) || null;
