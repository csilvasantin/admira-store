// Los 18 espacios Altadis: un espacio tipo por formato de pantalla, en estanco (Xtanco) y en
// cafetería (Starbucks), para la demo a Alsea / Starbucks del 16-oct-2026 (misión
// DCL-d7966deb02734a6f34beb54e, tarea c).
//
// Lógica pura, sin DOM ni three.js: índice de formatos, planos de cada espacio, manifiesto de
// contenido, fuentes con respaldo y enlaces. La usan visor.mjs y los tests.
//
// Contratos (fijados con los otros dos equipos):
// - Índice admira.espacios-formato/1 en admira.biz (/data/xpacios/altadis-18.json): 18
//   formatos cliente-01…18, cada uno con su lienzo ancho × alto, rejilla, nº de pantallas,
//   uso, zona y los ids de sus dos espacios (altadis-xtanco-NN y altadis-cafe-NN).
// - Cada espacio es un plano admira.xpacio-plano/1 normal (el del laboratorio) con
//   `formato` y `espacio` arriba y, en cada pantalla del formato, `lienzo`, `recorte`,
//   `resolucion`, `tecnologia` y `grupo` si hay más de una.
// - Contenido admira.espacios-contenido/1 en stock.admira.store: un MP4 por formato e idioma.
// Primero el compartido y, si no responde o no valida, la copia de este sitio (planos/),
// como hace el laboratorio. La copia es el respaldo del día de la presentación.

import { validatePlan } from '../gran-de-gracia-51/plano3d.mjs?v=gdg51-6';
import { CAMPOS_PRIVADOS } from '../plano-publico.mjs';
import { erroresRecorte, lienzoValido, coberturaLienzo } from './recorte.mjs?v=a18-6';

export const SCHEMA_INDICE = 'admira.espacios-formato/1';
export const SCHEMA_CONTENIDO = 'admira.espacios-contenido/1';
export const SERIE = 'altadis-18';
export const TIPOS = ['xtanco', 'cafe'];
export const FORMATO_RE = /^cliente-(\d{2})$/;
export const ESPACIO_RE = /^altadis-(xtanco|cafe)-(\d{2})$/;
export const ZONAS = ['mostrador', 'mural', 'columna', 'superstretch', 'cubo'];
export const TEMA_DE_TIPO = { xtanco: 'estanco', cafe: 'cafeteria' };

export const INDICE_COMPARTIDO = 'https://www.admira.biz/data/xpacios/altadis-18.json';
export const INDICE_LOCAL = '/xpacios/altadis-18/planos/altadis-18.json';
export const PLANO_COMPARTIDO = id => `https://www.admira.biz/data/xpacios/${id}.json`;
export const PLANO_LOCAL = id => `/xpacios/altadis-18/planos/${id}.json`;
export const MANIFIESTO = 'https://stock.admira.store/espacios/altadis-18/v1/manifest.json';
// Los Xtanco enseñan contenido de Altadis (Carlos, 15-oct): su propio manifiesto, con el de siempre
// (Starbucks) de respaldo si aún no existe o falla. Los Starbucks, el de siempre.
export const MANIFIESTO_XTANCO = 'https://stock.admira.store/espacios/altadis-18/v1/manifest-xtanco.json';
export const STUDIO = formato => `https://admira.studio/adaptaciones/?formato=${encodeURIComponent(formato)}`;
export const ARQUITECTO = (formato, tipo) => `https://www.admira.biz/arquitecto.html?formato=${encodeURIComponent(formato)}&tipo=${encodeURIComponent(tipo)}`;
export const RECORRIDO_MS = 12000;      // cada espacio, desde que su contenido pinta
export const RECORRIDO_MAX_MS = 20000;  // tope si el vídeo no llega

const num = v => typeof v === 'number' && Number.isFinite(v);
const entero = v => Number.isInteger(v);
const pos = v => entero(v) && v > 0;
const texto = v => typeof v === 'string' && v.trim().length > 0;
export const dos = n => String(n).padStart(2, '0');
export const idEspacio = (tipo, n) => `altadis-${tipo}-${dos(n)}`;

// ── Índice de formatos ──────────────────────────────────────────────────────
// Errores: el visor no puede montar la galería. Avisos: la monta, pero algo no cuadra.
export function validarIndice(indice) {
  const errores = [], avisos = [];
  if (!indice || typeof indice !== 'object') return { errores: ['El índice no es un objeto JSON'], avisos };
  if (indice.schema !== SCHEMA_INDICE) errores.push(`Esquema «${indice.schema}»: se esperaba ${SCHEMA_INDICE}`);
  for (const t of TIPOS) if (!indice.tipos || !indice.tipos[t]) errores.push(`Falta el tipo «${t}» en el índice`);
  const formatos = Array.isArray(indice.formatos) ? indice.formatos : [];
  if (!formatos.length) errores.push('El índice no trae formatos');
  else if (formatos.length !== 18) avisos.push(`El índice trae ${formatos.length} formatos; se esperaban 18`);
  const ids = new Set(), ns = new Set(), espacios = new Set();
  for (const f of formatos) {
    const id = f && f.formato;
    if (!FORMATO_RE.test(String(id || ''))) { errores.push(`Formato sin id cliente-NN: «${id}»`); continue; }
    if (ids.has(id)) errores.push(`Formato repetido: «${id}»`);
    ids.add(id);
    if (!pos(f.n) || ns.has(f.n)) errores.push(`El formato «${id}» necesita un n único`);
    ns.add(f.n);
    if (!texto(f.nombre)) errores.push(`El formato «${id}» necesita nombre`);
    if (!pos(f.ancho) || !pos(f.alto)) errores.push(`El formato «${id}» necesita ancho y alto en píxeles`);
    if (!f.grid || !pos(f.grid.cols) || !pos(f.grid.rows)) errores.push(`El formato «${id}» necesita rejilla cols × rows`);
    if (!pos(f.pantallas)) errores.push(`El formato «${id}» necesita el número de pantallas`);
    if (f.zona && !ZONAS.includes(f.zona)) avisos.push(`Zona desconocida en «${id}»: «${f.zona}»`);
    for (const t of TIPOS) {
      const e = f.espacios && f.espacios[t];
      const m = ESPACIO_RE.exec(String(e || ''));
      if (!m || m[1] !== t) errores.push(`El formato «${id}» necesita su espacio ${t} (altadis-${t}-NN)`);
      else if (espacios.has(e)) errores.push(`Espacio repetido: «${e}»`);
      espacios.add(e);
    }
  }
  return { errores, avisos };
}

export const formatoDe = (indice, id) => (indice && Array.isArray(indice.formatos) ? indice.formatos.find(f => f.formato === id) : null) || null;
export const formatosOrdenados = indice => [...(indice && indice.formatos || [])].sort((a, b) => a.n - b.n);

// ── Plano de un espacio ─────────────────────────────────────────────────────
/** Las pantallas del formato dentro del plano (el plano puede traer más: un TPV, una tele…). */
export function pantallasDelFormato(plan) {
  const ps = Array.isArray(plan && plan.pantallas) ? plan.pantallas : [];
  const id = plan && plan.formato && plan.formato.id;
  const suyas = id ? ps.filter(s => s.formato === id) : [];
  return suyas.length ? suyas : ps.filter(s => s.recorte);
}

/**
 * Comprueba un plano de espacio: el del laboratorio (validatePlan) más lo propio del
 * formato. `formato`, si se da, es la entrada del índice y el plano tiene que ser el suyo.
 */
export function validarPlanoEspacio(plan, formato = null) {
  const { errores, avisos } = validatePlan(plan);
  if (!plan || typeof plan !== 'object') return { errores, avisos };
  const f = plan.formato || {};
  if (!FORMATO_RE.test(String(f.id || ''))) errores.push(`El plano no dice su formato (formato.id cliente-NN): «${f.id}»`);
  if (!pos(f.ancho) || !pos(f.alto)) errores.push('El formato del plano necesita ancho y alto en píxeles');
  const e = plan.espacio || {};
  if (e.serie !== SERIE) errores.push(`El plano no es de la serie ${SERIE}: «${e.serie}»`);
  if (!TIPOS.includes(e.tipo)) errores.push(`Tipo de espacio desconocido: «${e.tipo}»`);
  if (formato) {
    if (f.id !== formato.formato) errores.push(`Es el plano del formato «${f.id}», no de «${formato.formato}»`);
    if (pos(f.ancho) && (f.ancho !== formato.ancho || f.alto !== formato.alto)) avisos.push(`El plano dice ${f.ancho}×${f.alto} y el índice ${formato.ancho}×${formato.alto}`);
  }
  const ps = pantallasDelFormato(plan);
  if (!ps.length) errores.push('El plano no tiene pantallas del formato');
  const lienzo = [f.ancho, f.alto];
  const grupos = new Set();
  for (const s of ps) {
    const L = lienzoValido(s.lienzo) ? s.lienzo : lienzo;
    if (s.lienzo && !lienzoValido(s.lienzo)) errores.push(`La pantalla «${s.id}» trae un lienzo no válido`);
    if (lienzoValido(s.lienzo) && (s.lienzo[0] !== f.ancho || s.lienzo[1] !== f.alto)) avisos.push(`La pantalla «${s.id}» dice lienzo ${s.lienzo.join('×')} y el formato ${f.ancho}×${f.alto}`);
    if (s.recorte) for (const err of erroresRecorte(s.recorte, L)) errores.push(`Pantalla «${s.id}»: ${err}`);
    else if (ps.length > 1) errores.push(`La pantalla «${s.id}» necesita su recorte: el formato tiene ${ps.length} pantallas`);
    if (s.tecnologia && !['lcd', 'led'].includes(s.tecnologia)) avisos.push(`Tecnología desconocida en «${s.id}»: «${s.tecnologia}»`);
    if (s.recorte && Array.isArray(s.resolucion) && (s.resolucion[0] !== s.recorte.w || s.resolucion[1] !== s.recorte.h)) avisos.push(`La pantalla «${s.id}» dice resolución ${s.resolucion.join('×')} y su recorte es ${s.recorte.w}×${s.recorte.h}`);
    if (s.forma === 'cubo-4-caras' && !s.cubo && s.recorte && s.recorte.w % 4) avisos.push(`El cubo «${s.id}» tiene ${s.recorte.w} px de ancho: no se parte en 4 caras iguales`);
    if (s.forma && s.forma !== 'cubo-4-caras') avisos.push(`Forma desconocida en «${s.id}»: «${s.forma}»`);
    if (s.grupo) grupos.add(s.grupo);
  }
  if (ps.length > 1 && (grupos.size !== 1 || ps.some(s => !s.grupo))) avisos.push('Las pantallas del formato deberían compartir un mismo grupo');
  if (formato && formato.pantallas && ps.length !== formato.pantallas) avisos.push(`El índice dice ${formato.pantallas} pantallas y el plano trae ${ps.length}`);
  // Cobertura del lienzo: el cubo cubre lo de sus caras (su `recorte` es sólo la que da a la sala).
  const trozos = s => (s.forma === 'cubo-4-caras' && Array.isArray(s.cubo?.caras) && s.cubo.caras.every(c => c && c.recorte) ? s.cubo.caras.map(c => c.recorte) : [s.recorte]);
  if (!errores.length && ps.every(s => s.recorte)) avisos.push(...coberturaLienzo(ps.flatMap(trozos), lienzo).avisos);
  return { errores, avisos };
}

/**
 * Lo que este sitio enseña de un plano de espacio: es un espacio tipo, sin inventario real,
 * pero se quitan igualmente los campos del ITIL (los de plano-publico.mjs) por si el
 * compartido los trajera. A diferencia de planoPublico, conserva formato, recorte, lienzo,
 * tecnología, forma y grupo, que es lo que el visor necesita.
 */
export function planoEspacioPublico(plan) {
  if (!plan || typeof plan !== 'object') return plan;
  const limpio = o => { if (!o || typeof o !== 'object') return o; const c = { ...o }; for (const k of CAMPOS_PRIVADOS) delete c[k]; return c; };
  const out = limpio(plan);
  for (const k of ['pantallas', 'dispositivos', 'mobiliario']) if (Array.isArray(plan[k])) out[k] = plan[k].map(limpio);
  return out;
}

// ── Fuentes con respaldo ────────────────────────────────────────────────────
// admira.biz tiene poco margen (2,5 s): si no contesta, la copia local está al lado.
export const ESPERA_COMPARTIDO_MS = 2500;
export const fuentesIndice = () => [{ fuente: 'compartido', url: INDICE_COMPARTIDO, timeoutMs: ESPERA_COMPARTIDO_MS }, { fuente: 'local', url: INDICE_LOCAL }];
export const fuentesPlano = id => [{ fuente: 'compartido', url: PLANO_COMPARTIDO(id), timeoutMs: ESPERA_COMPARTIDO_MS }, { fuente: 'local', url: PLANO_LOCAL(id) }];

/**
 * Prueba las fuentes por orden y devuelve la primera que responde JSON válido. `validar`
 * devuelve la lista de errores del dato (vacía si vale). Un 404 de Pages llega como HTML:
 * eso también es «no hay dato». Si ninguna sirve, lanza con todos los motivos.
 * `memoria` (un Set de nombres de fuente): una fuente que no respondió (red, plazo, HTTP o
 * HTML) se apunta y en lo que queda de sesión se salta; así un admira.biz caído no hace
 * esperar en cada espacio. Un dato que llega pero no valida no la apunta (es de ese plano).
 */
export async function cargarConRespaldo(fuentes, { fetchImpl = globalThis.fetch, timeoutMs = 6000, validar = () => [], memoria = null } = {}) {
  const fallos = [];
  for (const { fuente, url, timeoutMs: propio } of fuentes) {
    if (memoria && memoria.has(fuente)) { fallos.push({ fuente, url, error: 'no respondió antes en esta sesión', recordado: true }); continue; }
    const espera = propio || timeoutMs;
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), espera) : null;
    let llego = false;
    try {
      // no-store: sin petición condicional (admira.biz llegó a contestar 404 a If-None-Match).
      const r = await fetchImpl(url, { cache: 'no-store', credentials: fuente === 'local' ? 'same-origin' : 'omit', ...(ac ? { signal: ac.signal } : {}) });
      if (!r || !r.ok) throw new Error(`HTTP ${r ? r.status : '¿?'}`);
      const tipo = (r.headers && typeof r.headers.get === 'function' && r.headers.get('content-type')) || '';
      if (/text\/html/i.test(tipo)) throw new Error('responde HTML: no está publicado');
      const datos = await r.json();
      llego = true;
      const errores = validar(datos) || [];
      if (errores.length) throw new Error(`no válido: ${errores[0]}`);
      return { datos, fuente, url, fallos };
    } catch (e) {
      fallos.push({ fuente, url, error: e && e.name === 'AbortError' ? `sin respuesta en ${espera / 1000} s` : String(e && e.message || e) });
      if (memoria && !llego && fuente !== 'local') memoria.add(fuente);
    } finally { if (timer) clearTimeout(timer); }
  }
  const e = new Error(`Ninguna fuente sirvió: ${fallos.map(f => `${f.fuente} (${f.error})`).join(' · ')}`);
  e.fallos = fallos;
  throw e;
}

export const cargarIndice = (opts = {}) => cargarConRespaldo(fuentesIndice(), { ...opts, validar: d => validarIndice(d).errores });

export async function cargarPlanoEspacio(id, formato = null, opts = {}) {
  if (!ESPACIO_RE.test(String(id || ''))) throw new Error(`Id de espacio no válido: «${id}»`);
  const r = await cargarConRespaldo(fuentesPlano(id), { ...opts, validar: d => {
    const { errores } = validarPlanoEspacio(d, formato);
    if (!errores.length && d.id !== id) errores.push(`es el plano de «${d.id}»`);
    return errores;
  } });
  return { ...r, plan: planoEspacioPublico(r.datos), avisos: validarPlanoEspacio(r.datos, formato).avisos };
}

// ── Contenido ───────────────────────────────────────────────────────────────
export function validarManifiesto(m) {
  const errores = [];
  if (!m || typeof m !== 'object') return ['El manifiesto no es un objeto JSON'];
  if (m.schema !== SCHEMA_CONTENIDO) errores.push(`Esquema «${m.schema}»: se esperaba ${SCHEMA_CONTENIDO}`);
  if (!m.piezas || typeof m.piezas !== 'object' || !Object.keys(m.piezas).length) errores.push('El manifiesto no trae piezas');
  return errores;
}

const urlSegura = u => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u);

/** Manifiestos que se prueban para un tipo de espacio, en orden: el suyo y, en Xtanco, el de siempre. */
export function fuentesManifiesto(tipo) {
  const comun = { fuente: 'stock', url: MANIFIESTO };
  return tipo === 'xtanco' ? [{ fuente: 'altadis', url: MANIFIESTO_XTANCO, timeoutMs: 4000 }, comun] : [comun];
}
/** Carga el manifiesto de un tipo con su respaldo (sin error para el cliente si el suyo no está). */
export const cargarManifiesto = (tipo, opts = {}) => cargarConRespaldo(fuentesManifiesto(tipo), { timeoutMs: 5000, ...opts, validar: validarManifiesto });
/** Título de la campaña de un manifiesto en el idioma pedido (o castellano). */
export function tituloCampana(m, idioma = 'es') {
  const t = m && m.campania && m.campania.titulo;
  if (typeof t === 'string') return t;
  return t ? (t[idioma] || t.es || t.en || null) : null;
}
/** URL de un póster con la versión del manifiesto: cuando el contenido se rehace, la caché no sirve el viejo. */
export const conVersion = (url, m) => (url && m && m.version ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(m.version)}` : url);

/**
 * Qué se reproduce en las pantallas de un formato: el MP4 del manifiesto en el idioma pedido;
 * si ese idioma no está, el otro (y lo dice); si no hay pieza o el manifiesto no llegó, el
 * placeholder animado con el nombre y los píxeles del formato. El placeholder es también el
 * respaldo cuando el vídeo falla al cargar (eso lo decide el visor).
 */
export function elegirContenido(manifiesto, formato, idioma = 'es') {
  const otro = idioma === 'en' ? 'es' : 'en';
  // Un manifiesto que declara sus idiomas y no trae el pedido (Altadis: sólo `es`) no es un fallo.
  const declarados = manifiesto && Array.isArray(manifiesto.idiomas) ? manifiesto.idiomas : null;
  const id = typeof formato === 'string' ? formato : formato && formato.formato;
  const pieza = manifiesto && manifiesto.piezas && manifiesto.piezas[id];
  if (!pieza) return { tipo: 'placeholder', motivo: manifiesto ? 'sin-pieza' : 'sin-manifiesto', idioma };
  for (const lang of [idioma, otro]) {
    const v = pieza[lang];
    if (v && urlSegura(v.url)) {
      return { tipo: 'video', url: v.url, poster: urlSegura(v.poster) ? v.poster : null, idioma: lang, pedido: idioma, sustituto: lang !== idioma && (!declarados || declarados.includes(idioma)),
        metodo: pieza.metodo || null, ancho: pieza.ancho || null, alto: pieza.alto || null };
    }
  }
  return { tipo: 'placeholder', motivo: 'sin-url', idioma };
}

/** Póster de la tarjeta de un formato: el del manifiesto en ese idioma (o el otro), o nada. */
export function posterDe(manifiesto, formatoId, idioma = 'es') {
  const c = elegirContenido(manifiesto, formatoId, idioma);
  return c.tipo === 'video' ? c.poster : null;
}

// ── Navegación y enlaces ────────────────────────────────────────────────────
/**
 * Destino pedido en la URL: ?espacio=altadis-xtanco-NN, o ?formato=cliente-NN&tipo=cafe.
 * Sin formato pero con tipo, sólo el tipo (la galería en ese tipo). ?lang=en y ?auto=1.
 */
export function destinoDesdeURL(search = '') {
  const p = new URLSearchParams(search);
  const lang = p.get('lang') === 'en' ? 'en' : 'es';
  const auto = p.get('auto') === '1';
  const tipoQ = TIPOS.includes(p.get('tipo')) ? p.get('tipo') : null;
  const m = ESPACIO_RE.exec(p.get('espacio') || '');
  if (m) return { espacio: m[0], tipo: m[1], formato: `cliente-${m[2]}`, lang, auto };
  const f = FORMATO_RE.exec(p.get('formato') || '');
  if (f) { const tipo = tipoQ || 'xtanco'; return { espacio: idEspacio(tipo, Number(f[1])), tipo, formato: f[0], lang, auto }; }
  return { espacio: null, tipo: tipoQ || 'xtanco', formato: null, lang, auto };
}

/** El espacio concreto (id del índice) para un formato y un tipo. */
export function resolverEspacio(indice, formatoId, tipo) {
  const f = formatoDe(indice, formatoId);
  if (!f || !TIPOS.includes(tipo)) return null;
  return { formato: f, tipo, id: f.espacios[tipo] };
}

/** El formato anterior o siguiente en el orden n (con vuelta: tras el 18, el 1). */
export function vecino(indice, formatoId, paso = 1) {
  const lista = formatosOrdenados(indice);
  if (!lista.length) return null;
  const i = lista.findIndex(f => f.formato === formatoId);
  if (i < 0) return lista[0].formato;
  return lista[((i + paso) % lista.length + lista.length) % lista.length].formato;
}

/**
 * Query de la URL compartible de un espacio. Con el circuito Altadis España (circuito.mjs), el
 * local (`loc`) o el circuito; la marca blanca (`marca`) se conserva si la página la trae.
 */
export function queryEspacio({ espacio, lang = 'es', auto = false, loc = null, circuito = null, marca = null } = {}) {
  const p = new URLSearchParams();
  if (espacio) p.set('espacio', espacio);
  if (loc) p.set('loc', loc);
  else if (circuito) p.set('circuito', circuito);
  if (marca) p.set('marca', marca);
  if (lang === 'en') p.set('lang', 'en');
  if (auto) p.set('auto', '1');
  const q = p.toString();
  return q ? `?${q}` : '';
}

// ── Textos para el cliente (ES/EN, sin ids internos) ────────────────────────
export const MONTAJES = {
  escaparate: ['en el escaparate', 'in the shop window'], 'tras-mostrador': ['tras el mostrador', 'behind the counter'],
  'sobre-contrabarra': ['sobre la contrabarra', 'above the back counter'], 'pared-fondo': ['en la pared del fondo', 'on the back wall'],
  'junto-caja': ['junto a la caja', 'next to the till'], peana: ['sobre peana', 'on a pedestal'],
  'banda-alta': ['en banda alta', 'high-level strip'], 'cabecera-lineal': ['en la cabecera del lineal', 'at the end of the shelving'],
  // Escena realista (xpacios/realista/): las pantallas del formato sobre su soporte en la zona de montaje.
  soporte: ['sobre soporte de exposición', 'on a display stand'],
};
export const PAREDES = { F: ['pared del fondo', 'back wall'], D: ['pared derecha', 'right-hand wall'], I: ['pared izquierda', 'left-hand wall'], P: ['fachada', 'front wall'] };
export const ZONAS_TXT = { mostrador: ['mostrador', 'counter'], mural: ['mural', 'wall display'], columna: ['columna', 'column'], superstretch: ['superstretch', 'superstretch'], cubo: ['cubo', 'cube'] };
const elegir = (dic, k, en) => (dic[k] ? dic[k][en ? 1 : 0] : String(k || '').replace(/-/g, ' '));
export const textoMontaje = (m, en = false) => (m ? elegir(MONTAJES, m, en) : '');
export const textoPared = (id, en = false) => elegir(PAREDES, id, en);
export const textoZona = (z, en = false) => (z ? elegir(ZONAS_TXT, z, en) : '');
/** Entrega del contenido, igual en los dos idiomas: «MP4 · H.264 · 25 fps». */
export const textoEntrega = formato => `MP4 · H.264 · ${(formato && formato.fps) || 25} fps`;

/** Medidas físicas legibles de una pantalla del plano: pulgadas o metros. */
export function medidaFisica(p, en = false) {
  const coma = n => (en ? String(n) : String(n).replace('.', ','));
  if (p.dimensiones && num(p.dimensiones.ancho) && num(p.dimensiones.alto)) {
    return `${coma(Math.round(p.dimensiones.ancho * 100) / 100)} × ${coma(Math.round(p.dimensiones.alto * 100) / 100)} m`;
  }
  return num(p.pulgadas) ? `${coma(p.pulgadas)}″` : '—';
}
