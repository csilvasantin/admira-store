// Visor de los 18 espacios Altadis (misión DCL-d7966deb02734a6f34beb54e, tarea c, demo a
// Alsea / Starbucks del 16-oct-2026). Un espacio tipo por formato de pantalla de Altadis, en
// estanco (Xtanco) y en cafetería (Starbucks): galería de los 18 y, al elegir uno, su gemelo 3D
// desde el plano compartido de admira.biz (o la copia de este sitio) con el contenido adaptado
// a ese formato en sus pantallas.
//
// Rendimiento: un solo gemelo vivo a la vez. Un único renderer WebGL para toda la página; al
// cambiar de espacio se sueltan la escena, sus texturas y el <video>. Un formato de varias
// pantallas tiene UN <video> y cada pantalla pinta su recorte (recorte.mjs): van sincronizadas.
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import { escenaDesdePlano, vistaPuerta, round } from '../gran-de-gracia-51/plano3d.mjs?v=gdg51-6';
import { crearEscena3D } from '../gran-de-gracia-51/escena3d.mjs?v=gdg51-7';
import {
  cargarIndice, cargarPlanoEspacio, cargarManifiesto, fuentesManifiesto, tituloCampana, conVersion, elegirContenido, posterDe,
  destinoDesdeURL, resolverEspacio, vecino, queryEspacio, formatosOrdenados, formatoDe, medidaFisica,
  textoMontaje, textoPared, textoZona, textoEntrega,
  STUDIO, ARQUITECTO, TEMA_DE_TIPO, TIPOS, RECORRIDO_MS, RECORRIDO_MAX_MS, ESPACIO_RE, dos,
} from './espacios.mjs?v=a18-5';
import { uvsFormato } from './recorte.mjs?v=a18-5';
import { crearPlaceholder, FPS } from './placeholder.mjs?v=a18-5';
import { camaraEncuadre, svgFormato, fovPara, distanciaEnZona, planosCamara, puntosVisibles } from './vista.mjs?v=a18-5';
import {
  circuitoDesdeURL, marcaDesdeURL, tipoInicial, cargarCircuito, buscarLocal, resolverInicio, vecinoLocal, localDeEspacio,
  tituloLocal, formatoDeLocal, CIRCUITO,
} from './circuito.mjs?v=a18-5';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const pedido = destinoDesdeURL(location.search);
// Circuito Altadis España (?loc=, ?circuito=altadis_espana) y marca blanca (?marca=, la aplica el shell).
const pedidoCircuito = circuitoDesdeURL(location.search);
const MARCA = marcaDesdeURL(location.search);
const st = { lang: pedido.lang, tipo: tipoInicial(location.search), indice: null, fuenteIndice: null, manifiestos: {}, fuentesMan: {},
  actual: null, carga: null, auto: false, autoTimer: null, token: 0,
  circuito: null, fuenteCircuito: null, enCircuito: false, local: null };
const t = (es, en) => (st.lang === 'en' ? en : es);
const EN = () => st.lang === 'en';
// Las notas internas del Arquitecto (avisos, sincronía) no son para el cliente: sólo con ?notas=1.
const NOTAS = params.get('notas') === '1';
// admira.biz que no respondió una vez no se vuelve a esperar en esta sesión (copia local directa).
const caidos = new Set();
const manifiestoDe = tipo => st.manifiestos[tipo] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n, d = 2) => (st.lang === 'en' ? String(round(n, d)) : String(round(n, d)).replace('.', ','));
const NOMBRE_TIPO = { xtanco: { es: 'Xtanco', en: 'Xtanco' }, cafe: { es: 'Starbucks', en: 'Starbucks' } };
const nombreTipo = tipo => (st.indice?.tipos?.[tipo]?.[st.lang]) || NOMBRE_TIPO[tipo][st.lang];

const raiz = $('a18'), estado = $('estado');
// El alto real de la barra de controles (cambia al envolverse en estrecho): el estado y la ficha se apartan.
new ResizeObserver(() => raiz.style.setProperty('--controles-h', `${$('controles').offsetHeight || 56}px`)).observe($('controles'));
const status = (texto, error = false) => { estado.textContent = texto; estado.classList.toggle('error', error); };

// ── Textos fijos (data-es / data-en) ──
function aplicarTextos() {
  document.documentElement.lang = st.lang;
  for (const el of document.querySelectorAll('[data-es][data-en]')) el.textContent = el.dataset[st.lang];
  for (const el of document.querySelectorAll('[data-title-es]')) el.title = el.dataset[st.lang === 'en' ? 'titleEn' : 'titleEs'];
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === st.lang));
  for (const b of document.querySelectorAll('[data-tipo]')) b.setAttribute('aria-pressed', String(b.dataset.tipo === st.tipo));
  for (const b of document.querySelectorAll('[data-recorrido]')) { b.setAttribute('aria-pressed', String(st.auto)); b.textContent = st.auto ? t('❚❚ Recorrido', '❚❚ Tour') : t('▶ Recorrido automático', '▶ Auto tour'); }
}

// ── Carga ──
async function arrancar() {
  aplicarTextos();
  status(t('Leyendo los 18 formatos…', 'Reading the 18 formats…'));
  // El índice del circuito sólo si la URL lo pide; va a la vez que el de formatos (sin loc, nada nuevo).
  const circuito = pedidoCircuito.pide ? cargarCircuito().catch(e => ({ error: e })) : null;
  try {
    const r = await cargarIndice({ memoria: caidos });
    st.indice = r.datos; st.fuenteIndice = r;
  } catch (e) { status(`${t('No hay índice de formatos', 'No format index')}: ${e.message}`, true); return; }
  // El contenido no bloquea: sin manifiesto, placeholder animado.
  // Un manifiesto por tipo: Xtanco con el de Altadis (respaldo: el de siempre), Starbucks el de siempre.
  const contenido = Promise.all(TIPOS.map(tipo => cargarManifiesto(tipo)
    .then(r => { st.manifiestos[tipo] = r.datos; st.fuentesMan[tipo] = r; })
    .catch(e => { st.fuentesMan[tipo] = { error: e.fallos?.[0]?.error || e.message, fallos: e.fallos || [] }; })));
  const inicio = circuito ? prepararCircuito(await circuito) : null;
  pintarGaleria();
  pintarFuentes();
  status('');
  await Promise.race([contenido, new Promise(r => setTimeout(r, 1500))]);
  pintarGaleria(); pintarFuentes();
  contenido.then(() => { pintarGaleria(); pintarFuentes(); if (st.actual && medio?.tipo === 'placeholder' && manifiestoDe(st.actual.tipo)) ponerContenido(st.token, { suave: true }); });
  if (inicio && inicio.espacio) abrirLocal(inicio.local, inicio.espacio);
  else if (pedido.formato && !st.enCircuito) abrir(pedido.formato, pedido.tipo);
  if (pedido.auto) alternarRecorrido(true);
  raiz.dataset.listo = '1';
}

// Texto neutro, sea cual sea la fuente: el detalle (qué fuente y por qué) va en el title.
function pintarFuentes() {
  const fi = st.fuenteIndice, fm = st.fuentesMan[st.tipo], campana = tituloCampana(manifiestoDe(st.tipo), st.lang);
  const cont = !fm ? '' : fm.error ? t('animación de cada formato', 'an animation of each format') : campana ? `«${campana}»` : t('vídeo adaptado a cada formato', 'video adapted to each format');
  $('fuentes').textContent = `${t('Planos del Arquitecto', 'Architect plans')} · ${st.indice?.version || ''}${cont ? ` · ${t('Contenido', 'Content')}: ${cont}` : ''}`;
  const fc = st.enCircuito ? st.fuenteCircuito : null;
  $('fuentes').title = [fi?.url, ...(fi?.fallos || []).map(f => `${t('No se usó', 'Not used')}: ${f.url} (${motivoFallo(f)})`), fm?.url || (fm?.error ? `${fuentesManifiesto(st.tipo).map(x => x.url).join(' · ')} (${fm.error})` : ''),
    fc?.url ? `${t('Circuito', 'Circuit')}: ${fc.url}` : '', ...(fc?.fallos || []).map(f => `${t('No se usó', 'Not used')}: ${f.url} (${motivoFallo(f)})`)].filter(Boolean).join('\n');
}

// ── Circuito Altadis España: 10 estancos, cada uno con su formato ──
// Se entra con un ?loc= del índice o con ?circuito=altadis_espana. Un loc desconocido se ignora:
// la página queda como sin loc (y el loc se deja en la URL, por si es de otra cosa).
function prepararCircuito(r) {
  st.fuenteCircuito = r && !r.error ? r : { error: r?.error?.message, fallos: r?.error?.fallos || [] };
  if (!r || r.error || !r.circuito.locales.length) return null;
  const inicio = resolverInicio(r.circuito, { loc: pedidoCircuito.loc, espacio: pedido.espacio }, { flexible: r.respaldo });
  if (!inicio.local && !pedidoCircuito.circuito) return null;
  st.circuito = r.circuito;
  // El espacio de la URL manda para su local (viene del mapa): el recorrido lo respeta.
  if (inicio.corregido) st.circuito = { ...st.circuito, locales: st.circuito.locales.map(l => (l.id === inicio.origen ? inicio.local : l)) };
  st.enCircuito = true; st.tipo = 'xtanco';
  textosCircuito(true);
  return inicio.espacio ? inicio : null;
}

// Cabecera de la galería en modo circuito (y la de siempre al salir).
const CABECERA = ['galeria-eyebrow', 'galeria-h1', 'galeria-lead2'];
const cabeceraOriginal = Object.fromEntries(CABECERA.map(id => [id, { ...$(id).dataset }]));
function textosCircuito(activo) {
  raiz.toggleAttribute('data-circuito', activo);
  for (const b of document.querySelectorAll('[data-salir-circuito]')) b.hidden = !activo;
  const n = st.circuito?.locales.length || 0, cliente = st.circuito?.cliente || 'Altadis';
  const nuevos = {
    'galeria-eyebrow': [`${cliente.toUpperCase()} ESPAÑA · CIRCUITO · GEMELOS 3D`, `${cliente.toUpperCase()} SPAIN · CIRCUIT · 3D TWINS`],
    'galeria-h1': [`${cliente} España · ${n} Xtancos`, `${cliente} Spain · ${n} Xtancos`],
    'galeria-lead2': [`${n} estancos en ${n} ciudades, cada uno con un formato de pantalla de ${cliente} y su contenido. Elige uno para verlo en 3D; ← y → los recorren en el orden del circuito.`,
      `${n} tobacconists in ${n} cities, each one with a ${cliente} screen format and its content. Pick one to see it in 3D; ← and → follow the circuit order.`],
  };
  for (const id of CABECERA) Object.assign($(id).dataset, activo ? { es: nuevos[id][0], en: nuevos[id][1] } : cabeceraOriginal[id]);
  aplicarTextos();
}

/** Sale del circuito (p. ej. para ver un Starbucks): vuelven los 18 formatos y la URL pierde loc y circuito. */
function salirCircuito() {
  if (!st.enCircuito) return;
  st.enCircuito = false; st.local = null;
  textosCircuito(false);
  const u = new URL(location.href);
  u.searchParams.delete('loc'); u.searchParams.delete('circuito');
  history.replaceState(null, '', u);
  pintarGaleria(); pintarFuentes();
  if (st.actual) pintarFichaBasica();
}

// Abre el gemelo de un local del circuito con su formato (o el espacio que dijo la URL).
function abrirLocal(local, espacio = local && local.espacio) {
  const m = ESPACIO_RE.exec(espacio || '');
  if (!m) return;
  abrir(`cliente-${m[2]}`, m[1], { local });
}

// ── Galería ──
function pintarGaleria() {
  if (!st.indice) return;
  if (st.enCircuito) return pintarGaleriaCircuito();
  const lista = formatosOrdenados(st.indice);
  $('galeria-titulo').textContent = t(`${lista.length} espacios tipo · uno por formato de Altadis`, `${lista.length} model spaces · one per Altadis format`);
  const html = lista.map(f => {
    // Pósters del manifiesto del tipo (Xtanco: Altadis; Starbucks: Starbucks), con su versión en la URL.
    const id = f.espacios[st.tipo], m = manifiestoDe(st.tipo), poster = conVersion(posterDe(m, f.formato, st.lang), m);
    const led = /LED/i.test(f.nombre) || f.zona === 'cubo';
    const zona = textoZona(f.zona, EN());
    const uso = f.uso ? (f.uso[st.lang] || f.uso.es || '') : '';
    // El esquema del formato siempre está debajo; el póster del vídeo lo tapa cuando ha cargado. Una
    // tarjeta nunca se queda vacía (póster lento, caído o sin manifiesto).
    return `<li><a class="tarjeta" href="${esc(queryEspacio({ espacio: id, lang: st.lang, marca: MARCA }))}" data-formato="${esc(f.formato)}" aria-current="${st.actual?.formato.formato === f.formato}">` +
      `<span class="poster">${svgFormato(f)}${poster ? `<img src="${esc(poster)}" alt="" decoding="async">` : ''}<b class="n">${dos(f.n)}</b>${led ? '<i class="tec">LED</i>' : ''}</span>` +
      `<span class="nombre">${esc(f.nombre)}</span><span class="px">${f.ancho} × ${f.alto} px</span>` +
      `<span class="uso">${esc(uso)}${zona && zona !== uso ? ` · ${esc(zona)}` : ''}</span>` +
      `<span class="pantallas">${f.pantallas} ${f.pantallas === 1 ? t('pantalla', 'screen') : t('pantallas', 'screens')}${f.grid && f.pantallas > 1 ? ` · ${f.grid.cols} × ${f.grid.rows}` : ''}</span></a></li>`;
  }).join('');
  ponerTarjetas(html);
}
// Sin volver a pintar si nada cambió: rehacer el HTML reinicia la carga de los pósters.
function ponerTarjetas(html) {
  if (html === galeriaPintada) return;
  galeriaPintada = html;
  $('tarjetas').innerHTML = html;
  for (const img of $('tarjetas').querySelectorAll('img')) if (img.complete && img.naturalWidth) img.classList.add('ok');
}
let galeriaPintada = '';

// Galería del circuito: los estancos en orden de tour, con su ciudad y su formato.
function pintarGaleriaCircuito() {
  const locales = st.circuito.locales, m = manifiestoDe('xtanco');
  $('galeria-titulo').textContent = t(`${locales.length} estancos · ${locales.length} ciudades · un formato de Altadis en cada uno`, `${locales.length} tobacconists · ${locales.length} cities · one Altadis format in each`);
  const html = locales.map((l, i) => {
    const f = formatoDe(st.indice, formatoDeLocal(l));
    if (!f) return '';
    const poster = conVersion(posterDe(m, f.formato, st.lang), m);
    const led = /LED/i.test(f.nombre) || f.zona === 'cubo';
    return `<li><a class="tarjeta" href="${esc(queryEspacio({ espacio: l.espacio, loc: l.id, lang: st.lang, marca: MARCA }))}" data-loc="${esc(l.id)}" aria-current="${st.local?.id === l.id}">` +
      `<span class="poster">${svgFormato(f)}${poster ? `<img src="${esc(poster)}" alt="" decoding="async">` : ''}<b class="n">${dos(l.tourOrder ?? i + 1)}</b>${led ? '<i class="tec">LED</i>' : ''}</span>` +
      `<span class="ciudad">${esc(l.ciudad)}</span><span class="nombre">${esc(tituloLocal(l, EN(), { ciudad: false }))}</span>` +
      (l.direccion ? `<span class="uso">${esc(l.direccion)}</span>` : '') +
      `<span class="px">${esc(f.nombre)} · ${f.ancho} × ${f.alto} px</span>` +
      `<span class="pantallas">${f.pantallas} ${f.pantallas === 1 ? t('pantalla', 'screen') : t('pantallas', 'screens')}${f.grid && f.pantallas > 1 ? ` · ${f.grid.cols} × ${f.grid.rows}` : ''}</span></a></li>`;
  }).join('');
  ponerTarjetas(html);
}
$('tarjetas').addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
$('tarjetas').addEventListener('click', e => {
  const a = e.target.closest('a[data-formato], a[data-loc]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  if (a.dataset.loc) { const l = buscarLocal(st.circuito, a.dataset.loc); if (l) abrirLocal(l); } else abrir(a.dataset.formato, st.tipo);
});
// Un póster que no carga se quita: debajo está el esquema del formato.
$('tarjetas').addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);

// ── Modo: galería o espacio ──
function mostrarModo(modo) {
  raiz.dataset.modo = modo;
  $('galeria').hidden = modo !== 'galeria';
  $('espacio').hidden = modo !== 'espacio';
  if (modo === 'espacio' && renderer) redimensionar();
}

function actualizarURL() {
  const u = new URL(location.href);
  for (const k of ['espacio', 'formato', 'tipo', 'lang', 'auto']) u.searchParams.delete(k);
  if (st.actual) u.searchParams.set('espacio', st.actual.id); else if (st.tipo !== 'xtanco') u.searchParams.set('tipo', st.tipo);
  // En el circuito, el local que se ve (loc); en su galería o en un espacio que no es de ningún local, el circuito.
  if (st.enCircuito) {
    if (st.local) u.searchParams.set('loc', st.local.id);
    else { u.searchParams.delete('loc'); u.searchParams.set('circuito', CIRCUITO); }
  }
  if (st.lang === 'en') u.searchParams.set('lang', 'en');
  if (st.auto) u.searchParams.set('auto', '1');
  history.replaceState(null, '', u);
}

function volverGaleria() {
  st.token++;
  alternarRecorrido(false);
  soltarEspacio();
  st.actual = null; st.local = null;
  mostrarModo('galeria'); actualizarURL(); pintarGaleria();
  status('');
}

// ── 3D ──
let renderer = null, s3d = null, escena = null, plan = null, medio = null, pendiente = false;
const canvas = $('lienzo3d'), stage = $('espacio');
const persp = new T.PerspectiveCamera(40, 16 / 9, 0.03, 80);
const V = (x, y, h) => new T.Vector3(x, h, y);
const cam = { vista: 'encuadre', orb: { az: 0, el: 0.14, dist: 4, objetivo: new T.Vector3() }, mira: { pos: new T.Vector3(), yaw: 0, pitch: 0, zoom: 1 }, marco: null };
let ancho = 1, alto = 1;

function invalidar() { if (pendiente) return; pendiente = true; requestAnimationFrame(pintar); }

function asegurarRenderer() {
  if (renderer) return true;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: params.get('captura') === '1' });
  } catch (e) { status(t('Este navegador no puede abrir WebGL: ', 'This browser cannot open WebGL: ') + e.message, true); return false; }
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  new ResizeObserver(redimensionar).observe(stage);
  return true;
}

function redimensionar() {
  if (!renderer || stage.hidden) return;
  const r = stage.getBoundingClientRect();
  ancho = Math.max(1, Math.round(r.width)); alto = Math.max(1, Math.round(r.height));
  renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
  renderer.setSize(ancho, alto, false);
  persp.aspect = ancho / alto;
  if (escena && cam.vista === 'encuadre' && !cam.tocada) encuadrar();
  ajustarFov(); invalidar();
}

const pantallasFormato = () => (escena ? escena.pantallas.filter(p => p.recorte || p.formato === plan.formato.id) : []);

// Encuadre automático sobre las pantallas del formato, de frente y a la distancia justa.
function encuadrar() {
  const zona = zonaLibre();
  // La regla (de frente, centrada, dos tercios del cuadro; el cubo en diagonal) vive en vista.mjs y
  // tiene su test en los 36 planos; aquí sólo se ajusta a la zona libre del lienzo.
  const suyas = pantallasFormato(), fov = fovPara(persp.aspect);
  cam.marco = camaraEncuadre(suyas, { fov, aspect: zona.aspect, sala: escena.sala });
  if (!cam.marco) return;
  const nominal = camaraEncuadre(suyas, { fov: 40, aspect: 16 / 9, sala: escena.sala }).dist;
  const [x, y, h] = cam.marco.objetivo;
  cam.orb = { az: cam.marco.az, el: cam.marco.el, dist: distanciaEnZona(cam.marco.dist, zona.escala, nominal), objetivo: V(x, y, h) };
  despejar();
}

// El mueble sobre el que está la pantalla (la contrabarra bajo el mural, con sus cafeteras) no se
// oculta entero: se mira pieza a pieza. Una pieza metida en el volumen de la pantalla (una cafetera
// contra la pared, su panel o el molino, delante del borde inferior del mural) se oculta siempre:
// desde ningún ángulo deja ver ese borde. Si otra pieza tapa, la cámara sube (hasta 24°, sigue de frente) hasta que la línea
// a las esquinas y al borde inferior pasa por encima; sólo si ni así, se ocultan las que tapan.
const EL_MAX = 0.42;
const tapa = (m, c) => puntos.some(o => { const d = o.distanceTo(c); rayo.set(c, o.clone().sub(c).normalize()); const hit = rayo.intersectBox(m.caja, punto); return hit && c.distanceTo(punto) < d - 0.1; });
function despejar() {
  cam.apoyosFuera = false;
  const libres = apoyosTapa.filter(m => !m.solapa);
  if (!libres.length || !escena) return;
  for (let el = cam.orb.el; el <= EL_MAX + 1e-9; el += 0.02) {
    cam.orb.el = el; colocarCamara();
    if (!libres.some(m => tapa(m, persp.position))) return;
  }
  cam.orb.el = EL_MAX; cam.apoyosFuera = true;
}

// Lo que no tapan la ficha ni la barra de controles: el encuadre se centra ahí (setViewOffset,
// como el laboratorio). En ancho la ficha va a la izquierda; en estrecho, arriba.
function zonaLibre() {
  const sr = stage.getBoundingClientRect(), fr = $('ficha').getBoundingClientRect(), cr = $('controles').getBoundingClientRect();
  const lateral = sr.width > 900;
  const m = { l: lateral ? Math.max(16, fr.right - sr.left + 12) : 16, r: 16, t: lateral ? 16 : Math.max(16, fr.bottom - sr.top + 10), b: Math.max(16, sr.bottom - cr.top + 10) };
  const w = Math.max(160, ancho - m.l - m.r), h = Math.max(120, alto - m.t - m.b);
  persp.setViewOffset(ancho, alto, -(m.l - m.r) / 2, -(m.t - m.b) / 2, ancho, alto);
  return { aspect: w / h, escala: Math.min(1, h / alto) };
}

function ajustarFov() {
  if (cam.vista === 'puerta') {
    const minV = 2 * Math.atan(Math.tan(80 * Math.PI / 360) / persp.aspect) * 180 / Math.PI;
    persp.fov = Math.min(100, Math.max(58, minV) / (cam.mira.zoom || 1));
    persp.clearViewOffset();
  } else { persp.fov = fovPara(persp.aspect); zonaLibre(); }
  persp.updateProjectionMatrix();
}

function ponerVista(nombre) {
  if (!escena) return;
  cam.vista = nombre; cam.tocada = false;
  if (nombre === 'sala') {
    const { ancho: a, fondo: f, alto: h, centro } = escena.sala;
    const r = Math.hypot(a, f, h) / 2;
    cam.orb = { az: cam.marco ? cam.marco.az + 0.6 : Math.PI / 4, el: 0.78, dist: r / Math.sin(20 * Math.PI / 180) * 0.9, objetivo: V(centro[0], centro[1], 1.0) };
  } else if (nombre === 'puerta') {
    const p = vistaPuerta(escena);
    if (!p) return ponerVista('encuadre');
    const o = cam.marco ? cam.marco.objetivo : p.objetivo;
    const pos = V(...p.pos), d = V(...o).sub(pos).normalize();
    cam.mira = { pos, yaw: Math.atan2(d.z, d.x), pitch: Math.asin(d.y), zoom: 1 };
  } else { cam.vista = 'encuadre'; encuadrar(); }
  for (const b of document.querySelectorAll('[data-vista]')) b.setAttribute('aria-pressed', String(b.dataset.vista === cam.vista));
  pintarHud();
  ajustarFov(); invalidar();
}

function pintarHud() {
  $('hud').textContent = { encuadre: t('Encuadre de las pantallas del formato · arrastra para girar, rueda para acercar', 'Framing the format screens · drag to orbit, wheel to zoom'), sala: t('Órbita de la sala · arrastra para girar', 'Room orbit · drag to orbit'), puerta: t('Desde la puerta · arrastra para mirar alrededor', 'From the door · drag to look around') }[cam.vista];
}

function colocarCamara() {
  if (cam.vista === 'puerta') {
    const { pos, yaw, pitch } = cam.mira;
    if (persp.near !== 0.03) { persp.near = 0.03; persp.far = 40; persp.updateProjectionMatrix(); }
    persp.position.copy(pos); persp.up.set(0, 1, 0);
    persp.lookAt(pos.x + Math.cos(pitch) * Math.cos(yaw), pos.y + Math.sin(pitch), pos.z + Math.cos(pitch) * Math.sin(yaw));
  } else {
    const { az, el, dist, objetivo } = cam.orb;
    const pl = planosCamara(dist, escena?.sala);
    if (Math.abs(persp.near - pl.near) > 1e-4 || Math.abs(persp.far - pl.far) > 1e-3) { persp.near = pl.near; persp.far = pl.far; persp.updateProjectionMatrix(); }
    persp.position.set(objetivo.x + Math.cos(el) * Math.cos(az) * dist, objetivo.y + Math.sin(el) * dist, objetivo.z + Math.cos(el) * Math.sin(az) * dist);
    persp.up.set(0, 1, 0); persp.lookAt(objetivo);
  }
  persp.updateMatrixWorld(true);
}

// Corte de muñeca (como el laboratorio): se ocultan las paredes que dan la espalda a la cámara.
function recortar() {
  const c = persp.position, x = c.x, y = c.z;
  for (const w of escena.paredes) s3d.paredes.get(w.id).visible = (x - w.a[0]) * w.n[0] + (y - w.a[1]) * w.n[1] > -0.02;
  const dentro = x > 0 && x < escena.sala.ancho && y > 0 && y < escena.sala.fondo && c.y < escena.sala.alto;
  s3d.techo.visible = s3d.lampara.visible = dentro;
  // Un mueble entre la cámara y una pantalla del formato se oculta, como las paredes: lo que se
  // enseña son las pantallas. Se prueban su centro, sus esquinas y su borde inferior (las cafeteras
  // de la contrabarra tapaban la parte baja del mural). El mueble sobre el que está la pantalla, no.
  for (const m of tapas) m.g.visible = !tapa(m, c);
  for (const m of apoyosTapa) m.g.visible = !(cam.vista === 'encuadre' && (m.solapa || (cam.apoyosFuera && tapa(m, c))));
}
const rayo = new T.Ray(), punto = new T.Vector3();
let tapas = [], apoyosTapa = [], puntos = [];
function prepararTapas() {
  const suyas = pantallasFormato(), apoyos = new Set(suyas.map(p => p.apoyo?.id).filter(Boolean));
  s3d.scene.updateMatrixWorld(true);   // antes del primer render las piezas aún no tienen su matrixWorld
  puntos = suyas.flatMap(puntosVisibles).map(q => V(q[0], q[1], q[2]));
  tapas = [...s3d.muebles].filter(([id]) => !apoyos.has(id)).map(([id, g]) => ({ id, g, caja: new T.Box3().setFromObject(g) }));
  // Volumen delante de cada pantalla (70 cm hacia la sala, de su borde inferior al superior): una
  // pieza del mueble de apoyo que se mete ahí (cafetera, su panel, el molino) tapa la pantalla.
  const zonas = suyas.filter(p => !p.cubo).map(p => {
    const [cx, cy] = p.centro, [ux, uy] = p.u, [nx, ny] = p.n, caja = new T.Box3();
    for (const k of [-0.5, 0.5]) for (const f of [-0.02, 0.7]) for (const h of [p.z + 0.01, p.z1]) caja.expandByPoint(V(cx + ux * p.w * k + nx * f, cy + uy * p.w * k + ny * f, h));
    return caja;
  });
  apoyosTapa = [];
  for (const id of apoyos) s3d.muebles.get(id)?.traverse(o => {
    if (!o.isMesh) return;
    const caja = new T.Box3().setFromObject(o);
    apoyosTapa.push({ id, g: o, caja, solapa: zonas.some(z => z.intersectsBox(caja)) || puntos.some(q => caja.containsPoint(q)) });
  });
}

function pintar() {
  pendiente = false;
  if (!renderer || !s3d || stage.hidden) return;
  colocarCamara(); recortar();
  renderer.render(s3d.scene, persp);
  if (s3d.hayVideo()) invalidar();   // el vídeo del formato pide fotogramas
}

// ── Abrir un espacio ──
async function abrir(formatoId, tipo, { local } = {}) {
  const r = resolverEspacio(st.indice, formatoId, tipo);
  if (!r) { status(t(`No existe el espacio ${formatoId} · ${tipo}`, `No space ${formatoId} · ${tipo}`), true); return; }
  const token = ++st.token;
  st.actual = r; st.tipo = tipo;
  // En el circuito, el local que se abre (o el de ese espacio, si lo hay: /espacio 8, la galería).
  st.local = st.enCircuito ? (local !== undefined ? local : localDeEspacio(st.circuito, r.id)) : null;
  mostrarModo('espacio'); aplicarTextos();
  actualizarURL();
  pintarFichaBasica();
  status(t('Leyendo el plano…', 'Reading the plan…'));
  let carga;
  try { carga = await cargarPlanoEspacio(r.id, r.formato, { memoria: caidos }); } catch (e) {
    if (token !== st.token) return;
    soltarEspacio(); $('f-datos').innerHTML = ''; $('f-contenido').textContent = ''; $('f-plano').textContent = '';
    if (renderer) { renderer.setClearColor('#0f1416', 1); renderer.clear(); }   // sin el fotograma del espacio anterior
    status(t('No se pudo abrir el plano de este espacio.', 'The plan of this space could not be opened.'), true); estado.title = e.message;
    programarRecorrido(); return;   // el recorrido sigue con el siguiente
  }
  if (token !== st.token) return;
  if (!asegurarRenderer()) return;
  soltarEspacio();
  st.carga = carga; plan = carga.plan;
  try { escena = escenaDesdePlano(plan); } catch (e) {
    $('f-contenido').textContent = ''; status(t('El plano de este espacio no se puede pintar.', 'The plan of this space cannot be drawn.'), true); estado.title = e.message;
    programarRecorrido(); return;
  }
  s3d = crearEscena3D(escena, { anisotropia: renderer.capabilities.getMaxAnisotropy(), onCambio: invalidar, tema: TEMA_DE_TIPO[tipo] });
  prepararTapas();
  redimensionar();
  pintarFicha();
  ponerVista('encuadre');
  status(''); estado.title = '';   // el respaldo no es un error: el motivo va en el title de la ficha
  programarRecorrido();
  ponerContenido(token);
  canvas.dataset.listo = r.id;
}

// ── Contenido: el MP4 del formato (un solo <video>) o el placeholder ──
// `suave` (cambio de idioma, llegada del manifiesto): lo que se ve sigue en pantalla hasta que lo
// nuevo pinta; sin pantallas en neutro entre medias.
function ponerContenido(token, { suave = false } = {}) {
  if (!s3d || token !== st.token) return;
  const previo = suave ? medio : null;
  if (suave) medio = null; else soltarMedio();
  const f = st.actual.formato, lienzo = [plan.formato.ancho, plan.formato.alto], suyas = pantallasFormato();
  const eleccion = elegirContenido(manifiestoDe(st.actual.tipo), f, st.lang);
  // `esperando`: el vídeo que tarda; el placeholder lo cubre y, si llega, el vídeo lo sustituye.
  const conPlaceholder = (motivo, esperando = null, detalle = '') => {
    if (token !== st.token || !s3d) return;
    soltarMedio(); liberar(previo);
    const ph = crearPlaceholder({ ...f, ancho: lienzo[0], alto: lienzo[1] }, { idioma: st.lang, motivo, recortes: suyas.map(p => p.recorte).filter(Boolean) });
    s3d.ponerLienzo(ph.canvas, uvsFormato(suyas, { lienzo, medio: [ph.ancho, ph.alto] }));
    const t0 = performance.now();
    const timer = setInterval(() => { if (document.visibilityState !== 'visible' || stage.hidden) return; ph.pintar((performance.now() - t0) / 1000); s3d.refrescarLienzo(); invalidar(); }, 1000 / FPS);
    medio = { tipo: 'placeholder', timer, motivo, detalle, esperando };
    pintarContenido(); invalidar();
    if (motivo !== 'lento') contenidoListo();
  };
  if (eleccion.tipo !== 'video') return conPlaceholder(eleccion.motivo);
  const v = document.createElement('video');
  Object.assign(v, { crossOrigin: 'anonymous', muted: true, defaultMuted: true, playsInline: true, loop: true, preload: 'auto' });
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  medio = { tipo: 'video', video: v, eleccion, cargando: true, previo };
  const mio = () => medio && (medio.video === v || medio.esperando === v);
  // iOS: play() en cuanto hay src y otra vez con el primer fotograma; si lo rechaza, con el primer toque.
  const reproducir = () => v.play().catch(() => { if (mio()) pedirGesto(() => { if (mio()) v.play().catch(() => {}); }); });
  // Un error suelta el vídeo; si sólo tarda (red lenta el día de la demo), sigue cargando detrás del placeholder.
  const fallo = (motivo, detalle, seguir = false) => {
    clearTimeout(caduca);
    if (!mio()) return;
    if (seguir) { medio.video = null; conPlaceholder(motivo, v, detalle); } else conPlaceholder(motivo, null, detalle);
  };
  const caduca = setTimeout(() => fallo('lento', '> 12 s', true), 12000);
  v.addEventListener('loadeddata', () => {
    clearTimeout(caduca);
    if (!mio() || token !== st.token || !s3d) return;
    if (medio.esperando === v) { clearInterval(medio.timer); medio = { tipo: 'video', video: v, eleccion, cargando: true }; }
    s3d.ponerLienzo(v, uvsFormato(suyas, { lienzo, medio: [v.videoWidth, v.videoHeight] }));
    if (medio.previo) { liberar(medio.previo); medio.previo = null; }
    medio.cargando = false;
    reproducir();
    pintarContenido(); invalidar(); contenidoListo();
  }, { once: true });
  v.addEventListener('error', () => fallo('error', v.error ? `MediaError ${v.error.code}` : 'error'), { once: true });
  v.addEventListener('playing', invalidar);
  v.src = eleccion.url;
  v.load();
  reproducir();
  pintarContenido();
}

// Un solo escuchador para «reproducir con el primer toque» (iOS): se cambia, no se acumula, y se
// quita al soltar el medio.
let alGesto = null;
function quitarGesto() {
  if (!alGesto) return;
  document.removeEventListener('pointerdown', alGesto, true); document.removeEventListener('keydown', alGesto, true); alGesto = null;
}
function pedirGesto(fn) {
  quitarGesto();
  alGesto = () => { quitarGesto(); fn(); };
  document.addEventListener('pointerdown', alGesto, { capture: true, once: true }); document.addEventListener('keydown', alGesto, { capture: true, once: true });
}

// Suelta lo que un medio tiene vivo: intervalo del placeholder, vídeo, el que esperaba y el anterior.
function liberar(m) {
  if (!m) return;
  if (m.timer) clearInterval(m.timer);
  for (const v of [m.video, m.esperando]) if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {} }
  if (m.previo) { liberar(m.previo); m.previo = null; }
}

function soltarMedio() {
  quitarGesto();
  if (!medio) return;
  const m = medio; medio = null;
  s3d?.quitarLienzo();
  liberar(m);
}

function soltarEspacio() {
  soltarMedio();
  if (s3d) { s3d.dispose(); s3d = null; }
  escena = null; plan = null; st.carga = null;
  if (renderer) renderer.renderLists.dispose();
}

// ── Ficha ──
function pintarFichaBasica() {
  const { formato: f, tipo } = st.actual;
  $('f-eyebrow').textContent = `ALTADIS · ${t('FORMATO', 'FORMAT')} ${dos(f.n)}/${dos(st.indice.formatos.length)} · ${nombreTipo(tipo).toUpperCase()}`;
  $('f-nombre').textContent = f.nombre;
  const uso = f.uso ? (f.uso[st.lang] || f.uso.es) : '', zona = textoZona(f.zona, EN());
  $('f-uso').textContent = `${uso}${zona && zona !== uso ? ` · ${t('zona', 'zone')} ${zona}` : ''}`;
  $('f-studio').href = STUDIO(f.formato);
  $('f-arquitecto').href = ARQUITECTO(f.formato, tipo);
  const n = st.local && st.circuito.locales.length;
  $('n-actual').textContent = n ? `${dos(st.local.tourOrder ?? st.circuito.locales.indexOf(st.local) + 1)} / ${dos(n)}` : `${dos(f.n)} / ${dos(st.indice.formatos.length)}`;
  for (const b of document.querySelectorAll('[data-tipo]')) b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo));
  pintarFichaLocal();
}

// El estanco del circuito, encima del formato: «Estanco <nombre> · <ciudad>», su dirección y «Volver al mapa».
function pintarFichaLocal() {
  const l = st.enCircuito ? st.local : null;
  $('f-local').hidden = !l;
  raiz.toggleAttribute('data-local', Boolean(l));
  if (!l) return;
  const n = st.circuito.locales.length, i = st.circuito.locales.findIndex(x => x.id === l.id);
  $('f-local-eyebrow').textContent = `${(st.circuito.cliente || 'Altadis').toUpperCase()} ${t('ESPAÑA', 'SPAIN')} · ${t('ESTANCO', 'TOBACCONIST')} ${dos(l.tourOrder ?? i + 1)}/${dos(n)}`;
  $('f-local-nombre').textContent = tituloLocal(l, EN());
  $('f-local-dir').textContent = l.direccion || '';
  const mapa = $('f-mapa');
  mapa.hidden = !l.mapa;
  if (l.mapa) mapa.href = l.mapa;
}

function pintarFicha() {
  if (!st.actual || !plan) return;
  const { formato: f, tipo, id } = st.actual, pf = plan.formato, suyas = pantallasFormato();
  // Pantallas físicas iguales, agrupadas: «4 × 49″ LCD · 960 × 540 px».
  const grupos = new Map();
  for (const p of suyas) {
    const tec = (p.tecnologia || 'lcd').toUpperCase(), res = p.cubo && p.lienzo ? `${p.lienzo[0]} × ${p.lienzo[1]} px` : p.recorte ? `${p.recorte.w} × ${p.recorte.h} px` : (p.resolucion || []).join(' × ');
    const fis = p.cubo ? `${t('cubo', 'cube')} ${num(p.cubo.lado)} × ${num(p.cubo.lado)} × ${num(p.cubo.alto)} m · 4 ${t('caras', 'faces')}` : medidaFisica(p, st.lang === 'en');
    const paso = p.pasoPixelMm ? ` P${num(p.pasoPixelMm, 3)}` : '';
    const cara = p.cubo ? (p.cubo.caras?.[0]?.recorte || { w: (p.lienzo?.[0] || 1600) / 4, h: p.lienzo?.[1] || 600 }) : null;
    const k = `${fis} ${tec}${paso} · ${res}${cara ? ` (4 × ${cara.w} × ${cara.h})` : ''}`;
    grupos.set(k, (grupos.get(k) || 0) + 1);
  }
  // Sin ids internos (cliente-NN, altadis-…, pared F): lo que entiende el cliente, en su idioma.
  const p0 = suyas[0], donde = p0 ? (textoMontaje(p0.montaje, EN()) || (!p0.cubo ? textoPared(p0.pared, EN()) : '')) : '';
  const filas = [
    [t('Formato', 'Format'), `${pf.ancho} × ${pf.alto} px · ${pf.fps || f.fps || 25} fps`],
    [t('Rejilla', 'Grid'), `${pf.grid?.cols || f.grid.cols} × ${pf.grid?.rows || f.grid.rows} · ${suyas.length} ${suyas.length === 1 ? t('pantalla física', 'physical screen') : t('pantallas físicas', 'physical screens')}`],
    [t('Pantallas', 'Screens'), [...grupos].map(([k, n]) => `${n} × ${k}`).join(' · ')],
    [t('Zona', 'Zone'), [textoZona(pf.zona, EN()), donde].filter(Boolean).join(' · ') || '—'],
    [t('Espacio', 'Space'), `${nombreTipo(tipo)} · ${num(escena.sala.ancho, 2)} × ${num(escena.sala.fondo, 2)} m`],
    [t('Entrega', 'Delivery'), textoEntrega(pf)],
  ];
  // Notas internas del Arquitecto (en castellano: sincronía y avisos), sólo con ?notas=1.
  const fu = plan.fuente || {}, txt = v => (typeof v === 'string' ? v : '');
  if (NOTAS && txt(fu.sincro)) filas.push([t('Sincro', 'Sync'), fu.sincro]);
  if (NOTAS) for (const a of Array.isArray(fu.avisos) ? fu.avisos.filter(txt) : []) filas.push([t('Nota', 'Note'), a]);
  $('f-datos').innerHTML = filas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  const c = st.carga;
  $('f-plano').textContent = `${t('Planos del Arquitecto', 'Architect plans')} · ${plan.version || ''}`;
  $('f-plano').title = `${id} · ${c.fuente === 'compartido' ? 'admira.biz' : t('copia local de admira.store', 'local copy on admira.store')}\n${c.url}` + (c.fallos.length ? `\n${t('No se usó', 'Not used')}: ${c.fallos.map(x => `${x.url} (${motivoFallo(x)})`).join(' · ')}` : '') + (NOTAS && c.avisos.length ? `\n${c.avisos.join('\n')}` : '');
  pintarContenido();
}

// Por qué no se usó una fuente, en el idioma de la página (espacios.mjs lo da en castellano).
function motivoFallo(x) {
  if (!EN()) return x.error;
  if (x.recordado) return 'did not answer earlier in this session';
  return String(x.error).replace(/^sin respuesta en (.+) s$/, 'no answer in $1 s').replace(/^responde HTML: no está publicado$/, 'answers HTML: not published').replace(/^no válido: .*/, 'not valid');
}

function pintarContenido() {
  const el = $('f-contenido');
  if (!medio) { el.textContent = ''; el.title = ''; return; }
  if (medio.tipo === 'video') {
    // La campaña de cada tipo: en Xtanco la de Altadis (o la de siempre si aún no está), en Starbucks la suya.
    const e = medio.eleccion, lang = e.idioma.toUpperCase(), campana = tituloCampana(manifiestoDe(st.actual?.tipo), st.lang);
    el.textContent = medio.cargando ? t('Contenido: cargando el vídeo de este formato…', 'Content: loading this format’s video…')
      : `${t('Contenido', 'Content')}: ${campana ? `«${campana}» · ` : ''}${t('vídeo adaptado a este formato', 'video adapted to this format')} · ${e.sustituto ? t(`versión ${lang}`, `${lang} version`) : lang}`;
    el.title = e.url;
  } else {
    const m = medio.motivo;
    el.textContent = m === 'lento' ? t('Contenido: animación del formato mientras llega el vídeo', 'Content: format animation while the video loads')
      : m === 'error' ? t('Contenido: animación del formato (el vídeo no se pudo cargar)', 'Content: format animation (the video could not be loaded)')
      : t('Contenido: animación del formato (el vídeo adaptado aún no está disponible)', 'Content: format animation (the adapted video is not available yet)');
    el.title = `${fuentesManifiesto(st.actual?.tipo).map(x => x.url).join(' · ')}${medio.detalle ? ` · ${medio.detalle}` : ''}${m ? ` · ${m}` : ''}`;
  }
}

// ── Navegación, idioma, tipo y recorrido ──
function paso(d) {
  if (!st.indice) return;
  // En el circuito, sólo sus estancos, en orden de tour y cada uno con su formato.
  if (st.enCircuito) { const l = vecinoLocal(st.circuito, st.local?.id, d); if (l) abrirLocal(l); return; }
  const actual = st.actual?.formato.formato;
  abrir(actual ? vecino(st.indice, actual, d) : formatosOrdenados(st.indice)[0].formato, st.tipo);
}

function cambiarTipo(tipo) {
  if (!TIPOS.includes(tipo) || tipo === st.tipo && (!st.actual || st.actual.tipo === tipo)) return;
  if (st.enCircuito) salirCircuito();   // el circuito es de estancos: un Starbucks lo deja
  st.tipo = tipo; aplicarTextos();
  pintarFuentes();   // la campaña del tipo (Xtanco: Altadis; Starbucks: Starbucks)
  if (st.actual) abrir(st.actual.formato.formato, tipo); else { actualizarURL(); pintarGaleria(); }
}

function cambiarIdioma(lang) {
  if (!['es', 'en'].includes(lang) || lang === st.lang) return;
  st.lang = lang; aplicarTextos(); pintarGaleria(); pintarFuentes(); actualizarURL();
  if (st.actual) { pintarFichaBasica(); if (plan) { pintarFicha(); pintarHud(); ponerContenido(st.token, { suave: true }); } }
}
// El shell (/idioma) llama a setLanguage; su evento llega después y ya no cambia nada.
window.setLanguage = cambiarIdioma;
window.addEventListener('admira:languagechange', e => cambiarIdioma(e.detail?.lang));

// Recorrido: 12 s desde que el contenido pinta (contenidoListo); si el vídeo no llega, a los 20 s.
const avanzar = () => { if (document.visibilityState === 'visible') paso(1); else programarRecorrido(); };
function programarRecorrido() {
  clearTimeout(st.autoTimer);
  if (!st.auto) return;
  st.autoTimer = setTimeout(avanzar, RECORRIDO_MAX_MS);
}
function contenidoListo() {
  if (!st.auto) return;
  clearTimeout(st.autoTimer);
  st.autoTimer = setTimeout(avanzar, RECORRIDO_MS);
}
function alternarRecorrido(forzar) {
  st.auto = forzar ?? !st.auto;
  aplicarTextos();
  if (st.auto && !st.actual && st.indice) paso(0);
  else if (st.auto && medio && !medio.cargando && medio.motivo !== 'lento') contenidoListo(); else programarRecorrido();
  if (st.actual || !st.auto) actualizarURL();
}

document.addEventListener('click', e => {
  const b = e.target.closest('button, a[id]');
  if (!b) return;
  if (b.dataset.lang) cambiarIdioma(b.dataset.lang);
  else if (b.dataset.tipo) cambiarTipo(b.dataset.tipo);
  else if (b.dataset.vista) ponerVista(b.dataset.vista);
  else if (b.hasAttribute('data-recorrido')) alternarRecorrido();
  else if (b.dataset.paso) paso(Number(b.dataset.paso));
  else if (b.id === 'a-galeria') volverGaleria();
  else if (b.hasAttribute('data-salir-circuito')) salirCircuito();
  else if (ACCIONES[b.id]) ACCIONES[b.id]();
});
// ▤ Avanzado del shell.
const ACCIONES = {
  'a18-galeria': () => volverGaleria(), 'a18-encuadre': () => ponerVista('encuadre'), 'a18-sala': () => ponerVista('sala'),
  'a18-puerta': () => ponerVista('puerta'), 'a18-recorrido': () => alternarRecorrido(), 'a18-xtanco': () => cambiarTipo('xtanco'), 'a18-cafe': () => cambiarTipo('cafe'),
};

document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); paso(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); paso(-1); }
  else if (e.key === 'Escape' && st.actual) volverGaleria();
});

// ── Gestos: órbita y mirar alrededor ──
const punteros = new Map();
let gesto = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture?.(e.pointerId); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  gesto = { x: e.clientX, y: e.clientY, orb: { ...cam.orb }, mira: { yaw: cam.mira.yaw, pitch: cam.mira.pitch }, pinza: distancia(), dist: cam.orb.dist, zoom: cam.mira.zoom || 1 };
});
canvas.addEventListener('pointermove', e => {
  if (!gesto || !punteros.has(e.pointerId)) return;
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const dx = e.clientX - gesto.x, dy = e.clientY - gesto.y;
  if (Math.hypot(dx, dy) < 3) return;
  cam.tocada = true;
  if (punteros.size > 1 && gesto.pinza > 0) { zoom(distancia() / gesto.pinza, gesto); return; }
  if (cam.vista === 'puerta') { cam.mira.yaw = gesto.mira.yaw - dx * 0.004; cam.mira.pitch = Math.max(-1.3, Math.min(1.3, gesto.mira.pitch + dy * 0.004)); }
  else { cam.orb.az = gesto.orb.az + dx * 0.006; cam.orb.el = Math.max(-0.2, Math.min(1.5, gesto.orb.el + dy * 0.004)); }
  invalidar();
});
const soltarPuntero = e => { punteros.delete(e.pointerId); if (!punteros.size) gesto = null; };
canvas.addEventListener('pointerup', soltarPuntero);
canvas.addEventListener('pointercancel', soltarPuntero);
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.tocada = true; zoom(Math.exp(-e.deltaY * 0.0012)); }, { passive: false });
function distancia() { const [a, b] = [...punteros.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; }
function zoom(f, base) {
  if (cam.vista === 'puerta') { cam.mira.zoom = Math.max(0.6, Math.min(4, (base ? base.zoom : cam.mira.zoom || 1) * f)); ajustarFov(); }
  else cam.orb.dist = Math.max(0.6, Math.min(30, (base ? base.dist : cam.orb.dist) / f));
  invalidar();
}

// ── Orden del modo experto: /espacio 15 cafe ──
(function registrar(intentos = 0) {
  if (!window.XpaceShell?.registerVerb) { if (intentos < 50) setTimeout(() => registrar(intentos + 1), 100); return; }
  window.XpaceShell.registerVerb({ id: 'espacio', es: 'Espacio Altadis: /espacio <1-18> [xtanco|cafe], siguiente, anterior, galeria o recorrido', en: 'Altadis space: /espacio <1-18> [xtanco|cafe], siguiente, anterior, galeria or recorrido', run: args => {
    const [a, b] = String(args || '').trim().toLowerCase().split(/\s+/);
    if (/^sig|^next/.test(a || '')) paso(1);
    else if (/^ant|^prev/.test(a || '')) paso(-1);
    else if (/^gal/.test(a || '')) volverGaleria();
    else if (/^rec|^tour|^auto/.test(a || '')) alternarRecorrido();
    else if (/^\d{1,2}$/.test(a || '')) abrir(`cliente-${dos(Number(a))}`, TIPOS.includes(b) ? b : st.tipo);
    else if (TIPOS.includes(a)) cambiarTipo(a);
    return st.actual ? st.actual.id : t('galería', 'gallery');
  } });
})();

window.Altadis18 = { st, abrir, paso, cambiarIdioma, cambiarTipo, volverGaleria, ponerVista, salirCircuito, info: () => ({ espacio: st.actual?.id || null,
  loc: st.local?.id || null, circuito: st.enCircuito, circuitoFuente: st.fuenteCircuito?.fuente || null, medio: medio ? { tipo: medio.tipo, cargando: Boolean(medio.cargando), motivo: medio.motivo || null, w: medio.video?.videoWidth || null, h: medio.video?.videoHeight || null, t: medio.video?.currentTime ?? null, pausado: medio.video ? medio.video.paused : null } : null, pantallas: pantallasFormato().length, enLienzo: s3d ? s3d.enLienzo() : 0, memoria: renderer ? { ...renderer.info.memory } : null, vista: cam.vista }) };
arrancar();
