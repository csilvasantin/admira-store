// Visor de los centros reales de Starbucks: la geometría del Arquitecto (cajas estimadas desde el
// panorama) con las playlists reproduciéndose de verdad en sus pantallas, en 3D y en Matrix.
// Matrix (Carlos, 15-oct-2026) es la foto 360 real del local (panorama.mjs) si el centro la tiene.
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import { crearPanorama } from './panorama.mjs?v=sc-pano-2';
import { montarCombos } from '/assets/xpace-combos.mjs?v=puerta-1';
import { montarVentanas } from './ventanas.mjs?v=sc-vent-2';
import { centroDesdeURL } from './centros.mjs?v=sc-2';
import { crearReproductor, validarPrograma, ajusteSinRecorte, marcasDe, cicloDe, programaDesdeMCP, piezaDe } from './reproductor.mjs?v=sc-1';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const BASE = new URL('./', location.href).href;
const VERDE = '#00e293';
const fmt = s => (Math.max(0, s)).toFixed(1).replace('.', ',');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const lienzo = $('#lienzo');
const renderer = new T.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(48, 1, 0.05, 120);
const pano = crearPanorama(T, renderer);
// ¿Se ve ahora la foto 360? (Matrix en un centro con panorama).
const enPanorama = () => modo === 'matrix' && !!(centro && centro.panorama);

let combos = null; // los tres combos de la barra (más abajo)
let CENTROS = [], centroElegido = null, centro = null, geo = null, rep = null, programas = [], programaActivo = null;
let modo = params.get('modo') === 'matrix' || (!params.get('modo') && params.get('quality') === 'matrix') ? 'matrix' : '3d';
let raiz = null, pantallasVisor = [], seleccion = null, vistas = {};
const texturas = new Map(); // src → VideoTexture

// ───────────────────────────── Cámara orbital con transiciones ─────────────────────────────
let vistaActual = null;
function aplicarRecorte() {
  const on = vistas[vistaActual] && vistas[vistaActual].recorte && recorteZ != null;
  if (on) planoRecorte.constant = recorteZ;
  renderer.clippingPlanes = on ? [planoRecorte] : [];
}
const cam = { yaw: 0.5, pitch: 0.55, dist: 18, target: new T.Vector3(0, 1, -1) };
let anim = null;
function ponerCamara() {
  const { yaw, pitch, dist, target } = cam;
  camera.position.set(target.x + dist * Math.sin(yaw) * Math.cos(pitch), target.y + dist * Math.sin(pitch), target.z + dist * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(target);
}
function irVista(nombre, inmediato = false) {
  const v = vistas[nombre]; if (!v) return;
  document.querySelectorAll('button[data-vista]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === nombre)));
  const fin = { yaw: v.yaw, pitch: v.pitch, dist: v.dist, target: v.target.clone() };
  vistaActual = nombre; aplicarRecorte();
  if (inmediato) { Object.assign(cam, fin); anim = null; return; }
  anim = { t0: performance.now(), dur: 900, ini: { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, target: cam.target.clone() }, fin };
  actualizarURL({ vista: nombre });
}
function animar(now) {
  if (!anim) return;
  const k = Math.min(1, (now - anim.t0) / anim.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const { ini, fin } = anim;
  cam.yaw = ini.yaw + (fin.yaw - ini.yaw) * e; cam.pitch = ini.pitch + (fin.pitch - ini.pitch) * e; cam.dist = ini.dist + (fin.dist - ini.dist) * e;
  cam.target.lerpVectors(ini.target, fin.target, e);
  if (k >= 1) anim = null;
}
(function controles() {
  const punteros = new Map(); let movido = false, pinza = 0;
  lienzo.addEventListener('pointerdown', e => { punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = false; lienzo.setPointerCapture(e.pointerId); anim = null; });
  lienzo.addEventListener('pointerup', e => {
    punteros.delete(e.pointerId); pinza = 0; if (movido) return;
    if (!enPanorama()) { elegir(e); return; }
    // En la foto 360 también se toca una pantalla para ver su playlist.
    const r = lienzo.getBoundingClientRect();
    seleccionar(pano.elegir((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2));
  });
  lienzo.addEventListener('pointercancel', e => { punteros.delete(e.pointerId); pinza = 0; });
  lienzo.addEventListener('pointermove', e => {
    const p = punteros.get(e.pointerId);
    if (!p) { if (!enPanorama()) hover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (enPanorama()) {
      if (Math.abs(dx) + Math.abs(dy) > 3) movido = true;
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()]; p.x = e.clientX; p.y = e.clientY;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinza) pano.acercar(pinza / d);
        pinza = d; return;
      }
      pano.girar(dx, dy, lienzo.clientHeight); p.x = e.clientX; p.y = e.clientY; return;
    }
    if (Math.abs(dx) + Math.abs(dy) > 3 && !movido) { movido = true; if (vistaActual) { vistaActual = null; aplicarRecorte(); document.querySelectorAll('button[data-vista]').forEach(b => b.setAttribute('aria-pressed', 'false')); } }
    if (punteros.size === 2) {
      const [a, b] = [...punteros.values()]; p.x = e.clientX; p.y = e.clientY;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinza) cam.dist = Math.max(2.5, Math.min(40, cam.dist * pinza / d));
      pinza = d; return;
    }
    cam.yaw -= dx * 0.006; cam.pitch = Math.max(-0.15, Math.min(1.45, cam.pitch + dy * 0.006));
    p.x = e.clientX; p.y = e.clientY;
  });
  lienzo.addEventListener('wheel', e => { e.preventDefault(); if (enPanorama()) { pano.acercar(Math.exp(e.deltaY * 0.0012)); return; } anim = null; cam.dist = Math.max(2.5, Math.min(40, cam.dist * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
})();

// ───────────────────────────── Escena desde la geometría del Arquitecto ─────────────────────────────
function liberar(obj) {
  obj.traverse(o => { o.geometry && o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; ms.forEach(m => { m.map && !texturas.has(m.map.userData.src) && m.map.dispose(); m.dispose(); }); });
}

function placaTexto(lineas, { fondo = '#0b2a22', tinta = '#e9f5ef', acento = VERDE } = {}) {
  const c = document.createElement('canvas'); c.width = 540; c.height = 960;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 960); grad.addColorStop(0, fondo); grad.addColorStop(1, '#03110c');
  g.fillStyle = grad; g.fillRect(0, 0, 540, 960);
  g.strokeStyle = acento; g.lineWidth = 6; g.strokeRect(18, 18, 504, 924);
  g.fillStyle = tinta; g.textAlign = 'center';
  lineas.forEach((l, i) => { g.font = `${i === 0 ? 700 : 500} ${i === 0 ? 46 : 32}px system-ui, sans-serif`; g.fillText(l, 270, 430 + i * 58); });
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function numeroSprite(n) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#021a12e6'; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill();
  g.strokeStyle = VERDE; g.lineWidth = 6; g.stroke(); g.fillStyle = '#d9fff0'; g.font = '700 64px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 68);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false }));
  s.scale.set(0.24, 0.24, 1); s.renderOrder = 10; return s;
}

function construir() {
  if (raiz) { scene.remove(raiz); liberar(raiz); }
  raiz = new T.Group(); scene.add(raiz);
  const solido = new T.Group(), lineas = new T.Group(); raiz.add(solido, lineas);
  raiz.userData = { solido, lineas };
  const idsPantalla = new Set(geo.screens.flatMap(s => [s.id, s.id + '-frame']));
  const matLinea = new T.LineBasicMaterial({ color: VERDE, transparent: true, opacity: 0.8, toneMapped: false });
  const matLineaTenue = new T.LineBasicMaterial({ color: VERDE, transparent: true, opacity: 0.32, toneMapped: false });

  for (const b of geo.geometry) {
    if (idsPantalla.has(b.id)) continue;
    const g = new T.BoxGeometry(...b.size);
    const vidrio = b.opacity < 1;
    const luz = /lightline/.test(b.id);
    const mat = vidrio
      ? new T.MeshPhysicalMaterial({ color: b.color, transparent: true, opacity: Math.max(0.16, b.opacity), roughness: 0.08, metalness: 0, depthWrite: false })
      : new T.MeshStandardMaterial({ color: b.color, roughness: /counter-top|glass/.test(b.id) ? 0.4 : 0.82, metalness: 0.02, emissive: luz ? b.color : '#000000', emissiveIntensity: luz ? 2.2 : 0 });
    const m = new T.Mesh(g, mat);
    m.position.fromArray(b.position); m.rotation.set(...(b.rotation || [0, 0, 0]));
    m.castShadow = !vidrio && b.id !== 'floor'; m.receiveShadow = true;
    m.userData.id = b.id; solido.add(m);
    const l = new T.LineSegments(new T.EdgesGeometry(g), vidrio || /product|pastry-\d/.test(b.id) ? matLineaTenue : matLinea);
    l.position.copy(m.position); l.rotation.copy(m.rotation); lineas.add(l);
  }

  // Suelo de Matrix: retícula a la medida de la sala.
  const sala = geo.room || { width: 12, depth: 12, height: 3.8 };
  const reticula = new T.GridHelper(Math.max(sala.width, sala.depth) + 6, Math.round((Math.max(sala.width, sala.depth) + 6) * 2), 0x00e293, 0x0d3a2b);
  reticula.material.transparent = true; reticula.material.opacity = 0.55; reticula.position.y = 0.002; lineas.add(reticula);

  // ── Pantallas: marco, cristal negro y el contenido encajado sin recorte ──
  pantallasVisor = [];
  for (const s of geo.screens) {
    const asoc = programaActivo.asociaciones.find(a => a.pantalla === s.id);
    const formato = (asoc && asoc.formato) || [1080, 1920];
    const alto = s.size[1], ancho = alto * formato[0] / formato[1]; // superficie al aspecto real del panel
    const bisel = 0.022, fondo = 0.05;
    const g = new T.Group(); g.position.fromArray(s.position); g.userData.pantalla = s.id;
    const marco = new T.Mesh(new T.BoxGeometry(ancho + 2 * bisel, alto + 2 * bisel, fondo), new T.MeshStandardMaterial({ color: '#111413', roughness: 0.45, metalness: 0.3 }));
    marco.castShadow = true; marco.userData.pantalla = s.id;
    const cristal = new T.Mesh(new T.PlaneGeometry(ancho, alto), new T.MeshBasicMaterial({ color: '#020403', toneMapped: false, fog: false }));
    cristal.position.z = fondo / 2 + 0.0015; cristal.userData.pantalla = s.id;
    const contenido = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    contenido.position.z = fondo / 2 + 0.003; contenido.scale.set(ancho, alto, 1); contenido.userData.pantalla = s.id;
    const borde = new T.LineSegments(new T.EdgesGeometry(marco.geometry), new T.LineBasicMaterial({ color: '#6dffc4', toneMapped: false }));
    borde.visible = false;
    const numero = numeroSprite(asoc ? asoc.posicion : '?'); numero.position.set(0, alto / 2 + 0.2, 0.05);
    g.add(marco, cristal, contenido, borde, numero);
    raiz.add(g);
    pantallasVisor.push({
      id: s.id, grupo: s.group, asoc, ancho, alto, medida: s.size, g, marco, contenido, borde, numero,
      cargando: placaTexto(['Cargando', s.id]), fallo: null, ultima: null, ajuste: null,
    });
  }

  // ── Luz: cálida, con sombras suaves; las pantallas son luz propia (sin tono) ──
  const hemi = new T.HemisphereLight('#fff3dd', '#2e2a24', 1.15);
  const sol = new T.DirectionalLight('#ffe7c4', 2.1);
  const ext = Math.max(sala.width, sala.depth);
  sol.position.set(ext * 0.35, 9, ext * 0.55); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  Object.assign(sol.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 40 });
  solido.add(hemi, sol);
  const xs = geo.screens.map(s => s.position[0]), zs = geo.screens.map(s => s.position[2]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, zp = Math.max(...zs);
  for (const dx of [-2.6, 0, 2.6]) { const p = new T.PointLight('#ffd6a0', 7, 7, 1.7); p.position.set(cx + dx, (sala.height || 3.8) - 0.35, zp + 2.2); solido.add(p); }

  calcularVistas();
  aplicarModo();
}

// Una vista es la cámara en un punto mirando a otro: de ahí salen órbita, altura y distancia.
function desde(pos, target) {
  const d = new T.Vector3().subVectors(pos, target), dist = d.length();
  return { yaw: Math.atan2(d.x, d.z), pitch: Math.asin(d.y / dist), dist, target };
}
let recorteZ = null; const planoRecorte = new T.Plane(new T.Vector3(0, 0, -1), 0);
function calcularVistas() {
  const xs = geo.screens.map(s => s.position[0]), ys = geo.screens.map(s => s.position[1]), zs = geo.screens.map(s => s.position[2]);
  const minX = Math.min(...xs) - 0.45, maxX = Math.max(...xs) + 0.45, cy = ys.reduce((a, b) => a + b, 0) / ys.length, z = Math.max(...zs);
  const cx = (minX + maxX) / 2, sala = geo.room || { width: 12, depth: 12, height: 3.8 };
  // Frente del mostrador: la caja «counter» que más sale hacia la sala.
  const frenteDe = re => { const f = geo.geometry.filter(b => re.test(b.id)).map(b => b.position[2] + b.size[2] / 2); return f.length ? Math.max(...f) : z + 2; };
  const frente = frenteDe(/^counter/);
  // En la vista de pantallas se quita lo que hay delante del mostrador y de la vitrina (enteros).
  recorteZ = Math.max(frente, frenteDe(/^(counter|pastry)/)) + 0.35;
  const asp = Math.max(0.45, camera.aspect || 1), fov = T.MathUtils.degToRad(camera.fov);
  const dAncho = (maxX - minX) * 1.12 / (2 * Math.tan(fov / 2) * asp), dAlto = 2.2 / (2 * Math.tan(fov / 2));
  const dPant = Math.max(dAncho, dAlto, 2.4);
  const tPant = new T.Vector3(cx, cy - 0.05, z);
  vistas = {
    pantallas: desde(new T.Vector3(cx, cy + 0.1, z + dPant), tPant),
    // Cliente: de pie (ojos a 1,60 m) a un paso del mostrador, un poco a la derecha, mirando arriba.
    cliente: desde(new T.Vector3(cx + 0.7, 1.6, frente + 2.4), new T.Vector3(cx, cy - 0.15, z)),
    general: desde(new T.Vector3(sala.width * 0.62, (sala.height || 3.8) * 2.5, sala.depth * 0.95), new T.Vector3(0, 0.6, -0.8)),
  };
  vistas.pantallas.recorte = true;
}

function aplicarModo() {
  const matrix = modo === 'matrix';
  document.documentElement.dataset.escena = modo;
  // Matrix con foto 360: las vistas de cámara del 3D (Cliente, Pantallas, General) no aplican.
  document.documentElement.dataset.panorama = enPanorama() ? '1' : '0';
  if (enPanorama()) { pano.cargar(centro.panorama); lienzo.style.cursor = 'grab'; }
  document.querySelectorAll('button[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
  if (!raiz) return;
  raiz.userData.solido.visible = !matrix;
  raiz.userData.lineas.visible = matrix;
  scene.background = new T.Color(matrix ? '#010a06' : '#121a17');
  scene.fog = matrix ? new T.Fog('#010a06', 14, 46) : null;
  renderer.toneMappingExposure = matrix ? 1 : 1.05;
  for (const p of pantallasVisor) {
    p.marco.material.color.set(matrix ? '#02140d' : '#111413');
    p.borde.visible = matrix || seleccion === p.id;
    p.borde.material.color.set(seleccion === p.id ? '#ffffff' : '#6dffc4');
    p.numero.visible = matrix || params.get('numeros') === '1';
  }
  actualizarURL({ modo });
  if (combos) combos.actualizar();
}

// ───────────────────────────── Texturas de vídeo por pantalla ─────────────────────────────
function texturaDe(m) {
  let t = texturas.get(m.src);
  if (!t) {
    t = new T.VideoTexture(m.video); t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = false;
    t.userData.src = m.src; texturas.set(m.src, t);
  }
  return t;
}
function actualizarPantallas() {
  for (const p of pantallasVisor) {
    const m = rep && rep.medioDe(p.id);
    let tex;
    if (!m) tex = p.cargando;
    else if (m.estado === 'error') tex = p.fallo || (p.fallo = placaTexto(['Pieza no disponible', p.id, `error ${m.error || ''}`], { fondo: '#2a1010', acento: '#ff7a6b' }));
    else if (m.video.readyState >= 2) tex = texturaDe(m);
    else tex = p.ultima || p.cargando; // mantiene el último fotograma hasta que la pieza nueva tenga imagen
    if (p.contenido.material.map !== tex) { p.contenido.material.map = tex; p.contenido.material.needsUpdate = true; }
    if (tex instanceof T.VideoTexture) p.ultima = tex;
    // Encaje sin recorte: nativo si el medio tiene el aspecto del panel; bandas si no.
    const medio = m && m.video.videoWidth ? [m.video.videoWidth, m.video.videoHeight] : m ? [m.pieza.ancho, m.pieza.alto] : [p.ancho, p.alto];
    const aj = ajusteSinRecorte([p.ancho, p.alto], medio);
    p.ajuste = { ...aj, medio };
    p.contenido.scale.set(p.ancho * aj.escala[0], p.alto * aj.escala[1], 1);
  }
}

// ───────────────────────────── Interfaz ─────────────────────────────
function actualizarURL(cambios) {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries(cambios)) v == null ? u.searchParams.delete(k) : u.searchParams.set(k, v);
  history.replaceState(null, '', u);
}

function pintarCentros() {
  $('#centros').innerHTML = CENTROS.map(c => `<button type="button" role="tab" data-centro="${c.id}" aria-selected="${c.id === centroElegido}">${esc(c.nombre)}${c.catalogo ? `<small>${esc(c.catalogo)}</small>` : c.enlace ? '<small>laboratorio</small>' : '<small>sin catálogo</small>'}</button>`).join('');
}

function pintarFicha() {
  $('#titulo').textContent = `Starbucks · ${centro.nombre}`;
  $('#identidad').textContent = centro.identidad;
  const ref = centro.referencia;
  $('#referencia').innerHTML = [ref && `<a href="${esc(ref.src)}" target="_blank" rel="noopener">${esc(ref.titulo)}</a>`, centro.gemeloMatrix && `<a href="${esc(centro.gemeloMatrix)}">Gemelo Matrix completo →</a>`].filter(Boolean).join(' · ');
  $('#programa').innerHTML = programas.map(p => `<option value="${esc(p.id)}"${p.id === programaActivo.id ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('');
  $('#programa').hidden = programas.length < 2;
  const marcas = marcasDe(programaActivo);
  $('#tramos').innerHTML = marcas.map(m => `<span class="tramo ${m.tipo}" style="flex:${m.fraccion}" title="${esc(m.nombre)}">${esc(m.nombre)}</span>`).join('');
  const f = programaActivo.fuente || {};
  const origen = f.tipo === 'mcp' ? `MCP · ${f.playlist} · rev. ${f.revision}${f.vivo ? ' · en vivo' : ' · copia'}` : f.tipo === 'campana' ? `campaña ${f.campana} · rev. ${programaActivo.revision}` : `adaptación propia · rev. ${programaActivo.revision}`;
  $('#fuente').textContent = `${origen} · ciclo ${fmt(cicloDe(programaActivo))} s · vinculación física ${programaActivo.vinculacionFisica}`;
  pintarDetalle();
}

function pintarLista() {
  if (!rep) return;
  const est = rep.estado();
  $('#lista').innerHTML = est.pantallas.map((s, i) => {
    const p = pantallasVisor.find(x => x.id === s.id), a = p && p.asoc;
    const deriva = s.deriva != null && params.get('diag') === '1' ? ` <em>${Math.round(s.deriva * 1000)} ms</em>` : '';
    return `<li class="${s.estado || 'cargando'}${seleccion === s.id ? ' sel' : ''}" data-pantalla="${esc(s.id)}"><b>${a ? a.posicion : i + 1}</b><span>${esc(s.pieza ? s.pieza.titulo : '—')}${deriva}</span></li>`;
  }).join('');
}

function pintarDetalle() {
  const p = pantallasVisor.find(x => x.id === seleccion);
  if (!p) { $('#detalle').innerHTML = '<p class="suave">Toca una pantalla para ver su playlist y la pieza que suena.</p>'; return; }
  const m = rep && rep.medioDe(p.id), a = p.asoc || {};
  const pz = m ? m.pieza : null, aj = p.ajuste || {};
  const res = m && m.video.videoWidth ? `${m.video.videoWidth}×${m.video.videoHeight}` : pz ? `${pz.ancho}×${pz.alto}` : '—';
  $('#detalle').innerHTML = `<h2>${esc(p.id)}</h2><dl>
    <dt>Posición</dt><dd>${esc(a.posicion)} de ${pantallasVisor.length} · grupo de ${esc(p.grupo)}</dd>
    <dt>Playlist</dt><dd>${esc(a.canal)} · ${esc(a.origen)}</dd>
    <dt>Ahora</dt><dd>${esc(pz ? pz.titulo : '—')}</dd>
    <dt>Medio</dt><dd>${res} · ${aj.modo === 'nativo' ? 'nativo, sin recorte' : 'encajado con bandas, sin recorte'}</dd>
    <dt>Panel</dt><dd>${p.ancho.toFixed(3).replace('.', ',')} × ${p.alto.toFixed(2).replace('.', ',')} m (estimado ${p.medida[0].toString().replace('.', ',')} × ${p.medida[1].toString().replace('.', ',')} m, llevado a 9:16)</dd>
    <dt>Dispositivo</dt><dd>${a.dispositivoFisico ? esc(a.dispositivoFisico) : 'pendiente de verificar'}</dd></dl>`;
}

function pintarReproductor() {
  if (!rep) return;
  const est = rep.estado(), pos = est.pos;
  $('#play').textContent = est.pausado ? '▶' : '❚❚';
  $('#play').setAttribute('aria-label', est.pausado ? 'Reproducir' : 'Pausa');
  $('#cabezal').style.left = `${(((est.t % est.ciclo) + est.ciclo) % est.ciclo) / est.ciclo * 100}%`;
  $('#tiempo').textContent = `${fmt(pos.local)} / ${fmt(pos.segundos)} s`;
  const pz = pos.tramo.tipo === 'individual' ? piezaDe(pos.tramo, pantallasVisor[0] && pantallasVisor[0].id) : null;
  $('#pieza').textContent = `${pos.tramo.tipo === 'mural' ? 'Mural sincronizado · una pieza por pantalla' : `Pieza común · ${pz ? pz.titulo : pos.tramo.nombre}`} · vuelta ${pos.vuelta + 1}`;
  document.querySelectorAll('#tramos .tramo').forEach((el, i) => el.classList.toggle('activo', i === pos.indice));
  const n = est.errores.length;
  $('#avisos').textContent = n ? `${n} pieza${n > 1 ? 's' : ''} sin cargar: ${est.errores.map(e => e.titulo).join(' · ')}` : '';
}

function elegir(e) {
  const r = lienzo.getBoundingClientRect();
  const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), camera);
  const hit = ray.intersectObjects(pantallasVisor.flatMap(p => [p.contenido, p.marco]), false)[0];
  seleccionar(hit ? hit.object.userData.pantalla : null);
}
function hover(e) {
  const r = lienzo.getBoundingClientRect();
  const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), camera);
  lienzo.style.cursor = ray.intersectObjects(pantallasVisor.map(p => p.contenido), false).length ? 'pointer' : 'grab';
}
function seleccionar(id) {
  seleccion = id; aplicarModo(); pintarDetalle(); pintarLista();
}

// ───────────────────────────── Carga de centro y programa ─────────────────────────────
async function json(url) { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }

async function cargarCentro(id) {
  const c = CENTROS.find(x => x.id === id) || CENTROS[0];
  centroElegido = c.id;
  if (combos) combos.actualizar();
  if (c.enlace) { pintarCentros(); mostrarEnlace(c); actualizarURL({ centro: c.id, venue: null, loc: null }); return; }
  $('#enlace').hidden = true; $('#sc').classList.remove('con-enlace');
  centro = c; pintarCentros(); actualizarURL({ centro: c.id, venue: null, loc: null });
  aviso('Cargando el modelo y las playlists…');
  geo = await json(c.geometria);
  programas = await Promise.all(c.programas.map(json));
  const elegido = params.get('programa');
  await activarPrograma(programas.find(p => p.id === elegido) || programas[0], { vista: params.get('vista') || 'cliente' });
}

async function activarPrograma(p, { vista = null } = {}) {
  if (p.fuente && p.fuente.tipo === 'mcp') {
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 4000);
      const estado = await fetch(p.fuente.url, { signal: ctl.signal, cache: 'no-cache' }).then(r => r.json()); clearTimeout(tm);
      const vivo = programaDesdeMCP(estado, p);
      if (vivo) p = vivo; else aviso('El MCP no trae seis pistas de sincroIA: se usa la copia guardada.');
    } catch { aviso('El MCP no responde: se usa la copia guardada de la playlist.'); }
  }
  const errores = validarPrograma(p, geo.screens);
  if (errores.length) { aviso(`Programa no válido: ${errores.join(' · ')}`, true); return; }
  if (rep) rep.destruir();
  for (const t of texturas.values()) t.dispose(); texturas.clear();
  programaActivo = p; seleccion = null;
  actualizarURL({ programa: p.id === (programas[0] && programas[0].id) ? null : p.id });
  construir();
  if (vista) irVista(vistas[vista] ? vista : 'cliente', true);
  rep = crearReproductor({
    programa: p, base: BASE,
    avisar: (tipo, d) => {
      if (tipo === 'bloqueado') $('#gesto').hidden = false;
      if (tipo === 'desbloqueado') $('#gesto').hidden = true;
      if (tipo === 'error') { console.warn('[starbucks-centros] pieza sin cargar', d.src, d.error); pintarReproductor(); }
      if (tipo === 'tramo') { pintarLista(); pintarDetalle(); }
      if (tipo === 'listo') aviso('');
    },
  });
  pintarFicha(); pintarLista();
  aviso('Preparando las seis pantallas para que arranquen a la vez…');
  await rep.iniciar();
}

function mostrarEnlace(c) {
  const e = $('#enlace');
  e.innerHTML = `<h2>${esc(c.nombre)}</h2><p>${esc(c.identidad)}</p><p class="pendiente">${esc(c.pendiente)}</p><p><a class="boton" href="${esc(c.enlace)}">Abrir su gemelo 3D →</a></p>`;
  e.hidden = false;
  // El centro anterior queda en pausa y atenuado detrás de la tarjeta.
  if (rep) rep.pausar();
  document.querySelector('#sc').classList.add('con-enlace');
}

let avisoT = 0;
function aviso(texto, fijo = false) {
  const el = $('#aviso'); el.textContent = texto; el.hidden = !texto;
  clearTimeout(avisoT); if (texto && !fijo) avisoT = setTimeout(() => { el.hidden = true; }, 6000);
}

// ───────────────────────────── Bucle ─────────────────────────────
function redimensionar() {
  const r = lienzo.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
  pano.aspecto(r.width / Math.max(1, r.height));
  if (geo) { calcularVistas(); aplicarRecorte(); }
}
new ResizeObserver(redimensionar).observe(lienzo);

let ultimaUI = 0;
function bucle(now) {
  requestAnimationFrame(bucle);
  if (rep) rep.tick();
  actualizarPantallas();
  animar(now); ponerCamara();
  if (enPanorama()) {
    // Las pantallas de la foto emiten lo mismo que las del 3D (la textura que ya tiene cada una).
    for (const p of pantallasVisor) pano.pintarPantalla(p.id, p.contenido.material.map);
    pano.resaltar(seleccion);
    pano.render();
  } else renderer.render(scene, camera);
  if (now - ultimaUI > 200) { ultimaUI = now; pintarReproductor(); if (params.get('diag') === '1' || seleccion) { pintarLista(); pintarDetalle(); } }
}

// ───────────────────────────── Arranque ─────────────────────────────
$('#play').onclick = () => { if (!rep) return; rep.pausado ? rep.reproducir() : rep.pausar(); pintarReproductor(); };
$('#reiniciar').onclick = () => { rep && rep.reiniciar(); };
$('#siguiente').onclick = () => { rep && rep.siguiente(); };
$('#programa').onchange = e => activarPrograma(programas.find(p => p.id === e.target.value));
$('#gesto').onclick = () => { $('#gesto').hidden = true; rep && rep.desbloquear(); };
document.addEventListener('click', e => {
  const b = e.target.closest('button[data-centro],button[data-modo],button[data-vista],#lista li');
  if (!b) return;
  if (b.dataset.centro) cargarCentro(b.dataset.centro);
  else if (b.dataset.modo) { modo = b.dataset.modo; aplicarModo(); }
  else if (b.dataset.vista) irVista(b.dataset.vista);
  else if (b.dataset.pantalla) seleccionar(b.dataset.pantalla);
});
document.addEventListener('keydown', e => {
  if (e.target.closest('select,input')) return;
  if (e.key === ' ') { e.preventDefault(); $('#play').click(); }
  else if (e.key === 'm' || e.key === 'M') { modo = modo === 'matrix' ? '3d' : 'matrix'; aplicarModo(); }
  else if (e.key === 'r' || e.key === 'R') $('#reiniciar').click();
  else if (e.key === 'ArrowRight') $('#siguiente').click();
});

// Para comprobar la sincronía desde la consola (y en las pruebas en el navegador).
window.__starbucksCentros = {
  get centro() { return centro && centro.id; }, get modo() { return modo; },
  get panorama() { return enPanorama() ? { cargada: pano.cargada, vista: { ...pano.vista } } : null; }, get programa() { return programaActivo && programaActivo.id; },
  estado: () => rep && rep.estado(),
  muestras: () => pantallasVisor.map(p => { const m = rep && rep.medioDe(p.id); return m && { pantalla: p.id, src: m.src, t: m.video.currentTime, listo: m.video.readyState, pausado: m.video.paused, ritmo: m.video.playbackRate, imagen: p.contenido.material.map === p.cargando ? 'cargando' : p.contenido.material.map instanceof T.VideoTexture ? (p.contenido.material.map.userData.src === m.src ? 'video' : 'video-anterior') : 'fallo', deriva: m.deriva, ajuste: p.ajuste && p.ajuste.modo, medio: p.ajuste && p.ajuste.medio }; }),
  rep: () => rep,
  // Imagen del 3D a la resolución del lienzo (para capturas de verificación).
  imagen: () => new Promise(r => { renderer.render(scene, camera); lienzo.toBlob(r, 'image/png'); }),
};

// Los tres combos de la barra (Xpacio · Local · Calidad), como en el gemelo. Un local de esta misma página
// cambia de centro aquí; Calidad Matrix es la foto 360 y las otras tres, el 3D.
combos = montarCombos({
  proyecto: 'starbucks',
  local: () => (CENTROS.find(c => c.id === centroElegido) || {}).locales || [],
  calidad: () => (modo === 'matrix' ? 'matrix' : (['good', 'better', 'best'].includes(params.get('quality')) ? params.get('quality') : 'better')),
  alCambiarCalidad: q => { params.set('quality', q); modo = q === 'matrix' ? 'matrix' : '3d'; actualizarURL({ quality: q }); aplicarModo(); return true; },
  alCambiarLocal: (venue, href) => {
    const u = new URL(href), c = CENTROS.find(x => (x.locales || []).includes(venue.id));
    if (u.pathname !== location.pathname || !c) return false;
    cargarCentro(c.id); return true;
  },
});

// Paneles que se mueven, se redimensionan y se cierran (ventanas.mjs).
montarVentanas($('#sc'), [
  { el: $('.ficha'), id: 'ficha', titulo: 'Centro' },
  { el: $('.pantallas'), id: 'pantallas', titulo: 'Pantallas' },
  { el: $('#reproductor'), id: 'reproductor', titulo: 'Reproducción' },
]);

try {
  CENTROS = (await json('centros.json')).centros;
  pintarCentros(); redimensionar(); requestAnimationFrame(bucle);
  await cargarCentro(centroDesdeURL(location.search, CENTROS).id);
} catch (e) {
  console.error(e); aviso(`No se pudo cargar el visor: ${e.message}`, true);
}
