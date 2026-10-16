// Circuito «Altadis España · 10 Xtancos» (altadis_espana): 10 estancos reales en 10 ciudades,
// cada uno con un formato de Altadis, para la demo del 16-oct-2026 (misión
// DCL-a6cb621be0ce5932f50960de, tarea b). Es la misma demo que las 10 cafeterías de Alsea México,
// con cliente Altadis: la ficha de cada estanco en el mapa de admira.biz abre su gemelo con
// ?espacio=altadis-xtanco-NN&loc=<id>&marca=altadis.
//
// Lógica pura, sin DOM: lectura de ?loc= / ?circuito= / ?marca=, índice del circuito con su
// respaldo, orden del recorrido y textos del local. La usan visor.mjs y los tests.
//
// Contrato del índice (lo publica el equipo de admira.biz; CORS abierto):
//   https://www.admira.biz/data/xpacios/altadis-espana-10.json
//   {"schema":"admira.circuito-demo/1","circuito":"altadis_espana","cliente":"Altadis","marca":"altadis",
//    "locales":[{"id","nombre","direccion","ciudad","coords":[lng,lat],"tourOrder","formato":"cliente-NN",
//                "espacio":"altadis-xtanco-NN","mapa":"<enlace al mapa centrado en el estanco>"}]}
// Mientras no exista (404), el respaldo es planos/altadis-espana-10.json: el reparto previsto, sin
// nombres reales («Estanco de <ciudad>»). En cada carga se prueba primero el real.

import { cargarConRespaldo, ESPACIO_RE, FORMATO_RE, ESPERA_COMPARTIDO_MS, TIPOS } from './espacios.mjs?v=a18-5';

export const SCHEMA_CIRCUITO = 'admira.circuito-demo/1';
export const CIRCUITO = 'altadis_espana';
export const CIRCUITO_COMPARTIDO = 'https://www.admira.biz/data/xpacios/altadis-espana-10.json';
export const CIRCUITO_LOCAL = '/xpacios/altadis-18/planos/altadis-espana-10.json';
// El mapa de admira.biz lee ?circuit= y vuela a ?lng=&lat= con su ?label= (app.js de admira.biz).
export const MAPA_BASE = 'https://www.admira.biz/';
// Con la marca de un cliente, el tipo de espacio que se enseña por defecto. Altadis: estancos.
export const TIPO_DE_MARCA = { altadis: 'xtanco' };

const LOC_RE = /^[a-z0-9][a-z0-9_-]{0,80}$/i;
const texto = v => typeof v === 'string' && v.trim().length > 0;
const urlSegura = u => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u);
const coordsValidas = c => Array.isArray(c) && c.length >= 2 && c.slice(0, 2).every(n => typeof n === 'number' && Number.isFinite(n))
  && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
/** Minúsculas, sin tildes y con guiones: «A Coruña» → «a-coruna». */
export const slug = v => String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── URL ─────────────────────────────────────────────────────────────────────
/**
 * Lo que la URL pide del circuito: ?loc=<id> (un local del mapa) y ?circuito=altadis_espana.
 * `pide`: hay que leer el índice del circuito. Un loc mal formado no cuenta.
 */
export function circuitoDesdeURL(search = '') {
  const p = new URLSearchParams(search);
  const loc = LOC_RE.test(p.get('loc') || '') ? p.get('loc') : null;
  const circuito = p.get('circuito') === CIRCUITO;
  return { loc, circuito, pide: Boolean(loc) || circuito };
}

/** La marca blanca pedida (?marca=), en minúsculas; «alsea» es Starbucks, como en el shell. */
export function marcaDesdeURL(search = '') {
  const v = slug(new URLSearchParams(search).get('marca') || '');
  return v === 'alsea' ? 'starbucks' : v || null;
}

/**
 * Tipo de espacio con el que arranca la página: el del espacio pedido, si no ?tipo=, si no el de
 * la marca (Altadis → Xtanco), si no Xtanco, como siempre.
 */
export function tipoInicial(search = '') {
  const p = new URLSearchParams(search);
  const m = ESPACIO_RE.exec(p.get('espacio') || '');
  if (m) return m[1];
  if (TIPOS.includes(p.get('tipo'))) return p.get('tipo');
  return TIPO_DE_MARCA[marcaDesdeURL(search)] || 'xtanco';
}

// ── Índice del circuito ─────────────────────────────────────────────────────
/** Enlace al mapa de admira.biz con el circuito y centrado en el local, si trae coordenadas. */
export function enlaceMapa(local, circuito = CIRCUITO) {
  const p = new URLSearchParams({ circuit: circuito });
  if (local && coordsValidas(local.coords)) {
    p.set('lng', String(local.coords[0])); p.set('lat', String(local.coords[1]));
    if (texto(local.nombre)) p.set('label', local.nombre.trim());
  }
  return `${MAPA_BASE}?${p}`;
}

/**
 * Locales utilizables del índice, en orden de tour. Se descarta (con su aviso) el que no tiene
 * id, el repetido y el que no abre un Xtanco (altadis-xtanco-NN). El formato sale del espacio,
 * que es lo que se abre; el mapa, del índice si es https y, si no, de las coordenadas.
 */
export function normalizarCircuito(d) {
  const avisos = [], locales = [], ids = new Set();
  const lista = d && Array.isArray(d.locales) ? d.locales : [];
  const circuito = (d && texto(d.circuito) && d.circuito) || CIRCUITO;
  lista.forEach((l, i) => {
    const id = l && l.id;
    if (!texto(id) || !LOC_RE.test(id)) { avisos.push(`Local ${i + 1} sin id válido`); return; }
    if (ids.has(id)) { avisos.push(`Local repetido: «${id}»`); return; }
    const m = ESPACIO_RE.exec(String(l.espacio || ''));
    if (!m || m[1] !== 'xtanco') { avisos.push(`El local «${id}» no abre un Xtanco: «${l.espacio}»`); return; }
    ids.add(id);
    const formato = `cliente-${m[2]}`;
    if (l.formato && l.formato !== formato) avisos.push(`El local «${id}» dice ${l.formato} y su espacio es del ${formato}`);
    const local = {
      id, nombre: texto(l.nombre) ? l.nombre.trim() : '', direccion: texto(l.direccion) ? l.direccion.trim() : '',
      ciudad: texto(l.ciudad) ? l.ciudad.trim() : '', coords: coordsValidas(l.coords) ? l.coords.slice(0, 2) : null,
      tourOrder: Number.isFinite(l.tourOrder) ? l.tourOrder : null, formato, espacio: m[0], mapa: null,
    };
    local.mapa = urlSegura(l.mapa) ? l.mapa : enlaceMapa(local, circuito);
    locales.push(local);
  });
  // Orden de tour; sin tourOrder, al final y en el orden del índice.
  const orden = l => (l.tourOrder == null ? Infinity : l.tourOrder);
  locales.sort((a, b) => orden(a) - orden(b));
  return {
    circuito, cliente: (d && texto(d.cliente) && d.cliente) || 'Altadis', marca: (d && texto(d.marca) && d.marca) || 'altadis',
    nombre: d && d.nombre, version: d && d.version, respaldo: Boolean(d && d.respaldo), locales, avisos,
  };
}

/** Errores que impiden usar el índice (con ellos se prueba el respaldo). */
export function validarCircuito(d) {
  if (!d || typeof d !== 'object') return ['El índice del circuito no es un objeto JSON'];
  const errores = [];
  if (d.schema !== SCHEMA_CIRCUITO) errores.push(`Esquema «${d.schema}»: se esperaba ${SCHEMA_CIRCUITO}`);
  if (d.circuito !== CIRCUITO) errores.push(`Circuito «${d.circuito}»: se esperaba ${CIRCUITO}`);
  if (!errores.length && !normalizarCircuito(d).locales.length) errores.push('El circuito no trae locales que abran un Xtanco');
  return errores;
}

export const fuentesCircuito = () => [
  { fuente: 'compartido', url: CIRCUITO_COMPARTIDO, timeoutMs: ESPERA_COMPARTIDO_MS },
  { fuente: 'local', url: CIRCUITO_LOCAL },
];

/**
 * El índice del circuito: el real de admira.biz y, si da 404, HTML, plazo o no valida, el
 * respaldo de este sitio. Sin `memoria`: que el índice aún no exista no debe marcar admira.biz
 * como caído para los planos. → { circuito, fuente, url, fallos, respaldo }
 */
export async function cargarCircuito(opts = {}) {
  const r = await cargarConRespaldo(fuentesCircuito(), { ...opts, memoria: null, validar: validarCircuito });
  const circuito = normalizarCircuito(r.datos);
  return { ...r, circuito, respaldo: r.fuente === 'local' };
}

// ── Locales ─────────────────────────────────────────────────────────────────
/**
 * El local de ?loc=. Con el índice real, sólo por id. Con el respaldo (`flexible`), si el id no
 * está tal cual, el de la ciudad que acaba el id («altadis-es-05-madrid» → Madrid): el mapa usa
 * los ids reales y el respaldo no los conoce. Desconocido → null (se ignora sin error).
 */
export function buscarLocal(circuito, loc, { flexible = false } = {}) {
  const locales = circuito && Array.isArray(circuito.locales) ? circuito.locales : [];
  if (!loc) return null;
  const exacto = locales.find(l => l.id === loc);
  if (exacto || !flexible) return exacto || null;
  const s = slug(loc);
  return locales.find(l => {
    const c = slug(l.ciudad);
    if (!c) return false;
    const corta = c.replace(/^(a|la|el|les|l|o)-/, '');
    return s === c || s.endsWith(`-${c}`) || s.endsWith(`-${corta}`);
  }) || null;
}

/** El primer local del circuito con ese espacio (para ?circuito=&espacio= sin loc). */
export const localDeEspacio = (circuito, espacio) => (circuito && circuito.locales || []).find(l => l.espacio === espacio) || null;

/** El local anterior o siguiente en orden de tour, con vuelta. Fuera del circuito: el primero (o el último hacia atrás). */
export function vecinoLocal(circuito, locId, paso = 1) {
  const lista = circuito && Array.isArray(circuito.locales) ? circuito.locales : [];
  if (!lista.length) return null;
  const i = lista.findIndex(l => l.id === locId);
  if (i < 0) return paso < 0 ? lista[lista.length - 1] : lista[0];
  return lista[((i + paso) % lista.length + lista.length) % lista.length];
}

/**
 * Con qué arranca la página en modo circuito. `pedido`: { loc, espacio } de la URL.
 * - Con loc conocido y sin espacio: el espacio del local.
 * - Con loc y espacio: manda el espacio de la URL (viene del mapa, que lee el índice real) y el
 *   local se corrige a ese espacio (`corregido`) para que el recorrido lo respete.
 * - Con el respaldo, un local encontrado por su ciudad toma el id de la URL (el real del mapa).
 * - Sin loc (?circuito=) y con espacio: el local de ese espacio, si lo hay.
 * Sólo Xtancos: un espacio de Starbucks en la URL no entra en el circuito.
 * → { local, espacio, corregido, origen } (origen: id del local en el índice, para sustituirlo)
 */
export function resolverInicio(circuito, { loc = null, espacio = null } = {}, { flexible = false } = {}) {
  const m = ESPACIO_RE.exec(espacio || '');
  const xtanco = m && m[1] === 'xtanco' ? m : null;
  const hallado = buscarLocal(circuito, loc, { flexible });
  if (!hallado) {
    const local = xtanco ? localDeEspacio(circuito, xtanco[0]) : null;
    return { local, espacio: xtanco ? xtanco[0] : null, corregido: false, origen: local && local.id };
  }
  let local = hallado, corregido = false;
  if (local.id !== loc) { local = { ...local, id: loc }; corregido = true; }
  if (xtanco && local.espacio !== xtanco[0]) { local = { ...local, espacio: xtanco[0], formato: `cliente-${xtanco[2]}` }; corregido = true; }
  return { local, espacio: local.espacio, corregido, origen: hallado.id };
}

// ── Textos del local (ES/EN) ────────────────────────────────────────────────
/**
 * «Estanco <nombre> · <ciudad>». Si el nombre ya empieza por «Estanco» no se repite, y la ciudad
 * no se repite si el nombre ya la dice («Estanco de Madrid»). Sin nombre: «Estanco de <ciudad>».
 */
export function tituloLocal(local, en = false) {
  if (!local) return '';
  const ciudad = local.ciudad || '';
  let base = local.nombre || (en ? `${ciudad} tobacconist` : `Estanco de ${ciudad}`);
  if (!/^(estanco|tobacconist)\b/i.test(base) && !/\btobacconist$/i.test(base)) base = en ? `Tobacconist ${base}` : `Estanco ${base}`;
  return ciudad && !slug(base).includes(slug(ciudad)) ? `${base} · ${ciudad}` : base;
}

/** Formato del espacio de un local: cliente-NN (o null). */
export const formatoDeLocal = local => {
  const m = ESPACIO_RE.exec(local && local.espacio || '');
  return m && FORMATO_RE.test(`cliente-${m[2]}`) ? `cliente-${m[2]}` : null;
};
