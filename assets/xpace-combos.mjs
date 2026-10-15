// Tres combos en la barra común de las páginas de un local (Carlos, 15-oct-2026): «cuando paso de Paseo de
// Gracia a Diagonal se pierde la interface superior para seleccionar proyecto, local y calidad». Los mismos
// tres que el gemelo (/admira-xp/): Xpacio (aplica su marca), Local y Calidad, con la caja .topbar-combo.
// La página dice qué local es el suyo y, si quiere, resuelve en el sitio el cambio de local o de calidad
// (el visor de centros cambia de centro o de 3D a Matrix sin recargar); si no, se navega como en el gemelo.
import { ProjectClient, venueUrl } from '../admira-xp/scripts/central-project-client.mjs?v=tres-combos-1';
import { marcaQueLimita, proyectosPermitidos } from '../admira-xp/scripts/marca-proyectos.mjs?v=alsea-1';
import { conPuerta } from './puertas.mjs?v=puerta-1';

export const CALIDADES = [['good', 'Good'], ['better', 'Better'], ['best', 'Best'], ['matrix', 'Matrix']];
const leer = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ingles = () => /^en/i.test(document.documentElement.lang || '');
const texto = (es, en) => (ingles() ? en : es);

// «Starbucks Diagonal 634 · Barcelona» → «Diagonal 634 · Barcelona» (el Xpacio ya está en su combo).
export function nombreLocal(v, proyectos) {
  const n = String(v.name || ''), pr = (proyectos || []).find(p => p.id === v.project_id), pre = pr ? String(pr.name || '') + ' ' : '';
  return pre.trim() && n.toLowerCase().startsWith(pre.toLowerCase()) && n.length > pre.length ? n.slice(pre.length) : n;
}

export function montarCombos({ proyecto, local, calidad, alCambiarCalidad, alCambiarLocal } = {}) {
  const valor = v => (typeof v === 'function' ? v() : v);
  const client = new ProjectClient({ storage: (() => { try { return sessionStorage; } catch { return undefined; } })() });
  let catalog = { projects: [], venues: [] }, pendiente = '', caja = null;
  const sel = {};

  function crear() {
    const bar = document.querySelector('#topBar.xs-bar');
    if (!bar || bar.querySelector('[data-xpace-combos]')) return !!bar;
    caja = document.createElement('div');
    caja.className = 'xpace-combos'; caja.setAttribute('data-xpace-combos', '');
    caja.style.cssText = 'display:flex;align-items:center;gap:6px;min-width:0;flex:0 1 auto';
    for (const [id, es, en] of [['xpacio', 'Xpacio', 'Xpace'], ['local', 'Local', 'Venue'], ['calidad', 'Calidad', 'Quality']]) {
      const label = document.createElement('label'); label.className = 'topbar-combo'; label.dataset.combo = id;
      const span = document.createElement('span'); span.className = 'picker-label'; span.dataset.es = es; span.dataset.en = en;
      const s = document.createElement('select'); s.setAttribute('aria-label', es);
      label.append(span, s); caja.append(label); sel[id] = s;
    }
    const spacer = bar.querySelector('.spacer');
    bar.insertBefore(caja, spacer || null);
    sel.xpacio.addEventListener('change', () => elegirXpacio(sel.xpacio.value));
    sel.local.addEventListener('change', () => elegirLocal(sel.local.value));
    sel.calidad.addEventListener('change', () => elegirCalidad(sel.calidad.value));
    return true;
  }

  const proyectoActual = () => pendiente || valor(proyecto) || '';
  const localActual = () => {
    const ids = [].concat(valor(local) || []);
    const v = catalog.venues.find(x => x.project_id === proyectoActual() && ids.includes(x.id));
    return v ? v.id : '';
  };
  const calidadActual = () => { const q = valor(calidad) || 'better'; return CALIDADES.some(([id]) => id === q) ? q : 'better'; };

  function pintar() {
    if (!caja || !caja.isConnected) { if (!crear()) return; }
    for (const span of caja.querySelectorAll('[data-es]')) span.textContent = ingles() ? span.dataset.en : span.dataset.es;
    sel.xpacio.setAttribute('aria-label', texto('Xpacio', 'Xpace')); sel.local.setAttribute('aria-label', texto('Local', 'Venue')); sel.calidad.setAttribute('aria-label', texto('Calidad', 'Quality'));
    const marca = marcaQueLimita({ marca: leer('mb:marca'), manual: leer('mb:manual') });
    const proyectos = proyectosPermitidos(marca, catalog.projects), pid = proyectoActual();
    sel.xpacio.replaceChildren(new Option(texto('Escoge un Xpacio', 'Choose a Xpace'), ''), ...proyectos.map(p => new Option(p.name, p.id)));
    sel.xpacio.value = proyectos.some(p => p.id === pid) ? pid : '';
    const locales = catalog.venues.filter(v => v.project_id === pid);
    sel.local.replaceChildren(new Option(texto('Escoge un local', 'Choose a venue'), ''), ...locales.map(v => new Option(nombreLocal(v, catalog.projects), v.id)));
    sel.local.value = pendiente ? '' : localActual();
    sel.local.disabled = !locales.length;
    sel.calidad.replaceChildren(...CALIDADES.map(([id, nombre]) => new Option(nombre, id)));
    sel.calidad.value = calidadActual();
  }

  function aplicarMarca(id) {
    try { if (id && window.AdmiraMarca && typeof window.AdmiraMarca.aplicarProyecto === 'function') window.AdmiraMarca.aplicarProyecto(id); } catch { /* sin marca */ }
  }
  function abrirLocal() { try { sel.local.focus({ preventScroll: true }); if (typeof sel.local.showPicker === 'function') sel.local.showPicker(); } catch { /* el navegador no deja */ } }

  function elegirXpacio(id) {
    if (!id) return;
    aplicarMarca(id);
    const locales = catalog.venues.filter(v => v.project_id === id);
    if (locales.length === 1) { pendiente = id; elegirLocal(locales[0].id); return; }
    pendiente = id === valor(proyecto) ? '' : id; pintar();
    if (locales.length) abrirLocal();
  }

  async function elegirLocal(id) {
    const pid = proyectoActual(), p = catalog.projects.find(x => x.id === pid), v = catalog.venues.find(x => x.id === id && x.project_id === pid);
    if (!p || !v) return;
    let href;
    try { href = venueUrl(location.href, v, p, calidadActual(), { publicDemo: !client.access, language: ingles() ? 'en' : 'es' }); } catch { return; }
    pendiente = '';
    if (typeof alCambiarLocal === 'function' && alCambiarLocal(v, href) === true) { pintar(); return; }
    aplicarMarca(pid);
    try { window.dispatchEvent(new CustomEvent('xpaceos:project-change', { detail: { id: pid } })); } catch { /* nada */ }
    // Un local con puerta de Google Maps pasa primero por su calle (assets/puertas.mjs).
    location.assign(await conPuerta(v, href));
  }

  function elegirCalidad(q) {
    if (typeof alCambiarCalidad === 'function' && alCambiarCalidad(q) === true) { pintar(); return; }
    const u = new URL(location.href); u.searchParams.delete('visual'); u.searchParams.set('quality', q); location.assign(u.href);
  }

  async function cargar() {
    try { catalog = client.access ? await client.context().catch(() => client.demos()) : await client.demos(); }
    catch { catalog = { projects: [], venues: [] }; }
    pintar();
  }

  const montar = () => { if (crear()) { pintar(); cargar(); return true; } return false; };
  if (!montar()) document.addEventListener('xpace:shell-ready', () => montar(), { once: true });
  try { document.addEventListener('admira:marca', () => pintar()); } catch { /* nada */ }
  new MutationObserver(() => pintar()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  return { actualizar: pintar, get catalogo() { return catalog; } };
}
