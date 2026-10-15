// La puerta del local en Google Maps (Carlos, 15-oct-2026): «la selección del local desde Store nos tiene que
// llevar a la puerta de Google Maps y si pulsamos en la puerta entramos en el gemelo digital».
// ?venue=<local del registro>&next=<gemelo>. La calle es Street View en la panorámica calibrada; la fachada
// es un enlace sobre la foto que lleva a «next». Sin Google Maps (clave aún sin este dominio, red), la ficha
// deja entrar igual y abrir la misma calle en Google Maps.
import { montarCombos } from '/assets/xpace-combos.mjs?v=puerta-1';
import { puertaDe, siguienteSeguro, proyectar, quadWarp, enlaceMaps } from '/assets/puertas.mjs?v=puerta-1';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const ingles = () => /^en/i.test(document.documentElement.lang || '');
const texto = (es, en) => (ingles() ? en : es);

function traducir() { for (const n of document.querySelectorAll('#puerta [data-es]')) n.textContent = ingles() ? n.dataset.en : n.dataset.es; }
function aviso(t) { const a = $('#aviso'); a.textContent = t || ''; a.hidden = !t; }

const datos = await fetch('/data/puertas.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({ puertas: [] }));
const puerta = puertaDe(datos.puertas, { venue: params.get('venue'), loc: params.get('loc') });
const porDefecto = p => `/admira-xp/?autostart=cafeteria&loc=${encodeURIComponent(p.loc)}&project=${encodeURIComponent(p.proyecto)}&venue=${encodeURIComponent(p.locales[0])}&quality=better`;
let siguiente = siguienteSeguro(params.get('next'), location.origin) || (puerta ? porDefecto(puerta) : '/xpacios/');

function ponerSiguiente(href) {
  siguiente = href;
  $('#entrar').href = href;
  if (enlacePuerta) enlacePuerta.href = href;
}

let enlacePuerta = null;
traducir();
new MutationObserver(traducir).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

if (!puerta) {
  $('#titulo').textContent = texto('Este local aún no tiene puerta', 'This venue has no door yet');
  $('#pista').hidden = true; $('#maps').hidden = true;
  ponerSiguiente(siguiente);
} else {
  $('#titulo').textContent = puerta.nombre;
  $('#direccion').textContent = puerta.direccion;
  $('#maps').href = enlaceMaps(puerta.entrada);
  ponerSiguiente(siguiente);
  // Los tres combos de la barra, como en el gemelo: la calidad elegida aquí es la del gemelo al entrar.
  montarCombos({
    proyecto: puerta.proyecto,
    local: puerta.locales,
    calidad: () => new URL(siguiente, location.origin).searchParams.get('quality') || 'better',
    alCambiarCalidad: q => { const u = new URL(siguiente, location.origin); u.searchParams.delete('visual'); u.searchParams.set('quality', q); ponerSiguiente(u.pathname + u.search); return true; },
  });
  abrirCalle().catch(e => sinMaps(e && e.message));
}

function sinMaps(motivo) {
  console.warn('[puerta] sin Google Maps:', motivo);
  $('#calle').hidden = true;
  $('#pista').textContent = texto('Google Maps no carga aquí todavía. Puedes entrar igualmente o ver la calle en Google Maps.', 'Google Maps does not load here yet. You can still enter, or see the street in Google Maps.');
}

function cargarMaps(clave) {
  // Cargador oficial de Google (importLibrary), el mismo que usa admira.tv.
  ((g) => { let h, a, k; const p = 'The Google Maps JavaScript API', c = 'google', l = 'importLibrary', q = '__ib__', m = document, b = window; const w = b[c] || (b[c] = {}); const d = w.maps || (w.maps = {}), r = new Set(), e = new URLSearchParams(); const u = () => h || (h = new Promise((f, n) => { a = m.createElement('script'); e.set('libraries', [...r] + ''); for (k in g) e.set(k.replace(/[A-Z]/g, t => '_' + t[0].toLowerCase()), g[k]); e.set('callback', c + '.maps.' + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => (h = n(Error(p + ' could not load.'))); m.head.append(a); })); if (!d[l]) d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)); })({ key: clave, v: 'weekly', language: ingles() ? 'en' : 'es' });
  return window.google.maps.importLibrary('streetView');
}

async function abrirCalle() {
  const clave = window.ADMIRA_GOOGLE_MAPS_KEY;
  if (!clave) throw new Error('sin clave');
  // Google avisa así si la clave no admite este dominio (referrer).
  window.gm_authFailure = () => sinMaps('la clave no admite ' + location.hostname);
  const { StreetViewPanorama } = await cargarMaps(clave);
  const e = puerta.entrada, contenedor = $('#calle');
  const sv = new StreetViewPanorama(contenedor, {
    pano: e.pano, pov: { heading: e.pov.heading, pitch: e.pov.pitch }, zoom: e.pov.zoom,
    disableDefaultUI: true, clickToGo: true, linksControl: true, scrollwheel: true, zoomControl: true,
    addressControl: false, showRoadLabels: false, imageDateControl: false,
    motionTracking: false, motionTrackingControl: false, fullscreenControl: false,
  });
  enlacePuerta = document.createElement('a');
  enlacePuerta.className = 'puerta-local'; enlacePuerta.href = siguiente; enlacePuerta.hidden = true;
  enlacePuerta.setAttribute('aria-label', texto(`Entrar en ${puerta.nombre} · gemelo digital`, `Enter ${puerta.nombre} · digital twin`));
  enlacePuerta.title = enlacePuerta.getAttribute('aria-label');
  enlacePuerta.addEventListener('pointerdown', ev => ev.stopPropagation());
  contenedor.append(enlacePuerta);
  const colocar = () => {
    const r = contenedor.getBoundingClientRect();
    const visible = sv.getVisible() && sv.getPano() === puerta.puerta.pano;
    const pts = visible ? puerta.puerta.esquinas.map(([h, p]) => proyectar(h, p, sv.getPov(), sv.getZoom(), r.width, r.height)) : [];
    enlacePuerta.hidden = !visible || pts.some(x => !x) || pts.every(x => x[0] < 0 || x[0] > r.width || x[1] < 0 || x[1] > r.height);
    if (!enlacePuerta.hidden) enlacePuerta.style.transform = quadWarp(200, 80, pts);
  };
  for (const ev of ['pano_changed', 'pov_changed', 'zoom_changed', 'visible_changed', 'status_changed']) sv.addListener(ev, colocar);
  new ResizeObserver(colocar).observe(contenedor);
  window.__puerta = { get puerta() { return puerta.id; }, get siguiente() { return siguiente; }, get visible() { return !enlacePuerta.hidden; }, sv };
  colocar();
}
