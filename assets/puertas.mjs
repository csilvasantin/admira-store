// Puertas de Google Maps de los locales (Carlos, 15-oct-2026): «la selección del local desde Store nos tiene que
// llevar a la puerta de Google Maps y si pulsamos en la puerta entramos en el gemelo digital».
// Lo común a los combos (que desvían a la puerta), a la página de la puerta (/xpacios/puerta/) y a sus pruebas.
// La proyección y el warp son los de admira.tv (adcelerate/demo/js/dooh-surfaces.js y best/index.html), donde
// se calibró la fachada de Paseo de Gràcia 103 sobre su panorama de Street View.

export const PAGINA_PUERTA = '/xpacios/puerta/';
let datos = null;

export function puertaDe(puertas, { venue, loc } = {}) {
  return (puertas || []).find(p => (venue && (p.locales || []).includes(venue)) || (loc && p.loc === loc)) || null;
}

// Adónde lleva la puerta: sólo una página del gemelo en este mismo dominio.
export function siguienteSeguro(next, origen) {
  try {
    const u = new URL(String(next || ''), origen);
    if (u.origin !== origen || u.username || u.password) return null;
    if (!(u.pathname === '/admira-xp/' || /^\/xpacios\/[a-z0-9-]+\/$/.test(u.pathname)) || u.pathname === PAGINA_PUERTA) return null;
    return u.pathname + u.search + u.hash;
  } catch { return null; }
}

export function urlPuerta(venueId, next, idioma) {
  const u = new URL(PAGINA_PUERTA, 'https://x.invalid');
  u.searchParams.set('venue', venueId);
  u.searchParams.set('next', next);
  if (idioma) u.searchParams.set('lang', idioma);
  return u.pathname + u.search;
}

async function cargarPuertas(fetchImpl = globalThis.fetch) {
  if (!datos) datos = fetchImpl('/data/puertas.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : { puertas: [] })).catch(() => ({ puertas: [] }));
  return datos;
}

// El desvío de los combos: si el local tiene puerta, primero la calle; si no (o si algo falla), directo al gemelo.
export async function conPuerta(venue, href, { fetchImpl, origen = globalThis.location && globalThis.location.origin } = {}) {
  try {
    const d = await cargarPuertas(fetchImpl);
    const u = new URL(href, origen);
    const p = puertaDe(d.puertas, { venue: venue && venue.id, loc: u.searchParams.get('loc') });
    const next = p && u.origin === origen ? siguienteSeguro(u.href, origen) : null;
    return next ? urlPuerta(venue.id, next, u.searchParams.get('lang')) : href;
  } catch { return href; }
}

// ── Street View: rumbo/inclinación → píxel (como DoohSurfaces.project de admira.tv) ──
const fov = zoom => 2 * Math.atan(2 ** (1 - zoom));
function base(heading, pitch) {
  const r = Math.PI / 180, h = heading * r, p = pitch * r;
  const f = [Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)], right = [Math.cos(h), -Math.sin(h), 0];
  return { f, right, up: [right[1] * f[2], -right[0] * f[2], right[0] * f[1] - right[1] * f[0]] };
}
export function proyectar(heading, pitch, pov, zoom, ancho, alto) {
  const { f, right, up } = base(pov.heading, pov.pitch), v = base(heading, pitch).f;
  const dot = (a, b) => a.reduce((n, x, i) => n + x * b[i], 0), z = dot(v, f);
  if (z <= 0.02) return null;
  const focal = ancho / (2 * Math.tan(fov(zoom) / 2));
  return [ancho / 2 + focal * dot(v, right) / z, alto / 2 - focal * dot(v, up) / z];
}

// Rectángulo w×h → cuadrilátero d (homografía en CSS), como quadWarp de admira.tv.
const adj = m => [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
const mm = (a, b) => { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; };
const mv = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const baseQuad = (x1, y1, x2, y2, x3, y3, x4, y4) => { const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1], v = mv(adj(m), [x4, y4, 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); };
export function quadWarp(w, h, d) {
  const s = baseQuad(0, 0, w, 0, w, h, 0, h), t = baseQuad(d[0][0], d[0][1], d[1][0], d[1][1], d[2][0], d[2][1], d[3][0], d[3][1]);
  const H = mm(t, adj(s));
  for (let i = 0; i < 9; i++) H[i] = H[i] / H[8];
  return 'matrix3d(' + [H[0], H[3], 0, H[6], H[1], H[4], 0, H[7], 0, 0, 1, 0, H[2], H[5], 0, H[8]].join(',') + ')';
}

// La misma calle en Google Maps, sin clave (si la clave aún no admite este dominio).
export function enlaceMaps(entrada) {
  const { pano, pov = {} } = entrada || {};
  const u = new URL('https://www.google.com/maps/@');
  u.searchParams.set('api', '1'); u.searchParams.set('map_action', 'pano'); u.searchParams.set('pano', pano || '');
  u.searchParams.set('heading', String(pov.heading || 0)); u.searchParams.set('pitch', String(pov.pitch || 0));
  return u.href;
}
