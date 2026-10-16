// Circuitos de demo del 16-oct-2026: 10 locales reales en 10 ciudades, cada uno con un formato de
// pantalla de los 18, y la ficha de cada local en el mapa de admira.biz abre su gemelo.
// - «Altadis España · 10 Xtancos» (altadis_espana; misión DCL-a6cb621be0ce5932f50960de, tarea b):
//   ?espacio=altadis-xtanco-NN&loc=altadis-es-NN-<ciudad>&marca=altadis.
// - «Starbucks México · 10 cafeterías» (alsea_mexico; misión DCL-97f84ae3e5b2cb2311c55101):
//   ?espacio=altadis-cafe-NN&loc=alsea-mx-sbux-NN-<ciudad>&marca=starbucks.
//
// Lógica pura, sin DOM: registro de circuitos, lectura de ?loc= / ?circuito= / ?marca=, índice del
// circuito con su respaldo, orden del recorrido y textos del local. La usan visor.mjs y los tests.
//
// Contrato del índice (lo publica el equipo de admira.biz; CORS abierto), igual en los dos:
//   https://www.admira.biz/data/xpacios/<altadis-espana-10|alsea-mexico-10>.json
//   {"schema":"admira.circuito-demo/1","circuito":"<id>","cliente":"…","marca":"altadis|starbucks",
//    "locales":[{"id","nombre","direccion","ciudad","coords":[lng,lat],"tourOrder","formato":"cliente-NN",
//                "espacio":"altadis-<xtanco|cafe>-NN","mapa":"<enlace al mapa centrado en el local>"}]}
// Si no responde (404, plazo, no valida), el respaldo es la copia de planos/ (mismos ids, nombres,
// direcciones y enlaces). En cada carga se prueba primero el real.

import { cargarConRespaldo, ESPACIO_RE, FORMATO_RE, ESPERA_COMPARTIDO_MS, TIPOS } from './espacios.mjs?v=a18-7';

export const SCHEMA_CIRCUITO = 'admira.circuito-demo/1';
const DATOS_BIZ = 'https://www.admira.biz/data/xpacios/';
const PLANOS = '/xpacios/altadis-18/planos/';
/**
 * Registro de circuitos: id → índice compartido (admira.biz) + respaldo local + marca + tipo de
 * espacio que abren sus locales + prefijo de sus ids (para elegir el circuito por ?loc=). Los
 * textos van aparte (TEXTOS_CIRCUITO). `rotulo`: el nombre en los títulos; sin él, el cliente
 * del índice (Altadis, como siempre).
 */
export const CIRCUITOS = Object.freeze({
  altadis_espana: Object.freeze({ id: 'altadis_espana', compartido: `${DATOS_BIZ}altadis-espana-10.json`, local: `${PLANOS}altadis-espana-10.json`,
    marca: 'altadis', tipo: 'xtanco', prefijo: 'altadis-es-', cliente: 'Altadis' }),
  alsea_mexico: Object.freeze({ id: 'alsea_mexico', compartido: `${DATOS_BIZ}alsea-mexico-10.json`, local: `${PLANOS}alsea-mexico-10.json`,
    marca: 'starbucks', tipo: 'cafe', prefijo: 'alsea-mx-', cliente: 'Starbucks (Alsea)', rotulo: 'Starbucks' }),
});
// El de siempre: un ?loc= sin prefijo conocido sigue buscándose aquí (como antes del registro).
export const CIRCUITO = 'altadis_espana';
export const CIRCUITO_COMPARTIDO = CIRCUITOS[CIRCUITO].compartido;
export const CIRCUITO_LOCAL = CIRCUITOS[CIRCUITO].local;
/** El circuito registrado con ese id, o null. */
export const defCircuito = id => (typeof id === 'string' && Object.hasOwn(CIRCUITOS, id) ? CIRCUITOS[id] : null);
/** El circuito de un id de local por su prefijo («alsea-mx-…» → alsea_mexico), o null. */
export const circuitoDeLoc = loc => (typeof loc === 'string' && Object.values(CIRCUITOS).find(c => loc.startsWith(c.prefijo))?.id) || null;
// El mapa de admira.biz: el mismo enlace que publica el índice real, ?circuit=&loc=&marca=.
export const MAPA_BASE = 'https://www.admira.biz/';
// «Volver al mapa» sólo lleva a admira.biz: un enlace del índice a otro dominio no se usa.
export const MAPA_RE = /^https:\/\/www\.admira\.biz\/[^\s"'<>]*$/;
// Con la marca de un cliente, el tipo de espacio que se enseña por defecto. Altadis: estancos.
export const TIPO_DE_MARCA = { altadis: 'xtanco' };
// Cómo se llama el espacio de cada tipo en los avisos (y en la ficha).
const NOMBRE_TIPO = { xtanco: 'Xtanco', cafe: 'Starbucks' };

const LOC_RE = /^[a-z0-9][a-z0-9_-]{0,80}$/i;
const texto = v => typeof v === 'string' && v.trim().length > 0;
const mapaValido = u => typeof u === 'string' && MAPA_RE.test(u);
const coordsValidas = c => Array.isArray(c) && c.length >= 2 && c.slice(0, 2).every(n => typeof n === 'number' && Number.isFinite(n))
  && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
/** Minúsculas, sin tildes y con guiones: «A Coruña» → «a-coruna». */
export const slug = v => String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── URL ─────────────────────────────────────────────────────────────────────
/**
 * Lo que la URL pide del circuito: ?loc=<id> (un local del mapa) y ?circuito=<id del registro>.
 * El circuito (`id`) lo elige el prefijo del loc («altadis-es-», «alsea-mx-»); si no, el
 * ?circuito= de la URL; si sólo hay un loc sin prefijo conocido, Altadis España, como antes.
 * `circuito`: la URL nombra el circuito elegido. `pide`: hay que leer su índice. Un loc mal
 * formado o un circuito que no está en el registro no cuentan.
 */
export function circuitoDesdeURL(search = '') {
  const p = new URLSearchParams(search);
  const loc = LOC_RE.test(p.get('loc') || '') ? p.get('loc') : null;
  const nombrado = defCircuito(p.get('circuito'))?.id || null;
  const id = circuitoDeLoc(loc) || nombrado || (loc ? CIRCUITO : null);
  const circuito = Boolean(nombrado) && nombrado === id;
  return { loc, circuito, pide: Boolean(loc) || circuito, id };
}

/** La marca blanca pedida (?marca=), en minúsculas; «alsea» es Starbucks, como en el shell. */
export function marcaDesdeURL(search = '') {
  const v = slug(new URLSearchParams(search).get('marca') || '');
  return v === 'alsea' ? 'starbucks' : v || null;
}

/**
 * Tipo de espacio con el que arranca la página: el del espacio pedido, si no ?tipo=, si no el del
 * circuito que la URL nombra (por el prefijo del loc o por ?circuito=: Starbucks México → cafe),
 * si no el de la marca (Altadis → Xtanco), si no Xtanco, como siempre.
 */
export function tipoInicial(search = '') {
  const p = new URLSearchParams(search);
  const m = ESPACIO_RE.exec(p.get('espacio') || '');
  if (m) return m[1];
  if (TIPOS.includes(p.get('tipo'))) return p.get('tipo');
  const c = defCircuito(circuitoDeLoc(p.get('loc')) || p.get('circuito'));
  if (c) return c.tipo;
  return TIPO_DE_MARCA[marcaDesdeURL(search)] || 'xtanco';
}

// ── Índice del circuito ─────────────────────────────────────────────────────
/** Enlace al mapa de admira.biz con el circuito, el local y la marca (la del circuito), como el del índice real. */
export function enlaceMapa(local, circuito = CIRCUITO, marca = defCircuito(circuito)?.marca || 'altadis') {
  const p = new URLSearchParams({ circuit: circuito });
  if (local && texto(local.id)) p.set('loc', local.id);
  if (marca) p.set('marca', marca);
  return `${MAPA_BASE}?${p}`;
}

/**
 * Locales utilizables del índice, en orden de tour. Se descarta (con su aviso) el que no tiene
 * id, el repetido y el que no abre el tipo de su circuito (Altadis España: un Xtanco,
 * altadis-xtanco-NN; Starbucks México: un Starbucks, altadis-cafe-NN). El formato sale del
 * espacio, que es lo que se abre; el mapa, del índice si es de https://www.admira.biz/ y, si no,
 * el enlace al mapa de ese local (?circuit=&loc=&marca=). El circuito es el que dice el índice
 * si está en el registro; si no, `id` (por defecto, Altadis España).
 */
export function normalizarCircuito(d, id = CIRCUITO) {
  const avisos = [], locales = [], ids = new Set();
  const lista = d && Array.isArray(d.locales) ? d.locales : [];
  const def = defCircuito(d && d.circuito) || defCircuito(id) || CIRCUITOS[CIRCUITO];
  const circuito = (d && texto(d.circuito) && d.circuito) || def.id;
  const marca = (d && texto(d.marca) && d.marca) || def.marca;
  const tipo = def.tipo, nombreTipo = NOMBRE_TIPO[tipo];
  lista.forEach((l, i) => {
    const id = l && l.id;
    if (!texto(id) || !LOC_RE.test(id)) { avisos.push(`Local ${i + 1} sin id válido`); return; }
    if (ids.has(id)) { avisos.push(`Local repetido: «${id}»`); return; }
    const m = ESPACIO_RE.exec(String(l.espacio || ''));
    if (!m || m[1] !== tipo) { avisos.push(`El local «${id}» no abre un ${nombreTipo}: «${l.espacio}»`); return; }
    ids.add(id);
    const formato = `cliente-${m[2]}`;
    if (l.formato && l.formato !== formato) avisos.push(`El local «${id}» dice ${l.formato} y su espacio es del ${formato}`);
    const local = {
      id, nombre: texto(l.nombre) ? l.nombre.trim() : '', direccion: texto(l.direccion) ? l.direccion.trim() : '',
      ciudad: texto(l.ciudad) ? l.ciudad.trim() : '', coords: coordsValidas(l.coords) ? l.coords.slice(0, 2) : null,
      tourOrder: Number.isFinite(l.tourOrder) ? l.tourOrder : null, formato, espacio: m[0], mapa: null,
    };
    local.mapa = mapaValido(l.mapa) ? l.mapa : enlaceMapa(local, circuito, marca);
    locales.push(local);
  });
  // Orden de tour; sin tourOrder, al final y en el orden del índice.
  const orden = l => (l.tourOrder == null ? Infinity : l.tourOrder);
  locales.sort((a, b) => orden(a) - orden(b));
  const cliente = (d && texto(d.cliente) && d.cliente) || def.cliente;
  return {
    circuito, cliente, marca, tipo, rotulo: def.rotulo || cliente,
    nombre: d && d.nombre, version: d && d.version, respaldo: Boolean(d && d.respaldo), locales, avisos,
  };
}

/** Errores que impiden usar el índice del circuito `id` (con ellos se prueba el respaldo). */
export function validarCircuito(d, id = CIRCUITO) {
  if (!d || typeof d !== 'object') return ['El índice del circuito no es un objeto JSON'];
  const errores = [], def = defCircuito(id) || CIRCUITOS[CIRCUITO];
  if (d.schema !== SCHEMA_CIRCUITO) errores.push(`Esquema «${d.schema}»: se esperaba ${SCHEMA_CIRCUITO}`);
  if (d.circuito !== def.id) errores.push(`Circuito «${d.circuito}»: se esperaba ${def.id}`);
  if (!errores.length && !normalizarCircuito(d, def.id).locales.length) errores.push(`El circuito no trae locales que abran un ${NOMBRE_TIPO[def.tipo]}`);
  return errores;
}

/** Fuentes del índice de un circuito: la de admira.biz y su respaldo. Fuera del registro, ninguna. */
export const fuentesCircuito = (id = CIRCUITO) => {
  const def = defCircuito(id);
  return def ? [
    { fuente: 'compartido', url: def.compartido, timeoutMs: ESPERA_COMPARTIDO_MS },
    { fuente: 'local', url: def.local },
  ] : [];
};

/**
 * El índice del circuito `opts.circuito` (por defecto Altadis España): el real de admira.biz y,
 * si da 404, HTML, plazo o no valida, el respaldo de este sitio. Sin `memoria`: que el índice aún
 * no exista no debe marcar admira.biz como caído para los planos.
 * → { circuito, fuente, url, fallos, respaldo }
 */
export async function cargarCircuito({ circuito: id = CIRCUITO, ...opts } = {}) {
  if (!defCircuito(id)) throw new Error(`Circuito desconocido: «${id}»`);
  const r = await cargarConRespaldo(fuentesCircuito(id), { ...opts, memoria: null, validar: d => validarCircuito(d, id) });
  const circuito = normalizarCircuito(r.datos, id);
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
 * Sólo el tipo del circuito (Altadis España: Xtancos; Starbucks México: Starbucks): un espacio
 * de otro tipo en la URL no entra en el circuito.
 * → { local, espacio, corregido, origen } (origen: id del local en el índice, para sustituirlo)
 */
export function resolverInicio(circuito, { loc = null, espacio = null } = {}, { flexible = false } = {}) {
  const m = ESPACIO_RE.exec(espacio || '');
  const tipo = (circuito && circuito.tipo) || CIRCUITOS[CIRCUITO].tipo;
  const xtanco = m && m[1] === tipo ? m : null;   // el espacio de la URL, si es del tipo del circuito
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
// Otras formas de decir la ciudad en un nombre propio: «Starbucks CDMX · Madero» ya dice Ciudad de México.
const ALIAS_CIUDAD = { 'ciudad-de-mexico': ['cdmx'] };
const diceCiudad = (nombre, ciudad) => {
  const n = `-${slug(nombre)}-`, c = slug(ciudad);
  return n.includes(c) || (ALIAS_CIUDAD[c] || []).some(a => n.includes(`-${a}-`));
};

/**
 * Nombre del local para la ficha: el nombre real del índice TAL CUAL (en los dos idiomas: es un
 * nombre propio, «Estanc Gran de Gràcia 61», «Starbucks Querétaro · Constituyentes») seguido de
 * « · <ciudad>» si no la dice ya (tampoco con otra forma: «CDMX»). Sólo sin nombre propio se usa
 * el genérico: «Estanco de <ciudad>» / «Tobacconist in <ciudad>» en un Xtanco, «Starbucks
 * <ciudad>» en una cafetería. `ciudad:false` lo da sin la ciudad (la galería la pone aparte).
 */
export function tituloLocal(local, en = false, { ciudad: conCiudad = true } = {}) {
  if (!local) return '';
  const ciudad = local.ciudad || '';
  if (!local.nombre) {
    if ((ESPACIO_RE.exec(local.espacio || '') || [])[1] === 'cafe') return ciudad ? `Starbucks ${ciudad}` : 'Starbucks';
    return ciudad ? (en ? `Tobacconist in ${ciudad}` : `Estanco de ${ciudad}`) : (en ? 'Tobacconist' : 'Estanco');
  }
  return conCiudad && ciudad && !diceCiudad(local.nombre, ciudad) ? `${local.nombre} · ${ciudad}` : local.nombre;
}

/**
 * Textos del modo circuito [es, en], según el circuito (normalizado) y su número de locales:
 * cabecera de la galería (eyebrow, h1, lead2), su línea de resumen (titulo) y el antetítulo de
 * la ficha del local (`ficha(n.º en el tour)`). Altadis España, los de siempre con el cliente del
 * índice; Starbucks México, «Starbucks México · 10 cafeterías».
 */
export function textosCircuito(circuito) {
  const n = circuito && Array.isArray(circuito.locales) ? circuito.locales.length : 0;
  const nn = String(n).padStart(2, '0'), dos = i => String(i).padStart(2, '0');
  if (circuito && circuito.tipo === 'cafe') {
    const r = circuito.rotulo || 'Starbucks', R = r.toUpperCase();
    return {
      eyebrow: [`${R} MÉXICO · CIRCUITO · GEMELOS 3D`, `${R} MEXICO · CIRCUIT · 3D TWINS`],
      h1: [`${r} México · ${n} cafeterías`, `${r} Mexico · ${n} cafés`],
      lead2: [`${n} cafeterías en ${n} ciudades, cada una con un formato de pantalla y su contenido. Elige una para verla en 3D; ← y → las recorren en el orden del circuito.`,
        `${n} cafés in ${n} cities, each one with a screen format and its content. Pick one to see it in 3D; ← and → follow the circuit order.`],
      titulo: [`${n} cafeterías · ${n} ciudades · un formato de pantalla en cada una`, `${n} cafés · ${n} cities · one screen format in each`],
      marca: R,
      ficha: i => [`${R} MÉXICO · CAFETERÍA ${dos(i)}/${nn}`, `${R} MEXICO · CAFÉ ${dos(i)}/${nn}`],
    };
  }
  const c = (circuito && (circuito.rotulo || circuito.cliente)) || 'Altadis', C = c.toUpperCase();
  return {
    eyebrow: [`${C} ESPAÑA · CIRCUITO · GEMELOS 3D`, `${C} SPAIN · CIRCUIT · 3D TWINS`],
    h1: [`${c} España · ${n} Xtancos`, `${c} Spain · ${n} Xtancos`],
    lead2: [`${n} estancos en ${n} ciudades, cada uno con un formato de pantalla de ${c} y su contenido. Elige uno para verlo en 3D; ← y → los recorren en el orden del circuito.`,
      `${n} tobacconists in ${n} cities, each one with a ${c} screen format and its content. Pick one to see it in 3D; ← and → follow the circuit order.`],
    titulo: [`${n} estancos · ${n} ciudades · un formato de Altadis en cada uno`, `${n} tobacconists · ${n} cities · one Altadis format in each`],
    marca: 'ALTADIS',
    ficha: i => [`${C} ESPAÑA · ESTANCO ${dos(i)}/${nn}`, `${C} SPAIN · TOBACCONIST ${dos(i)}/${nn}`],
  };
}

/** Formato del espacio de un local: cliente-NN (o null). */
export const formatoDeLocal = local => {
  const m = ESPACIO_RE.exec(local && local.espacio || '');
  return m && FORMATO_RE.test(`cliente-${m[2]}`) ? `cliente-${m[2]}` : null;
};
