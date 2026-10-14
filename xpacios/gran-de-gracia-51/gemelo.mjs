// Gemelo 3D del laboratorio Gran de Gràcia 51 (misión DCL-6ae9d5b0e2d48ee2fd9c7b19).
// Lee el plano canónico admira.xpacio-plano/1 (compartido en admira.biz o la copia de
// este sitio) y lo pinta: órbita, vista desde la puerta, vista de la webcam, planta y
// alzado de cada pared, con etiquetas ITIL por pantalla y dispositivo.
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import { cargarPlano, comprobarSesion, escenaDesdePlano, vistaPuerta, vistaWebcam, vistaAlzado, pointOnWall, ID_RE, round } from './plano3d.mjs?v=gdg51-3';
import { crearEscena3D } from './escena3d.mjs?v=gdg51-4';
import { estadoSenal, urlAdmiraTv, REFRESCO_MS } from './espejo.mjs?v=gdg51-2';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const en = params.get('lang') === 'en';
const t = (es, english) => (en ? english : es);
document.documentElement.lang = en ? 'en' : 'es';
// Cada página de Xpacio dice cuál pinta y con qué acabado (window.XPACIO_GEMELO); sin nada, el laboratorio.
const CFG = (typeof window !== 'undefined' && window.XPACIO_GEMELO) || {};
const LOC = ID_RE.test(params.get('loc') || '') ? params.get('loc') : ID_RE.test(CFG.loc || '') ? CFG.loc : 'lab-gran-de-gracia-51';
// Lo que el plano no dice y la cámara no ve: el Mac mini va bajo la mesa (por confirmar).
const COLOCACION = { 'lab-gran-de-gracia-51': { macmini: 'bajo-mesa' } };
// Calibración de la webcam con sus fotos del 14-oct (04, 05, 06 y 07): con el pan 0 perpendicular a la
// pared F, la nevera y la mesa larga caen ~27° más a la izquierda que en las fotos. El cero de la
// Insta360 Link 2 apunta ~27° hacia la pared D (o el plano está corrido): por confirmar con metro.
const PAN_CERO = { 'lab-gran-de-gracia-51': -27 };
const PLANO_2D = id => `https://www.admira.biz/plano.html?locationId=${encodeURIComponent(id)}`;
const YOKUP_ITIL = 'https://admira.app/retailer#itil';
// admira.tv: espejo de solo lectura de /signage/now (espejo.mjs) y, como enlace, la portada o el
// canal de un player virtual; nunca el canal de una pantalla real (emitiría como ella).
const LOGIN = () => `/auth/login?return_to=${encodeURIComponent(location.pathname + location.search)}`;
const PANES = [[-60, 'webcam -60° · V del puesto y mueble negro'], [0, 'webcam 0° · puerta y recreativa'], [28, 'webcam 28° · sala de frente'], [42, 'webcam 42° · pizarras y nevera'], [60, 'webcam 60° · mesa larga (Mac Studio)'], [100, 'webcam 100° · V del puesto junto a la ventana']];
const num = (n, d = 2) => (en ? String(round(n, d)) : String(round(n, d)).replace('.', ','));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const canvas = $('gemelo-canvas'), stage = $('gemelo'), capa = $('etiquetas');
const estado = $('estado');
const status = (texto, error = false) => { estado.textContent = texto; estado.classList.toggle('error', error); };

let escena, s3d, renderer, plan, fuente, acceso = 'publico';
const senales = new Map();   // id de pantalla → estadoSenal() vigente
const persp = new T.PerspectiveCamera(40, 1, 0.03, 80);
const orto = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
let camara = persp, ancho = 1, alto = 1, pendiente = false, seleccion = null;
const rayo = new T.Raycaster();
const V = (x, y, h) => new T.Vector3(x, h, y);
const st = {
  vista: 'orbital', etiquetas: params.get('etiquetas') !== '0',
  orb: { az: Math.PI / 4, el: 0.62, dist: 9, objetivo: new T.Vector3() },
  mira: { pos: new T.Vector3(), yaw: 0, pitch: 0, fov: 60, fovBase: 60, hfovMin: 70 },
  orto: { zoom: 1, panX: 0, panY: 0 },
  pan: 60, tilt: -10, calibrar: params.get('calibrar') !== '0',
};

function invalidar() { if (pendiente) return; pendiente = true; requestAnimationFrame(pintar); }

// ── Carga ──
async function arrancar() {
  status(t('Leyendo el plano…', 'Reading the floor plan…'));
  let carga;
  const sesion = await comprobarSesion();
  try { carga = await cargarPlano(LOC, { sesion }); } catch (e) { status(e.message, true); return; }
  ({ plan, fuente, acceso } = carga);
  stage.dataset.acceso = acceso;
  try { escena = escenaDesdePlano(plan, { colocacion: COLOCACION[plan.id] || {} }); } catch (e) { status(t('Plano no válido: ', 'Invalid plan: ') + e.message, true); return; }
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: params.get('captura') === '1' });
  } catch (e) { status(t('Este navegador no puede abrir WebGL: ', 'This browser cannot open WebGL: ') + e.message, true); return; }
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  s3d = crearEscena3D(escena, { anisotropia: renderer.capabilities.getMaxAnisotropy(), onCambio: invalidar, tema: CFG.tema });
  st.orb.objetivo.copy(V(escena.sala.centro[0], escena.sala.centro[1], 1.0));
  const pan = params.has('pan') ? Number(params.get('pan')) : NaN, tilt = params.has('tilt') ? Number(params.get('tilt')) : NaN;
  if (Number.isFinite(pan)) st.pan = Math.max(-170, Math.min(170, pan));
  if (Number.isFinite(tilt)) st.tilt = Math.max(-80, Math.min(60, tilt));
  pintarFicha(carga);
  pintarInventario();
  montarVistas();
  crearEtiquetas();
  new ResizeObserver(redimensionar).observe(stage);
  redimensionar();
  ponerVista(params.get('vista') || 'orbital', { url: false });
  canvas.dataset.listo = '1';
  if (acceso === 'sesion') arrancarEspejo();
  // Gancho para lo propio de cada página (el mural de Starbucks): la escena ya está montada.
  const api = { escena, s3d, invalidar, status, t, acceso, plan };
  window.XpacioGemelo = api;
  document.dispatchEvent(new CustomEvent('xpacio:listo', { detail: api }));
}

// ── Espejo de admira.tv: lo que emite AHORA cada pantalla real (sólo con sesión) ──
let espejoTimer = null;
async function refrescarEspejo() {
  const conId = escena.pantallas.filter(p => p.screenId);
  if (!conId.length || document.visibilityState !== 'visible') return;
  await Promise.all(conId.map(async p => {
    let resp = null;
    try {
      const r = await fetch(`/xpacios/senal?screen=${encodeURIComponent(p.screenId)}`, { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) { pararEspejo(t('sesión caducada', 'session expired')); return; }
      if (r.ok && /json/.test(r.headers.get('content-type') || '')) resp = await r.json();
    } catch (_) { resp = null; }
    const est = estadoSenal(resp, { captura: p.textura });
    const antes = senales.get(p.id);
    senales.set(p.id, est);
    if (!antes || antes.url !== est.url) s3d.ponerMedio(p.id, est);
  }));
  const vivas = [...senales.values()].filter(e => e.fuente === 'vivo').length;
  $('xp-espejo').textContent = vivas ? `${t('admira.tv', 'admira.tv')}: ${vivas}/${senales.size} ${t('en vivo', 'live')}` : `${t('admira.tv: sin señal · capturas del 13-oct', 'admira.tv: no signal · 13-Oct captures')}`;
  if (seleccion) seleccionar(seleccion);
  invalidar();
}
function arrancarEspejo() {
  refrescarEspejo();
  espejoTimer = setInterval(refrescarEspejo, REFRESCO_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refrescarEspejo(); });
}
function pararEspejo(motivo) {
  if (espejoTimer) clearInterval(espejoTimer); espejoTimer = null;
  $('xp-espejo').textContent = `admira.tv: ${motivo}`;
}

function pintarFicha({ fuente: f, url, fallos }) {
  $('xp-nombre').textContent = plan.nombre || plan.id;
  $('xp-direccion').textContent = plan.direccion || '';
  const publico = acceso !== 'sesion';
  for (const id of ['xp-plano2d', 'xp-yokup', 'inv-toggle']) $(id).hidden = publico;
  $('xp-entrar').hidden = !publico; $('xp-entrar').href = LOGIN();
  $('xp-espejo').hidden = publico;
  $('xp-medidas').textContent = `${num(plan.planta.ancho)} × ${num(plan.planta.fondo)} m · ${t('techo', 'ceiling')} ${num(plan.planta.alto)} m · ${escena.pantallas.length} ${t('pantallas', 'screens')} · ${escena.dispositivos.length} ${t('dispositivos', 'devices')}`;
  $('xp-plano2d').href = PLANO_2D(plan.id);
  $('xp-yokup').href = (plan.yokup && /^https:\/\//.test(plan.yokup.portal || '')) ? plan.yokup.portal : YOKUP_ITIL;
  const origen = publico ? t('vista pública · sin inventario ITIL', 'public view · no ITIL inventory') : f === 'compartido' ? t('plano compartido · admira.biz', 'shared plan · admira.biz') : t('copia local · admira.store', 'local copy · admira.store');
  const fuenteEl = $('xp-fuente');
  fuenteEl.textContent = `${t('Fuente', 'Source')}: ${origen} · ${plan.version || 's/v'}`;
  fuenteEl.dataset.fuente = publico ? 'publico' : f;
  fuenteEl.title = url + (fallos.length ? `\n${t('No se usó', 'Not used')}: ${fallos.map(x => `${x.url} (${x.error})`).join(' · ')}` : '');
  $('xp-aviso').textContent = CFG.aviso ? t(CFG.aviso.es, CFG.aviso.en) : t('Levantamiento por cámara · medidas por confirmar con metro', 'Camera survey · measurements to be confirmed with a tape');
  const avisos = escena.avisos.length ? ' · ' + escena.avisos.join(' · ') : '';
  // La fuente ya va en su línea: aquí sólo por qué no se usó el plano compartido y los avisos.
  status(`${f === 'local' && fallos.length ? `${t('admira.biz no sirvió el plano', 'admira.biz did not serve the plan')}: ${fallos[0].error}` : ''}${avisos ? avisos.replace(/^ · /, f === 'local' && fallos.length ? ' · ' : '') : ''}`);
}

// ── Inventario ITIL ──
function pintarInventario() {
  if (acceso !== 'sesion') { $('inv-lista').innerHTML = ''; return; }
  const filas = [];
  const pantalla = p => `<li><button type="button" data-sel="p:${esc(p.id)}"><b>${esc(p.itil || t('sin código', 'no code'))}</b><span>${esc(p.nombre)}</span><small>${esc(p.screenId || p.corto)} · ${num(p.pulgadas, 1)}″ ${p.orientacion === 'vertical' ? 'V' : 'H'} · ${t('pared', 'wall')} ${esc(p.pared)} · s ${num(p.s)} · z ${num(p.z)}</small></button></li>`;
  for (const g of escena.grupos) {
    filas.push(`<li class="grupo">${esc(g.nombre)} · ${esc(g.composicion)} · ${t('pared', 'wall')} ${esc(g.pared)}</li>`);
    for (const id of g.pantallas) filas.push(pantalla(escena.pantallas.find(p => p.id === id)));
  }
  const sueltas = escena.pantallas.filter(p => !p.grupo);
  if (sueltas.length) { filas.push(`<li class="grupo">${t('Pantallas sueltas', 'Single screens')}</li>`); for (const p of sueltas) filas.push(pantalla(p)); }
  filas.push(`<li class="grupo">${t('Players y cámara', 'Players and camera')}</li>`);
  const COL = { 'sobre-mesa': t('sobre la mesa, junto a la H', 'on the desk, by the H'), 'bajo-mesa': t('bajo la mesa · no se ve en la cámara', 'under the desk · not visible on camera'), pantalla: t('es su propia pantalla', 'is its own screen'), 'sobre-pantalla': t('encima de la H', 'on top of the H'), plano: t('según el plano', 'as per plan') };
  for (const d of escena.dispositivos) {
    filas.push(`<li><button type="button" data-sel="d:${esc(d.id)}"><b>${esc(d.itil || t('sin código', 'no code'))}</b><span>${esc(d.nombre)}</span><small>${esc(d.rol || d.categoria || '')} · ${esc(COL[d.colocacion] || d.colocacion)}${d.deducida ? ' · ' + t('posición deducida', 'derived position') : ''}</small></button></li>`);
  }
  $('inv-lista').innerHTML = filas.join('');
  $('inv-total').textContent = `${escena.pantallas.length + escena.dispositivos.length} CI`;
  $('inv-lista').addEventListener('click', e => { const b = e.target.closest('[data-sel]'); if (b) seleccionar(b.dataset.sel, { mostrar: true }); });
}

// ── Vistas ──
function montarVistas() {
  const b = (id, texto) => `<button type="button" data-vista="${id}" aria-pressed="false">${texto}</button>`;
  const alzados = escena.paredes.map(w => b(`alzado-${w.id}`, w.id)).join('');
  // Sin webcam en el plano (Starbucks) no hay vista de webcam ni encuadres que ofrecer.
  const conWebcam = Boolean(vistaWebcam(escena));
  $('vistas').innerHTML = b('orbital', t('Órbita', 'Orbit')) + (vistaPuerta(escena) ? b('puerta', t('Desde la puerta', 'From the door')) : '') +
    (conWebcam ? b('webcam', 'Webcam') + `<select id="pan" aria-label="${t('Encuadre de la webcam', 'Webcam framing')}">${PANES.map(([p, txt]) => `<option value="${p}">${esc(txt)}</option>`).join('')}</select>` : '') +
    b('planta', t('Planta', 'Plan')) + `<span class="sep">${t('Alzado', 'Elevation')}</span>${alzados}` +
    `<button type="button" id="ver-etiquetas" aria-pressed="${st.etiquetas}">${t('Etiquetas', 'Labels')}</button>`;
  $('vistas').addEventListener('click', e => {
    const v = e.target.closest('[data-vista]'); if (v) ponerVista(v.dataset.vista);
    if (e.target.id === 'ver-etiquetas') { st.etiquetas = !st.etiquetas; e.target.setAttribute('aria-pressed', String(st.etiquetas)); invalidar(); }
  });
  if (!conWebcam) return;
  if (!PANES.some(([p]) => p === st.pan)) $('pan').insertAdjacentHTML('afterbegin', `<option value="${st.pan}">webcam ${st.pan}°</option>`);
  $('pan').value = String(st.pan);
  $('pan').addEventListener('change', e => { st.pan = Number(e.target.value); ponerVista('webcam'); });
}

function ajustarOrbita() {
  const r = Math.hypot(escena.sala.ancho, escena.sala.fondo, escena.sala.alto) / 2;
  // campo útil: el de la zona libre (la vista se desplaza con setViewOffset)
  const vfTot = persp.fov * Math.PI / 180, hueco = st.orb.hueco || 1, aspect = st.orb.aspect || persp.aspect;
  const vf = 2 * Math.atan(Math.tan(vfTot / 2) * hueco), hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  st.orb.dist = r / Math.sin(Math.min(vf, hf) / 2) * 0.95;
}

function ponerVista(nombre, { url = true } = {}) {
  const pared = /^alzado-(.+)$/.exec(nombre || '')?.[1];
  let def = null;
  if (nombre === 'puerta') def = vistaPuerta(escena);
  else if (nombre === 'webcam') def = vistaWebcam(escena, { pan: st.pan, tilt: st.tilt, panCero: st.calibrar ? (PAN_CERO[plan.id] || 0) : 0 });
  else if (pared) def = vistaAlzado(escena, pared);
  if (!['orbital', 'planta'].includes(nombre) && !def) nombre = 'orbital';
  st.vista = nombre; st.def = def; st.orto = { zoom: 1, panX: 0, panY: 0 };
  if (nombre === 'orbital') { camara = persp; persp.fov = 40; st.orb.az = Number.isFinite(CFG.orbita?.az) ? CFG.orbita.az : Math.PI / 4; st.orb.el = Number.isFinite(CFG.orbita?.el) ? CFG.orbita.el : 0.92; persp.near = 0.05; persp.far = 80; redimensionarCamara(); ajustarOrbita(); }
  else if (def && def.tipo === 'perspectiva') {
    camara = persp; persp.near = 0.03; persp.far = 40;
    const p = V(...def.pos), o = V(...def.objetivo), d = o.clone().sub(p).normalize();
    st.mira.pos.copy(p); st.mira.yaw = Math.atan2(d.z, d.x); st.mira.pitch = Math.asin(d.y);
    st.mira.fovBase = def.fov; st.mira.hfovMin = nombre === 'webcam' ? 72 : 84; st.mira.zoom = 1;
  } else { camara = orto; }
  for (const b of document.querySelectorAll('[data-vista]')) b.setAttribute('aria-pressed', String(b.dataset.vista === nombre));
  $('pan')?.classList.toggle('activo', nombre === 'webcam');
  const nombres = { orbital: t('Órbita · arrastra para girar, rueda o pellizco para acercar', 'Orbit · drag to rotate, wheel or pinch to zoom'), puerta: CFG.puerta ? t(CFG.puerta.es, CFG.puerta.en) : t('Desde la puerta del pasillo · arrastra para mirar alrededor', 'From the corridor door · drag to look around'), webcam: `${t('Webcam PTZ', 'PTZ webcam')} · pan ${st.pan}° · tilt ${st.tilt}° · 72° × 44°${def?.panCero ? ` · ${t('cero del pan calibrado', 'pan zero calibrated')} ${def.panCero}°` : ''} · ${t('compárala con su foto', 'compare with its photo')}`, planta: t('Planta · vista cenital a escala', 'Plan · top view to scale') };
  $('hud').textContent = pared ? `${t('Alzado', 'Elevation')} · ${t('pared', 'wall')} ${pared} · ${def.nombre} · ${num(def.ancho)} × ${num(def.alto)} m · ${t('visto desde dentro, de a (izquierda) a b (derecha)', 'seen from inside, a (left) to b (right)')}` : nombres[nombre];
  stage.dataset.vista = nombre;
  if (url) { const u = new URL(location.href); u.searchParams.set('vista', nombre); if (nombre === 'webcam') u.searchParams.set('pan', String(st.pan)); else u.searchParams.delete('pan'); history.replaceState(null, '', u); }
  redimensionarCamara(); invalidar();
}

function redimensionar() {
  stage.style.setProperty('--vistas-h', `${$('vistas').offsetHeight || 52}px`);
  const r = stage.getBoundingClientRect();
  ancho = Math.max(1, Math.round(r.width)); alto = Math.max(1, Math.round(r.height));
  renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
  renderer.setSize(ancho, alto, false);
  redimensionarCamara(); if (st.vista === 'orbital') ajustarOrbita(); invalidar();
}

// Zona del lienzo que no tapan la ficha, el HUD, la barra de vistas ni el inventario abierto:
// la órbita, la planta y los alzados se encuadran ahí. Dos candidatas, debajo de la ficha o a su
// derecha; gana la que deja el contenido (cw × ch metros) más grande.
function zonaLibre(cw = 1, ch = 1) {
  const sr = stage.getBoundingClientRect();
  const rect = el => (el && !el.hidden && el.offsetParent ? el.getBoundingClientRect() : null);
  const ficha = rect(document.querySelector('.ficha-xpacio')), hud = rect($('hud')), vistas = rect($('vistas')), inv = rect($('inventario'));
  const arriba = r => r && (r.top + r.bottom) / 2 - sr.top < sr.height / 2;
  let b = 12, r = 12;
  for (const x of [hud, vistas]) if (x && !arriba(x)) b = Math.max(b, sr.bottom - x.top + 10);
  if (inv && inv.left - sr.left > sr.width * 0.5) r = Math.max(r, sr.right - inv.left + 10);
  const tope = (l, rr) => Math.max(12, ...[ficha, hud].filter(x => arriba(x) && x.right - sr.left > l && x.left - sr.left < ancho - rr).map(x => x.bottom - sr.top + 10));
  const candidatas = [{ t: tope(12, r), b, l: 12, r }];
  if (ficha) { const l = ficha.right - sr.left + 10; candidatas.push({ t: tope(l, r), b, l, r }); }
  const escala = z => Math.min((ancho - z.l - z.r) / cw, (alto - z.t - z.b) / ch);
  const z = candidatas.filter(c => ancho - c.l - c.r > 120 && alto - c.t - c.b > 120).sort((a, bb) => escala(bb) - escala(a))[0] || { t: 12, b: 12, l: 12, r: 12 };
  return z;
}

function redimensionarCamara() {
  const aspect = ancho / alto;
  persp.aspect = aspect;
  const caja = st.vista === 'planta' ? [escena.sala.ancho + 0.6, escena.sala.fondo + 0.6] : st.def?.tipo === 'alzado' ? [st.def.ancho + 0.9, st.def.alto + 0.5] : [1.25, 1];
  const z = zonaLibre(...caja), lw = ancho - z.l - z.r, lh = alto - z.t - z.b;
  if (st.vista === 'orbital') { persp.setViewOffset(ancho, alto, -(z.l - z.r) / 2, -(z.t - z.b) / 2, ancho, alto); st.orb.aspect = lw / lh; st.orb.hueco = lh / alto; }
  else persp.clearViewOffset();
  if (st.vista !== 'orbital' && st.def?.tipo === 'perspectiva') {
    // Al menos el campo de la cámara real: 72° de ancho en la webcam, 84° en la puerta.
    const minV = 2 * Math.atan(Math.tan(st.mira.hfovMin * Math.PI / 360) / aspect) * 180 / Math.PI;
    persp.fov = Math.min(100, Math.max(st.mira.fovBase, minV) / (st.mira.zoom || 1));
  }
  persp.updateProjectionMatrix();
  if (camara !== orto) return;
  const [w, h] = caja;
  // metros por píxel para que la sala (o la pared) quepa en la zona libre, y su centro en el de la zona
  const k = Math.max(w / lw, h / lh) / st.orto.zoom;
  const left = -(z.l + lw / 2) * k + st.orto.panX, top = (z.t + lh / 2) * k + st.orto.panY - (st.vista === 'planta' ? 0 : 0.08);
  Object.assign(orto, { left, right: left + ancho * k, top, bottom: top - alto * k });
  orto.updateProjectionMatrix();
}

function colocarCamara() {
  if (st.vista === 'orbital') {
    const { az, el, dist, objetivo } = st.orb;
    persp.position.set(objetivo.x + Math.cos(el) * Math.cos(az) * dist, objetivo.y + Math.sin(el) * dist, objetivo.z + Math.cos(el) * Math.sin(az) * dist);
    persp.up.set(0, 1, 0); persp.lookAt(objetivo);
  } else if (st.vista === 'planta') {
    const [cx, cy] = escena.sala.centro;
    orto.position.copy(V(cx, cy, 30)); orto.up.set(0, 0, -1); orto.near = 0.1; orto.far = 40; orto.lookAt(V(cx, cy, 0)); orto.updateProjectionMatrix();
  } else if (st.def?.tipo === 'alzado') {
    orto.position.copy(V(...st.def.pos)); orto.up.set(0, 1, 0); orto.near = st.def.near; orto.far = st.def.far; orto.lookAt(V(...st.def.objetivo)); orto.updateProjectionMatrix();
  } else {
    const { pos, yaw, pitch } = st.mira;
    persp.position.copy(pos); persp.up.set(0, 1, 0);
    persp.lookAt(pos.x + Math.cos(pitch) * Math.cos(yaw), pos.y + Math.sin(pitch), pos.z + Math.cos(pitch) * Math.sin(yaw));
  }
  camara.updateMatrixWorld(true);
}

// Corte de muñeca: desde fuera se ocultan las paredes que dan la espalda a la cámara.
function recortar() {
  const c = camara.position, x = c.x, y = c.z;
  const fuera = st.vista === 'orbital' || st.vista === 'puerta' || st.vista === 'webcam';
  for (const w of escena.paredes) {
    const g = s3d.paredes.get(w.id);
    g.visible = !fuera || (x - w.a[0]) * w.n[0] + (y - w.a[1]) * w.n[1] > -0.02;
  }
  const dentro = x > 0 && x < escena.sala.ancho && y > 0 && y < escena.sala.fondo && c.y < escena.sala.alto;
  s3d.techo.visible = s3d.lampara.visible = fuera && dentro;
}

function pintar() {
  pendiente = false;
  if (!renderer) return;
  colocarCamara(); recortar();
  renderer.render(s3d.scene, camara);
  pintarEtiquetas();
  if (s3d.hayVideo()) invalidar();   // un vídeo en vivo en una pantalla pide fotogramas
}

// ── Etiquetas ITIL ──
let etiquetas = [], reglas = [];
function crearEtiquetas() {
  capa.innerHTML = '';
  etiquetas = [];
  const publico = acceso !== 'sesion';
  for (const p of escena.pantallas) {
    const top = p.portatil ? p.z + p.h * Math.cos(0.2) + 0.04 : p.z1 + 0.04;
    const ov = p.portatil ? t('Portátil', 'Laptop') : p.orientacion === 'vertical' ? 'V' : 'H';
    etiquetas.push({ clave: `p:${p.id}`, tipo: 'pantalla', pared: p.pared, ancla: V(p.centro[0], p.centro[1], top),
      corto: publico ? `${ov} · ${num(p.pulgadas, 1)}″` : (p.itil || p.corto), largo: publico ? (p.player || t('pantalla', 'screen')) : (p.screenId || p.corto),
      medida: `s ${num(p.s)} · z ${num(p.z)}${publico ? '' : ` · ${num(p.pulgadas, 1)}″`}` });
  }
  for (const d of escena.dispositivos) {
    if (!d.pos) continue;
    const h = d.colocacion === 'pantalla' ? -0.07 : d.tam[1] + 0.03;
    const camara = /webcam|c[aá]mara/i.test(`${d.nombre} ${d.rol || ''}`);
    etiquetas.push({ clave: `d:${d.id}`, tipo: camara ? 'camara' : 'player', pared: d.pared, ancla: V(d.pos[0], d.pos[1], d.pos[2] + h),
      corto: publico ? (camara ? t('Cámara', 'Camera') : 'Player') : (d.itil || d.id), largo: publico ? (camara ? '' : d.nombre) : d.nombre, medida: '' });
  }
  for (const e of etiquetas) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = `etiqueta ${e.tipo}`; el.dataset.sel = e.clave;
    el.innerHTML = `<b>${esc(e.corto)}</b><span>${esc(e.largo)}</span><i>${esc(e.medida)}</i>`;
    el.addEventListener('click', ev => { ev.stopPropagation(); seleccionar(e.clave); });
    capa.append(el); e.el = el;
  }
}

function proyectar(v) {
  const p = v.clone().project(camara);
  return { x: (p.x + 1) / 2 * ancho, y: (1 - p.y) / 2 * alto, delante: p.z < 1 && p.z > -1 };
}

// En perspectiva, una etiqueta cuyo objeto tapa otra cosa (una hoja de puerta, un mueble) se atenúa.
function tapada(e) {
  if (camara !== persp) return false;
  const origen = camara.position, dir = e.ancla.clone().sub(origen), dist = dir.length();
  rayo.set(origen, dir.normalize()); rayo.near = 0; rayo.far = Math.max(0, dist - 0.15);
  const propio = n => { for (let m = n; m; m = m.parent) { if (m.userData.pantalla && `p:${m.userData.pantalla}` === e.clave) return true; if (m.userData.dispositivo && `d:${m.userData.dispositivo}` === e.clave) return true; } return false; };
  const visible = n => { for (let m = n; m; m = m.parent) if (!m.visible) return false; return true; };
  const hit = rayo.intersectObjects(s3d.root.children, true).some(h => h.object.isMesh && visible(h.object) && !propio(h.object));
  rayo.near = 0; rayo.far = Infinity;
  return hit;
}

function pintarEtiquetas() {
  for (const r of reglas) r.remove(); reglas = [];
  const alzado = st.def?.tipo === 'alzado' ? st.def.pared : null;
  stage.classList.toggle('detalle', !!alzado);
  const puestas = [];
  const visibles = etiquetas.map(e => {
    const muro = e.pared && s3d.paredes.get(e.pared);
    let ver = st.etiquetas && (!alzado || e.pared === alzado) && (alzado || st.vista === 'planta' || !muro || muro.visible);
    const p = ver ? proyectar(e.ancla) : null;
    if (p && (!p.delante || p.x < -40 || p.x > ancho + 40 || p.y < -20 || p.y > alto + 20)) ver = false;
    e.el.hidden = !ver;
    e.el.classList.toggle('sel', seleccion === e.clave);
    e.el.classList.toggle('tapada', ver && tapada(e));
    e.el.classList.toggle('vivo', senales.get(e.clave.slice(2))?.fuente === 'vivo');
    return ver ? { e, p } : null;
  }).filter(Boolean).sort((a, b) => a.p.y - b.p.y);
  for (const { e, p } of visibles) {
    const w = e.el.offsetWidth || 90, h = e.el.offsetHeight || 30;
    let x = p.x - w / 2, y = p.y - h;
    for (let i = 0; i < 12; i++) {
      const choca = puestas.find(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y);
      if (!choca) break;
      y = choca.y - h - 3;
    }
    puestas.push({ x, y, w, h });
    e.el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  }
  if (alzado) {
    const w = escena.paredes.find(x => x.id === alzado);
    const regla = (txt, v, cls) => { const p = proyectar(v); const el = document.createElement('span'); el.className = `regla ${cls}`; el.textContent = txt; el.style.transform = `translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`; capa.append(el); reglas.push(el); };
    for (let s = 0; s <= w.len + 1e-6; s += 0.5) { const pt = pointOnWall(w, Math.min(s, w.len)); regla(num(Math.min(s, w.len), 1), V(pt[0], pt[1], -0.06), 'abajo'); }
    for (let z = 0.5; z <= w.alto + 1e-6; z += 0.5) { const pt = pointOnWall(w, 0); regla(num(z, 1), V(pt[0], pt[1], z), 'izquierda'); }
    for (const h of w.huecos) { const pt = pointOnWall(w, h.desde + h.ancho / 2); regla(h.nombre || h.id, V(pt[0], pt[1], Math.min(w.alto - 0.12, (h.base || 0) + h.alto + 0.22)), 'hueco'); }
    const a = pointOnWall(w, 0), b = pointOnWall(w, w.len);
    regla('a', V(a[0], a[1], w.alto + 0.12), 'extremo'); regla('b', V(b[0], b[1], w.alto + 0.12), 'extremo');
  }
}

// ── Selección y ficha ──
function seleccionar(clave, { mostrar = false } = {}) {
  seleccion = clave;
  const [tipo, id] = clave.split(/:(.*)/s);
  const p = tipo === 'p' ? escena.pantallas.find(x => x.id === id) : null;
  const d = tipo === 'd' ? escena.dispositivos.find(x => x.id === id) : null;
  const o = p || d;
  if (!o) return;
  for (const b of document.querySelectorAll('#inv-lista [data-sel]')) b.classList.toggle('sel', b.dataset.sel === clave);
  const publico = acceso !== 'sesion';
  const senal = p ? senales.get(p.id) : null;
  const filas = p ? (publico ? [
    [t('Formato', 'Format'), `${num(p.pulgadas, 1)}″ · ${p.portatil ? t('portátil', 'laptop') : p.orientacion}`], ['Player', p.player || '—'],
    [t('Posición', 'Position'), `${t('pared', 'wall')} ${p.pared} · s ${num(p.s)} m · z ${num(p.z)} m`],
  ] : [
    [t('Código ITIL', 'ITIL code'), p.itil || '—'], ['screenId', p.screenId || '—'], [t('Mosaico', 'Mosaic'), p.grupoNombre || t('suelta', 'single')],
    ['Player', p.player || '—'], [t('Formato', 'Format'), `${num(p.pulgadas, 1)}″ · ${p.orientacion} · ${(p.resolucion || []).join('×')}`],
    [t('Posición', 'Position'), `${t('pared', 'wall')} ${p.pared} · s ${num(p.s)} m · z ${num(p.z)} m`],
    ['3D', `${t('a', 'at')} ${num(p.separacion)} m ${t('de la pared', 'from the wall')}${p.apoyo ? ` · ${t('sobre', 'on')} ${p.apoyo.id}` : ''}`],
    [t('Estado', 'Status'), p.estado || '—'],
    ...(p.screenId ? [['admira.tv', senal ? senal.rotulo : t('consultando…', 'checking…')]] : []),
  ]) : (publico ? [
    [t('Tipo', 'Type'), d.rol || d.categoria || '—'],
  ] : [
    [t('Código ITIL', 'ITIL code'), d.itil || '—'], [t('Categoría', 'Category'), d.categoria || '—'], [t('Rol', 'Role'), d.rol || '—'],
    [t('Colocación', 'Placement'), `${d.colocacion}${d.deducida ? ' · ' + t('deducida, por confirmar', 'derived, to be confirmed') : ''}`],
  ]);
  const enlaces = [];
  if (publico) enlaces.push(`<a href="${esc(LOGIN())}">${t('Entra con tu cuenta Admira para ver el inventario ITIL', 'Sign in with your Admira account to see the ITIL inventory')}</a>`);
  else enlaces.push(`<a href="${esc($('xp-yokup').href)}" target="_blank" rel="noopener">${t('Ver en Yokup (ITIL)', 'View in Yokup (ITIL)')} ↗</a>`);
  if (!publico && p?.textura) enlaces.push(`<a href="${esc(p.textura)}" target="_blank" rel="noopener">${t('Captura starbucks-six', 'starbucks-six capture')} ↗</a>`);
  if (!publico && p?.screenId) {
    const tv = urlAdmiraTv(p);
    enlaces.push(`<a href="${esc(tv.url)}" target="_blank" rel="noopener" title="${esc(tv.canal ? t('Canal del player virtual de esta pantalla', 'Virtual player channel for this screen') : t('Portada de admira.tv. El canal de una pantalla real emitiría como ella: hace falta un player virtual virtual-gdg51-* dado de alta en admira.tv/virtual-players.', 'admira.tv home. A real screen channel would broadcast as that screen: a virtual-gdg51-* virtual player registered in admira.tv/virtual-players is needed.'))}">${tv.canal ? t('Reproducir en admira.tv', 'Play on admira.tv') : 'admira.tv'} ↗</a>`);
  }
  $('detalle').innerHTML = `<div class="det-cab"><b>${esc(o.nombre)}</b><button type="button" id="det-cerrar" aria-label="${t('Cerrar', 'Close')}">×</button></div><dl>${filas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><p class="det-enlaces">${enlaces.join(' · ')}</p>`;
  $('detalle').hidden = false;
  $('det-cerrar').onclick = () => { $('detalle').hidden = true; seleccion = null; for (const b of document.querySelectorAll('#inv-lista [data-sel]')) b.classList.remove('sel'); invalidar(); };
  if (mostrar && innerWidth < 1100) alternarInventario(false); // en estrecho, el inventario tapa el alzado
  if (mostrar && o.pared && st.vista !== `alzado-${o.pared}`) ponerVista(`alzado-${o.pared}`);
  else invalidar();
}

// ── Gestos ──
const punteros = new Map();
let gesto = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture?.(e.pointerId); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  gesto = { x: e.clientX, y: e.clientY, movido: false, orb: { ...st.orb }, mira: { yaw: st.mira.yaw, pitch: st.mira.pitch }, orto: { ...st.orto }, pinza: distancia(), zoom: st.orto.zoom, dist: st.orb.dist, mzoom: st.mira.zoom || 1 };
});
canvas.addEventListener('pointermove', e => {
  if (!gesto || !punteros.has(e.pointerId)) return;
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const dx = e.clientX - gesto.x, dy = e.clientY - gesto.y;
  if (Math.hypot(dx, dy) > 4) gesto.movido = true;
  if (!gesto.movido) return;
  if (punteros.size > 1 && gesto.pinza > 0) { zoom(distancia() / gesto.pinza, gesto); return; }
  if (st.vista === 'orbital') { st.orb.az = gesto.orb.az + dx * 0.006; st.orb.el = Math.max(0.08, Math.min(1.5, gesto.orb.el + dy * 0.004)); }
  else if (camara === persp) { st.mira.yaw = gesto.mira.yaw - dx * 0.004; st.mira.pitch = Math.max(-1.3, Math.min(1.3, gesto.mira.pitch + dy * 0.004)); }
  else { st.orto.panX = gesto.orto.panX - dx / ancho * (orto.right - orto.left); st.orto.panY = gesto.orto.panY + dy / alto * (orto.top - orto.bottom); redimensionarCamara(); }
  invalidar();
});
const soltar = e => {
  if (gesto && !gesto.movido && punteros.size === 1) elegirEn(e.clientX, e.clientY);
  punteros.delete(e.pointerId); if (!punteros.size) gesto = null;
};
canvas.addEventListener('pointerup', soltar);
canvas.addEventListener('pointercancel', e => { punteros.delete(e.pointerId); gesto = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.0012)); }, { passive: false });
function distancia() { const [a, b] = [...punteros.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; }
function zoom(f, base) {
  if (st.vista === 'orbital') st.orb.dist = Math.max(1.5, Math.min(30, (base ? base.dist : st.orb.dist) / f));
  else if (camara === persp) st.mira.zoom = Math.max(0.6, Math.min(4, (base ? base.mzoom : st.mira.zoom || 1) * f));
  else st.orto.zoom = Math.max(0.5, Math.min(8, (base ? base.zoom : st.orto.zoom) * f));
  redimensionarCamara(); invalidar();
}
function elegirEn(cx, cy) {
  const r = canvas.getBoundingClientRect();
  rayo.setFromCamera(new T.Vector2((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1), camara);
  for (const hit of rayo.intersectObjects(s3d.root.children, true)) {
    let n = hit.object, oculto = false;
    for (let m = n; m; m = m.parent) if (!m.visible) oculto = true;
    if (oculto) continue;
    for (; n; n = n.parent) {
      if (n.userData.pantalla) return seleccionar(`p:${n.userData.pantalla}`);
      if (n.userData.dispositivo) return seleccionar(`d:${n.userData.dispositivo}`);
      if (n.userData.mueble) { status(escena.muebles.find(m => m.id === n.userData.mueble)?.nombre || n.userData.mueble); return; }
    }
  }
}

// ── Shell: ▤ Avanzado, idioma y verbos ──
const ACCIONES = { 'gdg-orbital': () => ponerVista('orbital'), 'gdg-puerta': () => ponerVista('puerta'), 'gdg-webcam': () => ponerVista('webcam'), 'gdg-planta': () => ponerVista('planta'), 'gdg-alzado-f': () => ponerVista('alzado-F'), 'gdg-alzado-i': () => ponerVista('alzado-I'), 'gdg-inventario': () => alternarInventario(true), 'gdg-etiquetas': () => $('ver-etiquetas')?.click() };
document.addEventListener('click', e => { const a = e.target.closest('[id]'); if (a && ACCIONES[a.id] && !a.closest('#gemelo')) ACCIONES[a.id](); });
function alternarInventario(forzar) {
  const abierto = forzar ?? $('inventario').hidden;
  if (abierto && acceso !== 'sesion') { status(t('El inventario ITIL necesita sesión: entra con tu cuenta Admira.', 'The ITIL inventory needs a session: sign in with your Admira account.')); return; }
  $('inventario').hidden = !abierto; $('inv-toggle').setAttribute('aria-expanded', String(abierto));
  if (renderer) { redimensionarCamara(); if (st.vista === 'orbital') ajustarOrbita(); invalidar(); }
}
$('inv-toggle').addEventListener('click', () => alternarInventario());
$('inv-cerrar').addEventListener('click', () => alternarInventario(false));
if (params.get('inventario') === '1') alternarInventario(true);
window.addEventListener('admira:languagechange', e => { const next = e.detail?.lang; if (['es', 'en'].includes(next) && next !== (en ? 'en' : 'es')) { const u = new URL(location.href); u.searchParams.set('lang', next); location.assign(u.href); } });
(function registrar(intentos = 0) {
  if (!window.XpaceShell?.registerVerb) { if (intentos < 50) setTimeout(() => registrar(intentos + 1), 100); return; }
  window.XpaceShell.registerVerb({ id: 'vista', es: 'Vista del gemelo: orbital, puerta, webcam [pan], planta o alzado <F|D|P|I>', en: 'Twin view: orbital, puerta, webcam [pan], planta or alzado <F|D|P|I>', run: args => {
    const [v, x] = String(args || '').trim().toLowerCase().split(/\s+/);
    if (v === 'alzado' && x) { ponerVista(`alzado-${x.toUpperCase()}`); return st.vista; }
    if (v === 'webcam' && Number.isFinite(Number(x))) st.pan = Number(x);
    ponerVista(v || 'orbital'); return st.vista;
  } });
})();

arrancar();
