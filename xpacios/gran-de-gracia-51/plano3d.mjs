// Gemelo 3D de un Xpacio a partir de su plano canónico `admira.xpacio-plano/1`
// (misión DCL-6ae9d5b0e2d48ee2fd9c7b19, laboratorio Gran de Gràcia 51, 14-oct-2026).
//
// Lógica pura, sin DOM ni three.js: la usan escena3d.mjs, gemelo.mjs y los tests.
// El plano es el mismo JSON que pinta /plano.html de admira.biz (/redistribucion):
// aquí no se duplica ni una coordenada, todo sale de él.
//
// Convenio del plano (docs/plano-obras.md de clearchannel-tv): metros; planta con el
// eje y hacia dentro del local; paredes en el sentido de las agujas del reloj, así el
// alzado de cada pared se ve desde dentro de su extremo `a` (izquierda) a `b`
// (derecha); en una pantalla, `s` es su centro desde `a` y `z` su base sobre el suelo.
// La geometría (wallLength, pointOnWall, inwardNormal, panelSize, screenGeometry,
// footprint, furnitureAgainstWall) es copia literal de plano-core.mjs de clearchannel-tv
// para que el 3D y el plano 2D midan igual.
//
// Paso a three.js: x = x del plano, z = y del plano, y = altura. Un objeto con
// `yaw` = atan2(nx, ny) gira su cara +z hacia (nx, ny) y su eje +x queda en el
// sentido a→b de la pared: la pantalla se ve desde dentro como en el alzado.

import { planoPublico } from '../plano-publico.mjs';

export const SCHEMA = 'admira.xpacio-plano/1';
export const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
export const CAPTURA_STARBUCKS_SIX = id => `https://admira.studio/assets/demos/starbucks-six/captures-r2/starbucks-six-r2-frame-${id}.jpg`;
const INCH = 0.0254;
const EPS = 1e-6;

export const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const num = v => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── Fuente del plano y acceso ───────────────────────────────────────────────
// Los clientes de las cinco soluciones comparten planos e inventario ITIL (Carlos,
// 14-oct-2026): con sesión manda el plano publicado en admira.biz. Si no responde, no es
// JSON, no valida o es de otro Xpacio, se usa la copia de este sitio y se dice cuál.
// Sin sesión (criterio del ITIL de Yokup: el mapa de qué pantalla hay en qué pared no es
// público) sólo se pide la copia de este sitio, que el servidor ya entrega en su versión
// pública (functions/data/xpacios/[id].js), y aquí se vuelve a recortar por si acaso.
export const PLANO_COMPARTIDO = id => `https://www.admira.biz/data/xpacios/${id}.json`;
export const PLANO_LOCAL = id => `/data/xpacios/${id}.json`;

export async function comprobarSesion({ fetchImpl = globalThis.fetch, timeoutMs = 6000 } = {}) {
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
  try {
    const r = await fetchImpl('/auth/session', { credentials: 'same-origin', cache: 'no-store', ...(ac ? { signal: ac.signal } : {}) });
    if (!r || !r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j && j.ok === true);
  } catch (_) { return false; } finally { if (timer) clearTimeout(timer); }
}

export async function cargarPlano(id, { fetchImpl = globalThis.fetch, fuentes, timeoutMs = 6000, sesion = false } = {}) {
  if (!ID_RE.test(String(id || ''))) throw new Error(`Id de Xpacio no válido: «${id}»`);
  const lista = fuentes || (sesion ? [{ fuente: 'compartido', url: PLANO_COMPARTIDO(id) }, { fuente: 'local', url: PLANO_LOCAL(id) }] : [{ fuente: 'local', url: PLANO_LOCAL(id) }]);
  const fallos = [];
  for (const { fuente, url } of lista) {
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
    try {
      // no-store: sin petición condicional (admira.biz llegó a contestar 404 a If-None-Match).
      const r = await fetchImpl(url, { cache: 'no-store', credentials: fuente === 'local' ? 'same-origin' : 'omit', ...(ac ? { signal: ac.signal } : {}) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const tipo = (r.headers && typeof r.headers.get === 'function' && r.headers.get('content-type')) || '';
      if (/text\/html/i.test(tipo)) throw new Error('responde HTML: no hay plano publicado');
      let plan = await r.json();
      const { errores } = validatePlan(plan);
      if (errores.length) throw new Error(`plano no válido: ${errores[0]}`);
      if (plan.id !== id) throw new Error(`es el plano de «${plan.id}»`);
      const publico = !sesion || plan.publico === true;
      if (publico) plan = planoPublico(plan);
      return { plan, fuente, url, fallos, acceso: publico ? 'publico' : 'sesion' };
    } catch (e) {
      fallos.push({ fuente, url, error: e && e.name === 'AbortError' ? `sin respuesta en ${timeoutMs / 1000} s` : String(e && e.message || e) });
    } finally { if (timer) clearTimeout(timer); }
  }
  const e = new Error(`No se pudo cargar el plano de «${id}»: ${fallos.map(f => `${f.fuente} (${f.error})`).join(' · ')}`);
  e.fallos = fallos;
  throw e;
}

// ── Geometría (copia de plano-core.mjs) ─────────────────────────────────────
export function wallLength(wall) {
  return Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]);
}

export function pointOnWall(wall, s) {
  const len = wallLength(wall) || 1;
  const t = s / len;
  return [wall.a[0] + (wall.b[0] - wall.a[0]) * t, wall.a[1] + (wall.b[1] - wall.a[1]) * t];
}

// Normal hacia el interior (a la derecha del sentido a→b con el eje y hacia abajo).
export function inwardNormal(wall) {
  const len = wallLength(wall) || 1;
  const dx = (wall.b[0] - wall.a[0]) / len, dy = (wall.b[1] - wall.a[1]) / len;
  return [-dy, dx];
}

export function panelSize({ pulgadas = 55, aspecto = [16, 9], orientacion = 'horizontal', dimensiones } = {}) {
  if (dimensiones && dimensiones.ancho > 0 && dimensiones.alto > 0) {
    const { ancho, alto } = dimensiones;
    return orientacion === 'vertical' ? { w: Math.min(ancho, alto), h: Math.max(ancho, alto) } : { w: Math.max(ancho, alto), h: Math.min(ancho, alto) };
  }
  const [aw, ah] = aspecto;
  const k = pulgadas * INCH / Math.hypot(aw, ah);
  const long = aw * k, short = ah * k;
  return orientacion === 'vertical' ? { w: short, h: long } : { w: long, h: short };
}

export function screenGeometry(screen) {
  const size = panelSize(screen);
  const res = screen.resolucion || [1920, 1080];
  const lienzo = screen.orientacion === 'vertical' ? [Math.min(...res), Math.max(...res)] : [Math.max(...res), Math.min(...res)];
  return { w: size.w, h: size.h, lienzo };
}

export function footprint(screen) {
  const g = screenGeometry(screen);
  const x0 = screen.s - g.w / 2;
  return { x0, x1: x0 + g.w, z0: screen.z, z1: screen.z + g.h, w: g.w, h: g.h };
}

export function furnitureAgainstWall(item, wall) {
  const corners = [[item.x, item.y], [item.x + item.w, item.y], [item.x, item.y + item.d], [item.x + item.w, item.y + item.d]];
  const len = wallLength(wall) || 1;
  const ux = (wall.b[0] - wall.a[0]) / len, uy = (wall.b[1] - wall.a[1]) / len;
  const [nx, ny] = inwardNormal(wall);
  const ss = corners.map(([x, y]) => (x - wall.a[0]) * ux + (y - wall.a[1]) * uy);
  const ds = corners.map(([x, y]) => (x - wall.a[0]) * nx + (y - wall.a[1]) * ny);
  return { s0: Math.min(...ss), s1: Math.max(...ss), dist: Math.min(...ds), fondo: Math.max(...ds) };
}

// ── Validación del esquema ──────────────────────────────────────────────────
// Errores: el 3D no se puede montar. Avisos: se monta, pero algo no cuadra.
export function validatePlan(plan) {
  const errores = [], avisos = [];
  if (!plan || typeof plan !== 'object') return { errores: ['El plano no es un objeto JSON'], avisos };
  if (plan.schema !== SCHEMA) errores.push(`Esquema «${plan.schema}»: se esperaba ${SCHEMA}`);
  if (!ID_RE.test(String(plan.id || ''))) errores.push(`Id de Xpacio no válido: «${plan.id}»`);
  const p = plan.planta || {};
  if (!(num(p.ancho) && p.ancho > 0 && num(p.fondo) && p.fondo > 0 && num(p.alto) && p.alto > 0)) errores.push('La planta necesita ancho, fondo y alto positivos');
  const paredes = Array.isArray(plan.paredes) ? plan.paredes : [];
  if (paredes.length < 3) errores.push('Hacen falta al menos 3 paredes');
  const ids = new Set();
  for (const w of paredes) {
    if (!w || !w.id || ids.has(w.id)) errores.push(`Pared sin id o repetida: «${w && w.id}»`);
    ids.add(w && w.id);
    const ok = pt => Array.isArray(pt) && pt.length === 2 && pt.every(num);
    if (!ok(w?.a) || !ok(w?.b) || wallLength(w) < EPS) errores.push(`La pared «${w && w.id}» necesita extremos a y b distintos`);
  }
  if (!errores.length) {
    let area = 0;
    for (const w of paredes) area += w.a[0] * w.b[1] - w.b[0] * w.a[1];
    if (area <= 0) avisos.push('Las paredes no van en el sentido de las agujas del reloj (planta con y hacia dentro)');
    for (let i = 0; i < paredes.length; i++) {
      const b = paredes[i].b, a = paredes[(i + 1) % paredes.length].a;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.01) avisos.push(`La pared «${paredes[i].id}» no cierra con la siguiente`);
    }
  }
  const pantallas = Array.isArray(plan.pantallas) ? plan.pantallas : [];
  const sids = new Set();
  for (const s of pantallas) {
    const nombre = s && (s.id || '(sin id)');
    if (!s || !s.id || sids.has(s.id)) errores.push(`Pantalla sin id o repetida: «${nombre}»`);
    sids.add(s && s.id);
    if (!ids.has(s?.pared)) errores.push(`La pantalla «${nombre}» no está en ninguna pared del plano`);
    if (!num(s?.s) || !num(s?.z)) errores.push(`La pantalla «${nombre}» necesita s y z numéricos`);
    if (!['vertical', 'horizontal'].includes(s?.orientacion)) errores.push(`La pantalla «${nombre}» necesita orientación vertical u horizontal`);
    if (!(num(s?.pulgadas) && s.pulgadas > 0) && !s?.dimensiones) errores.push(`La pantalla «${nombre}» necesita pulgadas`);
  }
  for (const h of plan.huecos || []) if (!ids.has(h.pared)) errores.push(`El hueco «${h.id}» no está en ninguna pared`);
  for (const m of plan.mobiliario || []) if (![m.x, m.y, m.w, m.d, m.alto].every(num)) errores.push(`El mueble «${m.id}» necesita x, y, w, d y alto`);
  for (const m of plan.mobiliario || []) if (m.pared && !ids.has(m.pared)) errores.push(`El mueble «${m.id}» da la espalda a una pared que no está en el plano: «${m.pared}»`);
  for (const d of plan.dispositivos || []) if (d.pared && !ids.has(d.pared)) errores.push(`El dispositivo «${d.id}» no está en ninguna pared`);
  return { errores, avisos };
}

// ── Paredes: tramos macizos alrededor de los huecos ─────────────────────────
// Devuelve rectángulos {s0, s1, z0, z1} del alzado que no son hueco.
export function wallSolids(len, alto, huecos = []) {
  const hs = huecos.map(h => ({ s0: clamp(h.desde, 0, len), s1: clamp(h.desde + h.ancho, 0, len), z0: clamp(h.base || 0, 0, alto), z1: clamp((h.base || 0) + h.alto, 0, alto) }))
    .filter(h => h.s1 - h.s0 > EPS && h.z1 - h.z0 > EPS);
  const cuts = [...new Set([0, len, ...hs.flatMap(h => [h.s0, h.s1])])].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const s0 = cuts[i], s1 = cuts[i + 1];
    if (s1 - s0 < EPS) continue;
    const mid = (s0 + s1) / 2;
    const covering = hs.filter(h => h.s0 <= mid && h.s1 >= mid).sort((a, b) => a.z0 - b.z0);
    let z = 0;
    for (const h of covering) { if (h.z0 > z + EPS) out.push({ s0, s1, z0: z, z1: h.z0 }); z = Math.max(z, h.z1); }
    if (alto - z > EPS) out.push({ s0, s1, z0: z, z1: alto });
  }
  return out;
}

// ── Clasificación del mobiliario (el plano no trae tipo ni giro) ────────────
export function tipoMueble(m) {
  const t = `${m.id} ${m.nombre || ''}`.toLowerCase();
  if (/mesa|desk/.test(t)) return 'mesa';
  if (/silla|chair/.test(t)) return 'silla';
  if (/nevera|frigor|fridge/.test(t)) return 'nevera';
  if (/recreativa|arcade/.test(t)) return 'recreativa';
  // Cafetería (Starbucks Paseo de Gracia): barra, caja, vitrina, estantería de tazas y pilar.
  if (/barra|mostrador|counter/.test(t)) return 'barra';
  if (/\bcaja\b|tpv|checkout/.test(t)) return 'caja';
  if (/vitrina|display case/.test(t)) return 'vitrina';
  if (/taza|estanter|shelf/.test(t)) return 'estanteria';
  if (/pilar|columna|pillar|column/.test(t)) return 'pilar';
  return 'mueble';
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const yawFor = ([nx, ny]) => Math.atan2(nx, ny);

// Frente de un mueble: con `pared` en el plano, mira hacia dentro desde esa pared. Si no, si toca una pared (≤ 12 cm), mira hacia dentro desde ella (en
// una esquina gana la pared que más mira al centro de la sala). Suelto (sillas), mira
// a la pared frontal del plano, la primera: el plano no trae giro de muebles.
export function frenteMueble(m, plan) {
  // El plano puede decir a qué pared da la espalda el mueble (`pared`): manda sobre la deducción.
  // Hace falta en las esquinas, donde dos paredes casi empatan (la nevera del laboratorio, 14-oct).
  const fija = m.pared && plan.paredes.find(w => w.id === m.pared);
  if (fija) return { pared: fija.id, n: inwardNormal(fija), apoyado: true };
  const centro = [plan.planta.ancho / 2, plan.planta.fondo / 2];
  const c = [m.x + m.w / 2, m.y + m.d / 2];
  const dir = sub(centro, c);
  let best = null;
  for (const w of plan.paredes) {
    const p = furnitureAgainstWall(m, w);
    if (p.dist > 0.12 || p.dist < -0.05 || p.s1 < 0 || p.s0 > wallLength(w)) continue;
    const n = inwardNormal(w), score = dot(n, dir);
    if (!best || score > best.score) best = { pared: w.id, n, score };
  }
  if (best) return { pared: best.pared, n: best.n, apoyado: true };
  const n = inwardNormal(plan.paredes[0]);
  return { pared: plan.paredes[0].id, n: [-n[0], -n[1]], apoyado: false };
}

// ── Pantallas, dispositivos y muebles colocados en 3D ───────────────────────
const SEPARACION_PARED = 0.03;   // pantalla colgada: bisel contra la pared
const SEPARACION_MESA = 0.25;    // monitor con pie sobre una mesa pegada a la pared
const SEPARACION_PORTATIL = 0.35;
const TAMANOS = [
  [/mac\s*studio/i, [0.197, 0.095, 0.197]],
  [/mac\s*mini/i, [0.127, 0.05, 0.127]],
  [/webcam|c[aá]mara|insta360/i, [0.05, 0.055, 0.045]],
];
const tamano = d => (TAMANOS.find(([re]) => re.test(`${d.nombre || ''} ${d.id}`)) || [null, [0.2, 0.1, 0.2]])[1];
export const codigoItil = o => o.itil || o.itilPropuesto || null;
export const esPortatil = (s, plan) => /integrada|port[aá]til|laptop/i.test(`${s.nombre || ''}`) ||
  (plan.dispositivos || []).some(d => d.nombre === s.player && /port[aá]til|laptop/i.test(`${d.rol || ''}`));

// Mueble sobre el que descansa una pantalla: pegado a su pared, debajo de ella
// (su alto no pasa de la base) y a menos de 30 cm por debajo.
function apoyoDe(f, wall, plan) {
  let best = null;
  for (const m of plan.mobiliario || []) {
    const p = furnitureAgainstWall(m, wall);
    if (p.dist > 0.1 || p.dist < -0.05) continue;
    if (Math.min(f.x1, p.s1) - Math.max(f.x0, p.s0) <= EPS) continue;
    if (m.alto > f.z0 + 0.02 || m.alto < f.z0 - 0.3) continue;
    if (!best || m.alto > best.m.alto) best = { m, fondo: p.fondo };
  }
  return best;
}

export function colocarPantalla(s, plan) {
  const wall = plan.paredes.find(w => w.id === s.pared);
  const f = footprint(s), n = inwardNormal(wall), u = [(wall.b[0] - wall.a[0]) / wallLength(wall), (wall.b[1] - wall.a[1]) / wallLength(wall)];
  const portatil = esPortatil(s, plan);
  const apoyo = apoyoDe(f, wall, plan);
  let separacion = num(s.separacion) ? s.separacion : SEPARACION_PARED;
  if (!num(s.separacion) && apoyo) separacion = portatil ? clamp(SEPARACION_PORTATIL, 0.1, apoyo.fondo - 0.3) : clamp(SEPARACION_MESA, 0.08, apoyo.fondo - 0.15);
  const base = pointOnWall(wall, s.s);
  const p = [base[0] + n[0] * separacion, base[1] + n[1] * separacion];
  return {
    id: s.id, itil: codigoItil(s), screenId: s.screenId || null, nombre: s.nombre || s.id, corto: s.corto || s.id,
    grupo: s.grupo || null, grupoNombre: s.grupoNombre || null, player: s.player || null,
    orientacion: s.orientacion, pulgadas: s.pulgadas, resolucion: s.resolucion || null, estado: s.estado || null,
    pared: wall.id, s: s.s, z: s.z, w: f.w, h: f.h, x0: f.x0, x1: f.x1, z1: f.z1,
    separacion: round(separacion, 3), n, u, yaw: yawFor(n),
    centro: [p[0], p[1], s.z + f.h / 2],
    apoyo: apoyo ? { id: apoyo.m.id, alto: apoyo.m.alto } : null,
    portatil,
    textura: s.screenId ? CAPTURA_STARBUCKS_SIX(s.screenId) : null,
    playerVirtual: s.playerVirtual || null,
  };
}

// Dispositivos: con s y z se colocan donde dice el plano (si quedan encima de una
// pantalla, se apoyan en ella). Un player sin posición se deduce de sus pantallas:
// el portátil es su propia pantalla; los demás, junto a la H de su mosaico, sobre la
// mesa que la sostiene o, con colocación «bajo-mesa», en el suelo bajo ella.
export function colocarDispositivo(d, plan, pantallas, colocacion = {}) {
  const tam = tamano(d);
  const base = { id: d.id, itil: codigoItil(d), nombre: d.nombre || d.id, categoria: d.categoria || null, rol: d.rol || null, tam };
  if (d.pared && num(d.s) && num(d.z)) {
    const wall = plan.paredes.find(w => w.id === d.pared), n = inwardNormal(wall);
    const debajo = pantallas.find(p => p.pared === wall.id && d.s >= p.x0 - EPS && d.s <= p.x1 + EPS && d.z >= p.z1 - 0.02 && d.z <= p.z1 + 0.15);
    const sep = debajo ? debajo.separacion : tam[2] / 2 + 0.01;
    const pt = pointOnWall(wall, d.s);
    return { ...base, pared: wall.id, colocacion: debajo ? 'sobre-pantalla' : 'plano', sobre: debajo ? debajo.id : null, n, yaw: yawFor(n),
      pos: [pt[0] + n[0] * sep, pt[1] + n[1] * sep, d.z], deducida: false };
  }
  const suyas = pantallas.filter(p => p.player && p.player === d.nombre && (!d.pared || p.pared === d.pared));
  if (!suyas.length) return { ...base, pared: d.pared || null, colocacion: 'sin-posicion', pos: null, deducida: true };
  const propia = suyas.find(p => p.portatil);
  if (propia) return { ...base, pared: propia.pared, colocacion: 'pantalla', sobre: propia.id, n: propia.n, yaw: propia.yaw,
    pos: [propia.centro[0], propia.centro[1], propia.z], deducida: true };
  const ancla = suyas.find(p => p.orientacion === 'horizontal') || suyas[0];
  const wall = plan.paredes.find(w => w.id === ancla.pared), n = ancla.n, pt = pointOnWall(wall, ancla.s);
  if ((colocacion[d.id] || 'sobre-mesa') === 'bajo-mesa') {
    const sep = 0.2;
    return { ...base, pared: wall.id, colocacion: 'bajo-mesa', sobre: null, bajo: ancla.apoyo?.id || null, n, yaw: ancla.yaw,
      pos: [pt[0] + n[0] * sep, pt[1] + n[1] * sep, 0], deducida: true };
  }
  const sep = ancla.separacion + 0.06 + tam[2] / 2;
  return { ...base, pared: wall.id, colocacion: 'sobre-mesa', sobre: ancla.apoyo?.id || null, n, yaw: ancla.yaw,
    pos: [pt[0] + n[0] * sep, pt[1] + n[1] * sep, ancla.apoyo ? ancla.apoyo.alto : 0], deducida: true };
}

// Escena completa, en coordenadas del plano (x, y) y altura.
export function escenaDesdePlano(plan, { colocacion = {} } = {}) {
  const { errores, avisos } = validatePlan(plan);
  if (errores.length) { const e = new Error(errores.join(' · ')); e.errores = errores; throw e; }
  const alto = plan.planta.alto;
  const paredes = plan.paredes.map(w => {
    const len = wallLength(w), n = inwardNormal(w);
    const huecos = (plan.huecos || []).filter(h => h.pared === w.id);
    return { id: w.id, nombre: w.nombre || w.id, a: w.a, b: w.b, len, alto: w.alto || alto, n, u: [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len], yaw: yawFor(n),
      huecos: huecos.map(h => ({ ...h })), macizos: wallSolids(len, w.alto || alto, huecos) };
  });
  const pantallas = (plan.pantallas || []).map(s => colocarPantalla(s, plan));
  const dispositivos = (plan.dispositivos || []).map(d => colocarDispositivo(d, plan, pantallas, colocacion));
  const muebles = (plan.mobiliario || []).map(m => { const f = frenteMueble(m, plan); return { ...m, tipo: tipoMueble(m), frente: f.pared, apoyado: f.apoyado, n: f.n, yaw: yawFor(f.n) }; });
  const grupos = [];
  for (const p of pantallas) {
    if (!p.grupo) continue;
    let g = grupos.find(x => x.id === p.grupo);
    if (!g) grupos.push(g = { id: p.grupo, nombre: p.grupoNombre || p.grupo, player: p.player, pared: p.pared, pantallas: [] });
    g.pantallas.push(p.id);
  }
  for (const g of grupos) {
    const ms = g.pantallas.map(id => pantallas.find(p => p.id === id)).sort((a, b) => a.s - b.s);
    g.pantallas = ms.map(p => p.id);
    g.composicion = ms.map(p => p.orientacion === 'vertical' ? 'V' : 'H').join('–');
  }
  return { id: plan.id, nombre: plan.nombre || plan.id, version: plan.version || null, avisos,
    sala: { ancho: plan.planta.ancho, fondo: plan.planta.fondo, alto, centro: [plan.planta.ancho / 2, plan.planta.fondo / 2] },
    paredes, pantallas, dispositivos, muebles, grupos };
}

// ── Vistas ──────────────────────────────────────────────────────────────────
// Cámaras en coordenadas del plano: pos/objetivo = [x, y, altura].
export const ALZADO_FONDO = 0.9; // lo que el alzado deja ver delante de la pared (m)

export function vistaPuerta(escena) {
  const puertas = escena.paredes.flatMap(w => w.huecos.filter(h => h.tipo === 'puerta').map(h => ({ w, h })));
  const elegida = puertas.find(({ h }) => /pasillo|entrada|acceso/i.test(`${h.id} ${h.nombre || ''}`)) || puertas[0];
  if (!elegida) return null;
  const { w, h } = elegida, pt = pointOnWall(w, h.desde + h.ancho / 2);
  const pos = [pt[0] + w.n[0] * 0.55, pt[1] + w.n[1] * 0.55, 1.6]; // un paso dentro: la hoja abierta queda al lado
  const [cx, cy] = escena.sala.centro;
  return { tipo: 'perspectiva', hueco: h.id, pared: w.id, pos, objetivo: [cx, cy, 1.05], fov: 64 };
}

// Webcam PTZ: pan positivo gira a la derecha de la cámara, tilt positivo hacia arriba.
// `panCero`: hacia dónde apunta el pan 0 de la cámara respecto a la normal de su pared
// (grados, positivo a la derecha). El plano no lo trae: se calibra con sus fotos.
export function vistaWebcam(escena, { pan = 60, tilt = -10, fov = 44, panCero = 0 } = {}) {
  const cam = escena.dispositivos.find(d => d.pos && /webcam|c[aá]mara|insta360/i.test(`${d.nombre} ${d.id}`));
  if (!cam) return null;
  const [nx, ny] = cam.n, right = [-ny, nx]; // derecha de quien mira hacia n (planta con y hacia dentro)
  const p = (pan + panCero) * Math.PI / 180, t = tilt * Math.PI / 180;
  const f = [nx * Math.cos(p) + right[0] * Math.sin(p), ny * Math.cos(p) + right[1] * Math.sin(p)];
  const pos = [cam.pos[0] + nx * 0.03, cam.pos[1] + ny * 0.03, cam.pos[2] + cam.tam[1] / 2];
  const objetivo = [pos[0] + f[0] * Math.cos(t), pos[1] + f[1] * Math.cos(t), pos[2] + Math.sin(t)];
  return { tipo: 'perspectiva', dispositivo: cam.id, pan, tilt, panCero, pos, objetivo, fov };
}

export function vistaAlzado(escena, paredId) {
  const w = escena.paredes.find(x => x.id === paredId);
  if (!w) return null;
  const mid = pointOnWall(w, w.len / 2), dist = Math.max(escena.sala.ancho, escena.sala.fondo) + 4;
  return { tipo: 'alzado', pared: w.id, nombre: w.nombre, ancho: w.len, alto: w.alto,
    pos: [mid[0] + w.n[0] * dist, mid[1] + w.n[1] * dist, w.alto / 2], objetivo: [mid[0], mid[1], w.alto / 2],
    near: dist - ALZADO_FONDO, far: dist + 0.6 };
}
